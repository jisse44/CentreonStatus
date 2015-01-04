/**
 * utils.js
 *
 * Copyright (c)2015 Jorge Morgado. All rights reserved (MIT license).
 */

var debug = false;

/**
 * Log message to Javascript console
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
* @return {Element} Internationalization message corresponding to the string.
*/
function i18n(str) {
  return chrome.i18n.getMessage(str);
}

/**
 * Runs once, when the extension is installed for the first time
 * @return {undefined}
 */
function init(flag, page) {
  if (!window.localStorage.getItem(flag)) {
    chrome.tabs.create({ url: chrome.extension.getURL(page) });
    window.localStorage.setItem(flag, '1');
  }
}
init('CentreonStatusFlag', '/views/options.html');
