'use strict'

// Sets environment variables from .env file
require('dotenv').config()

// Check to see that environment vars exist
require('./lib/assert-env.js')

// Every require after babel register can user babelified ES6
require('babel-register')

//Start the server
require('./lib/server.js').start()
