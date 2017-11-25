'use strict'

const mongoose = require('mongoose')

const profileSchema = mongoose.Schema({
  name: { type: String, required: true },
  photo: {type: String},
  location: {
    type: {type: String, default: 'Point'},
    coordinates: [{type: Number}],
  },
  account: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
})

module.exports = mongoose.model('profile', profileSchema)
