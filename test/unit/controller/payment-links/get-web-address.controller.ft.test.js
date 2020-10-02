'use strict'

const supertest = require('supertest')
const cheerio = require('cheerio')
const nock = require('nock')
const lodash = require('lodash')

const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')
const { CONNECTOR_URL } = process.env
const GATEWAY_ACCOUNT_ID = '929'

describe('Create payment link web address controller', () => {
  describe('if landing here for the first time', () => {
    let result, $, session
    beforeAll(done => {
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'tokens:create' }]
      })
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        payment_provider: 'sandbox'
      })
      session = getMockSession(user)
      lodash.set(session, 'pageData.createPaymentLink', {
        paymentLinkTitle: 'Pay for an offline service',
        paymentLinkDescription: 'Hello world',
        productNamePath: 'pay-for-offline-service'
      })
      supertest(createAppWithSession(getApp(), session))
        .get(paths.paymentLinks.webAddress)
        .end((err, res) => {
          result = res
          $ = cheerio.load(res.text)
          done(err)
        })
    })
    afterAll(() => {
      nock.cleanAll()
    })

    it('should return a statusCode of 200', () => {
      expect(result.statusCode).toBe(200)
    })

    it(
      `should include a cancel link linking to the Create payment link index`,
      () => {
        expect($('.cancel').attr('href')).toBe(paths.paymentLinks.start)
      }
    )

    it(`should have itself as the form action`, () => {
      expect($('form').attr('action')).toBe(paths.paymentLinks.webAddress)
    })

    it(`should an input containing the product path`, () =>
      expect($(`input[type="text"]`).val()).toBe(session.pageData.createPaymentLink.productNamePath))
  })
})
