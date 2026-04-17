from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings


class User(AbstractUser):
    ROLE_CHOICES = [
        ('community', 'Community'),
        ('organization', 'Organization'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    is_approved = models.BooleanField(default=True, help_text="Organization users must be approved by admin")


    class Meta:
        db_table = "User"

    def __str__(self):
        return f"{self.username} ({self.role})"
    

