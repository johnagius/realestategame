/* Loads js/engine/ORDER.txt files into a vm context with a minimal browser
   shim and returns the PE namespace. Used by tests.js, balance.js and any
   ad-hoc script: var PE = require('./load.js')(); */
var fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function load() {
  var dir = path.join(__dirname, '..', 'engine');
  var order = fs.readFileSync(path.join(dir, 'ORDER.txt'), 'utf8').split(/\r?\n/).filter(Boolean);
  var ctx = { console: console, Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, Error: Error, Infinity: Infinity, NaN: NaN, Date: Date, parseInt: parseInt, parseFloat: parseFloat, isNaN: isNaN, isFinite: isFinite };
  ctx.global = ctx; ctx.window = undefined; // engine attaches to `global` in Node
  vm.createContext(ctx);
  for (var i = 0; i < order.length; i++) {
    var file = path.join(dir, order[i]);
    vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
  }
  return ctx.PE;
};
module.exports.order = function () { return fs.readFileSync(path.join(__dirname, '..', 'engine', 'ORDER.txt'), 'utf8').split(/\r?\n/).filter(Boolean); };
