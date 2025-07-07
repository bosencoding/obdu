FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .
ENV CI=false
RUN npm run build-docker

FROM node:18-alpine AS runner

WORKDIR /app


COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

RUN npm install --production

EXPOSE 3000

CMD ["npm", "start"]


