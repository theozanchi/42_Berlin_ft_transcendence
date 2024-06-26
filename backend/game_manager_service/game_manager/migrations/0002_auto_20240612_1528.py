# Generated by Django 3.2.25 on 2024-06-12 15:28

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('game_manager', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='player',
            name='guest_name',
        ),
        migrations.RemoveField(
            model_name='player',
            name='user',
        ),
        migrations.AddField(
            model_name='game',
            name='host_channel_name',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='player',
            name='alias',
            field=models.CharField(blank=True, max_length=25, null=True),
        ),
        migrations.AlterField(
            model_name='round',
            name='player1',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='player1_rounds', to='game_manager.player'),
        ),
        migrations.AlterField(
            model_name='round',
            name='player2',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='player2_rounds', to='game_manager.player'),
        ),
    ]
