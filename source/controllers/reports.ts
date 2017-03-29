import express = require('express');
import helpers = require('../helpers');
import database = require('../database');

import Entry = require("../models/Entry");
import Account = require("../models/Account");

export = (app: express.Application) => {
	app.get("/reports/trial-balance", helpers.wrap(async (req, res) => {
		var startDate = (req.query['startDate'] ? new Date(req.query['startDate']) : new Date(0));
		var endDate = (req.query['endDate'] ? new Date(req.query['endDate']) : new Date());

		var balances = await database.query<{ AccountNumber: number, AccountName: string, IncreaseEntry: "CREDIT" | "DEBIT", Value: number }>(`
		SELECT AccountNumber, AccountName, IncreaseEntry, SUM(Value) as Value FROM Account 
			JOIN Transaction USING (AccountNumber) 
			JOIN Entry USING (EntryId)
			JOIN AccountType USING (AccountType)
  			WHERE 
				(CreatedDate BETWEEN ? AND ?) AND 
				State = "APPROVED" AND
				Account.Active = 1
			GROUP BY AccountNumber 
			ORDER BY SortOrder ASC`, [startDate, endDate])

		// var totalDebit = balances.filter((b) => b.IncreaseEntry == "DEBIT").map((b) => b.Value).reduce((prev, current) => prev + current, 0);
		// var totalCredit = balances.filter((b) => b.IncreaseEntry == "CREDIT").map((b) => b.Value).reduce((prev, current) => prev + current, 0);
		var totalDebit = 0;
		var totalCredit = 0;

		balances.forEach((balance) => {
			if ((balance.IncreaseEntry == "CREDIT" && balance.Value > 0) || (balance.IncreaseEntry == "DEBIT" && balance.Value < 0)) {
				totalCredit += Math.abs(balance.Value)
			}
			else if ((balance.IncreaseEntry == "DEBIT" && balance.Value > 0) || (balance.IncreaseEntry == "CREDIT" && balance.Value < 0)) {
				totalDebit += Math.abs(balance.Value)
			}
		})

		return helpers.render(res, 'reports/trial-balance', {
			title: "Trial Balance",
			totalDebit,
			totalCredit,
			startDate,
			endDate,
			balances
		})
	}))


	app.get("/reports/income-statement", helpers.wrap(async (req, res) => {
		var startDate = (req.query['startDate'] ? new Date(req.query['startDate']) : new Date(0));
		var endDate = (req.query['endDate'] ? new Date(req.query['endDate']) : new Date());

		var balances = await database.query<{ AccountNumber: number, AccountName: string, AccountType: "Revenue" | "Expense", Value: number }>(`
		SELECT AccountNumber, AccountName, AccountType, COALESCE(SUM(Value),0) as Value FROM Account 
			LEFT JOIN Transaction USING (AccountNumber) 
			LEFT JOIN Entry USING (EntryId)
			JOIN AccountType USING (AccountType)
  			WHERE 
				CreatedDate BETWEEN ? AND ? AND 
				State = "APPROVED" AND
				Account.Active = 1 AND 
				(AccountType.AccountType = 'Expense' OR AccountType.AccountType = 'Revenue')
			GROUP BY AccountNumber 
			ORDER BY IncreaseEntry DESC, SortOrder ASC`, [startDate, endDate])

		var revenues = balances.filter((b) => b.AccountType == "Revenue");
		var expenses = balances.filter((b) => b.AccountType == "Expense")

		return helpers.render(res, 'reports/income-statement', {
			title: "Income Statement",
			revenues,
			expenses,
			startDate,
			endDate
		})
	}))

	app.get("/reports/balance-sheet", helpers.wrap(async (req, res) => {
		var startDate = (req.query['startDate'] ? new Date(req.query['startDate']) : new Date(0));
		var endDate = (req.query['endDate'] ? new Date(req.query['endDate']) : new Date());

		var balances = await database.query<{ AccountNumber: number, AccountName: string, AccountType: "Asset" | "Liability" | "Equity", Value: number }>(`
		SELECT AccountNumber, AccountName, AccountType, COALESCE(SUM(Value),0) as Value FROM Account 
			LEFT JOIN Transaction USING (AccountNumber) 
			LEFT JOIN Entry USING (EntryId)
			JOIN AccountType USING (AccountType)
  			WHERE 
				CreatedDate BETWEEN ? AND ? AND 
				State = "APPROVED" AND
				Account.Active = 1 AND 
				(AccountType.AccountType = 'Asset' OR AccountType.AccountType = 'Liability' OR AccountType.AccountType = 'Equity')
			GROUP BY AccountNumber 
			ORDER BY IncreaseEntry DESC, SortOrder ASC`, [startDate, endDate])

		var assets = balances.filter((b) => b.AccountType == "Asset");
		var liabilities = balances.filter((b) => b.AccountType == "Liability")
		var equities = balances.filter((b) => b.AccountType == "Equity")

		var totalAssets = assets.reduce((total, asset) => total + asset.Value, 0);
		var totalLiabilities = liabilities.reduce((total, liability) => total + liability.Value, 0);
		var totalEquities = equities.reduce((total, equity) => total + equity.Value, 0);

		var { TotalRevenue, TotalExpense } = (await database.query<{ TotalRevenue: number, TotalExpense: number }>(`SELECT (
			SELECT COALESCE(SUM(Value),0) FROM Account
			LEFT JOIN Transaction USING (AccountNumber) 
			LEFT JOIN Entry USING (EntryId)
			JOIN AccountType USING (AccountType)
					WHERE 
				CreatedDate BETWEEN ? AND ? AND 
				State = "APPROVED" AND
				Account.Active = 1 AND Account.AccountType = 'Revenue'
		) as TotalRevenue, (
			SELECT COALESCE(SUM(Value),0) FROM Account
			LEFT JOIN Transaction USING (AccountNumber) 
			LEFT JOIN Entry USING (EntryId)
			JOIN AccountType USING (AccountType)
					WHERE 
				CreatedDate BETWEEN ? AND ? AND 
				State = "APPROVED" AND
				Account.Active = 1 AND Account.AccountType = 'Expense'
		) as TotalExpense`, [startDate, endDate, startDate, endDate]))[0]
		
		var retainedEarnings = TotalRevenue - TotalExpense;
		totalEquities += retainedEarnings;
		
		return helpers.render(res, 'reports/balance-sheet', {
			title: "Balance Sheet",
			assets,
			liabilities,
			equities,

			totalAssets,
			totalLiabilities,
			totalEquities,

			retainedEarnings,
			
			startDate,
			endDate
		})
	}))
}