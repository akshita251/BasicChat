const router = require('express').Router()
const AuthController = require('../controllers/Auth.controller')

router.post('/availability', AuthController.availability)
router.post('/signup', AuthController.signup)
router.post('/signin', AuthController.signin)
router.post('/refreshToken', AuthController.refreshToken)
router.post('/signout', AuthController.signout)

module.exports = router