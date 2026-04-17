from django.db import models
from django.conf import settings
# Create your models here.


class RestorationProject(models.Model):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    description = models.TextField()
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=[
        ("planned", "Planned"),
        ("ongoing", "Ongoing"),
        ("completed", "Completed")
    ], default="planned")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    class Meta:
        db_table = "Restoration Project"

    def __str__(self):
        return f"{self.name} by {self.created_by.username} at {self.location}"
    

class RestorationEvent(models.Model):
    project = models.ForeignKey(RestorationProject, on_delete=models.CASCADE, related_name="events")
    trees_planted = models.IntegerField()
    description = models.TextField()
    date = models.DateField()

    class Meta:
        db_table = "Restoration Event"

        
    def __str__(self):
        return f"Project {self.project} - {self.trees_planted} - {self.date}"
    