const path = require('path')
const nock = require('nock')
const getApp = require(path.join(__dirname, '/../../server.js')).getApp
const supertest = require('supertest')
const session = require(path.join(__dirname, '/../test-helpers/mock-session.js'))
const csrf = require('csrf')
const roles = require('../../app/utils/roles').roles
const paths = require(path.join(__dirname, '/../../app/paths.js'))
const inviteFixtures = require(path.join(__dirname, '/../fixtures/invite.fixtures'))

const adminusersMock = nock(process.env.ADMINUSERS_URL)

const formattedPathFor = require('../../app/utils/replace-params-in-path')

describe('invite user controller', () => {
  const userInSession = session.getUser({})
  const EXTERNAL_SERVICE_ID = userInSession.serviceRoles[0].service.externalId
  userInSession.serviceRoles[0].role.permissions.push({ name: 'users-service:create' })
  const INVITE_RESOURCE = `/v1/api/invites/user`

  describe('invite user index view', () => {
    it('should display invite page', done => {
      const app = session.getAppWithLoggedInUser(getApp(), userInSession)

      supertest(app)
        .get(formattedPathFor(paths.teamMembers.invite, EXTERNAL_SERVICE_ID))
        .set('Accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.body.teamMemberIndexLink).toBe(formattedPathFor(paths.teamMembers.index, EXTERNAL_SERVICE_ID))
          expect(res.body.teamMemberInviteSubmitLink).toBe(formattedPathFor(paths.teamMembers.invite, EXTERNAL_SERVICE_ID))
          expect(res.body.admin.id).toBe(roles['admin'].extId)
          expect(res.body.viewAndRefund.id).toBe(roles['view-and-refund'].extId)
          expect(res.body.view.id).toBe(roles['view-only'].extId)
        })
        .end(done)
    })
  })

  describe('invite user', () => {
    it('should invite a new team member successfully', done => {
      const validInvite = inviteFixtures.validInviteRequest()
      adminusersMock.post(INVITE_RESOURCE)
        .reply(201, inviteFixtures.validInviteResponse(validInvite.getPlain()))
      const app = session.getAppWithLoggedInUser(getApp(), userInSession)

      supertest(app)
        .post(formattedPathFor(paths.teamMembers.invite, EXTERNAL_SERVICE_ID))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'invitee-email': 'invitee@example.com',
          'role-input': roles['admin'].extId,
          csrfToken: csrf().create('123')
        })
        .expect(303, {})
        .expect('Location', formattedPathFor(paths.teamMembers.index, EXTERNAL_SERVICE_ID))
        .end(done)
    })

    it('should error if the user is already invited/exists', done => {
      const existingUser = 'existing-user@example.com'
      adminusersMock.post(INVITE_RESOURCE)
        .reply(412, inviteFixtures.conflictingInviteResponseWhenEmailUserAlreadyCreated(existingUser).getPlain())
      const app = session.getAppWithLoggedInUser(getApp(), userInSession)

      supertest(app)
        .post(formattedPathFor(paths.teamMembers.invite, EXTERNAL_SERVICE_ID))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'invitee-email': existingUser,
          'role-input': roles['admin'].extId,
          csrfToken: csrf().create('123')
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.error.message).toEqual(expect.arrayContaining([existingUser]))
        })
        .end(done)
    })

    it('should error on unknown role externalId', done => {
      const unknownRoleId = '999'

      const app = session.getAppWithLoggedInUser(getApp(), userInSession)

      supertest(app)
        .post(formattedPathFor(paths.teamMembers.invite, EXTERNAL_SERVICE_ID))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'invitee-email': 'invitee@example.com',
          'role-input': unknownRoleId,
          csrfToken: csrf().create('123')
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Unable to send invitation at this time')
        })
        .end(done)
    })
  })
})
