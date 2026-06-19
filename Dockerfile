FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache bash

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

RUN sed -i 's/\r$//' docker/entrypoint.sh && chmod +x docker/entrypoint.sh
RUN mkdir -p uploads/products

EXPOSE 3456

ENTRYPOINT ["docker/entrypoint.sh"]
