function $(id) { return document.getElementById(id); }

var logElem = $('log');
function log(msg) {
    logElem.appendChild(document.createTextNode(msg));
    logElem.appendChild(document.createElement('br'));
    logElem.scrollTop = logElem.scrollHeight;
}

function timeNear(a, b) {
  const d = 1000 * 60 * 5;
  return a > b - d && a < b + d;
}

// Browsers (and the DOM spec) are in the process of moving the
// event timestamp from being relative to Date.now() to being
// relative to performance.now().

var timebase;
function checkTimebase(timeStamp)
{
    var newTimebase;
    if ('performance' in window && timeNear(timeStamp, performance.now()))
      newTimebase = "performance";
    else if (timeNear(timeStamp, Date.now()))
      newTimebase = "Date";
    else {
        log("ERROR: Unknown timebase for timeStamp: " + timeStamp);
        return;
    }

    if (!timebase) {
      timebase = newTimebase;
      log("Using timebase " + timebase + ".now()");
    }
    else if (timebase != newTimebase)
      log("ERROR: Inconsistent timebase \"" + timebase + "\" for timeStamp: " + timeStamp);
}

function round(val) {
  const scale = 1000;
  return Math.round(val * scale) / scale;
}

function handler(e) {
  checkTimebase(e.timeStamp);

  // Only cancelable events block scrolling, and are the 
  // only ones that contribute to scroll latency.
  if (e.cancelable) {
    // Wait until after all event handlers have run (to capture
    // jank caused by slow handlers invoked after this one).
    requestAnimationFrame(function() {
        // Compute the difference between the current time and the
        // timestamp associated with the event.
        var latency = window[timebase].now() - e.timeStamp;
        log(e.type + ': ' + round(latency) + "ms" + 
        (e.defaultPrevented ? ' defaultPrevented' : ''));
    });
  }
}

function jank(amt) {
  var start = Date.now();
  while(Date.now() < start + amt) {
    ;
  }
}

function jankHandler(e) {
  if ($('hjank').checked)
    jank(Number($('htime').value));
    
  if ($('pd').checked)
    e.preventDefault();
}

var transformAttr = 'transform' in document.body.style ? 'transform' : 'webkitTransform';

var spin = 0;
var lastJank = 0;
function doFrame() {
  spin = (spin + 3) % 360;
  $('spinner').style[transformAttr] = 'rotate(' + spin + 'deg)'; 

  if ($('pjank').checked) {
    var jankTime = Number($('ptime').value);
    if (Date.now() > lastJank + jankTime) {
      jank(jankTime);
      lastJank = Date.now();
    }
  }

  requestAnimationFrame(doFrame);
}
doFrame();

['touchstart', 'touchmove', 'touchend', 'wheel'].forEach(function(type) {
    // Note that today if this is the only touch/wheel listener on the page
    // it can hurt scroll performance.  We use the EventListenerOptions polyfill
    // here to make it clear we really want passive listeners to avoid this problem.
    // See https://github.com/RByers/EventListenerOptions/blob/gh-pages/explainer.md
   $('content').addEventListener(type, handler, {passive: true});
   
   $('content').addEventListener(type, jankHandler);
});
