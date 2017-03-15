import fs = require('fs');
import path = require('path');
import crypto = require('crypto');

import database = require('../database');
import { default as queryBuilder, query } from '../querybuilder';


var basePath = "files/";

class File {
	FileId: number;
	EntryId: number;
	Filename: string;
	MimeType: string;
	Size: number;
	CreatedDate: Date;
	Path: string;

	static async construct(props: {[K in keyof File]: File[K]}) {
		var f = new File();
		f.FileId = props.FileId;
		f.EntryId = props.EntryId;
		f.Filename = props.Filename;
		f.MimeType = props.MimeType;
		f.Size = props.Size;
		f.CreatedDate = new Date(props.CreatedDate);
		f.Path = props.Path;

		return f;
	}

	private static builder = queryBuilder<File>("File")
	static async find(query: query<File> = {}) {
		var sql = this.builder(query);
		var results = await database.query<any>(sql);
		return Promise.all(results.map(this.construct))
	}

	static async findOne(query: query<File>) {
		var sql = this.builder(query, 1);
		var results = await database.query<any>(sql);
		return results.length && this.construct(results[0]);
	}

	static async create(file: File) {
		file.Path = this.createFilename(path.extname(file.Filename));

		var res = await database.query("INSERT INTO File (EntryId, Filename, MimeType, Size, CreatedDate, Path) VALUES (?,?,?,?,NOW(),?)",
			[file.EntryId, file.Filename, file.MimeType, file.Size, file.Path])
		file.FileId = res.insertId;
	}


	private static createFilename(ext: string) {
		return path.join(
			basePath,
			crypto.randomBytes(64).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') + ext);
	}

	public toString() {
		var formatSize = () => {
			var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
			if (this.Size == 0) return 'n/a';
			var i = Math.floor(Math.log(this.Size) / Math.log(1024));
			if (i == 0) return this.Size + ' ' + sizes[i];
			return (this.Size / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
		}
		return this.Filename + " (" + formatSize() + ")";
	}
}
export = File;