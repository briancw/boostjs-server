const Cache = require('./cache');
const Redis = require('redis');

class RedisCache extends Cache {
    data() {
        return Redis.createClient();
    }

    create(val, key) {
        return this.cache.lpush(key, val);
    }

    get(key, limit) {
        return new Promise((resolve, reject) => {
            this.cache.lrange(key, [0, limit], (err, data) => {
                if (err) {
                    reject(err);
                }

                resolve(data);
            });
        });
    }

    trim(key, limit) {
        return this.cache.ltrim(this.key, [0, limit]);
    }
}

module.exports = RedisCache;
