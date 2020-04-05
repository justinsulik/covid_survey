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
        description: "List of question types/options. See below for options"
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
      highlight: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'item',
        description: "Highlight alternate items or alternative groups (marked by question variable: group)"
      },
      submit: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'Continue',
        description: "Text for 'submit' button"
      },
    }
  };

  plugin.trial = function(display_element, trial) {

    /* question options:
    type: string - question type: slider, select,  checkbox, multiple, text
    optiona: boolean - if true, can skip
    inline: boolean - place question inline with cue
    options: array of options to display
    values: array of values corresponding to above optionSelected
    is_start: boolean - if true, start of group
    has_followup: array of objects - keys id=id of followup items; criterion=what value will unhide followup;
    is_followup: boolean - if true, is a follow up question, and will only be displayed depending on main question criterion
    group: numeric - used for highlighting
    force_all: boolean - if true (for checkbox type) then all options must be selected
    columns: int - for select answers, how many columns to display the options in
    */

    // set up
    var trial_data = {};
    var start_time;
    var display_logic = {};
    var slider_movement_tracker = {};

    var css = '<style>';
    css += '.form-item {text-align: left; padding: 20px 5px 10px 5px}';
    css += '.preamble {margin: 30px auto 20px auto; font-weight: bold; text-align: left}';
    css += '.instructions {font-size: 14px; margin-bottom: 10px;}';
    css += '.start-line {border-top: 1px solid #c7c7c7; padding-top: 15px;}';
    css += '.response {margin-left: 10px;}';
    css += '.specify {display: inline-block;}';
    css += '.highlight {background-color: #cfe1e6}';
    css += '.followup {display: inline-block;margin-left: 60px;}';
    css += '.indent {margin-left: 24px;}';
    css += '.flex {display: flex;}';
    css += '.multiple.answer {border: 1px solid #c7c7c7; padding: 5px 10px; border-radius: 5px;}';
    css += '.multiple.answer:hover {background-color: #e6f2ff;}';
    css += '.multiple.answer.selected {background-color: #6ab0fc; border: 1px solid #0069db;}';
    css += '.instructions {font-size: 14px; text-align: left; margin-bottom: 10px;}';
    css += '.cue {font-size: 16px; padding: 10px 5px 5px 5px;}';
    css += '.inline > .cue {display: inline-block}';
    css += '.label {font-size: 12px; line-height: 1.1em;}';
    css += '.slider.label {font-size: 14px; line-height: 1.1em;}';
    css += '.hidden {display: none;}';
    css += '.problem {color: red;}';
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
      if(question.type=='text'){
        question_string = text(question, q_index);
      }
      html += question_string;
    });

    function text(question_data, q_index){
      var question_id = question_data.id || 'question-'+q_index;
      var cue = question_data.cue || '';
      var options = question_data.options || [];
      var values = parseValues(question_data);
      var class_string = 'text-container ' + embellishClassString(question_data, q_index);
      var placeholder_string = '';
      if(question_data.placeholder){
        placeholder_string += question_data.placeholder;
      }

      var html_string = '<div id="question-container-'+question_id+'" class="'+class_string+'">';
      html_string += '<div class="cue">'+cue+'</div>';
      html_string += '<input type="text" name="'+question_id+'" id="'+question_id+'" class="text response answer" placeholder="'+placeholder_string+'">';
      html_string += '</div>';
      handleFollowups(question_id, question_data);
      return html_string;
    }

    function multiple(question_data, q_index){
      var question_id = question_data.id || 'question-'+q_index;
      var cue = question_data.cue || '';
      var options = question_data.options || [];
      var values = parseValues(question_data);
      var class_string = 'multiple-container ' + embellishClassString(question_data, q_index);

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
          option = ''+option;
          value_string = option.replace(/ /g, '_').toLowerCase();
        }
        option_string += '<div style="width: '+option_width+'%" class="multiple answer" name="'+question_id+'" id="'+option_id+'" value="'+value_string+'">'+option+'</div>';
      });
      option_string += '</div>';

      handleFollowups(question_id, question_data);

      return html_string + option_string + '</div>';
    }

    function checkbox(question_data, q_index){
      var question_id = question_data.id || 'question-'+q_index;
      display_logic[question_id] = [];
      var cue = question_data.cue || '';
      var options = question_data.options || [];
      var values = parseValues(question_data);
      var class_string = 'checkbox-container ' + embellishClassString(question_data, q_index);

      var html_string = '<div id="question-container-'+question_id+'" class="'+class_string+'">';
      html_string += '<div class="cue">'+cue+'</div>';
      html_string += '<div id="'+question_id+'" class="custom-form-checkbox response flex" style="width:100%; flex-wrap: wrap;">';
      var option_string = '';
      var width_string;
      if(question_data.columns){
        width_string = Math.round(100/question_data.columns) + "%";
      } else {
        width_string = "50%";
      }
      options.forEach(function(option, i){
        var option_id = question_id+'-'+i;
        var value_string;
        var option_class_string = 'answer check ';
        if(question_data.force_all){
          option_class_string += 'required ';
        }
        if(values.length>0 && values[i]){
          value_string = values[i];
        } else {
          option = ''+option;
          value_string = option.replace(/ /g, '_').toLowerCase();
        }
        option_string += '<div id="option-container-'+option_id+'" style="width:'+width_string+'" class=""><input type="checkbox" name="'+question_id+'" id="'+option_id+'" value="'+value_string+'" class="'+option_class_string+'">';
        option_string += '<label for="'+option_id+'" class="option label"> '+option+'</label></div>';
      });

      if(question_data.specify){
        option_string += '<div id="'+question_id+'-specify" class="response optional hidden"><input type="text" name="'+question_id+'-specify" class="answer text specify" placeholder="Please specify"></div>';
        display_logic[question_id].push({type: 'specify', unhide_on: question_data.specify});
      }
      option_string += '</div>';
      html_string += option_string;

      handleFollowups(question_id, question_data);

      html_string += '</div>';
      return html_string;
    }

    function select(question_data, q_index){
      var question_id = question_data.id || 'question-'+q_index;
      display_logic[question_id] = [];
      var cue = question_data.cue || '';
      var options = question_data.options || [];
      var values = parseValues(question_data);
      var class_string = 'select-container ' + embellishClassString(question_data, q_index);

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
          option = ''+option;
          value_string = option.replace(/ /g, '_').toLowerCase();
        }
        option_string += '<option name="'+question_id+'" id="'+option_id+'" value="'+value_string+'" class="answer select">'+option+'</option>';
      });

      html_string += option_string + '</select>';

      if(question_data.specify){
        html_string += '<div id="'+question_id+'-specify" class="response hidden inline optional"><input type="text" name="'+question_id+'-specify" id="'+question_id+'-'+question_data.specify+'" class="specify answer text specify" placeholder="Please specify"></div>';
        display_logic[question_id].push({type: 'specify', unhide_on: question_data.specify});
      }
      handleFollowups(question_id, question_data);
      html_string += '</div>';
      return html_string;
    }

    function slider(question_data, q_index){
      var question_id = question_data.id || 'question-'+q_index;
      display_logic[question_id] = [];
      slider_movement_tracker[question_id] = false;
      var cue = question_data.cue || '';
      var labels = question_data.labels || '';
      var class_string = 'slider-container ' + embellishClassString(question_data, q_index);

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
        label_string += '<div class="label slider" style="'+style_string+'">'+label+'</div>';
      });
      label_string += '</div>';

      handleFollowups(question_id, question_data);

      html_string += label_string + '</div>';
      return html_string;
    }

    var submit = '<div>'+
                  '<br><button type="button" id="submit">'+trial.submit+'</button>'+
                  '</div>';

    display_element.innerHTML = css+html+submit;

