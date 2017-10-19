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
  const escaped = val.replace(escapeRegex, lookupEscape);
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
  if (typeof val === "string") {
    return escape(val);
  } else {
    return new Proxy(val, proxyHandler);
  }
};
