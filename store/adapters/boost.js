const DB = require('./db');
const Query = require('../query');

class Boost extends DB {
    constructor(config) {
        super(config);
        this.model = config.model;
        this.resolveQuery();
    }

    resolveQuery() {
      this.query = new Query(this.query);
    }
}

module.exports = Boost;
