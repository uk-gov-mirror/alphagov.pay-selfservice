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

describe('Two factor authenticator configure page GET', () => {
  describe('if setting up an APP', () => {
    let result, $, session
    beforeAll(done => {
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'transactions:read' }],
        second_factor: 'APP'
      })
      nock(CONNECTOR_URL)
        .get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
        .reply(200, {
          payment_provider: 'sandbox'
        })

      session = getMockSession(user)
      lodash.set(session, 'pageData.twoFactorAuthMethod', 'APP')
      supertest(createAppWithSession(getApp(), session))
        .get(paths.user.twoFactorAuth.configure)
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

    it(`should include a link to My Profile`, () => {
      expect($('.govuk-back-link').attr('href')).toBe(paths.user.profile)
    })

    it(`should have itself as the form action`, () => {
      expect($('form').attr('action')).toBe(paths.user.twoFactorAuth.configure)
    })

    it(
      `should have a base64 encoded image in the image src for the QR code`,
      () => {
        expect($('.qr-code').attr('src')).toEqual(expect.arrayContaining(['data:image/png;base64']))
      }
    )
  })
  describe('if setting up SMS', () => {
    let result, $, session
    beforeAll(done => {
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'transactions:read' }],
        second_factor: 'APP'
      })
      nock(CONNECTOR_URL)
        .get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
        .reply(200, {
          payment_provider: 'sandbox'
        })

      session = getMockSession(user)
      lodash.set(session, 'pageData.twoFactorAuthMethod', 'SMS')
      supertest(createAppWithSession(getApp(), session))
        .get(paths.user.twoFactorAuth.configure)
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

    it(`should include a link to My Profile`, () => {
      expect($('.govuk-back-link').attr('href')).toBe(paths.user.profile)
    })

    it(`should have itself as the form action`, () => {
      expect($('form').attr('action')).toBe(paths.user.twoFactorAuth.configure)
    })

    it(`should not show a QR code`, () => {
      expect($('.qr-code').length).toBe(0)
    })
  })
  describe('if returning to page with validation errors', () => {
    const verificationCodeError = 'Problem with verification code'
    let result, $, session
    beforeAll(done => {
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'transactions:read' }],
        second_factor: 'APP'
      })
      nock(CONNECTOR_URL)
        .get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
        .reply(200, {
          payment_provider: 'sandbox'
        })

      session = getMockSession(user)
      lodash.set(session, 'pageData.twoFactorAuthMethod', 'SMS')
      lodash.set(session, 'pageData.configureTwoFactorAuthMethodRecovered', {
        errors: {
          verificationCode: verificationCodeError
        }
      })
      supertest(createAppWithSession(getApp(), session))
        .get(paths.user.twoFactorAuth.configure)
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

    it('should show an error summary', () => {
      expect($('.govuk-error-summary__list li').length).toBe(1)
      expect($('.govuk-error-summary__list li a[href$="#code"]').text()).toBe(verificationCodeError)
    })

    it('should show inline errors', () => {
      expect($('.govuk-error-message').length).toBe(1)
    })
  })
})
