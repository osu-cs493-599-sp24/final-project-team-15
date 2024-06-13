const mongoose = require('mongoose');

function connectToDb() {
  const dbUri = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?authSource=trauplin`;

  console.log("Connecting to MongoDB at", dbUri);

  return mongoose.connect(dbUri)
    .then(() => console.log("Successfully connected to MongoDB"))
    .catch(err => {
      console.error("Connection error", err);
      process.exit(1);
    });
}

module.exports = { connectToDb };
