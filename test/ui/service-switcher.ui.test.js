'use strict'

const _ = require('lodash')

const { render } = require('../test-helpers/html-assertions.js')

// Assignments e.t.c.
let body, templateData

const serviceOne = {
  external_id: 'abc123',
  name: 'Super Mega Service',
  gateway_accounts: [{
    id: '1',
    service_name: 'gateway account 1',
    type: 'test'
  }, {
    id: '2',
    service_name: 'gateway account 2',
    type: 'live'
  }]
}

const serviceTwo = {
  external_id: 'def456',
  name: '',
  gateway_accounts: [{
    id: '3',
    service_name: 'gateway account 3',
    type: 'test'
  }, {
    id: '4',
    service_name: 'gateway account 4',
    type: 'live'
  }]
}

describe('The account switcher link', () => {
  it('should display My services link', () => {
    body = render('layout', {})

    expect(body).containSelector('#my-services').withExactText('My services')
  })

  describe('when a user has a single service and is an admin of that service', () => {
    beforeAll(() => {
      templateData = {
        permissions: {
          users_service_create: true
        },
        services: [_.extend(serviceOne, {
          permissions: {
            users_service_create: true
          }
        })]
      }

      body = render('services/index', templateData)
    })

    it(
      'should display Manage Team Members link in switcher page when user has permission to create users',
      () => {
        expect(body).containSelector('a.manage-team-members').withExactText('Manage team members for Super Mega Service')
      }
    )

    it(
      `should render a service if a user is a member of a single services`,
      () => {
        expect(body).containSelector('.service-name').property('length').toBe(1)
      }
    )
  })

  describe('when a user has multiple services and only has view permissions', () => {
    beforeAll(() => {
      templateData = {
        services: [
          _.extend(serviceOne, {
            permissions: {
              users_service_create: false
            }
          }),
          serviceTwo
        ]
      }

      body = render('services/index', templateData)
    })

    it(`should render a blank h2 tag if service name is blank`, () => {
      expect(body).containSelector('h2.service-name').withText('')
    })

    it(
      `should render the service name in a h2 tag if service name is defined`,
      () => {
        expect(body).containSelector('h2.service-name').withText('Super Mega Service')
      }
    )

    it(
      `should render multiple service if a user is a member of multiple services`,
      () => {
        expect(body).containSelector('.service-name').property('length').toBe(2)
      }
    )

    it('should display View Team Members link in each switcher page', () => {
      expect(body).containSelector('a.view-team-members').property('length').toBe(2)
      expect(body).containSelector('a.view-team-members').withText('View team members')
    })
  })

  it(
    `should render no services message if a user is a member of no services`,
    () => {
      templateData = {
        services: []
      }

      body = render('services/index', templateData)

      expect(body).containSelector('.service-count').withText('You have 0 services')
    }
  )

  it('should render added to new service message', () => {
    const myNewService = 'My New Service'
    templateData = {
      services: [serviceOne],
      new_service_name: myNewService
    }

    body = render('services/index', templateData)

    expect(body).containSelector('#new-service-name').withText(`You have been added to ${myNewService}`)
  })
})
