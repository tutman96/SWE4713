import express = require('express');
export = (handler: (req: express.Request, res: express.Response) => Promise<any>) => {
	return async (req: express.Request, res: express.Response) => {
		try {
			var results = await handler(req, res);
			if (!res.finished) {
				if (!results) res.status(204);
				res.end(results);
			}
		}
		catch (e) {
			console.error(e);
			if (!res.finished) {
				if (!res.headersSent) {
					if (e.code) {
						res.status(e.code);
					}
					else {
						res.status(500);
					}
				}
				res.end(e.toString());
			}
			else res.end();
		}
	}
}