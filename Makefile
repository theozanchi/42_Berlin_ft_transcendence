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
				@docker-compose up --build -d
				@echo "$(PONG) The game is accessible at $(BLUE_UNDERLINE)https://localhost:8443$(RESET)"

down:
				@docker-compose down

restart:		down up

prune:
				docker system prune -af

auth:
				@docker-compose up --build -d nginx authentication

rebuild:
				docker compose down
				docker compose build --no-cache
				docker compose up -d


.PHONY:			all certs dir del_certs env up down restart prune auth rebuild
