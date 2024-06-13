const mongoose = require('mongoose');
const { Schema } = mongoose;

const submissionSchema = new Schema({
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, required: true },
    grade: { type: Number, required: false },
    fileId: { type: Schema.Types.ObjectId, ref: 'File', required: false },
    file: { type: String, required: false }
}, { timestamps: true });

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
