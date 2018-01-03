# Backticks

An Express view engine for using ES2015 Template Literals.

## Installation

```bash
$ npm i backticks
```

## Features

* Compiled and interpreted by V8 (minimun overhead to the project)
* Learning new syntax is not required
* Niceties like automatic escaping & automatic array joining
* Support for layout using generator functions


## Usage

### Basic Usage

The basics required to integrate backticks renderer are:

```javascript
var express = require('express'),
  backticks = require('backticks'),
  app = express();
  
app.engine('html', backticks());
app.set('views', 'views');
app.set('view engine', 'html');

app.get('/', function(req, res) {
  res.render('index', {title: 'Welcome', message: "Hello World"});
});

app.listen(3000);
```

Before Express can render template files, the following application settings must be set:

- views, the directory where the template files are located. Eg: app.set('views', './views')
- view engine, the template engine to use. Eg: app.set('view engine', 'html')

HTML template file named index.html in the views directory is needed, with the following content:

```html
<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
</head>
<body>
    <h1>${message}</h1>
</body>
</html>
```

### Using a Layout file

Backticks supports the usage of a layout file. The layout is processed in a generator function, so you have access to `yield` Within it.

By default, Backticks will try to load a "layout" file using the same folder and extension of your views.

Example:


```javascript
var express = require('express'),
  backticks = require('backticks'),
  app = express();

app.engine('html', backticks({
  caching: true
}));
app.set('views', 'views');
app.set('view engine', 'html');


app.get('/', function(req, res) {
  res.render('index', {message: "Hello World"});
});

app.listen(3000);
```

**`views/layout.html`:**  

```html
<html>
  <head>
    <title>Hey, up here!</title>
  </head>
  <body>
    <div id="page">
      ${yield}
    </div>
  </body>
</html>
```

**Template:**  

```html
<div>
  <h1>${message}</h1>
</div>
```

## Settings

These are the available options when instantiating backticks:

| Option  | Description | Default Value
|---|---|---|
| caching  | Wheter or not Backticks should cache views | false |
| layoutFile | File to use as layout for views | [views folder]/layout.[view engine]
| fnWhitelist | By default, values returned from functions provided in locals are automatically escaped. You can whitelist functions to avoid auto escaping  | [Array.prototype]


## Should I use this in production code?  

Use Backticks if you need something quick and simple. It is not as readable as the template syntax supported by Handlebars.js and similar templating engines. On the other hand, it is lightweight and new syntax is introduced: It's just JavaScript.