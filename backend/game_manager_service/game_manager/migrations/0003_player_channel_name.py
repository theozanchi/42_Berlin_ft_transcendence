# Generated by Django 3.2.25 on 2024-07-02 17:42

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game_manager', '0002_alter_game_mode'),
    ]

    operations = [
        migrations.AddField(
            model_name='player',
            name='channel_name',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
