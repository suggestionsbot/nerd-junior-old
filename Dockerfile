FROM nikolaik/python-nodejs:python3.9-nodejs14-alpine  AS base

# create working directory for bot
WORKDIR /opt/nerd-junior

### dependencies & builder
FROM base AS builder

# install make
RUN apk add g++ make

# install production dependencies
COPY package.json yarn.lock ./

RUN yarn install --production --pure-lockfile
RUN cp -RL node_modules /tmp/node_modules

# install all dependencies
RUN yarn install --pure-lockfile

### runner
FROM base

# copy runtime dependencies
COPY --from=builder /tmp/node_modules node_modules

# copy remaining files
COPY . .

CMD ["yarn", "start"]
