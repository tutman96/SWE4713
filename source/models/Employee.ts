import database = require('../database');
import { default as queryBuilder, query } from '../querybuilder';

import Account = require('./Account');

class Employee {
	EmployeeId: number;
	Username: string;
	PassHash: string;
	Permissions: object;
	Disabled: boolean;

	static allPermissions = ["employee.edit"];

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
	static async find(query: query<Employee> = {}, limit: number, offset: number, sort: string) {
		var sql = this.builder(query, limit, offset, sort);
		var results = await database.query<any>(sql);
		return Promise.all(results.map(this.construct))
	}

	static async findOne(query: query<Employee>) {
		var sql = this.builder(query, 1);
		var results = await database.query<any>(sql);
		return results.length && this.construct(results[0]);
	}

	static async count() {
		return (await database.query<{ count: number }>("SElECT COUNT(*) as count FROM Employee"))[0].count;
	}

	static async create(entry: Employee) {
		await database.query("INSERT INTO Employee (Username, PassHash, Permissions, Disabled) VALUES (?,?,?,?)",
			[entry.Username, entry.PassHash, JSON.stringify(entry.Permissions), +false])
	}

	async save() {
		await database.query("UPDATE Employee SET Username = ?, PassHash = ?, Permissions = ?, Disabled = ? WHERE EmployeeId = ?",
			[this.Username, this.PassHash, JSON.stringify(this.Permissions), this.Disabled, this.EmployeeId]);
	}
}
export = Employee;