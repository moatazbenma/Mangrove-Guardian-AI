from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnalysisView

router = DefaultRouter()
router.register(r'analysis', AnalysisView, basename='analysis')



urlpatterns = [
    path('', include(router.urls))
]
