const DB = require('./db');

class Boost extends DB {
    constructor(config) {
        super(config);
        this.model = config.model;
    }

    db() {
        return this.model;
    }

    data() {
        return this.model.filter(this.query).run();
    }

    watch() {
        this.model.changes().then(changes => {
            changes.each((error, doc) => {
                if (error) {
                    // console.log(error);
                }

                this.incoming();

                // let change_type;
                // if (doc.isSaved() === false) {
                //     // console.log('document deleted');
                //     change_type = 'delete';
                // } else if (doc.getOldValue() === null) {
                //     // console.log('new document');
                //     change_type = 'insert';
                // } else {
                //     // console.log('document update');
                //     change_type = 'update';
                // }
                //
                // // console.log(change_type);
                // this.socket.emit('update', change_type, doc);
            });
        }).error(function(error) {
            console.log(error);
        });
    }
}

module.exports = Boost;
