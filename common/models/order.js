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
      // make 2kg - 2 kg
      message = message.replace(/([0-9]+)kg/gi, "$1 kg");
      message = message.replace(/([0-9]+)gms/gi, "$1 gm");
      message = message.replace(/([0-9]+)gm/gi, "$1 gm");
      console.log(message);
      var items = message.split(/[,\n.]/);
      var product = loopback.findModel("Product");
      var orderItems = [];
      async.eachOf(items,
        function (item, m, callback2) {
            var item1 = item.replace(/^\s+|\s+$/g,'');
            var itemDetails = item1.split(" ");
            console.log(itemDetails);
            var checkIfQtyFirst = new RegExp(/^[0-9]/);
            var productName;
            var qty;
            var unit;
            if (checkIfQtyFirst.test(item1)) {
              productName = itemDetails[2];
              qty = itemDetails[0];
              unit = itemDetails[1];
            }
            else {
              productName = itemDetails[0];
              qty = itemDetails[1];
              unit = itemDetails[2];
            }


            product.find({where : {name : {regexp: new RegExp("^"+productName+"$", "i") }}}, function (err, data) {
                if (err || data.length == 0) {
                  callback2({msg: productName + ' not available'});
                }
                else {
                  orderItems.push({productId: data[0].id, qty : qty, unit : unit});
                  callback2();
                }
            });
        },
        function (err) {
            if (err) {
                cb(err, null);
            }
            else {
              var order = {};
              order.vendorId = vendorId;
              order.customerId = customerId;
              order.orderdate = new Date();
              order.items = orderItems;
              order.status = 'pending';
              cb(null, order);
            }
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
          if (err) {
            cb(err, null);
          }
          else {
            Order.create(data, function(err, data) {
                if (err) {
                  cb(err, null)
                }
                else {
                  cb(null, 'Your order ' + data.id + ' is under process, and will be delivered in 2 hours.|' + data.id);
                }
              });
          }
        });
      })
    })
    
  };

  Order.get = function(id, cb){
    var order = loopback.findModel("Order");
    order.findById(id, {include: ["customer", "vendor"]}, function(err, orgData){
      var productIds = [];
      // Customer number
      if(err){
        cb(err, orgData);
      }else{
        console.log('orgData ' , orgData);
        var items = orgData.items;
        for(var m=0;m<orgData.items.length;m++){
          productIds.push(orgData.items[m].productId);
        }
        console.log('vendor ', orgData.vendor() );
        var vlng = orgData.vendor().language;
        console.log('v lng ' + vlng);
        if(vlng === 'en'){
          console.log('Vendor lang english');
          cb(err,orgData);
        }else{
          var product = loopback.findModel('Product');
          var productNamesArray = [];
          product.find({where:{id:{inq: productIds}}}, function(err, products){
            if(err) console.log(err);
            console.log(products);
            for(var i=0; i < products.length; i++){
              productNamesArray.push(products[i].name);
              for(var j=0;j < orgData.items.length; j++){
                console.log(typeof orgData.items[j].productId + " " + typeof products[i].id);
                console.log(orgData.items[j].productId + " " + products[i].id);
                if(orgData.items[j].productId.toString() == products[i].id.toString()){
                  console.log('settig name');
                  orgData.items[j].name = products[i].name;
                }
              }
            }
            var dictionary = loopback.findModel('Dictionary');
            console.log('lng ', orgData.vendor.language);
            dictionary.find({where:{and: [{dest:{inq:productNamesArray}}, {language: vlng}]}}, function(err, newData){
              for(var p=0;p<newData.length;p++){
                for(var v=0; v<orgData.items.length;v++){
                  if(newData[p].dest.toString() === orgData.items[v].name.toString()){
                    orgData.items[v].lname = newData[p].source;
                  }
                }
              }
              console.log('', newData);
              cb(err,orgData);
            });
            //async.eachOf(products, function(product, m, cb2){
              
            //}, function(err){

            //});
            
          });
        }
      }     
    });
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

  Order.remoteMethod(
    'get', 
    {
      description: 'Get the Oder',
      http: {
        path: '/get',
        verb: 'get'
      },
      accepts: {
        arg: 'id',
        type: 'string',
        http: {
          source: 'query'
        }
      },
      returns: {
        arg: 'order',
        type: 'object',
        root: true
      }
    }
  );

function responseStatus(status) {
  return function(context, callback) {
    var result = context.result;
    console.log('rsr  ', context);
    // if(testResult(result)) { // testResult is some method for checking that you have the correct return data
    //   context.res.statusCode = status;
    // }
    return callback();
  }
}

  Order.remoteMethod(
      'updatestatus', 
      {
         accepts: [{arg: 'status', type: 'string'}, {arg: 'id', type: 'string'}],
         returns: {arg: 'message', type: 'string', root : true},
         http: {path: '/updatestatus', verb: 'get'},
         rest: {after: responseStatus(201) }
       }
  );

  Order.updatestatus = function(status, id, cb) {
    Order.findById(id , function(err, data) {
      if (err || !data) {
        // cb(null, id + " not found");
        cb({message : "Order " + id + " not found"}, null)
      }
      else {
        data.status = status;
        Order.upsert(data, function(err, data) {
          if (err || !data) {
            cb({message : "Error updating order", err: err}, null);
          } else {
            var msg;
            if (status == "accept") {
              msg = "Order " + id + " accepted";
            } else {
              msg = "Order " + id + " was rejected, due to no stock";
            }
            cb(null, msg);
          }
        })
      }
    })
  }
};

