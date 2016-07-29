var loopback = require('loopback');
var async = require('async');

module.exports = function(Order) {
  Order.formOrder = function(vendorId, customerId, message, cb) {
    
    var dict = loopback.findModel('Dictionary');
    dict.find({}, function(err, data) {
      data.sort(function(a, b){return b.source.length - a.source.length});
      for (var i = 0; i<data.length; i++) {
        var d = data[i];
        var re = new RegExp(d.source, "g");
        message = message.replace(d.source, d.dest);
      }
      console.log(message);
      var items = message.split(/[,\n]/);
      var product = loopback.findModel("Product");
      var orderItems = [];
      async.eachOf(items,
        function (item, m, callback2) {
            var itemDetails = item.split(" ");
            console.log(itemDetails);
            product.find({where : {name : itemDetails[0]}}, function (err, data) {
                orderItems.push({productId: data[0].id, qty : itemDetails[1], unit : itemDetails[2]});
                callback2();
            });
        },
        function (err) {
            if (err) {
                throw err;
            }
            var order = {};
            order.vendorId = vendorId;
            order.customerId = customerId;
            order.orderdate = new Date();
            order.items = orderItems;
            order.status = 'pending';
            cb(null, order);
        }
      );
      
    });
  }

  Order.new = function (message, cb) {
    console.log('message ' , message);
    // msg , vno, cno 
    var msg = message.msg.replace(/^\s+|\s+$/g,'');
    var vendorMobile = message.vno;
    var customerMobile = message.cno;
    var customerModel = loopback.findModel('Customer');
    var customerId;
    var vendorId;
    customerModel.find({where:{phone: customerMobile}}, function(err, data) {
      console.log('data ', data);
      if (err || data.length === 0 ) {
        return cb({msg : "customer not found"});
      }
      customerId = data[0].id;
      console.log(customerId);
      var vendorModel = loopback.findModel('Vendor');
      vendorModel.find({where:{phone: vendorMobile}}, function(err, data) {
        if (err || data.length === 0) {
          return cb({msg: "vendor not found"});
        }
        vendorId = data[0].id;
        Order.formOrder(vendorId, customerId, msg, function(err, data) {
          Order.create(data, function(err, data) {
            cb(err, data.id);
          });
        });
      })
    })
    
  };
  Order.remoteMethod(
          'new', {
              description: 'Accept new order in any language',
              http: {
                  path: '/new',
                  verb: 'post'
              },
              accepts: {
                  arg: 'message',
                  type: 'object',
                  http: {
                      source: 'body'
                  }
              },
              returns: {
                  arg: 'response',
                  type: 'object',
                  root: true
              }
          });
};

