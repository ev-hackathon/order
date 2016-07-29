module.exports = function(Order) {
  Order.new = function (data, cb){
    console.log("",data);
    cb(null, 'Your order : '+ data);
  };

  Order.remoteMethod('new', 
    {
      accepts: { arg: 'data', type: 'string'} 
    },
    {
      returns : {
        type: 'string',
        arg: 'order'
      }
    }
  );
};
