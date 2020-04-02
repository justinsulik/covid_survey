/*
todo:
- currently slider criterion only greater than
- interaction currently set only for speficy or followup, not both
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
      },
    }
  };

  plugin.trial = function(display_element, trial) {

    // data saving
    var trial_data = {};
    var start_time;
    var display_logic = {};

    var css = '<style>';
    css += '.gap {margin-bottom: 10px}';
    css += '.start-line {border-top: 1px solid #c7c7c7; padding-top: 15px;}';
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
      var class_string = 'multiple-container ' + embellishClassString(question_data);

      var html_string = '<div id="question-container-'+question_id+'" class="'+class_string+'">';
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

      handleFollowups(question_id, question_data);

      return html_string + option_string + '</div>';
    }

    function handleFollowups(question_id, question_data){
      if(!display_logic[question_id]){
        display_logic[question_id] = [];
      }
      if(question_data.has_followup){
        question_data.has_followup.forEach(function(d, i){
          display_logic[question_id].push({type: 'followup', target: d.id, criterion: d.criterion});
        });
      }
    }

    function checkbox(question_data, q_index){
      var question_id = question_data.id || 'question-'+q_index;
      display_logic[question_id] = [];
      var cue = question_data.cue || '';
      var options = question_data.options || [];
      var values = question_data.values || [];
      var specify = question_data.specify || '';
      var class_string = 'checkbox-container ' + embellishClassString(question_data);

      var html_string = '<div id="question-container-'+question_id+'" class="'+class_string+'">';
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
        display_logic[question_id].push({type: 'specify', unhide_on: 'other'});
      }
      option_string += '</div>';
      html_string += option_string;

      if(question_data.has_followup){
        display_logic[question_id].push({type: 'followup', target: question_data.has_followup.id, criterion: question_data.has_followup.criterion});
      }

      html_string += '</div>';
      return html_string;
    }

    function select(question_data, q_index){
      var question_id = question_data.id || 'question-'+q_index;
      display_logic[question_id] = [];
      var cue = question_data.cue || '';
      var options = question_data.options || [];
      var values = question_data.values || [];
      var class_string = 'select-container ' + embellishClassString(question_data);

      var html_string = '<div id="question-container-'+question_id+'" class="'+class_string+'">';
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

      if(question_data.specify){
        html_string += '<div id="'+question_id+'-specify" class="response hidden inline optional"><input type="text" name="'+question_id+'-specify" class="jspsych-demographics answer text" placeholder="Please specify"></div>';
        display_logic[question_id].push({type: 'specify', unhide_on: 'other'});
      }
      if(question_data.has_followup){
        display_logic[question_id].push({type: 'followup', target: question_data.has_followup.id, criterion: question_data.has_followup.criterion});
      }
      html_string += '</div>';
      return html_string;
    }

    function slider(question_data, q_index){
      var question_id = question_data.id || 'question-'+q_index;
      display_logic[question_id] = [];
      var cue = question_data.cue || '';
      var labels = question_data.labels || '';
      var class_string = 'slider-container gap ' + embellishClassString(question_data);

      var width = Math.floor(100/(labels.length+1));
      var html_string = '<div id="question-container-'+question_id+'" class="'+class_string+'" style="width: 80%; margin: auto;">';
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

      handleFollowups(question_id, question_data);

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

    $('.slider').mouseup(function(e){
      var name = this.id;
      var value = this.value;
      display_logic[name].forEach(function(d){
        if(d.type=='followup'){
          if(value > d.criterion){
            // problem: currently only implemented IF GREATER THAN criterion; probably at some point need IF LESS THAN
            $('#question-container-'+d.target).show(400);
          } else {
            $('#question-container-'+d.target).hide(200);
          }
        }
      });
    });

    $('select').on('change', function (e) {
      var value = this.value;
      var name = this.id;
      display_logic[name].forEach(function(d){
        if(d.type=='specify'){
          if(value == d.unhide_on){
            $("#"+name+'-specify').addClass('inline').removeClass('optional hidden');
          } else {
            $("#"+name+'-specify').removeClass('inline').addClass('optional hidden');
          }
        }
        if(d.type=='followup'){
          if(value == d.criterion){
            $('#question-container-'+d.target).show(400);
          } else {
            $('#question-container-'+d.target).hide(200);
          }
        }
     });
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
      var clicked_box = this;
      var id = clicked_box.id;
      var value = clicked_box.value;
      var name = clicked_box.name;
      display_logic[name].forEach(function(d){
        if(d.type=='specify'){
          if(value == d.unhide_on){
            if(clicked_box.checked){
              $("#"+name+'-specify').addClass('inline').removeClass('optional hidden');
            } else {
              $("#"+name+'-specify').removeClass('inline').addClass('optional hidden');
            }
          }
        }
        if(d.type=='followup'){
          if(value == d.criterion){
            $('#question-container-'+d.target).show(400);
          } else {
            $('#question-container-'+d.target).hide(200);
          }
        }
      });
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

    function embellishClassString(question_data){
      var class_string = '';
      if(question_data.optional){
        class_string += ' optional';
      }
      if(question_data.is_start){
        class_string += ' start-line';
      }
      if(question_data.is_followup){
        class_string += ' followup hidden';
      }
      return class_string;
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
