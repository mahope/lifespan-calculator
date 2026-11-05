FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
RUN apk add --no-cache curl && npm install -g serve && npm cache clean --force
WORKDIR /app
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 3000
CMD ["serve", "dist", "-l", "3000"]
