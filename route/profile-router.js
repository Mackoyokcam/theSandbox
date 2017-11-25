'use strict'

const { Router } = require('express')
const httpErrors = require('http-errors')
const multer = require('multer')
const s3 = require('../lib/s3.js')
const bearerAuth = require('../lib/bearer-auth-middleware.js')
const Profile = require('../model/profile.js')

const upload = multer({ dest: `${__dirname}/../temp` })

const apiURL = `${process.env.API_URL}`
let fuzzy = (filterTerm) => new RegExp('.*' + filterTerm.toLowerCase().split('').join('.*') + '.*')

module.exports = new Router()
  .post('/profiles', bearerAuth, (req, res, next) => {
    return new Profile({
      ...req.body,
      photo: undefined,
      account: req.account._id,
      username: req.account.username,
      email: req.account.email,
    }).save()
      .then(() => {
        return Profile.findOne({account: req.account._id})
          .populate('friends')
      })
      .then(profile => {
        res.json(profile)
      })
      .catch(next)
  })

  .get('/profiles/me', bearerAuth, (req, res, next) => {
    Profile.findOne({account: req.account._id})
      .then(profile => {
        if (!profile)
          throw httpErrors(404, '__REQUEST_ERROR__ profile not found')
        res.json(profile)
      })
      .catch(next)
  })

  .get('/profiles/:id', bearerAuth, (req, res, next) => {
    Profile.findById(req.params.id)
      .then(profile => {
        if (!profile)
          throw httpErrors(404, '__REQUEST_ERROR__ profile not found')
        res.json(profile)
      })
      .catch(next)
  })
  .get('/profiles', bearerAuth, (req, res, next) => {
    let { page = '0' } = req.query
    delete req.query.page
    page = Number(page)
    if (isNaN(page))
      page = 0
    page = page < 0 ? 0 : page

    // Fuzzy Search
    if (req.query.name) req.query.name = ({$regex: fuzzy(req.query.name), $options: 'i'})

    let profilesCache
    Profile.find(req.query)
      .skip(page * 10)
      .limit(10)
      .then(profiles => {
        profilesCache = profiles
        return Profile.find(req.query).count()
      })
      .then(count => {
        let result = {
          count,
          data: profilesCache,
        }

        let lastPage = Math.floor(count / 10)
        res.links({
          next: `${apiURL}/products?page=${page === lastPage ? lastPage : page+1}`,
          prev: `${apiURL}/products?page=${page < 1 ? 0 : page - 1}`,
          last: `${apiURL}/products?page=${lastPage}`,
        })
        res.json(result)
      })
      .catch(next)
  })

  .put('/profiles/avatar', bearerAuth, upload.any(), (req, res, next) => {
    let file = req.files[0]
    let key = `${file.filename}.${file.originalname}`
    return s3.upload(file.path, key)
      .then(url => {
        return Profile.findOneAndUpdate({ account: req.account._id }, { photo: url }, { new: true, runValidators: true })
      })
      .then(profile => {
        if (!profile)
          throw httpErrors(404, '__REQUEST_ERROR__ profile not found')
        res.json(profile)
      })
      .catch(next)
  })

  .put('/profiles/:id', bearerAuth, (req, res, next) => {
    if (!req.body.name)
      return next(httpErrors(400, 'name required'))
    Profile.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .then(profile => {
        if (!profile)
          throw httpErrors(404, '__REQUEST_ERROR__ profile not found')
        res.json(profile)
      })
      .catch(next)
  })
