FROM node:21-slim

RUN apt update && apt install -y openssl procps

## Install dependencies on the machine
RUN npm install -g @nestjs/cli@10.0.0
RUN npm install -g pnpm@8.6.3

WORKDIR /home/node/app

USER node

CMD tail -f /dev/null