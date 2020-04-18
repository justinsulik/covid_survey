//https://www.terlici.com/2015/04/03/mongodb-node-express.html

const db = require('./db');

exports.save = function (data) {
  console.log('    Saving survey data in db...');

  return new Promise((resolve, reject) => {
    var collection = db.get().collection('responses');
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
