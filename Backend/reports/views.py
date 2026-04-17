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

class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filterset_fields = ['location', 'date_submitted']
    throttle_classes = [GeneralThrottle]


    def get_queryset(self):
        user = self.request.user

        if user.role == "organization" and user.is_approved:
            return Report.objects.all()

        return Report.objects.filter(user=self.request.user)
    

    def perform_create(self, serializer):
        user = self.request.user

        if user.role != "community":
            raise PermissionDenied("Only community users can submit reports.")

        serializer.save(user=user)

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