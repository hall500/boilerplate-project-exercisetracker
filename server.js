const express = require("express");
var mongo = require("mongodb");
const mongoose = require("mongoose");
const app = express();
const bodyParser = require("body-parser");

const cors = require("cors");

app.use(cors());

var Schema = mongoose.Schema;

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true, useUnifiedTopology: true });

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get('/', (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
  
app.get("/drop-db", (req, res) => {
  mongoose.connection.db.dropCollection('exercises', function(err, result) {
    if(err) console.log("could not drop exercises database");
    else console.log("dropped exercises collection successfully");
  });
  mongoose.connection.db.dropCollection('users', function(err, result) {
    if(err) console.log("could not drop users database");
    else console.log("dropped users collection successfully");
  });
  res.send("Collection Emptied");
})

//Mongoose  Schema and Model
var ExerciseSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date
});
var UserSchema = new Schema({
  username: {type: String, required: true, unique: true}
});
var User = mongoose.model("user", UserSchema);
var Exercise = mongoose.model("exercise", ExerciseSchema);

app.post("/api/exercise/new-user", function(req, res){
  var username = req.body.username;
  User.find({ username: username }).limit(1).then(function(user){
    if(user.length > 0) {
      return res.send("Username already taken");
    }
    var user = new User({ 
      username: username
    });
    user.save(function(err, data){
      if(err) {
        return res.send("Unable to save user to db");
      }
      return res.json(data);
    })
  }).catch(function(e){
    console.log("A mongoose error ocurred");
  })
});

app.get("/api/exercise/users", function(req, res){
  User.find({}).then(function(users){
    if(users.length < 1){
      return res.send("No users found");
    }
    return res.send(users);
  });
});

app.post("/api/exercise/add", function(req, res){
  var { description, duration, userId } = req.body;
  var date = req.body.date ? new Date(req.body.date): new Date();
  
  User.findOne({ _id: userId }, function(err, user){
    if(!user) return res.json({ error: "user does not exist" });
    else 
      User.findById({ _id: userId }, function(err, user){
        if(err) return console.error("unable to find user");
        var exercise = new Exercise({
          username: user.username,
          description: description,
          duration: Number(duration),
          date: date
        });
        exercise.save(function(err, data){
          if(err) return console.error(err);
          else return res.status(200).json({
            _id: userId,
            username: data.username,
            date: date.toDateString(),
            duration: data.duration,
            description: data.description
          });
        });
      });
    
  });
});

app.get("/api/exercise/log", function(req, res){
  var { userId, from, to, limit } = req.query;
  User.findOne({ _id: userId }, '_id username' ,function(err, user){
    if(err) return res.send(err.message);
    if(!user) return res.send("user not found");
    var entry_value = { username: user.username };
    var queryString = Exercise.find(entry_value);
    if(from) queryString.where("date").gt(new Date(from));
    if(to) queryString.where("date").lt(new Date(to));
    if(limit) queryString.limit(Number(limit));
    queryString.exec(function(err, exercises){
        if(err) return res.send(err.message);
        return res.json({
          _id: user._id,
          username: user.username,
          count: exercises.length,
          log: exercises
        });
      }
    );
  });
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: "not found"});
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res.status(errCode).type("txt").send(errMessage);
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
})
