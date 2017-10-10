var app = require('express')();
var join = require('path').join;

var jsxEngine = require(join(__dirname, '../'));

app.engine('jsx', jsxEngine({
  caching: true,
  layoutFile: join(__dirname, './views/layout.jsx')
}));
app.set('view engine', 'jsx');
app.set('views', join(__dirname, './views'));

app.get('/', function (req, res) {
  res.render('index', {name: 'Joe'});
});

app.listen(1337, function () {
  console.log('Example running on port 1337.');
});