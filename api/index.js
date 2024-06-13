const { Router } = require('express');
const usersRouter = require('./users').router;
const assignmentsRouter = require('./assignments').router;
const coursesRouter = require('./courses'); 
const submissionsRouter = require('./submissions'); 
const authMiddleware = require('../middleware/authentication');
const router = Router();

router.use('/submissions', submissionsRouter);
router.use('/users', usersRouter);
router.use('/assignments', assignmentsRouter); 
router.use('/courses', coursesRouter);

module.exports = router;
