/**
 * popup.js
 *
 * Copyright (c)2015 Jorge Morgado - (c)2017 jisse44. All rights reserved (MIT license).
 */

function goto(url) {
  //debug_log('Opening URL ' + url);
  chrome.tabs.create({ url: url });

  if (typeof arguments[1] != 'undefined' && arguments[1] === true)
    window.close();
}

function refresh(request) {
  request.type = REQ_REFRESH_DATA;

  chrome.extension.sendRequest(request, function(response) {
    // Ugly hack: this will typically wait long enough for data to
    // be ready before display it. There might be a better way though.
    // TODO Make this value adjustable from the extension options.
    // TODO Eg, 400, 500, 600, etc depending on the distance to the server.
    setTimeout(function() { show(); }, 600);
  });
}

function submit(cmd) {
  // Get an array with the checked service IDs
  var checkedIds = $('input[name=select]:checked').map(function() {
    return encodeURI('select[' + this.id + ']=1');
  }).get();

  chrome.extension.sendRequest({
      type: REQ_ACTION_CMD,
      cmd: cmd,
      select: checkedIds.join('&'),
    }, function(response) {

      // Update status to let user know the command was sent
      var status = id('status');
      status.innerHTML = i18n('command_send');
      setTimeout(function() {
        status.innerHTML = '';

        // Reset the select option to the initial position
        $('#select-action').prop('selectedIndex', 0);
      }, 750);
  });
}

