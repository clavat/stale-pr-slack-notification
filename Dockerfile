FROM node:14.18-alpine

# COPY ./entrypoint.sh /entrypoint.sh

WORKDIR /app

COPY ./package.json ./package.json

COPY ./package-lock.json ./package-lock.json

RUN npm i --production

COPY index.js ./index.js

COPY ./services/*.js ./services/

ENTRYPOINT ["sh", "-c", "cd /app && npm start"]