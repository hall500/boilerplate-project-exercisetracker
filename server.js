const express = require('express')
var mongo = require('mongodb')
const mongoose = require('mongoose')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

var Schema = mongoose.Schema

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true, useUnifiedTopology: true })

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//Mongoose  Schema and Model
var UserSchema = new Schema({
  username: String
})
var ExerciseSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: String
})
var User = mongoose.model('user', UserSchema)
var Exercise = mongoose.model('exercise', ExerciseSchema)

app.post("/api/exercise/new-user", function(req, res){
  var username = req.body.username
  User.find({ username: username }).limit(1).then(function(user){
    if(user.length > 0) {
      return res.status(404).send("Username already taken")
    }
    var user = new User({ username: username })
    user.save(function(err, data){
      if(err) {
        return res.status(404).send("Unable to save user to db")
      }
      return res.status(200).send({ username: data.username, _id: data.id })
    })
  }).catch(function(e){
    console.log("A mongoose error ocurred")
  })
})

app.get("/api/exercise/users", function(req, res){
  User.find({}).then(function(users){
    if(users.length < 1){
      return res.send("No users found")
    }
    return res.send(users)
  })
})

app.post("/api/exercise/add", function(req, res){
  var {userId, description, duration, date} = req.body
  date = (date === "") ? new Date(): new Date(date)
  User.find({ _id: userId }).then(function(user){
    var exercise = new Exercise({
      username: user[0].username,
      description: description,
      duration: Number(duration),
      date: date.toDateString()
    })
    exercise.save(function(err, data){
      if(err) return res.send("Unable to save exercise to db")
      return res.json({
        _id: data._id,
        username: data.username,
        date: data.date,
        duration: data.duration,
        description: data.description
      })
    }).catch(function(e){ 
      console.log("Unable to save exercise") 
    })
  })
})

app.get("/api/exercise/log", function(req, res){
  var userId = req.query.userId
  var from = req.query.from || ""
  var to = req.query.to || ""
  var lim = Number(req.query.limit) || 0
  if(userId == "") return res.send("unknown userId")
  User.find({ _id: userId }).select({ __v: 0 }).then(function(user){
    var exe = Exercise.find({ username: user[0].username })
    if(from != "" && to != "") exe = Exercise.find({ username: user[0].username, date: { $gte: from, $lte: to} })
    else if(from != "") exe = Exercise.find({ username: user[0].username, date: { $gte: from } })
    else if(to != "") exe = Exercise.find({ username: user[0].username, date: { $lte: to} })
    if(lim > 0) exe = exe.limit(lim)
    exe.select({ _id: 0, __v: 0, username: 0 }).then(function(exercises){
      return res.json({
        _id: user[0].id,
        username: user[0].username,
        count: exercises.length,
        logs: exercises
      })
    })
  }).catch(function(e){
    console.log("Error in finding userId")
  })
})

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
