//initiate express
const express = require('express');
//preparing our Router
const menuRouter = express.Router();
//using 'database.sqlite ' as a API's root-level for Database
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
//requiring the router from 'timesheets.js' to add additional path
const menuItemsRouter = require('./menuItems.js');

//adding menuId to the request
menuRouter.param('menuId', (req, res, next, id) => {
  db.get("SELECT * FROM Menu WHERE id = $id", { $id: id }, function(err, row){
    if (!row) {
      return res.sendStatus(404);
    } else {
      req.body.menuId = id;
      next();
    }
  });
});

menuRouter.use('/:menuId/menu-items', menuItemsRouter);

//Creating a middleware function for validation
const validValue = (req, res, next) => {
  if (!req.body.menu || !req.body.menu.title) {
    return res.sendStatus(400);
  } else {
    next();
  }
};

//return all menus
menuRouter.get('/', (req, res, next) => {
  db.all("SELECT * FROM Menu", function(err, rows){
    if (err) {
      return res.sendStatus(500);
    } else {
      res.status(200).send({menus:rows});
    }
  });
});

//Return the menus with the given ID
menuRouter.get('/:menuId', (req, res, next) => {
  db.get("SELECT * FROM Menu WHERE id = $id", { $id: req.params.menuId }, function(err, row){
    if (err) {
      return res.sendStatus(500);
    } else {
      res.status(200).send({menu:row});
    }
  });
});

//Create a valid menu
menuRouter.post('/', validValue, (req, res, next) => {
  db.run("INSERT INTO Menu (title) VALUES ($title)", {$title: req.body.menu.title}, function(err){
    if (err) {
      return res.sendStatus(500);
    } else {
      db.get("SELECT * FROM Menu WHERE id = $id", { $id: this.lastID }, function(err, row){
        if (err) {
          return res.sendStatus(500);
        } else {
          res.status(201).send({menu:row});
        }
      });
    }
  });
});

//Update the menu with the given ID
menuRouter.put('/:menuId', validValue, (req, res, next) => {
  db.run("UPDATE Menu SET title = $title WHERE id = $id", {$title: req.body.menu.title, $id: req.params.menuId}, function(err){
    if (err) {
      return res.sendStatus(500);
    } else {
      db.get("SELECT * FROM Menu WHERE id = $id", {$id: req.params.menuId}, function(err, row){
        if (err) {
          return res.sendStatus(500);
        } else {
          res.status(200).send({menu:row});
        }
      });
    }
  });
});

//Remove the menu with the specified ID from the database
menuRouter.delete('/:menuId', (req, res, next) => {
  db.all("SELECT * FROM MenuItem WHERE menu_id = $id", { $id: req.params.menuId }, function(err, rows){
    if (rows.length > 0) {
      return res.sendStatus(400);
    } else {
      db.run("DELETE FROM Menu WHERE id = $id", { $id: req.params.menuId }, function(err){
        if (err) {
          return res.sendStatus(500);
        } else {
          return res.sendStatus(204);
        }
      });
    }
  });
});

// MenuItems Routes


module.exports = menuRouter;
