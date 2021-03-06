import mysql = require('mysql');

var pool = mysql.createPool({
	database: "appdomain",
	user: "appdomain",
	host: process.env.MYSQL_HOST || "localhost",
	connectionLimit: 5
});

interface queryResults<T> extends Array<T> {
	/**
	 * If you are inserting a row into a table with an auto increment primary key, you can retrieve the insert id like this
	 */
	insertId?: number
	
	/**
	 * You can get the number of affected rows from an insert, update or delete statement.
	 */
	affectedRows: number
	
	/**
	 * You can get the number of changed rows from an update statement.
	 * 
	 * "changedRows" differs from "affectedRows" in that it does not count updated rows whose values were not changed.
	 */
	changedRows: number
}
export = {
	query: async <T>(sql: string, params?: Array<any>) => {
		return new Promise<queryResults<T>>((resolve, reject) => {
			var start = process.hrtime();
			var q = pool.query(sql, params || [], (err, results) => {
				var time = process.hrtime(start);
				console.log("Database " + q.sql + " (" + (time[1]/1e6).toFixed(2) + " ms)");
				if (err) {
					console.error("Error executing SQL statement for query", q.sql, err);
					reject(err);
				}
				else resolve(results);
			})
		})
	},
	pool
}