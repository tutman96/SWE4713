import express = require('express');
import helpers = require('../helpers');

import Entry = require("../models/Entry");
import Account = require("../models/Account");

export = (app: express.Application) => {
	app.get("/ledger", helpers.wrap(async (req, res) => {
		var page = +req.query['page'] || 1;
		var maxEntries = 5;
		
		var sort: string = req.query['sort'] || "EntryId";

		var [entries, numEntries] = await Promise.all([
			Entry.find({}, maxEntries, maxEntries * (page - 1), sort),
			Entry.count()
		])

		var entriesWithTotals = entries.map((e) => {
			var totalDebits = 0;
			var totalCredits = 0;

			e.transactions.forEach((t) => {
				if ((t.account.AccountType.IncreaseEntry == "CREDIT" && t.Value > 0) || (t.account.AccountType.IncreaseEntry == "DEBIT") && t.Value < 0) {
					totalCredits += Math.abs(t.Value);
				}
				else {
					totalDebits += Math.abs(t.Value);
				}
			})

			return {
				...e,
				totalDebits,
				totalCredits
			}
		})

		return helpers.render(res, 'ledger', {
			entries: entriesWithTotals,
			sort,
			page,
			totalPages: Math.ceil(numEntries / maxEntries)
		});
	}));
}