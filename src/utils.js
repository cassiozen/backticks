import escape from 'lodash.escape';

export const createEscapeWrapper = options => {
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
          const autoEscapedFn = options.autoEscapedFunctions.find(obj => obj === value || (obj[prop] &&  obj[prop] === value))
          if(autoEscapedFn) {
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
      return escape(val);
    }
  };

  return escapeWrapper;
}

