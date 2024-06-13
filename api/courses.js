const { Router } = require("express");
const { Course, CourseClientFields } = require("../models/course");
const User = require("../models/user");
const Assignment = require("../models/assignment");
const authMiddleware = require("../middleware/authentication"); // Ensure correct import
const { Parser } = require("json2csv");
const fs = require("fs");

const router = Router();


// GET ALL COURSES
router.get("/", async (req, res, next) => {
  let page = parseInt(req.query.page) || 1;
  page = page < 1 ? 1 : page;
  const numPerPage = 10;
  const offset = (page - 1) * numPerPage;

  try {
    const courses = await Course.find().select('-_id -students -assignments -createdAt -updatedAt -__v')
      .skip(offset)
      .limit(numPerPage);
    const totalCount = await Course.countDocuments();

    const lastPage = Math.ceil(totalCount / numPerPage);
    const links = {};
    if (page < lastPage) {
      links.nextPage = `/courses?page=${page + 1}`;
      links.lastPage = `/courses?page=${lastPage}`;
    }
    if (page > 1) {
      links.prevPage = `/courses?page=${page - 1}`;
      links.firstPage = "/courses?page=1";
    }

    res.status(200).json({
      courses: courses,
      pageNumber: page,
      totalPages: lastPage,
      pageSize: numPerPage,
      totalCount: totalCount,
      links: links,
    });
  } catch (e) {
    next(e);
  }
});

// POST A COURSE
router.post("/", authMiddleware, async (req, res, next) => {
  const admin = req.user.role === 'admin';
  if (admin) {
    try {
      const { subject, number, title, term, instructorID } = req.body;
      if (!subject || !number || !title || !term || !instructorID) {
        return res.status(400).send({ error: "Missing required fields" });
      }
      const course = new Course(req.body);
      await course.save();
      res.status(201).send({ id: course._id });
    } catch (e) {
      next(e);
    }
  } else {
    res.status(403).send({
      error: "Unauthorized to create a course.",
    });
  }
});

// GET A SPECIFIC COURSE
router.get("/:id", authMiddleware, async (req, res, next) => {
  const courseId = req.params.id;
  try {
    const course = await Course.findById(courseId).select('-students -assignments -createdAt -updatedAt -__v')
    if (course) {
      res.status(200).send(course);
    } else {
      res.status(404).send({
        error: "Requested resource does not exist.",
      });
    }
  } catch (e) {
    next(e);
  }
});

// PATCH A SPECIFIC COURSE
router.patch("/:id", authMiddleware, async (req, res, next) => {
  const { instructorID } = req.body;
  const admin = req.user.role === 'admin';

  if (req.user._id.toString() === instructorID || admin) {
    try {
      const user = await User.findOne({ _id: instructorID, role: "instructor" });
      if (!user) {
        return res.status(404).send({ error: "Instructor not found" });
      }
      const courseId = req.params.id;
      const course = await Course.findByIdAndUpdate(courseId, req.body, { new: true });
      if (course) {
        res.status(200).send({
          message: "Updated the course.",
        });
      } else {
        res.status(404).send({
          error: "Invalid Instructor.",
        });
      }
    } catch (e) {
      next(e);
    }
  } else {
    res.status(403).send({
      error: "Unauthorized to access the specified resource",
    });
  }
});

// DELETE A COURSE
router.delete("/:id", authMiddleware, async (req, res, next) => {
  const admin = req.user.role === 'admin';
  if (admin) {
    try {
      const courseId = req.params.id;
      const result = await Course.findByIdAndDelete(courseId);
      if (result) {
        res.status(204).send();
      } else {
        res.status(404).send({ msg: "ID doesn't exist." });
      }
    } catch (e) {
      next(e);
    }
  } else {
    res.status(403).send({ msg: "Unauthorized access." });
  }
});

// Fetch a list of students enrolled in the course
router.get("/:id/students", authMiddleware, async (req, res, next) => {
  const userId = req.user._id;
  const admin = req.user.role === 'admin';
  const isInstructor = await User.findOne({ _id: userId, role: "instructor" });

  if (isInstructor || admin) {
    try {
      const courseId = req.params.id;
      const course = await Course.findById(courseId).populate('students', 'name email role');
      if (course) {
        res.status(200).send(course.students);
      } else {
        res.status(404).send({ error: "Course not found" });
      }
    } catch (e) {
      next(e);
    }
  } else {
    res.status(403).send({
      error: "Unauthorized to access the specified resource",
    });
  }
});

// Add or remove students from a course
router.post("/:id/students", authMiddleware, async (req, res, next) => {
  const courseId = req.params.id;
  const admin = req.user.role === 'admin';

  if (admin || req.user.role === 'instructor') {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).send({ error: "Course not found" });
      }

      if (req.body.add) {
        const studentsToAdd = await User.find({ _id: { $in: req.body.add } });
        course.students.push(...studentsToAdd.map(student => student._id));
      }

      if (req.body.remove) {
        course.students = course.students.filter(studentId => !req.body.remove.includes(studentId.toString()));
      }

      await course.save();
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  } else {
    res.status(403).send({ error: "Unauthorized to modify the specified resource" });
  }
});

// Download course roster as CSV
router.get("/:id/roster", authMiddleware, async (req, res, next) => {
  const userId = req.user._id;
  const admin = req.user.role === 'admin';
  const isInstructor = await User.findOne({ _id: userId, role: "instructor" });

  if (isInstructor || admin) {
    try {
      const courseId = req.params.id;
      const course = await Course.findById(courseId).populate('students', '_id name email role');
      if (!course) {
        return res.status(404).send({ error: "Course not found" });
      }

      const fields = ["_id", "name", "email", "role"];
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(course.students);

      const filePath = `${__dirname}/studentsRoster.csv`;
      fs.writeFileSync(filePath, csv);

      res.download(filePath, "studentsRoster.csv", (err) => {
        if (err) {
          console.error("Error downloading CSV:", err);
          res.status(500).send("Error downloading CSV");
        }

        fs.unlinkSync(filePath); // Remove the file after download
      });
    } catch (e) {
      next(e);
    }
  } else {
    res.status(403).send({
      error: "Unauthorized to access the specified resource",
    });
  }
});

// Get assignments for a course
router.get("/:id/assignments", authMiddleware, async (req, res, next) => {
  const courseId = req.params.id;
  try {
    const assignments = await Assignment.find({ courseId: courseId }).select('-createdAt -updatedAt -__v');
    res.status(200).send(assignments);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
