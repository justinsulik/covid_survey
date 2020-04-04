/*
 * Plugin for collecting common demographic variables
 * If adding any more, ensure that the relevant input tag has class="jspsych-demographics answer"
 *store both ID and name of previous data

 LOAD LODASH
 */

jsPsych.plugins["table-completion"] = (function() {

  var plugin = {};

  plugin.info = {
    name: "table-completion",
    parameters: {
      add_new: {
        type: jsPsych.plugins.parameterType.BOOL, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: false,
        description: "Whether new rows can be added"
      },
      row_values: {
        type: jsPsych.plugins.parameterType.OBJECT,
        array: true,
        default: [],
        description: "Values to go in the first column. Object with keys id, row_name"
      },
      column_headers: {
        type: jsPsych.plugins.parameterType.STRING,
        array: true,
        default: null,
        description: "Names of columns"
      },
      column_icons: {
        type: jsPsych.plugins.parameterType.BOOL,
        default: false,
        description: "Whether to include header icons"
      },
      column_vars: {
        type: jsPsych.plugins.parameterType.STRING,
        array: true,
        default: [],
        description: "Short names for variables of columns"
      },
      preamble: {
        type: jsPsych.plugins.parameterType.STRING,
        default: null,
        description: "Preamble for the page"
      },
      instructions: {
        type: jsPsych.plugins.parameterType.STRING,
        default: null,
        description: "More detailed instructions"
      },
      force_response: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'force',
        description: "If 'force', force responses; if 'invite', just alert asking for responses; otherwise no checking."
      },
      dependencies: {
        type: jsPsych.plugins.parameterType.STRING,
        default: '',
        description: "In format 'column1>column2', selecting column1 will automatically select column 2."
      },
      highlighting: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'column',
        description: "Whether alternative rows or columns are highlighted."
      },
      new_row_placeholder: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'Add a name',
        description: "Text input placeholder for new rows."
      }
    }
  };

  plugin.trial = function(display_element, trial) {

    // data saving
    var trial_data = {own_rows: [], responses: []};
    var start_time;
    var dependencies = {};

    var css = '<style>';
    css += '.preamble {margin-bottom: 20px; font-weight: bold;}';
    css += '.instructions {font-size: 14px; margin-bottom: 10px;}';
    css += '.check-box {width: 15px; height: 15px; margin: auto; cursor: pointer;}';
    css += '.header-icon {padding: 2px; width: 45%}';
    css += '.cell.highlight {background-color: #cfe1e6}';
    css += '.check-table {border-collapse: collapse}';
    css += '.cell.header {border-top: 1px solid black;border-bottom: 1px solid black;font-size: 12px;}';
    css += '#add-button {font-size: 80; display: inline-block; font-weight: 900; color: #348ee3; width: 28px; border: 1px solid #005597; border-radius: 50px; margin-left: 5px; cursor: pointer}';
    css += '#final-row {border-top: 1px solid grey; border-bottom: 1px solid grey;}';
    css += '.opt-out {margin-bottom: 10px;}';
    css += '</style>';

    var html = '';
    if(trial.preamble){
      html += '<div class="preamble">'+trial.preamble+'</div>';
    }
    if(trial.instructions){
      html += '<div class="instructions">'+trial.instructions+'</div>';
    }
    if(trial.opt_out){
      html += '<div class="opt-out"><input id="optout" type="checkbox" value="optout"/><label for="optout">'+trial.opt_out+'</label></div>';
    }
    if(trial.dependencies.length>0){
      var reg = /([a-z]+)>([a-z]+)/;
      var matches = trial.dependencies.match(reg);
      if(matches.length>1){
        dependencies[matches[1]] = matches[2];
      }
    }


/***
Table
***/

    var table = '<table class="check-table">';
    var column_number = trial.column_headers.length;
    var base_width;
    var first_column_width; // allow first column to be wider
    if(column_number>7){
      base_width = 100/(column_number+3); //first row counts as 3
      first_column_width = 4*base_width;
    } else if(column_number>3){
      base_width = 100/(column_number+1); //first row counts as 2
      first_column_width = 2*base_width;
    } else {
      base_width = 100/column_number;
      first_column_width = base_width;
    }


    // header
    var header_cells = _.reduce(trial.column_headers, function(acc, header, i){
      var class_string = 'cell header';
      var column_width;
      if(i==0){
        class_string += ' main';
        column_width = first_column_width;
      } else {
        column_width = base_width;
      }
      if(i%2==1 && trial.highlighting=='column'){
        class_string += ' highlight';
      }
      column_width = Math.round(100*column_width)/100;
      var icon_string = '';
      if(trial.column_icons && i != 0){
        if(trial.column_vars){
            if(trial.column_vars[i]){
              if(trial.column_vars[i]!='other'){
                var icon_file_string = 'img/icons/' + trial.column_vars[i] + '.png';
                icon_string += '<div><img class="header-icon" src="'+icon_file_string+'"></div>';
              }
            }
        }
      }
      acc += '<th valign="bottom" class="'+class_string+'" style="width:'+column_width+'%">'+icon_string+header+'</th>';
      return acc;
    }, '');
    var header_row = '<tr>'+header_cells+'</tr>';

    function add_columns(row_id, row_index){
      var other_cols = '';
      var check_box = '';
      _.range(column_number-1).forEach(function(i){
        var class_string = 'cell clickable ';
        if(row_index%2==1 && trial.highlighting=='row'){
          class_string += 'highlight';
        }
        if(row_id!='final'){
          var id_str;
          if(trial.column_vars.length>0){
            id_str = 'check-'+row_id+'-'+trial.column_vars[i+1];
          } else {
            id_str = 'check-'+row_id+'-'+trial.column_headers[i+1].replace(/ /g, '-');
          }
          check_box = '<input type="checkbox" class="check-box response" id="'+id_str+'">';
          if(i%2==0 && trial.highlighting=='column'){
            class_string += 'highlight';
          }
        }
        other_cols += '<td class="'+class_string+'">'+check_box+'</td>';
      });
      other_cols += '</tr>';
      return other_cols;
    }

    function add_first_column(row_id, type, row_index){
      var first_col;
      var class_string = 'cell main ';
      if(row_index%2==1 && trial.highlighting=='row'){
        class_string += 'highlight';
      }
      if(type=='old'){
        first_col = '<tr><td class="'+class_string+'">'+row_id+'</td>';
      } else {
        first_col = '';
        first_col += '<tr><td class="'+class_string+'" id="row-'+row_id+'">';
        first_col += '<input id="new-name-'+row_id+'" name="new-name-'+row_id+'" type="text" placeholder="'+trial.new_row_placeholder+'" size="15">';
        first_col += '</td>';
      }
      return first_col;
    }

    function latest_row(){
      new_row = trial_data.own_rows.length;
      trial_data.own_rows.push({row: new_row});
      return new_row;
    }

    // previous rows
    var table_rows = '';
    if(trial.row_values){
      trial.row_values.forEach(function(d,i){
        var row_id = d.id;
        var row_name = d.row_name;
        var first_col = add_first_column(row_name, 'old', i);
        var other_cols = add_columns(row_id, i);
        table_rows += first_col + other_cols;
      });
    }
    table += header_row+table_rows;

    function add_new_row(){
      var row_id = latest_row();
      var row_index = row_id + trial.row_values.length;
      var first_col = add_first_column(row_id, 'new', row_index);
      var other_cols = add_columns(row_id, row_index);
      return first_col+other_cols;
    }

    function last_row(){
      var row_id = 'final';
      var add_button = '<td><div id="add-button">+</div></td>';
      var first_col = '<tr id="final-row">'+add_button+'</td>';
      var other_cols = add_columns(row_id);
      return first_col + other_cols;
    }

    if(trial.add_new){
      table += add_new_row() + last_row();
    }

    table += '</table>';

    var submit = '<div>'+
                  '<br><button type="button" id="submit">Continue</button>'+
                  '</div>';

    display_element.innerHTML = css+html+table+submit;

/***
Inputs/interactions
***/

    $('#add-button').on('click', function(e){
      var new_row = add_new_row();
      $('#final-row').before(new_row);
    });

    $('table').on('click', function(e){
      var clicked_on = e.target.id;
      if(!clicked_on){
        if($(e.target).hasClass('cell clickable')){
          $(e.target).children('input').trigger('click');
        }
      }
    });

    $('input[type=checkbox]').on('click', function(e){
      var cell_id = this.id;
      var reg = cell_id.match(/check-([0-9]+)-([a-z]+)/);
      var checked1 = this.checked;
      if(reg){
        if(reg.length>1){
          var row_id = reg[1];
          var col1 = reg[2];
          if(trial.column_vars.indexOf(col1)!=-1 && dependencies[col1]){
            var col2_name = dependencies[col1];
            var checkbox2 = $('#check-'+row_id+'-'+col2_name);
            checkbox2.prop("checked", checked1);
          }
        }
      }
    });

    $('#submit').on('click', function(e){
      var responses = getResponses();
      endTrial(responses);
    });

/***
data handling + endTrial
***/

    function getResponses(){
      var responses = {};
      if(trial.add_new){
        $(':text').each(function(i,d){
          var name = $(d).val();
          var id_str = $(d).attr('id');
          var id = id_str.match('new-name-([0-9]+)')[1];
          responses[id] = {name: name, choices: []};
        });
      } else {
        trial.row_values.forEach(function(d,i){
          var row_id = d.id;
          var row_name = d.row_name;
          responses[row_id] = {name: row_name, choices: []};
        });
      }

      $(':checked').each(function(i,d){
        var id_str = $(d).attr('id');
        if(id_str != 'optout'){
          var data = id_str.match('check-([_a-zA-Z0-9]+)-([_a-zA-Z0-9]+)');
          var row_id = data[1];
          var col_id = data[2];
          responses[row_id].choices.push(col_id);
        } else {
          responses.optout = true;
        }

      });
      return responses;
    }

    function endTrial(responses){
      var end_time = Date.now();
      var rt = end_time - start_time;
      trial_data.rt = rt;
      trial_data.responses = JSON.stringify(responses);

      // kill any remaining setTimeout handlers/listeners
      jsPsych.pluginAPI.clearAllTimeouts();
      $('#add-button').off();
      $('table').off();
      $('#submit').off();

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
