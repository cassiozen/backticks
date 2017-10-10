import {readFile} from 'fs';
import {escape, dump} from "./utils";

const defaultLocalKeys = ["dump"];
const defaultLocalValues = [dump];

// eslint-disable-next-line
const compile = content => (locals = {}) => Function(locals, 'return `' + content + '`;');

const read = filepath => new Promise((resolve, reject) => {
  readFile(filepath, (err, contents) => {
    if (err) reject(err);
    else resolve(contents);
  });
});


const createFromFileSystem = filename => {
  return read(filename).then(content => compile(content));
};

const buildRetrieve = caching => {

  if (caching) {

    let cache = {};
    return filePath => {
      if (!cache[filePath]) {
        return createFromFileSystem(filePath)
          .then(templateRenderer => {
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

export default (options = {}) => {

  options = Object.assign({
    caching: false,
    layoutFile: null
  }, options);

  const retrieveTemplateRenderer = buildRetrieve(options.caching);
  //const retrieveLayoutComponent = buildLayoutRetrieve(options.layoutFile, options.caching);

  return (filePath, templateParameters, callback) => {

    Promise.all([/*retrieveLayoutComponent(), */retrieveTemplateRenderer(filePath)])
      .then(([/*LayoutComponent, */executeTemplate]) => {
        let localsKeys = Object.keys(templateParameters);
        let localsValues = localsKeys.map(i => escape(templateParameters[i]));

        localsKeys = localsKeys.concat(defaultLocalKeys);
        localsValues = localsValues.concat(defaultLocalValues);
        
        callback(null, executeTemplate(localsKeys)(...localsValues));
      })
      .catch(callback);
  };

}
