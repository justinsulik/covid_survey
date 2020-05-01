/*
Custom functions written for CVBE how-to session 03.03.2020
For help, contact justin.sulik@gmail.com
*/

var save_attempts = 0;
var save_timeout = 1500;

function prepareData(experiment_start_time){
  console.log('    Preparing data...');
  var data = {};
  var experiment_end_time = Date.now();
  var duration = experiment_end_time - experiment_start_time;
  var interactionData = jsPsych.data.getInteractionData().json();
  jsPsych.data.get().addToLast({duration: duration,
                                interactionData: interactionData,
                              });
  data.responses = jsPsych.data.get().json();
  data.trial_id = trial_id;
  data.finish_time = Date();
  dataJSON = JSON.stringify(data);
  return dataJSON;
}

function save(dataJSON, dataUrl, trial_id, lg, phase){
  console.log('    About to post survey output data...', dataJSON);
  console.log (trial_id, 'waiting');
  var max_attempts = 5;
  $.ajax({
     type: 'POST',
     url: dataUrl,
     data: dataJSON,
     contentType: "application/json",
     timeout: 3000,
     success: function(request, status, error){
       console.log(trial_id, 'success, deleting waiting');
       finish(trial_id, lg, phase);
     },
     error: function(request, status){
       $('#jspsych-content').html("<p>Please wait a few seconds while we save your responses...</p>"+
      "<p>If you are not automatically redirected to the debriefing in a few seconds, please click <a href='/finish?token="+trial_id+"&lg="+lg+"'>here</a>.</p>");
       console.log(trial_id, 'Error posting data...', request, status);
       if(save_attempts < max_attempts){
         save_attempts += 1;
         save_timeout += 500;
         console.log(trial_id, "Trying again, attempt ", save_attempts);
         setTimeout(function () {
            save(dataJSON, dataUrl, trial_id, lg, phase);
          }, save_timeout);
       } else {
         console.log(trial_id, 'too many attempts');
         finish(trial_id, lg, phase);
       }
     }
   });
}

function finish(completionCode, lg, phase){
    console.log('    Rerouting to finish page...');
    window.location.href = "/finish?tid="+completionCode+'&lg='+lg+'&phase='+phase;
}

function makeCode(len){
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYabcdefghijklmnopqrstuvwxy0123456789";
  for( var i=0; i < len; i++ ){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

var helper = {
  makeCode: makeCode,
  prepareData: prepareData,
  save: save,
};

// Handles exports differently, depending whether this script is loaded by node
// or by client
if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = helper;
  }
  exports.helper = helper;
} else {
  window.helper = helper;
}
