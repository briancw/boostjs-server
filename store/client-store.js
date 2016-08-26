var ajax = require('ajaxii');
var crypto = require('crypto');
var io = require('socket.io-client');

var Stream = require('./stream');


class Store
{
  constructor(config)
  {
    this.config = config;
    this.streams = config.streams;
    this.basePath = config.basePath ? config.basePath : 'datastore';
  }

  start(url, port)
  {
    this.url = url;
    this.port = port;
    this.socket = io.connect(this.url + ':' + this.port, {transports: ['websocket']});
    this.http = ajax;

    return this.init();
  }

  init()
  {
    var len = this.streams.length;

    for (var i = 0; i < len; i++) {
      this[this.streams[i]] = new Stream(this.streams[i], this);
    }

    return this;
  }
}

module.exports = Store;
