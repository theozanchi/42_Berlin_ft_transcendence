# Generated by Django 3.2.25 on 2024-07-16 14:42

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game_manager', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='game',
            name='end_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='game',
            name='mode_is_local',
            field=models.BooleanField(blank=True, null=True),
        ),
    ]
