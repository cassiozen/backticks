"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
const escapeMap = {
  "&": "&amp;",
  '"': "&quot;",
  "'": "&#39;",
  "<": "&lt;",
  ">": "&gt;"
};

const escapeRegex = /[&"'<>]/g;

const lookupEscape = ch => escapeMap[ch];

const escape = val => {
  if (typeof val !== "string") return val;

  const escaped = val.replace(escapeRegex, lookupEscape);
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