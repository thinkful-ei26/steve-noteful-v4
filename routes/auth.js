const express = require('express')

const passport = require('passport')
const {JWT_SECRET, JWT_EXPIRY} = require('../config')
const jwt = require('jsonwebtoken')

const router = express.Router()

const options = {session: false, failWithError: true}

const localAuth = passport.authenticate('local', options)
const jwtAuth = passport.authenticate('jwt', options)

function createAuthToken(user) {
  return jwt.sign({user}, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY
  })
}
router.post('/login', localAuth, (req, res) => {
  const authToken = createAuthToken(req.user)
  res.json({authToken})
})

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user)
  res.json({authToken})
})

module.exports = router
