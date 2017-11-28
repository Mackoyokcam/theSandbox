'use strict'

require('dotenv').config()

const cors = require('cors')
const morgan = require('morgan')
const {Server} = require('http')
const express = require('express')
const mongoose = require('mongoose')
const jsonParser = require('body-parser').json()
const authRouter = require('../route/auth-router.js')
const errorHandler = require('./error-middleware.js')
const profileRouter = require('../route/profile-router.js')

// See index.js on why we can use this syntax...
import realtime from './realtime.js'
import fourOhFour from './four-oh-four.js'

// Enable promises
mongoose.Promise = Promise

// State
const app = express()
let server = null

const production = process.env.NODE_ENV === 'production'

// Register middleware
app.use(jsonParser)
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }))
app.use(morgan(production ? 'combined' : 'dev'))

// Register routes
app.use(authRouter)
app.use(profileRouter)

// Register 404 route
app.use(fourOhFour)

// Register error handler
app.use(errorHandler)

module.exports = {
  start: () => {
    return new Promise((resolve, reject) => {
      if (server)
        return reject(new Error('__SERVER_ERROR__ server is already on'))
      server = realtime(Server(app)).listen(process.env.PORT, () => {
        console.log('__SERVER_ON__', process.env.PORT)
        return resolve()
      })
    })
      .then(() => mongoose.connect(process.env.MONGODB_URI, { useMongoClient: true }))
  },
  stop: () => {
    return new Promise((resolve, reject) => {
      if (!server)
        return reject(new Error('__SERVER_ERROR__ server is already off'))
      server.close(() => {
        server = null
        console.log('__SERVER_OFF__')
        return resolve()
      })
    })
      .then(() => mongoose.disconnect())
  },
}
