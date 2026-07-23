# Asto API — production container
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/api/package.json packages/api/

RUN npm ci --workspace=@asto/api --include-workspace-root

COPY packages/shared packages/shared
COPY packages/api packages/api

RUN npm run build --workspace=@asto/shared \
  && npm run build --workspace=@asto/api

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8788

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/packages/api ./packages/api

# JSON store — production'da volume veya Postgres'e geçin
RUN mkdir -p /app/packages/api/data

EXPOSE 8788
CMD ["npm", "run", "start", "--workspace=@asto/api"]
