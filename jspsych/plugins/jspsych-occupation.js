/***
 Plugin for collecting common occupations
  TODO:
  - need validation?
  - display logic?
***/

jsPsych.plugins["occupation"] = (function() {

  var plugin = {};

  plugin.info = {
    name: "occupation",
    parameters: {
      preamble1: {
        type: jsPsych.plugins.parameterType.STRING,
        default: "Most recent occupation",
        description: "Preamble for the page"
      },
      preamble2: {
        type: jsPsych.plugins.parameterType.STRING,
        default: "(select all that apply; if you don’t find your own occupation, please select the options you think apply closely)",
        description: "Preamble for the page"
      },
      force_response: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'none',
        description: "If 'force', force responses; if 'invite', just alert asking for responses; otherwise no checking."
      }
    }
  };

  plugin.trial = function(display_element, trial) {

    // data saving
    var trial_data = {};

    var html = '';
    if(trial.preamble1){
      html += '<h2 id="preamble1">'+trial.preamble1+'</h2>';
    }
    if(trial.preamble2){
      html += '<p id="preamble2" class="left">'+trial.preamble2+'</p>';
    }

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
      var subfield_string = '<div id="occupation-option-container-'+short_heading+'" class="demographics options container collapse">';
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
                      '<br>'+
                      occupations_string+'</div>';


    var submit = '<div>'+
                  '<br><button type="button" id="submit">Submit</button>'+
                  '</div>';

    html += occupation;

    display_element.innerHTML = html+submit;

    $('.option-heading').on('click', function(e){
      var heading_id = e.target.id;
      var heading_name = heading_id.match('occupation-heading-([a-z]+)')[1];
      var target_div = $('#occupation-option-container-'+heading_name);
      if(target_div.hasClass('collapse')){
        target_div.slideDown(400).removeClass('collapse');
      } else {
        target_div.addClass('collapse').slideUp(200);
      }
      // $('#occupation-option-container-'+heading_name).toggleClass('hidden');
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
      var validated = validateResponses(responses);
      if(validated){
        endTrial(responses);
      } else {
      }
    });

    function getResponses(){
      var responses = {};
      $('.answer').each(function(i, div){
        // determine the type of answer, and relevant meta properties
        var div_obj = $(div);
        var name = div_obj.attr('name');
        if(div_obj.is(':checked')){
          var parent_class = div_obj.attr('id').match('occupation-([a-z]+)')[1];
          if(!parent_class){
            parent_class = 'unknown';
          }
          // store response in trial_data
          if(!responses[parent_class]){
            responses[parent_class] = [];
          }
          var checked = div_obj.val();
          if(responses[parent_class].indexOf(checked)==-1){
            responses[parent_class].push(checked);
          }
        }
        if(div_obj.hasClass('text')){
          var response = div_obj.val().trim();
          responses['other'] = response;
        }
      });
      console.log(responses)
      return responses;
    }

    function validateResponses(responses){
      var validated = true;
      console.log('validated', validated);
      return validated;
    }

    function endTrial(responses){
      var end_time = Date.now();
      var rt = end_time - start_time;
      trial_data.rt = rt;
      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();
      // clear screen
      display_element.innerHTML = '';
      jsPsych.finishTrial(trial_data);
      console.log(trial_data);
    }

    $(document).ready(function() {
      start_time = Date.now();
    });

  };

  return plugin;
})();