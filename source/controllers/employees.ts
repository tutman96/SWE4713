import express = require('express');
import helpers = require('../helpers');

import Employee = require('../models/Employee');

import { hash } from './login';

export = (app: express.Application) => {
	app.get("/employees", helpers.wrap(async (req, res) => {
		if (!req.token.permissions['employee.edit']) return helpers.render(res, '401');
		
		var page = +req.query['page'] || 1;
		var maxEntries = 20;

		var sort: string = req.query['sort'] || "EmployeeId";

		var [employees, numberOfEmployees] = await Promise.all([
			Employee.find({}, maxEntries, maxEntries * (page - 1), sort),
			Employee.count()
		]);

		return helpers.render(res, 'employees', {
			title: "Employees",
			employees,
			sort,
			page,
			totalPages: Math.ceil(numberOfEmployees / maxEntries)
		})
	}))

	app.get("/employee/:EmployeeId", helpers.wrap(async (req, res) => {
		if (!req.token.permissions['employee.edit']) return helpers.render(res, '401');
		
		if (req.params['EmployeeId'] == "new") {
			return helpers.render(res, 'employee', {
				title: "New Employee",
				isNew: true,
				allPermissions: Employee.allPermissions,
				employee: {
					Permissions: []
				}
			})
		}
		else {
			var employee = await Employee.findOne({ EmployeeId: req.params['EmployeeId'] });
			if (!employee) {
				return helpers.render(res, '404');
			}
			else {
				return helpers.render(res, "employee", {
					title: employee.Username,
					isNew: false,
					allPermissions: Employee.allPermissions,
					employee
				})
			}
		}
	}));

	app.post("/employee/:EmployeeId", helpers.wrap(async (req, res) => {
		if (!req.token.permissions['employee.edit']) return helpers.render(res, '401');
		
		var passHash;
		if (req.body.Password) {
			passHash = hash(req.body.Username, req.body.Password)
		}

		if (req.params['EmployeeId'] == "new") {
			req.body.PassHash = passHash
			var employee = await Employee.construct(req.body);
			await Employee.create(employee);
		}
		else {
			var oldEmployee = await Employee.findOne({ EmployeeId: req.params['EmployeeId'] });
			if (!oldEmployee) {
				return helpers.render(res, '404');
			}

			req.body.EmployeeId = req.params['EmployeeId'];
			if (passHash) req.body.PassHash = passHash;
			else req.body.PassHash = oldEmployee.PassHash;
			req.body.Disabled = oldEmployee.Disabled;
			
			var employee = await Employee.construct(req.body);
			await employee.save();
		}
	}))

	app.post("/employee/:EmployeeId/disable", helpers.wrap(async (req, res) => {
		if (!req.token.permissions['employee.edit']) return helpers.render(res, '401');
		
		var employee = await Employee.findOne({ EmployeeId: req.params['EmployeeId'] });
		employee.Disabled = true;
		await employee.save();
	}))

	app.post("/employee/:EmployeeId/enable", helpers.wrap(async (req, res) => {
		if (!req.token.permissions['employee.edit']) return helpers.render(res, '401');
		
		var employee = await Employee.findOne({ EmployeeId: req.params['EmployeeId'] });
		employee.Disabled = false;
		await employee.save();
	}))
}