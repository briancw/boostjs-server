const Cache = require('./cache');

class ArrayCache extends Cache {
    cache() {
        return [];
    }

    create(val, key) {
        // console.log(val, key);

        // return this.cache.lpush(key, val);
        if (!this.cache[key]) {
            this.initWithKey(key);
        }

        this.cache[key].push(val);

        // console.log(this.cache[key]);
    }

    get(key, limit) {
        // return new Promise((resolve, reject) => {
        //     this.cache.lrange(key, [0, limit], (err, data) => {
        //         if (err) {
        //             reject(err);
        //         }
        //
        //         resolve(data);
        //     });
        // });

        return new Promise((resolve, reject) => {
            resolve(this.cache[key] || []);
        });
    }

    trim(key, limit) {
        this.cache[key] = this.cache[key].slice(0, limit);
        return this.cache;
        // return this.cache.ltrim(this.key, [0, limit]);
    }

    initWithKey(key) {
        this.cache[key] = [];
    }
}

module.exports = ArrayCache;
