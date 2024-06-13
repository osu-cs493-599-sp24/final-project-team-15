const router = require('express').Router()
const { getDb } = require('../mongodb')
const Assignment = require('../models/assignment')
const User = require('../models/user')
const { Course } = require('../models/course')
const authMiddleware = require('../middleware/authentication')
const fs = require('fs')
const Submission = require('../models/submission')
const multer = require('multer')
const crypto = require("node:crypto")
const path = require("path");

const storage = multer.diskStorage({
    destination: `${__dirname}/uploads`,
    filename: (req, file, callback) => {
        const filename = crypto.pseudoRandomBytes(16).toString('hex')
        const extension = path.extname(file.originalname);
        callback(null, `${filename}${extension}`)
    }
})
const upload = multer({ storage: storage })


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

router.get("/:id", authMiddleware, async (req, res, next) => {

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
      const course = await Course.findById(assignment.courseId);
      if (!course) {
        return res.status(404).send({ error: "Course not found" });
      }
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

// GET ALL SUBMISSIONS FOR AN ASSIGNMENT

router.get("/:id/submissions", authMiddleware, async (req, res, next) => {
    const user = req.user;
    const assignmentId = req.params.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;

    try {
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).send({ error: "Assignment not found" });
        }

        const course = await Course.findById(assignment.courseId);
        if (!course) {
            return res.status(404).send({ error: "Course not found" });
        }

        if (user.role !== 'admin' && !user._id.equals(course.instructorID)) {
            return res.status(403).send({ error: "Unauthorized to fetch submissions" });
        }

        const totalSubmissionsCount = await Submission.countDocuments({ assignmentId: assignment._id });

        const submissions = await Submission.find({ assignmentId: assignment._id })
            .select('-createdAt -updatedAt -__v')
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();

        const totalPages = Math.ceil(totalSubmissionsCount / limit);

        const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}/${assignmentId}/submissions`;
        const links = {};

        if (page < totalPages) {
            links.nextPage = `${baseUrl}?page=${page + 1}&limit=${limit}`;
            links.lastPage = `${baseUrl}?page=${totalPages}&limit=${limit}`;
        }

        if (page > 1) {
            links.prevPage = `${baseUrl}?page=${page - 1}&limit=${limit}`;
            links.firstPage = `${baseUrl}?page=1&limit=${limit}`;
        }

        const response = {
            submissions: submissions.map(submission => ({
                assignmentId: submission.assignmentId,
                studentId: submission.studentId,
                timestamp: submission.timestamp,
                grade: submission.grade,
                file: submission.file
            })),
            pageNumber: page,
            totalPages: totalPages,
            pageSize: limit,
            totalCount: totalSubmissionsCount,
            links: links
        };

        res.status(200).send(response);
    } catch (e) {
        next(e);
    }
});





// SUBMIT AN ASSIGNMENT

router.post("/:id/submissions", authMiddleware, upload.single('file'), async (req, res, next) => {
    const user = req.user;
    const studentId = user._id;
    const assignmentId = req.params.id;
    if(!req.file){
        return res.status(400).send({ error: "File is required" });
    }
    if(user.role !== 'student'){
        return res.status(403).send({ error: "Unauthorized to submit an assignment" });
    }
    try{
        const assignment = await Assignment.findById(assignmentId);
        if(!assignment){
            return res.status(404).send({ error: "Assignment not found" });
        }
        const course = await Course.findById(assignment.courseId);
        //console.log(assignment.courseId, course.students, studentId)
        if(!course){
            return res.status(404).send({ error: "Course not found" });
        }
        const isEnrolled = course.students.includes(studentId);
        if(!isEnrolled){
            return res.status(403).send({ error: "Unauthorized to submit an assignment during isEnrolled check" });
        }
        const submission = new Submission({
            assignmentId,
            studentId,
            timestamp: new Date(),
            file: `${req.protocol}://${req.get('host')}/assignments/media/submissions/${req.file.filename}`,
            filename: req.file.filename
        });
        await submission.save();
        res.status(201).send({ id: submission._id });
    }catch(e){
        next(e);
    }

})

// GET A SPECIFIC SUBMISSION
router.get("/media/submissions/:filename", authMiddleware, async (req, res, next) => {
    const user = req.user;
    const isAdmin = user.role === 'admin';
    const isInstructor = user.role === 'instructor';
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'uploads', filename);
    
    try{
        const submission = await Submission.findOne({ filename: req.params.filename });
        if (!submission) {
            return res.status(404).send({ error: "Submission not found" });
        }
        const assignment = await Assignment.findById(submission.assignmentId);
        const course = await Course.findById(assignment.courseId);
        console.log(course.instructorID, user._id, submission.assignmentId)
        if ( (isInstructor && user._id.equals(course.instructorID)) || isAdmin ) {
            res.status(200).sendFile(filePath);
        } else{
            return res.status(403).send({ error: "Unauthorized to download submission file" });
        }


    } catch (e){
        next(e);
    }
});


exports.router = router