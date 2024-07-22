# Generated by Django 3.2.25 on 2024-07-17 20:58

from django.conf import settings
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import game_manager.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Game',
            fields=[
                ('game_id', models.CharField(default=game_manager.models.generate_game_id, editable=False, max_length=8, primary_key=True, serialize=False, unique=True)),
                ('mode', models.CharField(choices=[('local', 'local'), ('remote', 'Remote')], max_length=6)),
                ('start_date', models.DateTimeField(auto_now_add=True)),
                ('end_date', models.DateTimeField(blank=True, null=True)),
                ('mode_is_local', models.BooleanField(blank=True, null=True)),
                ('host', models.CharField(blank=True, max_length=255, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='Player',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('id42', models.IntegerField(null=True)),
                ('avatar', models.ImageField(blank=True, null=True, upload_to='avatars/')),
                ('oauth_id', models.CharField(blank=True, max_length=200, null=True)),
                ('picture_url', models.URLField(blank=True, null=True)),
                ('last_login', models.DateTimeField(auto_now=True)),
                ('last_activity', models.DateTimeField(auto_now=True)),
                ('access_token', models.CharField(blank=True, max_length=200, null=True)),
                ('alias', models.CharField(blank=True, max_length=25, null=True)),
                ('channel_name', models.CharField(blank=True, max_length=255, null=True)),
                ('friends', models.ManyToManyField(related_name='userprofiles', to=settings.AUTH_USER_MODEL)),
                ('game', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='players', to='game_manager.game')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Round',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('round_number', models.PositiveIntegerField(null=True)),
                ('status', models.CharField(choices=[('pending', 'pending'), ('started', 'started'), ('completed', 'completed')], default='pending', max_length=10)),
                ('player1_score', models.IntegerField(default=-1, validators=[django.core.validators.MinValueValidator(-1), django.core.validators.MaxValueValidator(5)])),
                ('player2_score', models.IntegerField(default=-1, validators=[django.core.validators.MinValueValidator(-1), django.core.validators.MaxValueValidator(5)])),
                ('game', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='rounds', to='game_manager.game')),
                ('player1', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='player1_rounds', to='game_manager.player')),
                ('player2', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='player2_rounds', to='game_manager.player')),
                ('winner', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='won_rounds', to='game_manager.player')),
            ],
        ),
        migrations.AddField(
            model_name='game',
            name='winner',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='won_games', to='game_manager.player'),
        ),
    ]
