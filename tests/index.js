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
      "./object.html": "<h1>${user.name}</h1>",
      "./function.html": "<h1>${user.getUser()}</h1>",
      "./dump.html": "<h1>${unescaped(name)}</h1>",
      "./page.html": "<h2>Hi</h2>"
    };
  });

  beforeEach("Replace fs.readFile with mock", () => {
    fs.readFile = (filePath, cb) => {
      if (!files[filePath]) cb(new Error("No such file for testing."));
      cb(null, files[filePath]);
    };

    fs.exists = () => {
      console.log("called exists");
    };
    fs.stat = () => {
      console.log("called stat");
    };
    fs.access = () => {
      console.log("called access");
    };
  });

  let createEngine;
  beforeEach("Get SUT", () => {
    createEngine = require(join(__dirname, "../"));
  });

  describe("Layout", () => {
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

    it("uses updated layout files when caching is not enabled", () => {
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

  describe("Caching", () => {
    it("should not produce new output when caching is enabled", () => {
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

  describe("XSS", () => {
    it("escapes locals", () => {
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

    it("escapes locals inside nested objects", () => {
      const engine = createEngine();

      return Promise.all([
        new Promise((resolve, reject) => {
          engine(
            "./list.html",
            { names: ['Jon<script>alert("ES6 Renderer")</script>', "Joe"] },
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
            "./object.html",
            { user: { name: 'Jon<script>alert("ES6 Renderer")</script>' } },
            (err, body) => {
              if (err) return reject(err);
              expect(body).to.be.equal(
                "<h1>Jon&lt;script&gt;alert(&quot;ES6 Renderer&quot;)&lt;/script&gt;</h1>"
              );
              resolve();
            }
          );
        })
      ]);
    });

    it("escapes returned values from functions in locals", () => {
      const engine = createEngine();
      return new Promise((resolve, reject) => {
        engine(
          "./function.html",
          {
            user: {
              getUser: function() {
                return 'Jon<script>alert("ES6 Renderer")</script>';
              }
            }
          },
          (err, body) => {
            if (err) return reject(err);
            expect(body).to.be.equal(
              "<h1>Jon&lt;script&gt;alert(&quot;ES6 Renderer&quot;)&lt;/script&gt;</h1>"
            );
            resolve();
          }
        );
      })
    })

    it("avoids escaping selected functions in locals", () => {
      const locals = { user: {
        getUser: function() {
          return '<a href="mailto:jon@jon.com">Jon</a>';
        }
      }}
      const engine = createEngine({
        autoEscapedFunctions: [locals.user]
      });
      return new Promise((resolve, reject) => {
        engine(
          "./function.html",
          locals,
          (err, body) => {
            if (err) return reject(err);
            expect(body).to.be.equal(
              '<h1><a href="mailto:jon@jon.com">Jon</a></h1>'
            );
            resolve();
          }
        );
      })
    })

    it("automatically unescape Array.prototype functions", () => {
      const engine = createEngine();
      return new Promise((resolve, reject) => {
        engine(
          "./list.html",
          { names: ['Jon', "Joe"] },
          (err, body) => {
            if (err) return reject(err);
            expect(body).to.be.equal(
              "<ul><li>Jon</li><li>Joe</li></ul>"
            );
            resolve();
          }
        );
      })
    })
  });
});
