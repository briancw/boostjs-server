const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const helmet = require('helmet');
const spdy = require('spdy');
const boostAuth = require('./auth/auth');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const secret_key = process.env.JWT_SECRET;

// Adapter options
const BoostRethink = require('./store/adapters/boost-rethink');
const File = require('./store/adapters/file');

// Cache options
const RedisCache = require('./cache/adapters/redis');
const ArrayCache = require('./cache/adapters/array');

app.use(helmet());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(boostAuth.auth);
app.use(require('connect-history-api-fallback')());

class BoostServer {
    constructor(serverOpts) {
        this.server = spdy.createServer(serverOpts, app);
        this.app = app;
        this.serverOpts = serverOpts;
        this.cacheOpts = serverOpts.cache;

         this.adapters = {
            rethink: BoostRethink,
            file: File,
         };

        this.caches = {
            redis: RedisCache,
            array: ArrayCache,
        };

        this.adapter = this.adapters[this.serverOpts.adapter];
        this.cache = this.caches[this.cacheOpts.type];

        let io = require('socket.io').listen(this.server);
        io.set('transports', ['websocket']);
        this.io = io;
        this.globalSocket = this.io.of('/application');

        this.globalSocket.on('connection', socket => {
            console.log('app:client-connected');
            this.socket = socket;
            this.registerListeners();
        });

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
        let adapter = Reflect.construct(this.adapter, [{
            name: path,
            path: model,
            model: model,
            query: query,
            cache: this.cache,
            cacheOpts: this.cacheOpts,
        }]);
        
        adapter.start(this);
    }

    getLoginToken(user, authStatus) {
        let invalidationDate = Date.now() + this.serverOpts.jwt.lifetime;

        let token = jwt.sign({
            userId: user.id,
            invalidationDate: invalidationDate,
            authStatus: authStatus,
        },
            secret_key
        );

        return {
            token,
            invalidationDate,
        };
    }

    logoutToken(token) {
        console.log('typeof token');
        console.log(typeof token);
        if (!token || typeof token !== 'string') {
            return false;
        }
        let fileName = token.substr(token.lastIndexOf('.') + 1, 8);
        console.log('wrote session');
        fs.writeFileSync('.sessions/' + fileName + '.s', '', 'utf8');

        return true;
    }

    registerListeners() {
        console.log('app:ready');
        this.socket.emit('app:ready');


        this.socket.on('auth.logout', (token, cb) => {
            console.log('auth:logged-out', token);
            this.logoutToken(token);
            cb('Logged out');
        });
    }

    // Thought I'd start on the tasking stuff. Dunno if this works but it's not used anywhere yet.
    // Will the intervals stay in the event loop after the server quits?
    task(name, handler, frequency, opts) {
        opts = opts || {};
        let id;

        if (typeof handler !== 'object' || typeof name !== 'string' || typeof frequency !== 'number') {
            throw 'Incorrect params';
        }

        if (this.tasks[name]) {
            throw 'Task already exists';
        }

        if (opts.once) {
            id = setTimeout(handler, frequency);
        } else {
            id = setInterval(handler, frequency);
        }

        this.tasks[name] = {
            id,
            timeout: this.opts.once,
        };
    }

    cancelTask(name) {
        let taskInfo = this.tasks[name];
        if (!taskInfo) {
            return;
        }
        if (taskInfo.timeout) {
            clearTimeout(taskInfo.id);
        } else {
            clearInterval(taskInfo.id);
        }
    }
}

module.exports = BoostServer;
