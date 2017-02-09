var mosql = require('mongo-sql');
import database = require('./database')

type conditional<T, P extends keyof T> = {
	$or?: Array<conditional<T, P>>,
	$and?: Array<conditional<T, P>>,
	$equals?: T[P],
	$ne?: T[P],
	$gt?: T[P],
	$gte?: T[P],
	$lt?: T[P],
	$lte?: T[P],
	$null?: boolean,
	$notNull?: boolean,
	$like?: T[P],
	$ilike?: T[P],
	$in?: Array<T[P]>,
	$nin?: Array<T[P]>,
	limit?: number
}
export type query<T> = {[P in keyof T]?: T[P] | conditional<T, P>};

export default function <T extends Object>(table: string) {
	return function (query: query<T>, limit?: number) {
		var q: {
			query: string,
			values: Array<any>
		} = mosql.sql({
			type: 'select',
			table: table,
			where: query,
			limit: limit
		})

		for (var i in q.values) {
			var token = "$" + (+i + 1);
			q.query = q.query.replace(token, database.pool['escape'](q.values[i]));
		}
		q.query = q.query.replace(/"/g, "`");

		return q.query
	}
}