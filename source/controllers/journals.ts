import express = require('express');
import wrapper = require('../asyncWrapper');

import Journal = require("../models/Journal");

export = (app: express.Application) => {
	app.get("/journals", wrapper(async (req, res) => {
		res.render('journals', {
			title: "Journals",
			journals: (await Journal.find({ Closed: true })).sort((a, b) => b.JournalId - a.JournalId)
		})
	}));

	app.get("/journal/:JournalId", wrapper(async (req, res) => {
		if (req.params['JournalId'] == "new") {
			res.render('journal', {
				title: "New Journal",
				message: "",
				isNew: true,
				isEditable: true,
				canBeOpened: false,
				journal: {
					Closed: true
				}
			})
		}
		else if (req.params['JournalId'] == "current") {
			var openJournals = await Journal.find({ Closed: false });
			var journal = openJournals.sort((a, b) => b.JournalId - a.JournalId)[0];
			if (!journal) {
				res.render('journal', {
					title: "New Journal",
					message: "There is no current journal. You need to make a new one or reopen a closed journal.",
					isNew: true,
					isEditable: true,
					canBeOpened: true,
					journal: {
						Closed: false
					}
				})
			}
			else {
				res.render('journal', {
					title: journal.Description,
					message: "",
					isNew: false,
					isEditable: true,
					canBeOpened: true,
					journal: journal
				})
			}
		}
		else {
			var journal = await Journal.findOne({ JournalId: req.params['JournalId'] });
			if (!journal) {
				res.status(404);
				res.render('404');
			}
			else {
				if (!journal.Closed) {
					res.status(302);
					res.location("/journal/current");
					res.end();
					return;
				}
				var openJournals = await Journal.find({ Closed: false });

				res.render('journal', {
					title: journal.Description,
					message: "",
					isNew: false,
					isEditable: false,
					canBeOpened: openJournals.length == 0,
					journal: journal
				})
			}
		}
	}));

	app.post("/journal/:JournalId", wrapper(async (req, res) => {
		if (req.params['JournalId'] == "new") {
			var journal = await Journal.construct(req.body);
			await Journal.create(journal);
		}
		else {
			var oldJournal = await Journal.findOne({ JournalId: req.params.JournalId });
			if (!oldJournal) {
				res.status(404);
				res.render('404');
				return;
			}
			req.body.JournalId = req.params.JournalId
			var journal = await Journal.construct({
				JournalId: +req.body.JournalId,
				Description: req.body.Description,
				Closed: req.body.Closed == 'true'
			} as any);
			await journal.save();
		}
	}))
}