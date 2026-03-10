from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    cargo = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        db_table = "aplication_user"
        
    def __str__(self):
        return self.username
