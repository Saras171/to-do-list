//INCLUDING REQURIED MODULES/PACKAGES
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";

const app = express();
const port = 4001;
env.config();

//POSTGRES SQL CONFIGURATION
const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PSWD,
  port: process.env.DB_PORT,
});
let workToDoList = {};
let toDoList = {};

//FUNCTION
async function gettingCurrentDate() {
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
};
  const d = new Date();
  const day = d.toLocaleString("en-IN",options);
  return day;
}

db.connect();

//MIDDLEWARE
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

//GET ROUTES

app.get("/", async (req, res) => { //FOR GETTING HOME PAGE
  const currentDate = await gettingCurrentDate();
 const recentDay = new Date().toLocaleString("en-IN",{weekday: "long"});
  res.render("home.ejs", {
   currentDay: recentDay,
    date: currentDate,
    listName: "Welcome",
  });
});
app.get("/daily", async (req, res) => { //FOR RENDERING DAILY TO-DO LIST PAGE
  const currentDate = await gettingCurrentDate();
  const recentDay = new Date().toLocaleString("en-IN",{weekday: "long"});
 console.log(currentDate);
  try {
    const aftermaths = await db.query("SELECT * FROM daily ORDER BY id ASC;");
    toDoList = aftermaths.rows;
    console.log("Items in Daily List: ", toDoList);
    res.render("index.ejs", {
      currentDay: recentDay,
      date: currentDate,
      listName: "Daily",
      newAddedItems: toDoList,
    });
  } catch (err) {
    console.log(err);
  }
});

app.get("/work", async (req, res) => { //FOR RENDERING WORK LIST PAGE
  const currentDate = await gettingCurrentDate();
  console.log(currentDate);
const recentDay = new Date().toLocaleString("en-IN",{weekday: "long"});
 try {
    const epilogue = await db.query("SELECT * FROM work_list ORDER BY id ASC;");
    workToDoList = epilogue.rows;
  console.log("Items in Work List: ", workToDoList);
    res.render("index.ejs", {
      currentDay: recentDay,
date: currentDate,
      listName: "Work",
      newAddedItems: workToDoList,
    });
  } catch (err) {
    console.log(err);
  }
});

//POST ROUTES
app.post("/add", async (req, res) => { //ADD NEW LIST-ITEM IN THEIR RESPECTIVE LOCALSTORAGE
  const userEnteredValue = req.body.list;
  const currentDate = await gettingCurrentDate();
if (req.body.clicked === "Work") { //CHECK THE CATEGORY OF TO-DO LIST; either 'Daily' or 'Work'
    try {
      db.query(
        "INSERT INTO work_list (title, date_modified) VALUES ($1, $2);",
        [userEnteredValue, currentDate]
      );
      console.log("Item added on Work list: ", userEnteredValue);
      res.redirect("/work");
    } catch (err) {
      console.log(err);
    }
  } else if (req.body.clicked === "Daily") {
    try {
      db.query("INSERT INTO daily (title, date_modified) VALUES ($1, $2);", [
        userEnteredValue,
        currentDate
      ]);
      console.log("Item added on Daily To-Do list: ", userEnteredValue);
      res.redirect("/daily");
    } catch (err) {
      console.log(err);
    }
  }
});

app.post("/edit", async (req, res) => { //EDIT OR UPDATE ALREADY ADDED LIST-ITEM 
  const editedId = req.body.updatedItemId;
  const editedTitle = req.body.updatedItemTitle;
  
  if (req.body.checkClicked === "Work") { //CHECKING THE CATEGORIES
      console.log(`Edit triggered on work list. Edit id: ${editedId} with context: ${editedTitle}`);
    try {
      await db.query("UPDATE work_list SET title= $1 WHERE id= $2;", [
        editedTitle,
        editedId,
      ]);
      console.log(`Updated Item with id: ${editedId} and context: ${editedTitle}`);
      res.redirect("/work");
    } catch (err) {
      console.log(err);
    }
  } else if (req.body.checkClicked === "Daily") {
    console.log(`Edit triggered on Daily list. Edit id: ${editedId} with context: ${editedTitle}`);

    try {
      await db.query("UPDATE daily SET title= $1 WHERE id=$2;", [
        editedTitle,
        editedId,
      ]);
      console.log(`Updated Item with id: ${editedId} and context: ${editedTitle}`);

      res.redirect("/daily");
    } catch (err) {
      console.log(err);
    }
  }
});

app.post("/delete", async (req, res) => { //DELETE THE LIST-ITEM FROM THEIR RESPECTIVE LOCALSTORAGE, AFTER THE TASK FINALLED.
  const deleteId = req.body.deleteItemId;

  console.log(`Delete from ${req.body.listName} list`);
  if (req.body["listName"] === "Work") {
    try {
      await db.query("DELETE FROM work_list WHERE id=$1;", [deleteId]);
      console.log(`this id: ${deleteId} is deleted form work List.`);
      res.redirect("/work");
    } catch (err) {
      console.log(err);
    }
  } else if (req.body.listName === "Daily") {
    try {
      await db.query("DELETE FROM daily WHERE id=$1;", [deleteId]);
      console.log(`this id: ${deleteId} is deleted form Daily List.`);

      res.redirect("/daily");
    } catch (err) {
      console.log(err);
    }
  }
});

//FOR LISTENING PORT
app.listen(process.env.PORT || port, () => {
  console.log(`Server running on http://localhost:${port}.`);
});
