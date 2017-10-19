import { readFile } from "fs";
import { promisify } from "util";
import { escapeWrapper } from "./utils";
import unescape from "lodash.unescape";

const read = promisify(readFile);

const defaultLocalKeys = ["unescaped"];
const defaultLocalValues = [unescape];

// eslint-disable-next-line
const compile = content => locals => Function(locals, "return `" + content + "`;");

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

export default (options = {}) => {
  options = Object.assign(
    {
      caching: false,
      layoutFile: null
    },
    options
  );

  const retrieveTemplateRenderer = buildRetrieve(options.caching);
  const retrieveLayout = buildLayoutRetrieve(options.layoutFile, options.caching);

  return (filePath, templateParameters, callback) => {
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
