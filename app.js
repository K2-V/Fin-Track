const express = require('express')
const {request} = require("express");
const connectDB = require('./config/db');wd
const app = express()
const port = 3000

connectDB();
app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
