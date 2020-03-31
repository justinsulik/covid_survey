/*
 * Plugin for collecting common demographic variables
 * If adding any more, ensure that the relevant input tag has class="jspsych-demographics answer"
 */

jsPsych.plugins["custom-form"] = (function() {

  var plugin = {};

  plugin.info = {
    name: "custom-form",
    parameters: {
      questions: {
        type: jsPsych.plugins.parameterType.OBJECT, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        array: true,
        description: "List of question types/options"
      },
      preamble: {
        type: jsPsych.plugins.parameterType.STRING,
        default: null,
        description: "Preamble for the page"
      },
      instructions: {
        type: jsPsych.plugins.parameterType.STRING,
        default: null,
        description: "Further instructions"
      }
    }
  };

  plugin.trial = function(display_element, trial) {

    // data saving
    var trial_data = {};
    var start_time;
    var display_logic = {};

    var css = '<style>';
    css += '.gap {margin-bottom: 10px}';
    css += '</style>';

    var html = '';
    if(trial.preamble){
      html += '<div class="preamble">'+trial.preamble+'</div>';
    }
    if(trial.instructions){
      html += '<div class="instructions">'+trial.instructions+'</div>';
    }

    trial.questions.forEach(function(question, q_index){
      var question_string;
      if(question.type=='slider'){
        question_string = slider(question, q_index);
      }
      if(question.type=='select'){
        question_string = select(question, q_index);
      }
      if(question.type=='checkbox'){
        question_string = checkbox(question, q_index);
      }
      if(question.type=='multiple'){
        question_string = multiple(question, q_index);
      }
      html += question_string;
    });



    function multiple(question_data, q_index){
      var question_id = question_data.id || 'question-'+q_index;
      var cue = question_data.cue || '';
      var options = question_data.options || [];
      var values = question_data.values || [];
      var optional = question_data.optional || '';
      var class_string = 'multiple-container ' + optional;
      if(question_data.end_line){
        class_string += ' end-line';
      }

      var html_string = '<div class="'+class_string+'">';
      html_string += '<div class="cue">'+cue+'</div>';
      html_string += '<div id="'+question_id+'" class="custom-form-multiple flex" style="width:100%; flex-wrap: wrap; justify-content: space-around;">';
      var option_string = '';
      var option_width = Math.round(100/(options.length+1));
      options.forEach(function(option, i){
        var option_id = question_id+'-'+i;
        var value_string;
        if(values.length>0 && values[i]){
          value_string = values[i];
        } else {
          value_string = option.replace(/ /g, '_').toLowerCase();
        }
        option_string += '<div style="width: '+option_width+'%" class="multiple-option answer" name="'+question_id+'" id="'+option_id+'" value="'+value_string+'">'+option+'</div>';
      });
      option_string += '</div>';
      return html_string + option_string + '</div>';
    }

    function checkbox(question_data, q_index){
      var question_id = question_data.id || 'question-'+q_index;
      var cue = question_data.cue || '';
      var options = question_data.options || [];
      var values = question_data.values || [];
      var optional = question_data.optional || '';
      var specify = question_data.specify || '';
      var class_string = 'checkbox-container ' + optional;
      if(question_data.end_line){
        class_string += ' end-line';
      }

      var html_string = '<div class="'+class_string+'">';
      html_string += '<div class="cue">'+cue+'</div>';
      html_string += '<div id="'+question_id+'" class="custom-form-checkbox response flex" style="width:100%; flex-wrap: wrap;">';
      var option_string = '';
      options.forEach(function(option, i){
        var option_id = question_id+'-'+i;
        var value_string;
        if(values.length>0 && values[i]){
          value_string = values[i];
        } else {
          value_string = option.replace(/ /g, '_').toLowerCase();
        }
        option_string += '<div style="width:50%" class=""><input type="checkbox" name="'+question_id+'" id="'+option_id+'" value="'+value_string+'" class="answer check">';
        option_string += '<label for="'+option_id+'" class="option label"> '+option+'</label></div>';
      });

      if(specify){
        option_string += '<div id="'+question_id+'-specify" class="response optional hidden"><input type="text" name="'+question_id+'-specify" class="jspsych-demographics answer text" placeholder="Please specify"></div>';
        display_logic[question_id] = {type: 'checkbox', unhide_on: 'other'};
      }
      option_string += '</div>';
      html_string += option_string;

      html_string += '</div>';
      return html_string;
    }


    function select(question_data, q_index){
      var question_id = question_data.id || 'question-'+q_index;
      var cue = question_data.cue || '';
      var options = question_data.options || [];
      var values = question_data.values || [];
      var optional = question_data.optional || '';
      var specify = question_data.specify || '';
      var class_string = 'select-container ' + optional;
      if(question_data.end_line){
        class_string += ' end-line';
      }

      var html_string = '<div class="'+class_string+'">';
      html_string += '<div class="cue">'+cue+'</div>';
      html_string += '<select id="'+question_id+'" class="custom-form-select response">';
      var option_string = '<option disabled selected value> -- select an option -- </option>';
      options.forEach(function(option,i){
        var option_id = question_id+'-'+i;
        var value_string;
        if(values.length>0 && values[i]){
          value_string = values[i];
        } else {
          value_string = option.replace(/ /g, '_').toLowerCase();
        }
        option_string += '<option name="'+question_id+'" id="'+option_id+'" value="'+value_string+'" class="answer select">'+option+'</option>';
      });

      html_string += option_string + '</select>';

      if(specify){
        html_string += '<div id="'+question_id+'-specify" class="response hidden inline optional"><input type="text" name="'+question_id+'-specify" class="jspsych-demographics answer text" placeholder="Please specify"></div>';
        display_logic[question_id] = {type: 'select', unhide_on: 'other'};
      }

      html_string += '</div>';
      return html_string;
    }

    function slider(question_data, q_index){
      var question_id = question_data.id || 'question-'+q_index;
      var cue = question_data.cue || '';
      var labels = question_data.labels || '';
      var optional = question_data.optional || '';
      var class_string = 'slider-container gap ' + optional;
      if(question_data.end_line){
        class_string += ' end-line';
      }

      var width = Math.floor(100/(labels.length+1));
      var html_string = '<div class="'+class_string+'" style="width: 80%; margin: auto;">';
      html_string += '<div class="cue">'+cue+'</div>';
      html_string += '<input type="range" min="1" max="100" value="50" class="slider answer" id="'+question_id+'" style="width: 100%">';

      var label_string = '<div class="label-container" style="display: flex; width: 100%; justify-content: space-between; align-items: flex-start">';
      labels.forEach(function(label, i){
        var style_string = 'width: '+width+'%;';
        if(i==0){
          style_string += 'text-align: left;';
        }
        if(i==labels.length-1){
          style_string += 'text-align: right;';
        }
        label_string += '<div class="label" style="'+style_string+'">'+label+'</div>';
      });
      label_string += '</div>';

      html_string += label_string + '</div>';
      return html_string;
    }

    var submit = '<div>'+
                  '<br><button type="button" id="submit">Submit</button>'+
                  '</div>';


    display_element.innerHTML = css+html+submit;

/***
Inputs/interactions
***/

    $('#submit').click(function(e){
      // var responses = getResponses();
      // var validated = validateResponses(responses);
      // if(validated.ok){
        endTrial();
      // } else {
        // highlightProblems(validated.problems);
      // }
    });

    $('select').on('change', function (e) {
      var value_selected = this.value;
      var name = this.id;
      if(display_logic[name]){
        if(display_logic[name].type=='select'){
          if(value_selected == display_logic[name].unhide_on){
            $("#"+name+'-specify').addClass('inline').removeClass('optional hidden');
          } else {
            $("#"+name+'-specify').removeClass('inline').addClass('optional hidden');
          }
        }
      }
    });

    $('.multiple-option').on('click', function(e){
      var option_id = this.id;
      var option_value = $(this).attr('value');
      var name = $(this).attr('name');
      $('.multiple-option[name='+name+']').each(function(i,d){
        var current_option = $(d);
        var match = current_option.attr('value') == option_value;
        if(match){
          current_option.addClass('selected');
        } else {
          current_option.removeClass('selected');
        }
      });

    });

    $('input[type=checkbox]').on('change', function(e){
      var option_id = this.id;
      var option_value = this.value;
      var name = this.name;
      if(display_logic[name]){
        if(display_logic[name].type=='checkbox' && option_value == display_logic[name].unhide_on){
          if(this.checked){
            $("#"+name+'-specify').addClass('inline').removeClass('optional hidden');
          } else {
            $("#"+name+'-specify').removeClass('inline').addClass('optional hidden');
          }
        }
      }
    });

    /*
    Data handling
    */


    function validateResponses(responses){
    }

    function highlightProblems(problems){

    }

    function formatErrors(error_messages){

    }

    function checkNumeric(response){

    }

    function endTrial(responses){
      // var end_time = Date.now();
      // var rt = end_time - start_time;
      // trial_data.rt = rt;
      // trial_data.responses = responses;

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
