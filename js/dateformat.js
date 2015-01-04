/*
* Date Format 1.2.3
* (c) 2007-2009 Steven Levithan <stevenlevithan.com>
* MIT license
*
* Includes enhancements by Scott Trenda <scott.trenda.net>
* and Kris Kowal <cixar.com/~kris.kowal/>
*
* Accepts a date, a mask, or a date and a mask.
* Returns a formatted version of the given date.
* The date defaults to the current date/time.
* The mask defaults to dateFormat.masks.default.
*/
var dateFormat=function(){var n=/d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,t=/\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,i=/[^-+\dA-Z]/g,e=function(n,t){for(n=String(n),t=t||2;n.length<t;)n="0"+n;return n};return function(a,m,d){var r=dateFormat;if(1!=arguments.length||"[object String]"!=Object.prototype.toString.call(a)||/\d/.test(a)||(m=a,a=void 0),a=a?new Date(a):new Date,isNaN(a))throw SyntaxError("invalid date");m=String(r.masks[m]||m||r.masks["default"]),"UTC:"==m.slice(0,4)&&(m=m.slice(4),d=!0);var s=d?"getUTC":"get",y=a[s+"Date"](),o=a[s+"Day"](),u=a[s+"Month"](),l=a[s+"FullYear"](),M=a[s+"Hours"](),h=a[s+"Minutes"](),T=a[s+"Seconds"](),c=a[s+"Milliseconds"](),g=d?0:a.getTimezoneOffset(),f={d:y,dd:e(y),ddd:r.i18n.dayNames[o],dddd:r.i18n.dayNames[o+7],m:u+1,mm:e(u+1),mmm:r.i18n.monthNames[u],mmmm:r.i18n.monthNames[u+12],yy:String(l).slice(2),yyyy:l,h:M%12||12,hh:e(M%12||12),H:M,HH:e(M),M:h,MM:e(h),s:T,ss:e(T),l:e(c,3),L:e(c>99?Math.round(c/10):c),t:12>M?"a":"p",tt:12>M?"am":"pm",T:12>M?"A":"P",TT:12>M?"AM":"PM",Z:d?"UTC":(String(a).match(t)||[""]).pop().replace(i,""),o:(g>0?"-":"+")+e(100*Math.floor(Math.abs(g)/60)+Math.abs(g)%60,4),S:["th","st","nd","rd"][y%10>3?0:(y%100-y%10!=10)*y%10]};return m.replace(n,function(n){return n in f?f[n]:n.slice(1,n.length-1)})}}();dateFormat.masks={"default":"ddd mmm dd yyyy HH:MM:ss",shortDate:"m/d/yy",mediumDate:"mmm d, yyyy",longDate:"mmmm d, yyyy",fullDate:"dddd, mmmm d, yyyy",shortTime:"h:MM TT",mediumTime:"h:MM:ss TT",longTime:"h:MM:ss TT Z",isoDate:"yyyy-mm-dd",isoTime:"HH:MM:ss",isoDateTime:"yyyy-mm-dd'T'HH:MM:ss",isoUtcDateTime:"UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"},
dateFormat.i18n={
  dayNames:[i18n("sun"),i18n("mon"),i18n("tue"),i18n("wed"),i18n("thu"),i18n("fri"),i18n("sat"),
  i18n("sunday"),i18n("monday"),i18n("tuesday"),i18n("wednesday"),i18n("thursday"),i18n("friday"),i18n("saturday")],
  monthNames:[i18n("jan"),i18n("feb"),i18n("mar"),i18n("apr"),i18n("may"),i18n("jun"),i18n("jul"),i18n("aug"),i18n("sep"),i18n("oct"),i18n("nov"),i18n("dec"),
  i18n("january"),i18n("february"),i18n("march"),i18n("april"),i18n("may"),i18n("june"),i18n("july"),i18n("august"),i18n("september"),i18n("october"),i18n("november"),i18n("december")]
},Date.prototype.format=function(n,t){return dateFormat(this,n,t)};
