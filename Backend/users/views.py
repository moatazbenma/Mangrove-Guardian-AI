from django.shortcuts import render
from rest_framework import generics
from .serializers import UserSerializer, MyTokenSerializer
from .models import User
from rest_framework_simplejwt.views import TokenObtainPairView
from core.throttles import AuthThrottle
# Create your views here.






class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    throttle_classes = [AuthThrottle]



class MyTokenView(TokenObtainPairView):
    serializer_class = MyTokenSerializer
    throttle_classes = [AuthThrottle]