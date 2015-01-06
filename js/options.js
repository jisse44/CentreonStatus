/**
 * options.js
 *
 * Saves/restores options to/from localStorage.
 *
 * Copyright (c)2015 Jorge Morgado. All rights reserved (MIT license).
 */

// By default, refresh every 20 seconds
const REFRESH_INTERVAL = 20;

// Possible pre-defined date formats
const DATE_FORMAT = {
  'default':        0,
  'shortDate':      1,
  'mediumDate':     2,
  'longDate':       3,
  'fullDate':       4,
  'shortTime':      5,
  'mediumTime':     6,
  'longTime':       7,
  'isoDate':        8,
  'isoTime':        9,
  'isoDateTime':    10,
  'isoUtcDateTime': 11,
};

function save_options() {
  if (!window.localStorage) {
    alert('Error local storage is unavailable.');
    window.close();
  } else {
    window.localStorage.username = id('username').value;
    if (id('password').value != '')
      window.localStorage.password = id('password').value;

    // Append '/' to URL if not given
    var url = id('url').value;
    if (url.substr(url.length - 1 ) != '/')
      url += '/';
    window.localStorage.url = url;

    window.localStorage.refresh = id('refresh').value;

    window.localStorage.broker = id('broker').value;

    if (id('datecustom').checked) {
      window.localStorage.datetype = 'datecustom';
      window.localStorage.dateformat = id('input-dateformat').value;
    } else {
      window.localStorage.datetype = 'datedefine';
      window.localStorage.dateformat = id('select-dateformat').value;
    }

    window.localStorage.addHandled = (id("add-handled").checked === true);

    // Update status to let user know the options were saved
    var status = id('status');
    status.innerHTML = i18n('options_save');
    setTimeout(function() {
      status.innerHTML = '';
    }, 750);

    // Refresh data
    chrome.extension.sendRequest({ reqtype: 'refresh-data' });
  }
}

/**
 * Restores state to saved values from localStorage.
 */
function restore_options() {
  if (window.localStorage.username != undefined)
    id('username').value = window.localStorage.username;

  if (window.localStorage.url != undefined)
    id('url').value = window.localStorage.url;

  id('refresh').value = (window.localStorage.refresh != undefined) ? window.localStorage.refresh : REFRESH_INTERVAL;

  id('broker').selectedIndex = (window.localStorage.broker == 'ndo') ? 1 : 0;

  if (window.localStorage.datetype == 'datecustom') {
    id('datedefine').checked = false;
    id('datecustom').checked = true;
    id('select-dateformat').disabled = true;

    if (window.localStorage.dateformat != undefined)
      id('input-dateformat').value = window.localStorage.dateformat;
  } else {
    id('datedefine').checked = true;
    id('datecustom').checked = false;
    id('input-dateformat').disabled = true;

    if (window.localStorage.dateformat != undefined)
      id('select-dateformat').selectedIndex = DATE_FORMAT[window.localStorage.dateformat] || 0;
  }

  id("add-handled").checked = (window.localStorage.addHandled === "true");
}

/**
 * Changes the refresh label to the corresponding value (in seconds).
 */
function update_refresh() {
  $('#refrsecs').html($('#refresh').val() + ' seconds');
}

$(document).ready(function() {
  // Load locale strings
  id('title-options').innerHTML      = i18n('appname') + ' &dash; ' + i18n('options');
  id('h-options').innerHTML          = i18n('appname') + ' &dash; ' + i18n('options');
  id('span-main').innerHTML          = i18n('main');
  id('label-username').innerHTML     = i18n('username');
  id('label-password').innerHTML     = i18n('password');
  id('cite-password').innerHTML      = i18n('password_remark');
  id('label-url').innerHTML          = i18n('centreon_url');
  id('label-refresh').innerHTML      = i18n('refresh');
  id('label-broker').innerHTML       = i18n('broker');
  id('opt-broker').innerHTML         = i18n("opt_broker");
  id('opt-ndo').innerHTML            = i18n("opt_ndo");
  id('label-dateformat').innerHTML   = i18n('date_format');
  id('opt-defaultdate').innerHTML    = i18n('default')            + " (ddd mmm dd yyyy HH:MM:ss)";
  id('opt-shortdate').innerHTML      = i18n('opt_shortdate')      + " (m/d/yy)";
  id('opt-mediumdate').innerHTML     = i18n('opt_mediumdate')     + " (mmm d, yyyy)";
  id('opt-longdate').innerHTML       = i18n('opt_longdate')       + " (mmmm d, yyyy)";
  id('opt-fulldate').innerHTML       = i18n('opt_fulldate')       + " (dddd, mmmm d, yyyy)";
  id('opt-shorttime').innerHTML      = i18n('opt_shorttime')      + " (h:MM TT)";
  id('opt-mediumtime').innerHTML     = i18n('opt_mediumtime')     + " (h:MM:ss TT)";
  id('opt-longtime').innerHTML       = i18n('opt_longtime')       + " (h:MM:ss TT Z)";
  id('opt-isodate').innerHTML        = i18n('opt_isodate')        + " (yyyy-mm-dd)";
  id('opt-isotime').innerHTML        = i18n('opt_isotime')        + " (HH:MM:ss)";
  id('opt-isodatetime').innerHTML    = i18n('opt_isodatetime')    + " (yyyy-mm-dd'T'HH:MM:ss)";
  id('opt-isoutcdatetime').innerHTML = i18n('opt_isoutcdatetime') + " (UTC:yyyy-mm-dd'T'HH:MM:ss'Z')";
  id('cite-custom').innerHTML        = i18n('custom');
  id('label-add-handled').innerHTML  = i18n('add_handled');
  id('cite-add-handled').innerHTML   = i18n('add_handled_remark');
  id('button-save').innerHTML        = i18n('save');
  id('h-footer').innerHTML           = i18n('appTitle');
  id('p-contribute').innerHTML       = i18n('contribute');
  id('p-rate').innerHTML             = i18n('rate');

  // Show tabs
  $('#tabs').tabs();
  restore_options();
  update_refresh();

  $('#button-save').click(save_options);
  $('#refresh').on('change', update_refresh);

  // Enable/disable the pre-defined and custom date format fields
  $('input[name=dateformat]').on('click', function() {
    var enable = (this.id == 'datedefine');

    $('#select-dateformat').prop('disabled', !enable)
    $('#input-dateformat').prop('disabled', enable)
  });

  // Delay load of images (in long web pages)
  $('img.lazy').lazyload();
});

//console.log(window.localStorage);
