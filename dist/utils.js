"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var escapeMap = {
  "&": "&amp;",
  '"': "&quot;",
  "'": "&#39;",
  "<": "&lt;",
  ">": "&gt;"
};

var escapeRegex = /[&"'<>]/g;

var lookupEscape = function lookupEscape(ch) {
  return escapeMap[ch];
};

var originalValues = exports.originalValues = {};

var dump = exports.dump = function dump(val) {
  var unescapedVal = originalValues[val];
  return unescapedVal ? unescapedVal : val;
};

var escape = exports.escape = function escape(val) {
  if (typeof val !== "string") return val;
  var escaped = val.replace(escapeRegex, lookupEscape);
  originalValues[escaped] = val;
  return escaped;
};