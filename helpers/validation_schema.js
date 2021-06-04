const Joi = require('joi')

const signUpSchema = Joi.object({

    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(6).required(),
    username: Joi.string().required()

})

const signInScehma = Joi.object({

    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(6).required(),

})

module.exports = {
    signInScehma, signUpSchema
}