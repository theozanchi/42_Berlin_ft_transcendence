# Generated by Django 3.2.25 on 2024-07-11 11:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game_manager', '0002_alter_round_winner'),
    ]

    operations = [
        migrations.AlterField(
            model_name='player',
            name='alias',
            field=models.CharField(blank=True, max_length=25, null=True, unique=True),
        ),
    ]