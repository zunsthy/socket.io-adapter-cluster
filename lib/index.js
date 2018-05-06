const debug = require('debug')('cluster-broadcast-client');

const TYPE = 'broadcast';

const match = (title, prefix) => title && title.startsWith(prefix);

class Broadcast {
  constructor(token) {
    this.token = token;
    this.channels = [];
    this.pchannels = [];
    this.listeners = {
      message: [],
      pmessage: [],
    };

    this.pickMessage();
  }

  pickMessage() {
    process.on('message', (msg) => {
      if (!msg || msg.type !== TYPE) return;
      if (msg.token !== this.token) return;
      this.trigger(msg.channel, msg.message);
    });
  }

  sendMessage(channel, message) {
    debug(`send to "${channel}" message: ${message}`);

    process.send({
      type: TYPE,
      token: this.token,
      channel,
      message,
    });
  }

  trigger(channel, message) {
    debug(`receive from "${channel}" message: ${message}`);

    this.pchannels.forEach(ch => {
      if (match(channel, ch.slice(0, -1))) {
        this.listeners.pmessage.forEach(listener => {
          process.nextTick(() => listener.call(this, channel, message));
        });
      }
    });
    this.channels.forEach(ch => {
      if (ch === channel) {
        this.listeners.message.forEach(listener => {
          process.nextTick(() => listener.call(this, channel, message));
        });
      }
    });
  }

  publish(ch, msg) {
    this.sendMessage(ch, msg);
  }

  subscribe(ch) {
    this.channels = this.channels.concat(ch);
  }

  psubscribe(ch) {
    const channels = [].concat(ch);
    if (channels.some(channel => !channel.endsWith('*'))) return;
    this.pchannels = this.pchannels.concat(ch);
  }

  unsubscribe(ch) {
    const chs = [].concat(ch);
    chs.forEach((channel) => {
      const index = this.channels.indexOf(channel);
      if (index === -1) return;
      this.channels.splice(index, 1);
    });
  }

  unpsubscribe(ch) {
    const chs = [].concat(ch);
    chs.forEach((channel) => {
      const index = this.pchannels.indexOf(channel);
      if (index === -1) return;
      this.pchannels.splice(index, 1);
    });
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    const index = this.listeners[event].indexOf(callback);
    if (index === -1) return;
    this.listeners[event].splice(index, 1);
  }
}

module.exports = (token) => {
  return new Broadcast(token);
};

