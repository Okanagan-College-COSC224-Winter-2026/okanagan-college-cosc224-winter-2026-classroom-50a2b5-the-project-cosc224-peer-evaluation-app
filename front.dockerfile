FROM node:20-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV SHELL="/bin/bash"

WORKDIR /app

RUN npm i -g corepack@latest
RUN corepack enable pnpm

COPY frontend/package.json ./package.json
COPY frontend/tsconfig.json ./tsconfig.json
COPY frontend/tsconfig.app.json ./tsconfig.app.json
COPY frontend/tsconfig.node.json ./tsconfig.node.json
COPY frontend/vite.config.ts ./vite.config.ts
COPY frontend/index.html ./index.html

RUN pnpm setup
RUN pnpm install

EXPOSE 3000
CMD ["pnpm", "dev"]