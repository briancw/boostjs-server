## BoostJS 🚀 serverside by [Clever.ly](http://clever.ly) ##

BoostJS is an opinionated framework designed to make responsive data easy and efficient.
This is a nodejs serverside implementation which provides efficient data publishing over websockets.
BoostJS currently only supports RethinkDB.

```
npm install boostjs-server

const BoostServer = require('boostjs-server');
const boost = new BoostServer({
    spdy: {
        protocols: ['http/1.1'],
        plain: true,
    },
});
const port = 3000;
const app = boost.app;
app.get('/', function(req, res) {
    res.send('It Works!');
});
boost.launch(port, err => {
    console.log('Listening on port ' + port);
});
```

## Notable Npm Modules ##
### Core: ###
  * thinky: RethinkDB ORM
  * socket.io: socket connections between server and client with multiplexing, fallbacks, auto-reconnect, and other useful features

## Project Requirements ##
This project requires Rethinkdb to be installed on your machine
  https://www.rethinkdb.com/docs/install/

Additionally, you will need node and npm. Current recommend version is 6.x

[Development Guide!](development.md)
