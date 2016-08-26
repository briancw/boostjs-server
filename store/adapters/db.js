const Adapter = require('../adapter');

class DB extends Adapter
{
  constructor(config)
  {
    super(config);
    this.dbName = config.db;
    this.table = config.table;
    this.actions = config.actions;
    this.db = this.db();
  }

  init()
  {
    if (this.actions) {
      this.initActions();
    }
  }

  initActions()
  {
    for (let prop in this.actions) {
      let action = this.actions[prop];
      this.initAction(prop, action);
    }
  }

  initAction(prop, action)
  {
    let key = this.name + '.' + prop;

    this.socket.on(key, (props, cb) => {
      action = action.bind(this);

      new Promise((resolve, reject) => {
        return action(resolve, ...props);
      }).then(data => {
        console.log(data);
        cb(data);
      });
    });
  }
}

module.exports = DB;
