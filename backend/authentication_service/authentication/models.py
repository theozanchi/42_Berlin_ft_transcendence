from django.db import models # type: ignore

class User(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    userName = models.CharField(max_length=50, blank=False)
    email = models.EmailField()
