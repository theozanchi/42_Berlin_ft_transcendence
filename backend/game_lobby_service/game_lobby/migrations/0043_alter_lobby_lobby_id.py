# Generated by Django 3.2.25 on 2024-06-05 11:53

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game_lobby', '0042_alter_lobby_lobby_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='lobby',
            name='lobby_id',
            field=models.CharField(default='32e929d9-1', editable=False, max_length=15, primary_key=True, serialize=False, unique=True),
        ),
    ]
