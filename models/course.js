const mongoose = require('mongoose');
const { Schema } = mongoose;

const courseSchema = new Schema({
    subject: { type: String, required: true },
    number: { type: String, required: true },
    title: { type: String, required: true },
    term: { type: String, required: true },
    instructorID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    assignments: [{ type: Schema.Types.ObjectId, ref: 'Assignment' }],
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);

module.exports = { Course, CourseClientFields: ['subject', 'number', 'title', 'term', 'instructorID'] };
