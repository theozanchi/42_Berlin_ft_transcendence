# Generated by Django 3.2.25 on 2024-05-30 07:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0002_remove_player_wins'),
    ]

    operations = [
        migrations.AlterField(
            model_name='player',
            name='alias',
            field=models.CharField(max_length=25),
        ),
    ]
