const Boost = require('./boost');

class BoostRethink extends Boost {
    constructor(config) {
        super(config);
    }

    db() {
        return this.model;
    }

    data() {
        let query = this.query;

        if (query.isObject()) {
            return this.model.filter(query.get()).run();
        }

        if (query.isPromise()) {
            return query.get();
        }

        if (query.isFunction()) {
            return query.get().run();
        }
    }

    watch() {
        this.model.changes().then(changes => {
            changes.each((err, doc) => {
                this.incoming();
            });
        }).error(function(error) {
            console.log(error);
        });
    }
}

module.exports = BoostRethink;
