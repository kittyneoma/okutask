FROM node:20-alpine

WORKDIR /app

COPY shared/package*.json ./shared/
RUN cd shared && npm ci --omit=dev
COPY shared ./shared

COPY services/projects/package*.json ./services/projects/
RUN cd services/projects && npm ci --omit=dev
COPY services/projects ./services/projects
s
WORKDIR /app/services/projects
EXPOSE 3002
CMD ["node", "server.js"]