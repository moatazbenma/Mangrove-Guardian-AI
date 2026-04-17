from rest_framework import serializers
from .models import User
from django.contrib.auth.hashers import make_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import os


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        require_approval = os.getenv('REQUIRE_ORG_APPROVAL', 'True').lower() == 'true'
        is_org = validated_data['role'] == 'organization'
        
        user = User(
            email=validated_data['email'],
            username=validated_data['username'],
            role=validated_data['role'],
            is_approved=not (is_org and require_approval)  # Auto-approve orgs if REQUIRE_ORG_APPROVAL=False
            )
        user.set_password(validated_data['password'])
        user.save()
        return user
    
##add role, username, and is_approved in the token
class MyTokenSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token["username"] = user.username
        token["role"] = user.role
        token["is_approved"] = user.is_approved

        return token