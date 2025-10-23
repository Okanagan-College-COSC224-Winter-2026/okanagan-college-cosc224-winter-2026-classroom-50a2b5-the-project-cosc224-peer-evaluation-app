FROM node:20-slim

# Postgres variables
ENV MYSQL_HOST=mariadb
ENV MYSQL_PORT=3306
ENV MYSQL_USER=root
ENV MYSQL_PASS=root
ENV MYSQL_DB=cosc471

WORKDIR /app

# Install and run PNPM
RUN npm i -g corepack@latest
RUN corepack enable pnpm

COPY backend/package.json ./package.json

RUN pnpm install

COPY backend/src ./src
COPY backend/tsconfig.json ./tsconfig.json

EXPOSE 8081

CMD ["pnpm", "start"]