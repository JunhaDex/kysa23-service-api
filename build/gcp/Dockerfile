# build stage
FROM node:20-alpine as build-stage
WORKDIR /usr/src/app
RUN apk add --update --no-cache build-base python3
RUN npm install -g yarn --force
COPY . .
RUN yarn && yarn build

# deploiy stage
FROM node:20-alpine as deploy-stage
WORKDIR /usr/src/app
RUN apk add --update --no-cache build-base python3
RUN npm install -g yarn --force
COPY --from=build-stage /usr/src/app/dist /usr/src/app/dist
COPY --from=build-stage /usr/src/app/.env /usr/src/app/.env
COPY --from=build-stage /usr/src/app/secret /usr/src/app/secret
COPY --from=build-stage /usr/src/app/package.json /usr/src/app/package.json
RUN yarn install --production
CMD node dist/main.js
EXPOSE 3000
