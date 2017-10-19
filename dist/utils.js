"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.safetyWrapper = exports.dump = exports.originalValues = undefined;

var _lodash = require("lodash.escape");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const escape = val => {
  if (typeof val !== "string") return val;

  const escaped = (0, _lodash2.default)(val);
  originalValues[escaped] = val;
  return escaped;
};

const proxyHandler = {
  get: function (target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);

    switch (typeof value) {
      case "string":
        return escape(value);

      case "object":
        return new Proxy(value, proxyHandler);

      default:
        return value;
    }
  }
};

const originalValues = exports.originalValues = {};

const dump = exports.dump = val => {
  const unescapedVal = originalValues[val];
  return unescapedVal ? unescapedVal : val;
};

const safetyWrapper = exports.safetyWrapper = val => {
  if (typeof val === "object") {
    return new Proxy(val, proxyHandler);
  } else {
    return escape(val);
  }
};