const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const helmet = require('helmet');
const spdy = require('spdy');
const Redis = require('redis');
const BoostAdapter = require('./store/adapters/boost');
const boostAuth = require('./auth/auth');

app.use(helmet());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(boostAuth.auth);
app.use(require('connect-history-api-fallback')());

class BoostServer {
    constructor(server_opts) {
        this.server = spdy.createServer(server_opts, app);
        this.cache = Redis.createClient();
        this.app = app;
        this.io = this.io;

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

    launch(port) {
        this.server.listen(port, err => {
            this.helpers.handle(err);
            console.log('Listening on port: ' + port);
        });
    }

    publish(path, model, query = {}) {
        return new BoostAdapter({
            name: path,
            model: model,
            query: query,
        }).start(this);
    }
}

module.exports = BoostServer;
