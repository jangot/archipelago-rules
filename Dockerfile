ARG AWS_ACCOUNT_ID
FROM ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/node:22-alpine

ARG NODE_ENV
ARG APP_NAME

ENV NODE_ENV=$NODE_ENV

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN mkdir -p ./dist
COPY ./dist/apps/$APP_NAME ./dist
COPY ./libs ./libs

EXPOSE 3000

# Launch application
CMD ["node", "dist/main.js"]
