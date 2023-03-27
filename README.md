# TMP TS BACKEND M

# deploy and install

```sh
cp .env.default .env
yarn
docker-compose up -d # for dev
yarn gen-grpc-types
yarn deploy
```

# run dev

```sh
yarn dev:server
```

# build

```sh
yarn build
# or
yarn build:server
```

# run prod

```sh
yarn prod:server
```
