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

    var html = '';
    if(trial.preamble){
      html += '<h2 id="preamble">'+trial.preamble+'</h2>';
    }

    var age = '<div id="age" class="demographics">'+
                'Age:'+
                '<div class="demographics response">'+
                '<input type="text" name="age" class="jspsych-demographics answer text numeric-only">'+
              '</div></div>';

    var gender = '<div id="gender" class="demographics">'+
                    'Gender:'+
                    '<div class="demographics response">'+
                    '<select id="gender-selection" class="jspsych-survey-likert-select">'+
                      '<option disabled selected value> -- select an option -- </option>'+
                      '<option name="gender" value="man" class="jspsych-demographics answer select">Man</option>'+
                      '<option name="gender" value="woman" class="jspsych-demographics answer select">Woman</option>'+
                      '<option name="gender" value="none" class="jspsych-demographics answer select">Prefer not to say</option>'+
                      '<option name="gender" value="self" class="jspsych-demographics answer select optional">Prefer to self-describe</option>'+
                    '</select>&nbsp;'+
                    '<div id="gender-self" class="hidden"><input type="text" name="gender-self" class="jspsych-demographics answer text" placeholder="How do you identify?"></div>'+
                  '</div></div>';

    var education = '<div id="education" class="demographics">'+
                      'Highest completed education level:'+
                      '<div class="demographics response">'+
                      '<select class="jspsych-survey-likert-select">'+
                        '<option disabled selected value> -- select an option -- </option>'+
                        '<option name="education" value="0" class="jspsych-demographics answer select">No schooling completed</option>'+
                        '<option name="education" value="1" class="jspsych-demographics answer select">Primary education (age: 5-10)</option>'+
                        '<option name="education" value="2" class="jspsych-demographics answer select">Secondary education (age: 11-17)</option>'+
                        '<option name="education" value="3" class="jspsych-demographics answer select">University undergraduate degree or professional equivalent</option>'+
                        '<option name="education" value="4" class="jspsych-demographics answer select">Postgraduate degree (Master’s/Doctorate)</option>'+
                      '</select>'+
                    '</div></div>';

    var student = '<div id="current-student" class="demographics">'+
                      'Are you currently a student?'+
                      '<div class="demographics response">'+
                      '<label class="jspsych-survey-likert-opt-label">'+
                        '<input id="student-no" type="radio" name="student" value="no" class="jspsych-demographics answer radio"> No '+
                      '</label>'+
                      '<label class="jspsych-survey-likert-opt-label">'+
                        '<input id="student-yes" type="radio" name="student" value="yes" class="jspsych-demographics answer radio"> Yes<br>'+
                      '</label></div>'+
                      '<div id="student-time" class="hidden">'+
                      '<div class="demographics followup">What type?</div>'+
                      '<select class="jspsych-survey-likert-select">'+
                        '<option disabled selected value> -- select an option -- </option>'+
                        '<option name="student-time" value="full" class="jspsych-demographics answer select">Full-time</option>'+
                        '<option name="student-time" value="part" class="jspsych-demographics answer select">Part-time</option>'+
                      '</select>'+
                      '</div>'+
                      '<div id="student-place" class="hidden">'+
                      '<div class="demographics followup">Are you studying from home?</div>'+
                      '<select class="jspsych-survey-likert-select">'+
                        '<option disabled selected value> -- select an option -- </option>'+
                        '<option name="student-place" value="yes" class="jspsych-demographics answer select">Yes</option>'+
                        '<option name="student-place" value="sometimes" class="jspsych-demographics answer select">Sometimes</option>'+
                        '<option name="student-place" value="no" class="jspsych-demographics answer select">No</option>'+
                      '</select>'+
                      '</div>'+
                  '</div>';

    var working = '<div id="current-working" class="demographics">'+
                      'Are you currently working?'+
                      '<div class="demographics response">'+
                      '<label class="jspsych-survey-likert-opt-label">'+
                        '<input id="working-no" type="radio" name="working" value="no" class="jspsych-demographics answer radio"> No '+
                      '</label>'+
                      '<label class="jspsych-survey-likert-opt-label">'+
                        '<input id="working-yes" type="radio" name="working" value="yes" class="jspsych-demographics answer radio"> Yes<br>'+
                      '</label></div>'+
                      '<div id="working-time" class="hidden">'+
                      '<div class="demographics followup">How often?</div>'+
                      '<select class="jspsych-survey-likert-select">'+
                        '<option disabled selected value> -- select an option -- </option>'+
                        '<option name="working-time" value="full" class="jspsych-demographics answer select">Full-time</option>'+
                        '<option name="working-time" value="half" class="jspsych-demographics answer select">Half-time</option>'+
                        '<option name="working-time" value="less" class="jspsych-demographics answer select">Less than half-time</option>'+
                      '</select>'+
                      '</div>'+
                      '<div id="working-place" class="hidden">'+
                      '<div class="demographics followup">Are you working from home?</div>'+
                      '<select class="jspsych-survey-likert-select">'+
                        '<option disabled selected value> -- select an option -- </option>'+
                        '<option name="working-place" value="yes" class="jspsych-demographics answer select">Yes</option>'+
                        '<option name="working-place" value="sometimes" class="jspsych-demographics answer select">Sometimes</option>'+
                        '<option name="working-place" value="no" class="jspsych-demographics answer select">No</option>'+
                      '</select>'+
                      '</div>'+
                  '</div>';

    var occupations = {
      'Managers': [],
      'Professionals': ['Science and engineering professional', 'Health professional',
        'Teaching professional', 'Business and administration professional',
        'Information and communications technology professional',
        'Legal professional', 'Journalist, reporter', 'Creative and performing artists',
        'Politicians', 'Other social and cultural professionals'],
      'Technicians and associates': ['Science and engineering associate',
        'Health associate', 'Business and administration associate', 'Information and communications technician',
        'Legal, social and cultural associate'],
      'Clerical support workers': [],
      'Service and sales workers': ['Travel attendant', 'Cook', 'Waiter', 'Other personal services worker',
        'Sales worker', 'Personal care worker', 'Police', 'Security guard', 'Firefighter'],
      'Skilled agricultural, forestry and fishery workers': [],
      'Craft and related trades workers (e.g., building, electronics, metal etc.)':
        ['Food processing worker', 'Other craft and related trades workers'],
      'Plant and machine operators, and assemblers': [],
      'Elementary occupations': ['Cleaner, helper', 'Labourer in manufacturing and transport',
        'Food preparation assistant', 'Package deliverer', 'Other elementary worker'],
      'Armed forces occupations': [],
      'Self-employed': [],
      'Other': []
    };

    function shortName(long_string){
      var matches = long_string.match(/[a-zA-Z]+/);
      var first_word = matches[0].toLowerCase();
      return first_word;
    }

    var occupations_string = _.reduce(occupations, function(acc, options, heading){
      // build html string for the occupations in the above list
      var short_heading = shortName(heading);
      var option_heading = '<div class="option-heading-container"><div id="occupation-heading-'+short_heading+'" class="option-heading">'+heading+'</div></div>';
      var option_string;
      var subfield_string = '<div id="occupation-option-container-'+short_heading+'" class="demographics options container hidden">';
      if(short_heading=='other'){
        var other_input_string = '<div class="indent">'+
        '<input type="text" name="occupation-text" class="jspsych-demographics answer text inline" placeholder="Please specify [max. 100 words]" size="100"></div>';
        subfield_string += other_input_string;
      } else {
        if(options.length==0){
          // if no sub-fields, the top-level field must be selectable
          option_string = '<div class="indent">'+
          '<input type="checkbox" id="occupation-'+short_heading+'" class="demographics answer check" name="occupation" value="'+short_heading+'">'+
          '<label for="occupation-'+short_heading+'" class="option-label"> '+heading+'</label></div>';
          subfield_string += option_string;
        } else {
          options.forEach(function(option, i){
            short_option = shortName(option);
            option_string = '<div class="indent inline">'+
            '<input type="checkbox" id="occupation-'+short_heading+'-'+short_option+'" name="occupation" class="demographics answer check" value="'+short_option+'">'+
            '<label for="occupation-'+short_heading+'-'+short_option+'" class="option-label"> '+option+'</label></div>';
            subfield_string += option_string;
          });
        }
      }
      acc += option_heading + subfield_string + "</div>";
      return acc;
    }, '');

    var occupation = '<div id="occupation" class="demographics">'+
                      'Most recent occupation (select all that apply; if you don’t find your own occupation, please select the options you think apply closely)<br>'+
                      occupations_string+'</div>';

    var city_now = '<div id="location-now" class="demographics">'+
                    'Where are you right now?'+
                    '<div class="demographics response">'+
                    '<input type="text" name="country-now" class="jspsych-demographics answer text" placeholder="Country">'+
                    '<input type="text" name="city-now" class="jspsych-demographics answer text optional" placeholder="City (optional)">'+
                    '</div></div>';

    var city_old = '<div id="location-old" class="demographics">'+
                    'Where did you grow up?'+
                    '<div class="demographics response">'+
                    '<input type="text" name="country-old" class="jspsych-demographics answer text" placeholder="Country">'+
                    '<input type="text" name="city-old" class="jspsych-demographics answer text optional" placeholder="City (optional)">'+
                    '</div></div>';

    var household = '<div id="household" class="demographics">'+
                      'Number of people in your household (except for yourself):'+
                      '<div class="demographics response">'+
                      '<input type="text" name="household-total" class="jspsych-demographics answer text numeric-only">'+
                      '</div><br>'+
                      '<div class="demographics followup">Number of children (< 18 years)?:</div>'+
                      '<div class="demographics response">'+
                      '<input type="text" name="household-children" class="jspsych-demographics answer text numeric-only">'+
                      '</div><br>'+
                      '<div class="demographics followup">Number of elderly (> 60 years)?:</div>'+
                      '<div class="demographics response">'+
                      '<input type="text" name="household-elderly" class="jspsych-demographics answer text numeric-only">'+
                      '</div>'+
                      '</div>';


    var submit = '<div>'+
                  '<br><button type="button" id="submit">Submit</button>'+
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
    html += occupation;
    html += city_now;
    html += city_old;
    html += household;

    display_element.innerHTML = html+submit;

    // inputs/interactions

    $('#student-yes').on('click', function(){
      $('#student-time').removeClass('hidden');
      $('#student-place').removeClass('hidden');
    });

    $('#student-no').on('click', function(){
      $('#student-time').addClass('hidden');
      $('#student-place').addClass('hidden');
    });

    $('#working-yes').on('click', function(){
      $('#working-time').removeClass('hidden');
      $('#working-place').removeClass('hidden');
    });

    $('#working-no').on('click', function(){
      $('#working-time').addClass('hidden');
      $('#working-place').addClass('hidden');
    });

    $('.option-heading').on('click', function(e){
      var heading_id = e.target.id;
      var heading_name = heading_id.match('occupation-heading-([a-z]+)')[1];
      $('#occupation-option-container-'+heading_name).toggleClass('hidden');
    });

    $('select').on('change', function (e) {
      var optionSelected = $("option:selected", this);
      var valueSelected = this.value;
      if(valueSelected=="self"){
        $("#gender-self").addClass('inline').removeClass('hidden');
      }
      if(valueSelected!="self" && e.target.id=='gender-selection'){
        $("#gender-self").removeClass('inline').addClass('hidden');
      }
    });

    $('input[type=checkbox]').on('change', function(e){
      var option_id = e.target.id;
      var parent_name = option_id.match('occupation-([a-z]+)')[1];
      var parent_id = 'occupation-option-container-'+parent_name;
      var active = false;
      $('#'+parent_id).children().each(function(i,container){
        if($(container).children('input').is(":checked")){
          active = true;
        }
      });
      var heading_id = '#occupation-heading-'+parent_name;
      if(active){
        $(heading_id).addClass('active');
      } else {
        $(heading_id).removeClass('active');
      }
    });

    $('#submit').click(function(e){
      var responses = getResponses();
      // var validated = validateResponses(responses);
      var validated = false;
      if(validated){
        endTrial(responses);
      } else {
        // var alert_string = '';
        // var error_string;
        // // handle alerts depending on trial parameters
        // if(trial.force_response){
        //   error_messages.force.show = true;
        //   error_string = formatErrors(error_messages);
        //   alert_string += error_string;
        //   alert(alert_string);
        // } else if (trial.force_response == 'invite') {
        //   error_messages.invite.show = true;
        //   error_string = formatErrors(error_messages);
        //   alert_string += error_string;
        //   alert(alert_string);
        // } else {
        //   endTrial(responses);
        // }
      }
    });

    function formatErrors(error_messages){
      var error_string = '';
      Object.keys(error_messages).forEach(function(tag){
        if(error_messages[tag].show){
          error_string += ' ' + error_messages[tag].message;
        }
      });
      return error_string;
    }

    function getResponses(){
      var responses = {};
      $('.answer').each(function(i, div){
        // determine the type of answer, and relevant meta properties
        var div_obj = $(div);
        var name = div_obj.attr('name');
        var optional; //is this question optional?
        var type; // question type: text, check, select
        var multiple = false; // multiple responses possible to single question?
        if(div_obj.hasClass('text')){
          type = 'text';
        }
        else if(div_obj.hasClass('radio')){
          type = 'radio';
        }
        else if(div_obj.hasClass('select')){
          type = 'select';
        }
        else if(div_obj.hasClass('check')){
          type = 'check';
          multiple = true;
        } else {
          console.log('!! missing type for: ', name);
        }
        if(div_obj.hasClass('optional')){
          optional = true;
        } else {
          optional = false;
        }

        // store data in responses object
        var response;
        if(multiple){
          response = {response: []};
        } else {
          response = {};
        }
        if(!responses[name]){
          responses[name] = response;
        }
        if(type == 'text'){
          response = $(div).val().trim();
          responses[name].response = response;
          if(div_obj.hasClass('numeric-only')){
            responses[name].numeric = true;
          } else {
            responses[name].numeric = false;
          }
        }
        if(type == 'radio' || type == 'check') {
          if(div_obj.is(':checked')){
            var checked = div_obj.val();
            if(multiple){
                var parent_class = div_obj.attr('id').match('occupation-([a-z]+)')[1];
            } else {
                responses[name] = response;
            }
          }
        }
      });
      return responses;
    }

    function validateResponses(responses){
      var validated = true;
      Object.keys(responses).forEach(function(tag){
        var outcome;
        response = responses[tag];
        if(tag=='gender' || tag=='gender_other'){
          ok = checkGender(responses.gender, responses.gender_other);
          if(!ok){
            validated = false;
          }
        } else if(tag == 'age' || tag == 'religion'){
          ok = checkText(tag, response);
          if(!ok){
            validated = false;
          }
        } else if(tag != 'comments'){
          ok = checkResponse(tag, response);
          if(!ok){
            validated = false;
          }
        }
      });
      console.log('validated', validated);
      return validated;
    }

    function checkText(tag, response){
      // check that there is a number, and nothing else
      var ok = true;
      var contains_number = /[0-9]/.test(response);
      var contains_nonnumber = /[^0-9]/.test(response);
      if(contains_number && !contains_nonnumber){
        error_messages[tag].show = false;
        $('#'+tag+'>p').css('color', 'black');
        console.log("text ok", tag)
      } else {
        ok = false;
        error_messages[tag].show = true;
        $('#'+tag+'>p').css('color', 'red');
        console.log("text wrong", tag)
      }
      return ok;
    }

    function checkResponse(tag, response){
      var ok = true;
      if( parseInt(response) >= 0 ){
        $('#'+tag+'>p').css('color', 'black');
        console.log('response ok', tag)
      } else {
        $('#'+tag+'>p').css('color', 'red');
        error_messages.plain.show = true;
        ok = false;
        console.log('response wrong', tag);
      }
      return ok;
    }

    function checkGender(gender_radio, gender_other){
      var ok = true;
      if(gender_radio == ''){
        $('#gender>p').css('color', 'red');
        error_messages.plain.show = true;
        ok = false;
        console.log('response wrong: gender missing')
      } else if(gender_radio == 'other') {
        // if self-describing, make sure there's a description
        if(gender_other.length==0){
          $('#gender>p').css('color', 'red');
          error = 'If you have selected "self-describe" for gender, please make sure you enter a response';
          error_messages.gender_other.show = true;
          ok = false;
          console.log('response wrong: gender self-describe missing')
        } else {
          $('#gender>p').css('color', 'black');
          error_messages.gender_other.show = false;
          console.log('response ok: gender self-describe')
        }
      } else {
        $('#gender>p').css('color', 'black');
        error_messages.gender_other.show = false;
        console.log('response ok: gender')
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

    $( document ).ready(function() {
      start_time = Date.now();

    });

  };

  return plugin;
})();