function show() {
  var bgColor = function(state) {
    return (state == 1) ? WARN : (state == 2) ? CRIT : 'normal';
  }

  var convertTimestamp = function(ts) {
    var d = new Date(ts * 1000); // Convert the timestamp to milliseconds
    return d.format(window.localStorage.dateformat || 'default');
  }

  var overview = function(response) {
    $('#outputOverview').html(
      // Poller states
        '<h3>' + i18n('poller_states') + '</h3><table>'
      + '<tr><td colspan="2" class="normal">' + i18n('last_update') + convertTimestamp(response.ts)
      + '</td></tr><tr><td class="' + bgColor(response.pollerState)   + '" width="1px"><img class="clock"/></td><td class="normal">'     + response.pollerErrState
      + '</td></tr><tr><td class="' + bgColor(response.pollerLatency) + '" width="1px"><img class="gear"/></td><td class="normal">'      + response.pollerErrLatency
      + '</td></tr><tr><td class="' + bgColor(response.pollerActive)  + '" width="1px"><img class="data_into"/></td><td class="normal">' + response.pollerErrActive
      + '</td></tr></table><br/>'
      // Host counters
      + '<h3>' + i18n('host_states') + '</h3><table>'
      + '<tr><td class="head">'  + i18n('hosts')
      + '</td><td class="head">' + i18n('up')
      + '</td><td class="head">' + i18n('down')
      + '</td><td class="head">' + i18n('unreachable')
      + '</td><td class="head">' + i18n('pending')
      + '</td></tr><tr>'
      + '<td class="total">'     + response.hostTotal
      + '</td><td class="ok">'   + response.hostUp
      + '</td><td class="crit">' + response.hostDown
      + '</td><td class="unrc">' + response.hostUnrc
      + '</td><td class="pend">' + response.hostPend
      + '</td></tr></table><br/>'
      // Service counters
      + '<h3>' + i18n('service_states') + '</h3><table>'
      + '<tr><td class="head">'  + i18n('services')
      + '</td><td class="head">' + i18n('ok')
      + '</td><td class="head">' + i18n('warning')
      + '</td><td class="head">' + i18n('critical')
      + '</td><td class="head">' + i18n('unknown')
      + '</td><td class="head">' + i18n('pending')
      + '</td></tr><tr>'
      + '<td class="total">'     + response.svcTotal
      + '</td><td class="ok">'   + response.svcOk
      + '</td><td class="warn">' + response.svcWarnu + '/' + response.svcWarn
      + '</td><td class="crit">' + response.svcCritu + '/' + response.svcCrit
      + '</td><td class="unkn">' + response.svcUnknu + '/' + response.svcUnkn
      + '</td><td class="pend">' + response.svcPend
      + '</td></tr></table><br/>'
      // Final status summary string
      + '<p id="' + response.status + '"><a class="external" style="text-decoration: none;" href="'
      + window.localStorage.url
      + '">' + response.message + '</a></p>');
  }

  var problems = function (response) {
    $('#outputProblems').show();

    var headerHost    = i18n('hosts');
    var headerService = i18n('services');
    var headerStatus  = i18n('status');

    // Remove all rows before adding new ones
    $("#tbodyProblems").empty();

    // Do we have at least one service problems events to process?
    var haveEvents = (response.svcList != undefined && response.svcList.length > 0);

    if (haveEvents) {
      var order = ' <img class="sort' + response.sortOrder + '"/>';

      switch (response.sortColumn) {
        case COL_SVCNAME:  headerService += order; break;
        case COL_SVCSTATE: headerStatus += order;  break;
        default:           headerHost += order;
      }

      var columnHeader = function(name, text, title) {
        return '<a class="head" title="' + title + '" id="' + name + '" href="#">' + text + '</a>';
      }

      // Set the headers for each column
      id('span-hostname').innerHTML = columnHeader('sort-hostname', headerHost,    i18n('sort_hostname'));
      id('span-svcname').innerHTML  = columnHeader('sort-svcname',  headerService, i18n('sort_svcname'));
      id('span-status').innerHTML   = columnHeader('sort-status',   headerStatus,  i18n('sort_status'));

      // And for each header, define the sort function
      $('#sort-hostname').on('click', function() { refresh({ sort: SORT_HOSTNAME }); });
      $('#sort-svcname').on('click', function() { refresh({ sort: SORT_SERVICE }); });
      $('#sort-status').on('click', function() { refresh({ sort: SORT_STATUS }); });

      // Remember the last host to keep the cell empty if still the same
      var hostlast = '';

      var classStatus = function(state) {
        return (state == 'WARNING'  ? WARN :
                state == 'CRITICAL' ? CRIT :
                state == 'UNKNOWN'  ? UNKN :
                state == 'PENDING'  ? PEND : OK);
      }

      for (var n = 0; n < response.svcList.length; n++) {
        var row = response.svcList[n];
        var h_col_span = '2', h_col_icon = '';
        var s_col_span = '2', s_col_icon = '';
        var hostname;

        // Keep track of the previous hostname (leave cell empty if the same)
        if (hostlast == row[L_HOSTNAME]) {
          hostname = '';
        } else {
          hostlast = row[L_HOSTNAME];
          // If host is down (== 1), highlight the hostname
          hostname = (row[L_HOSTSTATE] == DOWN ?
            '<span class="warntext">' + hostlast + '</span>' :
            hostlast);

            // If host notif, checks or ack are ON/OFF, show an icon for it
            var h_ack  = (row[L_HOSTACK]  == ON),
                h_achk = (row[L_HOSTACHK] == OFF),
                h_pchk = (row[L_HOSTPCHK] == ON);

            if (h_ack || h_achk || (h_achk && h_pchk)) {
              h_col_span = '1';
              h_col_icon = '<td class="iconcell">';

              if (h_ack)  h_col_icon += '<img class="worker"/>';
              if (h_achk) h_col_icon += '<img class="gears_' + (h_pchk ? 'pause' : 'stop') + '"/>'

              h_col_icon += '</td>';
            }
        }

        // If service notif, checks or ack are ON/OFF, show an icon for it
        var s_notif = (row[L_SVCNOTIF] == OFF),
            s_ack   = (row[L_SVCACK]   == ON),
            s_achk  = (row[L_SVCACHK]  == OFF),
            s_pchk  = (row[L_SVCPCHK]  == ON);

        if (s_notif || s_ack || s_achk || (s_achk && s_pchk)) {
          s_col_span = '1';
          s_col_icon = '<td class="iconcell">';

          if (s_ack)   s_col_icon += '<img class="worker"/>';
          if (s_achk)  s_col_icon += '<img class="gears_' + (s_pchk ? 'pause' : 'stop') + '"/>'
          if (s_notif) s_col_icon += '<img class="noloudspeaker"/>';

          s_col_icon += '</td>';
        }

        $('#tableProblems > tbody:last').append(
            '<tr class="' + row[L_CLASS] + '">'
          + '<td class="center"><input type="checkbox" id="' + row[L_HOSTNAME] + ';' + row[L_SVCNAME] + '" name="select"/></td>'
          + '<td class="left" colspan="' + h_col_span +'">' + hostname + '</td>'
          + h_col_icon
          + '<td class="left" colspan="' + s_col_span + '">' + row[L_SVCNAME] + '</td>'
          + s_col_icon
          + '<td class="' + classStatus(row[L_SVCSTATE]) + '">' + (row[L_DURATION].trim() == '' ? '...' : row[L_DURATION]) + '</td>'
          + '</tr>'
        );
      }
    } else {
      // No service problems found
      $('#tableProblems > tbody:last').append(
        '<tr class="list_one">'
        + '<td class="center" colspan="6">' + i18n('no_undl_services') + '</td>'
        + '</tr>'
      );
    }

    // Enable (disable) form elements if there's something (nothing) to process
    $('#check-all').prop('disabled', !haveEvents);
    $('#select-action').prop('disabled', !haveEvents);
  }

  chrome.extension.sendRequest({ type: REQ_GET_DATA }, function(response) {
    if (response.state == STATE_ALL_OK) {
      overview(response);
      problems(response);
    } else {
      //debug_log('Status from background: ' + response.state);
      switch (response.state) {
        case STATE_NEED_SETUP:        msg = i18n('need_setup');        break;
        case STATE_BAD_URL:           msg = i18n('bad_url');           break;
        case STATE_BAD_AUTH:          msg = i18n('bad_auth');          break;
        case STATE_BAD_SESSION:       msg = i18n('bad_session');       break;
        case STATE_LOGIN_IN_PROGRESS: msg = i18n('login_in_progress'); break;
        case STATE_DATA_NOT_READY:    msg = i18n('no_data');           break;
        case STATE_DATA_PARSE_FAIL:   msg = i18n('parser_failed');     break;
        default:                      msg = i18n('unknown_error');
      }

      $('#outputOverview').html(msg);
      $('#outputProblems').hide();
    }

    // Handle links
    $('a.centreon-link').on('click', function() { goto($(this).data('href')); });
    $('a.external').on('click', function() { goto(this.href); });
  });
}

