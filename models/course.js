const { getDb } = require('../mongodb');

class Course {
  constructor(data) {
    this.subject = data.subject;
    this.number = data.number;
    this.title = data.title;
    this.term = data.term;
    this.instructorId = data.instructorId;
  }

  async save() {
    const db = getDb();
    const result = await db.collection('courses').insertOne(this);
    return result.ops[0];
  }

  static async findById(id) {
    const db = getDb();
    return await db.collection('courses').findOne({ _id: new require('mongodb').ObjectId(id) });
  }

  static async findByInstructorId(instructorId) {
    const db = getDb();
    return await db.collection('courses').find({ instructorId }).toArray();
  }
}

module.exports = Course;
