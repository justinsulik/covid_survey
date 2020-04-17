/*jshint esversion: 6 */

/*
test: evening-reaches-46143
*/

const express = require('express'),
  url = require('url'),
  body_parser = require('body-parser'),
  ejs = require('ejs'),
  detect = require('browser-detect'),
  db = require(__dirname+'/controllers/db'),
  tasks = require(__dirname+'/controllers/tasks'),
  responses = require(__dirname+'/controllers/responses'),
  helper = require(__dirname+'/libraries/helper.js');

const study_name = 'lg_trial';
const phase = 1;
const app = express();
const PORT = process.env.PORT || 5000;

db.connect(process.env.MONGODB_URI);

app.use(express.static(__dirname + '/public'));
app.use(body_parser.json({ limit: '50mb' }));
app.use(body_parser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 500000 }));
app.use('/jspsych', express.static(__dirname + "/jspsych"));
app.use('/libraries', express.static(__dirname + "/libraries"));
app.use('/helper', express.static(__dirname + "/helper"));
app.engine('ejs', ejs.renderFile);
app.set('view engine', 'ejs');
app.set('views', __dirname + '/public/views');

let lg_data = require('./lg/lg_dict.json');

app.get('/', (req, res, next) => {
    // Generate anonymous code to identify this trial
    const trial_id = helper.makeCode(8);
    // // What browser is the participant using?
    const browser = detect(req.headers['user-agent']);

    tasks.save({
        "phase": phase,
        "trial_id": trial_id,
        "study_name": study_name,
        "browser": browser,
    });

    let mobile = false;
    if (browser) {
      console.log(trial_id, 'Detected browser...', browser);
      if (browser.mobile==true){
        mobile = true;
      }
    }
    res.render('lgpage.ejs', {input_data: JSON.stringify({trial_id: trial_id})});
});


app.get('/study', (req, res, next) => {
    let lg = req.query.lg || 'en';
    if(lg=='ch'){
      lg = 'zh';
    }
    const trial_id = req.query.tid || helper.makeCode(8);
    const lg_dict = lg_data[lg];

    res.render('experiment.ejs', {input_data: JSON.stringify({trial_id: trial_id, phase: phase, lg: lg, lg_dict: lg_dict})});

});

app.post('/data', (req, res, next) => {
  const data = req.body;
  const trial_id = req.query.trial_id || 'none';
  console.log(trial_id, 'Preparing to save trial data...');
  responses.save({
    trial_id: trial_id,
    study_name: study_name,
    trial_data: data,
  })
  .then(res.status(200).end());
});

app.get('/finish', (req, res) => {
  let code = req.query.token || '';
  let lg = req.query.lg || 'en';
  if(code.length==0){
    // If, for whatever reason, the code has gone missing, generate a new one so that the participant can get paid
    code = helper.makeCode(10) + 'SZs';
  }
  console.log('finishing', code, lg)
  res.render(lg+'_finish.ejs', {completionCode: code, phase: phase});
});

var server = app.listen(PORT, function(){
    console.log("Listening on port %d", server.address().port);
});
