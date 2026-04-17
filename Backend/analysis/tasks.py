from celery import shared_task
from openai import OpenAI, APIStatusError, APIConnectionError, APITimeoutError
from django.conf import settings
import json
import re
import logging
from typing import Any
from .models import Analysis
from reports.models import Report

logger = logging.getLogger(__name__)


def _retry_delay(retries):
    return min(900, 30 * (2 ** retries))


def _temporary_unavailable_message():
    return (
        "AI model is temporarily unavailable. We will retry automatically. "
        "If this persists, please try again in a few minutes."
    )


def _build_degraded_fallback(description: str, reason: str) -> dict[str, Any]:
    text = (description or "").lower()

    # Conservative heuristic fallback when provider is unavailable.
    if any(k in text for k in ["collapse", "severe", "broken", "major crack", "flood"]):
        health = 35.0
        risk = "high"
    elif any(k in text for k in ["crack", "erosion", "damage", "leak", "rust"]):
        health = 55.0
        risk = "medium"
    else:
        health = 70.0
        risk = "low"

    return {
        "health_score": health,
        "damage_detected": health < 70,
        "risk_level": risk,
        "result": (
            "Provisional estimate generated while AI service is temporarily unavailable. "
            "Use this as a temporary indicator and retry later for full AI analysis."
        ),
    }


def _is_capability_refusal(text: str) -> bool:
    if not text:
        return False

    lowered = text.lower()
    refusal_signals = [
        "i lack the capability",
        "cannot access external websites",
        "cannot analyze the infrastructure report",
        "cannot access the image",
        "please describe the image in detail",
    ]
    return any(signal in lowered for signal in refusal_signals)


def _extract_json_block(text: str) -> dict[str, Any] | None:
    if not text:
        return None

    # Try plain JSON object first.
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except Exception:
            pass

    # Try fenced JSON blocks.
    fenced = re.search(r'```json\s*(\{.*?\})\s*```', text, re.DOTALL | re.IGNORECASE)
    if fenced:
        try:
            return json.loads(fenced.group(1))
        except Exception:
            pass

    return None


def _normalize_analysis_data(data: dict[str, Any]) -> dict[str, Any]:
    health = data.get("health_score")
    damage = data.get("damage_detected")
    risk = data.get("risk_level")
    result = data.get("result")

    # health_score: coerce to float in [0, 100]
    try:
        health = float(health)
    except Exception:
        health = 0.0
    health = max(0.0, min(100.0, health))

    # damage_detected: coerce to bool
    if isinstance(damage, bool):
        pass
    elif isinstance(damage, str):
        damage = damage.strip().lower() in {"true", "yes", "1", "high", "damaged"}
    elif isinstance(damage, (int, float)):
        damage = bool(damage)
    else:
        damage = health < 70

    # risk_level: normalize enum
    risk = (str(risk).strip().lower() if risk is not None else "")
    if risk not in {"low", "medium", "high"}:
        if health >= 80:
            risk = "low"
        elif health >= 50:
            risk = "medium"
        else:
            risk = "high"

    # result: require meaningful fallback text
    if not isinstance(result, str) or not result.strip() or result.strip().lower() in {
        "none",
        "insufficient data",
        "insufficient data to assess.",
    }:
        result = "Assessment completed with limited confidence due to sparse model output."

    return {
        "health_score": health,
        "damage_detected": damage,
        "risk_level": risk,
        "result": result,
    }


def _build_messages(description: str, photo_url: str, use_multimodal: bool):
    base_text = (
        "Analyze this infrastructure report and return ONLY valid JSON with keys: "
        "health_score (0-100 number), damage_detected (boolean), risk_level (low|medium|high), result (short explanation).\n\n"
        f"Description:\n{description}\n"
    )

    # Send image as structured multimodal content only when model supports it.
    if use_multimodal and photo_url and photo_url != "No image provided":
        return [
            {
                "role": "system",
                "content": "You are an expert infrastructure damage inspector. Always return JSON only.",
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": base_text},
                    {"type": "image_url", "image_url": {"url": photo_url}},
                ],
            },
        ]

    return [
        {
            "role": "system",
            "content": "You are an expert infrastructure damage inspector. Always return JSON only.",
        },
        {
            "role": "user",
            "content": (
                base_text
                + (
                    f"Photo URL (text reference only): {photo_url}\n"
                    if photo_url and photo_url != "No image provided"
                    else "No photo available. Base assessment on description only."
                )
            ),
        },
    ]

