import database = require('../database');
import { default as queryBuilder, query } from '../querybuilder';

import AccountType = require('./AccountType');

class Account {
	AccountNumber: number;
	AccountType: AccountType;
	AccountName: string;
	InitialBalance: number;
	SortOrder: number;
	Active: boolean;
	CreatedTime: Date;
	CreatedBy: number /* TODO: User */

	static async construct(props: {[K in keyof Account]: Account[K]}) {
		var at = new Account();
		at.AccountNumber = props.AccountNumber;

		var accountType: string = <any>props.AccountType;
		at.AccountType = await AccountType.findOne({ AccountType: accountType });

		at.AccountName = props.AccountName;
		at.InitialBalance = props.InitialBalance;
		at.SortOrder = props.SortOrder;
		at.Active = (typeof props.Active == "string" ? (props.Active == "true") : !!props.Active);
		at.CreatedTime = props.CreatedTime;
		at.CreatedBy = props.CreatedBy;
		return at;
	}

	private static builder = queryBuilder<Account>("Account")
	static async find(query: query<Account> = {}) {
		var sql = this.builder(query);
		var results = await database.query<any>(sql);
		return Promise.all(results.map(this.construct))
	}

	static async findOne(query: query<Account>) {
		var sql = this.builder(query, 1);
		var results = await database.query<any>(sql);
		return results.length && this.construct(results[0]);
	}

	static async create(account: Account) {
		await database.query("INSERT INTO Account (AccountNumber, AccountType, AccountName, InitialBalance, SortOrder, Active, CreatedTime, CreatedBy) VALUES (?,?,?,?,?,?,NOW(),0)",
			[account.AccountNumber, account.AccountType.AccountType, account.AccountName, account.InitialBalance, account.SortOrder, +account.Active])
	}
	
	async save() {		
		await database.query("UPDATE Account SET AccountType = ?, AccountName = ?, InitialBalance = ?, SortOrder = ?, Active = ? WHERE AccountNumber = ?",
			[this.AccountType.AccountType, this.AccountName, this.InitialBalance, this.SortOrder, +this.Active, this.AccountNumber])
	}
	
	async delete() {
		await database.query("DELETE FROM Account WHERE AccountNumber = ?", [this.AccountNumber])
	}
}

export = Account;