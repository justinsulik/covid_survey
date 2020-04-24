
const db = require('./db');

exports.save = function (data) {
  console.log('    Saving unsubscribe request...');

  return new Promise((resolve, reject) => {
    var collection = db.get().collection('unsubscribe');
    collection.insertOne(data, function(err, r) {
      if(err){
        console.log('    ---> error saving ', err, data);
        reject(err);
      } else {
        console.log('    ...saved ');
        resolve(r);
      }
    });
  });
};
