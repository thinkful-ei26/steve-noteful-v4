const express = require('express')

const User = require('../models/user')

const router = express.Router()

router.post('/', (req, res, next) => {
  let { fullname, username, password} = req.body;
  const loginFields = ["username", "password"];
  if(fullname){
      fullname = fullname.trim();
  }
  const requiredKeys = {username :"username", password: "password"};
  const checkForValid = {username, password};
  
  for(let key in requiredKeys){
      if(checkForValid[key] === undefined){
          const err = new Error(`${key} required!`);
          err.status = 403;
          return next(err);
      }
  }
  loginFields.forEach(field =>{
      if(typeof(checkForValid[field]) !== 'string'){
          const err = new Error(`${field} not valid! Needs to be a string please`);
          err.status = 406;
          return next(err);
      }
  });
      
  loginFields.forEach(field => {
      if(checkForValid[field].trim() !== checkForValid[field]){
          const err = new Error(`${field} must not have leading or trailing spaces!`);
          err.status = 417;
          return next(err);
      }
  });

  if(username.length < 1){
      const err = new Error('Username must be at least ONE character, c\'mon!');
      err.status = 411;
      return next(err);
  }
  if(password.length < 8) {
      const err = new Error('Passwords must be at least eight characters');
      err.status = 411;
      return next(err);
  }
  if(password.length > 72) {
      const err = new Error('Passwords must be no more than seventy-two characters');
      err.status = 411;
      return next(err);
  }
  return User.hashPassword(password)
    .then(digest => {
      const newUser = {
        username,
        password: digest,
        fullname
      }
      return User.create(newUser)
    })
    .then(result => {
      res
        .location(`${req.originalUrl}/${result.id}`)
        .status(201)
        .json(result)
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The username already exists')
        err.status = 400
      }
      next(err)
    })
})
module.exports = router
