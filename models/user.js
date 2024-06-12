const { getDb } = require('../mongodb');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');


class User {
    constructor(data) {
      this.username = data.username;
      this.email = data.email;
      this.password = data.password;
      this.role = data.role;
    }
  
    async save() {
      const db = getDb();
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
  
      const result = await db.collection('users').insertOne(this);
  
      // Adding debug log and error handling
      console.log("Insert result:", result);
  
      if (result && result.insertedId) {
        return { _id: result.insertedId, ...this };
      } else {
        throw new Error("User creation failed");
      }
    }
  
    static async findById(id) {
      const db = getDb();
      return await db.collection('users').findOne({ _id: new ObjectId(id) });
    }
  
    static async findByUsername(username) {
      const db = getDb();
      return await db.collection('users').findOne({ username });
    }
  
    static async findByEmail(email) {
      const db = getDb();
      return await db.collection('users').findOne({ email });
    }
  }

module.exports = User;
