import database = require('../database');
import { default as queryBuilder, query } from '../querybuilder';

export = AccountType;
class AccountType {
	AccountType: string
	MinCode: number
	MaxCode: number
	IncreaseEntry: 'CREDIT' | 'DEBIT'

	private static async construct(props: {[K in keyof AccountType]: AccountType[K]}) {
		var at = new AccountType();
		at.AccountType = props.AccountType;
		at.MinCode = props.MinCode;
		at.MaxCode = props.MaxCode;
		at.IncreaseEntry = props.IncreaseEntry;
		return at;
	}

	private static builder = queryBuilder<AccountType>("AccountType")
	static async find(query: query<AccountType>) {
		var sql = this.builder(query);
		var results = await database.query<any>(sql);
		return Promise.all(results.map(this.construct))
	}
	
	static async findOne(query: query<AccountType>) {
		var sql = this.builder(query, 1);
		var results = await database.query<any>(sql);
		return results.length && this.construct(results[0]);
	}
}