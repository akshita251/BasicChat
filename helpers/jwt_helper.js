const JWT = require('jsonwebtoken')
const httpError = require('http-errors')
const redis = require('./redis_helper')
require('dotenv').config()

module.exports = {

    signAccessToken: (userId) => {
        return new Promise((resolve, reject) => {

            //Contents of JWT token
            const payload = {
                'userId': userId
            }
            const secret = process.env.ACCESS_TOKEN_SECRET
            const options = {
                expiresIn: '1000 minutes'
            }

            //Creating the JWT token
            JWT.sign(payload, secret, options, (err, token) => {
                if(err){
                    console.log(err)
                    reject(httpError.InternalServerError())
                    return
                }
                resolve(token)
            })
        })
    },

    verifyAccessToken: (req, res, next) => {
        if(!req.headers.token) return next(httpError.Unauthorized())

        // Retriving access token from "Bearer ACCESS_TOKEN" format
        const authHeader = req.headers.token
        const bearerToken = authHeader.split(' ')
        const token = bearerToken[1]
        JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
            if(err) {
                const message = err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message
                return next(httpError.Unauthorized(message))
            }
            req.payload = payload
            next()
        })
    },  

    signRefreshToken: (userId) => {
        return new Promise((resolve, reject) => {

            //Contents of JWT Refresh Token
            const payload = {
                'userId': userId 
            }
            const secret = process.env.REFRESH_TOKEN_SECRET
            const options = {
                expiresIn: '1y'
            }

            JWT.sign(payload, secret, options, (err, token) => {
                if(err){
                    console.log(err)
                    reject(httpError.InternalServerError())
                }

                redis.SET(userId.toString(), token, 'EX', 365 * 24 * 60 * 60, (err, reply) => {
                    if (err) {
                        console.log(err.message)
                        reject(httpError.InternalServerError())
                        return
                    }
                    console.log("JWT HELPER > SIGN REFRESH TOKEN : " + reply)
                    resolve(token)
                })
            })
        })
    },

    verifyRefreshToken: (token) => {
        return new Promise((resolve, reject) => {
            JWT.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, payload) => {
                if(err) httpError.Unauthorized()
                const userId = payload['userId']

                redis.GET(userId, (err, result) => {
                    if(err) { 
                        console.log(err.message)
                        reject(httpError.InternalServerError())
                        return
                    }

                    if(token === result) return resolve(userId)
                    reject(httpError.Unauthorized())
                })
            })
        })
    }
}