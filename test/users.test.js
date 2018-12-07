const app = require('../server')
const chai = require('chai')
const chaiHttp = require('chai-http')
const mongoose = require('mongoose')

const {TEST_MONGODB_URI} = require('../config')

const User = require('../models/user')

const expect = chai.expect

chai.use(chaiHttp)

describe('Noteful API - Users', function() {
  const username = 'exampleUser'
  const password = 'examplePass'
  const fullname = 'Example User'

  before(function() {
    return mongoose
      .connect(
        TEST_MONGODB_URI,
        {useNewUrlParser: true, useCreateIndex: true}
      )
      .then(() => User.deleteMany())
  })

  beforeEach(function() {
    return User.createIndexes()
  })

  afterEach(function() {
    return User.deleteMany()
  })

  after(function() {
    return mongoose.disconnect()
  })

  describe('POST /api/users', function() {
    it('Should create a new user', function() {
      let res
      return chai
        .request(app)
        .post('/api/users')
        .send({username, password, fullname})
        .then(_res => {
          res = _res
          expect(res).to.have.status(201)
          expect(res.body).to.be.an('object')
          expect(res.body).to.have.keys(
            'id',
            'username',
            'fullname',
            'createdAt',
            'updatedAt'
          )
          expect(res.body.id).to.exist
          expect(res.body.username).to.equal(username)
          expect(res.body.fullname).to.equal(fullname)
          return User.findOne({username})
        })
        .then(user => {
          expect(user).to.exist
          expect(user.id).to.equal(res.body.id)
          expect(user.fullname).to.equal(fullname)
          return user.validatePassword(password)
        })
        .then(isValid => {
          expect(isValid).to.be.true
        })
    })

    it('Should reject users with missing username', function() {
      return chai
        .request(app)
        .post('/api/users')
        .send({password: password})
        .then(invalid => {
          expect(invalid).to.have.status(403)
          expect(invalid.body.message).to.include('username required!')
        })
    })
    it('Should reject users with missing password', function() {
      return chai
        .request(app)
        .post('/api/users')
        .send({username, fullname})
        .then(invalid => {
          expect(invalid).to.have.status(403)
          expect(invalid.body.message).to.include('password required!')
        })
    })

    it('Should reject users with non-string username', function() {
      const userNUMBER = 12345
      return chai
        .request(app)
        .post('/api/users')
        .send({username: userNUMBER, password})
        .then(invalid => {
          expect(invalid).to.have.status(406)
          expect(invalid.body.message).to.include(
            'username not valid! Needs to be a string please'
          )
        })
    })
    it('Should reject users with non-string password', function() {
      const passNUMBER = 12345
      return chai
        .request(app)
        .post('/api/users')
        .send({username, password: passNUMBER})
        .then(invalid => {
          expect(invalid).to.have.status(406)
          expect(invalid.body.message).to.include(
            'password not valid! Needs to be a string please'
          )
        })
    })
    it('Should reject users with non-trimmed username', function() {
      const userSpacey = '  username   '
      return chai
        .request(app)
        .post('/api/users')
        .send({username: userSpacey, password})
        .then(invalid => {
          expect(invalid).to.have.status(417)
          expect(invalid.body.message).to.include(
            'username must not have leading or trailing spaces!'
          )
        })
    })
    it('Should reject users with non-trimmed password', function() {
      const passSpace = ' 123456 78   '
      return chai
        .request(app)
        .post('/api/users')
        .send({username, password: passSpace})
        .then(invalid => {
          expect(invalid).to.have.status(417)
          expect(invalid.body.message).to.include(
            'password must not have leading or trailing spaces!'
          )
        })
    })
    it('Should reject users with empty username', function() {
      const emptyInside = ''
      return chai
        .request(app)
        .post('/api/users')
        .send({username: emptyInside, password})
        .then(invalid => {
          expect(invalid).to.have.status(411)
          expect(invalid.body.message).to.include(
            "Username must be at least ONE character, c'mon!"
          )
        })
    })
    it('Should reject users with password less than 8 characters', function() {
      const shortPass = '123'
      return chai
        .request(app)
        .post('/api/users')
        .send({username, password: shortPass})
        .then(invalid => {
          expect(invalid).to.have.status(411)
          expect(invalid.body.message).to.include(
            'Passwords must be at least eight characters'
          )
        })
    })
    it('Should reject users with password greater than 72 characters', function() {
      const longPass =
        '12345678910123456789101234567891012345678910123456789101234567891012345678910123'
      return chai
        .request(app)
        .post('/api/users')
        .send({username, password: longPass})
        .then(invalid => {
          expect(invalid).to.have.status(411)
          expect(invalid.body.message).to.include(
            'Passwords must be no more than seventy-two characters'
          )
        })
    })
    it('Should reject users with duplicate username', function() {
      return chai
        .request(app)
        .post('/api/users')
        .send({username, password})
        .then(() => {
          return chai
            .request(app)
            .post('/api/users')
            .send({username, password})
            .catch(doubled => {
              expect(doubled).to.have.status(400)
              expect(doubled.body.message).to.include(
                'The username already exists'
              )
            })
        })
    })
    it('Should trim fullname', function() {
      const fullWithSpaces = '    First Last     '
      return chai
        .request(app)
        .post('/api/users')
        .send({username, password, fullname: fullWithSpaces})
        .then(valid => {
          expect(valid).to.have.status(201)
          expect(valid.body.fullname).to.include('First Last')
        })
    })
  })
})
