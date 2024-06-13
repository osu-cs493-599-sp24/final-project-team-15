const mongoose = require('mongoose');
const { Schema } = mongoose;

const SubmissionSchema = new Schema({
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, required: false },
    grade: { type: Number, required: false },
    file: { type: String, required: false },
    filename: { type: String, required: false },
}, { timestamps: true });

const Submission = mongoose.model('Submission', SubmissionSchema);

module.exports = Submission;
