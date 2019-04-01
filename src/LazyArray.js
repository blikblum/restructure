/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const ArrayT = require('./Array');
const {Number:NumberT} = require('./Number');
const utils = require('./utils');
const {inspect} = require('util');

class LazyArrayT extends ArrayT {
  decode(stream, parent) {
    const { pos } = stream;
    const length = utils.resolveLength(this.length, stream, parent);
    
    if (this.length instanceof NumberT) {
      parent = {
        parent,
        _startOffset: pos,
        _currentOffset: 0,
        _length: length
      };
    }
    
    const res = new LazyArray(this.type, length, stream, parent);
    
    stream.pos += length * this.type.size(null, parent);
    return res;
  }
    
  size(val, ctx) {
    if (val instanceof LazyArray) {
      val = val.toArray();
    }
      
    return super.size(val, ctx);
  }
    
  encode(stream, val, ctx) {
    if (val instanceof LazyArray) {
      val = val.toArray();
    }
      
    return super.encode(stream, val, ctx);
  }
}

class LazyArray {
  constructor(type, length, stream, ctx) {
    this.type = type;
    this.length = length;
    this.stream = stream;
    this.ctx = ctx;
    this.base = this.stream.pos;
    this.items = [];
  }
    
  get(index) {
    if ((index < 0) || (index >= this.length)) {
      return undefined;
    }
    
    if (this.items[index] == null) {
      const { pos } = this.stream;
      this.stream.pos = this.base + (this.type.size(null, this.ctx) * index);
      this.items[index] = this.type.decode(this.stream, this.ctx);
      this.stream.pos = pos;
    }
      
    return this.items[index];
  }
    
  toArray() {
    return (() => {
      const result = [];
      for (let i = 0, end = this.length; i < end; i++) {
        result.push(this.get(i));
      }
      return result;
    })();
  }
    
  inspect() {
    return inspect(this.toArray());
  }
}

module.exports = LazyArrayT;
