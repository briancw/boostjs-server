
class Cache {

    constructor(config) {
        this.historyLimit = config.limit - 1 || 9;
        this.key = config.key;
        this.cache = this.data();
        this.registerHooks();
    }

    registerHooks() {
        this.onInit();
        this.onExit();
    }

    onInit() {
        if (this.onBeforeStart) {
            this.onBeforeStart();
        }
    }

    onExit() {
        if (this.onBeforeEnd) {
            process.stdin.resume();

            process.on('SIGINT', () => {
                this.onBeforeEnd();
            });
        }
    }

    end() {
        process.exit();
    }

    add(val, key) {
        let ret = this.key;

        if (key) {
            ret = key;
        }

        return this.create(val, ret);
    }

    resolveConfig(config) {
        let key = this.key;
        let limit = this.historyLimit;

        if (typeof config === 'object') {
            if (config.key) {
                key = config.key;
            }

            if (config.limit) {
                limit = config.limit;
            }
        } else if (typeof config === 'string') {
            key = config;
        }

        return {
            key: key,
            limit: limit,
        };
    }

    retrieve(config) {
        let params = this.resolveConfig(config);

        return this.get(params.key, params.limit).then(data => {
            let ret = data;

            if (ret && params.limit === 1) {
                ret = ret[0];
            }

            console.log(ret);

            return ret;
        });
    }

    cut(config) {
        let params = this.resolveConfig(config);
        return this.trim(params.key, params.limit);
    }

}

module.exports = Cache;
