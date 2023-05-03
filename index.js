const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://0.0.0.0:27017/todolistDB", {useNewUrlParser: true})
  .then(() => {
    console.log("Successfully connected to database.");
  })
  .catch((err) => {
    console.error("Error connecting to database:", err);
  });

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({})
    .then((foundItems) => {
      if (foundItems.length === 0) {
        return Item.insertMany(defaultItems);
      } else {
        return Promise.resolve(foundItems);
      }
    })
    .then((foundItems) => {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    })
    .catch((err) => {
      console.error("Error finding or saving items:", err);
    });
});

app.get("/:customListName", function(req, res){
  const customListName = req.params.customListName;

  List.findOne({name: customListName})
    .then((foundList) => {
      if (!foundList){
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        return list.save();
      } else {
        return Promise.resolve(foundList);
      }
    })
    .then((foundList) => {
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    })
    .catch((err) => {
      console.error("Error finding or saving list:", err);
    });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({name: itemName});

  if (listName === "Today") {
    item.save()
      .then(() => {
        res.redirect("/");
      })
      .catch((err) => {
        console.error("Error saving item:", err);
      });
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.items.push(item);
        return foundList.save();
      })
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.error("Error finding or saving list:", err);
      });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(() => {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      })
      .catch((err) => {
        console.error("Error deleting checked item:", err);
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then((foundList) => {
        res.redirect("/" + listName);
      })
      .catch((err) => {
        // handle error
      });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log(`Server started on port ${port}`);
});


