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
var User = mongoose.model('user', UserSchema)

app.post("/api/exercise/new-user", function(req, res){
  var username = req.body.username
  User.find({ username: username }).limit(1).then(function(user){
    if(user.length > 0) {
      return res.status(404).send("Username already taken")
    }
    var user = new User({ username: username })
    user.save(function(err, data){
      if(err) {
        return res.status(404).send("Unable to save to db")
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
