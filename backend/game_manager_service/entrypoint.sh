#!/bin/sh

export DJANGO_SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(50))')

python manage.py makemigrations
python manage.py migrate

# Start the Gunicorn server
echo "Starting Gunicorn"
exec gunicorn --workers 3 --bind 0.0.0.0 game_manager_service.wsgi:application

DROP TABLE IF EXISTS "django_migrations" CASCADE;            
  DROP TABLE IF EXISTS "django_content_type" CASCADE;          
  DROP TABLE IF EXISTS "auth_permission" CASCADE;              
  DROP TABLE IF EXISTS "auth_group" CASCADE;                   
  DROP TABLE IF EXISTS "auth_group_permissions" CASCADE;       
  DROP TABLE IF EXISTS "auth_user" CASCADE;                    
  DROP TABLE IF EXISTS "auth_user_groups" CASCADE;             
  DROP TABLE IF EXISTS "auth_user_user_permissions" CASCADE;   
  DROP TABLE IF EXISTS "django_admin_log" CASCADE;             
  DROP TABLE IF EXISTS "django_session" CASCADE;               
  DROP TABLE IF EXISTS "oauth42_round" CASCADE;                
  DROP TABLE IF EXISTS "oauth42_player_friends" CASCADE;       
  DROP TABLE IF EXISTS "oauth42_participation" CASCADE;


    DROP TABLE IF EXISTS "oauth42_player" CASCADE;               
  DROP TABLE IF EXISTS "oauth42_game" CASCADE;                 
  DROP TABLE IF EXISTS "oauth42_tournament" CASCADE;           
  DROP TABLE IF EXISTS "oauth42_userprofile" CASCADE;          
  DROP TABLE IF EXISTS "game_manager_player" CASCADE;          
  DROP TABLE IF EXISTS "game_manager_game" CASCADE;            
  DROP TABLE IF EXISTS "game_manager_player_friends" CASCADE;  