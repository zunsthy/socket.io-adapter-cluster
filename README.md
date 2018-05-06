# socket.io-adapter-cluster

## How to use

worker.js

``` js
const io = require('socket.io')(3000);
const clusterAdapter = require('socket.io-adapter-cluster');

io.adapter(clusterAdapter());
```

master.js

``` js
const cluster = require('cluster');
const clusterAdapter = require('socket.io-adapter-cluster/master');

cluster.setupMaster({
  exec: 'worker.js',
});
cluster.fork();

clusterAdapter();
```

## API

### Adapter([opts])

The following `opts` are allowed:

* `key`: the name of broadcast prefix, default(`socket.io`)
* `client`: the client of broadcast

## Protocal

The `socket.io-adapter-cluster` adapter broadcast with prefix:

```
prefix#namespace#
```

If broadcasting to a single room:

```
prefix#namespace#room#
```

# Note

The `socket.io-adapter-cluster` is a simple and cluster-version of [`socket.io-redis`](https://github.com/socketio/socket.io-redis).

# LICENSE

MPL-2.0