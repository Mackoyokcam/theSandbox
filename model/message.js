'use strict'

const mongoose = require('mongoose')

const messageSchema = mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true, ref: 'profile' },
  to: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true, ref: 'profile' },
  messages: [{type: String}],
})

module.exports = mongoose.model('message', messageSchema)
