from django.db import models
from django.conf import settings
from cloudinary.models import CloudinaryField

# Create your models here.
class Report(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    photo = CloudinaryField(max_length=600, verbose_name='image')
    description = models.TextField()
    location = models.CharField(max_length=255)
    date_submitted = models.DateField(auto_now_add=True)
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)


    class Meta:
        db_table = "Report"

    def __str__(self):
        return f"Report {self.id} by {self.user.username}"