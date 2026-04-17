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
import logging

logger = logging.getLogger(__name__)

class AnalysisView(viewsets.ModelViewSet):
    serializer_class = AnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ImageAnalysisThrottle]

    def get_queryset(self):
        user = self.request.user
        
        # Create cache key based on user role
        if user.role == "organization":
            cache_key = "analyses:all"
            cached_data = cache.get(cache_key)
            
            if cached_data is not None:
                return cached_data
            
            queryset = Analysis.objects.all()
            cache.set(cache_key, queryset, timeout=300)  # Cache for 5 minutes
            return queryset
        else:
            cache_key = f"analyses:user_{user.id}"
            cached_data = cache.get(cache_key)
            
            if cached_data is not None:
                return cached_data
            
            queryset = Analysis.objects.filter(report__user=user)
            cache.set(cache_key, queryset, timeout=300)  # Cache for 5 minutes
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
        analysis = serializer.save()
        
        # Queue the async image analysis task.
        # If Redis/Celery is unavailable, keep API stable and mark as failed
        # so the client can trigger retry later.
        try:
            analyze_report_image.delay(report.id)
        except OperationalError:
            logger.exception("Failed to enqueue analysis task for report_id=%s", report.id)
            analysis.status = 'failed'
            analysis.result = 'Analysis queue unavailable. Please retry.'
            analysis.save(update_fields=['status', 'result', 'updated_at'])

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

        analyze_report_image.delay(analysis.report_id)

        serializer = self.get_serializer(analysis)
        return Response(serializer.data, status=status.HTTP_202_ACCEPTED)