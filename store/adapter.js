const crypto = require('crypto');
const differ = require('jsondiffpatch');


class Adapter
{
  constructor(config)
  {
    this.name = config.name;
    this.key = config.key || this.name;
    this.historyLimit = config.historyLimit || 10;
    this.query = config.query;
  }

  start(store)
  {
    this.store = store;
    this.watch();
    this.connect();
  }

  send()
  {
    this.data().then(data => {
      this.hash(JSON.stringify(data));
    }).catch(err => {throw err});
  }

  connect()
  {
    this.globalSocket = this.store.io.of(this.name);

    this.globalSocket.on('connection', socket => {
      console.log('new connection to ' + this.name);
      // socket.join(socket.id);
      this.socket = socket;
      this.initEndPoints();
      this.send();

      if (this.init) {
        this.init();
      }
    });
  }

  hash(data, global)
  {    
    let hash = crypto.createHash('md5').update(data).digest("hex");
    let socket = global ? this.globalSocket : this.socket;

    this.newHash = hash;

    socket.emit('hash', hash);
  }

  initEndPoints()
  {
    let path = this.name;

    this.socket.on('full', (prop, cb) => {
      this.full(cb);
    });

    this.socket.on('patch', (hash, cb) => {
      console.log(hash);

      this.inHistory(hash).then(match => {
          if (match) {
          this.match = match;
          this.patch(hash, cb);
        } else {
          console.log('we did not make it to the patch');
          this.full(cb);
        }
      }).catch(err => console.log(err));
    });
  }

  incoming()
  {
    this.data().then(data => {

      if (this.changed(data)) {
        return this.storeVersion(data, true);
      }
    }).catch(err => {throw err});
  }

  storeVersion(data, emitHash)
  {
    data = JSON.stringify(data);
    var hash = crypto.createHash('md5').update(data).digest("hex");
    this.currentHash = hash;

    var version = {
      id: hash,
      data: data
    }

    this.store.cache.lpush(this.key, JSON.stringify(version));
    this.store.cache.ltrim(this.key, [0, this.historyLimit]);

    if (emitHash) {
      this.hash(data, true);
    }
  }

  inHistory(hash)
  {
    return new Promise((resolve, reject) => {
      this.store.cache.lrange(this.key, [0, this.historyLimit], (err, data) => {
        if (err) return reject(err);

        var len = data.length;

        for (var i = 0; i < len; i++) {
          var version = JSON.parse(data[i]);

          if (version.id == hash) {
            return resolve(version.data);
          }
        }

        return resolve(false);
      });
    });
  }

  patch(oldHash, cb)
  {
    console.log('made it to the patch');
    let key = oldHash + this.newHash;

    this.deltaInHistory(key).then(data => {

      if (!data) {
        this.data().then(data => {

          let diff = differ.create({
            textDiff: {
              minLength: 2
            }
          });

          let delta = diff.diff(this.match, JSON.stringify(data));

          let deltaVersion = {
            id: key,
            data: delta
          }

          this.store.cache.lpush(this.key + '_deltas', JSON.stringify(deltaVersion));

          cb(delta);
        }).catch(err => {throw err});
      } else {
        console.log('CACHED COPY OF DELTA');
        cb(data);
      }
    });
  }

  deltaInHistory(key)
  {
    return new Promise((resolve, reject) => {
      this.store.cache.lrange(this.key + '_deltas', [0, this.historyLimit], (err, data) => {
        if (err) throw err;

        data.forEach(el => {
          el = JSON.parse(el);

          if (el.id == key) {
            return resolve(el.data);
          }
        });

        return resolve(false);
      });
    });
  }

  full(cb)
  {
    console.time('cached');
    this.getCurrent().then(data => {
      if (!data) {
        console.log('working with a brand new copy from the source');

        console.time('new')
        this.data().then(data => {
          console.timeEnd('new');
          this.storeVersion(data);

          cb(JSON.stringify(data));
        }).catch(err => {throw err});

      } else {
        console.log('working with a cached copy');
        console.timeEnd('cached');
        cb(data);
      }
    });
  }

  getCurrent()
  {
    return new Promise((resolve, reject) => {
      this.store.cache.lrange(this.key, [0, 0], (err, data) => {
        if (err) throw err;

        if (data.length == false) {
          return resolve(false);
        }

        return resolve(JSON.parse(data[0]).data);
      });
    });
  }

  changed(data)
  {
    var hash = crypto.createHash('md5').update(JSON.stringify(data)).digest("hex");

    console.log(hash, this.currentHash);

    if (hash == this.currentHash) {
      return false;
    }

    return true;
  }
}

module.exports = Adapter;
