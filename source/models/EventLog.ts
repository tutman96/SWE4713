import fs = require('fs');
import path = require('path');

import database = require('../database');
import { default as queryBuilder, query } from '../querybuilder';

import Employee = require('./Employee');

class EventLog {
	EventLogId: number;
	Timestamp: Date;
	EmployeeId: number;
	Description: string;

	employee: Employee;

	static async construct(props: {[K in keyof EventLog]: EventLog[K]}) {
		var el = new EventLog();
		el.EventLogId = props.EventLogId;
		el.Timestamp = new Date(props.Timestamp);
		el.EmployeeId = props.EmployeeId;
		el.Description = props.Description;

		el.employee = await Employee.findOne({ EmployeeId: el.EmployeeId });

		return el;
	}

	private static builder = queryBuilder<EventLog>("EventLog")
	static async find(query: query<EventLog> = {}, limit?: number, offset?: number, sort?: string) {
		var sql = this.builder(query, limit, offset, sort);
		var results = await database.query<any>(sql);
		return Promise.all(results.map(this.construct))
	}
	
	static async count() {
		return (await database.query<{ count: number }>("SElECT COUNT(*) as count FROM EventLog"))[0].count;
	}

	static async findOne(query: query<EventLog>) {
		var sql = this.builder(query, 1);
		var results = await database.query<any>(sql);
		return results.length && this.construct(results[0]);
	}

	static async createLog(employeeId: number, description: string) {
		var el = new EventLog();
		el.Timestamp = new Date();
		el.EmployeeId = employeeId;
		el.Description = description;
		await this.create(el);
		return el;
	}

	static async create(entry: EventLog) {
		var res = await database.query("INSERT INTO EventLog (EmployeeId, Description) VALUES (?,?)",
			[entry.EmployeeId, entry.Description])
		entry.EventLogId = res.insertId;
	}
}
export = EventLog;