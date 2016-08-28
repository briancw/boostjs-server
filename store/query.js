

class Query {

  constructor(query) {
    this.query = query;


  }

  get() {
      let ret = this.query;

      if (this.isRunnable()) {
          ret = ret();
      }

      return ret;
  }

  getVal() {
      let val = this.query;
      return val();
  }

  isObject() {
    let ret = false;

    if (typeof this.query == 'object') {
      ret = true;
    }

    return ret;
  }

  isFunction() {
      let val = this.val;

      if (!val) {
          val = this.getVal();
      }

      return this.isRunnable(val);
  }

  isRunnable(q) {
    let ret = false;
    let query = q || this.query;

    if (typeof query == 'function') {
      ret = true;
    }

    return ret;
  }

  isPromise() {
    let ret = false;
    let val = this.val;

    if (!val) {
        val = this.getVal();
    }

    if (typeof val.then == 'function') {
      ret = true;
    }

    return ret;
  }
}

module.exports = Query;
