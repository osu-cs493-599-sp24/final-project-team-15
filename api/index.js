const { Router } = require('express');
const usersRouter = require('./users').router;
const assignmentsRouter = require('./assignments').router;
const coursesRouter = require('./courses'); // Ensure this is correctly imported
const authMiddleware = require('../middleware/authentication'); // Ensure correct import

const router = Router();

router.use('/users', usersRouter);
router.use('/assignments', authMiddleware, assignmentsRouter); // Protect assignments route
router.use('/courses', authMiddleware, coursesRouter); // Protect courses route

module.exports = router;
