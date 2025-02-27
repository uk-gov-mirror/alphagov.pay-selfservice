'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { expect } = require('chai')
const { NotAuthenticatedError, UserAccountDisabledError, NotAuthorisedError, NotFoundError, PermissionDeniedError } = require('../../../app/errors')
const paths = require('../../../app/paths')
const User = require('../../../app/models/User.class')
const Service = require('../../../app/models/Service.class')
const userFixtures = require('../../fixtures/user.fixtures')
const serviceFixtures = require('../../fixtures/service.fixtures')
const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')

const correlationId = 'a-request-id'
const req = {
  headers: {
    'x-request-id': correlationId
  },
  session: {}
}

describe('Error handler middleware', () => {
  let res, next, errorHandler, infoLoggerSpy, errorLoggerSpy

  beforeEach(() => {
    next = sinon.spy()
    res = {
      headersSent: false,
      status: sinon.spy(),
      render: sinon.spy(),
      redirect: sinon.spy(),
      setHeader: sinon.stub()
    }

    infoLoggerSpy = sinon.spy()
    errorLoggerSpy = sinon.spy()
    errorHandler = proxyquire('../../../app/middleware/error-handler', {
      '../utils/logger': () => {
        return {
          info: infoLoggerSpy,
          error: errorLoggerSpy
        }
      }
    })
  })

  it('should pass error to next when headers have already been set on the response', () => {
    res.headersSent = true
    const err = new Error('some error')
    errorHandler(err, req, res, next)
    sinon.assert.calledWith(next, err)
  })

  it('should redirect to login page if error is NotAuthenticatedError', () => {
    req.originalUrl = '/some/url'
    const err = new NotAuthenticatedError('user is not logged in')
    errorHandler(err, req, res, null)
    sinon.assert.notCalled(next)
    sinon.assert.calledOnce(res.redirect)
    sinon.assert.calledWith(res.redirect, paths.user.logIn)
    expect(req.session.last_url).to.equal(req.originalUrl)
  })

  it('should render no access page if error is UserAccountDisabledError', () => {
    const err = new UserAccountDisabledError('user account is disabled')
    errorHandler(err, req, res, null)
    sinon.assert.notCalled(next)
    sinon.assert.calledOnce(res.status)
    sinon.assert.calledWith(res.status, 401)
    sinon.assert.calledOnce(res.render)
    sinon.assert.calledWith(res.render, 'login/noaccess')
  })

  it('should render error page with status code 403 if error is NotAuthorisedError', () => {
    const err = new NotAuthorisedError('user does not have permission')
    errorHandler(err, req, res, null)
    sinon.assert.notCalled(next)
    sinon.assert.calledOnce(res.status)
    sinon.assert.calledWith(res.status, 403)
    sinon.assert.calledOnce(res.render)
    sinon.assert.calledWith(res.render, 'error')
  })

  it('should render error page with status code 500 if error is general handled error', () => {
    const err = new Error('something went wrong')
    errorHandler(err, req, res, null)
    sinon.assert.notCalled(next)
    sinon.assert.calledOnce(res.status)
    sinon.assert.calledWith(res.status, 500)
    sinon.assert.calledOnce(res.render)
    sinon.assert.calledWith(res.render, 'error')
  })

  describe('Logging', () => {
    const userExternalId = 'a-user-external-id'
    const serviceExternalId = 'a-service-external-id'
    const gatewayAccountId = 'a-gateway-account-id'
    const reqWithSessionData = {
      ...req,
      user: new User(userFixtures.validUserResponse({ external_id: userExternalId })),
      service: new Service(serviceFixtures.validServiceResponse({ external_id: serviceExternalId })),
      account: gatewayAccountFixtures.validGatewayAccountResponse({ gateway_account_id: gatewayAccountId })
    }

    it('should log at info level for NotAuthenticatedError', () => {
      const err = new NotAuthenticatedError('not authenticated')
      const notAuthorisedReq = {
        ...reqWithSessionData,
        originalUrl: '/foo/bar'
      }
      errorHandler(err, notAuthorisedReq, res, null)

      const expectedMessage = 'NotAuthenticatedError handled: not authenticated. Redirecting attempt to access /foo/bar to /login'
      sinon.assert.calledWith(infoLoggerSpy, expectedMessage)
    })

    it('should log at info level for UserAccountDisabledError', () => {
      const err = new UserAccountDisabledError('user account disabled')
      errorHandler(err, reqWithSessionData, res, null)

      const expectedMessage = 'UserAccountDisabledError handled, rendering no access page'
      sinon.assert.calledWith(infoLoggerSpy, expectedMessage)
    })

    it('should log at info level for NotAuthorisedError', () => {
      const err = new NotAuthorisedError('user does not have authorisation')
      errorHandler(err, reqWithSessionData, res, null)

      const expectedMessage = 'NotAuthorisedError handled: user does not have authorisation. Rendering error page'
      sinon.assert.calledWith(infoLoggerSpy, expectedMessage)
    })

    it('should log at info level for PermissionDeniedError', () => {
      const err = new PermissionDeniedError('do-cool-things')
      errorHandler(err, reqWithSessionData, res, null)

      const expectedMessage = 'PermissionDeniedError handled: User does not have permission do-cool-things for service. Rendering error page'
      sinon.assert.calledWith(infoLoggerSpy, expectedMessage)
    })

    it('should log at info level for NotFoundError', () => {
      const err = new NotFoundError('Transaction not found')
      errorHandler(err, reqWithSessionData, res, null)

      const expectedMessage = 'NotFoundError handled: Transaction not found. Rendering 404 page'
      sinon.assert.calledWith(infoLoggerSpy, expectedMessage)
    })

    it('should log at error level for generic Error', () => {
      const err = new Error('A generic error')
      errorHandler(err, reqWithSessionData, res, null)

      const expectedMessage = 'Unhandled error caught: A generic error'
      sinon.assert.calledWithMatch(errorLoggerSpy, expectedMessage)
    })
  })
})
