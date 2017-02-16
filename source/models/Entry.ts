import database = require('../database');
import { default as queryBuilder, query } from '../querybuilder';

import Transaction = require('./Transaction');

class Entry {
	EntryId: number;
	JournalId: number;
	Description: string;
	CreatedDate: Date;

	transactions?: Array<Transaction>;

	static async construct(props: {[K in keyof Entry]: Entry[K]}) {
		var j = new Entry();
		j.EntryId = props.EntryId;
		j.JournalId = props.JournalId;
		j.Description = props.Description;
		j.CreatedDate = props.CreatedDate;

		if (props.transactions) {
			j.transactions = [];
			for (var t of props.transactions) {
				j.transactions.push(await Transaction.construct(t))
			}
		}
		else if (j.EntryId) {
			j.transactions = await Transaction.find({ EntryId: j.EntryId });
		}
		else {
			j.transactions = []
		}

		return j;
	}

	private static builder = queryBuilder<Entry>("Entry")
	static async find(query: query<Entry> = {}) {
		var sql = this.builder(query);
		var results = await database.query<any>(sql);
		return Promise.all(results.map(this.construct))
	}

	static async findOne(query: query<Entry>) {
		var sql = this.builder(query, 1);
		var results = await database.query<any>(sql);
		return results.length && this.construct(results[0]);
	}

	static async create(entry: Entry) {
		var res = await database.query("INSERT INTO Entry (JournalId, Description) VALUES (?,?)",
			[entry.JournalId, entry.Description])

		for (var transaction of entry.transactions) {
			transaction.EntryId = res.insertId;
			await Transaction.create(transaction);
		}
	}

	async save() {
		await database.query("UPDATE Entry SET Description = ? WHERE EntryId = ?",
			[this.Description, this.EntryId]);

		var oldTransactions = await Transaction.find({ EntryId: this.EntryId });
		
		for (var t of this.transactions) {
			var found = false;
			for (var t2 of oldTransactions) {
				if (t.equals(t2)) {
					found = true;
					await t.save();
					break;
				}
			}
			if (!found) {
				await Transaction.create(t);
			}
		}
		
		for (var t of oldTransactions) {
			var found = false;
			for (var t2 of this.transactions) {
				if (t.equals(t2)) {
					found = true;
					break;
				}
			}
			if (!found) {
				await t.delete();
			}
		}
	}

	async delete() {
		await database.query("DELETE FROM Journal WHERE JournalId = ?", [this.EntryId])
		for (var transaction of this.transactions) {
			await transaction.delete();
		}
	}
}

export = Entry;