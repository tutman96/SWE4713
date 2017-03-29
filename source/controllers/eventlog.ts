import express = require('express');
import helpers = require('../helpers');
import fs = require('fs');

import Employee = require("../models/Employee");
import EventLog = require("../models/EventLog");

export = (app: express.Application) => {
	app.get("/eventlog", helpers.wrap(async (req, res) => {
		var page = +req.query['page'] || 1;
		var maxEntries = 20;

		var sort: string = req.query['sort'] || "-EventLogId";

		var [eventLogs, numEventLogs] = await Promise.all([
			EventLog.find({}, maxEntries, maxEntries * (page - 1), sort),
			EventLog.count()
		])
		
		return helpers.render(res, 'eventlog', {
			title: "Event Log",
			eventLogs: eventLogs,
			sort,
			page,
			totalPages: Math.ceil(numEventLogs / maxEntries)
		})
	}))
}