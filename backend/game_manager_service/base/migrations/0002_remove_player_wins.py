# Generated by Django 3.2.25 on 2024-05-30 07:20

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='player',
            name='wins',
        ),
    ]
