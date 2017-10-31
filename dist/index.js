"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require("fs");

var _util = require("util");

var _utils = require("./utils");

var _lodash = require("lodash.unescape");

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require("lodash.merge");

var _lodash4 = _interopRequireDefault(_lodash3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const read = (0, _util.promisify)(_fs.readFile);

const defaultLocalKeys = ["unescaped"];
const defaultLocalValues = [_lodash2.default];

// eslint-disable-next-line
const compile = content => locals => Function(locals, "return `" + content + "`;");

const GeneratorFunction = Object.getPrototypeOf(function* () {}).constructor;
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
    return read(filePath).then(layoutContents => compileTemplate(layoutContents));
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

exports.default = (options = {}) => {
  options = (0, _lodash4.default)({
    caching: false,
    layoutFile: null,
    fnWhitelist: [Array.prototype]
  }, options);

  const retrieveTemplateRenderer = buildRetrieve(options.caching);
  const retrieveLayout = buildLayoutRetrieve(options.layoutFile, options.caching);
  const escapeWrapper = (0, _utils.createEscapeWrapper)(options);
  return (filePath, templateParameters, callback) => {
    Promise.all([retrieveLayout(), retrieveTemplateRenderer(filePath)]).then(([Layout, executeTemplate]) => {
      let localsKeys = Object.keys(templateParameters);
      let localsValues = localsKeys.map(i => escapeWrapper(templateParameters[i]));

      localsKeys = localsKeys.concat(defaultLocalKeys);
      localsValues = localsValues.concat(defaultLocalValues);

      const renderedContent = executeTemplate(localsKeys)(...localsValues);

      const layoutIterator = Layout();

      layoutIterator.next();
      const { value } = layoutIterator.next(renderedContent);

      callback(null, value);
    }).catch(callback);
  };
};