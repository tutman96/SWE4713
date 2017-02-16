import database = require('../database');
import { default as queryBuilder, query } from '../querybuilder';

class Journal {
	JournalId: number;
	Description: string;
	Closed: boolean

	static async construct(props: {[K in keyof Journal]: Journal[K]}) {
		var j = new Journal();
		j.JournalId = props.JournalId;
		j.Description = props.Description;
		j.Closed = props.Closed;
		return j;
	}

	private static builder = queryBuilder<Journal>("Journal")
	static async find(query: query<Journal> = {}) {
		var sql = this.builder(query);
		var results = await database.query<any>(sql);
		return Promise.all(results.map(this.construct))
	}

	static async findOne(query: query<Journal>) {
		var sql = this.builder(query, 1);
		var results = await database.query<any>(sql);
		return results.length && this.construct(results[0]);
	}

	static async create(account: Journal) {
		await database.query("INSERT INTO Journal (Description) VALUES (?)",
			[account.Description])
	}

	async save() {
		console.log(this);
		await database.query("UPDATE Journal SET Description = ?, Closed = ? WHERE JournalId = ?",
			[this.Description, +this.Closed, this.JournalId])
	}

	async delete() {
		await database.query("DELETE FROM Journal WHERE JournalId = ?", [this.JournalId])
	}
}

export = Journal;