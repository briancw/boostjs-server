const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const hash = require('object-hash');
const spdy = require('spdy');

// const server_opts = {
//     spdy: {
//         protocols: ['http/1.1'],
//         plain: true,
//     },
//     // key: fs.readFileSync('./server.key'),
//     // cert: fs.readFileSync('./server.crt'),
// };

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(require('connect-history-api-fallback')());

class BoostServer {
    constructor(server_opts) {
        this.server = spdy.createServer(server_opts, app);
        this.io = require('socket.io')(this.server);

        this.app = app;
        this.io = this.io;

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
        const channel = this.io.of(path);

        channel.on('connection', function(socket) {
            console.log('new connection to ' + path);

            socket.on('verify_data', data_hash => {
                console.log('verify data request ' + data_hash);

                model.run().then(data => {
                    let current_hash = hash(JSON.stringify(data));
                    // console.log('Current Data Hash: ' + current_hash);

                    let is_valid = (data_hash === current_hash);
                    socket.emit('verify_response', {valid: is_valid});
                });
            });

            socket.on('get_data', function() {
                console.log('get data request');

                model.filter(query).run().then(data => {
                    let current_hash = hash(data);
                    socket.emit('data_response', {data: data, hash: current_hash});
                });
            });
        });

        model.changes().then(function(changes) {
            changes.each(function(error, doc) {
                if (error) {
                    // console.log(error);
                }

                let change_type;
                if (doc.isSaved() === false) {
                    // console.log('document deleted');
                    change_type = 'delete';
                } else if (doc.getOldValue() === null) {
                    // console.log('new document');
                    change_type = 'insert';
                } else {
                    // console.log('document update');
                    change_type = 'update';
                }

                // console.log(change_type);
                channel.emit('update', change_type, doc);
            });
        }).error(function(error) {
            console.log(error);
        });
    }
}

module.exports = BoostServer;
