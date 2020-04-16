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
      preamble: {
        type: jsPsych.plugins.parameterType.STRING,
        default: "Most recent occupation",
        description: "Preamble for the page"
      },
      instructions: {
        type: jsPsych.plugins.parameterType.STRING,
        default: "(Please choose the closest option and select all that apply)",
        description: "Preamble for the page"
      },
      force_response: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'none',
        description: "If 'force', force responses; if 'invite', just alert asking for responses; otherwise no checking."
      },
      submit: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'Submit',
        description: "text for submit button"
      },
      dict: {
        type: jsPsych.plugins.parameterType.OBJECT,
        default: {},
        description: "language dictionary."
      }
    }
  };

  plugin.trial = function(display_element, trial) {

    // data saving
    var trial_data = {};
    var lg_dict = trial.dict;

    var css = '<style>';
    css += '.disabled {color: grey;}';
    css += '.disabled~label {color: grey;}';
    css += '.option-heading-container {display: flex;justify-content: flex-start;}';
    css += '.option-heading {padding: 2px 4px;font-size: 16px;cursor: pointer;}';
    css += '.option-heading:hover {background-color: #e6f2ff}';
    css += '.option-heading.active:not(.disabled) {color: #0069db;font-weight: 600;}';
    css += '</style>';

    var html = '';
    if(trial.preamble){
      html += '<div class="preamble">'+trial.preamble+'</div>';
    }
    if(trial.instructions){
      html += '<p class="instructions">'+trial.instructions+'</p>';
    }

    occupations = {
      '16.2': null,
      '16.3': null,
      '16.4': '16.5',
      '16.6': '16.7',
      '16.8': null,
      '16.9': '16.10',
      '16.11': null,
      '16.12': '16.13',
      '16.14': null,
      '16.15': '16.16',
      '16.17': null,
      '16.18': null,
      '16.19': null
    };

    var occupations_string = _.reduce(occupations, function(acc, options_code, heading_code){
      var heading_code_dotless = heading_code.replace('.', '_');
      var options;
      var options_code_dotless;
      if(options_code){
        options = lg_dict[options_code];
        options_code_dotless = options_code.replace('.', '_');
      } else {
        options = [];
      }
      // build html string for the occupations in the above list
      var option_heading = '<div class="option-heading-container"><div id="occupation-heading-'+heading_code_dotless+'" class="option-heading">'+lg_dict[heading_code]+'</div></div>';
      var option_string;
      var subfield_string = '<div id="occupation-option-container-'+heading_code_dotless+'" class="options container collapse">';
      if(heading_code=='16.19'){ // other
        var other_input_string = '<div class="indent">'+
        '<input type="text" name="occupation-text" class="answer text inline" placeholder="'+lg_dict['0.3']+'" size="25"></div>';
        subfield_string += other_input_string;
      } else {
        if(options.length==0){
          // if no sub-fields, the top-level field must be selectable
          option_string = '<div class="indent">'+
          '<input type="checkbox" id="occupation-'+heading_code_dotless+'" class="answer check" name="occupation" value="'+heading_code_dotless+'">'+
          '<label for="occupation-'+heading_code_dotless+'" class="option label"> '+lg_dict[heading_code]+'</label></div>';
          subfield_string += option_string;
        } else {
          options.forEach(function(option, option_index){
            option_string = '<div class="indent inline">'+
            '<input type="checkbox" id="occupation-'+heading_code_dotless+'-'+option_index+'" name="occupation" class="answer check" value="'+heading_code_dotless+'-'+option_index+'">'+
            '<label for="occupation-'+heading_code_dotless+'-'+option_index+'" class="option label"> '+option+'</label></div>';
            subfield_string += option_string;
          });
        }
      }
      acc += option_heading + subfield_string + "</div>";
      return acc;
    }, '');

    var occupation = '<div id="occupation" class="">'+
                      '<br>'+
                      occupations_string+'</div>';


    var submit = '<div>'+
                  '<br><button type="button" id="submit">'+trial.submit+'</button>'+
                  '</div>';

    html += occupation;

    display_element.innerHTML = css + html + submit;

    $('.option-heading').on('click', function(e){
      var heading_id = e.target.id;
      var heading_name = heading_id.match('occupation-heading-(.+)')[1];
      var target_div = $('#occupation-option-container-'+heading_name);
      if(target_div.hasClass('collapse')){
        target_div.slideDown(400).removeClass('collapse');
      } else {
        target_div.addClass('collapse').slideUp(200);
      }
      // $('#occupation-option-container-'+heading_name).toggleClass('hidden');
    });

    $('input[type=checkbox]').on('change', function(e){
      var checked = this.checked;
      var option_id = e.target.id;
      var parent_name = option_id.match('occupation-([0-9_]+)')[1];
      if(parent_name == '16_2'){
        $('input[type=checkbox]').each(function(i,d){
          var other_parent = d.id.match('occupation-([0-9_]+)')[1];
          if(d.value != '16_2' && other_parent != parent){
            if(checked){
              $('#occupation-heading-'+other_parent).addClass('disabled');
              $(d).attr("disabled", true);
              $(d).addClass("disabled");
            } else {
              $('#occupation-heading-'+other_parent).removeClass('disabled');
              $(d).removeAttr("disabled");
              $(d).removeClass("disabled");
            }
          }
        });
      }

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
      console.log(responses)
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
          var target_id = div_obj.attr('id');
          var parent_class = target_id.match('occupation-([0-9_]+)')[1];
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
      trial_data.responses = responses;
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
