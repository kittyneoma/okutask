FROM node:20-alpine

WORKDIR /app

COPY shared/package*.json ./shared/
RUN cd shared && npm ci --omit=dev
COPY shared ./shared

COPY services/auth/package*.json ./services/auth/
RUN cd services/auth && npm ci --omit=dev
COPY services/auth ./services/auth

WORKDIR /app/services/auth
EXPOSE 3001
CMD ["node", "server.js"]