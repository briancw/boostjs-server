const crypto = require('crypto');
const differ = require('jsondiffpatch');

class Adapter {
    constructor(config) {
        this.config = config;
        this.name = config.name;
        this.key = config.key || this.name;
        this.query = config.query;
    }

    start(store) {
        this.store = store;
        this.initCache();
        this.watch();
        this.connect();
    }

    initCache() {
        let config = this.config;
        let opts = config.cacheOpts;
        opts.key = this.key;

        this.cache = Reflect.construct(config.cache, [opts]);
    }

    send() {
        this.data().then(data => {
            this.hash(JSON.stringify(data));
        }).catch(err => {
            throw err;
        });
    }

    connect() {
        this.globalSocket = this.store.io.of(this.name);

        this.globalSocket.on('connection', socket => {
            console.log('new connection to ' + this.name);
            this.socket = socket;
            this.initEndPoints();
            this.send();

            if (this.init) {
                this.init();
            }
        });
    }

    hash(data, global) {
        let hash = crypto.createHash('md5').update(data).digest("hex");
        let socket = global ? this.globalSocket : this.socket;

        this.newHash = hash;

        socket.emit('hash', hash);
    }

    initEndPoints() {
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

    incoming() {
        this.data().then(data => {
            if (this.changed(data)) {
                return this.storeVersion(data, true);
            }
        }).catch(err => {
            throw err;
        });
    }

    storeVersion(data, emitHash) {
        data = JSON.stringify(data);
        var hash = crypto.createHash('md5').update(data).digest("hex");
        this.currentHash = hash;

        var version = {
            id: hash,
            data: data,
        };

        this.cache.add(JSON.stringify(version));
        this.cache.cut();

        if (emitHash) {
            this.hash(data, true);
        }
    }

    inHistory(hash) {
        return this.cache.retrieve().then(data => {
            console.log(data);

            let ret = false;
            var len = data.length;

            for (var i = 0; i < len; i++) {
                var version = JSON.parse(data[i]);

                if (version.id === hash) {
                    ret = version.data;
                    break;
                }
            }

            return ret;
        });
    }

    patch(oldHash, cb) {
        console.log('made it to the patch');
        let key = oldHash + this.newHash;

        this.deltaInHistory(key).then(data => {
            if (data) {
                console.log('CACHED COPY OF DELTA');
                cb(data);
            } else {
                this.data().then(data => {
                    let diff = differ.create({
                        textDiff: {
                            minLength: 2,
                        },
                    });

                    let delta = diff.diff(this.match, JSON.stringify(data));

                    let deltaVersion = {
                        id: key,
                        data: delta,
                    };

                    this.cache.add(JSON.stringify(deltaVersion), this.key + '_deltas');

                    cb(delta);
                }).catch(err => {
                    throw err;
                });
            }
        });
    }

    deltaInHistory(key) {
        return new Promise((resolve, reject) => {
            this.cache.retrieve(this.key + '_deltas').then(data => {
                data.forEach(el => {
                    el = JSON.parse(el);

                    if (el.id === key) {
                        resolve(el.data);
                    }
                });

                resolve(false);
            });
        });
    }

    full(cb) {
        console.time('cached');
        this.getCurrent().then(data => {
            console.log('IN FULL', data);

            if (data) {
                console.log('working with a cached copy');
                console.timeEnd('cached');
                cb(data);
            } else {
                console.log('working with a brand new copy from the source');

                console.time('new');
                this.data().then(data => {
                    console.timeEnd('new');
                    this.storeVersion(data);

                    cb(JSON.stringify(data));
                }).catch(err => {
                    throw err;
                });
            }
        });
    }

    getCurrent() {
        return this.cache.retrieve({limit: 1}).then(data => {
            let ret = false;

            if (data) {
                ret = JSON.parse(data).data;
            }

            return ret;
        });
    }

    changed(data) {
        var hash = crypto.createHash('md5').update(JSON.stringify(data)).digest("hex");

        console.log(hash, this.currentHash);

        if (hash === this.currentHash) {
            return false;
        }

        return true;
    }
}

module.exports = Adapter;