/***
Inputs/interactions
***/


    $('#submit').click(function(e){
      var responses = getResponses();
      var validated = validateResponses(responses);
      if(validated.ok){
        endTrial(responses);
      } else {
        highlightProblems(validated.problems);
      }
    });

    $('.slider').mouseup(function(e){
      var name = this.id;
      var value = this.value;
      slider_movement_tracker[name] = true;
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
            $("#"+name+'-specify').addClass('specify').removeClass('optional hidden');
          } else {
            $("#"+name+'-specify').removeClass('specify').addClass('optional hidden');
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

    $('.multiple.answer').on('click', function(e){
      var option_id = this.id;
      var option_value = $(this).attr('value');
      var name = $(this).attr('name');
      $('.multiple.answer[name='+name+']').each(function(i,d){
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
              $("#"+name+'-specify').addClass('specify').removeClass('optional hidden');
            } else {
              $("#"+name+'-specify').removeClass('specify').addClass('optional hidden');
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

    function getResponses(){
      var responses = [];
      var requirement_tracker = {};
      $('.answer').each(function(i, answer){
        var answer_obj = $(answer);
        var value = this.value || answer_obj.attr('value'); // latter option e.g. for type=multiple, where value is property of div, not input
        var id = this.id;
        var name = this.name || answer_obj.attr('name');
        var parent = findParent(name, id);
        var selected = answer_obj.hasClass('selected');
        /*
        The difference between 'optional' and 'required' is that a non-optional question will be OK-ed if one option is selected.
        A required question needs to have *all* options selected (e.g. for consent forms).
        Due to this difference, non-optional answers are handled with the requirement_tracker above (since this involves validation across individual answers),
        whereas the later is just handled with validateResponses below (since any individual failure is a problem)
        */
        var required = answer_obj.hasClass('required');
        var optional = answer_obj.hasClass('optional');
        if(!optional && !requirement_tracker[parent]){
          requirement_tracker[parent] = false;
        }
        // make a record of non-optional questions, so that if no options are selected, this is noted
        var numeric = answer_obj.hasClass('numeric');
        if(answer_obj.hasClass('select') || answer_obj.hasClass('check')){
          selected = answer_obj.is(':checked');
          if(required){
            responses.push({id: id, name: name, value: value, selected: selected, required: true});
          } else if(selected){
            requirement_tracker[parent] = true;
            responses.push({id: id, name: name, value: value, optional: optional});
          }
        }
        if(answer_obj.hasClass('text')){
          value = JSON.stringify(value);
          requirement_tracker[parent] = true;
          responses.push({id: id, name: name, value: value, optional: optional, numeric: numeric});
        }
        if(answer_obj.hasClass('multiple') && selected){
          requirement_tracker[parent] = true;
          responses.push({id: id, name: name, value: value, optional: optional, numeric: numeric});
        }
        if(answer_obj.hasClass('slider')){
          // slider doesn't have distinct name, since there aren't any suboptions to choose among
          var moved = slider_movement_tracker[id];
          requirement_tracker[parent] = true; // for now - all sliders are automatically ok-ed
          responses.push({id: id, value: value, optional: optional, moved: moved});
        }
      });
      // console.log(responses);
      console.log(requirement_tracker);
      return responses;
    }

    function findParent(name, id){
      // if there is an optout or a nameless anwer (e.g. a slider), then this finds which question it is an optout or slider for
      var parent = name;
      if(name){
        var reg = name.match(/(.+)-optout/);
        if(reg){
          parent = reg[1];
        }
      } else {
        parent = id;
      }
      return parent;
    }

    function validateResponses(responses){
      // console.log('here')
      var validation = {ok: true, problems: []};
      responses.forEach(function(d,i){
        if(d.required && !d.selected){
            validation.ok = false;
            validation.problems.push({id: 'option-container-'+d.id, problem: 'required'});
        }
      });
      return validation;
    }

    function highlightProblems(problems){
      // reset problems
      $('.problem').each(function(i, d){
        $(d).removeClass('problem');
      });
      problems.forEach(function(problem){
        $('#'+problem.id).addClass('problem');
      });

    }

    function formatErrors(error_messages){

    }

    function checkNumeric(response){

    }

    function endTrial(responses){
      var end_time = Date.now();
      var rt = end_time - start_time;
      trial_data.rt = rt;
      trial_data.responses = JSON.stringify(responses);

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // clear screen
      display_element.innerHTML = '';

      jsPsych.finishTrial(trial_data);
      // console.log(trial_data);
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

    function embellishClassString(question_data, q_index){
      var class_string = 'form-item ';
      if(question_data.inline){
        class_string += ' inline';
      }
      if(question_data.optional){
        class_string += ' optional';
      }
      if(question_data.is_start){
        class_string += ' start-line';
      }
      if(question_data.is_followup){
        class_string += ' followup hidden';
      }
      if(trial.highlight=='group'){
        if(question_data.group%2==1){
          class_string += ' highlight';
        }
      } else {
        if(q_index%2==1){
          class_string += ' highlight';
        }
      }
      return class_string;
    }

    function parseValues(question_data){
      // value need to be strings. Mostly because a value=0 is treated as null by javascript in some cases
      var values = [];
      if(question_data.values){
        question_data.values.forEach(function(d){
          values.push(''+d);
        });
      }
      return values;
    }

    $( document ).ready(function() {
      start_time = Date.now();
    });

  };

  return plugin;
})();
