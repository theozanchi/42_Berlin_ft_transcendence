# Generated by Django 3.2.25 on 2024-07-10 12:29

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game_manager', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='round',
            name='player1_score',
            field=models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(10)]),
        ),
        migrations.AlterField(
            model_name='round',
            name='player2_score',
            field=models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(10)]),
        ),
    ]
