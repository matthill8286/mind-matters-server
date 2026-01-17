FROM node:20-slim

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

# Expose the port the app runs on
EXPOSE 8787

# Use the production node environment
ENV NODE_ENV=production

CMD ["node", "server.js"]
