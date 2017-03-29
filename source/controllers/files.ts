import express = require('express');
import helpers = require('../helpers');
import fs = require('fs');

import Entry = require("../models/Entry");
import Account = require("../models/Account");
import File = require("../models/File");
import EventLog = require("../models/EventLog");

export = (app: express.Application) => {
	app.get("/file/:FileId/:Filename", helpers.wrap(async (req, res) => {
		var file = await File.findOne({ FileId: +req.params['FileId'] });
		if (!file) {
			return helpers.render(res, '404');
		}

		res.header('content-type', file.MimeType);
		res.header('content-length', file.Size.toString());
		
		var entry = await Entry.findOne({EntryId: file.EntryId});
		await EventLog.createLog(req.token.id, "downloaded file '" + file.Filename + "' for entry '" + entry.toString() + "'");
		
		await new Promise((resolve, reject) => {
			fs.exists(file.Path, (exists) => {
				if (!exists) return reject("File not found");
				
				var stream = fs.createReadStream(file.Path).pipe(res);
				stream.on("error", (err) => {
					console.error(err);
					reject(err);
				})
				stream.on("close", () => {
					resolve();
				})
			})
		})
	}))

	app.post('/file/:FileId', helpers.wrap(async (req, res) => {
		console.log(req.files);
		if (req.params['FileId'] == "new") {
			var file = await File.construct({ EntryId: req.query['EntryId'] } as File);
			var f = req.files.file;

			file.Filename = f.name;
			file.MimeType = f.mimetype;
			file.Size = f.data.byteLength;

			await File.create(file);

			await new Promise((resolve, reject) => {
				f.mv(file.Path, (err) => {
					if (err) reject(err);
					else resolve();
				})
			})
			
			var entry = await Entry.findOne({EntryId: file.EntryId});
			await EventLog.createLog(req.token.id, "uploaded file '" + file.Filename + "' for entry '" + entry.toString() + "'");
		}
		else {
			return helpers.render(res, '401');
		}
	}))
}