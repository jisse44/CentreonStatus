/**
 * utils.js
 *
 * Copyright (c)2015 Jorge Morgado - (c)2017 jisse44. All rights reserved (MIT license).
 */

// Useful extension constants
const APP_NAME      = i18n('appName');
const APP_COPYRIGHT = '&copy;2014-2017 ';
const APP_MAIL      = 'mailto:jc85@free.fr';
const APP_AUTHOR    = 'jisse44';
const APP_DEVEL     = 'https://github.com/jisse44/CentreonStatus';
const APP_STORE     = 'Firefox Add-Ons';
const APP_URL       = 'https://addons.mozilla.org/fr/firefox/user/jisse44/';

var debug = false;

// By default, refresh every 20 seconds
const REFRESH_INTERVAL = 20;

// By defautl, limit display to 20 records
const LIMIT_DEFAULT = 20;

// Requests to the background page
const REQ_GET_DATA      = 0;
const REQ_REFRESH_DATA  = 1;
const REQ_ACTION_CMD    = 2;
const REQ_GET_FILTER    = 3;

// Sort fields
const SORT_DEFAULT  = 0;
const SORT_HOSTNAME = 1;
const SORT_SERVICE  = 2;
const SORT_STATUS   = 3;

// Extension status
const STATE_NEED_SETUP        =  0;
const STATE_BAD_URL           =  1;
const STATE_BAD_AUTH          =  2;
const STATE_BAD_SESSION       =  3;
const STATE_LOGIN_IN_PROGRESS =  4;
const STATE_DATA_NOT_READY    =  5;
const STATE_DATA_PARSE_FAIL   =  6;
const STATE_ALL_OK            = 90;
const STATE_UNKNOWN_ERROR     = 99;

// Columns for host/services table
const COL_HOSTNAME = 'host_name';
const COL_SVCNAME  = 'service_description';
const COL_SVCSTATE = 'current_state';

// Command actions for hosts and services
const CMD_NO_ACTION    =  0; // More actions... (default = no action)
const CMD_CHECK        =  3; // Schedule immediate check
const CMD_CHECK_FORCE  =  4; // Schedule immediate check (forced)
const CMD_SVC_ACK      = 70; // Service acknowledge
const CMD_SVC_UNACK    = 71; // Service disacknowledge
const CMD_HOST_ACK     = 72; // Host aknowledge
const CMD_HOST_UNACK   = 73; // Host disaknowledge
const CMD_SVC_NOTIF_E  = 80; // Service enable notification
const CMD_SVC_NOTIF_D  = 81; // Service disable notification
const CMD_HOST_NOTIF_E = 82; // Host enable notification
const CMD_HOST_NOTIF_D = 83; // Host disable notification
const CMD_SVC_CHECK_E  = 90; // Service enable check
const CMD_SVC_CHECK_D  = 91; // Service disable check
const CMD_HOST_CHECK_E = 92; // Host enable check
const CMD_HOST_CHECK_D = 93; // Host disable check

// Services list table
const L_CLASS     =  0;
const L_HOSTNAME  =  1;
const L_HOSTSTATE =  2;
const L_SVCNAME   =  3;
const L_SVCSTATE  =  4;
const L_DURATION  =  5;
const L_SVCNOTIF  =  6;
const L_SVCACK    =  7;
const L_SVCACHK   =  8;
const L_SVCPCHK   =  9;
const L_HOSTACK   = 10;
const L_HOSTACHK  = 11;
const L_HOSTPCHK  = 12;

// Status abbreviated
const OK   = 'ok';
const WARN = 'warn';
const CRIT = 'crit';
const UNRC = 'unrc';
const UNKN = 'unkn';
const PEND = 'pend';

// Host status codes
const UP   = 0;
const DOWN = 1;

// On/Off flags
const ON = 1;
const OFF = 0;

/**
 * Return an external link (in HTML).
 * @param {string} url URL to open on link click.
 * @param {string} text User friendly text to display for the link.
 * @return {string} The HTML code for the external link.
 */
function extlink(url, text) {
  return '<a class="external" href="' + url + '">' + text + '</a>';
}

/**
 * Log message to Javascript console.
 * @param {string} msg Message to log to the console.
 * @return {undefined}
 */
function debug_log(msg) {
  if (debug) console.log(msg);
}

/**
 * Alias for document.getElementById.
 * @param {String} elementId Element id of the HTML element to be fetched.
 * @return {Element} Element corresponding to the element id.
 */
function id(elementId) {
  return document.getElementById(elementId);
}

/**
* Alias for chrome.i18n.getMessage.
* @param {String} str Locale string to be fetched.
* @param {String} placeholder An optional argument for the locale placeholder.
* @return {Element} Internationalization message corresponding to the string.
*/
function i18n(str, placeholder) {
  return chrome.i18n.getMessage(str, placeholder);
}

/**
 * Runs once, when the extension is installed for the first time.
 * @param {String} flag
 * @param {String} page
 * @return {undefined}
 */
function init(flag, page) {
  if (!window.localStorage.getItem(flag)) {
    chrome.tabs.create({ url: chrome.extension.getURL(page) });
    window.localStorage.setItem(flag, '1');
  }
}
init('CentreonStatusFlag', '/views/options.html');