@shared_task(bind=True, max_retries=8)
def analyze_report_image(self, report_id):
    """
    Async task to analyze a report image using AI.
    This runs in the background using Celery worker.
    Updates existing Analysis record with results.
    """
    try:
        # Get the report
        report = Report.objects.get(id=report_id)
        
        # Get or create analysis record (should exist from perform_create)
        analysis, created = Analysis.objects.get_or_create(report=report)
        
        # Mark as processing
        analysis.status = 'processing'
        analysis.save()
        
        # Initialize OpenAI client
        client = OpenAI(
            base_url="https://api.featherless.ai/v1",
            api_key=settings.FEATHERLESS_API_KEY
        )

        models = getattr(
            settings,
            "FEATHERLESS_MODELS",
            ["google/gemma-3-12b-it"],
        )
        multimodal_models = set(
            getattr(settings, "FEATHERLESS_MULTIMODAL_MODELS", ["google/gemma-3-12b-it"])
        )

        description = report.description
        photo_url = report.photo.url if report.photo else "No image provided"

        response = None
        last_error = None
        image_available = photo_url and photo_url != "No image provided"

        for model_name in models:
            use_multimodal = model_name in multimodal_models
            # If a report has an image, do not downgrade to non-multimodal models.
            if image_available and not use_multimodal:
                logger.info(f"Skipping non-multimodal fallback model for image analysis: {model_name}")
                continue
            messages = _build_messages(description, photo_url, use_multimodal=use_multimodal)
            try:
                response = client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                )
                break
            except APIStatusError as e:
                last_error = e
                # If one model is unavailable, try next model in fallback list.
                if e.status_code == 503:
                    logger.warning(f"Model {model_name} unavailable: {e}")
                    continue
                # If model does not support multimodal payload, try next model.
                if e.status_code == 400 and "not a multimodal model" in str(e).lower():
                    logger.warning(f"Model {model_name} rejected multimodal payload: {e}")
                    continue
                raise
            except (APIConnectionError, APITimeoutError) as e:
                last_error = e
                break

        if response is None:
            if image_available and all(m not in multimodal_models for m in models):
                raise Exception("No multimodal model is configured for image analysis.")

            if isinstance(last_error, APIStatusError) and last_error.status_code == 503:
                if self.request.retries < self.max_retries:
                    retry_in = _retry_delay(self.request.retries)
                    analysis.status = 'pending'
                    analysis.result = (
                        f"Model temporarily unavailable. Retrying in {retry_in} seconds "
                        f"({self.request.retries + 1}/{self.max_retries})."
                    )
                    analysis.save(update_fields=['status', 'result', 'updated_at'])
                    raise self.retry(exc=last_error, countdown=retry_in)
                raise Exception(_temporary_unavailable_message())

            if isinstance(last_error, (APIConnectionError, APITimeoutError)):
                if self.request.retries < self.max_retries:
                    retry_in = _retry_delay(self.request.retries)
                    analysis.status = 'pending'
                    analysis.result = (
                        f"Connection issue. Retrying in {retry_in} seconds "
                        f"({self.request.retries + 1}/{self.max_retries})."
                    )
                    analysis.save(update_fields=['status', 'result', 'updated_at'])
                    raise self.retry(exc=last_error, countdown=retry_in)
                raise Exception("Network timeout while contacting AI provider.")

            raise Exception("No AI model produced a response.")

        content = response.choices[0].message.content or ""

        data = _extract_json_block(content)
        if not data:
            if _is_capability_refusal(content):
                # Treat capability refusal as temporary provider issue instead of successful analysis.
                if self.request.retries < self.max_retries:
                    retry_in = _retry_delay(self.request.retries)
                    analysis.status = 'pending'
                    analysis.result = (
                        f"Provider returned a capability refusal. Retrying in {retry_in} seconds "
                        f"({self.request.retries + 1}/{self.max_retries})."
                    )
                    analysis.save(update_fields=['status', 'result', 'updated_at'])
                    raise self.retry(exc=Exception("capability_refusal"), countdown=retry_in)
                raise Exception("AI provider could not process the image. Please try again later.")

            logger.warning("AI returned non-JSON response; storing as failed analysis")
            raise Exception("AI returned an invalid response format.")

        data = _normalize_analysis_data(data)

        # Update existing analysis record with results
        analysis.health_score = data.get("health_score")
        analysis.damage_detected = data.get("damage_detected")
        analysis.risk_level = data.get("risk_level")
        analysis.result = data.get("result")
        analysis.status = 'complete'
        analysis.save()

        logger.info(f"Analysis {analysis.id} completed successfully")
        return {
            "status": "success",
            "analysis_id": analysis.id,
            "report_id": report_id
        }

    except Report.DoesNotExist:
        logger.error(f"Report {report_id} not found")
        return {
            "status": "error",
            "message": f"Report {report_id} not found"
        }
    except Exception as e:
        logger.error(f"Analysis failed for report {report_id}: {str(e)}")
        
        # Mark analysis as failed
        try:
            analysis = Analysis.objects.get(report_id=report_id)
            message = str(e)
            is_provider_outage = (
                "503" in message
                or "service_unavailable" in message
                or "temporarily unavailable" in message.lower()
            )

            if is_provider_outage and getattr(settings, "ANALYSIS_ALLOW_DEGRADED_FALLBACK", True):
                report = Report.objects.get(id=report_id)
                fallback = _build_degraded_fallback(report.description, _temporary_unavailable_message())
                analysis.health_score = fallback["health_score"]
                analysis.damage_detected = fallback["damage_detected"]
                analysis.risk_level = fallback["risk_level"]
                analysis.result = fallback["result"]
                analysis.status = 'complete'
                analysis.save()
                return {
                    "status": "success",
                    "analysis_id": analysis.id,
                    "report_id": report_id,
                    "degraded": True,
                }

            analysis.status = 'failed'
            if is_provider_outage:
                message = _temporary_unavailable_message()
            analysis.result = f"Analysis failed after retries: {message}"
            analysis.save()
        except Analysis.DoesNotExist:
            pass
        
        return {
            "status": "error",
            "message": str(e)
        }
