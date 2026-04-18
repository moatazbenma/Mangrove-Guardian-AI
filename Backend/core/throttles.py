"""
Custom throttle classes for rate limiting API endpoints.

Three-tier throttling strategy:
- AuthThrottle: 5 requests/minute for login/register (brute force protection)
- ImageAnalysisThrottle: 20 requests/day for AI image analysis (resource protection)
- GeneralThrottle: 100 requests/hour for other endpoints (API abuse prevention)
"""

from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class FailOpenThrottleMixin:
    """
    Keep API available if cache/throttle backend is temporarily unavailable.

    If Redis auth/network fails, DRF throttle lookups can raise exceptions and
    return 500. In that case, fail open and allow the request.
    """

    def allow_request(self, request, view):
        try:
            return super().allow_request(request, view)
        except Exception:
            return True


class AuthThrottle(FailOpenThrottleMixin, UserRateThrottle):
    """
    Throttle for authentication endpoints (login, register, password reset).
    
    Prevents brute force attacks by limiting to 5 attempts per minute.
    Applies per user for authenticated requests, per IP for anonymous.
    """
    scope = 'auth'
    rate = '5/min'


class ImageAnalysisThrottle(FailOpenThrottleMixin, UserRateThrottle):
    """
    Throttle for expensive image analysis operations.
    
    Limits AI model inference calls to 20 per day per user.
    Protects against resource exhaustion and uncontrolled API costs.
    """
    scope = 'image_analysis'
    rate = '20/day'


class GeneralThrottle(FailOpenThrottleMixin, UserRateThrottle):
    """
    Throttle for general API operations (read, write, delete).
    
    Limits to 100 requests per hour per user.
    Prevents data scraping and API abuse while allowing normal usage.
    """
    scope = 'general'
    rate = '100/hour'


class AnonThrottle(FailOpenThrottleMixin, AnonRateThrottle):
    """
    Throttle for anonymous (unauthenticated) users.
    
    Limits to 50 requests per hour for public endpoints.
    """
    scope = 'anon'
    rate = '50/hour'
