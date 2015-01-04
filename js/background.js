/**
 * background.js
 *
 * Copyright (c)2015 Jorge Morgado. All rights reserved (MIT license).
 */

var ISTAT_BG_VERSION = 0.1;

var bg = {
  version: ISTAT_BG_VERSION,
  sid: undefined,
  centreon: undefined,
  status: { state: false, error: undefined },
  intervalId: undefined,

  setBadge: function(state, text) {
    switch (state) {
      case 'ok':   state = [   0, 204,  51, 255 ]; break; // green
      case 'warn': state = [ 255, 165,   0, 255 ]; break; // yellow
      case 'crit': state = [ 255,  51,   0, 255 ]; break; // red
      case 'unrc': state = [ 191,  68, 178, 255 ]; break; // magenta
      // default is some kind of grey (neutral)
      default:     state = [ 233, 233, 233, 255 ];
    }

    chrome.browserAction.setBadgeText({ text: text });
    chrome.browserAction.setBadgeBackgroundColor({ color: state });
  },

  clearBadge: function() {
    chrome.browserAction.setBadgeText({ text: '' });
  },

  errorBadge: function() {
    bg.setBadge('crit', 'FAIL');
  },
  waitBadge: function() {
    bg.setBadge('warn', 'WAIT');
  },

  /**
   * Handle the login page trying to get the current the session ID (sid).
   */
  processLogin: function(htmlPage) {
    var ret = false;

    // Try to find the session id (sid) inside the returned page
    var found = htmlPage.match(/var sid = '(.*)';/i);

    // If found, should be at position 1
    if (1 < found.length) {
      bg.sid = found[1];
      ret = true;
      debug_log('Session id is ' + bg.sid);
    }

    return ret;
  },

  /**
   * Handle bad sessions (e.g., expired, invalid, etc.)
   */
  processBadSession: function() {
    bg.sid = undefined;

    return false;
  },

  /**
   * Process the XML status page.
   */
  processTopCounter: function(xml) {
    //debug_log(xml);

    try {
      // Use jquery to parse the XML page
      var xmlDoc = $.parseXML(xml),
      $xml = $(xmlDoc),
      $filetime = $xml.find('filetime'),
      // Total hosts and services
      $th = $xml.find('th'), // total host
      $ts = $xml.find('ts'), // total service
      // Service stats
      $o    = $xml.find('o'),    // service ok
      $w    = $xml.find('w'),    // service warning
      $c    = $xml.find('c'),    // service critical
      $un1  = $xml.find('un1'),  // service unknown
      $wU   = $xml.find('wU'),   // service warningU
      $cU   = $xml.find('cU'),   // service criticalU
      $un1U = $xml.find('un1U'), // service unknownU
      $p1   = $xml.find('p1'),   // service pending
      // Host stats
      $up  = $xml.find('up'),  // host up
      $d   = $xml.find('d'),   // host down
      $un2 = $xml.find('un2'), // host unreachable
      $p2  = $xml.find('p2'),  // host pending
      // Poller stats
      $pstt      = $xml.find('pstt'),      // statistic polling state
      $ltc       = $xml.find('ltc'),       // statistic latency
      $act       = $xml.find('act'),       // statistic activity
      $errorPstt = $xml.find('errorPstt'), // error polling state
      $errorLtc  = $xml.find('errorLtc'),  // error latency
      $errorAct  = $xml.find('errorAct');  // error activity

    } catch(e) {
      debug_log('XML parse exception: ' + e.message);
      return false;
    }

    // Build summary data
    bg.centreon = new Centreon($filetime.text());

    bg.centreon.pollerState(
      $pstt.text(),
      $ltc.text(),
      $act.text(),
      $errorPstt.text(),
      $errorLtc.text(),
      $errorAct.text()
    );
    bg.centreon.hostState(
      $th.text(),
      $up.text(),
      $p2.text(),
      $un2.text(),
      $d.text()
    );
    bg.centreon.serviceState(
      $ts.text(),
      $o.text(),
      $p1.text(),
      $un1.text(),
      $w.text(),
      $c.text(),
      $un1U.text(),
      $wU.text(),
      $cU.text()
    );
    bg.centreon.setStatus();

    return true;
  },

  /**
   * Reload and display new values.
   */
  refreshData: function(refreshStatus, sendResponse) {
    bg.status.state = false;
    bg.status.error = undefined;

    // URL from extension setup
    var url = window.localStorage.url;

    // Setup needs url
    if (url == '' || url == undefined) {
      debug_log('URL not defined');
      bg.status.error = 'need-setup';

    // URL is ok
    } else {
      // There is no session id, need to login
      if (bg.sid == undefined) {
        url += 'index.php';

        post_data = {
          useralias: window.localStorage.username,
          password: window.localStorage.password,
          submit: 'auto',
        };

      // Use active session to get data
      } else {
        url += 'include/monitoring/status/TopCounter/xml/' + window.localStorage.broker + '/statusCounter.php';

        post_data = {
          sid: bg.sid,
        };
      }

      debug_log('URL is ' + url);

      // Try to read data from Centreon
      $.ajax({
        global: false,
        type: 'POST',
        url: url,
        data: post_data,
        complete: function(res, status) {
          switch (res.status) {
            case 200:
              //debug_log(res.getAllResponseHeaders());
              //debug_log(res.responseText);

              if (status === 'success' || status === 'notmodified') {
                // Not yet logged in
                if (bg.sid == undefined) {
                  // We should be in a good state (=true) but there is still
                  // an "error" (!= undefined) because login is still on-going
                  bg.status.state = bg.processLogin(res.responseText);
                  bg.status.error = 'login-in-progress';

                // Check if current session is invalid (e.g., expired)
                } else if (/^Bad Session ID$/.test(res.responseText)) {
                  bg.status.state = bg.processBadSession();
                  bg.status.error = 'bad-session';

                // Logged in and with a valid session
                } else {
                  // If we got here, we should be in a good state
                  bg.status.state = bg.processTopCounter(res.responseText);
                }
              } else {
                bg.sid = undefined;
                bg.status.error = 'unhandled-state';
              }

              break;
            case 401:
              bg.status.error = 'bad-auth';
              break;
            case 404:
              bg.status.error = 'bad-url';
              break;
            default:
              bg.status.error = 'unknown-error';
            }

            // Set the badge counter
            if (bg.status.error != undefined) {
              (bg.status.state) ? bg.waitBadge() : bg.errorBadge();
            } else if (bg.centreon == undefined) {
              bg.clearBadge();
            } else {
              bg.setBadge(bg.centreon.status, bg.centreon.count.toString());
            }
          },
        error: function(res, status, error) {
          //debug_log(status + ': ' + res.responseText);
          bg.status.error = 'unknown-error';
          bg.errorBadge();
        }
      });
    }

    if (bg.sendResponse != undefined) {
      bg.sendResponse(bg.status);
    }
  },

  /**
   * Define the new refresh (reload) interval (in seconds).
   */
  setRefreshInterval: function() {
    // Clear old interval
    if (bg.intervalId != undefined)
      clearInterval(bg.intervalId);

    // Set refresh interval from options
    var refreshInterval = (window.localStorage.refresh == undefined) ? 20000 : window.localStorage.refresh * 1000;

    // Set refresh only if greater than 0
    if (refreshInterval > 0) {
      debug_log('Refresh interval set to ' + refreshInterval + ' miliseconds');
      bg.intervalId = setInterval(function() {
        bg.refreshData(bg.status);
      }, refreshInterval);
    }
  },

  /**
   * Request listener.
   */
  listener: function() {
    chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
      debug_log('Request type is ' + request.reqtype);

      switch (request.reqtype) {
        // Get stored data
        case 'get-data':
          var resp;

          // We need setup first
          if (bg.status.error != undefined || bg.centreon == undefined) {
            resp = bg.status;
          } else {
            resp = bg.centreon.toJSON();
            resp.state = bg.status.state;
            resp.error = bg.status.error;
          }

          sendResponse(resp);
          break;

        // Refresh data
        case 'refresh-data':
          bg.refreshData(bg.status, sendResponse);
          bg.setRefreshInterval();
          break;

        // Reload background page
        case 'reload-background':
          window.location.reload();
          break;

        // Unknown request
        default:
          sendResponse({ state: false, error: 'unknown-request' });
      }
    });
  }
};

bg.refreshData(bg.status);
bg.setRefreshInterval();
bg.listener();
