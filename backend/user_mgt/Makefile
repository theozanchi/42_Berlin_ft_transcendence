up:
	docker compose up
build:
	docker compose build
down:
	docker compose down
downi:
	docker compose down -v

fclean: down downi

new: fclean build up

du: down up

dbu: down build up

bash: up
	docker exec -it user_mgt-web-1 bash