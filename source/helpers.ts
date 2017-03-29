import express = require('express');
import Employee = require('./models/Employee');

export interface Request extends express.Request {
	token: {
		id: number,
		username: string,
		permissions: object,
		exp?: number
	},
	files?: {
		[key: string]: {
			name: string,
			mv: (path: string, callback: (err?) => void) => void,
			mimetype: string,
			data: Buffer
		}
	}
}

export type Response = express.Response;
export type app = express.Application;

export function wrap(handler: (req: Request, res: Response, next?: express.NextFunction) => Promise<any>) {
	return function (req: Request, res: Response, next: express.NextFunction) {
		try {
			var p = handler.apply(undefined, [req, res, next]);
		} catch (e) {
			next(e);
		}
		if (p.catch && p.then) {
			p.then((r) => {
				if (!res.finished) {
					if (r == null || r == undefined) {
						return res.status(204).end();
					}
					else if (typeof r == "object") {
						res.json(r);
						return res.end();
					}
					else {
						res.write(r);
						return res.end();
					}
				}
			})
			return p.catch(next);
		}
	};
}

export function render(res: Response, template: string, data?: any) {
	if (template == '404') res.status(404);
	else if (template == '401') res.status(401);
	return new Promise<string>((resolve, reject) => {
		res.render(template, data, (err, html) => {
			if (err) reject(err);
			else resolve(html);
		})
	})
}

export class DiffArray<T> extends Array<{ Field: keyof T, From: T[keyof T], To: T[keyof T] }> {
	fieldsToHide = new Array<keyof T>();

	toString() {
		return this.map((diff) => {
			if (this.fieldsToHide.indexOf(diff.Field) != -1) {
				return diff.Field
			}
			else {
				return diff.Field + " from '" + JSON.stringify(diff.From) + "' to '" + JSON.stringify(diff.To) + "'"
			}
		}).join(", ");
	}
}

function equals(x, y) {
	if (x == undefined || y == undefined) return true;
	if (x == y) return true;
	if (!(x instanceof Object) || !(y instanceof Object)) return false;
	if (x.constructor !== y.constructor) return false;
	
	if (x.toString && x.toString() != y.toString()) return false;

	for (var p in x) {
		if (!x.hasOwnProperty(p)) continue;
		if (!y.hasOwnProperty(p)) return false;
		if (x[p] === y[p]) continue;
		if (typeof (x[p]) !== "object") return false;
		if (!equals(x[p], y[p])) return false;
	}

	for (p in y) {
		if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) return false;
	}
	return true;
}

export function diff<T>(oldObject: T, newObject: T) {
	var diffs = new DiffArray<T>();
	for (var k in newObject) {
		console.log("Testing " + k + ":", newObject[k], oldObject[k]);
		if (!equals(newObject[k], oldObject[k])) {
			diffs.push({
				Field: k,
				From: oldObject[k],
				To: newObject[k]
			})
		}
	}

	return diffs;
}