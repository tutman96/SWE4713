import express = require('express');
import Employee = require('./models/Employee');

export interface Request extends express.Request {
	token: {
		id: number,
		username: string,
		permissions: object,
		exp?: number
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