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
* Slider produces a vertical or horizontal slider that allows to control a value from dragging with the mouse.

*
* @class Slider
* @constructor
* @param {jquery} parent or DOM element to which this slider will be attached.
* defaults to `$("body")`
* @default
* @param {object} options object containing options
* @param {String} options.css additional css properties for the slider
* @param {function} options.valueFunction
* defines the operation to apply to the internal value upon evaluation. the default is just linear
* @example mySlider new MsComponents.Slider($("body"),{vertical:false,value:0.73});
*/
function Slider(parent, options) {
  //my reference number for data binding. With this number the socket binder knows who is the reciever of the data, and also with what name to send it
  //pendant: this can potentially create a problem, because two objects can be created simultaneously at different ends at the same time.
  //maybe instead of the simple push, there could be a callback, adn the object waits to receive it's socket id once its creation was propagated throughout all the network, or maybe there is an array for senting and other different for receiving... first option seems more sensible
  this.data = { value: 0 };
  this.valueFunction = function (val) {
    return val;
  };
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
  * Set the data to a value, and perform the graphic changes and data bindings that correspond to this change.
  * If you wanted to change the value, but not get this change reflected in the slider position, you would
  * assign the slider.data.value to your value.
  * @method setData
  * @param {number} to target value
  * @param {boolean} [emit=false] *not ready* wether to emit through syncman
  * @return {undefined} no return
  * @example mySlider.setData(0.53);
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
    return valueFunction(this.data.value);
  };
  this.updateDom = function () {
    if (this.vertical) {
      this.$faderjq.css({ bottom: 0, width: "100%", height: this.data.value * this.$jq.height() });
    } else {
      this.labeljq.html(this.label);
      this.$faderjq.css({ bottom: 0, width: this.data.value * this.$jq.width(), height: "100%" });
    }
  };
  this.setData(options.value);
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

