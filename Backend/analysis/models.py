from django.db import models
from reports.models import Report
# Create your models here.



class Analysis(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('complete', 'Complete'),
        ('failed', 'Failed'),
    ]
    
    report = models.OneToOneField(Report, on_delete=models.CASCADE)
    health_score = models.FloatField(blank=True, null=True)
    damage_detected = models.BooleanField(blank=True, null=True)
    risk_level = models.CharField(max_length=50, blank=True, null=True)
    result = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Analysis"

    def __str__(self):
        return f"Analysis for Report {self.report.id} - Risk: {self.risk_level}"