const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();
const toDay = date.getDate();
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = {
  name: String,
};

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your todolist",
});

const item2 = new Item({
  name: "Hit the + button to add a new item",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  Item.find({}, function (err, items) {
    if (items.length != 0) {
      res.render("list", { listTitle: toDay, newListItems: items });
    } else {
      Item.insertMany(defaultItems, function (err) {
        if (!err) {
          console.log("Default item successfully added to database");
          res.redirect("/");
        } else {
          console.log(err);
        }
      });
    }
  });
});

app.post("/", function (req, res) {
  const item = new Item({
    name: req.body.newItem,
  });
  const listTitle = req.body.list;

  if (listTitle === toDay.toString()) {
    item.save().then(res.redirect("/"));
  } else {
    List.findOne({ name: listTitle }, function (err, list) {
      if (!err) {
        list.items.push(item);
        list.save().then(res.redirect("/" + listTitle));
      }
    });
  }
});

app.post("/delete", function (req, res) {
  const itemID = req.body.itemCheck;
  const listTitle = req.body.list;

  if (listTitle === toDay.toString()) {
    Item.findByIdAndRemove(itemID, function (err) {
      if (!err) {
        console.log("Item successfully deleted");
        res.redirect("/");
      } else {
        console.log(err);
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listTitle },
      { $pull: {items: { _id: itemID } }},
      function (err, list) {
        if (!err) {
          res.redirect("/" + listTitle);
        }
      }
    );
  }
});

app.get("/:customListName", function (req, res) {
  const listName = _.capitalize(req.params.customListName);
  List.findOne({ name: listName }, function (err, list) {
    if (!err) {
      if (!list) {
        const list = new List({
          name: listName,
          items: defaultItems,
        });
        list.save().then(res.redirect("/" + listName));
      } else {
        res.render("list", {
          listTitle: listName,
          newListItems: list.items,
        });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
