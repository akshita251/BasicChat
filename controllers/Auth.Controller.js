const httpError = require('http-errors')
const { User, findUserByEmail, findUserByUsername } = require('../models/User.model')
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} = require('../helpers/jwt_helper')
const redis = require('../helpers/redis_helper')
const { signInScehma, signUpSchema } = require('../helpers/validation_schema')
// const { esClient } = require('../helpers/elasticSearch')

module.exports = {
  availability: async (req, res, next) => {
    try {
      var username;
      var email;

      //username-availability
      if (req.body.username != '') {
        //check if username is available
        var doc = await findUserByUsername(req.body.username)
        var isUsernameAvailable = true
        //if a doc is returned it set isUsernameAvailable to false 
        if (doc) {
          isUsernameAvailable = false
        }
        username = {
          "value":req.body.username,
          "isAvailable":isUsernameAvailable 
        }
      }

      //email-availability
      if (req.body.email != '') {
        //check if email is available
        var doc = await findUserByEmail(req.body.email)
        var isEmailAvailable = true
        //if a doc is returned it set isEmailAvailable to false 
        if (doc) {
          isEmailAvailable = false
        }
        email = {
          "value":req.body.email,
          "isAvailable":isEmailAvailable 
        }
      }

      res.send({username, email})

    } catch (err) {
      next(err)
    }
  },


  signup: async (req, res, next) => {
    try {
      console.log(req.body)
      const result = await signUpSchema.validateAsync(req.body)
      const emailExists = await findUserByEmail(result.email)
      if (emailExists) {
        throw httpError.Conflict('Email already exists')
      }
      const user = new User(result)
      const savedUser = await user.save()
      const id = savedUser.ref.id
      const accessToken = await signAccessToken(id)
      const refreshToken = await signRefreshToken(id)

      console.log(savedUser.data.username)
    //   //elastic search indexing
    //   esClient.index({
    //     index: 'users',
    //     id: id,
    //     body: {
    //       "username": savedUser.data.username,
    //     }
    //   })
    //     .then(response => {
    //       console.log("Indexing successful")
    //     })

      res.send({ id, accessToken, refreshToken })

    } catch (err) {
      if (err.isJoi === true) err.status = 422
    }
  },

  signin: async (req, res, next) => {

    try {
      const result = await signInScehma.validateAsync(req.body)
      console.log(result)
      const emailExists = await findUserByEmail(result.email)
      if (!emailExists) {
        throw httpError.Unauthorized('Invalid Password/Email')
      }
      user = new User(emailExists)
      const isValidPassword = await user.checkPassword(req.body.password)
      if (!isValidPassword) {
        throw httpError.Unauthorized('Invalid Password/Email')
      }
      const id = emailExists.ref.id
      const accessToken = await signAccessToken(id)
      const refreshToken = await signRefreshToken(id)

      res.send({ id, accessToken, refreshToken })
    } catch (err) {
      if (err.isJoi === true)
        err.status = 422
      next(err)
    }
  },

  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body
      if (!refreshToken) throw httpError.BadRequest()
      const userId = await verifyRefreshToken(refreshToken)

      const accessToken = await signAccessToken(userId)
      const newRefreshToken = await signRefreshToken(userId)
      res.send({ accessToken: accessToken, refreshToken: newRefreshToken })
    } catch (error) {
      next(error)
    }
  },

  signout: async (req, res, next) => {
    try {
      const { refreshToken } = req.body
      if (!refreshToken) throw httpError.BadRequest()
      const userId = await verifyRefreshToken(refreshToken)
      redis.DEL(userId, (err, val) => {
        if (err) {
          console.log(err.message)
          throw createError.InternalServerError()
        }
        console.log(val)
        res.sendStatus(204)
      })
    } catch (error) {
      next(error)
    }
  },
}