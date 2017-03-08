import database = require('../database');
import { default as queryBuilder, query } from '../querybuilder';

import Account = require('./Account');

class Employee {
	EmployeeId: number;
	Username: string;
	PassHash: string;
	Permissions: object;
	Disabled: boolean;

	static async construct(props: {[K in keyof Employee]: Employee[K]}) {
		var e = new Employee();
		e.EmployeeId = props.EmployeeId;
		e.Username = props.Username;
		e.PassHash = props.PassHash;
		e.Permissions = (typeof props.Permissions == "string" ? JSON.parse(props.Permissions) : props.Permissions);
		e.Disabled = props.Disabled;

		return e;
	}

	private static builder = queryBuilder<Employee>("Employee")
	static async find(query: query<Employee> = {}) {
		var sql = this.builder(query);
		var results = await database.query<any>(sql);
		return Promise.all(results.map(this.construct))
	}

	static async findOne(query: query<Employee>) {
		var sql = this.builder(query, 1);
		var results = await database.query<any>(sql);
		return results.length && this.construct(results[0]);
	}

	static async create(entry: Employee) {
		await database.query("INSERT INTO Employee (Username, PassHash, Permissions, Disabled) VALUES (?,?,?,?)",
			[entry.Username, entry.PassHash, entry.Permissions, +false])
	}
}
export = Employee;