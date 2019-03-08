'use strict'

const commonStubs = require('../../utils/common_stubs')

describe('Stripe setup: bank details page', () => {
  const gatewayAccountId = 42
  const userExternalId = 'userExternalId'
  const accountNumber = '00012345'
  const sortCode = '108800'
  const displaySortCode = '10 88 00'

  describe('Card gateway account', () => {
    const getStripeSetupStub = function getStripeSetupStub (bankAccountCompleted) {
      const stripeSetupStub = {
        name: 'getGatewayAccountStripeSetupSuccess',
        opts: {
          gateway_account_id: gatewayAccountId,
          bank_account: bankAccountCompleted
        }
      }
      return stripeSetupStub
    }

    const getStripeAccountStub = function getStripeAccountSuccess (stripeAccountId) {
      const stripeAccountStub = {
        name: 'getStripeAccountSuccess',
        opts: {
          gateway_account_id: gatewayAccountId,
          stripe_account_id: stripeAccountId
        }
      }
      return stripeAccountStub
    }

    /**
     * When request to /v1/api/accounts/${gateway_account_id}/stripe-setup is made
     * it will use data[].bank_account as a response
     * and it will use next data[].bank_account value in the response for consecutive API calls
     *
     * @param data
     * @returns {{opts: {gateway_account_id: number, data: *}, name: string}}
     */
    const getStripeBankAccountFlagChangedSetupStub = function getStripeBankAccountFlagChangedSetupStub (data) {
      const stripeBankAccountFlagStub = {
        name: 'getGatewayAccountStripeSetupBankAccountFlagChanged',
        opts: {
          gateway_account_id: gatewayAccountId,
          data: data
        }
      }
      return stripeBankAccountFlagStub
    }

    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
    })

    describe('Bank details page is shown', () => {
      beforeEach(() => {
        cy.task('setupStubs', [
          commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'stripe'),
          getStripeSetupStub(false),
          getStripeAccountStub('acct_123example123')
        ])

        cy.visit('/bank-details')
      })

      it('should display page correctly', () => {
        cy.get('h1').should('contain', 'Add bank details')

        cy.get('form#stripe-setup-bank-details-form').should('exist')
        cy.get('input#stripe-setup-account-number-input').should('exist')
        cy.get('input#stripe-setup-sort-code-input').should('exist')
        cy.get('#stripe-setup-bank-details-form > button[type=submit]').should('exist')
        cy.get('#stripe-setup-bank-details-form > button[type=submit]').should('contain', 'Continue')
      })

      it('should display an error when all fields are blank', () => {
        cy.get('#stripe-setup-bank-details-form > button[type=submit]').click()

        cy.get('h2').should('contain', 'There was a problem with the details you gave for:')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Account number')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#stripe-setup-account-number-input')
        cy.get('ul.govuk-error-summary__list > li:nth-child(2) > a').should('contain', 'Sort code')
        cy.get('ul.govuk-error-summary__list > li:nth-child(2) > a').should('have.attr', 'href', '#stripe-setup-sort-code-input')

        cy.get('input#stripe-setup-account-number-input').should('have.class', 'govuk-input--error')
        cy.get('label[for=stripe-setup-account-number-input] > span').should('contain', 'This field cannot be blank')

        cy.get('input#stripe-setup-sort-code-input').should('have.class', 'govuk-input--error')
        cy.get('label[for=stripe-setup-sort-code-input] > span').should('contain', 'This field cannot be blank')
      })

      it('should display an error when account number is invalid', () => {
        cy.get('#stripe-setup-account-number-input').type('abc')
        cy.get('#stripe-setup-sort-code-input').type(sortCode)

        cy.get('#stripe-setup-bank-details-form > button[type=submit]').click()

        cy.get('h2').should('contain', 'There was a problem with the details you gave for:')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Account number')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#stripe-setup-account-number-input')

        cy.get('input#stripe-setup-account-number-input').should('have.class', 'govuk-input--error')
        cy.get('label[for=stripe-setup-account-number-input] > span').should('contain', 'Enter a valid account number')
      })

      it('should display an error when sort code is invalid', () => {
        cy.get('#stripe-setup-account-number-input').type(accountNumber)
        cy.get('#stripe-setup-sort-code-input').type('abc')

        cy.get('#stripe-setup-bank-details-form > button[type=submit]').click()

        cy.get('h2').should('contain', 'There was a problem with the details you gave for:')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Sort code')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#stripe-setup-sort-code-input')

        cy.get('input#stripe-setup-sort-code-input').should('have.class', 'govuk-input--error')
        cy.get('label[for=stripe-setup-sort-code-input] > span').should('contain', 'Enter a valid sort code')
      })

      it('should go to check your answers page when inputs are valid', () => {
        cy.get('#stripe-setup-account-number-input').type(accountNumber)
        cy.get('#stripe-setup-sort-code-input').type(sortCode)

        cy.get('#stripe-setup-bank-details-form > button[type=submit]').click()

        cy.get('#stripe-setup-account-number-value').should('contain', accountNumber)
        cy.get('#stripe-setup-sort-code-value').should('contain', displaySortCode)

        cy.get('h1').should('contain', 'Check details before saving')
      })
    })

    describe('Bank account flag already true', () => {
      it('should redirect to Dashboard with an error message when on Bank details page', () => {
        cy.task('setupStubs', [
          commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'stripe'),
          getStripeSetupStub(true),
          getStripeAccountStub('acct_123example123')
        ])

        cy.visit('/bank-details')

        cy.get('h1').should('contain', 'Dashboard')
        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/`)
        })
        cy.get('.flash-container > .generic-error').should('contain', 'You’ve already provided your bank details.')
        cy.get('.flash-container > .generic-error').should('contain', 'Contact GOV.UK Pay support if you need to update them.')
      })

      it('should redirect to Dashboard with an error message when submitting Bank details page', () => {
        cy.task('setupStubs', [
          commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'stripe'),
          getStripeBankAccountFlagChangedSetupStub([
            { bank_account: false },
            { bank_account: true }
          ]),
          getStripeAccountStub('acct_123example123')
        ])

        cy.visit('/bank-details')

        cy.get('#stripe-setup-account-number-input').type(accountNumber)
        cy.get('#stripe-setup-sort-code-input').type(sortCode)
        cy.get('#stripe-setup-bank-details-form > button[type=submit]').click()

        cy.get('h1').should('contain', 'Dashboard')
        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/`)
        })
        cy.get('.flash-container > .generic-error').should('contain', 'You’ve already provided your bank details.')
        cy.get('.flash-container > .generic-error').should('contain', 'Contact GOV.UK Pay support if you need to update them.')
      })

      it('should redirect to Dashboard with an error message when submitting Check your answers page', () => {
        cy.task('setupStubs', [
          commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'stripe'),
          getStripeBankAccountFlagChangedSetupStub([
            { bank_account: false },
            { bank_account: false },
            { bank_account: true }
          ]),
          getStripeAccountStub('acct_123example123')
        ])

        cy.visit('/bank-details')

        // Bank details page
        cy.get('#stripe-setup-account-number-input').type(accountNumber)
        cy.get('#stripe-setup-sort-code-input').type(sortCode)
        cy.get('#stripe-setup-bank-details-form > button[type=submit]').click()

        // Check your answers page
        cy.get('#stripe-setup-bank-details-check-submit-form > button[type=submit]').click()

        // Dashboard page
        cy.get('h1').should('contain', 'Dashboard')
        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/`)
        })
        cy.get('.flash-container > .generic-error').should('contain', 'You’ve already provided your bank details.')
        cy.get('.flash-container > .generic-error').should('contain', 'Contact GOV.UK Pay support if you need to update them.')
      })
    })

    describe('Not a Stripe gateway account', () => {
      it('should show a 404 error when gateway account is not Stripe', () => {
        cy.task('setupStubs', [
          commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'sandbox'),
          getStripeSetupStub(false),
          getStripeAccountStub('acct_123example123')
        ])

        cy.visit('/bank-details', {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'Page not found')
      })
    })

    describe('Not a live gateway account', () => {
      it('should show a 404 error when gateway account is not live', () => {
        cy.task('setupStubs', [
          commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'test', 'stripe'),
          getStripeSetupStub(false),
          getStripeAccountStub('acct_123example123')
        ])

        cy.visit('/bank-details', {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'Page not found')
      })
    })

    describe('User does not have the correct permissions', () => {
      it('should show a permission error when the user does not have enough permissions', () => {
        cy.task('setupStubs', [
          commonStubs.getUserWithNoPermissionsStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'stripe')
        ])

        cy.visit('/bank-details')
        cy.get('h1').should('contain', 'An error occurred:')
        cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
      })
    })

    describe('Check your answers page', () => {
      beforeEach(() => {
        cy.task('setupStubs', [
          commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'stripe'),
          getStripeSetupStub(false),
          getStripeAccountStub('acct_123example123')
        ])

        cy.visit('/bank-details')

        cy.get('#stripe-setup-account-number-input').type(accountNumber)
        cy.get('#stripe-setup-sort-code-input').type(sortCode)
        cy.get('#stripe-setup-bank-details-form > button[type=submit]').click()
      })

      it('should go to check your answers page when inputs are valid', () => {
        cy.get('#stripe-setup-account-number-value').should('contain', accountNumber)
        cy.get('#stripe-setup-sort-code-value').should('contain', displaySortCode)

        cy.get('h1').should('contain', 'Check details before saving')
      })

      it('should go back to index page when change account number link clicked', () => {
        cy.get('#stripe-setup-account-number-change-button').click()
        cy.get('.govuk-error-summary').should('not.exist')

        cy.get('h1').should('contain', 'Add bank details')
        cy.get('#stripe-setup-account-number-input').should('have.value', accountNumber)
        cy.get('#stripe-setup-sort-code-input').should('have.value', displaySortCode)
      })

      it('should go back to index page when change sort code link clicked', () => {
        cy.get('#stripe-setup-sort-code-change-button').click()
        cy.get('.govuk-error-summary').should('not.exist')

        cy.get('h1').should('contain', 'Add bank details')
        cy.get('#stripe-setup-account-number-input').should('have.value', accountNumber)
        cy.get('#stripe-setup-sort-code-input').should('have.value', displaySortCode)
      })
    })
  })

  describe('Direct Debit gateway account', () => {
    const directDebitGatewayAccountId = 'DIRECT_DEBIT:101'

    it('should show an error page', () => {
      cy.setEncryptedCookies(userExternalId, directDebitGatewayAccountId)

      cy.task('setupStubs', [
        commonStubs.getUserStub(userExternalId, [directDebitGatewayAccountId]),
        commonStubs.getDirectDebitGatewayAccountStub(directDebitGatewayAccountId, 'live', 'go-cardless')
      ])

      cy.visit('/bank-details', {
        failOnStatusCode: false
      })

      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'This page is only available to card accounts not direct debit accounts.')
    })
  })
})
