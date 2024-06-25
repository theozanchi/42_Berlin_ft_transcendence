import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'user_mgt.settings')
application = get_wsgi_application()

from django.contrib.auth import get_user_model

User = get_user_model()

USR_ADMIN = os.environ.get('USR_ADMIN')
USR_EMAIL = os.environ.get('USR_EMAIL')
USR_PASSWORD = os.environ.get('USR_PASSWORD')

if not User.objects.filter(username=USR_ADMIN).exists():
	User.objects.create_superuser(USR_ADMIN, USR_EMAIL, USR_PASSWORD)
	print(f"--> Superuser '{USR_ADMIN}' was created.")
else:
    print(f"--> Superuser '{USR_ADMIN}' exists already - no new superuser created.")