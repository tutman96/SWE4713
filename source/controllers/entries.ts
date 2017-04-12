import express = require('express');
import helpers = require('../helpers');

import Entry = require("../models/Entry");
import Account = require("../models/Account");
import EventLog = require("../models/EventLog");

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

			e.transactions = e.transactions.map((t) => {
				if ((t.account.AccountType.IncreaseEntry == "CREDIT" && t.Value > 0) || (t.account.AccountType.IncreaseEntry == "DEBIT") && t.Value < 0) {
					totalCredits += Math.abs(t.Value);
					return {
						...t,
						Value: Math.abs(t.Value),
						account: {
							...t.account,
							AccountType: {
								...t.account.AccountType,
								IncreaseEntry: "CREDIT" as any
							}
						}
					} as any
				}
				else {
					totalDebits += Math.abs(t.Value);
					return {
						...t,
						Value: Math.abs(t.Value),
						account: {
							...t.account,
							AccountType: {
								...t.account.AccountType,
								IncreaseEntry: "DEBIT"
							}
						}
					} as any
				}
			})

			e.transactions = e.transactions.sort((a, b) => (a.account.AccountType.IncreaseEntry == "DEBIT" ? -1 : 1))

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
					transactions: [],
					files: []
				},
				accounts: (await Account.find({ Active: true })).sort((a, b) => a.SortOrder - b.SortOrder)
			})
		}
		else {
			var entry = await Entry.findOne({ EntryId: req.params['EntryId'] });
			if (!entry) {
				return helpers.render(res, '404')
			}

			entry.transactions = entry.transactions.map((t) => ({
				...t,
				Value: Math.abs(t.Value),
				account: {
					...t.account,
					AccountType: {
						...t.account.AccountType,
						IncreaseEntry: ((t.account.AccountType.IncreaseEntry == "CREDIT" && t.Value > 0) || (t.account.AccountType.IncreaseEntry == "DEBIT") && t.Value < 0 ? "CREDIT" : "DEBIT")
					}
				}
			} as any))

			entry.transactions = entry.transactions.sort((a, b) => (a.account.AccountType.IncreaseEntry == "DEBIT" ? -1 : 1))

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
			await EventLog.createLog(req.token.id, "created entry '" + entry.toString() + "'")
			return {
				EntryId: entry.EntryId
			}
		}
		else {
			var oldEntry = await Entry.findOne({ EntryId: req.params.EntryId });
			if (!oldEntry) {
				return helpers.render(res, '404');
			}
			req.body.EntryId = +req.params.EntryId
			var entry = await Entry.construct(req.body);
			await entry.save();

			var diffs = helpers.diff(oldEntry, entry);

			for (var i = 0; i < diffs.length; i++) {
				if (diffs[i].Field == "transactions") {
					diffs[i] = {
						Field: diffs[i].Field,
						From: diffs[i].From['map']((t) => t.toString())['join'](', '),
						To: diffs[i].To['map']((t) => t.toString())['join'](', ')
					}
				}
			}
			diffs.fieldsToHide.push("files");

			if (diffs.length) {
				await EventLog.createLog(req.token.id, "edited entry '" + oldEntry.toString() + "': " + diffs.toString());
			}
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

		await EventLog.createLog(req.token.id, "posted entry '" + entry.toString() + "'");
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

		await EventLog.createLog(req.token.id, "declined entry '" + entry.toString() + "' because '" + entry.DeclinedReason + "'");
	}))
}