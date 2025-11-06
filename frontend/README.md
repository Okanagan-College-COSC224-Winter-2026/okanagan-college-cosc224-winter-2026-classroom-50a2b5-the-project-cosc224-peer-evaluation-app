# Peer Evaluation App — Frontend

This package contains the React + TypeScript + Vite frontend for the Peer Evaluation App. Below are step‑by‑step instructions to run it for development and tips for containerizing the app for deployment.

## Prerequisites

- Node.js 20.x or newer (LTS recommended)
- npm
- Backend API running on <http://localhost:5000>

Note: The frontend’s dev server is configured to listen on port 3000 and host 0.0.0.0 with file‑watch polling (helpful for WSL/Docker).

## Install dependencies

Recommended (frontend-only, self-contained):

```bash
cd frontend
npm install
```

This keeps the frontend fully self-contained, which aligns with building and running it as an independent container.

Alternative (monorepo workspaces, optional):

```bash
npm install
```

You can still install from the repository root when working across packages in this monorepo, but it isn’t required for developing or containerizing the frontend by itself.

## Run the frontend for development

From the `frontend` directory:

```bash
npm run dev
```

Or from the repo root using a workspace filter:

```bash
npm -F frontend dev
```

Then open <http://localhost:3000> in your browser.

### What this expects from the backend

The frontend calls the API at `http://localhost:5000` by default. This is defined in `src/util/api.ts` as a constant `BASE_URL`. Make sure your backend is reachable at that address, or update the constant (see “Configuring the API URL” below).

## Useful scripts

From `frontend/package.json`:

- `npm run dev` — start Vite dev server with HMR
- `npm build` — type‑check and build production assets to `dist/`
- `npm preview` — preview the production build locally
- `npm lint` — run ESLint

## Configuration notes

- Dev server port/host: see `vite.config.ts`.
  - Port: 3000 (strict; the dev server will fail if the port is busy)
  - Host: 0.0.0.0 (accessible from containers/WSL)
  - File watch: polling enabled for reliable HMR in containers

- Configuring the API URL:
  - Currently set in `src/util/api.ts` as `const BASE_URL = 'http://localhost:5000'`.
  - For different environments, update this constant or refactor to read from a Vite env var (e.g., `import.meta.env.VITE_API_BASE_URL`).
  - Example refactor (optional):

    ```ts
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
    ```
    
    Then provide `VITE_API_BASE_URL` at build/run time.

## Run with Docker (development)

This repository includes a `docker-compose.yml` at the project root that starts MariaDB, the backend, and this frontend. The frontend container runs the Vite dev server and mounts your source for live reload.

From the project root:

```bash
docker compose up --build frontend backend mariadb
```

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:8081>
- Source code hot‑reload works via polling (see `vite.config.ts`).

If you prefer detached mode:

```bash
docker compose up -d --build frontend backend mariadb
```

To view logs for the frontend container:

```bash
docker compose logs -f frontend
```

## Building for production

Create an optimized static build:

```bash
pnpm build
```

This outputs static assets to `dist/` which can be served by any static web server (Nginx, Caddy, Apache, S3 + CloudFront, etc.). You can preview locally with:

```bash
pnpm preview
```

## Deploying the frontend in Docker (advice)

There are two common approaches:

1. Development container (already provided)

- The root `front.dockerfile` runs `pnpm dev` and mounts `frontend/src` and `frontend/public` via volumes from `docker-compose.yml`.
- Best for local development; not ideal for production.

1. Production image (recommended for deployment)

Use a multi‑stage Dockerfile to build static assets and serve them with Nginx (or another static server). Example:

```dockerfile
# Stage 1: Build
FROM node:20-slim AS build
WORKDIR /app
RUN npm i -g corepack@latest && corepack enable pnpm
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ ./
# Optional: provide API base URL at build time
# ARG VITE_API_BASE_URL
# ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN pnpm build

# Stage 2: Serve static files
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
docker build -f front.dockerfile -t peer-eval-frontend:prod .
docker run -p 8080:80 peer-eval-frontend:prod
```

Then open <http://localhost:8080>.

Environment configuration tip:

- If you refactor the app to read `VITE_API_BASE_URL`, you can inject it at build time with `--build-arg VITE_API_BASE_URL="https://api.example.com"`.
- If you must switch the API URL at runtime (without rebuilds), consider serving a small `/config.json` and fetching it before app mount, or using a lightweight entrypoint script to rewrite a config placeholder inside `dist/` on container start.

---

Troubleshooting:

- If port 3000 is in use, stop the other process or change the port in `vite.config.ts` and re‑run.
- In WSL/containers, HMR issues are often fixed by keeping `watch.usePolling = true` (already set).
- Ensure the backend CORS config allows requests from the frontend origin when deployed separately.
