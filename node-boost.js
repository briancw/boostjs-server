const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const helmet = require('helmet');
const spdy = require('spdy');
const BoostRethink = require('./store/adapters/boost-rethink');
const boostAuth = require('./auth/auth');

// Cache options
const RedisCache = require('./cache/adapters/redis');

app.use(helmet());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(boostAuth.auth);
app.use(require('connect-history-api-fallback')());

class BoostServer {
    constructor(server_opts) {
        this.server = spdy.createServer(server_opts, app);
        this.app = app;
        this.io = this.io;
        this.cache = server_opts.cache;
        this.initCache();

        let io = require('socket.io').listen(this.server);
        io.set('transports', ['websocket']);
        this.io = io;

        this.helpers = {
            handle: function(err) {
                if (err) {
                    throw err;
                }
            },
        };
    }

    initCache() {
        let cache = this.cache;

        if (cache.type === 'redis') {
            this.cache = new RedisCache(cache);
        }
    }

    launch(port) {
        this.server.listen(port, err => {
            this.helpers.handle(err);
            console.log('Listening on port: ' + port);
        });
    }

    publish(path, model, query = {}) {
        return new BoostRethink({
            name: path,
            model: model,
            query: query,
        }).start(this);
    }
}

module.exports = BoostServer;
