const DB = require('./db');

class Boost extends DB {
    constructor(config) {
        super(config);
        this.model = config.model;
        this.resolveQuery();
    }

    db() {
        return this.model;
    }

    data() {
        return this.data;
    }

    watch() {
        this.model.changes().then(changes => {
            changes.each((error, doc) => {
                if (error) {
                    // console.log(error);
                }

                this.incoming();

            });
        }).error(function(error) {
            console.log(error);
        });
    }

    resolveQuery() {
        let ret;
        let query = this.query;

        if (typeof query == 'function') {
            query =  query.bind(this);
            ret = query();

            if (typeof ret.then == 'function') {
                ret = query;
            } else {
                ret = ret.run();
            }

        } else {
            ret = this.model.filter(this.query).run();
        }

        this.data = ret;
    }
}

module.exports = Boost;
