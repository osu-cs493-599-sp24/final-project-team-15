const { Router } = require('express')

const assignmentsRouter = require('./assignments').router


const router = Router()

router.use('/assignments', assignmentsRouter)

module.exports = router