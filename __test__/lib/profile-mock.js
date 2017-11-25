'use strict'

const faker = require('faker')
const accountMock = require('./account-mock.js')
const Profile = require('../../model/profile.js')

// Resolves -> tempAccount, profile
let create = () => {
  let result = {}
  return accountMock.create()
    .then(tempAccount => {
      result.tempAccount = tempAccount
      return new Profile({
        name: `${faker.name.firstName()} ${faker.name.lastName()}`,
        photo: undefined,
        username: result.tempAccount.account.username,
        email: result.tempAccount.account.email,
        account: result.tempAccount.account._id,
      }).save()
    })
    .then(profile => {
      result.profile = profile
      return result
    })
}

let createMany = (num) => {
  return Promise.all(new Array(num).fill(0).map(() => create()))
}

let remove = () => {
  return Promise.all([
    accountMock.remove(),
    Profile.remove({}),
  ])
}

module.exports = { create, createMany, remove }
