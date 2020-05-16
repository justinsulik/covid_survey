/*jshint esversion: 6 */

/*
test: evening-reaches-46143
*/

const express = require('express'),
  url = require('url'),
  body_parser = require('body-parser'),
  ejs = require('ejs'),
  detect = require('browser-detect'),
  Queue = require('bull'),
  helper = require(__dirname+'/libraries/helper.js');

const study_name = 'lg_trial';
const app = express();
const PORT = process.env.PORT || 5000;
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const responsesQueue = new Queue('responses', REDIS_URL);
const tasksQueue = new Queue('tasks', REDIS_URL);
const unsubscribeQueue = new Queue('unsubscribe', REDIS_URL);

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
    const trial_id = req.query.tid || helper.makeCode(8);
    const phase = req.query.phase || 1;
    let is_new = true;
    if(phase>1){
      is_new = false;
    }
    const browser = detect(req.headers['user-agent']);
    const date = new Date();

    var task_data = {
        "phase": phase,
        "trial_id": trial_id,
        "study_name": study_name,
        "browser": browser,
        "start_time": date,
    };
    tasksQueue.add(task_data);
    if(is_new){
      res.render('lgpage.ejs', {input_data: JSON.stringify({trial_id: trial_id, phase: phase})});
    } else {
      res.render('return.ejs', {input_data: JSON.stringify({trial_id: trial_id, phase: phase})});
    }
});

app.get('/study', (req, res, next) => {
    let lg = req.query.lg || 'en';
    if(lg=='ch'){
      lg = 'zh';
    }
    const trial_id = req.query.tid || helper.makeCode(8);
    const phase = req.query.phase || 1;
    const lg_dict = lg_data[lg];

    const browser = detect(req.headers['user-agent']);
    let mobile = false;
    if (browser) {
      console.log(trial_id, 'Detected browser...', browser);
      if (browser.mobile==true){
        mobile = true;
      }
    }

    console.log('Rendering study in', lg, 'for', trial_id, 'in phase', phase);
    res.render('experiment.ejs', {input_data: JSON.stringify({trial_id: trial_id,
      phase: phase,
      lg: lg, lg_dict:
      lg_dict,
      mobile: mobile})});

});

app.post('/data', (req, res, next) => {
  const data = req.body;
  const trial_id = req.query.trial_id || 'none';
  console.log(trial_id, 'Adding survey data to queue...');
  responsesQueue.add(data)
  .then(result => {
    res.status(200).end();
  });
});

app.get('/finish', (req, res) => {
  let code = req.query.tid || '';
  let lg = req.query.lg || 'en';
  let phase = req.query.phase || 1;
  if(lg=='ch'){
    lg = 'zh';
  }
  if(code.length==0){
    // If, for whatever reason, the code has gone missing, generate a new one so that the participant can get paid
    code = helper.makeCode(10) + 'SZs';
  }
  console.log('finishing', code, lg);
  res.render(lg+'_finish.ejs', {completionCode: code, phase: phase});
});

app.get('/unsubscribe', (req, res, next) => {
  const code = req.query.tid || 'none';
  const data = {code: code};
  console.log('Adding unsubscribe to queue...', code);
  unsubscribeQueue.add(data)
  .then(result => {
    res.status(200).render('unsubscribe.ejs');
  });
});

var server = app.listen(PORT, function(){
    console.log("Listening on port %d", server.address().port);
});
