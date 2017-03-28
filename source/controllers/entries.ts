import express = require('express');
import helpers = require('../helpers');

import Entry = require("../models/Entry");
import Account = require("../models/Account");

export = (app: express.Application) => {
	app.get("/entries", helpers.wrap(async (req, res) => {
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

		return helpers.render(res, 'entries', {
			entries: entriesWithTotals,
			sort,
			page,
			totalPages: Math.ceil(numEntries / maxEntries)
		});
	}));
	
	app.get("/entry/:EntryId", helpers.wrap(async (req, res) => {
		if (req.params['EntryId'] == "new") {
			return helpers.render(res, 'entry', {
				title: "New Journal Entry",
				isNew: true,
				isEditable: true,
				entry: {
					Description: "",
					State: "PENDING",
					transactions: []
				},
				accounts: (await Account.find({ Active: true })).sort((a, b) => a.SortOrder - b.SortOrder)
			})
		}
		else {
			var entry = await Entry.findOne({ EntryId: req.params['EntryId'] });
			if (!entry) {
				return helpers.render(res, '404')
			}

			return helpers.render(res, 'entry', {
				title: entry.Description,
				isNew: false,
				isEditable: false,
				entry: entry,
				accounts: (await Account.find({ Active: true })).sort((a, b) => a.SortOrder - b.SortOrder)
			})
		}
	}));

	app.post("/entry/:EntryId", helpers.wrap(async (req, res) => {
		if (req.params['EntryId'] == "new") {
			var entry = await Entry.construct(req.body);
			await Entry.create(entry);
		}
		else {
			var oldEntry = await Entry.findOne({ EntryId: req.params.EntryId });
			if (!oldEntry) {
				return helpers.render(res, '404');
			}
			req.body.EntryId = req.params.EntryId
			var entry = await Entry.construct(req.body);
			await entry.save();
		}
	}))

	app.post("/entry/:EntryId/approve", helpers.wrap(async (req, res) => {
		var entry = await Entry.findOne({ EntryId: req.params['EntryId'] });
		if (!entry) {
			return helpers.render(res, '404');
		}
		if (entry.State != "PENDING") return;
		entry.State = "APPROVED";
		await entry.save();
	}))

	app.post("/entry/:EntryId/decline", helpers.wrap(async (req, res) => {
		var entry = await Entry.findOne({ EntryId: req.params['EntryId'] });
		if (!entry) {
			return helpers.render(res, '404');
		}
		if (entry.State != "PENDING") return;
		entry.State = "DECLINED";
		entry.DeclinedReason = req.body['DeclinedReason'];
		await entry.save();
	}))
}