"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var escape = function escape(val) {
  if (typeof val !== "string") {
    if (val.toString) {
      val = val.toString();
    } else {
      return val;
    }
  }
  return val.replace(escapeRegex, lookupEscape);
};

var value = new WeakMap();
var escapedValue = new WeakMap();

var ValueProxy = function () {
  function ValueProxy(val) {
    _classCallCheck(this, ValueProxy);

    value.set(this, val);
  }

  _createClass(ValueProxy, [{
    key: "dump",
    value: function dump() {
      return value.get(this);
    }
  }, {
    key: "toString",
    value: function toString() {
      var cachedEscape = escapedValue.get(this);
      if (cachedEscape) return cachedEscape;

      var escaped = escape(value.get(this));
      escapedValue.set(this, escaped);
      return escaped;
    }
  }]);

  return ValueProxy;
}();

exports.default = ValueProxy;