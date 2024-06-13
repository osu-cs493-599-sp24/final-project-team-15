const mongoose = require('mongoose');
const { Schema } = mongoose;

const assignmentSchema = new Schema({
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    due: { type: Date, required: true },
    points: { type: Number, required: true },
}, { timestamps: true });

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
