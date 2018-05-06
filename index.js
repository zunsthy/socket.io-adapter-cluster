const cluster = require('cluster');
const Adapter = require('socket.io-adapter');

const debug = require('debug')('socket.io-adapter-cluster');

const ClusterBroadcast = require('./lib');

const match = (channel, prefix) => channel && channel.startsWith(prefix);

module.exports = ({
  prefix = 'socket.io',
  client = ClusterBroadcast('socket.io-adapter-cluster'),
} = {}) => {
const nodeid = cluster.isMaster ? 'master' : cluster.worker.id;

class ClusterAdapter extends Adapter {
  constructor(nsp) {
    super(nsp);

    this.id = nodeid;
    this.client = client;
    this.channel = prefix + '#' + nsp.name + '#';

    client.psubscribe(this.channel + '*');

    client.on('pmessage', this.onmessage.bind(this));
  }

  onmessage(channel, msg) {
    if (!match(channel, this.channel)) {
      debug('channel not match');
      return;
    }

    const room = channel.slice(this.channel.length, -1);
    if (!room && !this.rooms.hasOwnProperty(room)) {
      debug('unknown room %s', room);
      return;
    }

    const id = msg.shift();
    if (id === this.id) {
      debug('self message');
      return;
    }

    const packet = msg[0];
    if (packet && !packet.nsp) packet.nsp = '/'
    if (!packet || packet.nsp != this.nsp.name) {
      debug('namespace not match');
      return;
    }

    this.broadcast.apply(this, msg.concat(true));
  }

  broadcast(packet, opts, remote) {
    packet.nsp = this.nsp.name;
    const isLocal = opts && opts.flags && opts.flags.local;
    if (!remote && !isLocal) {
      const msg = [this.id, packet, opts];
      const channel = this.channel + (
        (opts.rooms && opts.rooms.length === 1)
          ? opts.rooms[0] + '#'
          : ''
      );

      debug('publish message to %s', channel);

      this.client.publish(channel, msg);
    }

    super.broadcast(packet, opts);
  }
}

return ClusterAdapter;
};