$(document).ready(function() {
  // Load locale strings
  id('span-overview').innerHTML = i18n('overview');
  id('span-problems').innerHTML = i18n('problems');
  id('span-about').innerHTML    = i18n('about');
  id('refresh-data').title      = i18n('refresh');
  id('h-title').innerText       = APP_NAME;
  id('a-options').innerHTML     = i18n('options');
  id('p-about').innerHTML       = i18n('aboutapp', APP_NAME);
  id('p-license').innerHTML     = i18n('license');
  id('p-author').innerHTML      =
      APP_COPYRIGHT
    + i18n('author', extlink(APP_MAIL, APP_AUTHOR))
    + i18n('rate', extlink(APP_URL, APP_STORE));
  id('p-devel').innerHTML       = i18n('devel', extlink(APP_DEVEL, APP_NAME));
  id('host-search').placeholder = i18n('host_name');
  id('srv-search').placeholder  = i18n('service_name');

  // Refresh button
  $('#refresh-data').on('click', function() {
    refresh({ resetTimer: true });
  });

  // Add click event to check/uncheck all service problems table rows
  $('#check-all').on('click', function(e) {
    var table = $(e.target).closest('table');
    $('td input:checkbox', table).prop('checked', this.checked);
  });

  // Build the select box for the status filter
  $([
    { value: '',          text: '' },
    { value: '_warning',  text: i18n('warning') },
    { value: '_critical', text: i18n('critical') },
    { value: '_unknown',  text: i18n('unknown') },
    { value: '_pending',  text: i18n('pending') },
  ]).each(function() {
    $('#select-status').append($("<option>")
      .attr('value', this.value)
      .text(this.text));
  });

  // Get the current filter criteria and set the values on each for object
  chrome.extension.sendRequest({ type: REQ_GET_FILTER }, function(response) {
    $('#host-search').val(response.searchHost);
    $('#srv-search').val(response.searchService);
    $('#select-status option[value="' + response.searchStatus + '"]').prop('selected', true);
  });

  // Filter services table when hostname, service name or status changes
  $('#host-search').on('keyup', function() {
    refresh({ searchHost: this.value.trim() });
  });
  $('#srv-search').on('keyup', function() {
    refresh({ searchService: this.value.trim() });
  });
  $('#select-status').on('change', function() {
    refresh({ searchStatus: this.value });
  });

  // Build the select box for the action commands
  $([
    { value: CMD_NO_ACTION,    text: i18n('action_more') },
    { value: CMD_CHECK,        text: i18n('action_svc_check') },
    { value: CMD_CHECK_FORCE,  text: i18n('action_svc_check_force') },
    { value: CMD_SVC_ACK,      text: i18n('action_svc_ack') },
    { value: CMD_SVC_UNACK,    text: i18n('action_svc_unack') },
    { value: CMD_SVC_NOTIF_E,  text: i18n('action_svc_notif_e') },
    { value: CMD_SVC_NOTIF_D,  text: i18n('action_svc_notif_d') },
    { value: CMD_SVC_CHECK_E,  text: i18n('action_svc_check_e') },
    { value: CMD_SVC_CHECK_D,  text: i18n('action_svc_check_d') },
    { value: CMD_HOST_ACK,     text: i18n('action_host_ack') },
    { value: CMD_HOST_UNACK,   text: i18n('action_host_unack') },
    { value: CMD_HOST_NOTIF_E, text: i18n('action_host_notif_e') },
    { value: CMD_HOST_NOTIF_D, text: i18n('action_host_notif_d') },
    { value: CMD_HOST_CHECK_E, text: i18n('action_host_check_e') },
    { value: CMD_HOST_CHECK_D, text: i18n('action_host_check_d') },
  ]).each(function() {
    $('#select-action').append($("<option>")
      .attr('value', this.value)
      .text(this.text));
  });

  // Submit action command for the selected service(s)
  $('#select-action').on('change', function() {
    submit(this.value);
  });

  // Show tabs
  $('#tabs').tabs();

  // Draw screen
  show();

  // Delay load of images (in long web pages)
  $('img.lazy').lazyload();
});
