FROM node:18-alpine
WORKDIR /app
COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm install --production
RUN echo [] >> storedId.json
ENV NODE_ENV=production
ENV BOT_TOKEN=1234:abcd
ENV CHAT_ID=-100123456789
COPY . /app/
CMD ["node", "index.js"]