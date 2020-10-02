const path = require('path')
require(path.join(__dirname, '/../test-helpers/serialize-mock.js'))
const request = require('supertest')
const nock = require('nock')
const getApp = require(path.join(__dirname, '/../../server.js')).getApp
const paths = require(path.join(__dirname, '/../../app/paths.js'))
const mockSession = require(path.join(__dirname, '/../test-helpers/mock-session.js'))
const assert = require('assert')
const adminusersMock = nock(process.env.ADMINUSERS_URL)
const USER_RESOURCE = '/v1/api/users'

const user = mockSession.getUser()
const session = mockSession.getMockSession(user)

const app = mockSession.getAppWithSessionAndGatewayAccountCookies(getApp(), session)

function buildGetRequest (path) {
  return request(app)
    .get(path)
}

describe('User clicks on Logout', () => {
  it('should get redirected to login page', done => {
    const incrementMock = adminusersMock
      .patch(`${USER_RESOURCE}/${user.externalId}`)
      .reply(200)

    buildGetRequest(paths.user.logOut)
      .expect(302, {})
      .expect('Location', paths.user.logIn)
      .expect(() => {
        assert(incrementMock.isDone())
        assert(session.destroy.called === true)
      })
      .end(done)
  })

  it(
    'should redirect to login page when session.version is undefined',
    done => {
      const gatewayAccountId = 12314
      const getMockSession = mockSession.getMockSession({ sessionVersion: 2, services: ['1'], gateway_account_ids: [gatewayAccountId] })
      delete getMockSession.version

      let app = mockSession.createAppWithSession(getApp(), getMockSession)

      request(app)
        .get('/')
        .expect(302)
        .expect('Location', '/login')
        .expect(() => {
          expect(getMockSession.version).toBeUndefined()  // eslint-disable-line
        })
        .end(done)
    }
  )

  it(
    'should update the session version on successful login of a user',
    done => {
      const gatewayAccountId = 12314
      const getMockSession = mockSession.getMockSession({ sessionVersion: 2, services: ['1'], gateway_account_ids: [gatewayAccountId] })
      delete getMockSession.version

      let app = mockSession.createAppWithSession(getApp(), getMockSession)

      request(app)
        .get('/')
        .expect(302)
        .expect('Location', '/login')
        .expect(() => {
          expect(getMockSession.version).toBeUndefined()  // eslint-disable-line
        })
        .end(done)
    }
  )
})
