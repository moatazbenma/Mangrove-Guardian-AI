from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import RestorationProject, RestorationEvent
from .serializers import RestorationProjectSerializer, RestorationEventSerializer
from rest_framework.exceptions import PermissionDenied
from core.throttles import GeneralThrottle
from django.core.cache import cache
import logging


logger = logging.getLogger(__name__)


class RestorationProjectView(viewsets.ModelViewSet):
    serializer_class = RestorationProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [GeneralThrottle]

    def get_queryset(self):
        user = self.request.user
        if user.role == "organization":
            queryset = RestorationProject.objects.all()
            cache_key = "restoration:projects:all"
        else:
            return RestorationProject.objects.none()

        try:
            cache_ids = cache.get(cache_key)
            if cache_ids is not None:
                logger.info(f"✅ Cache HIT: {cache_key}")
                return queryset.filter(id__in=cache_ids)
            
            logger.info(f"📦 Cache MISS: {cache_key}")
            ids = list(queryset.values_list("id", flat=True))
            cache.set(cache_key, ids, timeout=300)
            logger.info(f"💾 Cached: {cache_key}")
        except:
            logger.exception("Restoration projects cache unavailable")

        return queryset

    def perform_create(self, serializer):
        if self.request.user.role != "organization":
            raise PermissionDenied("Only organizations can create projects.")
        serializer.save(created_by=self.request.user)
        cache.delete("restoration:projects:all")
        logger.info("Invalidated restoration projects cache")

    @action(detail=False, methods=["get"], permission_classes=[permissions.AllowAny], url_path="completed-public")
    def completed_public(self, request):
        cache_key = "restoration:projects:completed_public"
        
        try:
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                logger.info(f"✅ Cache HIT: {cache_key}")
                return Response(cached_data)
        except:
            logger.exception("Restoration projects cache unavailable")

        queryset = RestorationProject.objects.filter(status="completed").order_by("-end_date", "-start_date")
        serializer = self.get_serializer(queryset, many=True)
        
        try:
            cache.set(cache_key, serializer.data, timeout=600)
            logger.info(f"💾 Cached: {cache_key}")
        except:
            logger.exception("Failed to cache completed projects")
        
        return Response(serializer.data)

class RestorationEventView(viewsets.ModelViewSet):
    serializer_class = RestorationEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [GeneralThrottle]

    def get_queryset(self):
        user = self.request.user

        if user.role == "organization":
            queryset = RestorationEvent.objects.all()
            cache_key = "restoration:events:all"
        else:
            return RestorationEvent.objects.none()

        try:
            cache_ids = cache.get(cache_key)
            if cache_ids is not None:
                logger.info(f"✅ Cache HIT: {cache_key}")
                return queryset.filter(id__in=cache_ids)
            
            logger.info(f"📦 Cache MISS: {cache_key}")
            ids = list(queryset.values_list("id", flat=True))
            cache.set(cache_key, ids, timeout=300)
            logger.info(f"💾 Cached: {cache_key}")
        except:
            logger.exception("Restoration events cache unavailable")

        return queryset

    def perform_create(self, serializer):
        if self.request.user.role != "organization":
            raise PermissionDenied("Only organizations can add events.")
        serializer.save()
        cache.delete("restoration:events:all")
        logger.info("Invalidated restoration events cache")
