const mongoose = require('mongoose');
const { Schema } = mongoose;

const assignmentSchema = new Schema({
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    dueDate: { type: Date, required: true },
    submissions: [{ type: Schema.Types.ObjectId, ref: 'Submission' }],
}, { timestamps: true });

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
