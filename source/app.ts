import express = require('express');
import morgan = require('morgan');

import ejs = require('ejs');
import serveStatic = require('serve-static');
var minifyHTML = require('express-minify-html');

morgan.token('remote-addr', (req, res) => {
	var ffHeaderValue = req.headers['x-forwarded-for'];
	return ffHeaderValue || req.connection.remoteAddress;
});

var app = express();
app.set('view engine', 'ejs');
app.use(morgan('combined'));
app.use(minifyHTML({
	override: true,
	exception_url: false,
	htmlMinifier: {
		removeComments: true,
		collapseWhitespace: true,
		collapseBooleanAttributes: true,
		removeAttributeQuotes: true,
		removeEmptyAttributes: true,
		minifyJS: true
	}
}));


app.use(serveStatic('.', {
	maxAge: (process.env.NODE_ENV == 'production' ? 1000 * 60 * 60 * 24 : 0)
}))

app.listen(8080, () => {
	console.log("The app is now running on port 8080")
});