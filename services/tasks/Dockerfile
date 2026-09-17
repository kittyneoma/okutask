FROM node:20-alpine

WORKDIR /app

COPY shared/package*.json ./shared/
RUN cd shared && npm ci --omit=dev
COPY shared ./shared

COPY services/tasks/package*.json ./services/tasks/
RUN cd services/tasks && npm ci --omit=dev
COPY services/tasks ./services/tasks

WORKDIR /app/services/tasks
EXPOSE 3003
CMD ["node", "server.js"]