from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RestorationEventView, RestorationProjectView

router = DefaultRouter()
router.register(r'projects', RestorationProjectView, basename='projects')
router.register(r'events', RestorationEventView, basename='events')



urlpatterns = [
    path('', include(router.urls))
]
