FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY dist/ ./dist/

ENV PORT=3000
ENV HOST=0.0.0.0
ENV DB_PATH=/app/data/clawver.db

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "dist/index.js"]
