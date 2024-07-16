# Generated by Django 3.2.25 on 2024-07-16 13:21

import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import game_manager.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Game',
            fields=[
                ('game_id', models.CharField(default=game_manager.models.generate_game_id, editable=False, max_length=8, primary_key=True, serialize=False, unique=True)),
                ('mode', models.CharField(choices=[('local', 'local'), ('remote', 'Remote')], max_length=6)),
                ('host', models.CharField(blank=True, max_length=255, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='Player',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('alias', models.CharField(blank=True, max_length=25, null=True)),
                ('channel_name', models.CharField(blank=True, max_length=255, null=True)),
                ('game', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='players', to='game_manager.game')),
            ],
        ),
        migrations.CreateModel(
            name='Round',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('round_number', models.PositiveIntegerField(null=True)),
                ('player1_score', models.PositiveIntegerField(default=0, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(10)])),
                ('player2_score', models.PositiveIntegerField(default=0, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(10)])),
                ('game', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='rounds', to='game_manager.game')),
                ('player1', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='player1_rounds', to='game_manager.player')),
                ('player2', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='player2_rounds', to='game_manager.player')),
                ('winner', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='won_rounds', to='game_manager.player')),
            ],
        ),
        migrations.AddField(
            model_name='game',
            name='winner',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='won_games', to='game_manager.player'),
        ),
    ]
