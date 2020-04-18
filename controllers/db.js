// https://www.terlici.com/2015/04/03/mongodb-node-express.html

let MongoClient = require('mongodb').MongoClient;

var state = {
  db: null,
};

exports.connect = function(uri, done){
  if (state.db) return done();
  MongoClient.connect(uri,
    {retryWrites: false},
    function(err, client) {
     if (err) return done(err);
     state.db = client.db('heroku_3wl4lj7q');
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
