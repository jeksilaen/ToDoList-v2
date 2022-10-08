const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("static"));

app.set("view engine", "ejs");


//MongoDB config (connection, schema, model, docs)
mongoose.connect('mongodb+srv://admin-zacharia:???@cluster0.41ndsjl.mongodb.net/todolistDB').catch(err => console.log(err));

const itemSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model('Item', itemSchema);

const item1 = new Item({ 
    name: "Welcome to your todoList!"
});

const item2 = new Item({ 
    name: "Hit the + button to add a new item."
});

const item3 = new Item({ 
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];


const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
});

const List = mongoose.model('List', listSchema);

app.get("/", (req, res) => {
    Item.find((err, docs) => {
        if (err) {
            console.log(err);
        } else {
            if (docs.length === 0) {
                //Inserting default items to DB
                Item.insertMany(defaultItems, (err) => { 
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Successfully saved default items to DB.");
                        res.redirect("/")
                    }
                })
            }
            else{
                res.render("list", {listTitle:"Today", newItems:docs});

            }
        }
    })

     

});

app.post("/", (req, res) => {

    const itemName = req.body.newItem;
    const listName = req.body.list;
    

    const item = new Item({ 
        name: itemName
    });
    
    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, (err, doc) => {
            doc.items.push(item);
            doc.save();
            res.redirect("/" + listName);
        })
    }

    

});

app.post("/delete", (req, res) => {

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.deleteOne({_id : checkedItemId}, err => {
            if (err) {
              console.log("Error");
            }
            else{
              console.log("Successfully deleted checked item.");
              res.redirect("/");
            }
        });
    } else {
        List.findOne({name: listName}, function(err,doc){
            doc.items.pull({_id: checkedItemId});
            doc.save();
            res.redirect("/" + listName);
        });
    }

});

app.get("/:dir", (req, res) => {

    const listName = _.capitalize(req.params.dir);

    List.findOne({name: listName}, (err, doc) => {
        if (err) {
            console.log(err);
        } else {
            if (!doc) {
                //Create a new list
                const list = new List({
                    name: listName,
                    items: defaultItems
                })
            
                list.save();
                res.render("list", {listTitle: listName, newItems: list.items});
            } else{ 
                //Show an existing list
                res.render("list", {listTitle: doc.name, newItems: doc.items});
            }
        }
    })

    

});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, () => {
    console.log("Server has started successfully.");
});