FROM node:20-slim AS builder

WORKDIR /app

COPY . .

RUN npm install && npm install -g db-migrate db-migrate-pg nodemon
RUN apt-get update && apt-get install -y chromium && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

CMD ["npm", "run", "start:bot"]