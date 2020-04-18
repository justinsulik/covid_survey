// https://www.terlici.com/2015/04/03/mongodb-node-express.html

let MongoClient = require('mongodb').MongoClient;

var state = {
  db: null,
};

exports.connect = function(uri, done){
  var reg = uri.match(/(heroku_[a-z0-9]+)/);
  var db_key;
  if(reg){
    db_key = reg[0];
  } else {
    db_key = 'heroku_nj9mk217';
  }
  if (state.db) return done();
  MongoClient.connect(uri,
    {retryWrites: false},
    function(err, client) {
     if (err) return done(err);
     state.db = client.db(db_key);
     console.log("connected to db...");
     done();
   });
};

exports.get = function() {
  return state.db;
};

exports.close = function(done) {
  if (state.db) {
    state.db.close(function(err, result) {
      state.db = null;
      state.mode = null;
      done(err);
    });
  }
};
