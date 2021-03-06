'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = require('fs');
var util = require('util');
var escape = _interopDefault(require('lodash.escape'));
var unescape = _interopDefault(require('lodash.unescape'));
var merge = _interopDefault(require('lodash.merge'));

// Based on "HTML templating with ES6 template strings" by Dr. Axel Rauschmayer
// http://2ality.com/2015/01/template-strings-html.html

function html(literalSections, ...substs) {
  // Use raw literal sections: we don’t want
  // backslashes (\n etc.) to be interpreted
  let raw = literalSections.raw;

  let result = "";

  substs.forEach((subst, i) => {
    // Retrieve the literal section preceding
    // the current substitution
    result += raw[i];

    // In the example, map() returns an array:
    // If substitution is an array (and not a string),
    // we turn it into a string
    if (Array.isArray(subst)) {
      subst = subst.join("");
    }

    result += subst;
  });
  // Take care of last literal section
  // (Never fails, because an empty template string
  // produces one literal section, an empty string)
  result += raw[raw.length - 1]; // (A)

  return result;
}

const createEscapeWrapper = options => {
  const functionProxy = wrappedFn =>
    function() {
      return escapeWrapper(wrappedFn.apply(this, arguments));
    };

  const proxyHandler = {
    get: function(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      const type = typeof value;

      if (value instanceof Date) {
        return value;
      } else if (type === "object") {
        return new Proxy(value, proxyHandler);
      } else if (type === "function") {
        // The current value is a function: Is it in the functions whitelist?
        const autoEscapedFn = options.fnWhitelist.find(
          obj => obj === value || (obj[prop] && obj[prop] === value)
        );
        if (autoEscapedFn) {
          return value;
        } else {
          return functionProxy(value);
        }
      } else {
        return escape(value);
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
};

const read = util.promisify(fs.readFile);

const defaultLocalKeys = ["unescaped", "__htmlTaggedTemplateLiteral__"];
const defaultLocalValues = [unescape, html];

// eslint-disable-next-line
const compile = content => locals =>
  Function(locals, "return __htmlTaggedTemplateLiteral__`" + content + "`;");

const GeneratorFunction = Object.getPrototypeOf(function*() {}).constructor;
const compileTemplate = content => new GeneratorFunction("", "yield `" + content + "`;");

const createFromFileSystem = filename => {
  return read(filename).then(content => compile(content));
};

const buildRetrieve = caching => {
  if (caching) {
    let cache = {};
    return filePath => {
      if (!cache[filePath]) {
        return createFromFileSystem(filePath).then(templateRenderer => {
          // A template renderer -- not the text itself -- is cached
          cache[filePath] = templateRenderer;
          return cache[filePath];
        });
      } else {
        return Promise.resolve(cache[filePath]);
      }
    };
  } else {
    return createFromFileSystem;
  }
};

const buildLayoutRetrieve = (filePath, shouldCache) => {
  if (!filePath) {
    // No supplied layout.
    return () => Promise.resolve(compileTemplate("${yield}"));
  }

  const createLayoutFromFilePath = () => {
    return read(filePath)
      .then(layoutContents => compileTemplate(layoutContents))
      .catch(e => compileTemplate("${yield}"));
  };

  if (shouldCache) {
    let Layout;

    return () => {
      if (!Layout) {
        return createLayoutFromFilePath().then(createdGenerator => {
          Layout = createdGenerator;
          return Layout;
        });
      } else {
        return Promise.resolve(Layout);
      }
    };
  } else {
    return () => createLayoutFromFilePath();
  }
};

var index = (options = {}) => {
  options = merge(
    {
      caching: false,
      layoutFile: null,
      fnWhitelist: [Array.prototype]
    },
    options
  );

  return (filePath, templateParameters, callback) => {
    // generates default layout name
    if (!options.layoutFile) {
      options.layoutFile = `${templateParameters.settings.views}/layout.${templateParameters.settings["view engine"]}`;
    }

    const retrieveTemplateRenderer = buildRetrieve(options.caching);
    const retrieveLayout = buildLayoutRetrieve(options.layoutFile, options.caching);
    const escapeWrapper = createEscapeWrapper(options);

    Promise.all([retrieveLayout(), retrieveTemplateRenderer(filePath)])
      .then(([Layout, executeTemplate]) => {
        let localsKeys = Object.keys(templateParameters);
        let localsValues = localsKeys.map(i => escapeWrapper(templateParameters[i]));

        localsKeys = localsKeys.concat(defaultLocalKeys);
        localsValues = localsValues.concat(defaultLocalValues);

        const renderedContent = executeTemplate(localsKeys)(...localsValues);

        const layoutIterator = Layout();

        layoutIterator.next();
        const { value } = layoutIterator.next(renderedContent);

        callback(null, value);
      })
      .catch(callback);
  };
};

module.exports = index;
