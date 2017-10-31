import escape from 'lodash.escape';

const functionProxy = wrappedFn => function() {
  return escapeWrapper(wrappedFn.apply(this, arguments));
}

const proxyHandler = {
  get: function(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);

    switch (typeof value) {
      case "string":
        return escape(value);

      case "object":
        return new Proxy(value, proxyHandler);

      case "function":
        if(Array.prototype[prop] && Array.prototype[prop] === value) {
          return value;
        } else {
          return functionProxy(value);
        }

      default:
        return value;
    }
  }
};

export const escapeWrapper = val => {
  if (typeof val === "object") {
    return new Proxy(val, proxyHandler);
  } else {
    return escape(val);
  }
};
