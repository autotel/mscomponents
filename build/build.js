(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
/*
you make the onHandlers.call(this) in the object that needs to have handlers.
then you can create a function callback for that object using object.on("handlerName.optionalName",callbackFunction(){});
the object can run the handle callbacks by using this.handle("handlerName",parametersToFeed);
*/
module.exports=function() {
  var eventVerbose=false;
  if (!this.ons) {
    this.ons = [];
  }
  this.on = function(name, callback) {
    var name = name.split(".");
    if (typeof callback === 'function') {
      if (name.length == 0) {
        throw ("sorry, you gave an invalid event name");
      } else if (name.length > 0) {
        if (!this.ons[name[0]]) this.ons[name[0]] = [];
        this.ons[name[0]].push([false, callback]);
      }
      // console.log(this.ons);
    } else {
      throw ("error at mouse.on, provided callback that is not a function");
    }
  }
  this.off = function(name) {
    var name = name.split(".");
    if (name.length > 1) {
      if (!this.ons[name[0]]) this.ons[name[0]] = [];
      // console.log("prev",this.ons[name[0]]);
      this.ons[name[0]].splice(this.ons[name[0]].indexOf(name[1]), 1);
      // console.log("then",this.ons[name[0]]);
    } else {
      throw ("sorry, you gave an invalid event name" + name);
    }
  }
  this.handle = function(fname, params) {
    if(eventVerbose) console.log("Event "+fname+":",{caller:this,params:params});
    if (this.ons[fname]) {
      for (var n in this.ons[fname]) {
        // console.log(this.ons[fname][n][1]);
        this.ons[fname][n][1](params);
      }
    }
  }
};
},{}],3:[function(require,module,exports){
module.exports = require("./lib");

},{"./lib":6}],4:[function(require,module,exports){
(function (global){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var events = require("events");
var defaults = require("./utils/defaults");
var defaultContext = require("./defaultContext");

var WebAudioScheduler = function (_events$EventEmitter) {
  _inherits(WebAudioScheduler, _events$EventEmitter);

  function WebAudioScheduler(opts) {
    _classCallCheck(this, WebAudioScheduler);

    opts = opts || /* istanbul ignore next */{};

    var _this = _possibleConstructorReturn(this, (WebAudioScheduler.__proto__ || Object.getPrototypeOf(WebAudioScheduler)).call(this));

    _this.context = defaults(opts.context, defaultContext);
    _this.interval = defaults(opts.interval, 0.025);
    _this.aheadTime = defaults(opts.aheadTime, 0.1);
    _this.timerAPI = defaults(opts.timerAPI, global);
    _this.playbackTime = _this.currentTime;

    _this._timerId = 0;
    _this._schedId = 0;
    _this._scheds = [];
    return _this;
  }

  _createClass(WebAudioScheduler, [{
    key: "start",
    value: function start(callback, args) {
      var _this2 = this;

      var loop = function loop() {
        var t0 = _this2.context.currentTime;
        var t1 = t0 + _this2.aheadTime;

        _this2._process(t0, t1);
      };

      if (this._timerId === 0) {
        this._timerId = this.timerAPI.setInterval(loop, this.interval * 1000);

        this.emit("start");

        if (callback) {
          this.insert(this.context.currentTime, callback, args);
          loop();
        }
      } else if (callback) {
        this.insert(this.context.currentTime, callback, args);
      }

      return this;
    }
  }, {
    key: "stop",
    value: function stop() {
      var reset = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      if (this._timerId !== 0) {
        this.timerAPI.clearInterval(this._timerId);
        this._timerId = 0;

        this.emit("stop");
      }

      if (reset) {
        this._scheds.splice(0);
      }

      return this;
    }
  }, {
    key: "insert",
    value: function insert(time, callback, args) {
      var id = ++this._schedId;
      var event = { id: id, time: time, callback: callback, args: args };
      var scheds = this._scheds;

      if (scheds.length === 0 || scheds[scheds.length - 1].time <= time) {
        scheds.push(event);
      } else {
        for (var i = 0, imax = scheds.length; i < imax; i++) {
          if (time < scheds[i].time) {
            scheds.splice(i, 0, event);
            break;
          }
        }
      }

      return id;
    }
  }, {
    key: "nextTick",
    value: function nextTick(time, callback, args) {
      if (typeof time === "function") {
        args = callback;
        callback = time;
        time = this.playbackTime;
      }

      return this.insert(time + this.aheadTime, callback, args);
    }
  }, {
    key: "remove",
    value: function remove(schedId) {
      var scheds = this._scheds;

      if (typeof schedId === "number") {
        for (var i = 0, imax = scheds.length; i < imax; i++) {
          if (schedId === scheds[i].id) {
            scheds.splice(i, 1);
            break;
          }
        }
      }

      return schedId;
    }
  }, {
    key: "removeAll",
    value: function removeAll() {
      this._scheds.splice(0);
    }
  }, {
    key: "_process",
    value: function _process(t0, t1) {
      var scheds = this._scheds;
      var playbackTime = t0;

      this.playbackTime = playbackTime;
      this.emit("process", { playbackTime: playbackTime });

      while (scheds.length && scheds[0].time < t1) {
        var event = scheds.shift();
        var _playbackTime = event.time;
        var args = event.args;

        this.playbackTime = _playbackTime;

        event.callback({ playbackTime: _playbackTime, args: args });
      }

      this.playbackTime = playbackTime;
      this.emit("processed", { playbackTime: playbackTime });
    }
  }, {
    key: "state",
    get: function get() {
      return this._timerId !== 0 ? "running" : "suspended";
    }
  }, {
    key: "currentTime",
    get: function get() {
      return this.context.currentTime;
    }
  }, {
    key: "events",
    get: function get() {
      return this._scheds.slice();
    }
  }]);

  return WebAudioScheduler;
}(events.EventEmitter);

module.exports = WebAudioScheduler;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./defaultContext":5,"./utils/defaults":7,"events":1}],5:[function(require,module,exports){
"use strict";

module.exports = {
  get currentTime() {
    return Date.now() / 1000;
  }
};
},{}],6:[function(require,module,exports){
"use strict";

module.exports = require("./WebAudioScheduler");
},{"./WebAudioScheduler":4}],7:[function(require,module,exports){
"use strict";

function defaults(value, defaultValue) {
  return value !== undefined ? value : defaultValue;
}

module.exports = defaults;
},{}],8:[function(require,module,exports){
"use strict";

var componentBase = require('./componentBase');
var syncman, mouse;
exports.enable = function (globals) {
  syncman = globals.syncman;
  mouse = globals.mouse;
  componentBase = componentBase.get({ syncman: syncman, mouse: mouse });
  return Button;
};
function Button(parent, options) {
  this.name = "button";
  componentBase.call(this, parent, options);
  //my reference number for data binding. With this number the socket binder knows who is the reciever of the data, and also with what name to send it
  //pendant: this can potentially create a problem, because two objects can be created simultaneously at different ends at the same time.
  //maybe instead of the simple push, there could be a callback, adn the object waits to receive it's socket id once its creation was propagated throughout all the network, or maybe there is an array for senting and other different for receiving... first option seems more sensible
  this.data = { value: 0 };
  this.states = false;
  this._bindN = syncman.bindList.push(this) - 1;
  //this.$jq=$('<div class="ms-button"></div>');
  this.label = options.label || "☻";
  this.$jq.append(this.$faderjq);
  this.$jq.html(this.label);
  // if(options.css)
  //   this.$jq.css(options.css);
  // this.css=function(css){
  //   this.$jq.css(options.css);
  //   return this;
  // }
  //if a switch variable is passed, this button will switch on each click among the stated states
  if (options.hasOwnProperty("switch")) {
    this.states = [];
    this.data.currentState = 0;
    this.states = options.switch;
    this.switchState(0);
  }
  this.onClickCallback = function () {};
  this.onReleaseCallback = function () {};
  //pendant: this should be part of a base prototype, not repeated in each type
  // if(typeof (parent.append||false)=="function"){
  //   parent.append(this.$jq);
  // }else if(typeof (parent.$jq.append||false)=="function"){
  //   parent.$jq.append(this.$jq);
  // }else{
  //   console.log("a slider couldn't find dom element to attach himself");
  // }
  var me = this;
  // this.onChange=function(callback){
  //   me.onClickCallback=function(){callback(me.data)};
  //   return this;
  // }

  this.$jq.on("mousedown tap touchstart", function (event) {
    me.onClickCallback(me.data);
    event.preventDefault();
    me.switchState();
    me.addClass("active");
  });
  this.$jq.on("mouseup mouseleave", function (event) {
    me.onReleaseCallback(me.data);
    event.preventDefault();
    me.removeClass("active");
  });
}

Button.prototype.onClick = function (callback) {
  this.onClickCallback = callback;
  return this;
};
Button.prototype.onRelease = function (callback) {
  this.onReleaseCallback = callback;
  return this;
};
Button.prototype.switchState = function (to) {
  if (this.states) {
    //change state number to next
    if (to) {
      this.data.currentState = to % this.states.length;
    } else {
      this.data.currentState = (this.data.currentState + 1) % this.states.length;
    }
    //apply all the properties that the state carry. This makes the button super hackable
    for (a in this.states[this.data.currentState]) {
      this[a] = this.states[this.data.currentState][a];
      // console.log("["+a+"]",this[a]);
    }
  }
  this.updateDom();
};

},{"./componentBase":12}],9:[function(require,module,exports){
"use strict";

var syncman, mouse, audioContext;
var OH = require("onhandlers");
var Timer = require("web-audio-scheduler");
exports.enable = function (globals) {
  console.log("timer", Timer);
  syncman = globals.syncman;
  mouse = globals.mouse;
  audioContext = globals.audioContext;
  return Clock;
};
function Clock(parent, options) {

  var defaults = {
    interval: 0.1
  };
  this.currentStep = 0;
  this.name = "clock";
  OH.call(this);
  var thisClock = this;
  this.data = { value: 0 };
  this.states = false;
  this._bindN = syncman.bindList.push(this) - 1;
  this.$jq = $('<div class="ms-clock ms-button"></div>');
  this.label = options.label || '∆';
  this.$jq.append(this.$faderjq);
  this.$jq.html(this.label);
  if (options.css) this.$jq.css(options.css);
  this.css = function (css) {
    this.$jq.css(options.css);
    return this;
  };
  //this should go in componentBase. It applies options or defaults.
  if (!options) options = {};
  for (var a in defaults) {
    if (!options[a]) options[a] = defaults[a];
  }
  //pendant: this should be part of a base prototype, not repeated in each type
  if (typeof (parent.append || false) == "function") {
    parent.append(this.$jq);
  } else if (typeof (parent.$jq.append || false) == "function") {
    parent.$jq.append(this.$jq);
  } else {
    console.log("a clock couldn't find dom element to attach himself");
  }
  var me = this;

  this.timer = new Timer({ context: audioContext });
  var intervalHandle;
  //the current timer technology doesn't make interval but rather schedules ahead, thus these vars:
  var lastTimerScheduled = 0;
  var lastTimerExecuted = 0;
  var createFurtherTimerSchedules = function createFurtherTimerSchedules(howMany) {
    var addUpTo = lastTimerScheduled + howMany;
    for (lastTimerScheduled; lastTimerScheduled < addUpTo; lastTimerScheduled++) {
      me.timer.insert(options.interval * lastTimerScheduled, me.tick, { tickn: lastTimerScheduled });
    }
  };
  this.tick = function (a) {
    lastTimerExecuted++;
    createFurtherTimerSchedules(4);
    thisClock.handle("tick");
    thisClock.addClass("tick");
    // console.log("tick");
    setTimeout(function () {
      thisClock.removeClass("tick");
    }, 20);
    this.currentStep++;
  };
  this.start = function () {
    // console.log(options.interval);
    createFurtherTimerSchedules(4);
    this.timer.start();
    //intervalHandle=window.setInterval(this.tick,options.interval|1);
  };
  this.stop = function () {
    this.timer.stop();
    ///this.timer.remove(intervalHandle);
    //window.clearInterval(intervalHandle);
  };
  if (options.start) this.start();
}

Clock.prototype.updateDom = function () {
  this.$jq.html(this.label);
};

//aliasing of these two handy function
Clock.prototype.addClass = function (to) {
  this.$jq.addClass(to);
};
Clock.prototype.removeClass = function (to) {
  this.$jq.removeClass(to);
};

},{"onhandlers":2,"web-audio-scheduler":3}],10:[function(require,module,exports){
'use strict';

var componentBase = require('./componentBase');
var eemiter = require('onhandlers');
var syncman, mouse;
exports.enable = function (globals) {
  syncman = globals.syncman;
  mouse = globals.mouse;
  componentBase = componentBase.get({ syncman: syncman, mouse: mouse });
  return Sequencer;
};
/**
 * A generator of sequencers
 *
 * @class Sequencer
 * @constructor new MsComponents.Sequencer(DOM/$jquery element,{properties})
 */
//defines all the sequencer parameters by math,
//maybe in a funture by styling table
var seqProg = 4;
function Sequencer(parent, options) {
  var n = options.n || 3;
  var thisSequencer = this;
  this.name = "sequencer";
  componentBase.call(this, parent, options);
  // this.$jq=$('<div class="sequencer" id="seq_'+n+'"><p style="position:absolute"></p></div>');
  parent.append(this.$jq);
  this.alive = false;
  this._bindN = syncman.bindList.push(this) - 1;
  this.pos = 0;
  this.data = [];
  /**
   * @param len
   *how many steps the sequencer has
   * @alias length
   */
  this.len = options.len | options.length | Math.pow(2, seqProg % 5 + 1);
  /**
   * @param evry
   * how many clock steps make a sequencer step
   * @alias stepDivision
   */
  this.evry = options.evry | options.stepDivision | Math.pow(2, seqProg % 4 + 1);
  //must count an [every] amount of beats for each pos increment.
  this.subpos = 0;
  this.$jq.css({ width: 16 * Math.ceil(this.len / 4) + "px" });
  //this.$jq.addClass("color_"+seqProg%channels.length);
  this.disp = 0;
  this.id = n;
  this.beatDisplace = 0;
  var me = this;
  seqProg++;
  //this.channel=channels[this.id%channels.length];
  for (var bn = 0; bn < this.len; bn++) {
    this.data[bn] = new SequencerButton(bn, this);
  }
  this.aliveChild = 0;
  this.displace = 0;
  this.setDisplace = function (to /*,emit*/) {
    //  if(emit=="only"){
    //  emit=true;
    //  }else{
    this.subpos = this.clock.currentStep % (this.len * this.evry) + to;
    //  }
    //  if(emit==true){
    //    sockChange("seq:"+me._bindN+"","dspl",to);
    //  }
  };
  this.step = function () {
    var prevalive = this.alive;
    this.alive = this.aliveChild > 0;
    //  console.log(this.aliveChild);
    if (this.alive) {
      //  console.log("sete");
      //if the state of this.alive changes, we must emit the displacement, because it is new
      if (!prevalive) {
        this.displace = (this.clock.currentStep + this.subpos) % (this.len * this.evry);
        //console.log("ok. emit displae: "+this.displace);
        //this.setDisplace(this.displace,"only");
      };
      //each sequencer has a different speed rates. while some plays one step per click, others will have one step per several clock ticks.
      //the sequencer starting point is also displaced, and it depends on the time when it got alived+its position at that moment.
      if (this.subpos % this.evry == 0) {
        // console.log("sq"+this.pos);
        // data={sequencer:this.id,pos:this.pos,stepVal:this.data[this.pos].eval()};
        // this.onStepTrigger(data);
        // stepFunction(data);
        this.pos = this.subpos / this.evry % this.len;
        var vl = this.data[this.pos].eval();
        if (vl) {
          // this.channel.engine.start(0,this.channel.startOffset,this.channel.endTime);
          //so, this is called elsewhere aswelll.... the channel should have a trigger function
          //  var loopStart=this.channel.startOffset;
          //  var loopEnd=this.channel.endTime;
          //  this.channel.sampler.triggerAttack(false,0,1,{start:loopStart,end:loopEnd});
          this.handle("trigger", vl);
        }
      } else {}
      //what is more economic??
      // this.subpos=(this.subpos+1)%(this.len*this.evry);
      //i guess that.. but it can grow eternally
      this.subpos++;
    }
  };
  this.setClock = function (clock, divisions) {
    if (divisions) this.evry = divisions;
    if (clock.on) {
      clock.on('tick', function () {
        thisSequencer.step();
      });
      if (clock.name != "clock") console.warn("you set the clock of a sequencer to somehting that is not a clock, but a " + clock.name);
    } else {
      console.warn("you tried to connect a " + this.name + " to an object that has no event hanlers ");
    }
    this.clock = clock;
  };
  this.die = function () {
    for (var bn in this.data) {
      this.data[bn].setData(0);
    }
    this.alive = false;
    this.$jq.detach();
  };
  // this.onStepTrigger=function(data){
  //   // console.log(data);
  // }
  // this.$jq.on("mouseenter",function(){
  //   focusChannel(me.channel.id);
  // });
  return this;
}

function SequencerButton(n, parent) {
  eemiter.call(this);
  this.on("test", function () {
    console.log("works!");
  });
  this.handle("test");
  this.$jq = $('<div class="seqbutton"></div>');
  this._bindN = syncman.bindList.push(this) - 1;
  parent.$jq.append(this.$jq);
  this.data = 0;
  //pendant: evaluate wether the var n is still useful. remove it at every end.
  this.n = n;
  var me = this;
  this.setData = function (to, emit) {
    // if(emit==true){
    //   sockChange("seqb:"+me._bindN+"","sV",to);
    // }
    // console.log("sdata");
    //socket may set data to 0 when is already 0, generating displace of parent's alivedhild
    if (to != this.data) {
      if (to == 1) {
        this.data = 1;
        this.$jq.addClass("on");
        parent.aliveChild++;
      }
      if (to == 0) {
        this.data = 0;
        this.$jq.removeClass("on");
        parent.aliveChild--;
      }
    }
    // console.log(parent.aliveChild);
    // console.log(parent.aliveChild);
  };
  this.$jq.on("mousedown tap touchstart", function (event) {
    event.preventDefault();
    me.setData(Math.abs(me.data - 1), true);
    // me.data=;
    if (me.data == 1) {
      mouse.switching = true;
    } else {
      //   $(this).removeClass("on");
      //   parent.aliveChild--;
      mouse.switching = false;
    }
  });
  this.$jq.on("mouseenter touchenter", function () {
    if (mouse.buttonDown) {
      if (mouse.switching) {
        if (me.data == 0) {
          me.setData(1, true);
        }
      } else {
        if (me.data == 1) {
          me.setData(0, true);
        }
      }
    }
  });
  this.eval = function () {
    var $jq = this.$jq;
    $jq.addClass("turn");
    window.setTimeout(function () {
      $jq.removeClass("turn");
    }, 200);
    return this.data;
  };
}

},{"./componentBase":12,"onhandlers":2}],11:[function(require,module,exports){
'use strict';

/*
This script create DOM sliders that can be used in web browser to control stuff. They can be synced through sockets and others by using callbacks.
    Copyright (C) 2016 Joaquín Aldunate

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
var syncman, mouse;
// var $;
exports.enable = function (globals) {
  syncman = globals.syncman;
  mouse = globals.mouse;
  return Slider;
};

/**
* This is the description for Slider class
*
* @class Slider
* @constructor
*/
function Slider(parent, options) {
  //my reference number for data binding. With this number the socket binder knows who is the reciever of the data, and also with what name to send it
  //pendant: this can potentially create a problem, because two objects can be created simultaneously at different ends at the same time.
  //maybe instead of the simple push, there could be a callback, adn the object waits to receive it's socket id once its creation was propagated throughout all the network, or maybe there is an array for senting and other different for receiving... first option seems more sensible
  this.data = { value: 0 };

  this._bindN = syncman.bindList.push(this) - 1;
  this.$jq = $('<div class="slider-container" style="position:relative"></div>');
  this.$faderjq = $('<div class="slider-inner" style="pointer-events:none; position:absolute"></div>');
  this.label = options.label || "";
  this.labeljq = $('<p class="sliderlabel"></p>');
  this.$jq.append(this.$faderjq);
  this.$jq.append(this.labeljq);
  if (options.css) this.$jq.css(options.css);
  this.css = function (css) {
    this.$jq.css(css);
    return this;
  };
  this.onChangeCallback = function () {};
  //pendant: this should be part of a base prototype, not repeated in each type
  if (typeof (parent.append || false) == "function") {
    parent.append(this.$jq);
  } else if (typeof (parent.$jq.append || false) == "function") {
    parent.$jq.append(this.$jq);
  } else {
    console.log("a slider couldn't find dom element to attach himself");
  }
  var me = this;
  this.onChange = function (callback) {
    me.onChangeCallback = function () {
      callback(me.data);
    };
    return this;
  };
  /**
  * My method description.  Like other pieces of your comment blocks,
  * this can span multiple lines.
  *
  * @method methodName
  * @param {String} foo Argument 1
  * @param {Object} config A config object
  * @param {String} config.name The name on the config object
  * @param {Function} config.callback A callback function on the config object
  * @param {Boolean} [extra=false] Do extra, optional work
  * @return {Boolean} Returns true on success
  */
  this.setData = function (to, emit) {
    if (emit === true) {
      //pendant: in sequencers we use parent.id, and here we use _bindN. Towards a controller API and a more sensical code, I think both should use the bind element array. read note in first line of this file.
      //pendant: parent in seq is what me is here. this is pretty confusing var name decision
      syncman.emit("slid:" + me._bindN + "", "sV", to);
    }
    this.data.value = to;
    this.onChangeCallback();
    this.updateDom();
  };
  this.addClass = function (to) {
    this.$jq.addClass(to);
  };
  this.vertical = options.vertical || true;
  this.addClass("vertical");
  this.$jq.on("mousedown tap touchstart", function (event) {
    event.preventDefault();
    if (me.vertical) {
      me.setData(1 - event.offsetY / me.$jq.height(), true); //,true
    } else {
      me.setData(event.offsetX / me.$jq.width(), true); //,true
    }
  });

  this.$jq.on("mousemove touchenter mouseleave mouseup", function (event) {
    if (mouse.buttonDown) {
      event.preventDefault();
      var emitThis = event.type == "mouseleave" || event.type == "mouseup";
      if (me.vertical) {
        //the strange second paramenter in setdata was true, but it could clog the socket
        me.setData(1 - event.offsetY / me.$jq.height(), emitThis); //,true
      } else {
        me.setData(event.offsetX / me.$jq.width(), emitThis); //,true
      }
    } else {}
  });
  this.eval = function () {
    var jq = this.$jq;
    jq.addClass("turn");
    window.setTimeout(function () {
      jq.removeClass("turn");
    }, 200);
    return this.data.value;
  };
  this.updateDom = function () {
    if (this.vertical) {
      this.$faderjq.css({ bottom: 0, width: "100%", height: this.data.value * this.$jq.height() });
    } else {
      this.labeljq.html(this.label);
      this.$faderjq.css({ bottom: 0, width: this.data.value * this.$jq.width(), height: "100%" });
    }
  };
  this.setData(0);
}

},{}],12:[function(require,module,exports){
'use strict';

var eemiter = require('onhandlers');
var globals;
var mouse;
exports.get = function (globals) {
  // syncman=globals.syncman;
  mouse = globals.mouse;
  return componentBase;
};
/**
 * The base of components.
 * It contains the function that are shared among all MsComponents. Makes little sense to use this alone
 *
 * @class componentBase
 * @constructor new MsComponents.componentBase(DOM/Jquery element,{properties})
 *
 * @property parent
 * @type Jquery / Dom element / componentBase
 * @property options
 * @type object
 */
function componentBase(parent, options) {
  eemiter.call(this);
  this.options = options;
  var thisComponent = this;
  if (!this.name) {
    this.name = "component";
  }
  this.$jq = $('<div class="ms-' + this.name + '"></div>');
  if (options.css) this.$jq.css(options.css);
  this.css = function (css) {
    this.$jq.css(options.css);
    return this;
  };
  if (typeof (parent.append || false) == "function") {
    parent.append(this.$jq);
  } else if (typeof (parent.$jq.append || false) == "function") {
    parent.$jq.append(this.$jq);
  } else {
    console.log("a slider couldn't find dom element to attach himself");
  }
  /**
  * @property mouseActivationMode
  * @type String
  *  dragAll: the buttons will activate through all the trajectory of the mouse while pressed
  * oneByOne: one click=one button press
  * dragLast: the mouse can be tragged and will activae and hover only the last button that it entered
  * hover: the buttins are activated upon hover regardless of whether is clicked or not
  */
  if (!options.mouseActivationMode) {
    options.mouseActivationMode = "dragAll";
  }

  function mouseActivate(event) {
    thisComponent.handle("onMouseStart");
    event.preventDefault();
    thisComponent.addClass("active");
  }
  function mouseDeactivate(event) {
    thisComponent.handle("onMouseEnd");
    event.preventDefault();
    thisComponent.removeClass("active");
  }

  //to avoid if chains that are a pain to change
  function aIsInB(a, b) {
    for (var c in b) {
      if (a == b[c]) {
        console.log("true");return true;
      }
    }
    return false;
  };

  this.$jq.on("mousedown tap touchstart", function (event) {
    //check that upon the current event, a mouseActivate should be triggered.
    if (aIsInB(options.mouseActivationMode, ["dragAll", "oneByOne", "dragLast"])) {
      mouseActivate(event);
    }
  });

  this.$jq.on("mouseenter", function (event) {
    if (mouse.buttonDown) {
      if (aIsInB(options.mouseActivationMode, ["dragAll", "dragLast"])) {
        mouseActivate(event);
      }
    }
    if (options.mouseActivationMode == "hover") {
      mouseActivate(event);
    }
  });
  this.$jq.on("mouseup", function (event) {
    if (aIsInB(options.mouseActivationMode, ["dragAll", "oneByOne", "dragLast"])) {
      mouseDeactivate(event);
    }
  });
  this.$jq.on("mouseout", function (event) {
    if (aIsInB(options.mouseActivationMode, ["hover", "oneByOne", "dragLast"])) {
      mouseDeactivate(event);
    }
  });

  this.updateDom = function () {
    thisComponent.$jq.html(this.label);
  };
  //aliasing of these two handy function
  this.addClass = function (to) {
    thisComponent.$jq.addClass(to);
  };
  this.removeClass = function (to) {
    thisComponent.$jq.removeClass(to);
  };
}

},{"onhandlers":2}],13:[function(require,module,exports){
'use strict';

var audioContext = new AudioContext();
var globals = {};
globals.syncman = require('./syncman.js').enable();
globals.mouse = require('./mouse.js').enable();
globals.audioContext = audioContext;

var Slider = require('./Slider.js').enable(globals);
var Sequencer = require('./Sequencer.js').enable(globals);
var Button = require('./Button.js').enable(globals);
var Clock = require('./Clock.js').enable(globals);

var MsComponents = {
  Slider: Slider,
  Sequencer: Sequencer,
  Button: Button,
  Clock: Clock,
  create: function create(what, options, where) {
    if (!where) where = $("body");
    return new this[what](where, options);
  }
};
window.MsComponents = MsComponents;
console.log(MsComponents);

},{"./Button.js":8,"./Clock.js":9,"./Sequencer.js":10,"./Slider.js":11,"./mouse.js":14,"./syncman.js":15}],14:[function(require,module,exports){
"use strict";

exports.enable = function () {

  $(document).ready(function () {
    $(document).on("mousedown touchstart touchmove", function (event) {
      mouse.buttonDown = true;
      // console.log(event);
    });
    $(document).on("mouseup touchend", function (event) {
      mouse.buttonDown = false;
    });
    // document.ontouchmove = function(event){
    //   event.preventDefault();
    // }
  });

  return mouse;
};
var mouse = {
  tool: "draw"
};

},{}],15:[function(require,module,exports){
"use strict";

/*
This script contains a template for data-binding management if you want to do so. Otherwise, it will just placehold var names so there are no undefined vars.
    Copyright (C) 2016 Joaquín Aldunate

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

exports.enable = function () {
    return new Syncman();
};

function Syncman() {
    //list of all the items that use data binding
    this.bindList = [];
    //how are you emitting changes? it depends on the server you use.
    this.emit = function () {};
}

},{}]},{},[13])

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9vbmhhbmRsZXJzL29uLmpzIiwibm9kZV9tb2R1bGVzL3dlYi1hdWRpby1zY2hlZHVsZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvd2ViLWF1ZGlvLXNjaGVkdWxlci9saWIvV2ViQXVkaW9TY2hlZHVsZXIuanMiLCJub2RlX21vZHVsZXMvd2ViLWF1ZGlvLXNjaGVkdWxlci9saWIvZGVmYXVsdENvbnRleHQuanMiLCJub2RlX21vZHVsZXMvd2ViLWF1ZGlvLXNjaGVkdWxlci9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvd2ViLWF1ZGlvLXNjaGVkdWxlci9saWIvdXRpbHMvZGVmYXVsdHMuanMiLCJzcmNcXEJ1dHRvbi5qcyIsInNyY1xcQ2xvY2suanMiLCJzcmNcXFNlcXVlbmNlci5qcyIsInNyY1xcU2xpZGVyLmpzIiwic3JjXFxjb21wb25lbnRCYXNlLmpzIiwic3JjXFxpbmRleC5qcyIsInNyY1xcbW91c2UuanMiLCJzcmNcXHN5bmNtYW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTs7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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O0FBSUEsTUFBRSxRQUFGLEVBQVksRUFBWixDQUFlLGtCQUFmLEVBQWtDLFVBQVMsS0FBVCxFQUFlO0FBQy9DLFlBQU0sVUFBTixHQUFpQixLQUFqQjtBQUNELEtBRkQ7QUFHQTtBQUNBO0FBQ0E7QUFDRCxHQVhEOztBQWFBLFNBQU8sS0FBUDtBQUNELENBaEJEO0FBaUJBLElBQUksUUFBTTtBQUNSLFFBQUs7QUFERyxDQUFWOzs7OztBQ2pCQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBLFFBQVEsTUFBUixHQUFlLFlBQVU7QUFDdkIsV0FBTyxJQUFJLE9BQUosRUFBUDtBQUNELENBRkQ7O0FBSUEsU0FBUyxPQUFULEdBQWtCO0FBQ2hCO0FBQ0EsU0FBSyxRQUFMLEdBQWMsRUFBZDtBQUNBO0FBQ0EsU0FBSyxJQUFMLEdBQVUsWUFBVSxDQUFFLENBQXRCO0FBQ0QiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEF0IGxlYXN0IGdpdmUgc29tZSBraW5kIG9mIGNvbnRleHQgdG8gdGhlIHVzZXJcbiAgICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4gKCcgKyBlciArICcpJyk7XG4gICAgICAgIGVyci5jb250ZXh0ID0gZXI7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIGlmIChsaXN0ZW5lcnMpIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmICh0aGlzLl9ldmVudHMpIHtcbiAgICB2YXIgZXZsaXN0ZW5lciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICAgIGlmIChpc0Z1bmN0aW9uKGV2bGlzdGVuZXIpKVxuICAgICAgcmV0dXJuIDE7XG4gICAgZWxzZSBpZiAoZXZsaXN0ZW5lcilcbiAgICAgIHJldHVybiBldmxpc3RlbmVyLmxlbmd0aDtcbiAgfVxuICByZXR1cm4gMDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICByZXR1cm4gZW1pdHRlci5saXN0ZW5lckNvdW50KHR5cGUpO1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIiwiLypcclxueW91IG1ha2UgdGhlIG9uSGFuZGxlcnMuY2FsbCh0aGlzKSBpbiB0aGUgb2JqZWN0IHRoYXQgbmVlZHMgdG8gaGF2ZSBoYW5kbGVycy5cclxudGhlbiB5b3UgY2FuIGNyZWF0ZSBhIGZ1bmN0aW9uIGNhbGxiYWNrIGZvciB0aGF0IG9iamVjdCB1c2luZyBvYmplY3Qub24oXCJoYW5kbGVyTmFtZS5vcHRpb25hbE5hbWVcIixjYWxsYmFja0Z1bmN0aW9uKCl7fSk7XHJcbnRoZSBvYmplY3QgY2FuIHJ1biB0aGUgaGFuZGxlIGNhbGxiYWNrcyBieSB1c2luZyB0aGlzLmhhbmRsZShcImhhbmRsZXJOYW1lXCIscGFyYW1ldGVyc1RvRmVlZCk7XHJcbiovXHJcbm1vZHVsZS5leHBvcnRzPWZ1bmN0aW9uKCkge1xyXG4gIHZhciBldmVudFZlcmJvc2U9ZmFsc2U7XHJcbiAgaWYgKCF0aGlzLm9ucykge1xyXG4gICAgdGhpcy5vbnMgPSBbXTtcclxuICB9XHJcbiAgdGhpcy5vbiA9IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrKSB7XHJcbiAgICB2YXIgbmFtZSA9IG5hbWUuc3BsaXQoXCIuXCIpO1xyXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBpZiAobmFtZS5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgIHRocm93IChcInNvcnJ5LCB5b3UgZ2F2ZSBhbiBpbnZhbGlkIGV2ZW50IG5hbWVcIik7XHJcbiAgICAgIH0gZWxzZSBpZiAobmFtZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLm9uc1tuYW1lWzBdXSkgdGhpcy5vbnNbbmFtZVswXV0gPSBbXTtcclxuICAgICAgICB0aGlzLm9uc1tuYW1lWzBdXS5wdXNoKFtmYWxzZSwgY2FsbGJhY2tdKTtcclxuICAgICAgfVxyXG4gICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLm9ucyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyAoXCJlcnJvciBhdCBtb3VzZS5vbiwgcHJvdmlkZWQgY2FsbGJhY2sgdGhhdCBpcyBub3QgYSBmdW5jdGlvblwiKTtcclxuICAgIH1cclxuICB9XHJcbiAgdGhpcy5vZmYgPSBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICB2YXIgbmFtZSA9IG5hbWUuc3BsaXQoXCIuXCIpO1xyXG4gICAgaWYgKG5hbWUubGVuZ3RoID4gMSkge1xyXG4gICAgICBpZiAoIXRoaXMub25zW25hbWVbMF1dKSB0aGlzLm9uc1tuYW1lWzBdXSA9IFtdO1xyXG4gICAgICAvLyBjb25zb2xlLmxvZyhcInByZXZcIix0aGlzLm9uc1tuYW1lWzBdXSk7XHJcbiAgICAgIHRoaXMub25zW25hbWVbMF1dLnNwbGljZSh0aGlzLm9uc1tuYW1lWzBdXS5pbmRleE9mKG5hbWVbMV0pLCAxKTtcclxuICAgICAgLy8gY29uc29sZS5sb2coXCJ0aGVuXCIsdGhpcy5vbnNbbmFtZVswXV0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhyb3cgKFwic29ycnksIHlvdSBnYXZlIGFuIGludmFsaWQgZXZlbnQgbmFtZVwiICsgbmFtZSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHRoaXMuaGFuZGxlID0gZnVuY3Rpb24oZm5hbWUsIHBhcmFtcykge1xyXG4gICAgaWYoZXZlbnRWZXJib3NlKSBjb25zb2xlLmxvZyhcIkV2ZW50IFwiK2ZuYW1lK1wiOlwiLHtjYWxsZXI6dGhpcyxwYXJhbXM6cGFyYW1zfSk7XHJcbiAgICBpZiAodGhpcy5vbnNbZm5hbWVdKSB7XHJcbiAgICAgIGZvciAodmFyIG4gaW4gdGhpcy5vbnNbZm5hbWVdKSB7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5vbnNbZm5hbWVdW25dWzFdKTtcclxuICAgICAgICB0aGlzLm9uc1tmbmFtZV1bbl1bMV0ocGFyYW1zKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL2xpYlwiKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybihzZWxmLCBjYWxsKSB7IGlmICghc2VsZikgeyB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7IH0gcmV0dXJuIGNhbGwgJiYgKHR5cGVvZiBjYWxsID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBjYWxsID09PSBcImZ1bmN0aW9uXCIpID8gY2FsbCA6IHNlbGY7IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgXCIgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9XG5cbnZhciBldmVudHMgPSByZXF1aXJlKFwiZXZlbnRzXCIpO1xudmFyIGRlZmF1bHRzID0gcmVxdWlyZShcIi4vdXRpbHMvZGVmYXVsdHNcIik7XG52YXIgZGVmYXVsdENvbnRleHQgPSByZXF1aXJlKFwiLi9kZWZhdWx0Q29udGV4dFwiKTtcblxudmFyIFdlYkF1ZGlvU2NoZWR1bGVyID0gZnVuY3Rpb24gKF9ldmVudHMkRXZlbnRFbWl0dGVyKSB7XG4gIF9pbmhlcml0cyhXZWJBdWRpb1NjaGVkdWxlciwgX2V2ZW50cyRFdmVudEVtaXR0ZXIpO1xuXG4gIGZ1bmN0aW9uIFdlYkF1ZGlvU2NoZWR1bGVyKG9wdHMpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgV2ViQXVkaW9TY2hlZHVsZXIpO1xuXG4gICAgb3B0cyA9IG9wdHMgfHwgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi97fTtcblxuICAgIHZhciBfdGhpcyA9IF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIChXZWJBdWRpb1NjaGVkdWxlci5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKFdlYkF1ZGlvU2NoZWR1bGVyKSkuY2FsbCh0aGlzKSk7XG5cbiAgICBfdGhpcy5jb250ZXh0ID0gZGVmYXVsdHMob3B0cy5jb250ZXh0LCBkZWZhdWx0Q29udGV4dCk7XG4gICAgX3RoaXMuaW50ZXJ2YWwgPSBkZWZhdWx0cyhvcHRzLmludGVydmFsLCAwLjAyNSk7XG4gICAgX3RoaXMuYWhlYWRUaW1lID0gZGVmYXVsdHMob3B0cy5haGVhZFRpbWUsIDAuMSk7XG4gICAgX3RoaXMudGltZXJBUEkgPSBkZWZhdWx0cyhvcHRzLnRpbWVyQVBJLCBnbG9iYWwpO1xuICAgIF90aGlzLnBsYXliYWNrVGltZSA9IF90aGlzLmN1cnJlbnRUaW1lO1xuXG4gICAgX3RoaXMuX3RpbWVySWQgPSAwO1xuICAgIF90aGlzLl9zY2hlZElkID0gMDtcbiAgICBfdGhpcy5fc2NoZWRzID0gW107XG4gICAgcmV0dXJuIF90aGlzO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKFdlYkF1ZGlvU2NoZWR1bGVyLCBbe1xuICAgIGtleTogXCJzdGFydFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzdGFydChjYWxsYmFjaywgYXJncykge1xuICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgIHZhciBsb29wID0gZnVuY3Rpb24gbG9vcCgpIHtcbiAgICAgICAgdmFyIHQwID0gX3RoaXMyLmNvbnRleHQuY3VycmVudFRpbWU7XG4gICAgICAgIHZhciB0MSA9IHQwICsgX3RoaXMyLmFoZWFkVGltZTtcblxuICAgICAgICBfdGhpczIuX3Byb2Nlc3ModDAsIHQxKTtcbiAgICAgIH07XG5cbiAgICAgIGlmICh0aGlzLl90aW1lcklkID09PSAwKSB7XG4gICAgICAgIHRoaXMuX3RpbWVySWQgPSB0aGlzLnRpbWVyQVBJLnNldEludGVydmFsKGxvb3AsIHRoaXMuaW50ZXJ2YWwgKiAxMDAwKTtcblxuICAgICAgICB0aGlzLmVtaXQoXCJzdGFydFwiKTtcblxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICB0aGlzLmluc2VydCh0aGlzLmNvbnRleHQuY3VycmVudFRpbWUsIGNhbGxiYWNrLCBhcmdzKTtcbiAgICAgICAgICBsb29wKCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5pbnNlcnQodGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lLCBjYWxsYmFjaywgYXJncyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJzdG9wXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHN0b3AoKSB7XG4gICAgICB2YXIgcmVzZXQgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB0cnVlIDogYXJndW1lbnRzWzBdO1xuXG4gICAgICBpZiAodGhpcy5fdGltZXJJZCAhPT0gMCkge1xuICAgICAgICB0aGlzLnRpbWVyQVBJLmNsZWFySW50ZXJ2YWwodGhpcy5fdGltZXJJZCk7XG4gICAgICAgIHRoaXMuX3RpbWVySWQgPSAwO1xuXG4gICAgICAgIHRoaXMuZW1pdChcInN0b3BcIik7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXNldCkge1xuICAgICAgICB0aGlzLl9zY2hlZHMuc3BsaWNlKDApO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiaW5zZXJ0XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGluc2VydCh0aW1lLCBjYWxsYmFjaywgYXJncykge1xuICAgICAgdmFyIGlkID0gKyt0aGlzLl9zY2hlZElkO1xuICAgICAgdmFyIGV2ZW50ID0geyBpZDogaWQsIHRpbWU6IHRpbWUsIGNhbGxiYWNrOiBjYWxsYmFjaywgYXJnczogYXJncyB9O1xuICAgICAgdmFyIHNjaGVkcyA9IHRoaXMuX3NjaGVkcztcblxuICAgICAgaWYgKHNjaGVkcy5sZW5ndGggPT09IDAgfHwgc2NoZWRzW3NjaGVkcy5sZW5ndGggLSAxXS50aW1lIDw9IHRpbWUpIHtcbiAgICAgICAgc2NoZWRzLnB1c2goZXZlbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGltYXggPSBzY2hlZHMubGVuZ3RoOyBpIDwgaW1heDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHRpbWUgPCBzY2hlZHNbaV0udGltZSkge1xuICAgICAgICAgICAgc2NoZWRzLnNwbGljZShpLCAwLCBldmVudCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGlkO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJuZXh0VGlja1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBuZXh0VGljayh0aW1lLCBjYWxsYmFjaywgYXJncykge1xuICAgICAgaWYgKHR5cGVvZiB0aW1lID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgYXJncyA9IGNhbGxiYWNrO1xuICAgICAgICBjYWxsYmFjayA9IHRpbWU7XG4gICAgICAgIHRpbWUgPSB0aGlzLnBsYXliYWNrVGltZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuaW5zZXJ0KHRpbWUgKyB0aGlzLmFoZWFkVGltZSwgY2FsbGJhY2ssIGFyZ3MpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJyZW1vdmVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVtb3ZlKHNjaGVkSWQpIHtcbiAgICAgIHZhciBzY2hlZHMgPSB0aGlzLl9zY2hlZHM7XG5cbiAgICAgIGlmICh0eXBlb2Ygc2NoZWRJZCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaW1heCA9IHNjaGVkcy5sZW5ndGg7IGkgPCBpbWF4OyBpKyspIHtcbiAgICAgICAgICBpZiAoc2NoZWRJZCA9PT0gc2NoZWRzW2ldLmlkKSB7XG4gICAgICAgICAgICBzY2hlZHMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzY2hlZElkO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJyZW1vdmVBbGxcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVtb3ZlQWxsKCkge1xuICAgICAgdGhpcy5fc2NoZWRzLnNwbGljZSgwKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiX3Byb2Nlc3NcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gX3Byb2Nlc3ModDAsIHQxKSB7XG4gICAgICB2YXIgc2NoZWRzID0gdGhpcy5fc2NoZWRzO1xuICAgICAgdmFyIHBsYXliYWNrVGltZSA9IHQwO1xuXG4gICAgICB0aGlzLnBsYXliYWNrVGltZSA9IHBsYXliYWNrVGltZTtcbiAgICAgIHRoaXMuZW1pdChcInByb2Nlc3NcIiwgeyBwbGF5YmFja1RpbWU6IHBsYXliYWNrVGltZSB9KTtcblxuICAgICAgd2hpbGUgKHNjaGVkcy5sZW5ndGggJiYgc2NoZWRzWzBdLnRpbWUgPCB0MSkge1xuICAgICAgICB2YXIgZXZlbnQgPSBzY2hlZHMuc2hpZnQoKTtcbiAgICAgICAgdmFyIF9wbGF5YmFja1RpbWUgPSBldmVudC50aW1lO1xuICAgICAgICB2YXIgYXJncyA9IGV2ZW50LmFyZ3M7XG5cbiAgICAgICAgdGhpcy5wbGF5YmFja1RpbWUgPSBfcGxheWJhY2tUaW1lO1xuXG4gICAgICAgIGV2ZW50LmNhbGxiYWNrKHsgcGxheWJhY2tUaW1lOiBfcGxheWJhY2tUaW1lLCBhcmdzOiBhcmdzIH0pO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnBsYXliYWNrVGltZSA9IHBsYXliYWNrVGltZTtcbiAgICAgIHRoaXMuZW1pdChcInByb2Nlc3NlZFwiLCB7IHBsYXliYWNrVGltZTogcGxheWJhY2tUaW1lIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJzdGF0ZVwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3RpbWVySWQgIT09IDAgPyBcInJ1bm5pbmdcIiA6IFwic3VzcGVuZGVkXCI7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImN1cnJlbnRUaW1lXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJldmVudHNcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9zY2hlZHMuc2xpY2UoKTtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gV2ViQXVkaW9TY2hlZHVsZXI7XG59KGV2ZW50cy5FdmVudEVtaXR0ZXIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFdlYkF1ZGlvU2NoZWR1bGVyOyIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0IGN1cnJlbnRUaW1lKCkge1xuICAgIHJldHVybiBEYXRlLm5vdygpIC8gMTAwMDtcbiAgfVxufTsiLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9XZWJBdWRpb1NjaGVkdWxlclwiKTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gZGVmYXVsdHModmFsdWUsIGRlZmF1bHRWYWx1ZSkge1xuICByZXR1cm4gdmFsdWUgIT09IHVuZGVmaW5lZCA/IHZhbHVlIDogZGVmYXVsdFZhbHVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRlZmF1bHRzOyIsInZhciBjb21wb25lbnRCYXNlPXJlcXVpcmUoJy4vY29tcG9uZW50QmFzZScpO1xyXG52YXIgc3luY21hbixtb3VzZTtcclxuZXhwb3J0cy5lbmFibGU9ZnVuY3Rpb24oZ2xvYmFscyl7XHJcbiAgc3luY21hbj1nbG9iYWxzLnN5bmNtYW47XHJcbiAgbW91c2U9Z2xvYmFscy5tb3VzZTtcclxuICBjb21wb25lbnRCYXNlPWNvbXBvbmVudEJhc2UuZ2V0KHtzeW5jbWFuOnN5bmNtYW4sbW91c2U6bW91c2V9KTtcclxuICByZXR1cm4gQnV0dG9uO1xyXG59XHJcbmZ1bmN0aW9uIEJ1dHRvbihwYXJlbnQsb3B0aW9ucyl7XHJcbiAgdGhpcy5uYW1lPVwiYnV0dG9uXCI7XHJcbiAgY29tcG9uZW50QmFzZS5jYWxsKHRoaXMscGFyZW50LG9wdGlvbnMpO1xyXG4gIC8vbXkgcmVmZXJlbmNlIG51bWJlciBmb3IgZGF0YSBiaW5kaW5nLiBXaXRoIHRoaXMgbnVtYmVyIHRoZSBzb2NrZXQgYmluZGVyIGtub3dzIHdobyBpcyB0aGUgcmVjaWV2ZXIgb2YgdGhlIGRhdGEsIGFuZCBhbHNvIHdpdGggd2hhdCBuYW1lIHRvIHNlbmQgaXRcclxuICAvL3BlbmRhbnQ6IHRoaXMgY2FuIHBvdGVudGlhbGx5IGNyZWF0ZSBhIHByb2JsZW0sIGJlY2F1c2UgdHdvIG9iamVjdHMgY2FuIGJlIGNyZWF0ZWQgc2ltdWx0YW5lb3VzbHkgYXQgZGlmZmVyZW50IGVuZHMgYXQgdGhlIHNhbWUgdGltZS5cclxuICAvL21heWJlIGluc3RlYWQgb2YgdGhlIHNpbXBsZSBwdXNoLCB0aGVyZSBjb3VsZCBiZSBhIGNhbGxiYWNrLCBhZG4gdGhlIG9iamVjdCB3YWl0cyB0byByZWNlaXZlIGl0J3Mgc29ja2V0IGlkIG9uY2UgaXRzIGNyZWF0aW9uIHdhcyBwcm9wYWdhdGVkIHRocm91Z2hvdXQgYWxsIHRoZSBuZXR3b3JrLCBvciBtYXliZSB0aGVyZSBpcyBhbiBhcnJheSBmb3Igc2VudGluZyBhbmQgb3RoZXIgZGlmZmVyZW50IGZvciByZWNlaXZpbmcuLi4gZmlyc3Qgb3B0aW9uIHNlZW1zIG1vcmUgc2Vuc2libGVcclxuICB0aGlzLmRhdGE9e3ZhbHVlOjB9O1xyXG4gIHRoaXMuc3RhdGVzPWZhbHNlO1xyXG4gIHRoaXMuX2JpbmROPXN5bmNtYW4uYmluZExpc3QucHVzaCh0aGlzKS0xO1xyXG4gIC8vdGhpcy4kanE9JCgnPGRpdiBjbGFzcz1cIm1zLWJ1dHRvblwiPjwvZGl2PicpO1xyXG4gIHRoaXMubGFiZWw9b3B0aW9ucy5sYWJlbHx8XCLimLtcIjtcclxuICB0aGlzLiRqcS5hcHBlbmQodGhpcy4kZmFkZXJqcSk7XHJcbiAgdGhpcy4kanEuaHRtbCh0aGlzLmxhYmVsKTtcclxuICAvLyBpZihvcHRpb25zLmNzcylcclxuICAvLyAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgLy8gdGhpcy5jc3M9ZnVuY3Rpb24oY3NzKXtcclxuICAvLyAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgLy8gICByZXR1cm4gdGhpcztcclxuICAvLyB9XHJcbiAgLy9pZiBhIHN3aXRjaCB2YXJpYWJsZSBpcyBwYXNzZWQsIHRoaXMgYnV0dG9uIHdpbGwgc3dpdGNoIG9uIGVhY2ggY2xpY2sgYW1vbmcgdGhlIHN0YXRlZCBzdGF0ZXNcclxuICBpZihvcHRpb25zLmhhc093blByb3BlcnR5KFwic3dpdGNoXCIpKXtcclxuICAgIHRoaXMuc3RhdGVzPVtdO1xyXG4gICAgdGhpcy5kYXRhLmN1cnJlbnRTdGF0ZT0wO1xyXG4gICAgdGhpcy5zdGF0ZXM9b3B0aW9ucy5zd2l0Y2g7XHJcbiAgICB0aGlzLnN3aXRjaFN0YXRlKDApO1xyXG4gIH1cclxuICB0aGlzLm9uQ2xpY2tDYWxsYmFjaz1mdW5jdGlvbigpe307XHJcbiAgdGhpcy5vblJlbGVhc2VDYWxsYmFjaz1mdW5jdGlvbigpe307XHJcbiAgLy9wZW5kYW50OiB0aGlzIHNob3VsZCBiZSBwYXJ0IG9mIGEgYmFzZSBwcm90b3R5cGUsIG5vdCByZXBlYXRlZCBpbiBlYWNoIHR5cGVcclxuICAvLyBpZih0eXBlb2YgKHBhcmVudC5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAvLyAgIHBhcmVudC5hcHBlbmQodGhpcy4kanEpO1xyXG4gIC8vIH1lbHNlIGlmKHR5cGVvZiAocGFyZW50LiRqcS5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAvLyAgIHBhcmVudC4kanEuYXBwZW5kKHRoaXMuJGpxKTtcclxuICAvLyB9ZWxzZXtcclxuICAvLyAgIGNvbnNvbGUubG9nKFwiYSBzbGlkZXIgY291bGRuJ3QgZmluZCBkb20gZWxlbWVudCB0byBhdHRhY2ggaGltc2VsZlwiKTtcclxuICAvLyB9XHJcbiAgdmFyIG1lPXRoaXM7XHJcbiAgLy8gdGhpcy5vbkNoYW5nZT1mdW5jdGlvbihjYWxsYmFjayl7XHJcbiAgLy8gICBtZS5vbkNsaWNrQ2FsbGJhY2s9ZnVuY3Rpb24oKXtjYWxsYmFjayhtZS5kYXRhKX07XHJcbiAgLy8gICByZXR1cm4gdGhpcztcclxuICAvLyB9XHJcblxyXG4gIHRoaXMuJGpxLm9uKFwibW91c2Vkb3duIHRhcCB0b3VjaHN0YXJ0XCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgbWUub25DbGlja0NhbGxiYWNrKG1lLmRhdGEpO1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIG1lLnN3aXRjaFN0YXRlKCk7XHJcbiAgICBtZS5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcclxuICB9KTtcclxuICB0aGlzLiRqcS5vbihcIm1vdXNldXAgbW91c2VsZWF2ZVwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIG1lLm9uUmVsZWFzZUNhbGxiYWNrKG1lLmRhdGEpO1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIG1lLnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5cclxuQnV0dG9uLnByb3RvdHlwZS5vbkNsaWNrPWZ1bmN0aW9uKGNhbGxiYWNrKXtcclxuICB0aGlzLm9uQ2xpY2tDYWxsYmFjaz1jYWxsYmFjaztcclxuICByZXR1cm4gdGhpcztcclxufVxyXG5CdXR0b24ucHJvdG90eXBlLm9uUmVsZWFzZT1mdW5jdGlvbihjYWxsYmFjayl7XHJcbiAgdGhpcy5vblJlbGVhc2VDYWxsYmFjaz1jYWxsYmFjaztcclxuICByZXR1cm4gdGhpcztcclxufVxyXG5CdXR0b24ucHJvdG90eXBlLnN3aXRjaFN0YXRlPWZ1bmN0aW9uKHRvKXtcclxuICBpZih0aGlzLnN0YXRlcyl7XHJcbiAgICAvL2NoYW5nZSBzdGF0ZSBudW1iZXIgdG8gbmV4dFxyXG4gICAgaWYodG8pe1xyXG4gICAgICB0aGlzLmRhdGEuY3VycmVudFN0YXRlPXRvJXRoaXMuc3RhdGVzLmxlbmd0aDtcclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLmRhdGEuY3VycmVudFN0YXRlPSh0aGlzLmRhdGEuY3VycmVudFN0YXRlKzEpJXRoaXMuc3RhdGVzLmxlbmd0aDtcclxuICAgIH1cclxuICAgIC8vYXBwbHkgYWxsIHRoZSBwcm9wZXJ0aWVzIHRoYXQgdGhlIHN0YXRlIGNhcnJ5LiBUaGlzIG1ha2VzIHRoZSBidXR0b24gc3VwZXIgaGFja2FibGVcclxuICAgIGZvcihhIGluIHRoaXMuc3RhdGVzW3RoaXMuZGF0YS5jdXJyZW50U3RhdGVdKXtcclxuICAgICAgdGhpc1thXT10aGlzLnN0YXRlc1t0aGlzLmRhdGEuY3VycmVudFN0YXRlXVthXTtcclxuICAgICAgLy8gY29uc29sZS5sb2coXCJbXCIrYStcIl1cIix0aGlzW2FdKTtcclxuICAgIH1cclxuICB9XHJcbiAgdGhpcy51cGRhdGVEb20oKTtcclxufVxyXG4iLCJcclxudmFyIHN5bmNtYW4sbW91c2UsYXVkaW9Db250ZXh0O1xyXG52YXIgT0g9cmVxdWlyZShcIm9uaGFuZGxlcnNcIik7XHJcbnZhciBUaW1lcj1yZXF1aXJlKFwid2ViLWF1ZGlvLXNjaGVkdWxlclwiKTtcclxuZXhwb3J0cy5lbmFibGU9ZnVuY3Rpb24oZ2xvYmFscyl7XHJcbiAgY29uc29sZS5sb2coXCJ0aW1lclwiLFRpbWVyKTtcclxuICBzeW5jbWFuPWdsb2JhbHMuc3luY21hbjtcclxuICBtb3VzZT1nbG9iYWxzLm1vdXNlO1xyXG4gIGF1ZGlvQ29udGV4dD1nbG9iYWxzLmF1ZGlvQ29udGV4dDtcclxuICByZXR1cm4gQ2xvY2s7XHJcbn07XHJcbmZ1bmN0aW9uIENsb2NrKHBhcmVudCxvcHRpb25zKXtcclxuXHJcbiAgdmFyIGRlZmF1bHRzPXtcclxuICAgIGludGVydmFsOjAuMVxyXG4gIH1cclxuICB0aGlzLmN1cnJlbnRTdGVwPTA7XHJcbiAgdGhpcy5uYW1lPVwiY2xvY2tcIjtcclxuICBPSC5jYWxsKHRoaXMpO1xyXG4gIHZhciB0aGlzQ2xvY2s9dGhpcztcclxuICB0aGlzLmRhdGE9e3ZhbHVlOjB9O1xyXG4gIHRoaXMuc3RhdGVzPWZhbHNlO1xyXG4gIHRoaXMuX2JpbmROPXN5bmNtYW4uYmluZExpc3QucHVzaCh0aGlzKS0xO1xyXG4gIHRoaXMuJGpxPSQoJzxkaXYgY2xhc3M9XCJtcy1jbG9jayBtcy1idXR0b25cIj48L2Rpdj4nKTtcclxuICB0aGlzLmxhYmVsPW9wdGlvbnMubGFiZWx8fCfiiIYnO1xyXG4gIHRoaXMuJGpxLmFwcGVuZCh0aGlzLiRmYWRlcmpxKTtcclxuICB0aGlzLiRqcS5odG1sKHRoaXMubGFiZWwpO1xyXG4gIGlmKG9wdGlvbnMuY3NzKVxyXG4gICAgdGhpcy4kanEuY3NzKG9wdGlvbnMuY3NzKTtcclxuICB0aGlzLmNzcz1mdW5jdGlvbihjc3Mpe1xyXG4gICAgdGhpcy4kanEuY3NzKG9wdGlvbnMuY3NzKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuICAvL3RoaXMgc2hvdWxkIGdvIGluIGNvbXBvbmVudEJhc2UuIEl0IGFwcGxpZXMgb3B0aW9ucyBvciBkZWZhdWx0cy5cclxuICBpZighb3B0aW9ucylcclxuICBvcHRpb25zPXt9O1xyXG4gIGZvcih2YXIgYSBpbiBkZWZhdWx0cyl7XHJcbiAgICBpZighb3B0aW9uc1thXSlcclxuICAgIG9wdGlvbnNbYV09ZGVmYXVsdHNbYV07XHJcbiAgfVxyXG4gIC8vcGVuZGFudDogdGhpcyBzaG91bGQgYmUgcGFydCBvZiBhIGJhc2UgcHJvdG90eXBlLCBub3QgcmVwZWF0ZWQgaW4gZWFjaCB0eXBlXHJcbiAgaWYodHlwZW9mIChwYXJlbnQuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgICBwYXJlbnQuYXBwZW5kKHRoaXMuJGpxKTtcclxuICB9ZWxzZSBpZih0eXBlb2YgKHBhcmVudC4kanEuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgICBwYXJlbnQuJGpxLmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgfWVsc2V7XHJcbiAgICBjb25zb2xlLmxvZyhcImEgY2xvY2sgY291bGRuJ3QgZmluZCBkb20gZWxlbWVudCB0byBhdHRhY2ggaGltc2VsZlwiKTtcclxuICB9XHJcbiAgdmFyIG1lPXRoaXM7XHJcblxyXG4gIHRoaXMudGltZXIgPSBuZXcgVGltZXIoeyBjb250ZXh0OiBhdWRpb0NvbnRleHQgfSk7XHJcbiAgdmFyIGludGVydmFsSGFuZGxlO1xyXG4gIC8vdGhlIGN1cnJlbnQgdGltZXIgdGVjaG5vbG9neSBkb2Vzbid0IG1ha2UgaW50ZXJ2YWwgYnV0IHJhdGhlciBzY2hlZHVsZXMgYWhlYWQsIHRodXMgdGhlc2UgdmFyczpcclxuICB2YXIgbGFzdFRpbWVyU2NoZWR1bGVkPTA7XHJcbiAgdmFyIGxhc3RUaW1lckV4ZWN1dGVkPTA7XHJcbiAgdmFyIGNyZWF0ZUZ1cnRoZXJUaW1lclNjaGVkdWxlcz1mdW5jdGlvbihob3dNYW55KXtcclxuICAgIHZhciBhZGRVcFRvPWxhc3RUaW1lclNjaGVkdWxlZCtob3dNYW55O1xyXG4gICAgZm9yKGxhc3RUaW1lclNjaGVkdWxlZDsgbGFzdFRpbWVyU2NoZWR1bGVkPGFkZFVwVG87IGxhc3RUaW1lclNjaGVkdWxlZCsrKVxyXG4gICAgbWUudGltZXIuaW5zZXJ0KG9wdGlvbnMuaW50ZXJ2YWwqbGFzdFRpbWVyU2NoZWR1bGVkLCBtZS50aWNrLHt0aWNrbjpsYXN0VGltZXJTY2hlZHVsZWR9KTtcclxuICB9XHJcbiAgdGhpcy50aWNrPWZ1bmN0aW9uKGEpe1xyXG4gICAgbGFzdFRpbWVyRXhlY3V0ZWQrKztcclxuICAgIGNyZWF0ZUZ1cnRoZXJUaW1lclNjaGVkdWxlcyg0KTtcclxuICAgIHRoaXNDbG9jay5oYW5kbGUoXCJ0aWNrXCIpO1xyXG4gICAgdGhpc0Nsb2NrLmFkZENsYXNzKFwidGlja1wiKTtcclxuICAgIC8vIGNvbnNvbGUubG9nKFwidGlja1wiKTtcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXt0aGlzQ2xvY2sucmVtb3ZlQ2xhc3MoXCJ0aWNrXCIpO30sMjApO1xyXG4gICAgdGhpcy5jdXJyZW50U3RlcCsrO1xyXG4gIH1cclxuICB0aGlzLnN0YXJ0PWZ1bmN0aW9uKCl7XHJcbiAgICAvLyBjb25zb2xlLmxvZyhvcHRpb25zLmludGVydmFsKTtcclxuICAgIGNyZWF0ZUZ1cnRoZXJUaW1lclNjaGVkdWxlcyg0KTtcclxuICAgIHRoaXMudGltZXIuc3RhcnQoKTtcclxuICAgIC8vaW50ZXJ2YWxIYW5kbGU9d2luZG93LnNldEludGVydmFsKHRoaXMudGljayxvcHRpb25zLmludGVydmFsfDEpO1xyXG4gIH1cclxuICB0aGlzLnN0b3A9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMudGltZXIuc3RvcCgpO1xyXG4gICAgLy8vdGhpcy50aW1lci5yZW1vdmUoaW50ZXJ2YWxIYW5kbGUpO1xyXG4gICAgLy93aW5kb3cuY2xlYXJJbnRlcnZhbChpbnRlcnZhbEhhbmRsZSk7XHJcbiAgfVxyXG4gIGlmKG9wdGlvbnMuc3RhcnQpXHJcbiAgdGhpcy5zdGFydCgpO1xyXG5cclxufVxyXG5cclxuQ2xvY2sucHJvdG90eXBlLnVwZGF0ZURvbT1mdW5jdGlvbigpe1xyXG4gIHRoaXMuJGpxLmh0bWwodGhpcy5sYWJlbCk7XHJcbn1cclxuXHJcblxyXG5cclxuLy9hbGlhc2luZyBvZiB0aGVzZSB0d28gaGFuZHkgZnVuY3Rpb25cclxuQ2xvY2sucHJvdG90eXBlLmFkZENsYXNzPWZ1bmN0aW9uKHRvKXtcclxuICB0aGlzLiRqcS5hZGRDbGFzcyh0byk7XHJcbn1cclxuQ2xvY2sucHJvdG90eXBlLnJlbW92ZUNsYXNzPWZ1bmN0aW9uKHRvKXtcclxuICB0aGlzLiRqcS5yZW1vdmVDbGFzcyh0byk7XHJcbn0iLCJ2YXIgY29tcG9uZW50QmFzZT1yZXF1aXJlKCcuL2NvbXBvbmVudEJhc2UnKTtcclxubGV0IGVlbWl0ZXI9cmVxdWlyZSgnb25oYW5kbGVycycpO1xyXG52YXIgc3luY21hbixtb3VzZTtcclxuZXhwb3J0cy5lbmFibGU9ZnVuY3Rpb24oZ2xvYmFscyl7XHJcbiAgc3luY21hbj1nbG9iYWxzLnN5bmNtYW47XHJcbiAgbW91c2U9Z2xvYmFscy5tb3VzZTtcclxuICBjb21wb25lbnRCYXNlPWNvbXBvbmVudEJhc2UuZ2V0KHtzeW5jbWFuOnN5bmNtYW4sbW91c2U6bW91c2V9KTtcclxuICByZXR1cm4gU2VxdWVuY2VyO1xyXG59XHJcbi8qKlxyXG4gKiBBIGdlbmVyYXRvciBvZiBzZXF1ZW5jZXJzXHJcbiAqXHJcbiAqIEBjbGFzcyBTZXF1ZW5jZXJcclxuICogQGNvbnN0cnVjdG9yIG5ldyBNc0NvbXBvbmVudHMuU2VxdWVuY2VyKERPTS8kanF1ZXJ5IGVsZW1lbnQse3Byb3BlcnRpZXN9KVxyXG4gKi9cclxuIC8vZGVmaW5lcyBhbGwgdGhlIHNlcXVlbmNlciBwYXJhbWV0ZXJzIGJ5IG1hdGgsXHJcbiAvL21heWJlIGluIGEgZnVudHVyZSBieSBzdHlsaW5nIHRhYmxlXHJcbnZhciBzZXFQcm9nPTQ7XHJcbmZ1bmN0aW9uIFNlcXVlbmNlcihwYXJlbnQsb3B0aW9ucyl7XHJcbiB2YXIgbj1vcHRpb25zLm58fDM7XHJcbiB2YXIgdGhpc1NlcXVlbmNlcj10aGlzO1xyXG4gdGhpcy5uYW1lPVwic2VxdWVuY2VyXCJcclxuIGNvbXBvbmVudEJhc2UuY2FsbCh0aGlzLHBhcmVudCxvcHRpb25zKTtcclxuIC8vIHRoaXMuJGpxPSQoJzxkaXYgY2xhc3M9XCJzZXF1ZW5jZXJcIiBpZD1cInNlcV8nK24rJ1wiPjxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGVcIj48L3A+PC9kaXY+Jyk7XHJcbiBwYXJlbnQuYXBwZW5kKHRoaXMuJGpxKTtcclxuIHRoaXMuYWxpdmU9ZmFsc2U7XHJcbiB0aGlzLl9iaW5kTj1zeW5jbWFuLmJpbmRMaXN0LnB1c2godGhpcyktMTtcclxuIHRoaXMucG9zPTA7XHJcbiB0aGlzLmRhdGE9W107XHJcbiAvKipcclxuICAqIEBwYXJhbSBsZW5cclxuICAqaG93IG1hbnkgc3RlcHMgdGhlIHNlcXVlbmNlciBoYXNcclxuICAqIEBhbGlhcyBsZW5ndGhcclxuICAqL1xyXG4gdGhpcy5sZW49b3B0aW9ucy5sZW58b3B0aW9ucy5sZW5ndGh8TWF0aC5wb3coMiwoc2VxUHJvZyU1KSsxKTtcclxuIC8qKlxyXG4gICogQHBhcmFtIGV2cnlcclxuICAqIGhvdyBtYW55IGNsb2NrIHN0ZXBzIG1ha2UgYSBzZXF1ZW5jZXIgc3RlcFxyXG4gICogQGFsaWFzIHN0ZXBEaXZpc2lvblxyXG4gICovXHJcbiB0aGlzLmV2cnk9b3B0aW9ucy5ldnJ5fG9wdGlvbnMuc3RlcERpdmlzaW9ufE1hdGgucG93KDIsKHNlcVByb2clNCkrMSk7XHJcbiAvL211c3QgY291bnQgYW4gW2V2ZXJ5XSBhbW91bnQgb2YgYmVhdHMgZm9yIGVhY2ggcG9zIGluY3JlbWVudC5cclxuIHRoaXMuc3VicG9zPTA7XHJcbiB0aGlzLiRqcS5jc3Moe3dpZHRoOjE2Kk1hdGguY2VpbCh0aGlzLmxlbi80KStcInB4XCJ9KTtcclxuIC8vdGhpcy4kanEuYWRkQ2xhc3MoXCJjb2xvcl9cIitzZXFQcm9nJWNoYW5uZWxzLmxlbmd0aCk7XHJcbiB0aGlzLmRpc3A9MDtcclxuIHRoaXMuaWQ9bjtcclxuIHRoaXMuYmVhdERpc3BsYWNlPTA7XHJcbiB2YXIgbWU9dGhpcztcclxuIHNlcVByb2crKztcclxuIC8vdGhpcy5jaGFubmVsPWNoYW5uZWxzW3RoaXMuaWQlY2hhbm5lbHMubGVuZ3RoXTtcclxuIGZvcih2YXIgYm49MDsgYm48dGhpcy5sZW47IGJuKyspe1xyXG4gICB0aGlzLmRhdGFbYm5dPW5ldyBTZXF1ZW5jZXJCdXR0b24oYm4sdGhpcylcclxuIH1cclxuIHRoaXMuYWxpdmVDaGlsZD0wO1xyXG4gdGhpcy5kaXNwbGFjZT0wO1xyXG4gdGhpcy5zZXREaXNwbGFjZT1mdW5jdGlvbih0by8qLGVtaXQqLyl7XHJcbiAgLy8gIGlmKGVtaXQ9PVwib25seVwiKXtcclxuICAgIC8vICBlbWl0PXRydWU7XHJcbiAgLy8gIH1lbHNle1xyXG4gICAgIHRoaXMuc3VicG9zPSgodGhpcy5jbG9jay5jdXJyZW50U3RlcCklKHRoaXMubGVuKnRoaXMuZXZyeSkpK3RvO1xyXG4gIC8vICB9XHJcbiAgLy8gIGlmKGVtaXQ9PXRydWUpe1xyXG4gIC8vICAgIHNvY2tDaGFuZ2UoXCJzZXE6XCIrbWUuX2JpbmROK1wiXCIsXCJkc3BsXCIsdG8pO1xyXG4gIC8vICB9XHJcbiB9XHJcbiB0aGlzLnN0ZXA9ZnVuY3Rpb24oKXtcclxuICAgdmFyIHByZXZhbGl2ZT10aGlzLmFsaXZlO1xyXG4gICB0aGlzLmFsaXZlPXRoaXMuYWxpdmVDaGlsZD4wO1xyXG4gIC8vICBjb25zb2xlLmxvZyh0aGlzLmFsaXZlQ2hpbGQpO1xyXG4gICBpZih0aGlzLmFsaXZlKXtcclxuICAgIC8vICBjb25zb2xlLmxvZyhcInNldGVcIik7XHJcbiAgICAgLy9pZiB0aGUgc3RhdGUgb2YgdGhpcy5hbGl2ZSBjaGFuZ2VzLCB3ZSBtdXN0IGVtaXQgdGhlIGRpc3BsYWNlbWVudCwgYmVjYXVzZSBpdCBpcyBuZXdcclxuICAgICBpZighcHJldmFsaXZlKXtcclxuICAgICAgIHRoaXMuZGlzcGxhY2U9KHRoaXMuY2xvY2suY3VycmVudFN0ZXArdGhpcy5zdWJwb3MpJSh0aGlzLmxlbip0aGlzLmV2cnkpO1xyXG4gICAgICAgLy9jb25zb2xlLmxvZyhcIm9rLiBlbWl0IGRpc3BsYWU6IFwiK3RoaXMuZGlzcGxhY2UpO1xyXG4gICAgICAgLy90aGlzLnNldERpc3BsYWNlKHRoaXMuZGlzcGxhY2UsXCJvbmx5XCIpO1xyXG4gICAgIH07XHJcbiAgICAgLy9lYWNoIHNlcXVlbmNlciBoYXMgYSBkaWZmZXJlbnQgc3BlZWQgcmF0ZXMuIHdoaWxlIHNvbWUgcGxheXMgb25lIHN0ZXAgcGVyIGNsaWNrLCBvdGhlcnMgd2lsbCBoYXZlIG9uZSBzdGVwIHBlciBzZXZlcmFsIGNsb2NrIHRpY2tzLlxyXG4gICAgIC8vdGhlIHNlcXVlbmNlciBzdGFydGluZyBwb2ludCBpcyBhbHNvIGRpc3BsYWNlZCwgYW5kIGl0IGRlcGVuZHMgb24gdGhlIHRpbWUgd2hlbiBpdCBnb3QgYWxpdmVkK2l0cyBwb3NpdGlvbiBhdCB0aGF0IG1vbWVudC5cclxuICAgICBpZih0aGlzLnN1YnBvcyV0aGlzLmV2cnk9PTApe1xyXG4gICAgICAgLy8gY29uc29sZS5sb2coXCJzcVwiK3RoaXMucG9zKTtcclxuICAgICAgIC8vIGRhdGE9e3NlcXVlbmNlcjp0aGlzLmlkLHBvczp0aGlzLnBvcyxzdGVwVmFsOnRoaXMuZGF0YVt0aGlzLnBvc10uZXZhbCgpfTtcclxuICAgICAgIC8vIHRoaXMub25TdGVwVHJpZ2dlcihkYXRhKTtcclxuICAgICAgIC8vIHN0ZXBGdW5jdGlvbihkYXRhKTtcclxuICAgICAgIHRoaXMucG9zPSh0aGlzLnN1YnBvcy90aGlzLmV2cnkpJSh0aGlzLmxlbik7XHJcbiAgICAgICB2YXIgdmw9dGhpcy5kYXRhW3RoaXMucG9zXS5ldmFsKCk7XHJcbiAgICAgICBpZih2bCl7XHJcbiAgICAgICAgIC8vIHRoaXMuY2hhbm5lbC5lbmdpbmUuc3RhcnQoMCx0aGlzLmNoYW5uZWwuc3RhcnRPZmZzZXQsdGhpcy5jaGFubmVsLmVuZFRpbWUpO1xyXG4gICAgICAgICAvL3NvLCB0aGlzIGlzIGNhbGxlZCBlbHNld2hlcmUgYXN3ZWxsbC4uLi4gdGhlIGNoYW5uZWwgc2hvdWxkIGhhdmUgYSB0cmlnZ2VyIGZ1bmN0aW9uXHJcbiAgICAgICAgLy8gIHZhciBsb29wU3RhcnQ9dGhpcy5jaGFubmVsLnN0YXJ0T2Zmc2V0O1xyXG4gICAgICAgIC8vICB2YXIgbG9vcEVuZD10aGlzLmNoYW5uZWwuZW5kVGltZTtcclxuICAgICAgICAvLyAgdGhpcy5jaGFubmVsLnNhbXBsZXIudHJpZ2dlckF0dGFjayhmYWxzZSwwLDEse3N0YXJ0Omxvb3BTdGFydCxlbmQ6bG9vcEVuZH0pO1xyXG4gICAgICAgIHRoaXMuaGFuZGxlKFwidHJpZ2dlclwiLHZsKTtcclxuICAgICAgIH1cclxuICAgICB9ZWxzZXtcclxuICAgICB9XHJcbiAgICAgLy93aGF0IGlzIG1vcmUgZWNvbm9taWM/P1xyXG4gICAgIC8vIHRoaXMuc3VicG9zPSh0aGlzLnN1YnBvcysxKSUodGhpcy5sZW4qdGhpcy5ldnJ5KTtcclxuICAgICAvL2kgZ3Vlc3MgdGhhdC4uIGJ1dCBpdCBjYW4gZ3JvdyBldGVybmFsbHlcclxuICAgICB0aGlzLnN1YnBvcysrO1xyXG4gICB9XHJcbiB9XHJcbiB0aGlzLnNldENsb2NrPWZ1bmN0aW9uKGNsb2NrLGRpdmlzaW9ucyl7XHJcbiAgIGlmKGRpdmlzaW9ucylcclxuICAgdGhpcy5ldnJ5PWRpdmlzaW9ucztcclxuICAgaWYoY2xvY2sub24pe1xyXG4gICAgIGNsb2NrLm9uKCd0aWNrJyxmdW5jdGlvbigpe3RoaXNTZXF1ZW5jZXIuc3RlcCgpfSk7XHJcbiAgICAgaWYoY2xvY2submFtZSE9XCJjbG9ja1wiKVxyXG4gICAgIGNvbnNvbGUud2FybihcInlvdSBzZXQgdGhlIGNsb2NrIG9mIGEgc2VxdWVuY2VyIHRvIHNvbWVodGluZyB0aGF0IGlzIG5vdCBhIGNsb2NrLCBidXQgYSBcIitjbG9jay5uYW1lKTtcclxuICAgfWVsc2V7XHJcbiAgICAgY29uc29sZS53YXJuKFwieW91IHRyaWVkIHRvIGNvbm5lY3QgYSBcIit0aGlzLm5hbWUrXCIgdG8gYW4gb2JqZWN0IHRoYXQgaGFzIG5vIGV2ZW50IGhhbmxlcnMgXCIpO1xyXG4gICB9XHJcbiAgIHRoaXMuY2xvY2s9Y2xvY2s7XHJcbiB9XHJcbiB0aGlzLmRpZT1mdW5jdGlvbigpe1xyXG4gICBmb3IodmFyIGJuIGluIHRoaXMuZGF0YSl7XHJcbiAgICAgdGhpcy5kYXRhW2JuXS5zZXREYXRhKDApO1xyXG4gICB9XHJcbiAgIHRoaXMuYWxpdmU9ZmFsc2U7XHJcbiAgIHRoaXMuJGpxLmRldGFjaCgpO1xyXG4gfVxyXG4gLy8gdGhpcy5vblN0ZXBUcmlnZ2VyPWZ1bmN0aW9uKGRhdGEpe1xyXG4gLy8gICAvLyBjb25zb2xlLmxvZyhkYXRhKTtcclxuIC8vIH1cclxuIC8vIHRoaXMuJGpxLm9uKFwibW91c2VlbnRlclwiLGZ1bmN0aW9uKCl7XHJcbiAvLyAgIGZvY3VzQ2hhbm5lbChtZS5jaGFubmVsLmlkKTtcclxuIC8vIH0pO1xyXG4gcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFNlcXVlbmNlckJ1dHRvbihuLHBhcmVudCl7XHJcbiAgZWVtaXRlci5jYWxsKHRoaXMpO1xyXG4gIHRoaXMub24oXCJ0ZXN0XCIsZnVuY3Rpb24oKXtjb25zb2xlLmxvZyhcIndvcmtzIVwiKX0pO1xyXG4gIHRoaXMuaGFuZGxlKFwidGVzdFwiKTtcclxuICB0aGlzLiRqcT0kKCc8ZGl2IGNsYXNzPVwic2VxYnV0dG9uXCI+PC9kaXY+Jyk7XHJcbiAgdGhpcy5fYmluZE49c3luY21hbi5iaW5kTGlzdC5wdXNoKHRoaXMpLTE7XHJcbiAgcGFyZW50LiRqcS5hcHBlbmQodGhpcy4kanEpO1xyXG4gIHRoaXMuZGF0YT0wO1xyXG4gIC8vcGVuZGFudDogZXZhbHVhdGUgd2V0aGVyIHRoZSB2YXIgbiBpcyBzdGlsbCB1c2VmdWwuIHJlbW92ZSBpdCBhdCBldmVyeSBlbmQuXHJcbiAgdGhpcy5uPW47XHJcbiAgdmFyIG1lPXRoaXM7XHJcbiAgdGhpcy5zZXREYXRhPWZ1bmN0aW9uKHRvLGVtaXQpe1xyXG4gICAgLy8gaWYoZW1pdD09dHJ1ZSl7XHJcbiAgICAvLyAgIHNvY2tDaGFuZ2UoXCJzZXFiOlwiK21lLl9iaW5kTitcIlwiLFwic1ZcIix0byk7XHJcbiAgICAvLyB9XHJcbiAgICAvLyBjb25zb2xlLmxvZyhcInNkYXRhXCIpO1xyXG4gICAgLy9zb2NrZXQgbWF5IHNldCBkYXRhIHRvIDAgd2hlbiBpcyBhbHJlYWR5IDAsIGdlbmVyYXRpbmcgZGlzcGxhY2Ugb2YgcGFyZW50J3MgYWxpdmVkaGlsZFxyXG4gICAgaWYodG8hPXRoaXMuZGF0YSl7XHJcbiAgICAgIGlmKHRvPT0xKXtcclxuICAgICAgICB0aGlzLmRhdGE9MTtcclxuICAgICAgICB0aGlzLiRqcS5hZGRDbGFzcyhcIm9uXCIpO1xyXG4gICAgICAgIHBhcmVudC5hbGl2ZUNoaWxkKys7XHJcbiAgICAgIH1cclxuICAgICAgaWYodG89PTApe1xyXG4gICAgICAgIHRoaXMuZGF0YT0wO1xyXG4gICAgICAgIHRoaXMuJGpxLnJlbW92ZUNsYXNzKFwib25cIik7XHJcbiAgICAgICAgcGFyZW50LmFsaXZlQ2hpbGQtLTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gY29uc29sZS5sb2cocGFyZW50LmFsaXZlQ2hpbGQpO1xyXG4gICAgLy8gY29uc29sZS5sb2cocGFyZW50LmFsaXZlQ2hpbGQpO1xyXG4gIH1cclxuICB0aGlzLiRqcS5vbihcIm1vdXNlZG93biB0YXAgdG91Y2hzdGFydFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBtZS5zZXREYXRhKE1hdGguYWJzKG1lLmRhdGEtMSksdHJ1ZSk7XHJcbiAgICAvLyBtZS5kYXRhPTtcclxuICAgIGlmKG1lLmRhdGE9PTEpe1xyXG4gICAgICAgbW91c2Uuc3dpdGNoaW5nPXRydWU7XHJcbiAgICB9ZWxzZXtcclxuICAgIC8vICAgJCh0aGlzKS5yZW1vdmVDbGFzcyhcIm9uXCIpO1xyXG4gICAgLy8gICBwYXJlbnQuYWxpdmVDaGlsZC0tO1xyXG4gICAgICAgbW91c2Uuc3dpdGNoaW5nPWZhbHNlO1xyXG4gICAgIH1cclxuICB9KTtcclxuICB0aGlzLiRqcS5vbihcIm1vdXNlZW50ZXIgdG91Y2hlbnRlclwiLGZ1bmN0aW9uKCl7XHJcbiAgICBpZihtb3VzZS5idXR0b25Eb3duKXtcclxuICAgICAgaWYobW91c2Uuc3dpdGNoaW5nKXtcclxuICAgICAgICBpZihtZS5kYXRhPT0wKXtcclxuICAgICAgICAgIG1lLnNldERhdGEoMSx0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIGlmKG1lLmRhdGE9PTEpe1xyXG4gICAgICAgICAgbWUuc2V0RGF0YSgwLHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHRoaXMuZXZhbD1mdW5jdGlvbigpe1xyXG4gICAgdmFyICRqcT10aGlzLiRqcTtcclxuICAgICRqcS5hZGRDbGFzcyhcInR1cm5cIik7XHJcbiAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAkanEucmVtb3ZlQ2xhc3MoXCJ0dXJuXCIpO1xyXG4gICAgfSwyMDApO1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YTtcclxuICB9XHJcbn1cclxuIiwiLypcclxuVGhpcyBzY3JpcHQgY3JlYXRlIERPTSBzbGlkZXJzIHRoYXQgY2FuIGJlIHVzZWQgaW4gd2ViIGJyb3dzZXIgdG8gY29udHJvbCBzdHVmZi4gVGhleSBjYW4gYmUgc3luY2VkIHRocm91Z2ggc29ja2V0cyBhbmQgb3RoZXJzIGJ5IHVzaW5nIGNhbGxiYWNrcy5cclxuICAgIENvcHlyaWdodCAoQykgMjAxNiBKb2FxdcOtbiBBbGR1bmF0ZVxyXG5cclxuICAgIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbiAgICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG4gICAgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuICAgIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG4gICAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbiAgICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG4gICAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG4gICAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbiAgICBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG4gICAgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcbnZhciBzeW5jbWFuLG1vdXNlO1xyXG4vLyB2YXIgJDtcclxuZXhwb3J0cy5lbmFibGU9ZnVuY3Rpb24oZ2xvYmFscyl7XHJcbiAgc3luY21hbj1nbG9iYWxzLnN5bmNtYW47XHJcbiAgbW91c2U9Z2xvYmFscy5tb3VzZTtcclxuICByZXR1cm4gU2xpZGVyO1xyXG59O1xyXG5cclxuLyoqXHJcbiogVGhpcyBpcyB0aGUgZGVzY3JpcHRpb24gZm9yIFNsaWRlciBjbGFzc1xyXG4qXHJcbiogQGNsYXNzIFNsaWRlclxyXG4qIEBjb25zdHJ1Y3RvclxyXG4qL1xyXG5mdW5jdGlvbiBTbGlkZXIocGFyZW50LG9wdGlvbnMpe1xyXG4gIC8vbXkgcmVmZXJlbmNlIG51bWJlciBmb3IgZGF0YSBiaW5kaW5nLiBXaXRoIHRoaXMgbnVtYmVyIHRoZSBzb2NrZXQgYmluZGVyIGtub3dzIHdobyBpcyB0aGUgcmVjaWV2ZXIgb2YgdGhlIGRhdGEsIGFuZCBhbHNvIHdpdGggd2hhdCBuYW1lIHRvIHNlbmQgaXRcclxuICAvL3BlbmRhbnQ6IHRoaXMgY2FuIHBvdGVudGlhbGx5IGNyZWF0ZSBhIHByb2JsZW0sIGJlY2F1c2UgdHdvIG9iamVjdHMgY2FuIGJlIGNyZWF0ZWQgc2ltdWx0YW5lb3VzbHkgYXQgZGlmZmVyZW50IGVuZHMgYXQgdGhlIHNhbWUgdGltZS5cclxuICAvL21heWJlIGluc3RlYWQgb2YgdGhlIHNpbXBsZSBwdXNoLCB0aGVyZSBjb3VsZCBiZSBhIGNhbGxiYWNrLCBhZG4gdGhlIG9iamVjdCB3YWl0cyB0byByZWNlaXZlIGl0J3Mgc29ja2V0IGlkIG9uY2UgaXRzIGNyZWF0aW9uIHdhcyBwcm9wYWdhdGVkIHRocm91Z2hvdXQgYWxsIHRoZSBuZXR3b3JrLCBvciBtYXliZSB0aGVyZSBpcyBhbiBhcnJheSBmb3Igc2VudGluZyBhbmQgb3RoZXIgZGlmZmVyZW50IGZvciByZWNlaXZpbmcuLi4gZmlyc3Qgb3B0aW9uIHNlZW1zIG1vcmUgc2Vuc2libGVcclxuICB0aGlzLmRhdGE9e3ZhbHVlOjB9O1xyXG5cclxuICB0aGlzLl9iaW5kTj1zeW5jbWFuLmJpbmRMaXN0LnB1c2godGhpcyktMTtcclxuICB0aGlzLiRqcT0kKCc8ZGl2IGNsYXNzPVwic2xpZGVyLWNvbnRhaW5lclwiIHN0eWxlPVwicG9zaXRpb246cmVsYXRpdmVcIj48L2Rpdj4nKTtcclxuICB0aGlzLiRmYWRlcmpxPSQoJzxkaXYgY2xhc3M9XCJzbGlkZXItaW5uZXJcIiBzdHlsZT1cInBvaW50ZXItZXZlbnRzOm5vbmU7IHBvc2l0aW9uOmFic29sdXRlXCI+PC9kaXY+Jyk7XHJcbiAgdGhpcy5sYWJlbD1vcHRpb25zLmxhYmVsfHxcIlwiO1xyXG4gIHRoaXMubGFiZWxqcT0kKCc8cCBjbGFzcz1cInNsaWRlcmxhYmVsXCI+PC9wPicpO1xyXG4gIHRoaXMuJGpxLmFwcGVuZCh0aGlzLiRmYWRlcmpxKTtcclxuICB0aGlzLiRqcS5hcHBlbmQodGhpcy5sYWJlbGpxKTtcclxuICBpZihvcHRpb25zLmNzcylcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgdGhpcy5jc3M9ZnVuY3Rpb24oY3NzKXtcclxuICAgIHRoaXMuJGpxLmNzcyhjc3MpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG4gIHRoaXMub25DaGFuZ2VDYWxsYmFjaz1mdW5jdGlvbigpe307XHJcbiAgLy9wZW5kYW50OiB0aGlzIHNob3VsZCBiZSBwYXJ0IG9mIGEgYmFzZSBwcm90b3R5cGUsIG5vdCByZXBlYXRlZCBpbiBlYWNoIHR5cGVcclxuICBpZih0eXBlb2YgKHBhcmVudC5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC5hcHBlbmQodGhpcy4kanEpO1xyXG4gIH1lbHNlIGlmKHR5cGVvZiAocGFyZW50LiRqcS5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC4kanEuYXBwZW5kKHRoaXMuJGpxKTtcclxuICB9ZWxzZXtcclxuICAgIGNvbnNvbGUubG9nKFwiYSBzbGlkZXIgY291bGRuJ3QgZmluZCBkb20gZWxlbWVudCB0byBhdHRhY2ggaGltc2VsZlwiKTtcclxuICB9XHJcbiAgdmFyIG1lPXRoaXM7XHJcbiAgdGhpcy5vbkNoYW5nZT1mdW5jdGlvbihjYWxsYmFjayl7XHJcbiAgICBtZS5vbkNoYW5nZUNhbGxiYWNrPWZ1bmN0aW9uKCl7Y2FsbGJhY2sobWUuZGF0YSl9O1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG4gIC8qKlxyXG4qIE15IG1ldGhvZCBkZXNjcmlwdGlvbi4gIExpa2Ugb3RoZXIgcGllY2VzIG9mIHlvdXIgY29tbWVudCBibG9ja3MsXHJcbiogdGhpcyBjYW4gc3BhbiBtdWx0aXBsZSBsaW5lcy5cclxuKlxyXG4qIEBtZXRob2QgbWV0aG9kTmFtZVxyXG4qIEBwYXJhbSB7U3RyaW5nfSBmb28gQXJndW1lbnQgMVxyXG4qIEBwYXJhbSB7T2JqZWN0fSBjb25maWcgQSBjb25maWcgb2JqZWN0XHJcbiogQHBhcmFtIHtTdHJpbmd9IGNvbmZpZy5uYW1lIFRoZSBuYW1lIG9uIHRoZSBjb25maWcgb2JqZWN0XHJcbiogQHBhcmFtIHtGdW5jdGlvbn0gY29uZmlnLmNhbGxiYWNrIEEgY2FsbGJhY2sgZnVuY3Rpb24gb24gdGhlIGNvbmZpZyBvYmplY3RcclxuKiBAcGFyYW0ge0Jvb2xlYW59IFtleHRyYT1mYWxzZV0gRG8gZXh0cmEsIG9wdGlvbmFsIHdvcmtcclxuKiBAcmV0dXJuIHtCb29sZWFufSBSZXR1cm5zIHRydWUgb24gc3VjY2Vzc1xyXG4qL1xyXG4gIHRoaXMuc2V0RGF0YT1mdW5jdGlvbih0byxlbWl0KXtcclxuICAgIGlmKGVtaXQ9PT10cnVlKXtcclxuICAgICAgLy9wZW5kYW50OiBpbiBzZXF1ZW5jZXJzIHdlIHVzZSBwYXJlbnQuaWQsIGFuZCBoZXJlIHdlIHVzZSBfYmluZE4uIFRvd2FyZHMgYSBjb250cm9sbGVyIEFQSSBhbmQgYSBtb3JlIHNlbnNpY2FsIGNvZGUsIEkgdGhpbmsgYm90aCBzaG91bGQgdXNlIHRoZSBiaW5kIGVsZW1lbnQgYXJyYXkuIHJlYWQgbm90ZSBpbiBmaXJzdCBsaW5lIG9mIHRoaXMgZmlsZS5cclxuICAgICAgLy9wZW5kYW50OiBwYXJlbnQgaW4gc2VxIGlzIHdoYXQgbWUgaXMgaGVyZS4gdGhpcyBpcyBwcmV0dHkgY29uZnVzaW5nIHZhciBuYW1lIGRlY2lzaW9uXHJcbiAgICAgIHN5bmNtYW4uZW1pdChcInNsaWQ6XCIrbWUuX2JpbmROK1wiXCIsXCJzVlwiLHRvKTtcclxuICAgIH1cclxuICAgIHRoaXMuZGF0YS52YWx1ZT10bztcclxuICAgIHRoaXMub25DaGFuZ2VDYWxsYmFjaygpO1xyXG4gICAgdGhpcy51cGRhdGVEb20oKTtcclxuICB9XHJcbiAgdGhpcy5hZGRDbGFzcz1mdW5jdGlvbih0byl7XHJcbiAgICB0aGlzLiRqcS5hZGRDbGFzcyh0byk7XHJcbiAgfVxyXG4gIHRoaXMudmVydGljYWw9b3B0aW9ucy52ZXJ0aWNhbHx8dHJ1ZTtcclxuICB0aGlzLmFkZENsYXNzKFwidmVydGljYWxcIik7XHJcbiAgdGhpcy4kanEub24oXCJtb3VzZWRvd24gdGFwIHRvdWNoc3RhcnRcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgaWYobWUudmVydGljYWwpe1xyXG4gICAgICBtZS5zZXREYXRhKDEtZXZlbnQub2Zmc2V0WS9tZS4kanEuaGVpZ2h0KCksdHJ1ZSk7Ly8sdHJ1ZVxyXG4gICAgfWVsc2V7XHJcbiAgICAgIG1lLnNldERhdGEoZXZlbnQub2Zmc2V0WC9tZS4kanEud2lkdGgoKSx0cnVlKTsvLyx0cnVlXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHRoaXMuJGpxLm9uKFwibW91c2Vtb3ZlIHRvdWNoZW50ZXIgbW91c2VsZWF2ZSBtb3VzZXVwXCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgaWYobW91c2UuYnV0dG9uRG93bil7XHJcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgIHZhciBlbWl0VGhpcz1ldmVudC50eXBlPT1cIm1vdXNlbGVhdmVcInx8ZXZlbnQudHlwZT09XCJtb3VzZXVwXCJcclxuICAgICAgaWYobWUudmVydGljYWwpe1xyXG4gICAgICAgIC8vdGhlIHN0cmFuZ2Ugc2Vjb25kIHBhcmFtZW50ZXIgaW4gc2V0ZGF0YSB3YXMgdHJ1ZSwgYnV0IGl0IGNvdWxkIGNsb2cgdGhlIHNvY2tldFxyXG4gICAgICAgIG1lLnNldERhdGEoMS1ldmVudC5vZmZzZXRZL21lLiRqcS5oZWlnaHQoKSxlbWl0VGhpcyk7Ly8sdHJ1ZVxyXG4gICAgICB9ZWxzZXtcclxuICAgICAgICBtZS5zZXREYXRhKGV2ZW50Lm9mZnNldFgvbWUuJGpxLndpZHRoKCksZW1pdFRoaXMpOy8vLHRydWVcclxuICAgICAgfVxyXG4gICAgfWVsc2V7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgdGhpcy5ldmFsPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIganE9dGhpcy4kanE7XHJcbiAgICBqcS5hZGRDbGFzcyhcInR1cm5cIik7XHJcbiAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICBqcS5yZW1vdmVDbGFzcyhcInR1cm5cIik7XHJcbiAgICB9LDIwMCk7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhLnZhbHVlO1xyXG4gIH1cclxuICB0aGlzLnVwZGF0ZURvbT1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy52ZXJ0aWNhbCl7XHJcbiAgICAgIHRoaXMuJGZhZGVyanEuY3NzKHtib3R0b206MCx3aWR0aDpcIjEwMCVcIixoZWlnaHQ6dGhpcy5kYXRhLnZhbHVlKnRoaXMuJGpxLmhlaWdodCgpfSk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdGhpcy5sYWJlbGpxLmh0bWwodGhpcy5sYWJlbCk7XHJcbiAgICAgIHRoaXMuJGZhZGVyanEuY3NzKHtib3R0b206MCx3aWR0aDp0aGlzLmRhdGEudmFsdWUqdGhpcy4kanEud2lkdGgoKSxoZWlnaHQ6XCIxMDAlXCJ9KTtcclxuICAgIH1cclxuICB9XHJcbiAgdGhpcy5zZXREYXRhKDApO1xyXG59IiwibGV0IGVlbWl0ZXI9cmVxdWlyZSgnb25oYW5kbGVycycpO1xyXG52YXIgZ2xvYmFscztcclxudmFyIG1vdXNlO1xyXG5leHBvcnRzLmdldD1mdW5jdGlvbihnbG9iYWxzKXtcclxuICAvLyBzeW5jbWFuPWdsb2JhbHMuc3luY21hbjtcclxuICBtb3VzZT1nbG9iYWxzLm1vdXNlO1xyXG4gIHJldHVybiBjb21wb25lbnRCYXNlO1xyXG59XHJcbi8qKlxyXG4gKiBUaGUgYmFzZSBvZiBjb21wb25lbnRzLlxyXG4gKiBJdCBjb250YWlucyB0aGUgZnVuY3Rpb24gdGhhdCBhcmUgc2hhcmVkIGFtb25nIGFsbCBNc0NvbXBvbmVudHMuIE1ha2VzIGxpdHRsZSBzZW5zZSB0byB1c2UgdGhpcyBhbG9uZVxyXG4gKlxyXG4gKiBAY2xhc3MgY29tcG9uZW50QmFzZVxyXG4gKiBAY29uc3RydWN0b3IgbmV3IE1zQ29tcG9uZW50cy5jb21wb25lbnRCYXNlKERPTS9KcXVlcnkgZWxlbWVudCx7cHJvcGVydGllc30pXHJcbiAqXHJcbiAqIEBwcm9wZXJ0eSBwYXJlbnRcclxuICogQHR5cGUgSnF1ZXJ5IC8gRG9tIGVsZW1lbnQgLyBjb21wb25lbnRCYXNlXHJcbiAqIEBwcm9wZXJ0eSBvcHRpb25zXHJcbiAqIEB0eXBlIG9iamVjdFxyXG4gKi9cclxuZnVuY3Rpb24gY29tcG9uZW50QmFzZShwYXJlbnQsb3B0aW9ucyl7XHJcbiAgZWVtaXRlci5jYWxsKHRoaXMpO1xyXG4gIHRoaXMub3B0aW9ucz1vcHRpb25zO1xyXG4gIHZhciB0aGlzQ29tcG9uZW50PXRoaXM7XHJcbiAgaWYoIXRoaXMubmFtZSl7XHJcbiAgICB0aGlzLm5hbWU9XCJjb21wb25lbnRcIjtcclxuICB9XHJcbiAgdGhpcy4kanE9JCgnPGRpdiBjbGFzcz1cIm1zLScrdGhpcy5uYW1lKydcIj48L2Rpdj4nKTtcclxuICBpZihvcHRpb25zLmNzcylcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgdGhpcy5jc3M9ZnVuY3Rpb24oY3NzKXtcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgaWYodHlwZW9mIChwYXJlbnQuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgICBwYXJlbnQuYXBwZW5kKHRoaXMuJGpxKTtcclxuICB9ZWxzZSBpZih0eXBlb2YgKHBhcmVudC4kanEuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgICBwYXJlbnQuJGpxLmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgfWVsc2V7XHJcbiAgICBjb25zb2xlLmxvZyhcImEgc2xpZGVyIGNvdWxkbid0IGZpbmQgZG9tIGVsZW1lbnQgdG8gYXR0YWNoIGhpbXNlbGZcIik7XHJcbiAgfVxyXG4gIC8qKlxyXG4gICogQHByb3BlcnR5IG1vdXNlQWN0aXZhdGlvbk1vZGVcclxuICAqIEB0eXBlIFN0cmluZ1xyXG4gICogIGRyYWdBbGw6IHRoZSBidXR0b25zIHdpbGwgYWN0aXZhdGUgdGhyb3VnaCBhbGwgdGhlIHRyYWplY3Rvcnkgb2YgdGhlIG1vdXNlIHdoaWxlIHByZXNzZWRcclxuICAqIG9uZUJ5T25lOiBvbmUgY2xpY2s9b25lIGJ1dHRvbiBwcmVzc1xyXG4gICogZHJhZ0xhc3Q6IHRoZSBtb3VzZSBjYW4gYmUgdHJhZ2dlZCBhbmQgd2lsbCBhY3RpdmFlIGFuZCBob3ZlciBvbmx5IHRoZSBsYXN0IGJ1dHRvbiB0aGF0IGl0IGVudGVyZWRcclxuICAqIGhvdmVyOiB0aGUgYnV0dGlucyBhcmUgYWN0aXZhdGVkIHVwb24gaG92ZXIgcmVnYXJkbGVzcyBvZiB3aGV0aGVyIGlzIGNsaWNrZWQgb3Igbm90XHJcbiAgKi9cclxuICBpZighb3B0aW9ucy5tb3VzZUFjdGl2YXRpb25Nb2RlKXtcclxuICAgIG9wdGlvbnMubW91c2VBY3RpdmF0aW9uTW9kZT1cImRyYWdBbGxcIjtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIG1vdXNlQWN0aXZhdGUoZXZlbnQpe1xyXG4gICAgdGhpc0NvbXBvbmVudC5oYW5kbGUoXCJvbk1vdXNlU3RhcnRcIik7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgdGhpc0NvbXBvbmVudC5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcclxuICB9XHJcbiAgZnVuY3Rpb24gbW91c2VEZWFjdGl2YXRlKGV2ZW50KXtcclxuICAgIHRoaXNDb21wb25lbnQuaGFuZGxlKFwib25Nb3VzZUVuZFwiKTtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB0aGlzQ29tcG9uZW50LnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpO1xyXG4gIH1cclxuXHJcbiAgLy90byBhdm9pZCBpZiBjaGFpbnMgdGhhdCBhcmUgYSBwYWluIHRvIGNoYW5nZVxyXG4gIGZ1bmN0aW9uIGFJc0luQihhLGIpe1xyXG4gICAgZm9yICh2YXIgYyBpbiBiKXtcclxuICAgICAgaWYoYT09YltjXSl7Y29uc29sZS5sb2coXCJ0cnVlXCIpO3JldHVybiB0cnVlO31cclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9O1xyXG5cclxuICB0aGlzLiRqcS5vbihcIm1vdXNlZG93biB0YXAgdG91Y2hzdGFydFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIC8vY2hlY2sgdGhhdCB1cG9uIHRoZSBjdXJyZW50IGV2ZW50LCBhIG1vdXNlQWN0aXZhdGUgc2hvdWxkIGJlIHRyaWdnZXJlZC5cclxuICAgIGlmKGFJc0luQihvcHRpb25zLm1vdXNlQWN0aXZhdGlvbk1vZGUsW1wiZHJhZ0FsbFwiLFwib25lQnlPbmVcIixcImRyYWdMYXN0XCJdKSl7XHJcbiAgICAgIG1vdXNlQWN0aXZhdGUoZXZlbnQpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICB0aGlzLiRqcS5vbihcIm1vdXNlZW50ZXJcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBpZihtb3VzZS5idXR0b25Eb3duKXtcclxuICAgICAgaWYoYUlzSW5CKG9wdGlvbnMubW91c2VBY3RpdmF0aW9uTW9kZSxbXCJkcmFnQWxsXCIsXCJkcmFnTGFzdFwiXSkpe1xyXG4gICAgICAgIG1vdXNlQWN0aXZhdGUoZXZlbnQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZihvcHRpb25zLm1vdXNlQWN0aXZhdGlvbk1vZGU9PVwiaG92ZXJcIil7XHJcbiAgICAgIG1vdXNlQWN0aXZhdGUoZXZlbnQpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHRoaXMuJGpxLm9uKFwibW91c2V1cFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIGlmKGFJc0luQihvcHRpb25zLm1vdXNlQWN0aXZhdGlvbk1vZGUsW1wiZHJhZ0FsbFwiLFwib25lQnlPbmVcIixcImRyYWdMYXN0XCJdKSl7XHJcbiAgICAgIG1vdXNlRGVhY3RpdmF0ZShldmVudCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgdGhpcy4kanEub24oXCJtb3VzZW91dFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIGlmKGFJc0luQihvcHRpb25zLm1vdXNlQWN0aXZhdGlvbk1vZGUsW1wiaG92ZXJcIixcIm9uZUJ5T25lXCIsXCJkcmFnTGFzdFwiXSkpe1xyXG4gICAgICBtb3VzZURlYWN0aXZhdGUoZXZlbnQpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuXHJcbiAgdGhpcy51cGRhdGVEb209ZnVuY3Rpb24oKXtcclxuICAgIHRoaXNDb21wb25lbnQuJGpxLmh0bWwodGhpcy5sYWJlbCk7XHJcbiAgfVxyXG4gIC8vYWxpYXNpbmcgb2YgdGhlc2UgdHdvIGhhbmR5IGZ1bmN0aW9uXHJcbiAgdGhpcy5hZGRDbGFzcz1mdW5jdGlvbih0byl7XHJcbiAgICB0aGlzQ29tcG9uZW50LiRqcS5hZGRDbGFzcyh0byk7XHJcbiAgfVxyXG4gIHRoaXMucmVtb3ZlQ2xhc3M9ZnVuY3Rpb24odG8pe1xyXG4gICAgdGhpc0NvbXBvbmVudC4kanEucmVtb3ZlQ2xhc3ModG8pO1xyXG4gIH1cclxufSIsInZhciBhdWRpb0NvbnRleHQ9bmV3IEF1ZGlvQ29udGV4dCgpO1xyXG52YXIgZ2xvYmFscz17fTtcclxuZ2xvYmFscy5zeW5jbWFuPXJlcXVpcmUoJy4vc3luY21hbi5qcycpLmVuYWJsZSgpO1xyXG5nbG9iYWxzLm1vdXNlPXJlcXVpcmUoJy4vbW91c2UuanMnKS5lbmFibGUoKTtcclxuZ2xvYmFscy5hdWRpb0NvbnRleHQ9YXVkaW9Db250ZXh0O1xyXG5cclxudmFyIFNsaWRlcj1yZXF1aXJlKCcuL1NsaWRlci5qcycpLmVuYWJsZShnbG9iYWxzKTtcclxudmFyIFNlcXVlbmNlcj1yZXF1aXJlKCcuL1NlcXVlbmNlci5qcycpLmVuYWJsZShnbG9iYWxzKTtcclxudmFyIEJ1dHRvbj1yZXF1aXJlKCcuL0J1dHRvbi5qcycpLmVuYWJsZShnbG9iYWxzKTtcclxudmFyIENsb2NrPXJlcXVpcmUoJy4vQ2xvY2suanMnKS5lbmFibGUoZ2xvYmFscyk7XHJcblxyXG52YXIgTXNDb21wb25lbnRzPXtcclxuICBTbGlkZXI6U2xpZGVyLFxyXG4gIFNlcXVlbmNlcjpTZXF1ZW5jZXIsXHJcbiAgQnV0dG9uOkJ1dHRvbixcclxuICBDbG9jazpDbG9jayxcclxuICBjcmVhdGU6ZnVuY3Rpb24od2hhdCxvcHRpb25zLHdoZXJlKXtcclxuICAgIGlmKCF3aGVyZSlcclxuICAgICAgd2hlcmU9JChcImJvZHlcIik7XHJcbiAgICByZXR1cm4gbmV3IHRoaXNbd2hhdF0od2hlcmUsb3B0aW9ucyk7XHJcbiAgfSxcclxufTtcclxud2luZG93Lk1zQ29tcG9uZW50cz1Nc0NvbXBvbmVudHM7XHJcbmNvbnNvbGUubG9nKE1zQ29tcG9uZW50cyk7IiwiZXhwb3J0cy5lbmFibGU9ZnVuY3Rpb24oKXtcclxuXHJcbiAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcclxuICAgICQoZG9jdW1lbnQpLm9uKFwibW91c2Vkb3duIHRvdWNoc3RhcnQgdG91Y2htb3ZlXCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICBtb3VzZS5idXR0b25Eb3duPXRydWU7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKGV2ZW50KTtcclxuICAgIH0pO1xyXG4gICAgJChkb2N1bWVudCkub24oXCJtb3VzZXVwIHRvdWNoZW5kXCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICBtb3VzZS5idXR0b25Eb3duPWZhbHNlO1xyXG4gICAgfSk7XHJcbiAgICAvLyBkb2N1bWVudC5vbnRvdWNobW92ZSA9IGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIC8vICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIC8vIH1cclxuICB9KTtcclxuICBcclxuICByZXR1cm4gbW91c2U7XHJcbn1cclxudmFyIG1vdXNlPXtcclxuICB0b29sOlwiZHJhd1wiXHJcbn07XHJcblxyXG5cclxuIiwiLypcclxuVGhpcyBzY3JpcHQgY29udGFpbnMgYSB0ZW1wbGF0ZSBmb3IgZGF0YS1iaW5kaW5nIG1hbmFnZW1lbnQgaWYgeW91IHdhbnQgdG8gZG8gc28uIE90aGVyd2lzZSwgaXQgd2lsbCBqdXN0IHBsYWNlaG9sZCB2YXIgbmFtZXMgc28gdGhlcmUgYXJlIG5vIHVuZGVmaW5lZCB2YXJzLlxyXG4gICAgQ29weXJpZ2h0IChDKSAyMDE2IEpvYXF1w61uIEFsZHVuYXRlXHJcblxyXG4gICAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcclxuICAgIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbiAgICB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4gICAgKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cclxuXHJcbiAgICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuICAgIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbiAgICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbiAgICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG5cclxuICAgIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbiAgICBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxuXHJcbmV4cG9ydHMuZW5hYmxlPWZ1bmN0aW9uKCl7XHJcbiAgcmV0dXJuIG5ldyBTeW5jbWFuKCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBTeW5jbWFuKCl7XHJcbiAgLy9saXN0IG9mIGFsbCB0aGUgaXRlbXMgdGhhdCB1c2UgZGF0YSBiaW5kaW5nXHJcbiAgdGhpcy5iaW5kTGlzdD1bXTtcclxuICAvL2hvdyBhcmUgeW91IGVtaXR0aW5nIGNoYW5nZXM/IGl0IGRlcGVuZHMgb24gdGhlIHNlcnZlciB5b3UgdXNlLlxyXG4gIHRoaXMuZW1pdD1mdW5jdGlvbigpe31cclxufVxyXG4iXX0=