/**
* A library for easy graphic control of synths, music and probably other things.
* @instance MsComponents
* instance any library component by new `MsComponents.component()`
* @example var mySlider= new MsComponents.Slider();
*/
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9vbmhhbmRsZXJzL29uLmpzIiwibm9kZV9tb2R1bGVzL3dlYi1hdWRpby1zY2hlZHVsZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvd2ViLWF1ZGlvLXNjaGVkdWxlci9saWIvV2ViQXVkaW9TY2hlZHVsZXIuanMiLCJub2RlX21vZHVsZXMvd2ViLWF1ZGlvLXNjaGVkdWxlci9saWIvZGVmYXVsdENvbnRleHQuanMiLCJub2RlX21vZHVsZXMvd2ViLWF1ZGlvLXNjaGVkdWxlci9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvd2ViLWF1ZGlvLXNjaGVkdWxlci9saWIvdXRpbHMvZGVmYXVsdHMuanMiLCJzcmNcXEJ1dHRvbi5qcyIsInNyY1xcQ2xvY2suanMiLCJzcmNcXFNlcXVlbmNlci5qcyIsInNyY1xcU2xpZGVyLmpzIiwic3JjXFxjb21wb25lbnRCYXNlLmpzIiwic3JjXFxpbmRleC5qcyIsInNyY1xcbW91c2UuanMiLCJzcmNcXHN5bmNtYW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTs7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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TUFBRSxRQUFGLEVBQVksRUFBWixDQUFlLGdDQUFmLEVBQWdELFVBQVMsS0FBVCxFQUFlO0FBQzdELFlBQU0sVUFBTixHQUFpQixJQUFqQjtBQUNBO0FBQ0QsS0FIRDtBQUlBLE1BQUUsUUFBRixFQUFZLEVBQVosQ0FBZSxrQkFBZixFQUFrQyxVQUFTLEtBQVQsRUFBZTtBQUMvQyxZQUFNLFVBQU4sR0FBaUIsS0FBakI7QUFDRCxLQUZEO0FBR0E7QUFDQTtBQUNBO0FBQ0QsR0FYRDs7QUFhQSxTQUFPLEtBQVA7QUFDRCxDQWhCRDtBQWlCQSxJQUFJLFFBQU07QUFDUixRQUFLO0FBREcsQ0FBVjs7Ozs7QUNqQkE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQSxRQUFRLE1BQVIsR0FBZSxZQUFVO0FBQ3ZCLFdBQU8sSUFBSSxPQUFKLEVBQVA7QUFDRCxDQUZEOztBQUlBLFNBQVMsT0FBVCxHQUFrQjtBQUNoQjtBQUNBLFNBQUssUUFBTCxHQUFjLEVBQWQ7QUFDQTtBQUNBLFNBQUssSUFBTCxHQUFVLFlBQVUsQ0FBRSxDQUF0QjtBQUNEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBBdCBsZWFzdCBnaXZlIHNvbWUga2luZCBvZiBjb250ZXh0IHRvIHRoZSB1c2VyXG4gICAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuICgnICsgZXIgKyAnKScpO1xuICAgICAgICBlcnIuY29udGV4dCA9IGVyO1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSBpZiAobGlzdGVuZXJzKSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAodGhpcy5fZXZlbnRzKSB7XG4gICAgdmFyIGV2bGlzdGVuZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgICBpZiAoaXNGdW5jdGlvbihldmxpc3RlbmVyKSlcbiAgICAgIHJldHVybiAxO1xuICAgIGVsc2UgaWYgKGV2bGlzdGVuZXIpXG4gICAgICByZXR1cm4gZXZsaXN0ZW5lci5sZW5ndGg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgcmV0dXJuIGVtaXR0ZXIubGlzdGVuZXJDb3VudCh0eXBlKTtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsIi8qXHJcbnlvdSBtYWtlIHRoZSBvbkhhbmRsZXJzLmNhbGwodGhpcykgaW4gdGhlIG9iamVjdCB0aGF0IG5lZWRzIHRvIGhhdmUgaGFuZGxlcnMuXHJcbnRoZW4geW91IGNhbiBjcmVhdGUgYSBmdW5jdGlvbiBjYWxsYmFjayBmb3IgdGhhdCBvYmplY3QgdXNpbmcgb2JqZWN0Lm9uKFwiaGFuZGxlck5hbWUub3B0aW9uYWxOYW1lXCIsY2FsbGJhY2tGdW5jdGlvbigpe30pO1xyXG50aGUgb2JqZWN0IGNhbiBydW4gdGhlIGhhbmRsZSBjYWxsYmFja3MgYnkgdXNpbmcgdGhpcy5oYW5kbGUoXCJoYW5kbGVyTmFtZVwiLHBhcmFtZXRlcnNUb0ZlZWQpO1xyXG4qL1xyXG5tb2R1bGUuZXhwb3J0cz1mdW5jdGlvbigpIHtcclxuICB2YXIgZXZlbnRWZXJib3NlPWZhbHNlO1xyXG4gIGlmICghdGhpcy5vbnMpIHtcclxuICAgIHRoaXMub25zID0gW107XHJcbiAgfVxyXG4gIHRoaXMub24gPSBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaykge1xyXG4gICAgdmFyIG5hbWUgPSBuYW1lLnNwbGl0KFwiLlwiKTtcclxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgaWYgKG5hbWUubGVuZ3RoID09IDApIHtcclxuICAgICAgICB0aHJvdyAoXCJzb3JyeSwgeW91IGdhdmUgYW4gaW52YWxpZCBldmVudCBuYW1lXCIpO1xyXG4gICAgICB9IGVsc2UgaWYgKG5hbWUubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGlmICghdGhpcy5vbnNbbmFtZVswXV0pIHRoaXMub25zW25hbWVbMF1dID0gW107XHJcbiAgICAgICAgdGhpcy5vbnNbbmFtZVswXV0ucHVzaChbZmFsc2UsIGNhbGxiYWNrXSk7XHJcbiAgICAgIH1cclxuICAgICAgLy8gY29uc29sZS5sb2codGhpcy5vbnMpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhyb3cgKFwiZXJyb3IgYXQgbW91c2Uub24sIHByb3ZpZGVkIGNhbGxiYWNrIHRoYXQgaXMgbm90IGEgZnVuY3Rpb25cIik7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHRoaXMub2ZmID0gZnVuY3Rpb24obmFtZSkge1xyXG4gICAgdmFyIG5hbWUgPSBuYW1lLnNwbGl0KFwiLlwiKTtcclxuICAgIGlmIChuYW1lLmxlbmd0aCA+IDEpIHtcclxuICAgICAgaWYgKCF0aGlzLm9uc1tuYW1lWzBdXSkgdGhpcy5vbnNbbmFtZVswXV0gPSBbXTtcclxuICAgICAgLy8gY29uc29sZS5sb2coXCJwcmV2XCIsdGhpcy5vbnNbbmFtZVswXV0pO1xyXG4gICAgICB0aGlzLm9uc1tuYW1lWzBdXS5zcGxpY2UodGhpcy5vbnNbbmFtZVswXV0uaW5kZXhPZihuYW1lWzFdKSwgMSk7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKFwidGhlblwiLHRoaXMub25zW25hbWVbMF1dKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IChcInNvcnJ5LCB5b3UgZ2F2ZSBhbiBpbnZhbGlkIGV2ZW50IG5hbWVcIiArIG5hbWUpO1xyXG4gICAgfVxyXG4gIH1cclxuICB0aGlzLmhhbmRsZSA9IGZ1bmN0aW9uKGZuYW1lLCBwYXJhbXMpIHtcclxuICAgIGlmKGV2ZW50VmVyYm9zZSkgY29uc29sZS5sb2coXCJFdmVudCBcIitmbmFtZStcIjpcIix7Y2FsbGVyOnRoaXMscGFyYW1zOnBhcmFtc30pO1xyXG4gICAgaWYgKHRoaXMub25zW2ZuYW1lXSkge1xyXG4gICAgICBmb3IgKHZhciBuIGluIHRoaXMub25zW2ZuYW1lXSkge1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMub25zW2ZuYW1lXVtuXVsxXSk7XHJcbiAgICAgICAgdGhpcy5vbnNbZm5hbWVdW25dWzFdKHBhcmFtcyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9saWJcIik7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoIXNlbGYpIHsgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpOyB9IHJldHVybiBjYWxsICYmICh0eXBlb2YgY2FsbCA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSA/IGNhbGwgOiBzZWxmOyB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90IFwiICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG52YXIgZXZlbnRzID0gcmVxdWlyZShcImV2ZW50c1wiKTtcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoXCIuL3V0aWxzL2RlZmF1bHRzXCIpO1xudmFyIGRlZmF1bHRDb250ZXh0ID0gcmVxdWlyZShcIi4vZGVmYXVsdENvbnRleHRcIik7XG5cbnZhciBXZWJBdWRpb1NjaGVkdWxlciA9IGZ1bmN0aW9uIChfZXZlbnRzJEV2ZW50RW1pdHRlcikge1xuICBfaW5oZXJpdHMoV2ViQXVkaW9TY2hlZHVsZXIsIF9ldmVudHMkRXZlbnRFbWl0dGVyKTtcblxuICBmdW5jdGlvbiBXZWJBdWRpb1NjaGVkdWxlcihvcHRzKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFdlYkF1ZGlvU2NoZWR1bGVyKTtcblxuICAgIG9wdHMgPSBvcHRzIHx8IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICove307XG5cbiAgICB2YXIgX3RoaXMgPSBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCAoV2ViQXVkaW9TY2hlZHVsZXIuX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihXZWJBdWRpb1NjaGVkdWxlcikpLmNhbGwodGhpcykpO1xuXG4gICAgX3RoaXMuY29udGV4dCA9IGRlZmF1bHRzKG9wdHMuY29udGV4dCwgZGVmYXVsdENvbnRleHQpO1xuICAgIF90aGlzLmludGVydmFsID0gZGVmYXVsdHMob3B0cy5pbnRlcnZhbCwgMC4wMjUpO1xuICAgIF90aGlzLmFoZWFkVGltZSA9IGRlZmF1bHRzKG9wdHMuYWhlYWRUaW1lLCAwLjEpO1xuICAgIF90aGlzLnRpbWVyQVBJID0gZGVmYXVsdHMob3B0cy50aW1lckFQSSwgZ2xvYmFsKTtcbiAgICBfdGhpcy5wbGF5YmFja1RpbWUgPSBfdGhpcy5jdXJyZW50VGltZTtcblxuICAgIF90aGlzLl90aW1lcklkID0gMDtcbiAgICBfdGhpcy5fc2NoZWRJZCA9IDA7XG4gICAgX3RoaXMuX3NjaGVkcyA9IFtdO1xuICAgIHJldHVybiBfdGhpcztcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhXZWJBdWRpb1NjaGVkdWxlciwgW3tcbiAgICBrZXk6IFwic3RhcnRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gc3RhcnQoY2FsbGJhY2ssIGFyZ3MpIHtcbiAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG4gICAgICB2YXIgbG9vcCA9IGZ1bmN0aW9uIGxvb3AoKSB7XG4gICAgICAgIHZhciB0MCA9IF90aGlzMi5jb250ZXh0LmN1cnJlbnRUaW1lO1xuICAgICAgICB2YXIgdDEgPSB0MCArIF90aGlzMi5haGVhZFRpbWU7XG5cbiAgICAgICAgX3RoaXMyLl9wcm9jZXNzKHQwLCB0MSk7XG4gICAgICB9O1xuXG4gICAgICBpZiAodGhpcy5fdGltZXJJZCA9PT0gMCkge1xuICAgICAgICB0aGlzLl90aW1lcklkID0gdGhpcy50aW1lckFQSS5zZXRJbnRlcnZhbChsb29wLCB0aGlzLmludGVydmFsICogMTAwMCk7XG5cbiAgICAgICAgdGhpcy5lbWl0KFwic3RhcnRcIik7XG5cbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgdGhpcy5pbnNlcnQodGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lLCBjYWxsYmFjaywgYXJncyk7XG4gICAgICAgICAgbG9vcCgpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuaW5zZXJ0KHRoaXMuY29udGV4dC5jdXJyZW50VGltZSwgY2FsbGJhY2ssIGFyZ3MpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwic3RvcFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzdG9wKCkge1xuICAgICAgdmFyIHJlc2V0ID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGFyZ3VtZW50c1swXTtcblxuICAgICAgaWYgKHRoaXMuX3RpbWVySWQgIT09IDApIHtcbiAgICAgICAgdGhpcy50aW1lckFQSS5jbGVhckludGVydmFsKHRoaXMuX3RpbWVySWQpO1xuICAgICAgICB0aGlzLl90aW1lcklkID0gMDtcblxuICAgICAgICB0aGlzLmVtaXQoXCJzdG9wXCIpO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVzZXQpIHtcbiAgICAgICAgdGhpcy5fc2NoZWRzLnNwbGljZSgwKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImluc2VydFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBpbnNlcnQodGltZSwgY2FsbGJhY2ssIGFyZ3MpIHtcbiAgICAgIHZhciBpZCA9ICsrdGhpcy5fc2NoZWRJZDtcbiAgICAgIHZhciBldmVudCA9IHsgaWQ6IGlkLCB0aW1lOiB0aW1lLCBjYWxsYmFjazogY2FsbGJhY2ssIGFyZ3M6IGFyZ3MgfTtcbiAgICAgIHZhciBzY2hlZHMgPSB0aGlzLl9zY2hlZHM7XG5cbiAgICAgIGlmIChzY2hlZHMubGVuZ3RoID09PSAwIHx8IHNjaGVkc1tzY2hlZHMubGVuZ3RoIC0gMV0udGltZSA8PSB0aW1lKSB7XG4gICAgICAgIHNjaGVkcy5wdXNoKGV2ZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpbWF4ID0gc2NoZWRzLmxlbmd0aDsgaSA8IGltYXg7IGkrKykge1xuICAgICAgICAgIGlmICh0aW1lIDwgc2NoZWRzW2ldLnRpbWUpIHtcbiAgICAgICAgICAgIHNjaGVkcy5zcGxpY2UoaSwgMCwgZXZlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBpZDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwibmV4dFRpY2tcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gbmV4dFRpY2sodGltZSwgY2FsbGJhY2ssIGFyZ3MpIHtcbiAgICAgIGlmICh0eXBlb2YgdGltZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGFyZ3MgPSBjYWxsYmFjaztcbiAgICAgICAgY2FsbGJhY2sgPSB0aW1lO1xuICAgICAgICB0aW1lID0gdGhpcy5wbGF5YmFja1RpbWU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmluc2VydCh0aW1lICsgdGhpcy5haGVhZFRpbWUsIGNhbGxiYWNrLCBhcmdzKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwicmVtb3ZlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlbW92ZShzY2hlZElkKSB7XG4gICAgICB2YXIgc2NoZWRzID0gdGhpcy5fc2NoZWRzO1xuXG4gICAgICBpZiAodHlwZW9mIHNjaGVkSWQgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGltYXggPSBzY2hlZHMubGVuZ3RoOyBpIDwgaW1heDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHNjaGVkSWQgPT09IHNjaGVkc1tpXS5pZCkge1xuICAgICAgICAgICAgc2NoZWRzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2NoZWRJZDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwicmVtb3ZlQWxsXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlbW92ZUFsbCgpIHtcbiAgICAgIHRoaXMuX3NjaGVkcy5zcGxpY2UoMCk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcIl9wcm9jZXNzXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIF9wcm9jZXNzKHQwLCB0MSkge1xuICAgICAgdmFyIHNjaGVkcyA9IHRoaXMuX3NjaGVkcztcbiAgICAgIHZhciBwbGF5YmFja1RpbWUgPSB0MDtcblxuICAgICAgdGhpcy5wbGF5YmFja1RpbWUgPSBwbGF5YmFja1RpbWU7XG4gICAgICB0aGlzLmVtaXQoXCJwcm9jZXNzXCIsIHsgcGxheWJhY2tUaW1lOiBwbGF5YmFja1RpbWUgfSk7XG5cbiAgICAgIHdoaWxlIChzY2hlZHMubGVuZ3RoICYmIHNjaGVkc1swXS50aW1lIDwgdDEpIHtcbiAgICAgICAgdmFyIGV2ZW50ID0gc2NoZWRzLnNoaWZ0KCk7XG4gICAgICAgIHZhciBfcGxheWJhY2tUaW1lID0gZXZlbnQudGltZTtcbiAgICAgICAgdmFyIGFyZ3MgPSBldmVudC5hcmdzO1xuXG4gICAgICAgIHRoaXMucGxheWJhY2tUaW1lID0gX3BsYXliYWNrVGltZTtcblxuICAgICAgICBldmVudC5jYWxsYmFjayh7IHBsYXliYWNrVGltZTogX3BsYXliYWNrVGltZSwgYXJnczogYXJncyB9KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5wbGF5YmFja1RpbWUgPSBwbGF5YmFja1RpbWU7XG4gICAgICB0aGlzLmVtaXQoXCJwcm9jZXNzZWRcIiwgeyBwbGF5YmFja1RpbWU6IHBsYXliYWNrVGltZSB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwic3RhdGVcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl90aW1lcklkICE9PSAwID8gXCJydW5uaW5nXCIgOiBcInN1c3BlbmRlZFwiO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJjdXJyZW50VGltZVwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuY29udGV4dC5jdXJyZW50VGltZTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZXZlbnRzXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fc2NoZWRzLnNsaWNlKCk7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIFdlYkF1ZGlvU2NoZWR1bGVyO1xufShldmVudHMuRXZlbnRFbWl0dGVyKTtcblxubW9kdWxlLmV4cG9ydHMgPSBXZWJBdWRpb1NjaGVkdWxlcjsiLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldCBjdXJyZW50VGltZSgpIHtcbiAgICByZXR1cm4gRGF0ZS5ub3coKSAvIDEwMDA7XG4gIH1cbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vV2ViQXVkaW9TY2hlZHVsZXJcIik7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIGRlZmF1bHRzKHZhbHVlLCBkZWZhdWx0VmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICE9PSB1bmRlZmluZWQgPyB2YWx1ZSA6IGRlZmF1bHRWYWx1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkZWZhdWx0czsiLCJ2YXIgY29tcG9uZW50QmFzZT1yZXF1aXJlKCcuL2NvbXBvbmVudEJhc2UnKTtcclxudmFyIHN5bmNtYW4sbW91c2U7XHJcbmV4cG9ydHMuZW5hYmxlPWZ1bmN0aW9uKGdsb2JhbHMpe1xyXG4gIHN5bmNtYW49Z2xvYmFscy5zeW5jbWFuO1xyXG4gIG1vdXNlPWdsb2JhbHMubW91c2U7XHJcbiAgY29tcG9uZW50QmFzZT1jb21wb25lbnRCYXNlLmdldCh7c3luY21hbjpzeW5jbWFuLG1vdXNlOm1vdXNlfSk7XHJcbiAgcmV0dXJuIEJ1dHRvbjtcclxufVxyXG5mdW5jdGlvbiBCdXR0b24ocGFyZW50LG9wdGlvbnMpe1xyXG4gIHRoaXMubmFtZT1cImJ1dHRvblwiO1xyXG4gIGNvbXBvbmVudEJhc2UuY2FsbCh0aGlzLHBhcmVudCxvcHRpb25zKTtcclxuICAvL215IHJlZmVyZW5jZSBudW1iZXIgZm9yIGRhdGEgYmluZGluZy4gV2l0aCB0aGlzIG51bWJlciB0aGUgc29ja2V0IGJpbmRlciBrbm93cyB3aG8gaXMgdGhlIHJlY2lldmVyIG9mIHRoZSBkYXRhLCBhbmQgYWxzbyB3aXRoIHdoYXQgbmFtZSB0byBzZW5kIGl0XHJcbiAgLy9wZW5kYW50OiB0aGlzIGNhbiBwb3RlbnRpYWxseSBjcmVhdGUgYSBwcm9ibGVtLCBiZWNhdXNlIHR3byBvYmplY3RzIGNhbiBiZSBjcmVhdGVkIHNpbXVsdGFuZW91c2x5IGF0IGRpZmZlcmVudCBlbmRzIGF0IHRoZSBzYW1lIHRpbWUuXHJcbiAgLy9tYXliZSBpbnN0ZWFkIG9mIHRoZSBzaW1wbGUgcHVzaCwgdGhlcmUgY291bGQgYmUgYSBjYWxsYmFjaywgYWRuIHRoZSBvYmplY3Qgd2FpdHMgdG8gcmVjZWl2ZSBpdCdzIHNvY2tldCBpZCBvbmNlIGl0cyBjcmVhdGlvbiB3YXMgcHJvcGFnYXRlZCB0aHJvdWdob3V0IGFsbCB0aGUgbmV0d29yaywgb3IgbWF5YmUgdGhlcmUgaXMgYW4gYXJyYXkgZm9yIHNlbnRpbmcgYW5kIG90aGVyIGRpZmZlcmVudCBmb3IgcmVjZWl2aW5nLi4uIGZpcnN0IG9wdGlvbiBzZWVtcyBtb3JlIHNlbnNpYmxlXHJcbiAgdGhpcy5kYXRhPXt2YWx1ZTowfTtcclxuICB0aGlzLnN0YXRlcz1mYWxzZTtcclxuICB0aGlzLl9iaW5kTj1zeW5jbWFuLmJpbmRMaXN0LnB1c2godGhpcyktMTtcclxuICAvL3RoaXMuJGpxPSQoJzxkaXYgY2xhc3M9XCJtcy1idXR0b25cIj48L2Rpdj4nKTtcclxuICB0aGlzLmxhYmVsPW9wdGlvbnMubGFiZWx8fFwi4pi7XCI7XHJcbiAgdGhpcy4kanEuYXBwZW5kKHRoaXMuJGZhZGVyanEpO1xyXG4gIHRoaXMuJGpxLmh0bWwodGhpcy5sYWJlbCk7XHJcbiAgLy8gaWYob3B0aW9ucy5jc3MpXHJcbiAgLy8gICB0aGlzLiRqcS5jc3Mob3B0aW9ucy5jc3MpO1xyXG4gIC8vIHRoaXMuY3NzPWZ1bmN0aW9uKGNzcyl7XHJcbiAgLy8gICB0aGlzLiRqcS5jc3Mob3B0aW9ucy5jc3MpO1xyXG4gIC8vICAgcmV0dXJuIHRoaXM7XHJcbiAgLy8gfVxyXG4gIC8vaWYgYSBzd2l0Y2ggdmFyaWFibGUgaXMgcGFzc2VkLCB0aGlzIGJ1dHRvbiB3aWxsIHN3aXRjaCBvbiBlYWNoIGNsaWNrIGFtb25nIHRoZSBzdGF0ZWQgc3RhdGVzXHJcbiAgaWYob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShcInN3aXRjaFwiKSl7XHJcbiAgICB0aGlzLnN0YXRlcz1bXTtcclxuICAgIHRoaXMuZGF0YS5jdXJyZW50U3RhdGU9MDtcclxuICAgIHRoaXMuc3RhdGVzPW9wdGlvbnMuc3dpdGNoO1xyXG4gICAgdGhpcy5zd2l0Y2hTdGF0ZSgwKTtcclxuICB9XHJcbiAgdGhpcy5vbkNsaWNrQ2FsbGJhY2s9ZnVuY3Rpb24oKXt9O1xyXG4gIHRoaXMub25SZWxlYXNlQ2FsbGJhY2s9ZnVuY3Rpb24oKXt9O1xyXG4gIC8vcGVuZGFudDogdGhpcyBzaG91bGQgYmUgcGFydCBvZiBhIGJhc2UgcHJvdG90eXBlLCBub3QgcmVwZWF0ZWQgaW4gZWFjaCB0eXBlXHJcbiAgLy8gaWYodHlwZW9mIChwYXJlbnQuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgLy8gICBwYXJlbnQuYXBwZW5kKHRoaXMuJGpxKTtcclxuICAvLyB9ZWxzZSBpZih0eXBlb2YgKHBhcmVudC4kanEuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgLy8gICBwYXJlbnQuJGpxLmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgLy8gfWVsc2V7XHJcbiAgLy8gICBjb25zb2xlLmxvZyhcImEgc2xpZGVyIGNvdWxkbid0IGZpbmQgZG9tIGVsZW1lbnQgdG8gYXR0YWNoIGhpbXNlbGZcIik7XHJcbiAgLy8gfVxyXG4gIHZhciBtZT10aGlzO1xyXG4gIC8vIHRoaXMub25DaGFuZ2U9ZnVuY3Rpb24oY2FsbGJhY2spe1xyXG4gIC8vICAgbWUub25DbGlja0NhbGxiYWNrPWZ1bmN0aW9uKCl7Y2FsbGJhY2sobWUuZGF0YSl9O1xyXG4gIC8vICAgcmV0dXJuIHRoaXM7XHJcbiAgLy8gfVxyXG5cclxuICB0aGlzLiRqcS5vbihcIm1vdXNlZG93biB0YXAgdG91Y2hzdGFydFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIG1lLm9uQ2xpY2tDYWxsYmFjayhtZS5kYXRhKTtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBtZS5zd2l0Y2hTdGF0ZSgpO1xyXG4gICAgbWUuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XHJcbiAgfSk7XHJcbiAgdGhpcy4kanEub24oXCJtb3VzZXVwIG1vdXNlbGVhdmVcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBtZS5vblJlbGVhc2VDYWxsYmFjayhtZS5kYXRhKTtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBtZS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKTtcclxuICB9KTtcclxufVxyXG5cclxuXHJcbkJ1dHRvbi5wcm90b3R5cGUub25DbGljaz1mdW5jdGlvbihjYWxsYmFjayl7XHJcbiAgdGhpcy5vbkNsaWNrQ2FsbGJhY2s9Y2FsbGJhY2s7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn1cclxuQnV0dG9uLnByb3RvdHlwZS5vblJlbGVhc2U9ZnVuY3Rpb24oY2FsbGJhY2spe1xyXG4gIHRoaXMub25SZWxlYXNlQ2FsbGJhY2s9Y2FsbGJhY2s7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn1cclxuQnV0dG9uLnByb3RvdHlwZS5zd2l0Y2hTdGF0ZT1mdW5jdGlvbih0byl7XHJcbiAgaWYodGhpcy5zdGF0ZXMpe1xyXG4gICAgLy9jaGFuZ2Ugc3RhdGUgbnVtYmVyIHRvIG5leHRcclxuICAgIGlmKHRvKXtcclxuICAgICAgdGhpcy5kYXRhLmN1cnJlbnRTdGF0ZT10byV0aGlzLnN0YXRlcy5sZW5ndGg7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdGhpcy5kYXRhLmN1cnJlbnRTdGF0ZT0odGhpcy5kYXRhLmN1cnJlbnRTdGF0ZSsxKSV0aGlzLnN0YXRlcy5sZW5ndGg7XHJcbiAgICB9XHJcbiAgICAvL2FwcGx5IGFsbCB0aGUgcHJvcGVydGllcyB0aGF0IHRoZSBzdGF0ZSBjYXJyeS4gVGhpcyBtYWtlcyB0aGUgYnV0dG9uIHN1cGVyIGhhY2thYmxlXHJcbiAgICBmb3IoYSBpbiB0aGlzLnN0YXRlc1t0aGlzLmRhdGEuY3VycmVudFN0YXRlXSl7XHJcbiAgICAgIHRoaXNbYV09dGhpcy5zdGF0ZXNbdGhpcy5kYXRhLmN1cnJlbnRTdGF0ZV1bYV07XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKFwiW1wiK2ErXCJdXCIsdGhpc1thXSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHRoaXMudXBkYXRlRG9tKCk7XHJcbn1cclxuIiwiXHJcbnZhciBzeW5jbWFuLG1vdXNlLGF1ZGlvQ29udGV4dDtcclxudmFyIE9IPXJlcXVpcmUoXCJvbmhhbmRsZXJzXCIpO1xyXG52YXIgVGltZXI9cmVxdWlyZShcIndlYi1hdWRpby1zY2hlZHVsZXJcIik7XHJcbmV4cG9ydHMuZW5hYmxlPWZ1bmN0aW9uKGdsb2JhbHMpe1xyXG4gIGNvbnNvbGUubG9nKFwidGltZXJcIixUaW1lcik7XHJcbiAgc3luY21hbj1nbG9iYWxzLnN5bmNtYW47XHJcbiAgbW91c2U9Z2xvYmFscy5tb3VzZTtcclxuICBhdWRpb0NvbnRleHQ9Z2xvYmFscy5hdWRpb0NvbnRleHQ7XHJcbiAgcmV0dXJuIENsb2NrO1xyXG59O1xyXG5mdW5jdGlvbiBDbG9jayhwYXJlbnQsb3B0aW9ucyl7XHJcblxyXG4gIHZhciBkZWZhdWx0cz17XHJcbiAgICBpbnRlcnZhbDowLjFcclxuICB9XHJcbiAgdGhpcy5jdXJyZW50U3RlcD0wO1xyXG4gIHRoaXMubmFtZT1cImNsb2NrXCI7XHJcbiAgT0guY2FsbCh0aGlzKTtcclxuICB2YXIgdGhpc0Nsb2NrPXRoaXM7XHJcbiAgdGhpcy5kYXRhPXt2YWx1ZTowfTtcclxuICB0aGlzLnN0YXRlcz1mYWxzZTtcclxuICB0aGlzLl9iaW5kTj1zeW5jbWFuLmJpbmRMaXN0LnB1c2godGhpcyktMTtcclxuICB0aGlzLiRqcT0kKCc8ZGl2IGNsYXNzPVwibXMtY2xvY2sgbXMtYnV0dG9uXCI+PC9kaXY+Jyk7XHJcbiAgdGhpcy5sYWJlbD1vcHRpb25zLmxhYmVsfHwn4oiGJztcclxuICB0aGlzLiRqcS5hcHBlbmQodGhpcy4kZmFkZXJqcSk7XHJcbiAgdGhpcy4kanEuaHRtbCh0aGlzLmxhYmVsKTtcclxuICBpZihvcHRpb25zLmNzcylcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgdGhpcy5jc3M9ZnVuY3Rpb24oY3NzKXtcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgLy90aGlzIHNob3VsZCBnbyBpbiBjb21wb25lbnRCYXNlLiBJdCBhcHBsaWVzIG9wdGlvbnMgb3IgZGVmYXVsdHMuXHJcbiAgaWYoIW9wdGlvbnMpXHJcbiAgb3B0aW9ucz17fTtcclxuICBmb3IodmFyIGEgaW4gZGVmYXVsdHMpe1xyXG4gICAgaWYoIW9wdGlvbnNbYV0pXHJcbiAgICBvcHRpb25zW2FdPWRlZmF1bHRzW2FdO1xyXG4gIH1cclxuICAvL3BlbmRhbnQ6IHRoaXMgc2hvdWxkIGJlIHBhcnQgb2YgYSBiYXNlIHByb3RvdHlwZSwgbm90IHJlcGVhdGVkIGluIGVhY2ggdHlwZVxyXG4gIGlmKHR5cGVvZiAocGFyZW50LmFwcGVuZHx8ZmFsc2UpPT1cImZ1bmN0aW9uXCIpe1xyXG4gICAgcGFyZW50LmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgfWVsc2UgaWYodHlwZW9mIChwYXJlbnQuJGpxLmFwcGVuZHx8ZmFsc2UpPT1cImZ1bmN0aW9uXCIpe1xyXG4gICAgcGFyZW50LiRqcS5hcHBlbmQodGhpcy4kanEpO1xyXG4gIH1lbHNle1xyXG4gICAgY29uc29sZS5sb2coXCJhIGNsb2NrIGNvdWxkbid0IGZpbmQgZG9tIGVsZW1lbnQgdG8gYXR0YWNoIGhpbXNlbGZcIik7XHJcbiAgfVxyXG4gIHZhciBtZT10aGlzO1xyXG5cclxuICB0aGlzLnRpbWVyID0gbmV3IFRpbWVyKHsgY29udGV4dDogYXVkaW9Db250ZXh0IH0pO1xyXG4gIHZhciBpbnRlcnZhbEhhbmRsZTtcclxuICAvL3RoZSBjdXJyZW50IHRpbWVyIHRlY2hub2xvZ3kgZG9lc24ndCBtYWtlIGludGVydmFsIGJ1dCByYXRoZXIgc2NoZWR1bGVzIGFoZWFkLCB0aHVzIHRoZXNlIHZhcnM6XHJcbiAgdmFyIGxhc3RUaW1lclNjaGVkdWxlZD0wO1xyXG4gIHZhciBsYXN0VGltZXJFeGVjdXRlZD0wO1xyXG4gIHZhciBjcmVhdGVGdXJ0aGVyVGltZXJTY2hlZHVsZXM9ZnVuY3Rpb24oaG93TWFueSl7XHJcbiAgICB2YXIgYWRkVXBUbz1sYXN0VGltZXJTY2hlZHVsZWQraG93TWFueTtcclxuICAgIGZvcihsYXN0VGltZXJTY2hlZHVsZWQ7IGxhc3RUaW1lclNjaGVkdWxlZDxhZGRVcFRvOyBsYXN0VGltZXJTY2hlZHVsZWQrKylcclxuICAgIG1lLnRpbWVyLmluc2VydChvcHRpb25zLmludGVydmFsKmxhc3RUaW1lclNjaGVkdWxlZCwgbWUudGljayx7dGlja246bGFzdFRpbWVyU2NoZWR1bGVkfSk7XHJcbiAgfVxyXG4gIHRoaXMudGljaz1mdW5jdGlvbihhKXtcclxuICAgIGxhc3RUaW1lckV4ZWN1dGVkKys7XHJcbiAgICBjcmVhdGVGdXJ0aGVyVGltZXJTY2hlZHVsZXMoNCk7XHJcbiAgICB0aGlzQ2xvY2suaGFuZGxlKFwidGlja1wiKTtcclxuICAgIHRoaXNDbG9jay5hZGRDbGFzcyhcInRpY2tcIik7XHJcbiAgICAvLyBjb25zb2xlLmxvZyhcInRpY2tcIik7XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7dGhpc0Nsb2NrLnJlbW92ZUNsYXNzKFwidGlja1wiKTt9LDIwKTtcclxuICAgIHRoaXMuY3VycmVudFN0ZXArKztcclxuICB9XHJcbiAgdGhpcy5zdGFydD1mdW5jdGlvbigpe1xyXG4gICAgLy8gY29uc29sZS5sb2cob3B0aW9ucy5pbnRlcnZhbCk7XHJcbiAgICBjcmVhdGVGdXJ0aGVyVGltZXJTY2hlZHVsZXMoNCk7XHJcbiAgICB0aGlzLnRpbWVyLnN0YXJ0KCk7XHJcbiAgICAvL2ludGVydmFsSGFuZGxlPXdpbmRvdy5zZXRJbnRlcnZhbCh0aGlzLnRpY2ssb3B0aW9ucy5pbnRlcnZhbHwxKTtcclxuICB9XHJcbiAgdGhpcy5zdG9wPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnRpbWVyLnN0b3AoKTtcclxuICAgIC8vL3RoaXMudGltZXIucmVtb3ZlKGludGVydmFsSGFuZGxlKTtcclxuICAgIC8vd2luZG93LmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxIYW5kbGUpO1xyXG4gIH1cclxuICBpZihvcHRpb25zLnN0YXJ0KVxyXG4gIHRoaXMuc3RhcnQoKTtcclxuXHJcbn1cclxuXHJcbkNsb2NrLnByb3RvdHlwZS51cGRhdGVEb209ZnVuY3Rpb24oKXtcclxuICB0aGlzLiRqcS5odG1sKHRoaXMubGFiZWwpO1xyXG59XHJcblxyXG5cclxuXHJcbi8vYWxpYXNpbmcgb2YgdGhlc2UgdHdvIGhhbmR5IGZ1bmN0aW9uXHJcbkNsb2NrLnByb3RvdHlwZS5hZGRDbGFzcz1mdW5jdGlvbih0byl7XHJcbiAgdGhpcy4kanEuYWRkQ2xhc3ModG8pO1xyXG59XHJcbkNsb2NrLnByb3RvdHlwZS5yZW1vdmVDbGFzcz1mdW5jdGlvbih0byl7XHJcbiAgdGhpcy4kanEucmVtb3ZlQ2xhc3ModG8pO1xyXG59IiwidmFyIGNvbXBvbmVudEJhc2U9cmVxdWlyZSgnLi9jb21wb25lbnRCYXNlJyk7XHJcbmxldCBlZW1pdGVyPXJlcXVpcmUoJ29uaGFuZGxlcnMnKTtcclxudmFyIHN5bmNtYW4sbW91c2U7XHJcbmV4cG9ydHMuZW5hYmxlPWZ1bmN0aW9uKGdsb2JhbHMpe1xyXG4gIHN5bmNtYW49Z2xvYmFscy5zeW5jbWFuO1xyXG4gIG1vdXNlPWdsb2JhbHMubW91c2U7XHJcbiAgY29tcG9uZW50QmFzZT1jb21wb25lbnRCYXNlLmdldCh7c3luY21hbjpzeW5jbWFuLG1vdXNlOm1vdXNlfSk7XHJcbiAgcmV0dXJuIFNlcXVlbmNlcjtcclxufVxyXG4vKipcclxuICogQSBnZW5lcmF0b3Igb2Ygc2VxdWVuY2Vyc1xyXG4gKlxyXG4gKiBAY2xhc3MgU2VxdWVuY2VyXHJcbiAqIEBjb25zdHJ1Y3RvciBuZXcgTXNDb21wb25lbnRzLlNlcXVlbmNlcihET00vJGpxdWVyeSBlbGVtZW50LHtwcm9wZXJ0aWVzfSlcclxuICovXHJcbiAvL2RlZmluZXMgYWxsIHRoZSBzZXF1ZW5jZXIgcGFyYW1ldGVycyBieSBtYXRoLFxyXG4gLy9tYXliZSBpbiBhIGZ1bnR1cmUgYnkgc3R5bGluZyB0YWJsZVxyXG52YXIgc2VxUHJvZz00O1xyXG5mdW5jdGlvbiBTZXF1ZW5jZXIocGFyZW50LG9wdGlvbnMpe1xyXG4gdmFyIG49b3B0aW9ucy5ufHwzO1xyXG4gdmFyIHRoaXNTZXF1ZW5jZXI9dGhpcztcclxuIHRoaXMubmFtZT1cInNlcXVlbmNlclwiXHJcbiBjb21wb25lbnRCYXNlLmNhbGwodGhpcyxwYXJlbnQsb3B0aW9ucyk7XHJcbiAvLyB0aGlzLiRqcT0kKCc8ZGl2IGNsYXNzPVwic2VxdWVuY2VyXCIgaWQ9XCJzZXFfJytuKydcIj48cCBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlXCI+PC9wPjwvZGl2PicpO1xyXG4gcGFyZW50LmFwcGVuZCh0aGlzLiRqcSk7XHJcbiB0aGlzLmFsaXZlPWZhbHNlO1xyXG4gdGhpcy5fYmluZE49c3luY21hbi5iaW5kTGlzdC5wdXNoKHRoaXMpLTE7XHJcbiB0aGlzLnBvcz0wO1xyXG4gdGhpcy5kYXRhPVtdO1xyXG4gLyoqXHJcbiAgKiBAcGFyYW0gbGVuXHJcbiAgKmhvdyBtYW55IHN0ZXBzIHRoZSBzZXF1ZW5jZXIgaGFzXHJcbiAgKiBAYWxpYXMgbGVuZ3RoXHJcbiAgKi9cclxuIHRoaXMubGVuPW9wdGlvbnMubGVufG9wdGlvbnMubGVuZ3RofE1hdGgucG93KDIsKHNlcVByb2clNSkrMSk7XHJcbiAvKipcclxuICAqIEBwYXJhbSBldnJ5XHJcbiAgKiBob3cgbWFueSBjbG9jayBzdGVwcyBtYWtlIGEgc2VxdWVuY2VyIHN0ZXBcclxuICAqIEBhbGlhcyBzdGVwRGl2aXNpb25cclxuICAqL1xyXG4gdGhpcy5ldnJ5PW9wdGlvbnMuZXZyeXxvcHRpb25zLnN0ZXBEaXZpc2lvbnxNYXRoLnBvdygyLChzZXFQcm9nJTQpKzEpO1xyXG4gLy9tdXN0IGNvdW50IGFuIFtldmVyeV0gYW1vdW50IG9mIGJlYXRzIGZvciBlYWNoIHBvcyBpbmNyZW1lbnQuXHJcbiB0aGlzLnN1YnBvcz0wO1xyXG4gdGhpcy4kanEuY3NzKHt3aWR0aDoxNipNYXRoLmNlaWwodGhpcy5sZW4vNCkrXCJweFwifSk7XHJcbiAvL3RoaXMuJGpxLmFkZENsYXNzKFwiY29sb3JfXCIrc2VxUHJvZyVjaGFubmVscy5sZW5ndGgpO1xyXG4gdGhpcy5kaXNwPTA7XHJcbiB0aGlzLmlkPW47XHJcbiB0aGlzLmJlYXREaXNwbGFjZT0wO1xyXG4gdmFyIG1lPXRoaXM7XHJcbiBzZXFQcm9nKys7XHJcbiAvL3RoaXMuY2hhbm5lbD1jaGFubmVsc1t0aGlzLmlkJWNoYW5uZWxzLmxlbmd0aF07XHJcbiBmb3IodmFyIGJuPTA7IGJuPHRoaXMubGVuOyBibisrKXtcclxuICAgdGhpcy5kYXRhW2JuXT1uZXcgU2VxdWVuY2VyQnV0dG9uKGJuLHRoaXMpXHJcbiB9XHJcbiB0aGlzLmFsaXZlQ2hpbGQ9MDtcclxuIHRoaXMuZGlzcGxhY2U9MDtcclxuIHRoaXMuc2V0RGlzcGxhY2U9ZnVuY3Rpb24odG8vKixlbWl0Ki8pe1xyXG4gIC8vICBpZihlbWl0PT1cIm9ubHlcIil7XHJcbiAgICAvLyAgZW1pdD10cnVlO1xyXG4gIC8vICB9ZWxzZXtcclxuICAgICB0aGlzLnN1YnBvcz0oKHRoaXMuY2xvY2suY3VycmVudFN0ZXApJSh0aGlzLmxlbip0aGlzLmV2cnkpKSt0bztcclxuICAvLyAgfVxyXG4gIC8vICBpZihlbWl0PT10cnVlKXtcclxuICAvLyAgICBzb2NrQ2hhbmdlKFwic2VxOlwiK21lLl9iaW5kTitcIlwiLFwiZHNwbFwiLHRvKTtcclxuICAvLyAgfVxyXG4gfVxyXG4gdGhpcy5zdGVwPWZ1bmN0aW9uKCl7XHJcbiAgIHZhciBwcmV2YWxpdmU9dGhpcy5hbGl2ZTtcclxuICAgdGhpcy5hbGl2ZT10aGlzLmFsaXZlQ2hpbGQ+MDtcclxuICAvLyAgY29uc29sZS5sb2codGhpcy5hbGl2ZUNoaWxkKTtcclxuICAgaWYodGhpcy5hbGl2ZSl7XHJcbiAgICAvLyAgY29uc29sZS5sb2coXCJzZXRlXCIpO1xyXG4gICAgIC8vaWYgdGhlIHN0YXRlIG9mIHRoaXMuYWxpdmUgY2hhbmdlcywgd2UgbXVzdCBlbWl0IHRoZSBkaXNwbGFjZW1lbnQsIGJlY2F1c2UgaXQgaXMgbmV3XHJcbiAgICAgaWYoIXByZXZhbGl2ZSl7XHJcbiAgICAgICB0aGlzLmRpc3BsYWNlPSh0aGlzLmNsb2NrLmN1cnJlbnRTdGVwK3RoaXMuc3VicG9zKSUodGhpcy5sZW4qdGhpcy5ldnJ5KTtcclxuICAgICAgIC8vY29uc29sZS5sb2coXCJvay4gZW1pdCBkaXNwbGFlOiBcIit0aGlzLmRpc3BsYWNlKTtcclxuICAgICAgIC8vdGhpcy5zZXREaXNwbGFjZSh0aGlzLmRpc3BsYWNlLFwib25seVwiKTtcclxuICAgICB9O1xyXG4gICAgIC8vZWFjaCBzZXF1ZW5jZXIgaGFzIGEgZGlmZmVyZW50IHNwZWVkIHJhdGVzLiB3aGlsZSBzb21lIHBsYXlzIG9uZSBzdGVwIHBlciBjbGljaywgb3RoZXJzIHdpbGwgaGF2ZSBvbmUgc3RlcCBwZXIgc2V2ZXJhbCBjbG9jayB0aWNrcy5cclxuICAgICAvL3RoZSBzZXF1ZW5jZXIgc3RhcnRpbmcgcG9pbnQgaXMgYWxzbyBkaXNwbGFjZWQsIGFuZCBpdCBkZXBlbmRzIG9uIHRoZSB0aW1lIHdoZW4gaXQgZ290IGFsaXZlZCtpdHMgcG9zaXRpb24gYXQgdGhhdCBtb21lbnQuXHJcbiAgICAgaWYodGhpcy5zdWJwb3MldGhpcy5ldnJ5PT0wKXtcclxuICAgICAgIC8vIGNvbnNvbGUubG9nKFwic3FcIit0aGlzLnBvcyk7XHJcbiAgICAgICAvLyBkYXRhPXtzZXF1ZW5jZXI6dGhpcy5pZCxwb3M6dGhpcy5wb3Msc3RlcFZhbDp0aGlzLmRhdGFbdGhpcy5wb3NdLmV2YWwoKX07XHJcbiAgICAgICAvLyB0aGlzLm9uU3RlcFRyaWdnZXIoZGF0YSk7XHJcbiAgICAgICAvLyBzdGVwRnVuY3Rpb24oZGF0YSk7XHJcbiAgICAgICB0aGlzLnBvcz0odGhpcy5zdWJwb3MvdGhpcy5ldnJ5KSUodGhpcy5sZW4pO1xyXG4gICAgICAgdmFyIHZsPXRoaXMuZGF0YVt0aGlzLnBvc10uZXZhbCgpO1xyXG4gICAgICAgaWYodmwpe1xyXG4gICAgICAgICAvLyB0aGlzLmNoYW5uZWwuZW5naW5lLnN0YXJ0KDAsdGhpcy5jaGFubmVsLnN0YXJ0T2Zmc2V0LHRoaXMuY2hhbm5lbC5lbmRUaW1lKTtcclxuICAgICAgICAgLy9zbywgdGhpcyBpcyBjYWxsZWQgZWxzZXdoZXJlIGFzd2VsbGwuLi4uIHRoZSBjaGFubmVsIHNob3VsZCBoYXZlIGEgdHJpZ2dlciBmdW5jdGlvblxyXG4gICAgICAgIC8vICB2YXIgbG9vcFN0YXJ0PXRoaXMuY2hhbm5lbC5zdGFydE9mZnNldDtcclxuICAgICAgICAvLyAgdmFyIGxvb3BFbmQ9dGhpcy5jaGFubmVsLmVuZFRpbWU7XHJcbiAgICAgICAgLy8gIHRoaXMuY2hhbm5lbC5zYW1wbGVyLnRyaWdnZXJBdHRhY2soZmFsc2UsMCwxLHtzdGFydDpsb29wU3RhcnQsZW5kOmxvb3BFbmR9KTtcclxuICAgICAgICB0aGlzLmhhbmRsZShcInRyaWdnZXJcIix2bCk7XHJcbiAgICAgICB9XHJcbiAgICAgfWVsc2V7XHJcbiAgICAgfVxyXG4gICAgIC8vd2hhdCBpcyBtb3JlIGVjb25vbWljPz9cclxuICAgICAvLyB0aGlzLnN1YnBvcz0odGhpcy5zdWJwb3MrMSklKHRoaXMubGVuKnRoaXMuZXZyeSk7XHJcbiAgICAgLy9pIGd1ZXNzIHRoYXQuLiBidXQgaXQgY2FuIGdyb3cgZXRlcm5hbGx5XHJcbiAgICAgdGhpcy5zdWJwb3MrKztcclxuICAgfVxyXG4gfVxyXG4gdGhpcy5zZXRDbG9jaz1mdW5jdGlvbihjbG9jayxkaXZpc2lvbnMpe1xyXG4gICBpZihkaXZpc2lvbnMpXHJcbiAgIHRoaXMuZXZyeT1kaXZpc2lvbnM7XHJcbiAgIGlmKGNsb2NrLm9uKXtcclxuICAgICBjbG9jay5vbigndGljaycsZnVuY3Rpb24oKXt0aGlzU2VxdWVuY2VyLnN0ZXAoKX0pO1xyXG4gICAgIGlmKGNsb2NrLm5hbWUhPVwiY2xvY2tcIilcclxuICAgICBjb25zb2xlLndhcm4oXCJ5b3Ugc2V0IHRoZSBjbG9jayBvZiBhIHNlcXVlbmNlciB0byBzb21laHRpbmcgdGhhdCBpcyBub3QgYSBjbG9jaywgYnV0IGEgXCIrY2xvY2submFtZSk7XHJcbiAgIH1lbHNle1xyXG4gICAgIGNvbnNvbGUud2FybihcInlvdSB0cmllZCB0byBjb25uZWN0IGEgXCIrdGhpcy5uYW1lK1wiIHRvIGFuIG9iamVjdCB0aGF0IGhhcyBubyBldmVudCBoYW5sZXJzIFwiKTtcclxuICAgfVxyXG4gICB0aGlzLmNsb2NrPWNsb2NrO1xyXG4gfVxyXG4gdGhpcy5kaWU9ZnVuY3Rpb24oKXtcclxuICAgZm9yKHZhciBibiBpbiB0aGlzLmRhdGEpe1xyXG4gICAgIHRoaXMuZGF0YVtibl0uc2V0RGF0YSgwKTtcclxuICAgfVxyXG4gICB0aGlzLmFsaXZlPWZhbHNlO1xyXG4gICB0aGlzLiRqcS5kZXRhY2goKTtcclxuIH1cclxuIC8vIHRoaXMub25TdGVwVHJpZ2dlcj1mdW5jdGlvbihkYXRhKXtcclxuIC8vICAgLy8gY29uc29sZS5sb2coZGF0YSk7XHJcbiAvLyB9XHJcbiAvLyB0aGlzLiRqcS5vbihcIm1vdXNlZW50ZXJcIixmdW5jdGlvbigpe1xyXG4gLy8gICBmb2N1c0NoYW5uZWwobWUuY2hhbm5lbC5pZCk7XHJcbiAvLyB9KTtcclxuIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBTZXF1ZW5jZXJCdXR0b24obixwYXJlbnQpe1xyXG4gIGVlbWl0ZXIuY2FsbCh0aGlzKTtcclxuICB0aGlzLm9uKFwidGVzdFwiLGZ1bmN0aW9uKCl7Y29uc29sZS5sb2coXCJ3b3JrcyFcIil9KTtcclxuICB0aGlzLmhhbmRsZShcInRlc3RcIik7XHJcbiAgdGhpcy4kanE9JCgnPGRpdiBjbGFzcz1cInNlcWJ1dHRvblwiPjwvZGl2PicpO1xyXG4gIHRoaXMuX2JpbmROPXN5bmNtYW4uYmluZExpc3QucHVzaCh0aGlzKS0xO1xyXG4gIHBhcmVudC4kanEuYXBwZW5kKHRoaXMuJGpxKTtcclxuICB0aGlzLmRhdGE9MDtcclxuICAvL3BlbmRhbnQ6IGV2YWx1YXRlIHdldGhlciB0aGUgdmFyIG4gaXMgc3RpbGwgdXNlZnVsLiByZW1vdmUgaXQgYXQgZXZlcnkgZW5kLlxyXG4gIHRoaXMubj1uO1xyXG4gIHZhciBtZT10aGlzO1xyXG4gIHRoaXMuc2V0RGF0YT1mdW5jdGlvbih0byxlbWl0KXtcclxuICAgIC8vIGlmKGVtaXQ9PXRydWUpe1xyXG4gICAgLy8gICBzb2NrQ2hhbmdlKFwic2VxYjpcIittZS5fYmluZE4rXCJcIixcInNWXCIsdG8pO1xyXG4gICAgLy8gfVxyXG4gICAgLy8gY29uc29sZS5sb2coXCJzZGF0YVwiKTtcclxuICAgIC8vc29ja2V0IG1heSBzZXQgZGF0YSB0byAwIHdoZW4gaXMgYWxyZWFkeSAwLCBnZW5lcmF0aW5nIGRpc3BsYWNlIG9mIHBhcmVudCdzIGFsaXZlZGhpbGRcclxuICAgIGlmKHRvIT10aGlzLmRhdGEpe1xyXG4gICAgICBpZih0bz09MSl7XHJcbiAgICAgICAgdGhpcy5kYXRhPTE7XHJcbiAgICAgICAgdGhpcy4kanEuYWRkQ2xhc3MoXCJvblwiKTtcclxuICAgICAgICBwYXJlbnQuYWxpdmVDaGlsZCsrO1xyXG4gICAgICB9XHJcbiAgICAgIGlmKHRvPT0wKXtcclxuICAgICAgICB0aGlzLmRhdGE9MDtcclxuICAgICAgICB0aGlzLiRqcS5yZW1vdmVDbGFzcyhcIm9uXCIpO1xyXG4gICAgICAgIHBhcmVudC5hbGl2ZUNoaWxkLS07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIGNvbnNvbGUubG9nKHBhcmVudC5hbGl2ZUNoaWxkKTtcclxuICAgIC8vIGNvbnNvbGUubG9nKHBhcmVudC5hbGl2ZUNoaWxkKTtcclxuICB9XHJcbiAgdGhpcy4kanEub24oXCJtb3VzZWRvd24gdGFwIHRvdWNoc3RhcnRcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgbWUuc2V0RGF0YShNYXRoLmFicyhtZS5kYXRhLTEpLHRydWUpO1xyXG4gICAgLy8gbWUuZGF0YT07XHJcbiAgICBpZihtZS5kYXRhPT0xKXtcclxuICAgICAgIG1vdXNlLnN3aXRjaGluZz10cnVlO1xyXG4gICAgfWVsc2V7XHJcbiAgICAvLyAgICQodGhpcykucmVtb3ZlQ2xhc3MoXCJvblwiKTtcclxuICAgIC8vICAgcGFyZW50LmFsaXZlQ2hpbGQtLTtcclxuICAgICAgIG1vdXNlLnN3aXRjaGluZz1mYWxzZTtcclxuICAgICB9XHJcbiAgfSk7XHJcbiAgdGhpcy4kanEub24oXCJtb3VzZWVudGVyIHRvdWNoZW50ZXJcIixmdW5jdGlvbigpe1xyXG4gICAgaWYobW91c2UuYnV0dG9uRG93bil7XHJcbiAgICAgIGlmKG1vdXNlLnN3aXRjaGluZyl7XHJcbiAgICAgICAgaWYobWUuZGF0YT09MCl7XHJcbiAgICAgICAgICBtZS5zZXREYXRhKDEsdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ZWxzZXtcclxuICAgICAgICBpZihtZS5kYXRhPT0xKXtcclxuICAgICAgICAgIG1lLnNldERhdGEoMCx0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxuICB0aGlzLmV2YWw9ZnVuY3Rpb24oKXtcclxuICAgIHZhciAkanE9dGhpcy4kanE7XHJcbiAgICAkanEuYWRkQ2xhc3MoXCJ0dXJuXCIpO1xyXG4gICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgJGpxLnJlbW92ZUNsYXNzKFwidHVyblwiKTtcclxuICAgIH0sMjAwKTtcclxuICAgIHJldHVybiB0aGlzLmRhdGE7XHJcbiAgfVxyXG59XHJcbiIsIi8qXHJcblRoaXMgc2NyaXB0IGNyZWF0ZSBET00gc2xpZGVycyB0aGF0IGNhbiBiZSB1c2VkIGluIHdlYiBicm93c2VyIHRvIGNvbnRyb2wgc3R1ZmYuIFRoZXkgY2FuIGJlIHN5bmNlZCB0aHJvdWdoIHNvY2tldHMgYW5kIG90aGVycyBieSB1c2luZyBjYWxsYmFja3MuXHJcbiAgICBDb3B5cmlnaHQgKEMpIDIwMTYgSm9hcXXDrW4gQWxkdW5hdGVcclxuXHJcbiAgICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG4gICAgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcclxuICAgIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXHJcbiAgICAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuICAgIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG4gICAgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcclxuICAgIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuICAgIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG4gICAgWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcclxuICAgIGFsb25nIHdpdGggdGhpcyBwcm9ncmFtLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxyXG4qL1xyXG52YXIgc3luY21hbixtb3VzZTtcclxuLy8gdmFyICQ7XHJcbmV4cG9ydHMuZW5hYmxlPWZ1bmN0aW9uKGdsb2JhbHMpe1xyXG4gIHN5bmNtYW49Z2xvYmFscy5zeW5jbWFuO1xyXG4gIG1vdXNlPWdsb2JhbHMubW91c2U7XHJcbiAgcmV0dXJuIFNsaWRlcjtcclxufTtcclxuXHJcbi8qKlxyXG4qIFNsaWRlciBwcm9kdWNlcyBhIHZlcnRpY2FsIG9yIGhvcml6b250YWwgc2xpZGVyIHRoYXQgYWxsb3dzIHRvIGNvbnRyb2wgYSB2YWx1ZSBmcm9tIGRyYWdnaW5nIHdpdGggdGhlIG1vdXNlLlxyXG5cclxuKlxyXG4qIEBjbGFzcyBTbGlkZXJcclxuKiBAY29uc3RydWN0b3JcclxuKiBAcGFyYW0ge2pxdWVyeX0gcGFyZW50IG9yIERPTSBlbGVtZW50IHRvIHdoaWNoIHRoaXMgc2xpZGVyIHdpbGwgYmUgYXR0YWNoZWQuXHJcbiogZGVmYXVsdHMgdG8gYCQoXCJib2R5XCIpYFxyXG4qIEBkZWZhdWx0XHJcbiogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgb2JqZWN0IGNvbnRhaW5pbmcgb3B0aW9uc1xyXG4qIEBwYXJhbSB7U3RyaW5nfSBvcHRpb25zLmNzcyBhZGRpdGlvbmFsIGNzcyBwcm9wZXJ0aWVzIGZvciB0aGUgc2xpZGVyXHJcbiogQHBhcmFtIHtmdW5jdGlvbn0gb3B0aW9ucy52YWx1ZUZ1bmN0aW9uXHJcbiogZGVmaW5lcyB0aGUgb3BlcmF0aW9uIHRvIGFwcGx5IHRvIHRoZSBpbnRlcm5hbCB2YWx1ZSB1cG9uIGV2YWx1YXRpb24uIHRoZSBkZWZhdWx0IGlzIGp1c3QgbGluZWFyXHJcbiogQGV4YW1wbGUgbXlTbGlkZXIgbmV3IE1zQ29tcG9uZW50cy5TbGlkZXIoJChcImJvZHlcIikse3ZlcnRpY2FsOmZhbHNlLHZhbHVlOjAuNzN9KTtcclxuKi9cclxuZnVuY3Rpb24gU2xpZGVyKHBhcmVudCxvcHRpb25zKXtcclxuICAvL215IHJlZmVyZW5jZSBudW1iZXIgZm9yIGRhdGEgYmluZGluZy4gV2l0aCB0aGlzIG51bWJlciB0aGUgc29ja2V0IGJpbmRlciBrbm93cyB3aG8gaXMgdGhlIHJlY2lldmVyIG9mIHRoZSBkYXRhLCBhbmQgYWxzbyB3aXRoIHdoYXQgbmFtZSB0byBzZW5kIGl0XHJcbiAgLy9wZW5kYW50OiB0aGlzIGNhbiBwb3RlbnRpYWxseSBjcmVhdGUgYSBwcm9ibGVtLCBiZWNhdXNlIHR3byBvYmplY3RzIGNhbiBiZSBjcmVhdGVkIHNpbXVsdGFuZW91c2x5IGF0IGRpZmZlcmVudCBlbmRzIGF0IHRoZSBzYW1lIHRpbWUuXHJcbiAgLy9tYXliZSBpbnN0ZWFkIG9mIHRoZSBzaW1wbGUgcHVzaCwgdGhlcmUgY291bGQgYmUgYSBjYWxsYmFjaywgYWRuIHRoZSBvYmplY3Qgd2FpdHMgdG8gcmVjZWl2ZSBpdCdzIHNvY2tldCBpZCBvbmNlIGl0cyBjcmVhdGlvbiB3YXMgcHJvcGFnYXRlZCB0aHJvdWdob3V0IGFsbCB0aGUgbmV0d29yaywgb3IgbWF5YmUgdGhlcmUgaXMgYW4gYXJyYXkgZm9yIHNlbnRpbmcgYW5kIG90aGVyIGRpZmZlcmVudCBmb3IgcmVjZWl2aW5nLi4uIGZpcnN0IG9wdGlvbiBzZWVtcyBtb3JlIHNlbnNpYmxlXHJcbiAgdGhpcy5kYXRhPXt2YWx1ZTowfTtcclxuICB0aGlzLnZhbHVlRnVuY3Rpb249ZnVuY3Rpb24odmFsKXtcclxuICAgIHJldHVybiB2YWw7XHJcbiAgfVxyXG4gIHRoaXMuX2JpbmROPXN5bmNtYW4uYmluZExpc3QucHVzaCh0aGlzKS0xO1xyXG4gIHRoaXMuJGpxPSQoJzxkaXYgY2xhc3M9XCJzbGlkZXItY29udGFpbmVyXCIgc3R5bGU9XCJwb3NpdGlvbjpyZWxhdGl2ZVwiPjwvZGl2PicpO1xyXG4gIHRoaXMuJGZhZGVyanE9JCgnPGRpdiBjbGFzcz1cInNsaWRlci1pbm5lclwiIHN0eWxlPVwicG9pbnRlci1ldmVudHM6bm9uZTsgcG9zaXRpb246YWJzb2x1dGVcIj48L2Rpdj4nKTtcclxuICB0aGlzLmxhYmVsPW9wdGlvbnMubGFiZWx8fFwiXCI7XHJcbiAgdGhpcy5sYWJlbGpxPSQoJzxwIGNsYXNzPVwic2xpZGVybGFiZWxcIj48L3A+Jyk7XHJcbiAgdGhpcy4kanEuYXBwZW5kKHRoaXMuJGZhZGVyanEpO1xyXG4gIHRoaXMuJGpxLmFwcGVuZCh0aGlzLmxhYmVsanEpO1xyXG4gIGlmKG9wdGlvbnMuY3NzKVxyXG4gICAgdGhpcy4kanEuY3NzKG9wdGlvbnMuY3NzKTtcclxuICB0aGlzLmNzcz1mdW5jdGlvbihjc3Mpe1xyXG4gICAgdGhpcy4kanEuY3NzKGNzcyk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgdGhpcy5vbkNoYW5nZUNhbGxiYWNrPWZ1bmN0aW9uKCl7fTtcclxuICAvL3BlbmRhbnQ6IHRoaXMgc2hvdWxkIGJlIHBhcnQgb2YgYSBiYXNlIHByb3RvdHlwZSwgbm90IHJlcGVhdGVkIGluIGVhY2ggdHlwZVxyXG4gIGlmKHR5cGVvZiAocGFyZW50LmFwcGVuZHx8ZmFsc2UpPT1cImZ1bmN0aW9uXCIpe1xyXG4gICAgcGFyZW50LmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgfWVsc2UgaWYodHlwZW9mIChwYXJlbnQuJGpxLmFwcGVuZHx8ZmFsc2UpPT1cImZ1bmN0aW9uXCIpe1xyXG4gICAgcGFyZW50LiRqcS5hcHBlbmQodGhpcy4kanEpO1xyXG4gIH1lbHNle1xyXG4gICAgY29uc29sZS5sb2coXCJhIHNsaWRlciBjb3VsZG4ndCBmaW5kIGRvbSBlbGVtZW50IHRvIGF0dGFjaCBoaW1zZWxmXCIpO1xyXG4gIH1cclxuICB2YXIgbWU9dGhpcztcclxuICB0aGlzLm9uQ2hhbmdlPWZ1bmN0aW9uKGNhbGxiYWNrKXtcclxuICAgIG1lLm9uQ2hhbmdlQ2FsbGJhY2s9ZnVuY3Rpb24oKXtjYWxsYmFjayhtZS5kYXRhKX07XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgLyoqXHJcbiogU2V0IHRoZSBkYXRhIHRvIGEgdmFsdWUsIGFuZCBwZXJmb3JtIHRoZSBncmFwaGljIGNoYW5nZXMgYW5kIGRhdGEgYmluZGluZ3MgdGhhdCBjb3JyZXNwb25kIHRvIHRoaXMgY2hhbmdlLlxyXG4qIElmIHlvdSB3YW50ZWQgdG8gY2hhbmdlIHRoZSB2YWx1ZSwgYnV0IG5vdCBnZXQgdGhpcyBjaGFuZ2UgcmVmbGVjdGVkIGluIHRoZSBzbGlkZXIgcG9zaXRpb24sIHlvdSB3b3VsZFxyXG4qIGFzc2lnbiB0aGUgc2xpZGVyLmRhdGEudmFsdWUgdG8geW91ciB2YWx1ZS5cclxuKiBAbWV0aG9kIHNldERhdGFcclxuKiBAcGFyYW0ge251bWJlcn0gdG8gdGFyZ2V0IHZhbHVlXHJcbiogQHBhcmFtIHtib29sZWFufSBbZW1pdD1mYWxzZV0gKm5vdCByZWFkeSogd2V0aGVyIHRvIGVtaXQgdGhyb3VnaCBzeW5jbWFuXHJcbiogQHJldHVybiB7dW5kZWZpbmVkfSBubyByZXR1cm5cclxuKiBAZXhhbXBsZSBteVNsaWRlci5zZXREYXRhKDAuNTMpO1xyXG4qL1xyXG4gIHRoaXMuc2V0RGF0YT1mdW5jdGlvbih0byxlbWl0KXtcclxuICAgIGlmKGVtaXQ9PT10cnVlKXtcclxuICAgICAgLy9wZW5kYW50OiBpbiBzZXF1ZW5jZXJzIHdlIHVzZSBwYXJlbnQuaWQsIGFuZCBoZXJlIHdlIHVzZSBfYmluZE4uIFRvd2FyZHMgYSBjb250cm9sbGVyIEFQSSBhbmQgYSBtb3JlIHNlbnNpY2FsIGNvZGUsIEkgdGhpbmsgYm90aCBzaG91bGQgdXNlIHRoZSBiaW5kIGVsZW1lbnQgYXJyYXkuIHJlYWQgbm90ZSBpbiBmaXJzdCBsaW5lIG9mIHRoaXMgZmlsZS5cclxuICAgICAgLy9wZW5kYW50OiBwYXJlbnQgaW4gc2VxIGlzIHdoYXQgbWUgaXMgaGVyZS4gdGhpcyBpcyBwcmV0dHkgY29uZnVzaW5nIHZhciBuYW1lIGRlY2lzaW9uXHJcbiAgICAgIHN5bmNtYW4uZW1pdChcInNsaWQ6XCIrbWUuX2JpbmROK1wiXCIsXCJzVlwiLHRvKTtcclxuICAgIH1cclxuICAgIHRoaXMuZGF0YS52YWx1ZT10bztcclxuICAgIHRoaXMub25DaGFuZ2VDYWxsYmFjaygpO1xyXG4gICAgdGhpcy51cGRhdGVEb20oKTtcclxuICB9XHJcbiAgdGhpcy5hZGRDbGFzcz1mdW5jdGlvbih0byl7XHJcbiAgICB0aGlzLiRqcS5hZGRDbGFzcyh0byk7XHJcbiAgfVxyXG4gIHRoaXMudmVydGljYWw9b3B0aW9ucy52ZXJ0aWNhbHx8dHJ1ZTtcclxuICB0aGlzLmFkZENsYXNzKFwidmVydGljYWxcIik7XHJcbiAgdGhpcy4kanEub24oXCJtb3VzZWRvd24gdGFwIHRvdWNoc3RhcnRcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgaWYobWUudmVydGljYWwpe1xyXG4gICAgICBtZS5zZXREYXRhKDEtZXZlbnQub2Zmc2V0WS9tZS4kanEuaGVpZ2h0KCksdHJ1ZSk7Ly8sdHJ1ZVxyXG4gICAgfWVsc2V7XHJcbiAgICAgIG1lLnNldERhdGEoZXZlbnQub2Zmc2V0WC9tZS4kanEud2lkdGgoKSx0cnVlKTsvLyx0cnVlXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHRoaXMuJGpxLm9uKFwibW91c2Vtb3ZlIHRvdWNoZW50ZXIgbW91c2VsZWF2ZSBtb3VzZXVwXCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgaWYobW91c2UuYnV0dG9uRG93bil7XHJcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgIHZhciBlbWl0VGhpcz1ldmVudC50eXBlPT1cIm1vdXNlbGVhdmVcInx8ZXZlbnQudHlwZT09XCJtb3VzZXVwXCJcclxuICAgICAgaWYobWUudmVydGljYWwpe1xyXG4gICAgICAgIC8vdGhlIHN0cmFuZ2Ugc2Vjb25kIHBhcmFtZW50ZXIgaW4gc2V0ZGF0YSB3YXMgdHJ1ZSwgYnV0IGl0IGNvdWxkIGNsb2cgdGhlIHNvY2tldFxyXG4gICAgICAgIG1lLnNldERhdGEoMS1ldmVudC5vZmZzZXRZL21lLiRqcS5oZWlnaHQoKSxlbWl0VGhpcyk7Ly8sdHJ1ZVxyXG4gICAgICB9ZWxzZXtcclxuICAgICAgICBtZS5zZXREYXRhKGV2ZW50Lm9mZnNldFgvbWUuJGpxLndpZHRoKCksZW1pdFRoaXMpOy8vLHRydWVcclxuICAgICAgfVxyXG4gICAgfWVsc2V7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgdGhpcy5ldmFsPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIganE9dGhpcy4kanE7XHJcbiAgICBqcS5hZGRDbGFzcyhcInR1cm5cIik7XHJcbiAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICBqcS5yZW1vdmVDbGFzcyhcInR1cm5cIik7XHJcbiAgICB9LDIwMCk7XHJcbiAgICByZXR1cm4gdmFsdWVGdW5jdGlvbih0aGlzLmRhdGEudmFsdWUpO1xyXG4gIH1cclxuICB0aGlzLnVwZGF0ZURvbT1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy52ZXJ0aWNhbCl7XHJcbiAgICAgIHRoaXMuJGZhZGVyanEuY3NzKHtib3R0b206MCx3aWR0aDpcIjEwMCVcIixoZWlnaHQ6dGhpcy5kYXRhLnZhbHVlKnRoaXMuJGpxLmhlaWdodCgpfSk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdGhpcy5sYWJlbGpxLmh0bWwodGhpcy5sYWJlbCk7XHJcbiAgICAgIHRoaXMuJGZhZGVyanEuY3NzKHtib3R0b206MCx3aWR0aDp0aGlzLmRhdGEudmFsdWUqdGhpcy4kanEud2lkdGgoKSxoZWlnaHQ6XCIxMDAlXCJ9KTtcclxuICAgIH1cclxuICB9XHJcbiAgdGhpcy5zZXREYXRhKG9wdGlvbnMudmFsdWUpO1xyXG59IiwibGV0IGVlbWl0ZXI9cmVxdWlyZSgnb25oYW5kbGVycycpO1xyXG52YXIgZ2xvYmFscztcclxudmFyIG1vdXNlO1xyXG5leHBvcnRzLmdldD1mdW5jdGlvbihnbG9iYWxzKXtcclxuICAvLyBzeW5jbWFuPWdsb2JhbHMuc3luY21hbjtcclxuICBtb3VzZT1nbG9iYWxzLm1vdXNlO1xyXG4gIHJldHVybiBjb21wb25lbnRCYXNlO1xyXG59XHJcbi8qKlxyXG4gKiBUaGUgYmFzZSBvZiBjb21wb25lbnRzLlxyXG4gKiBJdCBjb250YWlucyB0aGUgZnVuY3Rpb24gdGhhdCBhcmUgc2hhcmVkIGFtb25nIGFsbCBNc0NvbXBvbmVudHMuIE1ha2VzIGxpdHRsZSBzZW5zZSB0byB1c2UgdGhpcyBhbG9uZVxyXG4gKlxyXG4gKiBAY2xhc3MgY29tcG9uZW50QmFzZVxyXG4gKiBAY29uc3RydWN0b3IgbmV3IE1zQ29tcG9uZW50cy5jb21wb25lbnRCYXNlKERPTS9KcXVlcnkgZWxlbWVudCx7cHJvcGVydGllc30pXHJcbiAqXHJcbiAqIEBwcm9wZXJ0eSBwYXJlbnRcclxuICogQHR5cGUgSnF1ZXJ5IC8gRG9tIGVsZW1lbnQgLyBjb21wb25lbnRCYXNlXHJcbiAqIEBwcm9wZXJ0eSBvcHRpb25zXHJcbiAqIEB0eXBlIG9iamVjdFxyXG4gKi9cclxuZnVuY3Rpb24gY29tcG9uZW50QmFzZShwYXJlbnQsb3B0aW9ucyl7XHJcbiAgZWVtaXRlci5jYWxsKHRoaXMpO1xyXG4gIHRoaXMub3B0aW9ucz1vcHRpb25zO1xyXG4gIHZhciB0aGlzQ29tcG9uZW50PXRoaXM7XHJcbiAgaWYoIXRoaXMubmFtZSl7XHJcbiAgICB0aGlzLm5hbWU9XCJjb21wb25lbnRcIjtcclxuICB9XHJcbiAgdGhpcy4kanE9JCgnPGRpdiBjbGFzcz1cIm1zLScrdGhpcy5uYW1lKydcIj48L2Rpdj4nKTtcclxuICBpZihvcHRpb25zLmNzcylcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgdGhpcy5jc3M9ZnVuY3Rpb24oY3NzKXtcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgaWYodHlwZW9mIChwYXJlbnQuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgICBwYXJlbnQuYXBwZW5kKHRoaXMuJGpxKTtcclxuICB9ZWxzZSBpZih0eXBlb2YgKHBhcmVudC4kanEuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgICBwYXJlbnQuJGpxLmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgfWVsc2V7XHJcbiAgICBjb25zb2xlLmxvZyhcImEgc2xpZGVyIGNvdWxkbid0IGZpbmQgZG9tIGVsZW1lbnQgdG8gYXR0YWNoIGhpbXNlbGZcIik7XHJcbiAgfVxyXG4gIC8qKlxyXG4gICogQHByb3BlcnR5IG1vdXNlQWN0aXZhdGlvbk1vZGVcclxuICAqIEB0eXBlIFN0cmluZ1xyXG4gICogIGRyYWdBbGw6IHRoZSBidXR0b25zIHdpbGwgYWN0aXZhdGUgdGhyb3VnaCBhbGwgdGhlIHRyYWplY3Rvcnkgb2YgdGhlIG1vdXNlIHdoaWxlIHByZXNzZWRcclxuICAqIG9uZUJ5T25lOiBvbmUgY2xpY2s9b25lIGJ1dHRvbiBwcmVzc1xyXG4gICogZHJhZ0xhc3Q6IHRoZSBtb3VzZSBjYW4gYmUgdHJhZ2dlZCBhbmQgd2lsbCBhY3RpdmFlIGFuZCBob3ZlciBvbmx5IHRoZSBsYXN0IGJ1dHRvbiB0aGF0IGl0IGVudGVyZWRcclxuICAqIGhvdmVyOiB0aGUgYnV0dGlucyBhcmUgYWN0aXZhdGVkIHVwb24gaG92ZXIgcmVnYXJkbGVzcyBvZiB3aGV0aGVyIGlzIGNsaWNrZWQgb3Igbm90XHJcbiAgKi9cclxuICBpZighb3B0aW9ucy5tb3VzZUFjdGl2YXRpb25Nb2RlKXtcclxuICAgIG9wdGlvbnMubW91c2VBY3RpdmF0aW9uTW9kZT1cImRyYWdBbGxcIjtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIG1vdXNlQWN0aXZhdGUoZXZlbnQpe1xyXG4gICAgdGhpc0NvbXBvbmVudC5oYW5kbGUoXCJvbk1vdXNlU3RhcnRcIik7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgdGhpc0NvbXBvbmVudC5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcclxuICB9XHJcbiAgZnVuY3Rpb24gbW91c2VEZWFjdGl2YXRlKGV2ZW50KXtcclxuICAgIHRoaXNDb21wb25lbnQuaGFuZGxlKFwib25Nb3VzZUVuZFwiKTtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB0aGlzQ29tcG9uZW50LnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpO1xyXG4gIH1cclxuXHJcbiAgLy90byBhdm9pZCBpZiBjaGFpbnMgdGhhdCBhcmUgYSBwYWluIHRvIGNoYW5nZVxyXG4gIGZ1bmN0aW9uIGFJc0luQihhLGIpe1xyXG4gICAgZm9yICh2YXIgYyBpbiBiKXtcclxuICAgICAgaWYoYT09YltjXSl7Y29uc29sZS5sb2coXCJ0cnVlXCIpO3JldHVybiB0cnVlO31cclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9O1xyXG5cclxuICB0aGlzLiRqcS5vbihcIm1vdXNlZG93biB0YXAgdG91Y2hzdGFydFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIC8vY2hlY2sgdGhhdCB1cG9uIHRoZSBjdXJyZW50IGV2ZW50LCBhIG1vdXNlQWN0aXZhdGUgc2hvdWxkIGJlIHRyaWdnZXJlZC5cclxuICAgIGlmKGFJc0luQihvcHRpb25zLm1vdXNlQWN0aXZhdGlvbk1vZGUsW1wiZHJhZ0FsbFwiLFwib25lQnlPbmVcIixcImRyYWdMYXN0XCJdKSl7XHJcbiAgICAgIG1vdXNlQWN0aXZhdGUoZXZlbnQpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICB0aGlzLiRqcS5vbihcIm1vdXNlZW50ZXJcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBpZihtb3VzZS5idXR0b25Eb3duKXtcclxuICAgICAgaWYoYUlzSW5CKG9wdGlvbnMubW91c2VBY3RpdmF0aW9uTW9kZSxbXCJkcmFnQWxsXCIsXCJkcmFnTGFzdFwiXSkpe1xyXG4gICAgICAgIG1vdXNlQWN0aXZhdGUoZXZlbnQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZihvcHRpb25zLm1vdXNlQWN0aXZhdGlvbk1vZGU9PVwiaG92ZXJcIil7XHJcbiAgICAgIG1vdXNlQWN0aXZhdGUoZXZlbnQpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHRoaXMuJGpxLm9uKFwibW91c2V1cFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIGlmKGFJc0luQihvcHRpb25zLm1vdXNlQWN0aXZhdGlvbk1vZGUsW1wiZHJhZ0FsbFwiLFwib25lQnlPbmVcIixcImRyYWdMYXN0XCJdKSl7XHJcbiAgICAgIG1vdXNlRGVhY3RpdmF0ZShldmVudCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgdGhpcy4kanEub24oXCJtb3VzZW91dFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIGlmKGFJc0luQihvcHRpb25zLm1vdXNlQWN0aXZhdGlvbk1vZGUsW1wiaG92ZXJcIixcIm9uZUJ5T25lXCIsXCJkcmFnTGFzdFwiXSkpe1xyXG4gICAgICBtb3VzZURlYWN0aXZhdGUoZXZlbnQpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuXHJcbiAgdGhpcy51cGRhdGVEb209ZnVuY3Rpb24oKXtcclxuICAgIHRoaXNDb21wb25lbnQuJGpxLmh0bWwodGhpcy5sYWJlbCk7XHJcbiAgfVxyXG4gIC8vYWxpYXNpbmcgb2YgdGhlc2UgdHdvIGhhbmR5IGZ1bmN0aW9uXHJcbiAgdGhpcy5hZGRDbGFzcz1mdW5jdGlvbih0byl7XHJcbiAgICB0aGlzQ29tcG9uZW50LiRqcS5hZGRDbGFzcyh0byk7XHJcbiAgfVxyXG4gIHRoaXMucmVtb3ZlQ2xhc3M9ZnVuY3Rpb24odG8pe1xyXG4gICAgdGhpc0NvbXBvbmVudC4kanEucmVtb3ZlQ2xhc3ModG8pO1xyXG4gIH1cclxufSIsIlxyXG5cclxudmFyIGF1ZGlvQ29udGV4dD1uZXcgQXVkaW9Db250ZXh0KCk7XHJcbnZhciBnbG9iYWxzPXt9O1xyXG5nbG9iYWxzLnN5bmNtYW49cmVxdWlyZSgnLi9zeW5jbWFuLmpzJykuZW5hYmxlKCk7XHJcbmdsb2JhbHMubW91c2U9cmVxdWlyZSgnLi9tb3VzZS5qcycpLmVuYWJsZSgpO1xyXG5nbG9iYWxzLmF1ZGlvQ29udGV4dD1hdWRpb0NvbnRleHQ7XHJcblxyXG52YXIgU2xpZGVyPXJlcXVpcmUoJy4vU2xpZGVyLmpzJykuZW5hYmxlKGdsb2JhbHMpO1xyXG52YXIgU2VxdWVuY2VyPXJlcXVpcmUoJy4vU2VxdWVuY2VyLmpzJykuZW5hYmxlKGdsb2JhbHMpO1xyXG52YXIgQnV0dG9uPXJlcXVpcmUoJy4vQnV0dG9uLmpzJykuZW5hYmxlKGdsb2JhbHMpO1xyXG52YXIgQ2xvY2s9cmVxdWlyZSgnLi9DbG9jay5qcycpLmVuYWJsZShnbG9iYWxzKTtcclxuXHJcbi8qKlxyXG4qIEEgbGlicmFyeSBmb3IgZWFzeSBncmFwaGljIGNvbnRyb2wgb2Ygc3ludGhzLCBtdXNpYyBhbmQgcHJvYmFibHkgb3RoZXIgdGhpbmdzLlxyXG4qIEBpbnN0YW5jZSBNc0NvbXBvbmVudHNcclxuKiBpbnN0YW5jZSBhbnkgbGlicmFyeSBjb21wb25lbnQgYnkgbmV3IGBNc0NvbXBvbmVudHMuY29tcG9uZW50KClgXHJcbiogQGV4YW1wbGUgdmFyIG15U2xpZGVyPSBuZXcgTXNDb21wb25lbnRzLlNsaWRlcigpO1xyXG4qL1xyXG52YXIgTXNDb21wb25lbnRzPXtcclxuICBTbGlkZXI6U2xpZGVyLFxyXG4gIFNlcXVlbmNlcjpTZXF1ZW5jZXIsXHJcbiAgQnV0dG9uOkJ1dHRvbixcclxuICBDbG9jazpDbG9jayxcclxuICBjcmVhdGU6ZnVuY3Rpb24od2hhdCxvcHRpb25zLHdoZXJlKXtcclxuICAgIGlmKCF3aGVyZSlcclxuICAgICAgd2hlcmU9JChcImJvZHlcIik7XHJcbiAgICByZXR1cm4gbmV3IHRoaXNbd2hhdF0od2hlcmUsb3B0aW9ucyk7XHJcbiAgfSxcclxufTtcclxud2luZG93Lk1zQ29tcG9uZW50cz1Nc0NvbXBvbmVudHM7XHJcbmNvbnNvbGUubG9nKE1zQ29tcG9uZW50cyk7IiwiZXhwb3J0cy5lbmFibGU9ZnVuY3Rpb24oKXtcclxuXHJcbiAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcclxuICAgICQoZG9jdW1lbnQpLm9uKFwibW91c2Vkb3duIHRvdWNoc3RhcnQgdG91Y2htb3ZlXCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICBtb3VzZS5idXR0b25Eb3duPXRydWU7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKGV2ZW50KTtcclxuICAgIH0pO1xyXG4gICAgJChkb2N1bWVudCkub24oXCJtb3VzZXVwIHRvdWNoZW5kXCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICBtb3VzZS5idXR0b25Eb3duPWZhbHNlO1xyXG4gICAgfSk7XHJcbiAgICAvLyBkb2N1bWVudC5vbnRvdWNobW92ZSA9IGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIC8vICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIC8vIH1cclxuICB9KTtcclxuICBcclxuICByZXR1cm4gbW91c2U7XHJcbn1cclxudmFyIG1vdXNlPXtcclxuICB0b29sOlwiZHJhd1wiXHJcbn07XHJcblxyXG5cclxuIiwiLypcclxuVGhpcyBzY3JpcHQgY29udGFpbnMgYSB0ZW1wbGF0ZSBmb3IgZGF0YS1iaW5kaW5nIG1hbmFnZW1lbnQgaWYgeW91IHdhbnQgdG8gZG8gc28uIE90aGVyd2lzZSwgaXQgd2lsbCBqdXN0IHBsYWNlaG9sZCB2YXIgbmFtZXMgc28gdGhlcmUgYXJlIG5vIHVuZGVmaW5lZCB2YXJzLlxyXG4gICAgQ29weXJpZ2h0IChDKSAyMDE2IEpvYXF1w61uIEFsZHVuYXRlXHJcblxyXG4gICAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcclxuICAgIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbiAgICB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4gICAgKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cclxuXHJcbiAgICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuICAgIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbiAgICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbiAgICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG5cclxuICAgIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbiAgICBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxuXHJcbmV4cG9ydHMuZW5hYmxlPWZ1bmN0aW9uKCl7XHJcbiAgcmV0dXJuIG5ldyBTeW5jbWFuKCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBTeW5jbWFuKCl7XHJcbiAgLy9saXN0IG9mIGFsbCB0aGUgaXRlbXMgdGhhdCB1c2UgZGF0YSBiaW5kaW5nXHJcbiAgdGhpcy5iaW5kTGlzdD1bXTtcclxuICAvL2hvdyBhcmUgeW91IGVtaXR0aW5nIGNoYW5nZXM/IGl0IGRlcGVuZHMgb24gdGhlIHNlcnZlciB5b3UgdXNlLlxyXG4gIHRoaXMuZW1pdD1mdW5jdGlvbigpe31cclxufVxyXG4iXX0=