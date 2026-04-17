from rest_framework import serializers
from .models import Report
from cloudinary.uploader import upload
from django.core.files.base import ContentFile
import cloudinary


class ReportSerializer(serializers.ModelSerializer):
    photo = serializers.SerializerMethodField()
    analysis = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = ['id', 'user', 'photo', 'description', 'location', 'date_submitted', 'lat', 'lng', 'analysis']
        read_only_fields = ["id", "date_submitted"]
    
    def get_user(self, obj):
        return obj.user.username
    
    def get_analysis(self, obj):
        if hasattr(obj, 'analysis'):
            from analysis.serializers import AnalysisSerializer
            return AnalysisSerializer(obj.analysis).data
        return None

    def create(self, validated_data):
        # Handle photo upload to Cloudinary
        photo = self.initial_data.get('photo')
        
        if photo and hasattr(photo, 'read'):
            # It's a file object, upload it to Cloudinary
            try:
                result = upload(
                    photo,
                    folder="reports",
                    resource_type="auto"
                )
                validated_data['photo'] = result.get('public_id')
            except Exception as e:
                raise serializers.ValidationError(f"Failed to upload photo: {str(e)}")
        
        return super().create(validated_data)

    def get_photo(self, obj):
        if obj.photo:
            photo_str = str(obj.photo)
            if not photo_str:
                return None
                
            # If it already has the full URL, return it
            if photo_str.startswith('http'):
                return photo_str
            
            # If it's a public_id, construct the URL
            if photo_str:
                from cloudinary.utils import cloudinary_url
                url, _ = cloudinary_url(photo_str)
                return url
        return None