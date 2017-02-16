import express = require('express');
import wrapper = require('../asyncWrapper');

import Journal = require("../models/Journal");
import Entry = require("../models/Entry");
import Account = require("../models/Account");

export = (app: express.Application) => {
	app.get("/entry/:EntryId", wrapper(async (req, res) => {
		if (req.params['EntryId'] == "new") {
			var openJournals = await Journal.find({ Closed: false });
			var journal = openJournals.sort((a, b) => b.JournalId - a.JournalId)[0];

			res.render('entry', {
				title: "New Entry for " + journal.Description,
				isNew: true,
				isEditable: true,
				entry: {
					JournalId: journal.JournalId,
					transactions: []
				},
				accounts: (await Account.find()).sort((a, b) => a.SortOrder - b.SortOrder)
			})
		}
		else {
			var entry = await Entry.findOne({ EntryId: req.params['EntryId'] });
			if (!entry) {
				res.status(404)
				res.render('404')
				return;
			}

			res.render('entry', {
				title: entry.Description,
				isNew: false,
				isEditable: false,
				entry: entry,
				accounts: (await Account.find()).sort((a, b) => a.SortOrder - b.SortOrder)
			})
		}
	}));

	app.post("/entry/:EntryId", wrapper(async (req, res) => {
		if (req.params['EntryId'] == "new") {
			var entry = await Entry.construct(req.body);
			await Entry.create(entry);
		}
		else {
			var oldEntry = await Entry.findOne({ EntryId: req.params.EntryId });
			if (!oldEntry) {
				res.status(404);
				res.render('404');
				return;
			}
			req.body.EntryId = req.params.EntryId
			var entry = await Entry.construct(req.body);
			await entry.save();
		}
	}))
}