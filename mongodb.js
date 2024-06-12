const { MongoClient } = require('mongodb');

const mongoHost = process.env.MONGO_HOST 
const mongoPort = process.env.MONGO_PORT 
const mongoUser = process.env.MONGO_USER 
const mongoPassword = process.env.MONGO_PASSWORD
const mongoDbName = process.env.MONGO_DB
const mongoAuthDb = process.env.MONGO_AUTH_DB || mongoDbName


const mongoUrl = `mongodb://${mongoHost}:${mongoPort}`

let db = null
exports.connectToDb = async function connectToDb() {
    const client = await MongoClient.connect(mongoUrl)
    db = client.db(mongoDbName)
}

exports.getDb = function getDb() {
    return db
}