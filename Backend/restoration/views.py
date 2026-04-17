from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import RestorationProject, RestorationEvent
from .serializers import RestorationProjectSerializer, RestorationEventSerializer
from rest_framework.exceptions import PermissionDenied
from core.throttles import GeneralThrottle

class RestorationProjectView(viewsets.ModelViewSet):
    serializer_class = RestorationProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [GeneralThrottle]

    def get_queryset(self):
        user = self.request.user
        if user.role == "organization":
            return RestorationProject.objects.all()
        return RestorationProject.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role != "organization":
            raise PermissionDenied("Only organizations can create projects.")
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"], permission_classes=[permissions.AllowAny], url_path="completed-public")
    def completed_public(self, request):
        queryset = RestorationProject.objects.filter(status="completed").order_by("-end_date", "-start_date")
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class RestorationEventView(viewsets.ModelViewSet):
    serializer_class = RestorationEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [GeneralThrottle]

    def get_queryset(self):
        user = self.request.user
        if user.role == "organization":
            return RestorationEvent.objects.all()
        return RestorationEvent.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role != "organization":
            raise PermissionDenied("Only organizations can add events.")
        serializer.save()
