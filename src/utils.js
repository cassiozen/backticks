const escapeMap = {
  "&": "&amp;",
  '"': "&quot;",
  "'": "&#39;",
  "<": "&lt;",
  ">": "&gt;"
};

const escapeRegex = /[&"'<>]/g;

const lookupEscape = ch => escapeMap[ch];

export const originalValues = {};

export const dump = (val) => {
  const unescapedVal = originalValues[val];
  return unescapedVal ? unescapedVal : val;
}

export const escape = (val) => {
  if (typeof val !== "string") return val;
  const escaped = val.replace(escapeRegex, lookupEscape);
  originalValues[escaped] = val;
  return escaped;
}

