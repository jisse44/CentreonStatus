/**
 * popup.js
 *
 * Copyright (c)2015 Jorge Morgado. All rights reserved (MIT license).
 */

function goto(url) {
  debug_log('Opening URL ' + url);
  chrome.tabs.create({ url: url });

  if (typeof arguments[1] != 'undefined' && arguments[1] === true)
    window.close();
}

function refresh() {
  chrome.extension.sendRequest({ reqtype: 'refresh-data' }, function(response) {
    show();
  });
}

function show() {
  var bgColor = function(state) {
    return (state == 1) ? 'warn' : (state == 2) ? 'crit' : 'normal';
  }

  var convertTimestamp = function(ts) {
    var d = new Date(ts * 1000); // Convert the timestamp to milliseconds
    return d.format(window.localStorage.dateformat || 'default');
  }

  chrome.extension.sendRequest({ reqtype: 'get-data' }, function(response) {
    // All is good when state is 'true' and error is not 'undefined'
    if (response.state && !response.error) {
      var out =
      // Poller states
          '<div id="states"><h3>' + i18n('poller_states') + '</h3><table>'
        + '<tr><td colspan="2" class="normal">' + i18n('last_update') + convertTimestamp(response.ts)
        + '</td></tr><tr><td class="' + bgColor(response.poller_state)   + '" width="1px"><img src="/images/clock.gif"/></td><td class="normal">'     + response.poller_errstate
        + '</td></tr><tr><td class="' + bgColor(response.poller_latency) + '" width="1px"><img src="/images/gear.gif"/></td><td class="normal">'      + response.poller_errlatency
        + '</td></tr><tr><td class="' + bgColor(response.poller_active)  + '" width="1px"><img src="/images/data_into.gif"/></td><td class="normal">' + response.poller_erractive
        + '</td></tr></table></div><br/>'
      // Host counters
        + '<div id="totals"><h3>'  + i18n('host_states') + '</h3><table>'
        + '<tr><td class="head">'  + i18n('hosts')
        + '</td><td class="head">' + i18n('up')
        + '</td><td class="head">' + i18n('down')
        + '</td><td class="head">' + i18n('unreachable')
        + '</td><td class="head">' + i18n('pending')
        + '</td></tr><tr>'
        + '<td class="normal">'    + response.host_total
        + '</td><td class="ok">'   + response.host_up
        + '</td><td class="crit">' + response.host_down
        + '</td><td class="unrc">' + response.host_unrc
        + '</td><td class="pend">' + response.host_pend
        + '</td></tr></table></div><br/>'
      // Service counters
        + '<div id="totals"><h3>'  + i18n('service_states') + '</h3><table>'
        + '<tr><td class="head">'  + i18n('services')
        + '</td><td class="head">' + i18n('ok')
        + '</td><td class="head">' + i18n('warning')
        + '</td><td class="head">' + i18n('critical')
        + '</td><td class="head">' + i18n('unknown')
        + '</td><td class="head">' + i18n('pending')
        + '</td></tr><tr>'
        + '<td class="normal">'    + response.svc_total
        + '</td><td class="ok">'   + response.svc_ok
        + '</td><td class="warn">' + response.svc_warnu + '/' + response.svc_warn
        + '</td><td class="crit">' + response.svc_critu + '/' + response.svc_crit
        + '</td><td class="unkn">' + response.svc_unknu + '/' + response.svc_unkn
        + '</td><td class="pend">' + response.svc_pend
        + '</td></tr></table></div><br/>'
      // Final status summary string
        + '<p id="' + response.status + '">' + response.message + '</p>';

      $('#output').html(out);
      //$('#outputUnhandledProblems').html('');
      //$('#outputAllProblems').html('');
      //$('#outputAllServices').html('');
    } else {
      debug_log('Received false response from background: ' + response.error);

      if (response.error == 'need-setup')
        msg = i18n('need_setup');
      else if (response.error == 'bad-auth')
        msg = i18n('bad_auth');
      else if (response.error == 'bad-url')
        msg = i18n('bad_url');
      else if (response.error == 'login-in-progress')
        msg = i18n('login_in_progress');
      else if (response.error == 'bad-session')
        msg = i18n('bad_session');
      else if (response.error = 'unknown-error')
        msg = i18n('unknown_error');
      else
        msg = i18n('no_data');

      $('#output').html(msg);
      //$('#outputUnhandledProblems').html(msg);
      //$('#outputAllProblems').html(msg);
      //$('#outputAllServices').html(msg);
    }

    // Handle links
    $('a.centreon-link').click(function () { goto($(this).data('href')); })
  });
}

$(document).ready(function() {
  // Load locale strings
  id('span-overview').innerHTML = i18n('overview');
  id('span-about').innerHTML    = i18n('about');
  id('h-title').innerText       = i18n('appname');
  id('a-options').innerHTML     = i18n('options');
  id('p-about').innerHTML       = i18n('aboutapp');
  id('p-license').innerHTML     = i18n('license');
  id('p-author').innerHTML      = i18n('author');

  // Show tabs
  $('#tabs').tabs();

  $('a.ext').click(function() { goto(this.href); });

  // Draw screen
  show();

  // Refresh button
  $('#refresh-data').click(function() { refresh(); });

  // Delay load of images (in long web pages)
  $('img.lazy').lazyload();
});
