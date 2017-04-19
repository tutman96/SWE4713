import express = require('express');
import helpers = require('../helpers');
import database = require('../database');

import Entry = require("../models/Entry");
import Account = require("../models/Account");

export = (app: express.Application) => {
	app.get("/", helpers.wrap(async (req, res) => {

		var accountTypeTotals = await database.query<{ AccountType: string, Month: number, Year: number, Total: number }>(`
				SELECT AccountType, SUM(Value) as Total, MONTH(CreatedDate) as Month, YEAR(CreatedDate) as Year FROM Transaction 
					JOIN Entry USING (EntryId) 
					JOIN Account USING (AccountNumber) 
					WHERE Entry.Type != "CLOSING" AND Entry.State = "APPROVED"
				GROUP BY AccountType, Month,Year`)

		var data = new Array<{ Month: number, Year: number, Totals: { [accountType: string]: number }, COGS: number }>();
		for (var accountTypeTotal of accountTypeTotals) {
			var entry = data.find((v) => v.Month == accountTypeTotal.Month && v.Year == accountTypeTotal.Year);
			if (entry) {
				entry.Totals[accountTypeTotal.AccountType] = accountTypeTotal.Total;
			}
			else {
				var totals = {};
				totals[accountTypeTotal.AccountType] = accountTypeTotal.Total;
				data.push({
					Month: accountTypeTotal.Month,
					Year: accountTypeTotal.Year,
					Totals: totals,
					COGS: (await database.query<{ Total: number }>(
						`SELECT SUM(Value) as Total FROM Transaction
							JOIN Entry USING (EntryId)
							WHERE Entry.Type != "CLOSING" 
								AND Entry.State = "Approved"
								AND AccountNumber = 523
								AND MONTH(CreatedDate) = ? AND YEAR(CreatedDate) = ?
						`, [accountTypeTotal.Month, accountTypeTotal.Year]))[0].Total
				})
			}
		}

		var ratios = data.map((entry) => {
			var assets = entry.Totals['Asset'];
			var liabilities = entry.Totals['Liability'];
			var equities = entry.Totals['Equity'];
			var revenues = entry.Totals['Revenue'];
			var expenses = entry.Totals['Expense'];
			
			var cogs = entry.COGS;
			var ebit = revenues - expenses;
			var ni = ebit;
			var sales = revenues

			return {
				Month: entry.Month,
				Year: entry.Year,
				
				// Total Asset Turnover
				TAT: sales / assets,
				
				// Debt Ratio
				DR: liabilities / assets,
				
				// Profit Margin
				PM: ni / expenses,
				// Operating Profit Margin
				OPM: ebit / revenues,
				// Gross Profit Margin
				GPM: (sales - cogs) / sales,
				
				// Basic Earning Power
				BEP: ebit / assets,
				
				// Return on Assets
				ROA: ni / assets,
				// Return on Equity
				ROE: ni / equities
			}
		})

		return helpers.render(res, 'dashboard', {
			title: "Dashboard",
			data: ratios
		})
	}))
}