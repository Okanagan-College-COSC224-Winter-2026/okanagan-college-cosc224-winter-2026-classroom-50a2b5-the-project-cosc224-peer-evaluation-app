# Peer Evaluation App — Frontend

This package contains the React + TypeScript + Vite frontend for the Peer Evaluation App. Below are step‑by‑step instructions to run it for development and tips for containerizing the app for deployment.

## Prerequisites

- Node.js 20.x or newer (LTS recommended)
- npm
- Flask backend running on <http://localhost:5000>

Note: The frontend's dev server is configured to listen on port 3000.

### Installing Node.js

#### Windows

Option 1 - Official Installer:

1. Download Node.js LTS from [nodejs.org](https://nodejs.org/)
2. Run the installer (includes npm)
3. Verify installation:

   ```powershell

   node --version
   npm --version
   ```

Option 2 - Using Chocolatey:

```powershell
choco install nodejs-lts
```

#### macOS

Option 1 - Official Installer:

1. Download Node.js LTS from [nodejs.org](https://nodejs.org/)
2. Run the `.pkg` installer
3. Verify installation:

   ```bash
   node --version
   npm --version
   ```

Option 2 - Homebrew (recommended):

```bash
brew install node
node --version
npm --version
```

#### Linux (Ubuntu/Debian)

Using NodeSource repository (recommended):

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

#### Linux (Fedora/RHEL)

```bash
sudo dnf install nodejs npm
node --version
npm --version
```

## Install dependencies

From the `frontend` directory:

```bash
cd frontend
npm install
```

This installs all required dependencies for the frontend application.

## Run the frontend for development

From the `frontend` directory:

```bash
npm run dev
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
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    ```

    Then provide `VITE_API_BASE_URL` at build/run time.

## Building for production

Create an optimized static build:

```bash
npm run build
```

This outputs static assets to `dist/` which can be served by any static web server (Nginx, Caddy, Apache, S3 + CloudFront, etc.). You can preview locally with:

```bash
npm run preview
```

## Troubleshooting

- **Port 3000 already in use**: Stop the other process or change the port in `vite.config.ts` and re‑run.
- **Cannot connect to backend**: Ensure the Flask backend is running on port 5000 (see [flask_backend/README.md](../flask_backend/README.md)).
- **CORS errors**: Ensure the backend CORS config allows requests from `http://localhost:3000`.
