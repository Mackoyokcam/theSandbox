'use strict'

const mongoose = require('mongoose')

const profileSchema = mongoose.Schema({
  name: { type: String, required: true },
  username: {type: String, required: true},
  email: {type: String, required: true},
  photo: {type: String},
  friends: [{type: mongoose.Schema.Types.ObjectId, ref: 'profile'}],
  location: {
    type: {type: String, default: 'Point'},
    coordinates: [{type: Number}],
  },
  account: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
})

module.exports = mongoose.model('profile', profileSchema)
