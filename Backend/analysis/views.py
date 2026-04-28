from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import Analysis
from .serializers import AnalysisSerializer
from .tasks import analyze_report_image
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.core.cache import cache
from core.throttles import ImageAnalysisThrottle
from kombu.exceptions import OperationalError
from django.db import IntegrityError, transaction
from rest_framework.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

class AnalysisView(viewsets.ModelViewSet):
    serializer_class = AnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ImageAnalysisThrottle]

    @staticmethod
    def _invalidate_analysis_cache_for_user(user_id: int):
        cache.delete("analyses:all")
        cache.delete(f"analyses:user_{user_id}")

    def get_queryset(self):
        user = self.request.user

        # Build base queryset by role first.
        if user.role == "organization":
            queryset = Analysis.objects.all()
        else:
            queryset = Analysis.objects.filter(report__user=user)

        # Never cache detail lookups to avoid stale-ID 404s right after creation.
        if getattr(self, "action", None) == "retrieve":
            return queryset

        # Cache is optional and disabled if CACHE_DISABLE_REDIS is set
        if getattr(settings, 'CACHE_DISABLE_REDIS', False) or not getattr(settings, 'CACHING_ENABLED', True):
            return queryset

        # Cache is optional: if Redis URL/config is invalid, do not break API reads.
        cache_key = f"analyses:user_{user.id}" if user.role != "organization" else "analyses:all"
        try:
            cached_ids = cache.get(cache_key)
            if cached_ids is not None:
                return queryset.filter(id__in=cached_ids)

            ids = list(queryset.values_list('id', flat=True))
            cache.set(cache_key, ids, timeout=300)
        except Exception:
            logger.exception("Analysis cache unavailable; serving queryset directly")

        return queryset



    def perform_create(self, serializer):
        """
        Create analysis record and queue image analysis task.
        Analysis runs asynchronously in Celery worker.
        """
        report = serializer.validated_data['report']

        if report.user != self.request.user:
            raise PermissionDenied("You cannot analyze another user's report.")

        # Save analysis record first
        try:
            analysis = serializer.save()
        except IntegrityError:
            raise ValidationError({"report": ["Analysis already exists for this report."]})

        self._invalidate_analysis_cache_for_user(report.user_id)
        
        # Queue the task only after transaction commit so worker can always see the report.
        def _enqueue_after_commit():
            try:
                if getattr(settings, 'ANALYSIS_FORCE_SYNC', False):
                    analyze_report_image.apply(args=[report.id])
                else:
                    analyze_report_image.delay(report.id)
            except Exception:
                logger.exception("Failed to enqueue analysis task for report_id=%s", report.id)
                analysis.status = 'failed'
                analysis.result = 'Analysis queue unavailable. Please retry.'
                analysis.save(update_fields=['status', 'result', 'updated_at'])

        transaction.on_commit(_enqueue_after_commit)

    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        analysis = self.get_object()

        # Community users can only retry their own analysis
        if request.user.role == "community" and analysis.report.user != request.user:
            raise PermissionDenied("You cannot retry another user's analysis.")

        # Reset status and result before re-queueing
        analysis.status = 'pending'
        analysis.result = None
        analysis.save(update_fields=['status', 'result', 'updated_at'])
        self._invalidate_analysis_cache_for_user(analysis.report.user_id)

        try:
            if getattr(settings, 'ANALYSIS_FORCE_SYNC', False):
                analyze_report_image.apply(args=[analysis.report_id])
            else:
                analyze_report_image.delay(analysis.report_id)
        except Exception:
            logger.exception("Failed to re-enqueue analysis task for report_id=%s", analysis.report_id)
            analysis.status = 'failed'
            analysis.result = 'Analysis queue unavailable. Please retry.'
            analysis.save(update_fields=['status', 'result', 'updated_at'])
            serializer = self.get_serializer(analysis)
            return Response(serializer.data, status=status.HTTP_202_ACCEPTED)

        serializer = self.get_serializer(analysis)
        return Response(serializer.data, status=status.HTTP_202_ACCEPTED)