# 471-project

## Requirements

* [Docker](https://www.docker.com/)
* [Docker Compose](https://docs.docker.com/compose/)

## Getting Started

1. Clone this repository
2. Run `docker-compose up --no-deps ==build` to start the containers
3. Frontend is available at [http://localhost:3000](http://localhost:3000)
4. API is available at [http://localhost:8081](http://localhost:8081)

The frontend hot-reloads when you make changes, but changes to the backend or database schema will require you to delete and rebuild the containers.

## Important notes

* Database schema is in `schema.sql`
* Tests are run with `jest`, so `cd backend && pnpm test`