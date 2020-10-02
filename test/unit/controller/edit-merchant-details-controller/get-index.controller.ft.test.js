'use strict'

const cheerio = require('cheerio')
const nock = require('nock')
const supertest = require('supertest')

const mockSession = require('../../../test-helpers/mock-session.js')
const getApp = require('../../../../server.js').getApp
const userFixtures = require('../../../fixtures/user.fixtures')
const paths = require('../../../../app/paths.js')
const formattedPathFor = require('../../../../app/utils/replace-params-in-path')
const adminusersMock = nock(process.env.ADMINUSERS_URL)
const USER_RESOURCE = '/v1/api/users'

let response, user, $

describe('Organisation details controller - get', () => {
  afterEach(() => {
    nock.cleanAll()
  })
  const EXTERNAL_ID_IN_SESSION = 'exsfjpwoi34op23i4'
  const EXTERNAL_SERVICE_ID = 'dsfkbskjalksjdlk342'
  const adminRole = {
    name: 'admin',
    description: 'Administrator',
    permissions: [{ name: 'merchant-details:read' }, { name: 'merchant-details:update' }]
  }

  describe('when the organisation already has details (CREDIT CARD GATEWAY ACCOUNT)', () => {
    beforeAll(done => {
      user = userFixtures.validUserResponse({
        service_roles: [{
          service: {
            external_id: EXTERNAL_SERVICE_ID,
            gateway_account_ids: ['20'],
            merchant_details: {
              name: 'name',
              telephone_number: '',
              address_line1: 'line1',
              address_line2: 'line2',
              address_city: 'City',
              address_postcode: 'POSTCODE',
              address_country: 'GB',
              email: ''
            }
          },
          role: adminRole
        }]
      })
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      const app = mockSession.getAppWithLoggedInUser(getApp(), user.getAsObject())
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it(`should get a nice 200 status code`, () => {
      expect(response.statusCode).toBe(200)
    })
    it(`should show table with the organisation details`, () => {
      expect($('#merchant-name').text()).toEqual(expect.arrayContaining(['name']))
      expect($('#merchant-address').text()).toEqual(expect.arrayContaining(['line1']))
      expect($('#merchant-address').text()).toEqual(expect.arrayContaining(['line2']))
      expect($('#merchant-address').text()).toEqual(expect.arrayContaining(['City']))
      expect($('#merchant-address').text()).toEqual(expect.arrayContaining(['POSTCODE']))
      expect($('#merchant-address').text()).toEqual(expect.arrayContaining(['United Kingdom']))
    })
  })
  describe('when the merchant already has details (DIRECT DEBIT GATEWAY ACCOUNT)', () => {
    beforeAll(done => {
      const user = userFixtures.validUserResponse({
        service_roles: [{
          service: {
            external_id: EXTERNAL_SERVICE_ID,
            gateway_account_ids: ['DIRECT_DEBIT:somerandomidhere'],
            merchant_details: {
              name: 'name',
              telephone_number: '03069990000',
              address_line1: 'line1',
              address_line2: 'line2',
              address_city: 'City',
              address_postcode: 'POSTCODE',
              address_country: 'GB',
              email: 'dd-merchant@example.com'
            }
          },
          role: adminRole
        }]
      })
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      const app = mockSession.getAppWithLoggedInUser(getApp(), user.getAsObject())
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it(`should get a nice 200 status code`, () => {
      expect(response.statusCode).toBe(200)
    })
    it(`should show table with the organisation details`, () => {
      expect($('#merchant-name').text()).toEqual(expect.arrayContaining(['name']))
      expect($('#telephone-number').text()).toEqual(expect.arrayContaining(['03069990000']))
      expect($('#merchant-email').text()).toEqual(expect.arrayContaining(['dd-merchant@example.com']))
      expect($('#merchant-address').text()).toEqual(expect.arrayContaining(['line1']))
      expect($('#merchant-address').text()).toEqual(expect.arrayContaining(['line2']))
      expect($('#merchant-address').text()).toEqual(expect.arrayContaining(['City']))
      expect($('#merchant-address').text()).toEqual(expect.arrayContaining(['POSTCODE']))
      expect($('#merchant-address').text()).toEqual(expect.arrayContaining(['United Kingdom']))
    })
  })
  describe('when the merchant has empty details (CREDIT CARD GATEWAY ACCOUNT)', () => {
    beforeAll(done => {
      const user = userFixtures.validUserResponse({
        service_roles: [{
          service: {
            external_id: EXTERNAL_SERVICE_ID,
            gateway_account_ids: ['20'],
            merchant_details: undefined
          },
          role: adminRole
        }]
      })
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      const app = mockSession.getAppWithLoggedInUser(getApp(), user.getAsObject())
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it(`should get a nice 302 status code`, () => {
      expect(response.statusCode).toBe(302)
    })
    it('should redirect to the edit page', () => {
      expect(response.headers).to.have.property('location').toBe(formattedPathFor(paths.merchantDetails.edit, EXTERNAL_SERVICE_ID))
    })
  })
  describe('should redirect to edit when the merchant name is set but not the address', () => {
    beforeAll(done => {
      const user = userFixtures.validUserResponse({
        service_roles: [{
          service: {
            external_id: EXTERNAL_SERVICE_ID,
            gateway_account_ids: ['20'],
            merchant_details: {
              name: 'name'
            }
          },
          role: adminRole
        }]
      })
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      const app = mockSession.getAppWithLoggedInUser(getApp(), user.getAsObject())
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it(`should get a nice 302 status code`, () => {
      expect(response.statusCode).toBe(302)
    })
    it('should redirect to the edit page', () => {
      expect(response.headers).to.have.property('location').toBe(formattedPathFor(paths.merchantDetails.edit, EXTERNAL_SERVICE_ID))
    })
  })
  describe('should redirect to edit when the mandatory address fields have not been set', () => {
    beforeAll(done => {
      const user = userFixtures.validUserResponse({
        service_roles: [{
          service: {
            external_id: EXTERNAL_SERVICE_ID,
            gateway_account_ids: ['20'],
            merchant_details: {
              name: 'name',
              address_line1: 'line1'
            }
          },
          role: adminRole
        }]
      })
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      const app = mockSession.getAppWithLoggedInUser(getApp(), user.getAsObject())
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it(`should get a nice 302 status code`, () => {
      expect(response.statusCode).toBe(302)
    })
    it('should redirect to the edit page', () => {
      expect(response.headers).to.have.property('location').toBe(formattedPathFor(paths.merchantDetails.edit, EXTERNAL_SERVICE_ID))
    })
  })
  describe('when the merchant has empty details (DIRECT DEBIT GATEWAY ACCOUNT)', () => {
    beforeAll(done => {
      const user = userFixtures.validUserResponse({
        service_roles: [{
          service: {
            external_id: EXTERNAL_SERVICE_ID,
            gateway_account_ids: ['DIRECT_DEBIT:somerandomidhere'],
            merchant_details: undefined

          },
          role: adminRole
        }]
      })
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      const app = mockSession.getAppWithLoggedInUser(getApp(), user.getAsObject())
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it(`should get a nice 302 status code`, () => {
      expect(response.statusCode).toBe(302)
    })
    it('should redirect to the edit page', () => {
      expect(response.headers).to.have.property('location').toBe(formattedPathFor(paths.merchantDetails.edit, EXTERNAL_SERVICE_ID))
    })
  })
  describe('when the merchant has empty details (DIRECT DEBIT GATEWAY ACCOUNT and CREDIT CARD GATEWAY ACCOUNT)', () => {
    beforeAll(done => {
      const user = userFixtures.validUserResponse({
        service_roles: [{
          service: {
            external_id: EXTERNAL_SERVICE_ID,
            gateway_account_ids: ['DIRECT_DEBIT:somerandomidhere', '12345'],
            merchant_details: undefined

          },
          role: adminRole
        }]
      })
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      const app = mockSession.getAppWithLoggedInUser(getApp(), user.getAsObject())
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it(`should get a nice 302 status code`, () => {
      expect(response.statusCode).toBe(302)
    })
    it('should redirect to the edit page', () => {
      expect(response.headers).to.have.property('location').toBe(formattedPathFor(paths.merchantDetails.edit, EXTERNAL_SERVICE_ID))
    })
  })
})
