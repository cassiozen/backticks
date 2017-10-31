var app = require('express')();
var join = require('path').join;

var backticks = require(join(__dirname, '../'));

app.engine('html', backticks({
  caching: true,
  layoutFile: join(__dirname, './views/layout.html')
}));
app.set('view engine', 'html');
app.set('views', join(__dirname, './views'));

app.get('/', function (req, res) {
  res.render('index', {name: 'Joe'});
});

app.listen(3000, function () {
  console.log('Example running on port 3000.');
});