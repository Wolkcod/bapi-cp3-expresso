//initiate express
const express = require('express');
//preparing our Router
const employeesRouter = express.Router();
//using 'database.sqlite ' as a API's root-level for Database
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
//requiring the router from 'timesheets.js' to add additional path
const timesheetsRouter = require('./timesheets.js');

//adding employeeID to the request
employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  const sql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
  const values = {$employeeId: employeeId};
  db.get(sql, values, (error, employee) => {
    if (error) {
      next(error);
    } else if (employee) {
      req.employee = employee;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

//adding additional path to 'timesheetsRouter'
employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

//GETing /api/employees/:id
employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({employee: req.employee});
});

//GETing /api/employees
//the list ofallcurrently-employed employees
employeesRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Employee WHERE Employee.is_current_employee = 1',
    (err, employees) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({employees: employees});
      }
    });
});

//POST /api/employees , create a valid employee
//Sends status 400(Bad request) if name , position , wage are empty
employeesRouter.post('/', (req, res, next) => {
  const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage,
        is_current_employee = req.body.employee.is_current_employee === 0 ? 0 : 1;
  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }

//INSERTing into Employee table new values
  const sql = 'INSERT INTO Employee (name, position, wage, is_current_employee)' +
      'VALUES ($name, $position, $wage, $is_current_employee)';
  const values = {
    $name: name,
    $position: position,
    $wage: wage,
    $is_current_employee: is_current_employee
  };

//return the newly-created employee
  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`,
        (error, employee) => {
          res.status(201).json({employee: employee});
        });
    }
  });
});

//Updates the employee with the specific Id
//Sends status 400(Bad request) if name , position , wage are empty
employeesRouter.put('/:employeeId', (req, res, next) => {
  const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage,
        is_current_employee = req.body.employee.is_current_employee === 0 ? 0 : 1;
  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }

//UPDATEs name , position , wage of speciefied EmployeeId
  const sql = 'UPDATE Employee SET name = $name, position = $position, ' +
      'wage = $wage, is_current_employee = $is_current_employee ' +
      'WHERE Employee.id = $employeeId';
  const values = {
    $name: name,
    $position: position,
    $wage: wage,
    $is_current_employee: is_current_employee,
    $employeeId: req.params.employeeId
  };

//Returns (200) response with the updated employee if no error occured
  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
        (error, employee) => {
          res.status(200).json({employee: employee});
        });
    }
  });
});

//DELETEs employee by ID
employeesRouter.delete('/:employeeId', (req, res, next) => {
  const sql = 'UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $employeeId';
  const values = {$employeeId: req.params.employeeId};

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
        (error, employee) => {
          res.status(200).json({employee: employee});
        });
    }
  });
});

//exporting our Router to make a conection with other 'js' files
module.exports = employeesRouter;
