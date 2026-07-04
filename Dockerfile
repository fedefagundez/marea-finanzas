FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
COPY --from=frontend /app/frontend/dist/sistema-economia/browser ./public
RUN ls -la public/ && ls -la public/index.html
RUN npx prisma generate && npm run build

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
