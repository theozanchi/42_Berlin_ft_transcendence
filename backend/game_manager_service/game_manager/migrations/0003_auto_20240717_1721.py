# Generated by Django 3.2.25 on 2024-07-17 15:21

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('game_manager', '0002_auto_20240716_1642'),
    ]

    operations = [
        migrations.CreateModel(
            name='Tournament',
            fields=[
                ('game_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='game_manager.game')),
            ],
            bases=('game_manager.game',),
        ),
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('player_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='game_manager.player')),
            ],
            bases=('game_manager.player',),
        ),
        migrations.AlterField(
            model_name='player',
            name='friends',
            field=models.ManyToManyField(related_name='players', to=settings.AUTH_USER_MODEL),
        ),
        migrations.CreateModel(
            name='Participation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('score', models.IntegerField()),
                ('rank', models.IntegerField()),
                ('tournament', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='game_manager.game')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name='game',
            name='participants',
            field=models.ManyToManyField(related_name='tournaments', through='game_manager.Participation', to=settings.AUTH_USER_MODEL),
        ),
    ]
