const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost:27017/postly')

const userSchema = mongoose.Schema({})

module.exports = mongoose.model("user", userSchema)