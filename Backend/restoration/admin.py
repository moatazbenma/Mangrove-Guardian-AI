from django.contrib import admin
from .models import RestorationEvent, RestorationProject

admin.site.register(RestorationEvent)
admin.site.register(RestorationProject)