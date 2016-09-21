const bluebird = require('bluebird');
const readFile = bluebird.promisify(require('fs').readFile);
const watcher = require('chokidar');
const _ = require('lodash');

const Adapter = require('../adapter');


class File extends Adapter
{
  constructor(config)
  {
    super(config);
    this.path = config.path || config.name;
  }

  data()
  {
    return readFile(this.path, 'utf-8').then(data => {
      if (this.query) {
        return JSON.stringify(_.get(JSON.parse(data), this.query));
      }

      return data;
    });
  }

  watch()
  {
    return watcher.watch(this.path).on('change', () => {
      this.incoming();
    });
  }
}


module.exports = File;