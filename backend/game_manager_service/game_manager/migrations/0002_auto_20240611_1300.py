# Generated by Django 3.2.25 on 2024-06-11 13:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game_manager', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='game',
            name='host_ws_id',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='player',
            name='ws_id',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name='player',
            name='guest_name',
            field=models.CharField(blank=True, max_length=25, null=True),
        ),
    ]
