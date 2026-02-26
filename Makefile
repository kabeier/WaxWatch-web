dev:
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

format:
	npm run format

typecheck:
	npm run typecheck

test:
	npm run test:run

e2e:
	npm run e2e:ci

check: format lint typecheck test build e2e

docker-dev:
	docker compose up --build

docker-prod:
	docker compose -f docker-compose.yml up --build

docker-down:
	docker compose down

docker-e2e:
	docker compose -f docker-compose.e2e.yml run --rm e2e

ci:
	npm ci
	npm run typecheck
	npm run lint
	npm run test:run
	npm run build
