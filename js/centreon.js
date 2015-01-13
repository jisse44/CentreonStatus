/**
 * centreon.js
 *
 * Copyright (c)2015 Jorge Morgado. All rights reserved (MIT license).
 */

// Helper constants
const POLLER_STATE      = 0;
const POLLER_LATENCY    = 1;
const POLLER_ACTIVE     = 2;
const POLLER_ERRSTATE   = 3;
const POLLER_ERRLATENCY = 4;
const POLLER_ERRACTIVE  = 5;

const HOST_TOTAL = 0;
const HOST_UP    = 1;
const HOST_PEND  = 2;
const HOST_UNRC  = 3;
const HOST_DOWN  = 4;

const SVC_TOTAL = 0;
const SVC_OK    = 1;
const SVC_PEND  = 2;
const SVC_UNKN  = 3;
const SVC_WARN  = 4;
const SVC_CRIT  = 5;
const SVC_UNKNU = 6;
const SVC_WARNU = 7;
const SVC_CRITU = 8;

function Centreon(ts, addHandled) {
  this.ts         = ts || (new Date().getTime() / 1000);
  this.addHandled = addHandled || false;
  this.message    = '';
  this.status     = 'ok';
  this.count      = 0;

  this.pollers  = {
    POLLER_STATE:      0,
    POLLER_LATENCY:    0,
    POLLER_ACTIVE:     0,
    POLLER_ERRSTATE:   '',
    POLLER_ERRLATENCY: '',
    POLLER_ERRACTIVE:  '',
  };
  this.hosts    = {
    HOST_TOTAL: 0,
    HOST_UP:    0,
    HOST_PEND:  0,
    HOST_UNRC:  0,
    HOST_DOWN:  0,
  };
  this.services = {
    SVC_TOTAL: 0,
    SVC_OK:    0,
    SVC_PEND:  0,
    SVC_UNKN:  0,
    SVC_WARN:  0,
    SVC_CRIT:  0,
    SVC_UNKNU: 0,
    SVC_WARNU: 0,
    SVC_CRITU: 0,
  };

  this.pollerState = function(state, latency, active, errstate, errlatency, erractive) {
    this.pollers[POLLER_STATE]   = parseInt(state);
    this.pollers[POLLER_LATENCY] = parseInt(latency);
    this.pollers[POLLER_ACTIVE]  = parseInt(active);
    this.pollers[POLLER_ERRSTATE]   = errstate;
    this.pollers[POLLER_ERRLATENCY] = errlatency;
    this.pollers[POLLER_ERRACTIVE]  = erractive;
  }

  this.hostState = function(total, up, pend, unrc, down) {
    this.hosts[HOST_TOTAL] = parseInt(total);
    this.hosts[HOST_UP]    = parseInt(up);
    this.hosts[HOST_PEND]  = parseInt(pend);
    this.hosts[HOST_UNRC]  = parseInt(unrc);
    this.hosts[HOST_DOWN]  = parseInt(down);
  }

  this.serviceState = function(total, ok, pend, unkn, warn, crit, unknu, warnu, critu) {
    this.services[SVC_TOTAL] = parseInt(total);
    this.services[SVC_OK]    = parseInt(ok);
    this.services[SVC_PEND]  = parseInt(pend);
    this.services[SVC_UNKN]  = parseInt(unkn);
    this.services[SVC_WARN]  = parseInt(warn);
    this.services[SVC_CRIT]  = parseInt(crit);
    this.services[SVC_UNKNU] = parseInt(unknu);
    this.services[SVC_WARNU] = parseInt(warnu);
    this.services[SVC_CRITU] = parseInt(critu);
  }

  this.setStatus = function() {
    // If should include handled services (acknowledged and in-downtime)
    if (this.addHandled) {
      // Then, the real value is the whole total
      svc_unkn = SVC_UNKN;
      svc_warn = SVC_WARN;
      svc_crit = SVC_CRIT;
    } else {
      // Otherwise, the real value the unhandled
      svc_unkn = SVC_UNKNU;
      svc_warn = SVC_WARNU;
      svc_crit = SVC_CRITU;
    }

    // Critical status: host(s) down, service(s) critical or pollers critical
    if (this.hosts[HOST_DOWN] > 0 || this.services[svc_crit] > 0) {
      this.message = i18n('check_hosts_services');
      this.status  = 'crit';
      // Only show the hosts count if HOST_DOWN > 0 - the assumption is that
      // if a host is down, likely some or all of its services will be down
      // too, thus it doesn't make sense to include this value as well.
      this.count   = this.hosts[HOST_DOWN] || this.services[svc_crit];
    } else if (this.pollers[POLLER_STATE] == 2 || this.pollers[POLLER_LATENCY] == 2 || this.pollers[POLLER_ACTIVE] == 2) {
      this.message = i18n('check_pollers');
      this.status  = 'crit';
      this.count   = 'P';

    // Warning status: service(s) warning or pollers warning
    } else if (this.services[svc_warn]  > 0) {
      this.message = i18n('check_services');
      this.status  = 'warn';
      this.count   = this.services[svc_warn] ;
    } else if (this.pollers[POLLER_STATE] == 1 || this.pollers[POLLER_LATENCY] == 1 || this.pollers[POLLER_ACTIVE] == 1) {
      this.message = i18n('check_pollers');
      this.status  = 'warn';
      this.count   = 'P';

    // Unreachable status: host(s) unreachable
    } else if (this.hosts[HOST_UNRC] > 0) {
      this.message = i18n('check_hosts');
      this.status  = 'unrc';
      this.count   = this.hosts[HOST_UNRC];

    // Unknown status: host(s) pending or service(s) unknown
    } else if (this.hosts[HOST_PEND] > 0 || this.services[svc_unkn] > 0) {
      this.message = i18n('check_hosts_services');
      this.status  = 'unkn';
      // Also, only show the hosts count if HOST_PEND > 0 - again, we assume
      // that if a host is pending, likely its services will also be pending.
      this.count   = this.hosts[HOST_PEND] || this.services[svc_unkn];

    // Anything else is OK
    } else {
      this.message = i18n('all_ok');
      this.status  = 'ok';
      this.count   = this.services[SVC_OK];
    }
  }

  this.toJSON = function() {
    return {
      ts:      this.ts,
      message: this.message,
      status:  this.status,
      count:   this.count,

      poller_state:      this.pollers[POLLER_STATE],
      poller_latency:    this.pollers[POLLER_LATENCY],
      poller_active:     this.pollers[POLLER_ACTIVE],
      poller_errstate:   this.pollers[POLLER_ERRSTATE],
      poller_errlatency: this.pollers[POLLER_ERRLATENCY],
      poller_erractive:  this.pollers[POLLER_ERRACTIVE],

      host_total: this.hosts[HOST_TOTAL],
      host_up:    this.hosts[HOST_UP],
      host_pend:  this.hosts[HOST_PEND],
      host_unrc:  this.hosts[HOST_UNRC],
      host_down:  this.hosts[HOST_DOWN],

      svc_total: this.services[SVC_TOTAL],
      svc_ok:    this.services[SVC_OK],
      svc_pend:  this.services[SVC_PEND],
      svc_unkn:  this.services[SVC_UNKN],
      svc_warn:  this.services[SVC_WARN],
      svc_crit:  this.services[SVC_CRIT],
      svc_unknu: this.services[SVC_UNKNU],
      svc_warnu: this.services[SVC_WARNU],
      svc_critu: this.services[SVC_CRITU],
    };
  }
}
