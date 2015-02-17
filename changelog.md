Changelog
=========

0.0.4 - 17. 02. 2015
--------------------
* Refresh button now truly refreshes the current tab
* Service problems tab with options to:
  - select all events
  - order ascending/descending by hostname, service name and status
  - filter events by hostname, service name and status
  - send commands to hosts and services
* Many smalls optimizations
* Reduce images sizes
* And some bug fixes

0.0.3 - 12. 01. 2015
--------------------
* Modify logo (icons) to reflect the real application's name
* Link the status message to Centreon entry page
* Set badge to 'P' (instead of 1) on poller events

0.0.2 - 05. 01. 2015
--------------------
* Fix 'en' locale string typos and improve translation
* Fix 'unhandled/total' counters for critical, warning and unknown
* Display a clear badge if status is 'ok'. Only show counters if != 'ok'
* Set counter overflow at > 99 (in this case, simply display '99+')
* Add a flag to also include the unhandled services in the reported totals

0.0.1 - 01. 01. 2015
--------------------
* Locale support
* Support Centreon Broker or NDOUtils
* Show summary overview (pollers, hosts and services status)
* Ability to set data refresh interval
* Show alert counter status (critical, warning, unreachable, unknown or ok)
