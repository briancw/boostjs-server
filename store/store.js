const redis = require('redis');

class Store
{

  constructor(config)
  {
    this.adapters = config.adapters;
    this.config = config;
    this.cacheConf = config.cache || {};
  }

  start(io, server)
  {
    this.io = io.sockets;
    this.initCache();

    return this.init();
  }

  initCache()
  {
    var host = this.cacheConf.host || '127.0.0.1';
    var port = this.cacheConf.port || 6379;

    this.cache = redis.createClient({host: host, port: port});
  }

  init()
  {
    for (let item in this.adapters) {
      let adapter = this.adapters[item];
      adapter.name = adapter.name || item;
      adapter.key = adapter.key || item;
      adapter.historyLimit = adapter.historyLimit - 1 || 9;
      adapter.query = adapter.query || null;
      adapter.start(this);
    }
  }
}

module.exports = Store;
