require('dotenv').config();

const express = require('express');
const morgan = require('morgan');

const api = require('./api');
const { connectToDb } = require('./mongodb');

const app = express();
const port = process.env.PORT || 8000;
console.log(process.env.MONGO_USER, process.env.MONGO_PASSWORD);

app.use(morgan('dev'));

app.use(express.json());

app.use('/api', api);

app.use('*', function (req, res, next) {
    res.status(404).send({
        error: "Requested resource " + req.originalUrl + " does not exist"
    });
});

app.use('*', function (err, req, res, next) {
    console.error("== Error:", err);
    res.status(500).send({
        error: "Server error. Please try again later."
    });
});

connectToDb().then(function () {
    app.listen(port, function () {
        console.log("== Server is running on port", port);
    });
});

module.exports = app;
