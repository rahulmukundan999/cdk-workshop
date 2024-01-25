FROM node:18.14-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY . .

RUN ls

EXPOSE 3000

CMD ["node", "server/app.js"]