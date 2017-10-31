"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createEscapeWrapper = undefined;

var _lodash = require("lodash.escape");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const createEscapeWrapper = exports.createEscapeWrapper = options => {
  const functionProxy = wrappedFn => function () {
    return escapeWrapper(wrappedFn.apply(this, arguments));
  };

  const proxyHandler = {
    get: function (target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      switch (typeof value) {
        case "string":
          return (0, _lodash2.default)(value);

        case "object":
          return new Proxy(value, proxyHandler);

        case "function":
          // The current value is a function: Is it in the functions whitelist?
          const autoEscapedFn = options.fnWhitelist.find(obj => obj === value || obj[prop] && obj[prop] === value);
          if (autoEscapedFn) {
            return value;
          } else {
            return functionProxy(value);
          }

        default:
          return value;
      }
    }
  };

  const escapeWrapper = val => {
    if (typeof val === "object") {
      return new Proxy(val, proxyHandler);
    } else {
      return (0, _lodash2.default)(val);
    }
  };

  return escapeWrapper;
};