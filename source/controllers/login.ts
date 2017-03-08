import helpers = require('../helpers');
import jwt = require('jsonwebtoken');

import fs = require('fs');
var jwtSecret = fs.readFileSync('./secret.txt').toString();

import Employee = require('../models/Employee');

import crypto = require('crypto');
export function hash(username: string, password: string) {
	return crypto.createHash('sha256').update(username.toLowerCase() + password).digest('base64');
}

export var init = (app: helpers.app) => {
	app.get('/login', helpers.wrap(async (req, res) => {
		if (req.cookies['token']) {
			try {
				jwt.verify(req.cookies['token'], jwtSecret);
				return res.status(302).location('/').end();
			}
			catch (e) {
				return helpers.render(res, 'login');
			}
		}
		return helpers.render(res, 'login');
	}))

	app.post("/login", helpers.wrap(async (req, res) => {
		var username = req.body.username;
		var password = req.body.password;

		var e = await Employee.findOne({ Username: username, PassHash: hash(username, password) });
		if (!e) {
			res.status(401);
			return "Invalid username or password"
		}

		if (e.Disabled) {
			res.status(418);
			return "Your account has been disabled by your administrator."
		}

		var token: typeof req.token = {
			id: e.EmployeeId,
			username: e.Username,
			permissions: e.Permissions,
		}

		res.cookie('token', jwt.sign(token, jwtSecret, { expiresIn: '7d' }), {
			expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
			httpOnly: true
		})
	}))

	app.get("/logout", helpers.wrap(async (req, res) => {
		res.clearCookie('token');
		res.status(302).location('/login').end();
	}))
}