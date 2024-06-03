# Generated by Django 3.2.25 on 2024-06-03 09:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game_lobby', '0021_alter_lobby_lobby_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='lobby',
            name='host',
            field=models.CharField(max_length=25),
        ),
        migrations.AlterField(
            model_name='lobby',
            name='lobby_id',
            field=models.CharField(default='d9c300a1-cc4c-4', editable=False, max_length=15, primary_key=True, serialize=False, unique=True),
        ),
    ]
