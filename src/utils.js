import _escape from 'lodash.escape';

const escape = val => {
  if(typeof val !== "string") return val;
  
  const escaped = _escape(val);
  originalValues[escaped] = val;
  return escaped;
};

const proxyHandler = {
  get: function(target, prop, receiver) {
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

export const originalValues = {};

export const dump = val => {
  const unescapedVal = originalValues[val];
  return unescapedVal ? unescapedVal : val;
};

export const safetyWrapper = val => {
  if (typeof val === "object") {
    return new Proxy(val, proxyHandler);
  } else {
    return escape(val);
  }
};
