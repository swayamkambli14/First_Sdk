.PHONY: dev db:migrate db:studio db:seed docker:up docker:down

dev:
	docker-compose up -d && npm run dev --workspace=apps/api

db\:migrate:
	npm run db:migrate --workspace=apps/api

db\:studio:
	npm run db:studio --workspace=apps/api

db\:seed:
	npm run db:seed --workspace=apps/api

docker\:up:
	docker-compose up -d

docker\:down:
	docker-compose down

docker\:reset:
	docker-compose down -v && docker-compose up -d
