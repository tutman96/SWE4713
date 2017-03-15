import express = require('express');
import helpers = require('../helpers');
import database = require('../database');

import Entry = require("../models/Entry");
import Account = require("../models/Account");

export = (app: express.Application) => {
	app.get("/reports/trial-balance", helpers.wrap(async (req, res) => {
		var month = new Date().getMonth();
		var year = new Date().getFullYear();
		
		var startDate = (req.query['startDate'] ? new Date(req.query['startDate']) : new Date(year, month, 1));
		var endDate = (req.query['endDate'] ? new Date(req.query['endDate']) : new Date(year, month + 1, 0));

		var balances = await database.query<{ AccountNumber: number, AccountName: string, IncreaseEntry: "CREDIT" | "DEBIT", Value: number }>(`
		SELECT AccountNumber, AccountName, IncreaseEntry, COALESCE(SUM(Value),0) as Value FROM Account 
			LEFT JOIN Transaction USING (AccountNumber) 
			LEFT JOIN Entry USING (EntryId)
			JOIN AccountType USING (AccountType)
  			WHERE ((CreatedDate BETWEEN ? AND ?) OR CreatedDate IS NULL) AND (State = "APPROVED" OR State IS NULL)
			GROUP BY AccountNumber 
			ORDER BY IncreaseEntry DESC, SortOrder ASC`, [startDate, endDate])
		
		var totalDebit = balances.filter((b) => b.IncreaseEntry == "DEBIT").map((b) => b.Value).reduce((prev, current) => prev + current, 0);
		var totalCredit = balances.filter((b) => b.IncreaseEntry == "CREDIT").map((b) => b.Value).reduce((prev, current) => prev + current, 0);
		
		return helpers.render(res, 'reports/trial-balance', {
			title: "Trial Balance",
			totalDebit,
			totalCredit,
			startDate,
			endDate,
			balances
		})
	}))
}