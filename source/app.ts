import express = require('express');
import morgan = require('morgan');
import bodyParser = require('body-parser');
import moment = require('moment');

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
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
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

app.use((req, res, next) => {
	var p = req.path.replace(/\//g,"");
	var title = (p && p.toLowerCase()) || "SWE4713 - Double Entry Accounting";
	title = title[0].toUpperCase() + title.substr(1);
	res.locals = {
		title: title,
		path: req.path,
		balanceFormat: (balance: number) => "$" + Math.abs(balance).toFixed(2),
		dateFormat: (date: Date) => moment(date).format('LLL'),
		datetimeLocalFormat: (date: Date) => new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().substring(0,19)
	}
	
	var results: any = next();
	if (results instanceof Promise) {
		console.log("Promise!");
		results.catch((err) => {
			res.status(err.code || 500);
			res.send(err.toString());
		})
	}
})


import accounts = require('./controllers/accounts');
accounts(app);

import journals = require('./controllers/journals');
journals(app);

import entries = require('./controllers/entries');
entries(app);

app.use(serveStatic('.', {
	maxAge: (process.env.NODE_ENV == 'production' ? 1000 * 60 * 60 * 24 : 0)
}))

app.use((req, res) => {
	res.status(404);
	res.render("404");
})

app.listen(8080, () => {
	console.log("The app is now running on port 8080")
});