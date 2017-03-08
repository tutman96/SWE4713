import database = require('../database');
import { default as queryBuilder, query } from '../querybuilder';

import Account = require('./Account');
import Entry = require('./Entry');

class Transaction {
	EntryId: number;
	AccountNumber: number;
	Value: number;

	account: Account;

	static async construct(props: {[K in keyof Transaction]: Transaction[K]}) {
		var t = new Transaction();
		t.EntryId = props.EntryId;
		t.AccountNumber = props.AccountNumber;
		t.Value = props.Value;

		t.account = await Account.findOne({ AccountNumber: t.AccountNumber });

		return t;
	}

	private static builder = queryBuilder<Transaction>("Transaction")
	static async find(query: query<Transaction> = {}) {
		var sql = this.builder(query);
		var results = await database.query<any>(sql);
		return Promise.all(results.map(this.construct))
	}

	static async findOne(query: query<Transaction>) {
		var sql = this.builder(query, 1);
		var results = await database.query<any>(sql);
		return results.length && this.construct(results[0]);
	}

	static async create(transaction: Transaction) {
		await database.query("REPLACE INTO Transaction (EntryId, AccountNumber, Value) VALUES (?,?,?)",
			[transaction.EntryId, transaction.AccountNumber, transaction.Value])
	}

	async save() {
		await database.query("UPDATE Transaction SET Value = ? WHERE EntryId = ? AND AccountNumber = ?",
			[+this.Value, this.EntryId, this.AccountNumber])
	}

	async delete() {
		await database.query("DELETE FROM Transaction WHERE EntryId = ? AND AccountNumber = ?", [this.EntryId, this.AccountNumber])
	}

	equals(transaction: Transaction) {
		return this.AccountNumber == transaction.AccountNumber && this.EntryId == transaction.EntryId
	}
}

export = Transaction;