import express = require('express');
import helpers = require('../helpers');

import Entry = require("../models/Entry");
import Account = require("../models/Account");

export = (app: express.Application) => {
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