/**
 * background.js
 *
 * Copyright (c)2015 Jorge Morgado. All rights reserved (MIT license).
 */

const ISTAT_BG_VERSION = 0.1;

const HTTP_ACTION = 0;
const HTTP_METHOD = 1;
const HTTP_URL    = 2;
const HTTP_DATA   = 3;

const SORT_ASCENDING  = 'ASC';
const SORT_DESCENDING = 'DESC';

var bg = {
  version:    ISTAT_BG_VERSION,
  intervalId: undefined,
  sid:        undefined,
  centreon:   new Centreon(),
  state:      STATE_NEED_SETUP,
  sortColumn: COL_HOSTNAME,
  sortOrder:  SORT_ASCENDING,
  searchHost:    '',
  searchService: '',
  searchStatus:  '',

  setBadge: function(state, text) {
    switch (state) {
      case OK:   color = [   0, 204,  51, 255 ]; break; // green
      case WARN: color = [ 255, 165,   0, 255 ]; break; // orange
      case CRIT: color = [ 255,  51,   0, 255 ]; break; // red
      case UNRC: color = [ 191,  68, 178, 255 ]; break; // turquoise
      // default is some kind of grey (neutral)
      default:   color = [ 233, 233, 233, 255 ];
    }

    chrome.browserAction.setBadgeText({ text: text });
    chrome.browserAction.setBadgeBackgroundColor({ color: color });
  },

  clearBadge: function() {
    chrome.browserAction.setBadgeText({ text: '' });
  },
  errorBadge: function() {
    bg.setBadge(CRIT, i18n('fail'));
  },
  waitBadge: function() {
    bg.setBadge(WARN, i18n('wait'));
  },

  /**
   * Handle the login page trying to get the current the session ID (sid).
   */
  processLogin: function(htmlPage) {
    // Try to find the session id (sid) inside the returned page
    var found = htmlPage.match(/var sid = '(.*)';/i);

    // If found, should be at position 1
    if (found != undefined && 1 < found.length) {
      bg.sid = found[1];
      debug_log('Session id is ' + bg.sid);
      return STATE_LOGIN_IN_PROGRESS;
    } else {
      return STATE_UNKNOWN_ERROR;
    }
  },

  /**
   * Handle bad sessions (e.g., expired, invalid, etc.)
   */
  processBadSession: function() {
    bg.sid = undefined;

    return STATE_BAD_SESSION;
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
      return STATE_DATA_PARSE_FAIL;
    }

    // Build summary data
    bg.centreon.setTimestamp($filetime.text());

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
    bg.centreon.setStatus((window.localStorage.addHandled === "true"));

    return STATE_ALL_OK;
  },

  processServices: function(xml) {
    //debug_log(xml);
    try {
      // Use jquery to parse the XML page
      var xmlDoc = $.parseXML(xml),
      $xml = $(xmlDoc),
      //$numrows = $xml.find('numrows'),
      // List of services
      $list = $xml.find('l');

    } catch(e) {
      debug_log('XML parse exception: ' + e.message);
      return STATE_DATA_PARSE_FAIL;
    }

    // Empty the services table before adding new items
    bg.centreon.emptyServices();

    $.each($list, function(i, item) {
      var item_class = $(this).attr('class');

      var //$o   = $(this).find('o'),       // row counter
      //$hc      = $(this).find('hc'),      // host current state
      //$hnl     = $(this).find('hnl'),     // host name long
      $hn      = $(this).find('hn'),      // host name
      //$hnu     = $(this).find('hnu'),     // host notes URL
      //$hau     = $(this).find('hau'),     // host action URL
      //$hnn     = $(this).find('hnn'),     // host notes
      //$hico    = $(this).find('hico'),    // host icon image
      //$hip     = $(this).find('hip'),     // host IP address
      //$hdtm    = $(this).find('hdtm'),    // host scheduled downtime depth
      //$hdtmXml = $(this).find('hdtmXml'), // makeXMLForDowntime.php
      //$hdtmXsl = $(this).find('hdtmXsl'), // popupForDowntime.xsl
      //$hackXml = $(this).find('hackXml'), // makeXMLForAck.php
      //$hackXsl = $(this).find('hackXsl'), // popupForAck.xsl
      //$hid     = $(this).find('hid'),     // host object ID
      //$ppd     = $(this).find('ppd'),     // service process performance data
      $hs      = $(this).find('hs'),      // host current status
      $sd      = $(this).find('sd'),      // service display name
      //$sico    = $(this).find('sico'),    // service icon image
      //$sdl     = $(this).find('sdl'),     // service description
      //$svc_id  = $(this).find('svc_id'),  // service object id
      //$sc      = $(this).find('sc'),      // service current status color
      $cs      = $(this).find('cs'),      // service current status
      //$po      = $(this).find('po'),      // service output
      //$ca      = $(this).find('ca'),      // service current check attempt / service max check attempts
      //$hci     = $(this).find('hci'),     // has criticality (1=true; 0=false)
      //$ci      = $(this).find('ci'),      // criticality icon
      //$cih     = $(this).find('cih'),     // criticality name
      $ne      = $(this).find('ne'),      // service notifications enabled
      //$pa      = $(this).find('pa'),      // service problem has been acknowledged
      //$pc      = $(this).find('pc'),      // service passive checks enabled
      $ac      = $(this).find('ac'),      // service active checks enabled
      //$eh      = $(this).find('eh'),      // service event handler enabled
      //$is      = $(this).find('is'),      // service is flapping
      //$dtm     = $(this).find('dtm'),     // service scheduled downtime depth
      //$dtmXml  = $(this).find('dtmXml'),  // makeXMLForDowntime.php
      //$dtmXsl  = $(this).find('dtmXsl'),  // popupForDowntime.xsl
      //$ackXml  = $(this).find('ackXml'),  // makeXMLForAck.php
      //$ackXsl  = $(this).find('ackXsl'),  // popupForAck.xsl
      //$snn     = $(this).find('snn'),     // service notes
      //$snu     = $(this).find('snu'),     // service notes URL
      //$sau     = $(this).find('sau'),     // service action URL
      //$sn      = $(this).find('sn'),      // service notes
      //$fd      = $(this).find('fd'),      // service flap detection enabled
      //$ha      = $(this).find('ha'),      // host problem has been acknowledged
      $hae     = $(this).find('hae'),     // host active checks enabled
      //$hpe     = $(this).find('hpe'),     // host passive checks enabled
      //$nc      = $(this).find('nc'),      // service next check
      //$lc      = $(this).find('lc'),      // service last check
      $d       = $(this).find('d');       // duration
      //$rd      = $(this).find('rd'),      // last hard state change
      //$last_hard_state_change = $(this).find('last_hard_state_change'), // hard_duration
      //$svc_index = $(this).find('svc_index'); // index?

      bg.centreon.addService([
        item_class,
        $hn.text(),
        $hs.text(),
        $sd.text(),
        $cs.text(),
        $d.text(),
        $ne.text(),
        $ac.text(),
        $hae.text()
      ]);
    });

    return STATE_ALL_OK;
  },

  counterToString: function(counter) {
    // On "counter overflow", simply show 99+
    return counter > 99 ? '99+' : counter.toString();
  },

  makeRequest: function(request) {
    //debug_log('URL is ' + request[HTTP_URL]);

    // Try to read data from Centreon
    $.ajax({
      global: false,
      type:   request[HTTP_METHOD],
      url:    request[HTTP_URL],
      data:   request[HTTP_DATA],
      complete: function(response, status) {
        switch (response.status) {
          case 200:
            //debug_log(response.getAllResponseHeaders());
            //debug_log(response.responseText);
            if (status === 'success' || status === 'notmodified') {
              // Got a valid page but we are not yet logged in
              if (bg.sid == undefined) {
                bg.state = bg.processLogin(response.responseText);

              // Check if current session is invalid (e.g., expired)
              } else if (/^Bad Session ID$/.test(response.responseText)) {
                bg.state = bg.processBadSession();

              // Logged in and with a valid session
              } else if (request[HTTP_ACTION] == 'counters') {
                bg.state = bg.processTopCounter(response.responseText);
              } else if (request[HTTP_ACTION] == 'services') {
                bg.state = bg.processServices(response.responseText);
              //} else if (request[HTTP_ACTION] == 'command') {
              }
            } else {
              bg.state = bg.processBadSession();
            }

            break;

          case 401:
            bg.state = STATE_BAD_AUTH;
            break;
          case 404:
            bg.state = STATE_BAD_URL;
            break;
          default:
            bg.state = STATE_UNKNOWN_ERROR;
        }

        // Set the badge counter
        if (bg.state == STATE_ALL_OK) {
          if (bg.centreon.status == OK) {
            bg.clearBadge();
          } else {
            bg.setBadge(bg.centreon.status, bg.counterToString(bg.centreon.count));
          }
        } else if (bg.state == STATE_LOGIN_IN_PROGRESS) {
          bg.waitBadge();
        } else {
          bg.errorBadge();
        }
      },
      error: function(response, status, error) {
        //debug_log(status + ': ' + response.responseText);
        bg.state = STATE_UNKNOWN_ERROR;
        bg.errorBadge();
      }
    });
  },

  sendCommand: function(cmd, select) {
    // URL from extension setup
    var url = window.localStorage.url;

    // Setup needs URL
    if (url == undefined || url == '') {
      //debug_log('URL not defined');
      bg.state = STATE_NEED_SETUP;

    // URL is ok
    } else {
      var params;

      switch (cmd) {
        case CMD_HOST_ACK:
        case CMD_SVC_ACK:
          url += 'include/monitoring/external_cmd/cmdPopup.php';
          params = 'sid=' + bg.sid
            + '&cmd=' + cmd
            + '&comment=' + 'Acknowledged by ' + window.localStorage.username
            + '&sticky=1'
            + '&persistent=1'
            + '&notify=0'
            + '&ackhostservice=' + (cmd == CMD_HOST_ACK ? 1 : 0)
            + '&force_check=1'
            + '&author=' + window.localStorage.username
            + '&' + select;
          break;

      default:
          url += 'main.php';
          params = 'sid=' + bg.sid + '&cmd=' + cmd + '&p=20201&' + select;
      }

      bg.makeRequest([
        'command',
        'GET',
        url,
        params,
      ]);
    }
  },

  /**
   * Reload and display new values.
   */
  refreshData: function() {
    // URL from extension setup
    var url = window.localStorage.url;
    var broker = window.localStorage.broker;
    var a_req = [];

    // Setup needs URL
    if (url == undefined || url == '') {
      //debug_log('URL not defined');
      bg.state = STATE_NEED_SETUP;

    // URL is ok
    } else {
      // There is no session id, need to login
      if (bg.sid == undefined) {
        a_req.push([
          'login',
          'POST',
          url + 'index.php',
          {
            useralias: window.localStorage.username,
            password: window.localStorage.password,
            submit: 'auto',
          },
        ]);

      // Use active session to get data
      } else {
        a_req.push([
          'counters',
          'POST',
          url + 'include/monitoring/status/TopCounter/xml/' + broker + '/statusCounter.php',
          {
            sid: bg.sid,
          },
        ]);

        a_req.push([
          'services',
          'GET',
          url + 'include/monitoring/status/Services/xml/' + broker + '/serviceXML.php',
          {
            sid: bg.sid,
            o: 'svc_unhandled' + bg.searchStatus,
            limit: window.localStorage.limit || LIMIT_DEFAULT,
            sort_type: bg.sortColumn,
            order: bg.sortOrder,
            search_host: (bg.searchHost.length > 2 ? bg.searchHost : ''),
            search: (bg.searchService.length > 2 ? bg.searchService : ''),
          },
        ]);
      }

      while (a_req.length > 0) {
        bg.makeRequest(a_req.shift());
      }
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
    var refreshInterval = (window.localStorage.refresh || REFRESH_INTERVAL) * 1000;

    // Set refresh only if greater than 0
    if (refreshInterval > 0) {
      //debug_log('Refresh interval set to ' + refreshInterval + ' miliseconds');
      bg.intervalId = setInterval(function() {
        bg.refreshData();
      }, refreshInterval);
    }
  },

  /**
   * Request listener.
   */
  listener: function() {
    chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
      //debug_log('Request type is ' + request.type);

      var invertSortOrder = function() {
        return (bg.sortOrder == SORT_ASCENDING ? SORT_DESCENDING : SORT_ASCENDING);
      }

      var response = {};

      // TODO Provide an arg to refreshData which only refreshes the active tab.
      // TODO Must care for tab switches which might be tricky on all cases.

      // FIXME When a we enter a filter for host, service or status and
      // FIXME then close the pop-up. When we re-open the pop-up the
      // FIXME filter is lost but the values are still the ones filtered.

      switch (request.type) {
        // Get stored data
        case REQ_GET_DATA:
          //debug_log('Sort by ' + bg.sortColumn + ' (' + bg.sortOrder + ')');
          response = bg.centreon.toJSON();
          response.sortColumn = bg.sortColumn;
          response.sortOrder = bg.sortOrder;
          break;

        // Refresh data
        case REQ_REFRESH_DATA:
          // If refresh is to sort
          if (request.sort != undefined)
            switch (request.sort) {
              case SORT_SERVICE:
                if (bg.sortColumn == COL_SVCNAME)
                  bg.sortOrder = invertSortOrder();
                else
                  bg.sortColumn = COL_SVCNAME;
                break;
              case SORT_STATUS:
                if (bg.sortColumn == COL_SVCSTATE)
                  bg.sortOrder = invertSortOrder();
                else
                  bg.sortColumn = COL_SVCSTATE;
                break;
              default:
                if (bg.sortColumn == COL_HOSTNAME)
                  bg.sortOrder = invertSortOrder();
                else
                  bg.sortColumn = COL_HOSTNAME;
            }
          // If refresh is to filter by host, service or status
          else if (request.searchHost != undefined)
            bg.searchHost = request.searchHost;
          else if (request.searchService != undefined)
            bg.searchService = request.searchService;
          else if (request.searchStatus != undefined)
            bg.searchStatus = request.searchStatus;

          bg.refreshData();

          if (request.resetTimer)
            bg.setRefreshInterval();

          break;

        // Action command (e.g., service acknowledge, schedule downtime, etc.)
        case REQ_ACTION_CMD:
          bg.sendCommand(request.cmd, request.select);
          break;

        // Unknown request (should not happen)
        default:
          bg.state = STATE_UNKNOWN_ERROR;
      }

      response.state = bg.state;
      sendResponse(response);
    });
  }
};

bg.refreshData();
bg.setRefreshInterval();
bg.listener();
