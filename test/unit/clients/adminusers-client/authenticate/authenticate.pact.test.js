'use strict'

const { Pact } = require('@pact-foundation/pact')
const path = require('path')

const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const userFixtures = require('../../../../fixtures/user.fixtures')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })
const User = require('../../../../../app/models/User.class')

// Constants
const AUTHENTICATE_PATH = '/v1/api/users/authenticate'

describe('adminusers client - authenticate', () => {
  const provider = new Pact({
    consumer: 'selfservice',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())

  const existingUsername = 'existing-user'
  const validPassword = 'password'

  describe('user is authenticated successfully', () => {
    const validPasswordResponse = userFixtures.validUserResponse({ username: existingUsername })
    const validPasswordRequestPactified = userFixtures
      .validPasswordAuthenticateRequest({
        username: existingUsername,
        usernameMatcher: existingUsername,
        password: validPassword,
        passwordMatcher: validPassword
      })

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${AUTHENTICATE_PATH}`)
          .withUponReceiving('a correct password for a user')
          .withState(`a user exists with username ${existingUsername} and password ${validPassword}`)
          .withMethod('POST')
          .withRequestBody(validPasswordRequestPactified)
          .withResponseBody(validPasswordResponse.getPactified())
          .withStatusCode(200)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should return the right authentication success response', done => {
      adminusersClient.authenticateUser(existingUsername, validPassword).then((response) => {
        expect(response).toEqual(new User(validPasswordResponse.getPlain()))
        done()
      })
    })
  })

  describe('user authentication fails', () => {
    const invalidPassword = 'some-password'
    const invalidPasswordResponse = userFixtures.invalidPasswordAuthenticateResponse()
    const invalidPasswordRequestPactified = userFixtures
      .invalidPasswordAuthenticateRequest({
        username: existingUsername,
        usernameMatcher: existingUsername,
        password: invalidPassword,
        passwordMatcher: invalidPassword
      })

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${AUTHENTICATE_PATH}`)
          .withUponReceiving('an incorrect password for a user')
          .withState(`a user exists with username ${existingUsername} and password ${validPassword}`)
          .withMethod('POST')
          .withRequestBody(invalidPasswordRequestPactified)
          .withResponseBody(invalidPasswordResponse.getPactified())
          .withStatusCode(401)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should return the right authentication failure response', done => {
      adminusersClient.authenticateUser(existingUsername, invalidPassword).then(() => {
        done('should not resolve here')
      }).catch(err => {
        expect(err.errorCode).toBe(401)
        expect(err.message.errors).toEqual(invalidPasswordResponse.getPlain().errors)
        done()
      })
    })
  })
})
