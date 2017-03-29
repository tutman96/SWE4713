import express = require('express');
import helpers = require('../helpers');
import database = require('../database');

import Account = require("../models/Account");
import AccountTypes = require("../models/AccountType");
import Transaction = require("../models/Transaction");
import Entry = require("../models/Entry");
import EventLog = require("../models/EventLog");

export = (app: express.Application) => {
	app.get("/accounts", helpers.wrap(async (req, res) => {
		var page = +req.query['page'] || 1;
		var maxEntries = 20;

		var sort: string = req.query['sort'] || "SortOrder";

		var [accounts, numberOfAccounts] = await Promise.all([
			Account.find({}, maxEntries, maxEntries * (page - 1), sort),
			Account.count()
		]);

		var accountNumbers = accounts.map((a) => a.AccountNumber);
		if (accountNumbers.length) {
			var balances = await database.query<{ AccountNumber: number, CurrentBalance: number }>("SELECT AccountNumber, SUM(Value) as CurrentBalance FROM Transaction JOIN Entry USING (EntryId) WHERE Entry.State = 'APPROVED' && AccountNumber IN (?) GROUP BY AccountNumber", [accountNumbers]);
		}

		var accountsWithBalances = accounts.map((a) => {
			for (var balance of balances) {
				if (a.AccountNumber == balance.AccountNumber) {
					return {
						...a,
						canEdit: false,
						balance: balance.CurrentBalance
					}
				}
			}
			return {
				...a,
				canEdit: true,
				balance: 0
			}
		})

		return helpers.render(res, 'accounts', {
			title: "Accounts",
			accounts: accountsWithBalances,
			sort,
			page,
			totalPages: Math.ceil(numberOfAccounts / maxEntries)
		})
	}));

	app.get("/account/:AccountNumber", helpers.wrap(async (req, res) => {
		if (req.params['AccountNumber'] == "new") {
			return helpers.render(res, 'account', {
				title: "New Account",
				isNew: true,
				accountTypes: (await AccountTypes.find()).sort((a, b) => a.MinCode - b.MinCode),
				account: {},
				transactions: []
			})
		}
		else {
			var account = await Account.findOne({ AccountNumber: req.params['AccountNumber'] });
			if (!account) {
				return helpers.render(res, '404');
			}
			else {
				var dbTransactions = await database.query<Transaction>("SELECT Transaction.* FROM Transaction JOIN Entry USING (EntryId) WHERE Entry.State = 'APPROVED' AND AccountNumber = ?", [account.AccountNumber]);
				var transactions = await Promise.all(dbTransactions.map(Transaction.construct));

				var transactionsWithEntries = await Promise.all(transactions.map(async (t) => {
					var e = await database.query<{ Description: string, CreatedDate: Date }>("SELECT Description, CreatedDate FROM Entry WHERE EntryId = ?", [t.EntryId]);
					return {
						...t,
						...e[0]
					}
				}))

				return helpers.render(res, "account", {
					title: account.AccountName,
					isNew: false,
					accountTypes: (await AccountTypes.find()).sort((a, b) => a.MinCode - b.MinCode),
					account,
					transactions: transactionsWithEntries
				})
			}
		}
	}));

	app.post("/account/:AccountNumber", helpers.wrap(async (req, res) => {
		if (req.params['AccountNumber'] == "new") {
			var account = await Account.construct(req.body);
			account.CreatedBy = req.token.id;
			await Account.create(account);
			await EventLog.createLog(req.token.id, "created new account '" + account.toString() + "'");
		}
		else {
			req.body['AccountNumber'] = +req.params['AccountNumber'];
			var oldAccount = await Account.findOne({ AccountNumber: req.params['AccountNumber'] });
			if (!oldAccount) {
				return helpers.render(res, '404');
			}

			var account = await Account.construct(req.body);
			await account.save();
			
			var diffs = helpers.diff(oldAccount, account);
			await EventLog.createLog(req.token.id, "edited account '" + oldAccount.toString() + "': " + diffs.toString());
		}
	}));

	app.delete("/account/:AccountNumber", helpers.wrap(async (req, res) => {
		req.body['AccountNumber'] = req.params['AccountNumber'];
		var account = await Account.findOne({ AccountNumber: req.params['AccountNumber'] });
		if (!account) {
			return helpers.render(res, '404');
		}
		else {
			await account.delete();
		}
	}));
}