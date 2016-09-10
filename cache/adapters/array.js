const Cache = require('./cache');
const fs = require('fs');

class ArrayCache extends Cache {
    data() {
        return this.cache || {};
    }

    create(val, key) {
        if (!this.cache[key]) {
            this.initWithKey(key);
        }

        this.cache[key].unshift(val);
    }

    get(key, limit) {
        return new Promise((resolve, reject) => {
            resolve(this.cache[key] || []);
        });
    }

    trim(key, limit) {
        this.cache[key] = this.cache[key].slice(0, limit);
        return this.cache;
    }

    initWithKey(key) {
        this.cache[key] = [];
    }

    onBeforeStart() {
        let key = this.key.split('/').join('');

        fs.readFile(key + '_dump.txt', 'utf-8', (err, data) => {
            if (data && data !== 'undefined') {
                console.log('DATA RETRIEVED FROM DUMP');
                this.cache = JSON.parse(data);
            }

            console.log(this.cache);
        });
    }

    onBeforeEnd() {
        let key = this.key.split('/').join('');

        console.log('GETTING READY TO WRITE', JSON.stringify(this.cache));

        fs.writeFileSync(key + '_dump.txt', JSON.stringify(this.cache));

        this.end();
    }

}

module.exports = ArrayCache;
