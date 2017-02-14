require(__dirname + '/../test_helpers/serialize_mock.js');
var request = require('supertest');
var should = require('should');
var getApp = require(__dirname + '/../../server.js').getApp;

describe('The /healthcheck endpoint returned json', function () {

  it('should return 200', function (done) {
    var expectedResponse = {'ping': {'healthy': true}};
    request(getApp())
      .get('/healthcheck')
      .set('Accept', 'application/json')
      .expect(200)
      .expect(function (res) {
        response = JSON.parse(res.text);
        expectedResponse.ping.healthy.should.equal(response.ping.healthy);
      }).end(done);
  });
});
