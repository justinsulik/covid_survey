/*
 * Plugin for collecting common demographic variables
 * If adding any more, ensure that the relevant input tag has class="jspsych-demographics answer"
 */

jsPsych.plugins["demographics"] = (function() {

  var plugin = {};

  plugin.info = {
    name: "demographics",
    parameters: {
      age: {
        type: jsPsych.plugins.parameterType.BOOL, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: true,
        description: "Whether to include age"
      },
      gender: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        default: true,
        description: "Whether to include gender"
      },
      education: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        default: true,
        description: "Whether to include education"
      },
      preamble: {
        type: jsPsych.plugins.parameterType.STRING,
        default: "Please tell us about yourself",
        description: "Preamble for the page"
      },
      force_response: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'force',
        description: "If 'force', force responses; if 'invite', just alert asking for responses; otherwise no checking."
      }
    }
  };

  plugin.trial = function(display_element, trial) {

    // data saving
    var trial_data = {};
    var start_time;

    var html = '';
    if(trial.preamble){
      html += '<div class="preamble">'+trial.preamble+'</div>';
    }

    var age = '<div id="age" class="demographics">'+
                'Age:'+
                '<div class="demographics response">'+
                '<input type="text" name="age" class="jspsych-demographics answer text numeric-only" placeholder="number only">'+
                '<div class="specify numeric-only age hidden inline">(number only)</div>'+
              '</div></div>';

    var gender = '<div id="gender" class="demographics">'+
                    'Gender:'+
                    '<div class="demographics response">'+
                    '<select id="gender-selection" class="jspsych-survey-select">'+
                      '<option disabled selected value> -- select an option -- </option>'+
                      '<option name="gender" value="man" class="jspsych-demographics answer select">Man</option>'+
                      '<option name="gender" value="woman" class="jspsych-demographics answer select">Woman</option>'+
                      '<option name="gender" value="non-binary" class="jspsych-demographics answer select">Non-binary</option>'+
                      '<option name="gender" value="none" class="jspsych-demographics answer select">Prefer not to say</option>'+
                    '</select>&nbsp;'+
                  '</div></div>';

    var education = '<div id="education" class="demographics">'+
                      'Highest completed education level:'+
                      '<div class="demographics response">'+
                      '<select class="jspsych-survey-select">'+
                        '<option disabled selected value> -- select an option -- </option>'+
                        '<option name="education" value="0" class="jspsych-demographics answer select">No schooling completed</option>'+
                        '<option name="education" value="1" class="jspsych-demographics answer select">Primary education (age: 5-10)</option>'+
                        '<option name="education" value="2" class="jspsych-demographics answer select">Secondary education (age: 11-17)</option>'+
                        '<option name="education" value="3" class="jspsych-demographics answer select">University undergraduate degree or professional equivalent</option>'+
                        '<option name="education" value="4" class="jspsych-demographics answer select">Postgraduate degree (Master’s/Doctorate)</option>'+
                      '</select>'+
                    '</div></div>';

    var student = '<div id="student" class="demographics">'+
                      'Are you currently a student?'+
                      '<div class="demographics response">'+
                      '<label class="jspsych-survey-likert-opt-label">'+
                        '<input id="student-no" type="radio" name="student" value="no" class="jspsych-demographics answer radio"> No '+
                      '</label>'+
                      '<label class="jspsych-survey-likert-opt-label">'+
                        '<input id="student-yes" type="radio" name="student" value="yes" class="jspsych-demographics answer radio"> Yes<br>'+
                      '</label></div>'+
                      '<div id="student_time" class="hidden">'+
                      '<div class="demographics followup">What type?</div>'+
                      '<select class="jspsych-survey-select">'+
                        '<option disabled selected value> -- select an option -- </option>'+
                        '<option name="student_time" value="full" class="jspsych-demographics answer select">Full-time</option>'+
                        '<option name="student_time" value="part" class="jspsych-demographics answer select">Part-time</option>'+
                      '</select>'+
                      '</div>'+
                      '<div id="student_place" class="hidden">'+
                      '<div class="demographics followup">Are you studying from home?</div>'+
                      '<select class="jspsych-survey-select">'+
                        '<option disabled selected value> -- select an option -- </option>'+
                        '<option name="student_place" value="yes" class="jspsych-demographics answer select">Yes</option>'+
                        '<option name="student_place" value="sometimes" class="jspsych-demographics answer select">Sometimes</option>'+
                        '<option name="student_place" value="no" class="jspsych-demographics answer select">No</option>'+
                      '</select>'+
                      '</div>'+
                  '</div>';

    var working = '<div id="working" class="demographics">'+
                      'Do you currently have a job?'+
                      '<div class="demographics response">'+
                      '<label class="jspsych-survey-likert-opt-label">'+
                        '<input id="working-no" type="radio" name="working" value="no" class="jspsych-demographics answer radio"> No '+
                      '</label>'+
                      '<label class="jspsych-survey-likert-opt-label">'+
                        '<input id="working-yes" type="radio" name="working" value="yes" class="jspsych-demographics answer radio"> Yes<br>'+
                      '</label></div>'+
                      '<div id="working_time" class="hidden">'+
                      '<div class="demographics followup">How often?</div>'+
                      '<select class="jspsych-survey-select">'+
                        '<option disabled selected value> -- select an option -- </option>'+
                        '<option name="working_time" value="full" class="jspsych-demographics answer select">Full-time</option>'+
                        '<option name="working_time" value="half" class="jspsych-demographics answer select">Half-time</option>'+
                        '<option name="working_time" value="less" class="jspsych-demographics answer select">Less than half-time</option>'+
                      '</select>'+
                      '</div>'+
                      '<div id="working_place" class="hidden">'+
                      '<div class="demographics followup">Are you working from home?</div>'+
                      '<select class="jspsych-survey-select">'+
                        '<option disabled selected value> -- select an option -- </option>'+
                        '<option name="working_place" value="yes" class="jspsych-demographics answer select">Yes</option>'+
                        '<option name="working_place" value="sometimes" class="jspsych-demographics answer select">Sometimes</option>'+
                        '<option name="working_place" value="no" class="jspsych-demographics answer select">No</option>'+
                      '</select>'+
                      '</div>'+
                  '</div>';


    var city_now = '<div id="location_now" class="demographics">'+
                    'Where are you right now?'+
                    '<div class="demographics response">'+
                    '<input type="text" name="location_now-country" class="jspsych-demographics answer text" placeholder="Country">'+
                    '<input type="text" name="location_now-province" class="jspsych-demographics answer text optional" placeholder="Province/State/Region (optional)">'+
                    '<input type="text" name="location_now-city" class="jspsych-demographics answer text" placeholder="City">'+
                    '</div></div>';

    var city_old = '<div id="location_old" class="demographics">'+
                    'Where did you grow up?'+
                    '<div class="demographics response">'+
                    '<input type="text" name="location_old-country" class="jspsych-demographics answer text" placeholder="Country">'+
                    '<input type="text" name="location_old-province" class="jspsych-demographics answer text optional" placeholder="Province/State/Region (optional)">'+
                    '<input type="text" name="location_old-city" class="jspsych-demographics answer text" placeholder="City">'+
                    '</div></div>';

    var household_total_options = numericOptions('household-total');
    var household_children_options = numericOptions('household_children');
    var household_elderly_options = numericOptions('household_elderly');

    var household = '<div id="household" class="demographics">'+
                      'Number of people in your household (except for yourself):'+
                      '<div class="demographics response">'+
                      '<select id="household-total-selection" class="jspsych-survey-select">'+
                      household_total_options+
                      '</select>'+
                      '</div>'+
                      '<div id="household_children" class="hidden">'+
                      '<div class="demographics followup optional">Number of children?</div>'+
                      '<select id="household-children-selection" class="jspsych-survey-select">'+
                      household_children_options+
                      '</select>'+
                      '</div>'+
                      '<div id="household_elderly" class="hidden">'+
                      '<div class="demographics followup optional">Number of elderly (> 60 years)?</div>'+
                      '<select id="household-elderly-selection" class="jspsych-survey-select">'+
                      household_elderly_options+
                      '</select>'+
                      '</div>'+
                      '</div>';

    var submit = '<div>'+
                  '<br><button type="button" id="submit">Continue</button>'+
                  '</div>';


    if(trial.age){
      html += age;
    }

    if(trial.gender){
      html += gender;
    }

    if(trial.education){
      html += education;
    }

    html += student;
    html += working;
    html += city_now;
    html += city_old;
    html += household;

    display_element.innerHTML = html+submit;

    /*
     inputs/interactions
    */

    $('#student-yes').on('click', function(){
      $('#student_time').show(400);
      $('#student_place').show(400);
    });

    $('#student-no').on('click', function(){
      $('#student_time').hide(200);
      $('#student_place').hide(200);
    });

    $('#working-yes').on('click', function(){
      $('#working_time').show(400);
      $('#working_place').show(400);
    });

    $('#working-no').on('click', function(){
      $('#working_time').hide(200);
      $('#working_place').hide(200);
    });

    $('select').on('change', function (e) {
      var optionSelected = $("option:selected", this);
      var valueSelected = this.value;
      if(e.target.id=='household-total-selection'){
        if(parseInt(valueSelected)>0){
          $("#household_elderly").show(400).removeClass('optional');
          $("#household_children").show(400);
        } else {
          $("#household_elderly").hide(200);
          $("#household_children").hide(200);
        }
      }
    });

    $('#submit').click(function(e){
      var responses = getResponses();
      var validated = validateResponses(responses);
      if(validated.ok){
        endTrial(responses);
      } else {
        highlightProblems(validated.problems);
      }
    });

    /*
    Data handling
    */

    function getResponses(){
      var responses = {};
      $('.answer').each(function(i, div){
        // get response info
        var div_obj = $(div);
        var name = div_obj.attr('name');
        // set up somewhere to store data
        if(!responses[name]){
          responses[name] = {};
        }
        //is this question optional?
        responses[name].optional = false;
        if(div_obj.hasClass('optional')){
          responses[name].optional = true;
        } else {
          var containing_div = $('#'+name);
          if(containing_div){
            if(containing_div.css('display') == 'none'){
              responses[name].optional = true;
            }
          }
        }
        // what type of question is this?
        var type; // options: text, select, radio
        if(div_obj.hasClass('text')){
          type = 'text';
        }
        else if(div_obj.hasClass('radio')){
          type = 'radio';
        }
        else if(div_obj.hasClass('select')){
          type = 'select';
        } else {
          console.log('!! missing type for: ', name);
        }
        if(type == 'text'){
          var response = $(div).val().trim();
          responses[name].response = response;
          if(div_obj.hasClass('numeric-only')){
            responses[name].numeric = true;
          } else {
            responses[name].numeric = false;
          }
        }
        if(type == 'radio') {
          if(div_obj.is(':checked')){
            var checked = div_obj.val();
            responses[name].response = checked;
          }
        }
        if(type == 'select'){
          if(div_obj.is(':selected')){
            var selected = div_obj.val();
            responses[name].response = selected;
          }
        }
      });
      return responses;
    }

    function validateResponses(responses){
      var validated = {ok: true, problems: {}};
      Object.keys(responses).forEach(function(tag){
        var parent = tag.match(/[a-zA-Z_]+/)[0];
        response = responses[tag];
        if(!validated.problems[parent]){
          validated.problems[parent] = [];
        }
        // check is number
        if(response.numeric){
          var is_numeric = checkNumeric(response.response);
          if(!is_numeric){
            validated.ok = false;
            validated.problems[parent].push('not numeric');
          }
        }
        if(!response.optional){
          if(!response.response || response.response == ''){
            validated.ok = false;
            validated.problems[parent].push('no response');
          }
        }
      });
      console.log('validated', validated);
      return validated;
    }

    function highlightProblems(problems){
      Object.keys(problems).forEach(function(tag){
        var parent = tag.match(/[a-zA-Z_]+/)[0];
        if(problems[tag].length>0){
          $('#'+parent).addClass('problem')
        } else {
          $('#'+parent).removeClass('problem')
        }
        if(problems[tag].indexOf('not numeric') != -1){
          $('.'+parent+'.specify').removeClass('hidden');
        } else {
          $('.'+parent+'.specify').addClass('hidden');
        }

      });
    }

    function formatErrors(error_messages){
      var error_string = '';
      Object.keys(error_messages).forEach(function(tag){
        if(error_messages[tag].show){
          error_string += ' ' + error_messages[tag].message;
        }
      });
      return error_string;
    }

    function checkNumeric(response){
      // check that there is a number, and nothing else
      var ok = true;
      console.log('---', response)
      var contains_number = /[0-9]/.test(response);
      var contains_nonnumber = /[^0-9]/.test(response);
      if(!contains_number || contains_nonnumber){
        ok = false;
      }
      return ok;
    }

    function endTrial(responses){
      var end_time = Date.now();
      var rt = end_time - start_time;
      trial_data.rt = rt;
      trial_data.responses = responses;

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // clear screen
      display_element.innerHTML = '';

      jsPsych.finishTrial(trial_data);
      console.log(trial_data);
    }

    function numericOptions(tag){
      return _.reduce(_.range(0,11), function(acc, i){
        var display_string = i;
        if(i==10){
          display_string+='+';
        }
        acc += '<option name="'+tag+'" value="'+i+'" class="jspsych-demographics answer select">'+display_string+'</option>';
        return acc;
      }, '<option disabled selected value> -- select an option -- </option>');
    }


    $( document ).ready(function() {
      start_time = Date.now();
    });

  };

  return plugin;
})();
