const router = require('express').Router();
const Submission = require('../models/submission');
const authMiddleware = require('../middleware/authentication');
const fs = require('fs');
const { Course } = require('../models/course');
const Assignment = require('../models/assignment');


router.patch('/:id', authMiddleware, async (req, res) => {
    const user = req.user;
    const isAdmin = user.role === 'admin';

    try {
        const { grade } = req.body;
        const submission = await Submission.findById(req.params.id);
        if (!submission) {
            return res.status(404).send({ error: "Submission not found" });
        }

        const assignment = await Assignment.findById(submission.assignmentId);
        if (!assignment) {
            return res.status(404).send({ error: "Assignment not found" });
        }

        const course = await Course.findById(assignment.courseId);
        if (!course) {
            return res.status(404).send({ error: "Course not found" });
        }

        const isInstructor = user.role === 'instructor' && user._id.equals(course.instructorID);
        if (!isAdmin && !isInstructor) {
            return res.status(403).send({
                error: "Unauthorized to grade a submission.",
            });
        }

        submission.grade = grade;
        await submission.save();

        res.status(200).send({ id: submission._id });
    } catch (e) {
        next(e);
    }
});

module.exports = router;