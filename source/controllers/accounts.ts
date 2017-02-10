import express = require('express');
import wrapper = require('../asyncWrapper');

import Account = require("../models/Account");
import AccountTypes = require("../models/AccountType");

export = (app: express.Application) => {
	app.get("/accounts", wrapper(async (req, res) => {
		res.render('accounts', {
			title: "Accounts",
			accounts: (await Account.find()).sort((a,b) => a.SortOrder - b.SortOrder)
		})
	}));



	app.get("/account/:AccountNumber", wrapper(async (req, res) => {
		if (req.params['AccountNumber'] == "new") {
			res.render('account', {
				title: "New Account",
				isNew: true,
				accountTypes: (await AccountTypes.find()).sort((a, b) => a.MinCode - b.MinCode),
				account: {}
			})
		}
		else {
			var account = await Account.findOne({ AccountNumber: req.params['AccountNumber'] });
			if (!account) {
				res.status(404);
				res.render('404');
			}
			else {
				res.render("account", {
					title: account.AccountName,
					isNew: false,
					accountTypes: (await AccountTypes.find()).sort((a, b) => a.MinCode - b.MinCode),
					account: account
				})
			}
		}
	}));
	
	app.post("/account/:AccountNumber", wrapper(async (req, res) => {
		if (req.params['AccountNumber'] == "new") {
			var account = await Account.construct(req.body);
			await Account.create(account);
		}
		else {
			req.body['AccountNumber'] = req.params['AccountNumber'];
			var account = await Account.construct(req.body);
			if (!account) {
				res.status(404);
				res.render('404');
			}
			else {
				await account.save();
			}
		}
	}));

	app.delete("/account/:AccountNumber", wrapper(async (req, res) => {
		req.body['AccountNumber'] = req.params['AccountNumber'];
		var account = await Account.findOne({ AccountNumber: req.params['AccountNumber'] });
		if (!account) {
			res.status(404);
			res.render('404');
		}
		else {
			await account.delete();
		}
	}));
}