var loopback = require('loopback');
var async = require('async');

module.exports = function(Customer) {

	  Customer.formCustomer = function(vendorId, fullmsg, cb) {
	  	var keyword = "register me";
	  	var dict = loopback.findModel('Dictionary');
	  	var message = fullmsg.msg.replace(/^\s+|\s+$/g,'');
	  	var engExp = new RegExp("^" + keyword, "i");
	  	var customerData = {};
	  	customerData.vendorId = vendorId;
	  	customerData.phone = fullmsg.cno;
	  	if (engExp.test(message)) {
	  		customerData.language = 'en';
	  		customerData.name = message.replace(engExp, "");
			customerData.name = customerData.name.replace(/^\s+|\s+$/g,'');
	  		cb(null, customerData);
	  	}
	  	else {
		  	dict.find({where: { dest : keyword}} , function(err, data) {
		  		var found = false;
		  		for (var i=0; i<data.length; i++) {
		  			var langEntry = data[i];
		  			var regexp = new RegExp("^" + langEntry.source);
		  			if (regexp.test(message)) {
		  				customerData.language = langEntry.language;
		  				customerData.name = message.replace(regexp, "");
		  				customerData.name = customerData.name.replace(/^\s+|\s+$/g,'');
		  				found = true;
		  				break;
		  			}
		  		}
		  		if (found) {
		  			cb(null, customerData);
		  		}
		  		else {
		  			cb({msg : "'register me' keyword not found in any known languages"}, null)
		  		}
		  	});
		}
	  }
	  Customer.register = function (message, cb) {
	  	var vendor = loopback.findModel('Vendor');
	  	vendor.find({where : {phone : message.vno}}, function(err, data) {
	  		if (err || data.length == 0) {
	  			cb ( { msg : "Unable to get vendor details for " + message.vno}, null);
	  		}
	  		else {
	  			Customer.formCustomer(data[0].id, message, function(err, data) {
	  				if (err) {
	  					cb(null , "Unable to register, please feel free to call me|FAILURE");
	  				} else {
	 	  				Customer.create(data, function(err, data) {
		  					if (err) {
		  						cb(null , "Unable to register, please feel free to call me|FAILURE");
		  					} else {
		  						cb(null, "Welcome " + data.name + " ! Start SMS shopping!|SUCCESS");
		  					}
		  				});
	 	  			}
	  			});
	  		}
	  	});
	  }

	  Customer.remoteMethod(
          'register', {
              description: 'register a new customer',
              http: {
                  path: '/register',
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
}