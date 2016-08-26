var crypto = require('crypto');
var differ = require('jsondiffpatch');
var slashes = require('slashes');

class Stream
{
  constructor(name, parent)
  {
    //sss///
    console.log('sss');
    this.name = name;
    this.store = parent;
    this.listeners = [];
  }

  start()
  {
    this.store.socket.on('connect', () => {

      this.store.socket.on(this.name + '_hash', hash => {
        console.log(hash);

        if (localStorage[this.name] === undefined) {
          return this.retrieve();
        }

        if (JSON.parse(localStorage[this.name]).id !== hash) {
          console.log(JSON.parse(localStorage[this.name]).id, hash);
          this.hash = JSON.parse(localStorage[this.name]).id;
          return this.patch();
        }

        console.log('cached');
        return this.send(localStorage[this.name]);
      });
    });
  }

  grab(cb)
  {
    this.listeners.push(cb);
  }

  send(data)
  {
    let listeners = this.listeners;
    data = JSON.parse(JSON.parse(data).data);

    if (listeners) {
      if (listeners.length > 1) {
        listeners.forEach(el => {
          el(data);
        });
      } else {
        listeners[0](data);
      }
    }
  }

  retrieve()
  {
    var _this = this;
    var cb = this.cb;

    this.store.http.get('/' + this.store.basePath + '/' + this.name).then(
      function (res) {
        var hash = crypto.createHash('md5').update(res).digest("hex");
        console.log('new');

        localStorage[_this.name] = JSON.stringify({
          id: hash,
          data: res
        });


        cb(JSON.parse(JSON.parse(localStorage[_this.name]).data));
        // cb(res);
      },
      function (err) {
        console.error(err);
      }
    );
  }

  patch()
  {
    var _this = this;
    var cb = this.cb;

    this.store.http.get('/' + this.store.basePath + '/' + this.name + '/patch/' + this.hash).then(
      function (res) {
        console.log(res);

        if (Array.isArray(res)) {
          console.log('patch');
          var res = differ.patch(JSON.parse(localStorage[_this.name]).data, res);
          console.log(res);
        } else {
          console.log('tried patch. need full.');
        }

        var hash = crypto.createHash('md5').update(res).digest("hex");

        localStorage[_this.name] = JSON.stringify({
          id: hash,
          data: res
        });

        cb(JSON.parse(JSON.parse(localStorage[_this.name]).data));
      },
      function (err) {
        console.log('patch');
        console.error(err);
      }
    );
  }

  call(action, props, cb)
  {
    let key = this.name + '.' + action;
    console.log('calling ' + action);
    props = props ? props : [];
    this.store.socket.emit(key, props, data => {
      cb(data);
    });

    // this.store.socket.on(key, data => {
    //   cb(data);
    // });
  }
}

module.exports = Stream;
