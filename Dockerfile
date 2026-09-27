FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
# The runtime uses Vite's preview server, so keep the Vite binary available.
RUN npm ci
COPY --from=build /app/dist ./dist
EXPOSE 8080
CMD ["npm", "start"]