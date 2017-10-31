# Backticks

An Express view engine for using ES2015 Template Literals.

## Installation

```bash
$ npm i backticks
```

## Features

* Compiled and interpreted by V8 (minimun overhead to the project)
* Learning new syntax is not required
* Automatic escaping of locals
* Support for layout using generator functions.

## Usage

### Setup

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
