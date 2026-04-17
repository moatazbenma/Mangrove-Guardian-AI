from rest_framework import serializers
from .models import RestorationProject, RestorationEvent

class RestorationEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestorationEvent
        fields = ['id', 'project', 'trees_planted', 'description', 'date']

class RestorationProjectSerializer(serializers.ModelSerializer):
    # Nested events so you can see them inside the project response
    events = RestorationEventSerializer(many=True, read_only=True)
    created_by = serializers.SerializerMethodField()

    class Meta:
        model = RestorationProject
        fields = [
            'id', 'name', 'description', 'location',
            'lat', 'lng', 'start_date', 'end_date',
            'status', 'created_by', 'events'
        ]
        read_only_fields = ['created_by']

    def get_created_by(self, obj):
        # Return full name if available, otherwise username
        if obj.created_by.first_name and obj.created_by.last_name:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}"
        return obj.created_by.username
