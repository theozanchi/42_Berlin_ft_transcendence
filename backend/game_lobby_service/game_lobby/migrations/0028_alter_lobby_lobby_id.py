# Generated by Django 3.2.25 on 2024-06-04 10:59

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game_lobby', '0027_alter_lobby_lobby_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='lobby',
            name='lobby_id',
            field=models.CharField(default='00dbca45-d', editable=False, max_length=15, primary_key=True, serialize=False, unique=True),
        ),
    ]
