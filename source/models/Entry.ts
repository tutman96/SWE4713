import database = require('../database');
import { default as queryBuilder, query } from '../querybuilder';

import Transaction = require('./Transaction');
import File = require('./File');

class Entry {
	EntryId: number;
	Description: string;
	CreatedDate: Date;
	State: "PENDING" | "APPROVED" | "DECLINED";
	DeclinedReason: string;

	transactions?: Array<Transaction>;
	files?: Array<File>;

	static async construct(props: {[K in keyof Entry]: Entry[K]}) {
		var j = new Entry();
		j.EntryId = props.EntryId;
		j.State = props.State || "PENDING";
		j.Description = props.Description;
		j.CreatedDate = new Date(props.CreatedDate);
		j.DeclinedReason = props.DeclinedReason;

		if (props.transactions) {
			j.transactions = [];
			for (var t of props.transactions) {
				j.transactions.push(await Transaction.construct(t))
			}
		}
		else if (j.EntryId) {
			[j.transactions, j.files] = await Promise.all([
				Transaction.find({ EntryId: j.EntryId }),
				File.find({ EntryId: j.EntryId })
			]);
		}
		else {
			j.transactions = []
			j.files = [];
		}

		return j;
	}

	private static builder = queryBuilder<Entry>("Entry")
	static async find(query: query<Entry> = {}, limit?: number, offset?: number, sort?: string) {
		var sql = this.builder(query, limit, offset, sort);
		var results = await database.query<any>(sql);
		return Promise.all(results.map(this.construct))
	}

	static async count() {
		return (await database.query<{ count: number }>("SElECT COUNT(*) as count FROM Entry"))[0].count;
	}

	static async findOne(query: query<Entry>) {
		var sql = this.builder(query, 1);
		var results = await database.query<any>(sql);
		return results.length && this.construct(results[0]);
	}

	static async create(entry: Entry) {
		var res = await database.query("INSERT INTO Entry (Description, CreatedDate, State) VALUES (?,?,?)",
			[entry.Description, entry.CreatedDate, "PENDING"])
		
		entry.EntryId = res.insertId;
		
		for (var transaction of entry.transactions) {
			transaction.EntryId = res.insertId;
			await Transaction.create(transaction);
		}
		return res.insertId;
	}

	async save() {
		await database.query("UPDATE Entry SET Description = ?, CreatedDate = ?, State = ?, DeclinedReason = ? WHERE EntryId = ?",
			[this.Description, this.CreatedDate, this.State, this.DeclinedReason, this.EntryId]);

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
		await database.query("DELETE FROM Entry WHERE EntryId = ?", [this.EntryId])
		for (var transaction of this.transactions) {
			await transaction.delete();
		}
	}
}

export = Entry;