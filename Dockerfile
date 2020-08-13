FROM node:10.13.0-alpine

ENV PORT=3000
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . ./
RUN npm run tsc && \
    npm run lessc && \
    npm run browserify -- main_ui.ts -o main_ui.js && \
    npm run browserify -- create_ui.ts -o create_ui.js && \
    npm run browserify -- share_ui.ts -o share_ui.js

CMD npm start
