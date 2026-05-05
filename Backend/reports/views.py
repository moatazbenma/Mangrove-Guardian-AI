from django.shortcuts import render
from rest_framework import viewsets, permissions
from .serializers import ReportSerializer
from .models import Report
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from django.http import HttpResponse
import openpyxl
import django_filters.rest_framework
from core.throttles import GeneralThrottle
from django.core.cache import cache
import logging


logger = logging.getLogger(__name__)

class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filterset_fields = ['location', 'date_submitted']
    throttle_classes = [GeneralThrottle]


    def get_queryset(self):
        user = self.request.user

        if user.role == "organization" and user.is_approved:
            queryset = Report.objects.all().order_by('-id')
            cache_key = "reports:all"
            logger.info("organisation")
        else:
            queryset = Report.objects.filter(user=self.request.user)
            cache_key = f"reports:user_{user.id}"
            logger.info("community")

        try:
            cache_ids = cache.get(cache_key)
            if cache_ids is not None:
                logger.info("worked")
                return queryset.filter(id__in=cache_ids)
            
            logger.info("Mess")
            
            ids = list(queryset.values_list('id', flat=True))
            cache.set(cache_key, ids, timeout=300)
        except:
            logger.exception("Reports cache unavailable; serving queryset directly")

        return queryset

    def perform_create(self, serializer):
        user = self.request.user

        if user.role != "community":
            raise PermissionDenied("Only community users can submit reports.")

        serializer.save(user=user)
        cache.delete("reports:all")
        logger.info("Invalidated reports cache")

    def perform_destroy(self, instance):
        user = self.request.user

        # Community users can only delete their own reports.
        if user.role == "community" and instance.user != user:
            raise PermissionDenied("You can only delete your own reports.")

        # Unapproved organizations are read-only.
        if user.role == "organization" and not user.is_approved:
            raise PermissionDenied("Your organization account is not approved yet.")

        instance.delete()


    ## Custom Export Action
    @action(detail=False, methods=['get']) ##I used  @action in Django REST Framework when i want a separate function that has its own API endpoint + detail = false because we won't use an id in that endpoint
    def export(self, request):

        if request.user.role != "organization" or not request.user.is_approved:
            raise PermissionDenied("Only approved organizations can export data.")
        
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Reports"

        ws.append(['ID', 'User', 'Location', 'Description', 'Date'])


        for report in Report.objects.all():
            ws.append([
                report.id,
                report.user.username,
                report.location,
                report.description,
                report.date_submitted.strftime("%Y-%m-%d %H:%M")
            ])

        response = HttpResponse(
             content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="reports.xlsx"'
        wb.save(response)
        return response