from rest_framework import serializers
from .models import Analysis




class AnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Analysis
        fields = [
            'id',
            'report',
            'health_score',
            'damage_detected',
            'risk_level',
            'result',
            'status',
            'created_at',
            'updated_at',
        ]
