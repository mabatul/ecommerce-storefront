# Local development image. Runs `next dev` against a bind-mounted source tree
# so edits on the host hot-reload in the container.
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]
