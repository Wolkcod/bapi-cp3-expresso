//initiate express
const express = require('express');

//preparing our Router
const timesheetsRouter = express.Router({mergeParams: true});

//using 'database.sqlite ' as a API's root-level for Database
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

function isValidTimesheet (timesheetData){
  return timesheetData.hours &&
    timesheetData.rate &&
    timesheetData.date;
}

//adding timesheetsID to the request
timesheetsRouter.param('timesheetId', (req, res, next, id) => {
  const timesheetId = Number(id);
  db.get('SELECT * FROM Timesheet WHERE id = $id', { $id: timesheetId },
    (error, timesheet) => {
      if (error) {
        next(error);
      } else if (timesheet) {
        req.timesheet = timesheet;
        req.timesheetId = Number(id);
        next();
      } else {
      res.status(404).send();
    }
  });
});


//GETing all 'timesheets' of an existing employee
timesheetsRouter.get('/', (req, res, next) => {
  const employee = req.employee;
  db.all('SELECT * FROM Timesheet WHERE employee_id = $employee_id', { $employee_id: employee.id },
    (error, timesheets) => {
      if (error) {
        return next(error);
      }
      res.send({ timesheets });
    })
});

//Creates a valid timesheet
timesheetsRouter.post('/', (req, res, next) => {
    const hours = Number(req.body.timesheet.hours);
    const rate = Number(req.body.timesheet.rate);
    const date = Number(req.body.timesheet.date);
    if(!hours || !rate || !date){
      return  res.sendStatus(400);
    }
    db.run(`INSERT INTO Timesheet (hours, rate, date, employee_id)
            VALUES ( $hours, $rate, $date, $empId)`,
        { $hours: hours,
            $rate: rate,
            $date: date,
            $empId: req.params.employeeId },
        function(err){
            if(err){
                next(err);
            }
            else {
                db.get(`SELECT * FROM Timesheet WHERE id = ${this.lastID}`,
                (err, timesheet) => {
                    res.status(201).json({timesheet: timesheet});
                });
            }
    });
});

//Updates the timesheet
timesheetsRouter.put('/:timesheetId', (req, res, next) => {
  const timesheetData = req.body.timesheet;
  const timesheetId = req.timesheet.id;
  const employee = req.employee;

  if (!isValidTimesheet(timesheetData)) {
    return res.status(400).send();
  }

  db.run('UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employee_id WHERE Timesheet.id = $id', {
    $hours: timesheetData.hours,
    $rate: timesheetData.rate,
    $date: timesheetData.date,
    $employee_id: employee.id,
    $id: timesheetId,
  }, (err) => {
    if (err) {
      return next(err);
    }

    db.get('SELECT * FROM Timesheet WHERE id = $id', { $id: timesheetId }, (selectError, timesheet) => {
      if (selectError) {
        return next(selectError);
      }

      res.status(200).send({ timesheet });
    });
  });
});

//Deletes timesheet by ID
timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  const sql = 'DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId';
  const values = {$timesheetId: req.params.timesheetId};

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    }
    return  res.sendStatus(204);
  });
});

//exporting our Router to make a conection with other 'js' files
module.exports = timesheetsRouter;
