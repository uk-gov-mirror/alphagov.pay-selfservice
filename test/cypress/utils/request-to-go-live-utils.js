'use strict'

const userStubs = require('../utils/user-stubs')

const variables = {
  userExternalId: 'userExternalId',
  gatewayAccountId: 42,
  serviceExternalId: 'afe452323dd04d1898672bfaba25e3a6'
}

const buildServiceRoleForGoLiveStage = (goLiveStage) => {
  return {
    service: {
      external_id: variables.serviceExternalId,
      current_go_live_stage: goLiveStage,
      gateway_account_ids: [variables.gatewayAccountId]
    }
  }
}

const buildServiceRoleForGoLiveStageWithMerchantName = (goLiveStage) => {
  return {
    service: {
      external_id: variables.serviceExternalId,
      current_go_live_stage: goLiveStage,
      gateway_account_ids: [variables.gatewayAccountId],
      merchant_details: {
        name: 'Merchant name'
      }
    }
  }
}

const buildServiceRoleWithMerchantDetails = (merchantDetails, goLiveStage) => {
  return {
    service: {
      external_id: variables.serviceExternalId,
      gateway_account_ids: [variables.gatewayAccountId],
      merchant_details: merchantDetails,
      current_go_live_stage: goLiveStage
    }
  }
}

const getUserAndGatewayAccountStubs = (serviceRole) => {
  return [
    userStubs.getUserSuccessWithServiceRole({ userExternalId: variables.userExternalId, serviceRole }),
    {
      name: 'getGatewayAccountSuccess',
      opts: { gateway_account_id: variables.gatewayAccountId }
    }
  ]
}

const getUserWithModifiedServiceRoleOnNextRequestStub = (serviceRoleBefore, serviceRoleAfter) =>
  [{
    name: 'getUserSuccessRepeatFirstResponseNTimes',
    opts: [{
      external_id: variables.userExternalId,
      service_roles: [serviceRoleBefore],
      repeat: 2
    }, {
      external_id: variables.userExternalId,
      service_roles: [serviceRoleAfter],
      repeat: 2
    }]
  }, {
    name: 'getGatewayAccountSuccess',
    opts: { gateway_account_id: variables.gatewayAccountId }
  }]

const patchUpdateGoLiveStageSuccessStub = (currentGoLiveStage) => {
  return {
    name: 'patchUpdateServiceGoLiveStageSuccess',
    opts: {
      external_id: variables.serviceExternalId,
      gateway_account_ids: [variables.gatewayAccountId],
      current_go_live_stage: currentGoLiveStage
    }
  }
}

const patchUpdateGoLiveStageErrorStub = (currentGoLiveStage) => {
  return {
    name: 'patchGoLiveStageFailure',
    opts: {
      external_id: variables.serviceExternalId,
      gateway_account_ids: [variables.gatewayAccountId],
      current_go_live_stage: currentGoLiveStage,
      path: 'current_go_live_stage',
      value: currentGoLiveStage
    }
  }
}

const patchUpdateServiceSuccessCatchAllStub = (currentGoLiveStage) => {
  return {
    name: 'patchUpdateServiceSuccessCatchAll',
    opts: {
      external_id: variables.serviceExternalId,
      current_go_live_stage: currentGoLiveStage
    }
  }
}

const setupGetUserAndGatewayAccountStubs = (serviceRole) => {
  cy.task('setupStubs', getUserAndGatewayAccountStubs(serviceRole))
}

module.exports = {
  variables,
  buildServiceRoleForGoLiveStage,
  buildServiceRoleForGoLiveStageWithMerchantName,
  buildServiceRoleWithMerchantDetails,
  getUserAndGatewayAccountStubs,
  getUserWithModifiedServiceRoleOnNextRequestStub,
  patchUpdateGoLiveStageSuccessStub,
  patchUpdateGoLiveStageErrorStub,
  patchUpdateServiceSuccessCatchAllStub,
  setupGetUserAndGatewayAccountStubs
}
