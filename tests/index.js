const { expect } = require("chai");
const { join } = require("path");
const fs = require("fs");

describe("ES6 Template Literal Engine", function() {
  let files;
  beforeEach("File system, so to speak", () => {
    files = {
      "./layout.html": "<div id='app'>${yield}</div>",
      "./index.html": "<h1>${name}</h1>",
      "./list.html": "<ul>${names.map(n => `<li>${n}</li>`).join('')}</ul>",
      "./dump.html": "<h1>${dump(name)}</h1>",
      "./page.html": "<h2>Hi</h2>"
    };
  });

  beforeEach("Replace fs.readFile with mock", () => {
    fs.readFile = (filePath, cb) => {
      if (!files[filePath]) cb(new Error("No such file for testing."));
      cb(null, files[filePath]);
    };

    fs.exists = () => { console.log("called exists") }
    fs.stat = () => { console.log("called stat") }
    fs.access = () => { console.log("called access") }
  });

  let createEngine;
  beforeEach("Get SUT", () => {
    createEngine = require(join(__dirname, "../"));
  });

  describe("without caching", () => {
    it("renders with layout and interpolated data", () => {
      const engine = createEngine({
        layoutFile: "./layout.html"
      });

      return Promise.all([
        new Promise((resolve, reject) => {
          engine("./index.html", { name: "Joe" }, (err, body) => {
            if (err) reject(err);
            expect(body).to.be.equal("<div id='app'><h1>Joe</h1></div>");
            resolve();
          });
        }),
        new Promise((resolve, reject) => {
          engine("./page.html", {}, (err, body) => {
            if (err) reject(err);
            expect(body).to.be.equal("<div id='app'><h2>Hi</h2></div>");
            resolve();
          });
        })
      ]);
    });

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

    it("escapes locals to prevent XSS even in nested objects", () => {
      const engine = createEngine();

      return Promise.all([
        new Promise((resolve, reject) => {
          engine(
            "./list.html",
            { names: ['Jon<script>alert("ES6 Renderer")</script>', 'Joe'] },
            (err, body) => {
              if (err) return reject(err);
              expect(body).to.be.equal(
                "<ul><li>Jon&lt;script&gt;alert(&quot;ES6 Renderer&quot;)&lt;/script&gt;</li><li>Joe</li></ul>"
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


    it("uses updated layout files (aka does not cache)", () => {
      const engine = createEngine({
        layoutFile: "./layout.html"
      });

      return new Promise((resolve, reject) => {
        engine("./index.html", { name: "Joe" }, (err, body) => {
          if (err) return reject(err);
          expect(body).to.be.equal("<div id='app'><h1>Joe</h1></div>");
          files["./layout.html"] = "<span>${yield}</span>";
          engine("./index.html", { name: "Joe" }, (err, body) => {
            if (err) return reject(err);
            expect(body).to.be.equal("<span><h1>Joe</h1></span>");
            resolve();
          });
        });
      });
    });
  });

  describe("with caching", () => {
    it("should not produce new output when file system changes", () => {
      const engine = createEngine({
        layoutFile: "./layout.html",
        caching: true
      });

      return new Promise((resolve, reject) => {
        engine("./index.html", { name: "Joe" }, (err, body) => {
          if (err) return reject(err);
          expect(body).to.be.equal("<div id='app'><h1>Joe</h1></div>");
          files["./layout.html"] = "<span>${yield}</span>";
          files["./index.html"] = "<h4>{name}</h4>";
          engine("./index.html", { name: "Joe" }, (err, body) => {
            if (err) return reject(err);
            expect(body).to.be.equal("<div id='app'><h1>Joe</h1></div>");
            resolve();
          });
        });
      });
    });
  });
});
