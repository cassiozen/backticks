import { readFile } from "fs";
import { promisify } from "util";
import html from "./htmlTemplate";
import { createEscapeWrapper } from "./utils";
import unescape from "lodash.unescape";
import merge from "lodash.merge";

const read = promisify(readFile);

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
  options = merge(
    {
      caching: false,
      layoutFile: null,
      fnWhitelist: [Array.prototype]
    },
    options
  );

  const retrieveTemplateRenderer = buildRetrieve(options.caching);
  const retrieveLayout = buildLayoutRetrieve(options.layoutFile, options.caching);
  const escapeWrapper = createEscapeWrapper(options);
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
