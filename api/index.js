const { Router } = require('express')

const assignmentsRouter = require('./assignments').router
const usersRouter = require('./users').router


const router = Router()

// router.use('/assignments', assignmentsRouter)
router.use('/users', usersRouter)

module.exports = router