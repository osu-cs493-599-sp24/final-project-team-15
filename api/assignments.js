const router = require('express').Router()
const { getDb } = require('../mongodb')
const Assignment = require('../models/assignment')
const User = require('../models/user')
const { Course } = require('../models/course')
const authMiddleware = require('../middleware/authentication')
const fs = require('fs')
const { Submission } = require('../models/submission')



// POST AN ASSIGNMENT
router.post("/", authMiddleware, async (req, res, next) => {
    const user = req.user;
    const isAdmin = user.role === 'admin';
  
    try {
      const { courseId, title, points, due } = req.body;
      if (!courseId || !title || !points || !due) {
        return res.status(400).send({ error: "Missing required fields" });
      }
  
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).send({ error: "Course not found" });
      }
  
      const isInstructor = user.role === 'instructor' && user._id.equals(course.instructorID);
      if (!isAdmin && !isInstructor) {
        return res.status(403).send({
          error: "Unauthorized to create an assignment.",
        });
      }
  
      const assignment = new Assignment({
        courseId,
        title,
        points,
        due,
      });
      await assignment.save();
  
      res.status(201).send({ id: assignment._id });
    } catch (e) {
      next(e);
    }
  });
  

// GET A SPECIFIC ASSIGNMENT

router.get("/:id", async (req, res, next) => {

    const assignmentId = req.params.id;
    try{
        const assignment = await Assignment.findById(assignmentId).select('-createdAt -updatedAt -__v')
        if(assignment){
            res.status(200).send(assignment)
        } else {
            res.status(404).send({
                error: "Requested resource does not exist."
            })
        }
    } catch (e){
        next(e)
    }
})

// PATCH A SPECIFIC ASSIGNMENT

router.patch("/:id", authMiddleware, async (req, res, next) => {
    const user = req.user;
    const isAdmin = user.role === 'admin';
  
    try {
      const { id } = req.params;
      const { courseId, title, points, due } = req.body;
      
      if (!courseId || !title || !points || !due) {
        return res.status(400).send({ error: "Missing required fields" });
      }
  
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).send({ error: "Course not found" });
      }
  
      const isInstructor = user.role === 'instructor' && user._id.equals(course.instructorID);
      if (!isAdmin && !isInstructor) {
        return res.status(403).send({
          error: "Unauthorized to update the assignment.",
        });
      }
  
      const assignment = await Assignment.findByIdAndUpdate(
        id,
        { courseId, title, points, due },
        { new: true, runValidators: true }
      );
  
      if (!assignment) {
        return res.status(404).send({ error: "Assignment not found" });
      }
  
      res.status(200).send();
    } catch (e) {
      next(e);
    }
});

// DELETE A SPECIFIC ASSIGNMENT

router.delete("/:id", authMiddleware, async (req, res, next) => {
    const user = req.user;
    const isAdmin = user.role === 'admin';
  
    try {
      const assignmentId = req.params.id;
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).send({ error: "Assignment not found" });
      }
  
      // Fetch the course to which the assignment belongs
      const course = await Course.findById(assignment.courseId);
      if (!course) {
        return res.status(404).send({ error: "Course not found" });
      }
  
      // Check if the user is an instructor for the course
      const isInstructor = user.role === 'instructor' && user._id.equals(course.instructorID);
  
      if (!isAdmin && !isInstructor) {
        return res.status(403).send({
          error: "Unauthorized to delete the assignment.",
        });
      }
  
      const result = await Assignment.findByIdAndDelete(assignmentId);
      if (result) {
        res.status(204).send();
      } else {
        res.status(404).send({ msg: "Assignment doesn't exist." });
      }
    } catch (e) {
      next(e);
    }
  });


exports.router = router