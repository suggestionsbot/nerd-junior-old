FROM nikolaik/python-nodejs:python3.10-nodejs16-alpine  AS base

# create working directory for bot
WORKDIR /opt/nerd-junior

### dependencies & builder
FROM base AS builder

# install production dependencies
COPY package.json yarn.lock ./

# install make
RUN apk add g++ make

RUN yarn install --production --pure-lockfile
RUN cp -RL node_modules /tmp/node_modules

# install all dependencies
RUN yarn install --pure-lockfile

# Copy src and tsconfig.json
COPY src src
COPY tsconfig.json .

# Build
RUN yarn build:linux

### runner
FROM base

# copy runtime dependencies
COPY --from=builder /tmp/node_modules node_modules

# copy runtime distribution
COPY --from=builder /opt/nerd-junior/dist dist
COPY package.json .

CMD ["yarn", "start"]
