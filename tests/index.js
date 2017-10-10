const { expect } = require("chai");
const { join } = require("path");
const fs = require("fs");

describe("ES6 Template Literal Engine", function() {
  let files;
  beforeEach("File system, so to speak", () => {
    files = {
      "./layout.html": '<div id="app">${yield}</div>',
      "./index.html": "<h1>${name}</h1>",
      "./dump.html": "<h1>${dump(name)}</h1>",
      "./page.html": "<h2>Hi</h2>"
    };
  });

  beforeEach("Replace fs.readFile with mock", () => {
    fs.readFile = (filePath, cb) => {
      if (!files[filePath]) cb(new Error("No such file for testing."));
      cb(null, files[filePath]);
    };
  });

  let createEngine;
  beforeEach("Get SUT", () => {
    createEngine = require(join(__dirname, "../"));
  });

  describe("without caching", () => {
    it("renders without layoutFile provided when templates wrap inside and not", () => {
      const engine = createEngine();

      return Promise.all([
        new Promise((resolve, reject) => {
          engine("./index.html", { name: "Jon" }, (err, body) => {
            if (err) return reject(err);
            expect(body).to.be.equal("<h1>Jon</h1>");
            resolve();
          });
        }),
        new Promise((resolve, reject) => {
          engine("./page.html", {}, (err, body) => {
            if (err) return reject(err);
            expect(body).to.be.equal("<h2>Hi</h2>");
            resolve();
          });
        })
      ]);
    });

    it("escapes locals to prevent XSS", () => {
      const engine = createEngine();

      return Promise.all([
        new Promise((resolve, reject) => {
          engine(
            "./index.html",
            { name: 'Jon<script>alert("ES6 Renderer")</script>' },
            (err, body) => {
              if (err) return reject(err);
              expect(body).to.be.equal(
                "<h1>Jon&lt;script&gt;alert(&quot;ES6 Renderer&quot;)&lt;/script&gt;</h1>"
              );
              resolve();
            }
          );
        }),

        new Promise((resolve, reject) => {
          engine(
            "./dump.html",
            { name: 'Jon<script>alert("ES6 Renderer")</script>' },
            (err, body) => {
              if (err) return reject(err);
              expect(body).to.be.equal('<h1>Jon<script>alert("ES6 Renderer")</script></h1>');
              resolve();
            }
          );
        })
      ]);
    });
  });
});
