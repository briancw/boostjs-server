# BOOST JS 🚀 #
```
npm install boostjs-server

const boost = require('boostjs-server');
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
