//initiate express
const express = require('express');
//preparing our Router
const menuItemsRouter = express.Router();
//using 'database.sqlite ' as a API's root-level for Database
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//adding menuItemId to the request
menuItemsRouter.param('menuItemId', (req, res, next, id) => {
  db.get("SELECT * FROM MenuItem WHERE id = $id", { $id: id}, function(err, row){
    if (!row) {
      return res.sendStatus(404);
    } else {
      req.body.menuItemId = id;
      next();
    }
  });
});

//Creating a middleware function for validation
const validValue = (req, res, next) => {
  if (!req.body.menuItem || !req.body.menuItem.name || !req.body.menuItem.description || !req.body.menuItem.inventory || !req.body.menuItem.price) {
    return res.sendStatus(400);
  } else {
    next();
  }
};

//Return all menu items of an existing menu
menuItemsRouter.get('/', (req, res, next) => {
  db.all("SELECT * FROM MenuItem WHERE menu_id = $menu_id" , { $menu_id: req.body.menuId}, function(err, rows){
    if (err) {
      return res.sendStatus(500);
    } else {
      res.status(200).send({menuItems:rows});
    }
  })
});

//Create a valid menuItem
menuItemsRouter.post('/', validValue, (req, res, next) => {
  db.run("INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menu_id)", { $name: req.body.menuItem.name, $description:req.body.menuItem.description, $inventory:req.body.menuItem.inventory, $price:req.body.menuItem.price, $menu_id: req.body.menuId }, function(err){
    if (err) {
      return res.sendStatus(500);
    } else {
      db.get("SELECT * FROM MenuItem WHERE id = $id", { $id: this.lastID }, function(err, row){
        if (err) {
          return res.sendStatus(500);
        } else {
          res.status(201).send({menuItem:row});
        }
      });
    }
  });
});

//Update the menu item with the given ID
menuItemsRouter.put('/:menuItemId', validValue, (req, res, next) => {
  db.run("UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menu_id WHERE id = $id", { $name:req.body.menuItem.name, $description:req.body.menuItem.description, $inventory:req.body.menuItem.inventory, $price:req.body.menuItem.price, $menu_id:req.body.menuId, $id:req.body.menuItemId}, function(err){
    if (err) {
      return res.sendStatus(500);
    } else {
      db.get("SELECT * FROM MenuItem WHERE id = $id", { $id: req.body.menuItemId }, function(err, row){
        if (err) {
          return res.sendStatus(500);
        } else {
          res.status(200).send({menuItem:row});
        }
      });
    }
  });
});

//Remove the menu item with the specified ID from the database
menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
  db.run("DELETE FROM MenuItem WHERE id = $id", { $id: req.body.menuItemId}, function(err){
    if (err) {
      return res.sendStatus(500);
    } else {
      return res.sendStatus(204);
    }
  });
});

module.exports = menuItemsRouter;
