include .env

# Certificates
DIR				:=	/tmp/certs/live/localhost
DAYS			:=	365
KEY_NAME		:=	privkey.pem
CERT_NAME		:=	fullchain.pem
SUBJ			:=	/C=DE/ST=Berlin/L=Berlin/O=42_Berlin/OU=Student/CN=$(USER)/emailAddress=$(MAIL)

# Colours
BLUE_UNDERLINE	:=	\033[4;34m
RESET			:=	\033[0m
PONG			:=	🏓

# Environment Variables
DB_CONTAINER=game_manager
DB_HOST=$(POSTGRES_HOST)
DB_PORT=$(POSTGRES_PORT)
DB_USER=$(POSTGRES_USER)
DB_NAME=$(POSTGRES_NAME)
URL := https://localhost:8443

# Targets

all:			certs env up

certs:			dir
				@if [ -z "$$(ls -A $(DIR))" ]; then \
					echo "Generating self-signed SSL certificates..."; \
					openssl req -x509 -nodes -days $(DAYS) -newkey rsa:2048 \
					-keyout $(DIR)/$(KEY_NAME) \
					-out $(DIR)/$(CERT_NAME) \
					-subj "$(SUBJ)"; \
				else \
					echo "Self-signed certificates are present."; \
				fi

dir:
				@mkdir -p $(DIR)

del_certs:
				@rm $(DIR) -r -f

env:
				@chmod +x ./scripts/env.sh
				@./scripts/env.sh

up:
				@docker-compose up --build -d --no-deps
				@echo "$(PONG) The game is accessible at $(BLUE_UNDERLINE)https://localhost:8443$(RESET)"

down:
				@docker-compose down

restart:		down up

auth:
				@docker-compose up --build -d nginx authentication

rebuild:
				docker compose down
				docker compose build --no-cache
				docker compose up -d
				google-chrome $(URL) &

crebuild:		clean-db rebuild

postgres:
				docker exec -it $(DB_CONTAINER) pgcli -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) -d $(DB_NAME)

prune:
				docker compose down
				docker container prune -f

clean-db:
				docker exec -it $(DB_CONTAINER) psql -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) -d $(DB_NAME) -c "DO \$$\$$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE'; END LOOP; END \$$\$$;"

.PHONY:			all certs dir del_certs env up down restart prune auth rebuild postgres prune crebuild
