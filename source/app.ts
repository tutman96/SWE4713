import express = require('express');
import morgan = require('morgan');
import bodyParser = require('body-parser');
import cookieParser = require('cookie-parser');
import moment = require('moment');
var fileUpload = require('express-fileupload');

import ejs = require('ejs');
import serveStatic = require('serve-static');
var minifyHTML = require('express-minify-html');

import fs = require('fs');
import crypto = require('crypto');
if (!fs.existsSync('./secret.txt')) {
	var generateSecret = () => {
		var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		var charsLength = chars.length;
		var randomBytes = crypto.randomBytes(40);
		var result = new Array(40);

		var cursor = 0;
		for (var i = 0; i < 40; i++) {
			cursor += randomBytes[i];
			result[i] = chars[cursor % charsLength];
		}

		return result.join('');
	}

	fs.writeFileSync('./secret.txt', generateSecret());
}
var jwtSecret = fs.readFileSync('./secret.txt').toString();

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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(fileUpload());


app.use("/files", (req, res) => {
	return res.status(302).location('/login').end();
})

app.use(serveStatic('.', {
    maxAge: (process.env.NODE_ENV == 'production' ? 1000 * 60 * 60 * 24 : 0),
}))

var currencyFormatter = require('currency-formatter');

import jwt = require('jsonwebtoken');
import helpers = require('./helpers');

import Employee = require('./models/Employee');

app.use((req: helpers.Request, res, next) => {
	var p = req.path.replace(/\//g, "");
	var title = (p && p.toLowerCase()) || "SWE4713 - Double Entry Accounting";
	title = title[0].toUpperCase() + title.substr(1);
	res.locals = {
		title: title,
		path: req.path.replace(/\/$/,""),
		balanceFormat: (balance: number) => (balance < 0 ? "(" : "&nbsp;") + currencyFormatter.format(Math.abs(balance), { locale: req.acceptsLanguages()[0] || "en-US" }) + (balance < 0 ? ")" : "&nbsp;"),
		dateFormat: (date: Date, format = "LLL") => moment(date).format(format),
		datetimeLocalFormat: (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().substring(0, 19)
	}

	if (req.path == "/login") return next();

	try {
		var token = req.cookies && req.cookies['token'];
		if (!token) throw "No token";
		var decodedToken = jwt.verify(token, jwtSecret)
		req.token = decodedToken;
		res.locals['user'] = decodedToken;
		next();
	}
	catch (e) {
		console.error(e);
		return res.status(302).location('/login').end();
	}
})

import login = require('./controllers/login');
login.init(app);

import accounts = require('./controllers/accounts');
accounts(app);

import entries = require('./controllers/entries');
entries(app);

import files = require('./controllers/files');
files(app);

import employees = require('./controllers/employees');
employees(app);

import reports = require('./controllers/reports');
reports(app);

import eventlog = require('./controllers/eventlog');
eventlog(app);

app.use((req, res) => {
	res.status(404);
	res.render("404");
})

app.listen(8080, () => {
	console.log("The app is now running on port 8080")
});