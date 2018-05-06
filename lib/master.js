const cluster = require('cluster');
const debug = require('debug')('cluster-broadcast-master');

const TYPE = 'broadcast';

const match = (title, prefix) => title && title.startsWith(prefix);

class BroadcastCenter {
  constructor(token) {
    this.token = token;
    this.children = [];

    this.listenChildren();
  }

  listenChildren() {
    const newBorn = [];
    for (const id in cluster.workers) {
      newBorn.push(id);
      if (this.children.indexOf(id) === -1) {
        const worker = cluster.workers[id];
        worker.on('message',this.onChildMessage.bind(this, id));
      }
    }

    debug(`Listen workers: ${newBorn.join(',')}`);

    this.children = newBorn;
  }

  broadcast(from, msg) {
    debug(`Message from worker#${from}: ${JSON.stringify(msg)}`);

    this.children.forEach(id => {
      if (id === from) return;
      cluster.workers[id].send(msg);
    });
  }

  onChildMessage(id, msg) {
    if (!msg || msg.type !== TYPE) return;
    if (msg.token !== this.token) return;
    this.broadcast(id, msg);
  }
}

module.exports = (token) => {
  return new BroadcastCenter(token);
};

