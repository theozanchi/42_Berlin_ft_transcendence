# Generated by Django 3.2.25 on 2024-06-11 15:43

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='GamePosition',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('player1_x', models.FloatField()),
                ('player1_y', models.FloatField()),
                ('player1_z', models.FloatField()),
                ('player1_ws_id', models.CharField(blank=True, max_length=100, null=True)),
                ('player2_x', models.FloatField()),
                ('player2_y', models.FloatField()),
                ('player2_z', models.FloatField()),
                ('player2_ws_id', models.CharField(blank=True, max_length=100, null=True)),
                ('ball_x', models.FloatField()),
                ('ball_y', models.FloatField()),
                ('ball_z', models.FloatField()),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
