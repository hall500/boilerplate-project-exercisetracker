# Exercise Tracker REST API

#### A microservice project, part of Free Code Camp's curriculum

### User Stories

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/7720cba547f64d279db8a009e39acbe6)](https://app.codacy.com/manual/hall500/project-exercisetracker?utm_source=github.com&utm_medium=referral&utm_content=hall500/project-exercisetracker&utm_campaign=Badge_Grade_Dashboard)
[![Run on Repl.it](https://repl.it/badge/github/freeCodeCamp/boilerplate-project-exercisetracker)](https://repl.it/github/freeCodeCamp/boilerplate-project-exercisetracker)

1. I can create a user by posting form data username to /api/exercise/new-user and returned will be an object with username and _id.
2. I can get an array of all users by getting api/exercise/users with the same info as when creating a user.
3. I can add an exercise to any user by posting form data userId(_id), description, duration, and optionally date to /api/exercise/add. If no date supplied it will use current date. Returned will be the user object with also with the exercise fields added.
4. I can retrieve a full exercise log of any user by getting /api/exercise/log with a parameter of userId(_id). Return will be the user object with added array log and count (total exercise count).
5. I can retrieve part of the log of any user by also passing along optional parameters of from & to or limit. (Date format yyyy-mm-dd, limit = int)
