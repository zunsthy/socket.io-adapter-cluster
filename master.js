const ClusterBroadcast = require('./lib/master');

module.exports = (token = 'socket.io-adapter-cluster') => ClusterBroadcast(token);
