"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _fs = require("fs");

var _utils = require("./utils");

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var defaultLocalKeys = ["dump"];
var defaultLocalValues = [_utils.dump];

// eslint-disable-next-line
var compile = function compile(content) {
  return function () {
    var locals = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return Function(locals, 'return `' + content + '`;');
  };
};

var read = function read(filepath) {
  return new Promise(function (resolve, reject) {
    (0, _fs.readFile)(filepath, function (err, contents) {
      if (err) reject(err);else resolve(contents);
    });
  });
};

var createFromFileSystem = function createFromFileSystem(filename) {
  return read(filename).then(function (content) {
    return compile(content);
  });
};

var buildRetrieve = function buildRetrieve(caching) {

  if (caching) {

    var cache = {};
    return function (filePath) {
      if (!cache[filePath]) {
        return createFromFileSystem(filePath).then(function (templateRenderer) {
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

// const buildLayoutRetrieve = (filePath, shouldCache) => {

//   if (!filePath) { // No supplied layout.
//     return () => class extends Component {
//       render() {
//         return this.props.children;
//       }
//     };
//   }

//   const createLayoutComponentFromFilePath = () => {
//     return read(filePath)
//       .then(layoutContents => server(layoutContents, {filename: filePath}))
//       .then(renderer => {
//         return class extends Component {
//           render() {
//             return renderer(this);
//           }
//         };
//       });
//   };

//   if (shouldCache) {

//     let LayoutComponent;

//     return () => {
//       if (!LayoutComponent) {
//         return createLayoutComponentFromFilePath()
//           .then(createdComponent => {
//             LayoutComponent = createdComponent;
//             return LayoutComponent;
//           })
//       } else {
//         return Promise.resolve(LayoutComponent);
//       }

//     };

//   } else {

//     return () => createLayoutComponentFromFilePath();

//   }

// };

exports.default = function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};


  options = Object.assign({
    caching: false,
    layoutFile: null
  }, options);

  var retrieveTemplateRenderer = buildRetrieve(options.caching);
  //const retrieveLayoutComponent = buildLayoutRetrieve(options.layoutFile, options.caching);

  return function (filePath, templateParameters, callback) {

    Promise.all([/*retrieveLayoutComponent(), */retrieveTemplateRenderer(filePath)]).then(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 1),
          /*LayoutComponent, */executeTemplate = _ref2[0];

      var localsKeys = Object.keys(templateParameters);
      var localsValues = localsKeys.map(function (i) {
        return (0, _utils.escape)(templateParameters[i]);
      });

      localsKeys = localsKeys.concat(defaultLocalKeys);
      localsValues = localsValues.concat(defaultLocalValues);
      console.log(localsKeys);
      console.log(localsValues);
      callback(null, executeTemplate(localsKeys).apply(undefined, _toConsumableArray(localsValues)));
    }).catch(callback);
  };
};