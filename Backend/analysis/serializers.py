from rest_framework import serializers
from .models import Analysis




class AnalysisSerializer(serializers.ModelSerializer):
    def validate_report(self, report):
        if Analysis.objects.filter(report=report).exists():
            raise serializers.ValidationError("Analysis already exists for this report.")
        return report

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
        read_only_fields = ['id', 'created_at', 'updates_at']
        