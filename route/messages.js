'use strict'

const {Router} = require('express')
const httpErrors = require('http-errors')
const Message = require('../model/message.js')
const Profile = require('../model/profile.js')
const bearerAuth = require('../lib/bearer-auth-middleware.js')


const messageRouter = module.exports = new Router()

messageRouter.post('/messages', bearerAuth, (req, res, next) => {
  let profile

  if(!req.body.from || !req.body.to)
    return next(httpErrors(400, 'From and To required'))

  Profile.findOne({account: req.account._id})
    .then(tempProfile => {
      profile = tempProfile
      return Message.findOne({from: profile.id, to: req.body.to})
    })
    .then(message => {
      if(message)
        return next(httpErrors(409, 'Duplicate message'))

      return new Message({
        from: req.body.from,
        to: req.body.to,
        profile: profile._id,
      }).save()
    })
    .then(message => res.json(message))
    .catch(next)
})

messageRouter.get('/messages', bearerAuth, (req, res, next) => {
  let {page='0'} = req.query
  delete req.query.page
  page = Number(page)
  if(isNaN(page))
    page=0
  page = page < 0 ? 0 : page

  let queryArray, trueQuery, stringQuery
  if (req.url.split('?')[1]) {
    queryArray = req.url.split('?')[1].split('&')
    trueQuery = queryArray.filter(query => query.split('=')[0] !== 'page')
    stringQuery = trueQuery.join('&') + '&'
  }
  else
    stringQuery = ''

  let messagesCache
  Message.find(req.query)
    .populate('from')
    .populate('to')
    .skip(page * 100)
    .limit(100)
    .then(messages => {
      messagesCache = messages
      return Message.find(req.query).count()
    })
    .then(count => {
      let result = {
        count,
        data: messagesCache,
      }

      let lastPage = Math.floor(count / 100)
      res.links = {
        next: `http://${req.headers.host}/messages?${stringQuery}page=${page === lastPage ? lastPage : page+1}`,
        prev: `http://${req.headers.host}/messages?${stringQuery}page=${page < 1 ? 0 : page - 1}`,
        last: `http://${req.headers.host}/messages?${stringQuery}page=${lastPage}`,
      }
      res.json(result)
    })
    .catch(next)
})

messageRouter.get('/messages/:id', bearerAuth, (req, res, next) => {
  Message.findById(req.params.id)
    .populate('from')
    .populate('to')
    .then(message => {
      if (!message)
        throw httpErrors(404, '__REQUEST_ERROR__ message not found')
      res.json(message)
    })
    .catch(next)
})

messageRouter.delete('/messages/:id', bearerAuth, (req, res, next) => {
  Message.findByIdAndRemove(req.params.id)
    .then(() => res.sendStatus(204))
    .catch(next)
})
