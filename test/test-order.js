var assert = require('chai').assert;
var app = require('../server/server');
var loopback = require('loopback');
var expect = require('chai').expect;

var order = loopback.findModel('Order');
describe('Order model', function() {
  it('simple - syntax 1', function(done) {
    var msg = "Beetroot 2 kg";
    order.formOrder(null, null, msg, function(err, data) {
      var items = data.items;
      expect(items.length).to.be.equal(1);
      expect(items[0].productId).to.be.not.empty;
      expect(items[0].qty).to.be.equal("2");
      expect(items[0].unit).to.be.equal("kg");
      done();
    })
  });

  it('simple - syntax 2', function(done) {
    var msg = "Beetroot 2kg";
    order.formOrder(null, null, msg, function(err, data) {
      var items = data.items;
      expect(items.length).to.be.equal(1);
      expect(items[0].productId).to.be.not.empty;
      expect(items[0].qty).to.be.equal("2");
      expect(items[0].unit).to.be.equal("kg");
      done();
    })
  });

  it('simple - syntax 2', function(done) {
    var msg = "Beetroot 2kg";
    order.formOrder(null, null, msg, function(err, data) {
      var items = data.items;
      expect(items.length).to.be.equal(1);
      expect(items[0].productId).to.be.not.empty;
      expect(items[0].qty).to.be.equal("2");
      expect(items[0].unit).to.be.equal("kg");
      done();
    })
  });

  it('simple - syntax 3', function(done) {
    var msg = "2kg Beetroot";
    order.formOrder(null, null, msg, function(err, data) {
      var items = data.items;
      expect(items.length).to.be.equal(1);
      expect(items[0].productId).to.be.not.empty;
      expect(items[0].qty).to.be.equal("2");
      expect(items[0].unit).to.be.equal("kg");
      done();
    })
  });


  it('compound - delimiter', function(done) {
    var msg = "Beetroot 2kg, Cabbage 1 kg. Potato 250 gms\n Pumpkin 1 no";
    order.formOrder(null, null, msg, function(err, data) {
      var items = data.items;
      expect(items.length).to.be.equal(4);
      done();
    })
  });

  it('unavailable product', function(done) {
    var msg = "Mango 2kg";
    order.formOrder(null, null, msg, function(err, data) {
      expect(err).to.be.not.empty;
      done();
    })
  });

  it('case insensitive', function(done) {
    var msg = "potato 2kg";
    order.formOrder(null, null, msg, function(err, data) {
      var items = data.items;
      expect(items.length).to.be.equal(1);
      expect(items[0].productId).to.be.not.empty;
      done();
    })
  });

  it('i love you bug :D', function(done) {
    var msg = "I love you";
    order.formOrder(null, null, msg, function(err, data) {
      expect(err).to.be.not.empty;
      done();
    })
  });
});