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
  componentBase = globals.componentBase;
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
"use strict";

var componentBase;
var eemiter = require('onhandlers');
var syncman, mouse;
exports.enable = function (globals) {
  syncman = globals.syncman;
  mouse = globals.mouse;
  componentBase = globals.componentBase;
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

},{"onhandlers":2}],11:[function(require,module,exports){
"use strict";

var componentBase;
var eemiter = require('onhandlers');
var syncman, mouse;

exports.enable = function (globals) {
  syncman = globals.syncman;
  mouse = globals.mouse;
  componentBase = globals.componentBase;
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
* @param {object} options.label :""
* @param {object} options.valueFunction :function(val){
  return val;
}
* @param {object} options.value :0
* @param {object} options.data :{value:0}
* @param {object} options.ertical :true
* defines the operation to apply to the internal value upon evaluation. the default is just linear

* @example mySlider new MsComponents.Slider($("body"),{vertical:false,value:0.73});
*/
function Slider(parent, options) {
  var thisSlider = this;
  this.name = "slider";
  var defaults = {
    label: "",
    valueFunction: function valueFunction(val) {
      return val;
    },
    value: 0,
    data: { value: 0 },
    vertical: true
  };
  componentBase.call(this, parent, options, defaults);
  //my reference number for data binding. With this number the socket binder knows who is the reciever of the data, and also with what name to send it
  //pendant: this can potentially create a problem, because two objects can be created simultaneously at different ends at the same time.
  //maybe instead of the simple push, there could be a callback, adn the object waits to receive it's socket id once its creation was propagated throughout all the network, or maybe there is an array for senting and other different for receiving... first option seems more sensible
  // this.data={value:0};

  this._bindN = syncman.bindList.push(this) - 1;

  // this.label=options.label||"";
  //slider needs additional $jq objects for the inner rolling slider, and for label, which is not yet fully implemented
  this.$faderjq = $('<div class="slider-inner" style="pointer-events:none; position:absolute"></div>');
  this.$labeljq = $('<p class="sliderlabel"></p>');

  this.$jq.append(this.$faderjq);
  this.$jq.append(this.$labeljq);

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
  // this.vertical=options.vertical||true;
  this.$jq.on("mousemove", function (event) {
    if (me.mouseActive) {
      event.preventDefault();
      if (me.vertical) {
        me.setData(1 - event.offsetY / me.$jq.height(), true); //,true
      } else {
        me.setData(event.offsetX / me.$jq.width(), true); //,true
      }
    }
  });
  this.on("onMouseStart", function (event) {
    event.preventDefault();
    // if(me.vertical){
    //   me.setData(1-event.offsetY/me.$jq.height(),true);//,true
    // }else{
    //   me.setData(event.offsetX/me.$jq.width(),true);//,true
    // }
  });

  this.on("onMouseEnd", function (event) {
    if (mouse.buttonDown) {
      event.preventDefault();
      var emitThis = event.type == "mouseleave" || event.type == "mouseup";
      // if(me.vertical){
      //   //the strange second paramenter in setdata was true, but it could clog the socket
      //   me.setData(1-event.offsetY/me.$jq.height(),emitThis);//,true
      // }else{
      //   me.setData(event.offsetX/me.$jq.width(),emitThis);//,true
      // }
    } else {}
  });
  this.eval = function () {
    var jq = this.$jq;
    jq.addClass("turn");
    window.setTimeout(function () {
      jq.removeClass("turn");
    }, 200);
    return this.valueFunction(this.data.value);
  };

  this.updateDom = function () {
    if (this.vertical) {
      this.$faderjq.css({ bottom: 0, width: "100%", height: this.data.value * this.$jq.height() });
      this.addClass("vertical");
    } else {
      this.$labeljq.html(this.label);
      this.$faderjq.css({ bottom: 0, width: this.data.value * this.$jq.width(), height: "100%" });
    }
  };
  console.log(this.options, "bals");
  this.setData(this.options.value);
  this.updateDom();
}

},{"onhandlers":2}],12:[function(require,module,exports){
"use strict";

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
 * @constructor componentBase.call(this,parent,options,defaults);
 *
 * @property parent
 * @type Jquery / Dom element / componentBase
 * @param {object} options values for customization of the component
 * @param {object} defaults values that will belong to the inheriting object.
 * the default object will contain all the default properties for the object itself
 * aswell as for the object.properties.
 *
 * All default values will be overwritten by the options values, and therefore
 * declaring a default in the object will make a property of the options object
 * to belong to the object, where otherwise the options property would remain
 * in the object.properties only.
 *
 *
 * @example

 function AButton(parent,options){
    var defaults={a:0,b:1}
    this.name="AButton";
    componentBase.call(this,parent,options,defaults);
 }
 var d=new Button($(body),{a:4,c:5});
//will create a div with class ms-AButton, and var d will contain properties
//a=4, b=1 & options= {a:4,b:1,c:5}

 *
 * @type object
 */
function componentBase(parent, options, defaults) {
  var thisComponent = this;

  var defaults = defaults || {};
  //make sure this object will contain defaults and options.
  if (options) {
    this.options = options;
  } else {
    this.options = {};
  }

  //defaults contain default properties for the object
  //options contain the user written options that will overwrite the defaults.
  //object keeps track of the options in the this.options, so if the object mutates, it can be retrieved back
  for (var a in defaults) {
    if (!this.options[a]) this.options[a] = defaults[a];
    this[a] = this.options[a];
  }

  console.log("post", this.options, options, defaults);

  eemiter.call(this);
  if (!this.name) {
    this.name = "component";
  }
  /**
    * @property {$jq} own's jquery object
  */
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
  this.mouseActive = false;
  function mouseActivate(event) {
    thisComponent.handle("onMouseStart", event);
    event.preventDefault();
    thisComponent.addClass("active");
    thisComponent.mouseActive = true;
  }
  function mouseDeactivate(event) {
    thisComponent.handle("onMouseEnd", event);
    event.preventDefault();
    thisComponent.removeClass("active");
    thisComponent.mouseActive = false;
  }

  //to avoid iffy chains that are a pain to change
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
var _cb = require('./componentBase.js');
globals.componentBase = _cb.get({ syncman: globals.syncman, mouse: globals.mouse });

var Slider = require('./Slider.js').enable(globals);
var Sequencer = require('./Sequencer.js').enable(globals);
var Button = require('./Button.js').enable(globals);
var Clock = require('./Clock.js').enable(globals);

/**
* A library for easy graphic control of synths, music and probably other things.
* This documentation has a long way to go.
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

},{"./Button.js":8,"./Clock.js":9,"./Sequencer.js":10,"./Slider.js":11,"./componentBase.js":12,"./mouse.js":14,"./syncman.js":15}],14:[function(require,module,exports){
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9vbmhhbmRsZXJzL29uLmpzIiwibm9kZV9tb2R1bGVzL3dlYi1hdWRpby1zY2hlZHVsZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvd2ViLWF1ZGlvLXNjaGVkdWxlci9saWIvV2ViQXVkaW9TY2hlZHVsZXIuanMiLCJub2RlX21vZHVsZXMvd2ViLWF1ZGlvLXNjaGVkdWxlci9saWIvZGVmYXVsdENvbnRleHQuanMiLCJub2RlX21vZHVsZXMvd2ViLWF1ZGlvLXNjaGVkdWxlci9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvd2ViLWF1ZGlvLXNjaGVkdWxlci9saWIvdXRpbHMvZGVmYXVsdHMuanMiLCJzcmNcXEJ1dHRvbi5qcyIsInNyY1xcQ2xvY2suanMiLCJzcmNcXFNlcXVlbmNlci5qcyIsInNyY1xcU2xpZGVyLmpzIiwic3JjXFxjb21wb25lbnRCYXNlLmpzIiwic3JjXFxpbmRleC5qcyIsInNyY1xcbW91c2UuanMiLCJzcmNcXHN5bmNtYW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTs7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QVY7Ozs7O0FDakJBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkEsUUFBUSxNQUFSLEdBQWUsWUFBVTtBQUN2QixXQUFPLElBQUksT0FBSixFQUFQO0FBQ0QsQ0FGRDs7QUFJQSxTQUFTLE9BQVQsR0FBa0I7QUFDaEI7QUFDQSxTQUFLLFFBQUwsR0FBYyxFQUFkO0FBQ0E7QUFDQSxTQUFLLElBQUwsR0FBVSxZQUFVLENBQUUsQ0FBdEI7QUFDRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQXQgbGVhc3QgZ2l2ZSBzb21lIGtpbmQgb2YgY29udGV4dCB0byB0aGUgdXNlclxuICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LiAoJyArIGVyICsgJyknKTtcbiAgICAgICAgZXJyLmNvbnRleHQgPSBlcjtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2UgaWYgKGxpc3RlbmVycykge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKHRoaXMuX2V2ZW50cykge1xuICAgIHZhciBldmxpc3RlbmVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oZXZsaXN0ZW5lcikpXG4gICAgICByZXR1cm4gMTtcbiAgICBlbHNlIGlmIChldmxpc3RlbmVyKVxuICAgICAgcmV0dXJuIGV2bGlzdGVuZXIubGVuZ3RoO1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHJldHVybiBlbWl0dGVyLmxpc3RlbmVyQ291bnQodHlwZSk7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCIvKlxyXG55b3UgbWFrZSB0aGUgb25IYW5kbGVycy5jYWxsKHRoaXMpIGluIHRoZSBvYmplY3QgdGhhdCBuZWVkcyB0byBoYXZlIGhhbmRsZXJzLlxyXG50aGVuIHlvdSBjYW4gY3JlYXRlIGEgZnVuY3Rpb24gY2FsbGJhY2sgZm9yIHRoYXQgb2JqZWN0IHVzaW5nIG9iamVjdC5vbihcImhhbmRsZXJOYW1lLm9wdGlvbmFsTmFtZVwiLGNhbGxiYWNrRnVuY3Rpb24oKXt9KTtcclxudGhlIG9iamVjdCBjYW4gcnVuIHRoZSBoYW5kbGUgY2FsbGJhY2tzIGJ5IHVzaW5nIHRoaXMuaGFuZGxlKFwiaGFuZGxlck5hbWVcIixwYXJhbWV0ZXJzVG9GZWVkKTtcclxuKi9cclxubW9kdWxlLmV4cG9ydHM9ZnVuY3Rpb24oKSB7XHJcbiAgdmFyIGV2ZW50VmVyYm9zZT1mYWxzZTtcclxuICBpZiAoIXRoaXMub25zKSB7XHJcbiAgICB0aGlzLm9ucyA9IFtdO1xyXG4gIH1cclxuICB0aGlzLm9uID0gZnVuY3Rpb24obmFtZSwgY2FsbGJhY2spIHtcclxuICAgIHZhciBuYW1lID0gbmFtZS5zcGxpdChcIi5cIik7XHJcbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIGlmIChuYW1lLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgdGhyb3cgKFwic29ycnksIHlvdSBnYXZlIGFuIGludmFsaWQgZXZlbnQgbmFtZVwiKTtcclxuICAgICAgfSBlbHNlIGlmIChuYW1lLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBpZiAoIXRoaXMub25zW25hbWVbMF1dKSB0aGlzLm9uc1tuYW1lWzBdXSA9IFtdO1xyXG4gICAgICAgIHRoaXMub25zW25hbWVbMF1dLnB1c2goW2ZhbHNlLCBjYWxsYmFja10pO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMub25zKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IChcImVycm9yIGF0IG1vdXNlLm9uLCBwcm92aWRlZCBjYWxsYmFjayB0aGF0IGlzIG5vdCBhIGZ1bmN0aW9uXCIpO1xyXG4gICAgfVxyXG4gIH1cclxuICB0aGlzLm9mZiA9IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgIHZhciBuYW1lID0gbmFtZS5zcGxpdChcIi5cIik7XHJcbiAgICBpZiAobmFtZS5sZW5ndGggPiAxKSB7XHJcbiAgICAgIGlmICghdGhpcy5vbnNbbmFtZVswXV0pIHRoaXMub25zW25hbWVbMF1dID0gW107XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKFwicHJldlwiLHRoaXMub25zW25hbWVbMF1dKTtcclxuICAgICAgdGhpcy5vbnNbbmFtZVswXV0uc3BsaWNlKHRoaXMub25zW25hbWVbMF1dLmluZGV4T2YobmFtZVsxXSksIDEpO1xyXG4gICAgICAvLyBjb25zb2xlLmxvZyhcInRoZW5cIix0aGlzLm9uc1tuYW1lWzBdXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyAoXCJzb3JyeSwgeW91IGdhdmUgYW4gaW52YWxpZCBldmVudCBuYW1lXCIgKyBuYW1lKTtcclxuICAgIH1cclxuICB9XHJcbiAgdGhpcy5oYW5kbGUgPSBmdW5jdGlvbihmbmFtZSwgcGFyYW1zKSB7XHJcbiAgICBpZihldmVudFZlcmJvc2UpIGNvbnNvbGUubG9nKFwiRXZlbnQgXCIrZm5hbWUrXCI6XCIse2NhbGxlcjp0aGlzLHBhcmFtczpwYXJhbXN9KTtcclxuICAgIGlmICh0aGlzLm9uc1tmbmFtZV0pIHtcclxuICAgICAgZm9yICh2YXIgbiBpbiB0aGlzLm9uc1tmbmFtZV0pIHtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLm9uc1tmbmFtZV1bbl1bMV0pO1xyXG4gICAgICAgIHRoaXMub25zW2ZuYW1lXVtuXVsxXShwYXJhbXMpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59OyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vbGliXCIpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKCFzZWxmKSB7IHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcInRoaXMgaGFzbid0IGJlZW4gaW5pdGlhbGlzZWQgLSBzdXBlcigpIGhhc24ndCBiZWVuIGNhbGxlZFwiKTsgfSByZXR1cm4gY2FsbCAmJiAodHlwZW9mIGNhbGwgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikgPyBjYWxsIDogc2VsZjsgfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCBcIiArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxudmFyIGV2ZW50cyA9IHJlcXVpcmUoXCJldmVudHNcIik7XG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKFwiLi91dGlscy9kZWZhdWx0c1wiKTtcbnZhciBkZWZhdWx0Q29udGV4dCA9IHJlcXVpcmUoXCIuL2RlZmF1bHRDb250ZXh0XCIpO1xuXG52YXIgV2ViQXVkaW9TY2hlZHVsZXIgPSBmdW5jdGlvbiAoX2V2ZW50cyRFdmVudEVtaXR0ZXIpIHtcbiAgX2luaGVyaXRzKFdlYkF1ZGlvU2NoZWR1bGVyLCBfZXZlbnRzJEV2ZW50RW1pdHRlcik7XG5cbiAgZnVuY3Rpb24gV2ViQXVkaW9TY2hlZHVsZXIob3B0cykge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBXZWJBdWRpb1NjaGVkdWxlcik7XG5cbiAgICBvcHRzID0gb3B0cyB8fCAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL3t9O1xuXG4gICAgdmFyIF90aGlzID0gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgKFdlYkF1ZGlvU2NoZWR1bGVyLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoV2ViQXVkaW9TY2hlZHVsZXIpKS5jYWxsKHRoaXMpKTtcblxuICAgIF90aGlzLmNvbnRleHQgPSBkZWZhdWx0cyhvcHRzLmNvbnRleHQsIGRlZmF1bHRDb250ZXh0KTtcbiAgICBfdGhpcy5pbnRlcnZhbCA9IGRlZmF1bHRzKG9wdHMuaW50ZXJ2YWwsIDAuMDI1KTtcbiAgICBfdGhpcy5haGVhZFRpbWUgPSBkZWZhdWx0cyhvcHRzLmFoZWFkVGltZSwgMC4xKTtcbiAgICBfdGhpcy50aW1lckFQSSA9IGRlZmF1bHRzKG9wdHMudGltZXJBUEksIGdsb2JhbCk7XG4gICAgX3RoaXMucGxheWJhY2tUaW1lID0gX3RoaXMuY3VycmVudFRpbWU7XG5cbiAgICBfdGhpcy5fdGltZXJJZCA9IDA7XG4gICAgX3RoaXMuX3NjaGVkSWQgPSAwO1xuICAgIF90aGlzLl9zY2hlZHMgPSBbXTtcbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoV2ViQXVkaW9TY2hlZHVsZXIsIFt7XG4gICAga2V5OiBcInN0YXJ0XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHN0YXJ0KGNhbGxiYWNrLCBhcmdzKSB7XG4gICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgICAgdmFyIGxvb3AgPSBmdW5jdGlvbiBsb29wKCkge1xuICAgICAgICB2YXIgdDAgPSBfdGhpczIuY29udGV4dC5jdXJyZW50VGltZTtcbiAgICAgICAgdmFyIHQxID0gdDAgKyBfdGhpczIuYWhlYWRUaW1lO1xuXG4gICAgICAgIF90aGlzMi5fcHJvY2Vzcyh0MCwgdDEpO1xuICAgICAgfTtcblxuICAgICAgaWYgKHRoaXMuX3RpbWVySWQgPT09IDApIHtcbiAgICAgICAgdGhpcy5fdGltZXJJZCA9IHRoaXMudGltZXJBUEkuc2V0SW50ZXJ2YWwobG9vcCwgdGhpcy5pbnRlcnZhbCAqIDEwMDApO1xuXG4gICAgICAgIHRoaXMuZW1pdChcInN0YXJ0XCIpO1xuXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgIHRoaXMuaW5zZXJ0KHRoaXMuY29udGV4dC5jdXJyZW50VGltZSwgY2FsbGJhY2ssIGFyZ3MpO1xuICAgICAgICAgIGxvb3AoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjYWxsYmFjaykge1xuICAgICAgICB0aGlzLmluc2VydCh0aGlzLmNvbnRleHQuY3VycmVudFRpbWUsIGNhbGxiYWNrLCBhcmdzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInN0b3BcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgIHZhciByZXNldCA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHRydWUgOiBhcmd1bWVudHNbMF07XG5cbiAgICAgIGlmICh0aGlzLl90aW1lcklkICE9PSAwKSB7XG4gICAgICAgIHRoaXMudGltZXJBUEkuY2xlYXJJbnRlcnZhbCh0aGlzLl90aW1lcklkKTtcbiAgICAgICAgdGhpcy5fdGltZXJJZCA9IDA7XG5cbiAgICAgICAgdGhpcy5lbWl0KFwic3RvcFwiKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlc2V0KSB7XG4gICAgICAgIHRoaXMuX3NjaGVkcy5zcGxpY2UoMCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJpbnNlcnRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gaW5zZXJ0KHRpbWUsIGNhbGxiYWNrLCBhcmdzKSB7XG4gICAgICB2YXIgaWQgPSArK3RoaXMuX3NjaGVkSWQ7XG4gICAgICB2YXIgZXZlbnQgPSB7IGlkOiBpZCwgdGltZTogdGltZSwgY2FsbGJhY2s6IGNhbGxiYWNrLCBhcmdzOiBhcmdzIH07XG4gICAgICB2YXIgc2NoZWRzID0gdGhpcy5fc2NoZWRzO1xuXG4gICAgICBpZiAoc2NoZWRzLmxlbmd0aCA9PT0gMCB8fCBzY2hlZHNbc2NoZWRzLmxlbmd0aCAtIDFdLnRpbWUgPD0gdGltZSkge1xuICAgICAgICBzY2hlZHMucHVzaChldmVudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaW1heCA9IHNjaGVkcy5sZW5ndGg7IGkgPCBpbWF4OyBpKyspIHtcbiAgICAgICAgICBpZiAodGltZSA8IHNjaGVkc1tpXS50aW1lKSB7XG4gICAgICAgICAgICBzY2hlZHMuc3BsaWNlKGksIDAsIGV2ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gaWQ7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcIm5leHRUaWNrXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG5leHRUaWNrKHRpbWUsIGNhbGxiYWNrLCBhcmdzKSB7XG4gICAgICBpZiAodHlwZW9mIHRpbWUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBhcmdzID0gY2FsbGJhY2s7XG4gICAgICAgIGNhbGxiYWNrID0gdGltZTtcbiAgICAgICAgdGltZSA9IHRoaXMucGxheWJhY2tUaW1lO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5pbnNlcnQodGltZSArIHRoaXMuYWhlYWRUaW1lLCBjYWxsYmFjaywgYXJncyk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInJlbW92ZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZW1vdmUoc2NoZWRJZCkge1xuICAgICAgdmFyIHNjaGVkcyA9IHRoaXMuX3NjaGVkcztcblxuICAgICAgaWYgKHR5cGVvZiBzY2hlZElkID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpbWF4ID0gc2NoZWRzLmxlbmd0aDsgaSA8IGltYXg7IGkrKykge1xuICAgICAgICAgIGlmIChzY2hlZElkID09PSBzY2hlZHNbaV0uaWQpIHtcbiAgICAgICAgICAgIHNjaGVkcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNjaGVkSWQ7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInJlbW92ZUFsbFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZW1vdmVBbGwoKSB7XG4gICAgICB0aGlzLl9zY2hlZHMuc3BsaWNlKDApO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJfcHJvY2Vzc1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBfcHJvY2Vzcyh0MCwgdDEpIHtcbiAgICAgIHZhciBzY2hlZHMgPSB0aGlzLl9zY2hlZHM7XG4gICAgICB2YXIgcGxheWJhY2tUaW1lID0gdDA7XG5cbiAgICAgIHRoaXMucGxheWJhY2tUaW1lID0gcGxheWJhY2tUaW1lO1xuICAgICAgdGhpcy5lbWl0KFwicHJvY2Vzc1wiLCB7IHBsYXliYWNrVGltZTogcGxheWJhY2tUaW1lIH0pO1xuXG4gICAgICB3aGlsZSAoc2NoZWRzLmxlbmd0aCAmJiBzY2hlZHNbMF0udGltZSA8IHQxKSB7XG4gICAgICAgIHZhciBldmVudCA9IHNjaGVkcy5zaGlmdCgpO1xuICAgICAgICB2YXIgX3BsYXliYWNrVGltZSA9IGV2ZW50LnRpbWU7XG4gICAgICAgIHZhciBhcmdzID0gZXZlbnQuYXJncztcblxuICAgICAgICB0aGlzLnBsYXliYWNrVGltZSA9IF9wbGF5YmFja1RpbWU7XG5cbiAgICAgICAgZXZlbnQuY2FsbGJhY2soeyBwbGF5YmFja1RpbWU6IF9wbGF5YmFja1RpbWUsIGFyZ3M6IGFyZ3MgfSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMucGxheWJhY2tUaW1lID0gcGxheWJhY2tUaW1lO1xuICAgICAgdGhpcy5lbWl0KFwicHJvY2Vzc2VkXCIsIHsgcGxheWJhY2tUaW1lOiBwbGF5YmFja1RpbWUgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInN0YXRlXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fdGltZXJJZCAhPT0gMCA/IFwicnVubmluZ1wiIDogXCJzdXNwZW5kZWRcIjtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY3VycmVudFRpbWVcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbnRleHQuY3VycmVudFRpbWU7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImV2ZW50c1wiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3NjaGVkcy5zbGljZSgpO1xuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBXZWJBdWRpb1NjaGVkdWxlcjtcbn0oZXZlbnRzLkV2ZW50RW1pdHRlcik7XG5cbm1vZHVsZS5leHBvcnRzID0gV2ViQXVkaW9TY2hlZHVsZXI7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZXQgY3VycmVudFRpbWUoKSB7XG4gICAgcmV0dXJuIERhdGUubm93KCkgLyAxMDAwO1xuICB9XG59OyIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL1dlYkF1ZGlvU2NoZWR1bGVyXCIpOyIsIlwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBkZWZhdWx0cyh2YWx1ZSwgZGVmYXVsdFZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSAhPT0gdW5kZWZpbmVkID8gdmFsdWUgOiBkZWZhdWx0VmFsdWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZGVmYXVsdHM7IiwidmFyIGNvbXBvbmVudEJhc2U9cmVxdWlyZSgnLi9jb21wb25lbnRCYXNlJyk7XHJcbnZhciBzeW5jbWFuLG1vdXNlO1xyXG5leHBvcnRzLmVuYWJsZT1mdW5jdGlvbihnbG9iYWxzKXtcclxuICBzeW5jbWFuPWdsb2JhbHMuc3luY21hbjtcclxuICBtb3VzZT1nbG9iYWxzLm1vdXNlO1xyXG4gIGNvbXBvbmVudEJhc2U9Z2xvYmFscy5jb21wb25lbnRCYXNlO1xyXG4gIHJldHVybiBCdXR0b247XHJcbn1cclxuZnVuY3Rpb24gQnV0dG9uKHBhcmVudCxvcHRpb25zKXtcclxuICB0aGlzLm5hbWU9XCJidXR0b25cIjtcclxuICBjb21wb25lbnRCYXNlLmNhbGwodGhpcyxwYXJlbnQsb3B0aW9ucyk7XHJcbiAgLy9teSByZWZlcmVuY2UgbnVtYmVyIGZvciBkYXRhIGJpbmRpbmcuIFdpdGggdGhpcyBudW1iZXIgdGhlIHNvY2tldCBiaW5kZXIga25vd3Mgd2hvIGlzIHRoZSByZWNpZXZlciBvZiB0aGUgZGF0YSwgYW5kIGFsc28gd2l0aCB3aGF0IG5hbWUgdG8gc2VuZCBpdFxyXG4gIC8vcGVuZGFudDogdGhpcyBjYW4gcG90ZW50aWFsbHkgY3JlYXRlIGEgcHJvYmxlbSwgYmVjYXVzZSB0d28gb2JqZWN0cyBjYW4gYmUgY3JlYXRlZCBzaW11bHRhbmVvdXNseSBhdCBkaWZmZXJlbnQgZW5kcyBhdCB0aGUgc2FtZSB0aW1lLlxyXG4gIC8vbWF5YmUgaW5zdGVhZCBvZiB0aGUgc2ltcGxlIHB1c2gsIHRoZXJlIGNvdWxkIGJlIGEgY2FsbGJhY2ssIGFkbiB0aGUgb2JqZWN0IHdhaXRzIHRvIHJlY2VpdmUgaXQncyBzb2NrZXQgaWQgb25jZSBpdHMgY3JlYXRpb24gd2FzIHByb3BhZ2F0ZWQgdGhyb3VnaG91dCBhbGwgdGhlIG5ldHdvcmssIG9yIG1heWJlIHRoZXJlIGlzIGFuIGFycmF5IGZvciBzZW50aW5nIGFuZCBvdGhlciBkaWZmZXJlbnQgZm9yIHJlY2VpdmluZy4uLiBmaXJzdCBvcHRpb24gc2VlbXMgbW9yZSBzZW5zaWJsZVxyXG4gIHRoaXMuZGF0YT17dmFsdWU6MH07XHJcbiAgdGhpcy5zdGF0ZXM9ZmFsc2U7XHJcbiAgdGhpcy5fYmluZE49c3luY21hbi5iaW5kTGlzdC5wdXNoKHRoaXMpLTE7XHJcbiAgLy90aGlzLiRqcT0kKCc8ZGl2IGNsYXNzPVwibXMtYnV0dG9uXCI+PC9kaXY+Jyk7XHJcbiAgdGhpcy5sYWJlbD1vcHRpb25zLmxhYmVsfHxcIuKYu1wiO1xyXG4gIHRoaXMuJGpxLmFwcGVuZCh0aGlzLiRmYWRlcmpxKTtcclxuICB0aGlzLiRqcS5odG1sKHRoaXMubGFiZWwpO1xyXG4gIC8vIGlmKG9wdGlvbnMuY3NzKVxyXG4gIC8vICAgdGhpcy4kanEuY3NzKG9wdGlvbnMuY3NzKTtcclxuICAvLyB0aGlzLmNzcz1mdW5jdGlvbihjc3Mpe1xyXG4gIC8vICAgdGhpcy4kanEuY3NzKG9wdGlvbnMuY3NzKTtcclxuICAvLyAgIHJldHVybiB0aGlzO1xyXG4gIC8vIH1cclxuICAvL2lmIGEgc3dpdGNoIHZhcmlhYmxlIGlzIHBhc3NlZCwgdGhpcyBidXR0b24gd2lsbCBzd2l0Y2ggb24gZWFjaCBjbGljayBhbW9uZyB0aGUgc3RhdGVkIHN0YXRlc1xyXG4gIGlmKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoXCJzd2l0Y2hcIikpe1xyXG4gICAgdGhpcy5zdGF0ZXM9W107XHJcbiAgICB0aGlzLmRhdGEuY3VycmVudFN0YXRlPTA7XHJcbiAgICB0aGlzLnN0YXRlcz1vcHRpb25zLnN3aXRjaDtcclxuICAgIHRoaXMuc3dpdGNoU3RhdGUoMCk7XHJcbiAgfVxyXG4gIHRoaXMub25DbGlja0NhbGxiYWNrPWZ1bmN0aW9uKCl7fTtcclxuICB0aGlzLm9uUmVsZWFzZUNhbGxiYWNrPWZ1bmN0aW9uKCl7fTtcclxuICAvL3BlbmRhbnQ6IHRoaXMgc2hvdWxkIGJlIHBhcnQgb2YgYSBiYXNlIHByb3RvdHlwZSwgbm90IHJlcGVhdGVkIGluIGVhY2ggdHlwZVxyXG4gIC8vIGlmKHR5cGVvZiAocGFyZW50LmFwcGVuZHx8ZmFsc2UpPT1cImZ1bmN0aW9uXCIpe1xyXG4gIC8vICAgcGFyZW50LmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgLy8gfWVsc2UgaWYodHlwZW9mIChwYXJlbnQuJGpxLmFwcGVuZHx8ZmFsc2UpPT1cImZ1bmN0aW9uXCIpe1xyXG4gIC8vICAgcGFyZW50LiRqcS5hcHBlbmQodGhpcy4kanEpO1xyXG4gIC8vIH1lbHNle1xyXG4gIC8vICAgY29uc29sZS5sb2coXCJhIHNsaWRlciBjb3VsZG4ndCBmaW5kIGRvbSBlbGVtZW50IHRvIGF0dGFjaCBoaW1zZWxmXCIpO1xyXG4gIC8vIH1cclxuICB2YXIgbWU9dGhpcztcclxuICAvLyB0aGlzLm9uQ2hhbmdlPWZ1bmN0aW9uKGNhbGxiYWNrKXtcclxuICAvLyAgIG1lLm9uQ2xpY2tDYWxsYmFjaz1mdW5jdGlvbigpe2NhbGxiYWNrKG1lLmRhdGEpfTtcclxuICAvLyAgIHJldHVybiB0aGlzO1xyXG4gIC8vIH1cclxuXHJcbiAgdGhpcy4kanEub24oXCJtb3VzZWRvd24gdGFwIHRvdWNoc3RhcnRcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBtZS5vbkNsaWNrQ2FsbGJhY2sobWUuZGF0YSk7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgbWUuc3dpdGNoU3RhdGUoKTtcclxuICAgIG1lLmFkZENsYXNzKFwiYWN0aXZlXCIpO1xyXG4gIH0pO1xyXG4gIHRoaXMuJGpxLm9uKFwibW91c2V1cCBtb3VzZWxlYXZlXCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgbWUub25SZWxlYXNlQ2FsbGJhY2sobWUuZGF0YSk7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgbWUucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIik7XHJcbiAgfSk7XHJcbn1cclxuXHJcblxyXG5CdXR0b24ucHJvdG90eXBlLm9uQ2xpY2s9ZnVuY3Rpb24oY2FsbGJhY2spe1xyXG4gIHRoaXMub25DbGlja0NhbGxiYWNrPWNhbGxiYWNrO1xyXG4gIHJldHVybiB0aGlzO1xyXG59XHJcbkJ1dHRvbi5wcm90b3R5cGUub25SZWxlYXNlPWZ1bmN0aW9uKGNhbGxiYWNrKXtcclxuICB0aGlzLm9uUmVsZWFzZUNhbGxiYWNrPWNhbGxiYWNrO1xyXG4gIHJldHVybiB0aGlzO1xyXG59XHJcbkJ1dHRvbi5wcm90b3R5cGUuc3dpdGNoU3RhdGU9ZnVuY3Rpb24odG8pe1xyXG4gIGlmKHRoaXMuc3RhdGVzKXtcclxuICAgIC8vY2hhbmdlIHN0YXRlIG51bWJlciB0byBuZXh0XHJcbiAgICBpZih0byl7XHJcbiAgICAgIHRoaXMuZGF0YS5jdXJyZW50U3RhdGU9dG8ldGhpcy5zdGF0ZXMubGVuZ3RoO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIHRoaXMuZGF0YS5jdXJyZW50U3RhdGU9KHRoaXMuZGF0YS5jdXJyZW50U3RhdGUrMSkldGhpcy5zdGF0ZXMubGVuZ3RoO1xyXG4gICAgfVxyXG4gICAgLy9hcHBseSBhbGwgdGhlIHByb3BlcnRpZXMgdGhhdCB0aGUgc3RhdGUgY2FycnkuIFRoaXMgbWFrZXMgdGhlIGJ1dHRvbiBzdXBlciBoYWNrYWJsZVxyXG4gICAgZm9yKGEgaW4gdGhpcy5zdGF0ZXNbdGhpcy5kYXRhLmN1cnJlbnRTdGF0ZV0pe1xyXG4gICAgICB0aGlzW2FdPXRoaXMuc3RhdGVzW3RoaXMuZGF0YS5jdXJyZW50U3RhdGVdW2FdO1xyXG4gICAgICAvLyBjb25zb2xlLmxvZyhcIltcIithK1wiXVwiLHRoaXNbYV0pO1xyXG4gICAgfVxyXG4gIH1cclxuICB0aGlzLnVwZGF0ZURvbSgpO1xyXG59XHJcbiIsIlxyXG52YXIgc3luY21hbixtb3VzZSxhdWRpb0NvbnRleHQ7XHJcbnZhciBPSD1yZXF1aXJlKFwib25oYW5kbGVyc1wiKTtcclxudmFyIFRpbWVyPXJlcXVpcmUoXCJ3ZWItYXVkaW8tc2NoZWR1bGVyXCIpO1xyXG5leHBvcnRzLmVuYWJsZT1mdW5jdGlvbihnbG9iYWxzKXtcclxuICBjb25zb2xlLmxvZyhcInRpbWVyXCIsVGltZXIpO1xyXG4gIHN5bmNtYW49Z2xvYmFscy5zeW5jbWFuO1xyXG4gIG1vdXNlPWdsb2JhbHMubW91c2U7XHJcbiAgYXVkaW9Db250ZXh0PWdsb2JhbHMuYXVkaW9Db250ZXh0O1xyXG4gIHJldHVybiBDbG9jaztcclxufTtcclxuZnVuY3Rpb24gQ2xvY2socGFyZW50LG9wdGlvbnMpe1xyXG5cclxuICB2YXIgZGVmYXVsdHM9e1xyXG4gICAgaW50ZXJ2YWw6MC4xXHJcbiAgfVxyXG4gIHRoaXMuY3VycmVudFN0ZXA9MDtcclxuICB0aGlzLm5hbWU9XCJjbG9ja1wiO1xyXG4gIE9ILmNhbGwodGhpcyk7XHJcbiAgdmFyIHRoaXNDbG9jaz10aGlzO1xyXG4gIHRoaXMuZGF0YT17dmFsdWU6MH07XHJcbiAgdGhpcy5zdGF0ZXM9ZmFsc2U7XHJcbiAgdGhpcy5fYmluZE49c3luY21hbi5iaW5kTGlzdC5wdXNoKHRoaXMpLTE7XHJcbiAgdGhpcy4kanE9JCgnPGRpdiBjbGFzcz1cIm1zLWNsb2NrIG1zLWJ1dHRvblwiPjwvZGl2PicpO1xyXG4gIHRoaXMubGFiZWw9b3B0aW9ucy5sYWJlbHx8J+KIhic7XHJcbiAgdGhpcy4kanEuYXBwZW5kKHRoaXMuJGZhZGVyanEpO1xyXG4gIHRoaXMuJGpxLmh0bWwodGhpcy5sYWJlbCk7XHJcbiAgaWYob3B0aW9ucy5jc3MpXHJcbiAgICB0aGlzLiRqcS5jc3Mob3B0aW9ucy5jc3MpO1xyXG4gIHRoaXMuY3NzPWZ1bmN0aW9uKGNzcyl7XHJcbiAgICB0aGlzLiRqcS5jc3Mob3B0aW9ucy5jc3MpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG4gIC8vdGhpcyBzaG91bGQgZ28gaW4gY29tcG9uZW50QmFzZS4gSXQgYXBwbGllcyBvcHRpb25zIG9yIGRlZmF1bHRzLlxyXG4gIGlmKCFvcHRpb25zKVxyXG4gIG9wdGlvbnM9e307XHJcbiAgZm9yKHZhciBhIGluIGRlZmF1bHRzKXtcclxuICAgIGlmKCFvcHRpb25zW2FdKVxyXG4gICAgb3B0aW9uc1thXT1kZWZhdWx0c1thXTtcclxuICB9XHJcbiAgLy9wZW5kYW50OiB0aGlzIHNob3VsZCBiZSBwYXJ0IG9mIGEgYmFzZSBwcm90b3R5cGUsIG5vdCByZXBlYXRlZCBpbiBlYWNoIHR5cGVcclxuICBpZih0eXBlb2YgKHBhcmVudC5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC5hcHBlbmQodGhpcy4kanEpO1xyXG4gIH1lbHNlIGlmKHR5cGVvZiAocGFyZW50LiRqcS5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC4kanEuYXBwZW5kKHRoaXMuJGpxKTtcclxuICB9ZWxzZXtcclxuICAgIGNvbnNvbGUubG9nKFwiYSBjbG9jayBjb3VsZG4ndCBmaW5kIGRvbSBlbGVtZW50IHRvIGF0dGFjaCBoaW1zZWxmXCIpO1xyXG4gIH1cclxuICB2YXIgbWU9dGhpcztcclxuXHJcbiAgdGhpcy50aW1lciA9IG5ldyBUaW1lcih7IGNvbnRleHQ6IGF1ZGlvQ29udGV4dCB9KTtcclxuICB2YXIgaW50ZXJ2YWxIYW5kbGU7XHJcbiAgLy90aGUgY3VycmVudCB0aW1lciB0ZWNobm9sb2d5IGRvZXNuJ3QgbWFrZSBpbnRlcnZhbCBidXQgcmF0aGVyIHNjaGVkdWxlcyBhaGVhZCwgdGh1cyB0aGVzZSB2YXJzOlxyXG4gIHZhciBsYXN0VGltZXJTY2hlZHVsZWQ9MDtcclxuICB2YXIgbGFzdFRpbWVyRXhlY3V0ZWQ9MDtcclxuICB2YXIgY3JlYXRlRnVydGhlclRpbWVyU2NoZWR1bGVzPWZ1bmN0aW9uKGhvd01hbnkpe1xyXG4gICAgdmFyIGFkZFVwVG89bGFzdFRpbWVyU2NoZWR1bGVkK2hvd01hbnk7XHJcbiAgICBmb3IobGFzdFRpbWVyU2NoZWR1bGVkOyBsYXN0VGltZXJTY2hlZHVsZWQ8YWRkVXBUbzsgbGFzdFRpbWVyU2NoZWR1bGVkKyspXHJcbiAgICBtZS50aW1lci5pbnNlcnQob3B0aW9ucy5pbnRlcnZhbCpsYXN0VGltZXJTY2hlZHVsZWQsIG1lLnRpY2sse3RpY2tuOmxhc3RUaW1lclNjaGVkdWxlZH0pO1xyXG4gIH1cclxuICB0aGlzLnRpY2s9ZnVuY3Rpb24oYSl7XHJcbiAgICBsYXN0VGltZXJFeGVjdXRlZCsrO1xyXG4gICAgY3JlYXRlRnVydGhlclRpbWVyU2NoZWR1bGVzKDQpO1xyXG4gICAgdGhpc0Nsb2NrLmhhbmRsZShcInRpY2tcIik7XHJcbiAgICB0aGlzQ2xvY2suYWRkQ2xhc3MoXCJ0aWNrXCIpO1xyXG4gICAgLy8gY29uc29sZS5sb2coXCJ0aWNrXCIpO1xyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe3RoaXNDbG9jay5yZW1vdmVDbGFzcyhcInRpY2tcIik7fSwyMCk7XHJcbiAgICB0aGlzLmN1cnJlbnRTdGVwKys7XHJcbiAgfVxyXG4gIHRoaXMuc3RhcnQ9ZnVuY3Rpb24oKXtcclxuICAgIC8vIGNvbnNvbGUubG9nKG9wdGlvbnMuaW50ZXJ2YWwpO1xyXG4gICAgY3JlYXRlRnVydGhlclRpbWVyU2NoZWR1bGVzKDQpO1xyXG4gICAgdGhpcy50aW1lci5zdGFydCgpO1xyXG4gICAgLy9pbnRlcnZhbEhhbmRsZT13aW5kb3cuc2V0SW50ZXJ2YWwodGhpcy50aWNrLG9wdGlvbnMuaW50ZXJ2YWx8MSk7XHJcbiAgfVxyXG4gIHRoaXMuc3RvcD1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy50aW1lci5zdG9wKCk7XHJcbiAgICAvLy90aGlzLnRpbWVyLnJlbW92ZShpbnRlcnZhbEhhbmRsZSk7XHJcbiAgICAvL3dpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsSGFuZGxlKTtcclxuICB9XHJcbiAgaWYob3B0aW9ucy5zdGFydClcclxuICB0aGlzLnN0YXJ0KCk7XHJcblxyXG59XHJcblxyXG5DbG9jay5wcm90b3R5cGUudXBkYXRlRG9tPWZ1bmN0aW9uKCl7XHJcbiAgdGhpcy4kanEuaHRtbCh0aGlzLmxhYmVsKTtcclxufVxyXG5cclxuXHJcblxyXG4vL2FsaWFzaW5nIG9mIHRoZXNlIHR3byBoYW5keSBmdW5jdGlvblxyXG5DbG9jay5wcm90b3R5cGUuYWRkQ2xhc3M9ZnVuY3Rpb24odG8pe1xyXG4gIHRoaXMuJGpxLmFkZENsYXNzKHRvKTtcclxufVxyXG5DbG9jay5wcm90b3R5cGUucmVtb3ZlQ2xhc3M9ZnVuY3Rpb24odG8pe1xyXG4gIHRoaXMuJGpxLnJlbW92ZUNsYXNzKHRvKTtcclxufSIsInZhciBjb21wb25lbnRCYXNlO1xyXG5sZXQgZWVtaXRlcj1yZXF1aXJlKCdvbmhhbmRsZXJzJyk7XHJcbnZhciBzeW5jbWFuLG1vdXNlO1xyXG5leHBvcnRzLmVuYWJsZT1mdW5jdGlvbihnbG9iYWxzKXtcclxuICBzeW5jbWFuPWdsb2JhbHMuc3luY21hbjtcclxuICBtb3VzZT1nbG9iYWxzLm1vdXNlO1xyXG4gIGNvbXBvbmVudEJhc2U9Z2xvYmFscy5jb21wb25lbnRCYXNlO1xyXG4gIHJldHVybiBTZXF1ZW5jZXI7XHJcbn1cclxuLyoqXHJcbiAqIEEgZ2VuZXJhdG9yIG9mIHNlcXVlbmNlcnNcclxuICpcclxuICogQGNsYXNzIFNlcXVlbmNlclxyXG4gKiBAY29uc3RydWN0b3IgbmV3IE1zQ29tcG9uZW50cy5TZXF1ZW5jZXIoRE9NLyRqcXVlcnkgZWxlbWVudCx7cHJvcGVydGllc30pXHJcbiAqL1xyXG4gLy9kZWZpbmVzIGFsbCB0aGUgc2VxdWVuY2VyIHBhcmFtZXRlcnMgYnkgbWF0aCxcclxuIC8vbWF5YmUgaW4gYSBmdW50dXJlIGJ5IHN0eWxpbmcgdGFibGVcclxudmFyIHNlcVByb2c9NDtcclxuZnVuY3Rpb24gU2VxdWVuY2VyKHBhcmVudCxvcHRpb25zKXtcclxuIHZhciBuPW9wdGlvbnMubnx8MztcclxuIHZhciB0aGlzU2VxdWVuY2VyPXRoaXM7XHJcbiB0aGlzLm5hbWU9XCJzZXF1ZW5jZXJcIlxyXG4gY29tcG9uZW50QmFzZS5jYWxsKHRoaXMscGFyZW50LG9wdGlvbnMpO1xyXG4gLy8gdGhpcy4kanE9JCgnPGRpdiBjbGFzcz1cInNlcXVlbmNlclwiIGlkPVwic2VxXycrbisnXCI+PHAgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZVwiPjwvcD48L2Rpdj4nKTtcclxuIHBhcmVudC5hcHBlbmQodGhpcy4kanEpO1xyXG4gdGhpcy5hbGl2ZT1mYWxzZTtcclxuIHRoaXMuX2JpbmROPXN5bmNtYW4uYmluZExpc3QucHVzaCh0aGlzKS0xO1xyXG4gdGhpcy5wb3M9MDtcclxuIHRoaXMuZGF0YT1bXTtcclxuIC8qKlxyXG4gICogQHBhcmFtIGxlblxyXG4gICpob3cgbWFueSBzdGVwcyB0aGUgc2VxdWVuY2VyIGhhc1xyXG4gICogQGFsaWFzIGxlbmd0aFxyXG4gICovXHJcbiB0aGlzLmxlbj1vcHRpb25zLmxlbnxvcHRpb25zLmxlbmd0aHxNYXRoLnBvdygyLChzZXFQcm9nJTUpKzEpO1xyXG4gLyoqXHJcbiAgKiBAcGFyYW0gZXZyeVxyXG4gICogaG93IG1hbnkgY2xvY2sgc3RlcHMgbWFrZSBhIHNlcXVlbmNlciBzdGVwXHJcbiAgKiBAYWxpYXMgc3RlcERpdmlzaW9uXHJcbiAgKi9cclxuIHRoaXMuZXZyeT1vcHRpb25zLmV2cnl8b3B0aW9ucy5zdGVwRGl2aXNpb258TWF0aC5wb3coMiwoc2VxUHJvZyU0KSsxKTtcclxuIC8vbXVzdCBjb3VudCBhbiBbZXZlcnldIGFtb3VudCBvZiBiZWF0cyBmb3IgZWFjaCBwb3MgaW5jcmVtZW50LlxyXG4gdGhpcy5zdWJwb3M9MDtcclxuIHRoaXMuJGpxLmNzcyh7d2lkdGg6MTYqTWF0aC5jZWlsKHRoaXMubGVuLzQpK1wicHhcIn0pO1xyXG4gLy90aGlzLiRqcS5hZGRDbGFzcyhcImNvbG9yX1wiK3NlcVByb2clY2hhbm5lbHMubGVuZ3RoKTtcclxuIHRoaXMuZGlzcD0wO1xyXG4gdGhpcy5pZD1uO1xyXG4gdGhpcy5iZWF0RGlzcGxhY2U9MDtcclxuIHZhciBtZT10aGlzO1xyXG4gc2VxUHJvZysrO1xyXG4gLy90aGlzLmNoYW5uZWw9Y2hhbm5lbHNbdGhpcy5pZCVjaGFubmVscy5sZW5ndGhdO1xyXG4gZm9yKHZhciBibj0wOyBibjx0aGlzLmxlbjsgYm4rKyl7XHJcbiAgIHRoaXMuZGF0YVtibl09bmV3IFNlcXVlbmNlckJ1dHRvbihibix0aGlzKVxyXG4gfVxyXG4gdGhpcy5hbGl2ZUNoaWxkPTA7XHJcbiB0aGlzLmRpc3BsYWNlPTA7XHJcbiB0aGlzLnNldERpc3BsYWNlPWZ1bmN0aW9uKHRvLyosZW1pdCovKXtcclxuICAvLyAgaWYoZW1pdD09XCJvbmx5XCIpe1xyXG4gICAgLy8gIGVtaXQ9dHJ1ZTtcclxuICAvLyAgfWVsc2V7XHJcbiAgICAgdGhpcy5zdWJwb3M9KCh0aGlzLmNsb2NrLmN1cnJlbnRTdGVwKSUodGhpcy5sZW4qdGhpcy5ldnJ5KSkrdG87XHJcbiAgLy8gIH1cclxuICAvLyAgaWYoZW1pdD09dHJ1ZSl7XHJcbiAgLy8gICAgc29ja0NoYW5nZShcInNlcTpcIittZS5fYmluZE4rXCJcIixcImRzcGxcIix0byk7XHJcbiAgLy8gIH1cclxuIH1cclxuIHRoaXMuc3RlcD1mdW5jdGlvbigpe1xyXG4gICB2YXIgcHJldmFsaXZlPXRoaXMuYWxpdmU7XHJcbiAgIHRoaXMuYWxpdmU9dGhpcy5hbGl2ZUNoaWxkPjA7XHJcbiAgLy8gIGNvbnNvbGUubG9nKHRoaXMuYWxpdmVDaGlsZCk7XHJcbiAgIGlmKHRoaXMuYWxpdmUpe1xyXG4gICAgLy8gIGNvbnNvbGUubG9nKFwic2V0ZVwiKTtcclxuICAgICAvL2lmIHRoZSBzdGF0ZSBvZiB0aGlzLmFsaXZlIGNoYW5nZXMsIHdlIG11c3QgZW1pdCB0aGUgZGlzcGxhY2VtZW50LCBiZWNhdXNlIGl0IGlzIG5ld1xyXG4gICAgIGlmKCFwcmV2YWxpdmUpe1xyXG4gICAgICAgdGhpcy5kaXNwbGFjZT0odGhpcy5jbG9jay5jdXJyZW50U3RlcCt0aGlzLnN1YnBvcyklKHRoaXMubGVuKnRoaXMuZXZyeSk7XHJcbiAgICAgICAvL2NvbnNvbGUubG9nKFwib2suIGVtaXQgZGlzcGxhZTogXCIrdGhpcy5kaXNwbGFjZSk7XHJcbiAgICAgICAvL3RoaXMuc2V0RGlzcGxhY2UodGhpcy5kaXNwbGFjZSxcIm9ubHlcIik7XHJcbiAgICAgfTtcclxuICAgICAvL2VhY2ggc2VxdWVuY2VyIGhhcyBhIGRpZmZlcmVudCBzcGVlZCByYXRlcy4gd2hpbGUgc29tZSBwbGF5cyBvbmUgc3RlcCBwZXIgY2xpY2ssIG90aGVycyB3aWxsIGhhdmUgb25lIHN0ZXAgcGVyIHNldmVyYWwgY2xvY2sgdGlja3MuXHJcbiAgICAgLy90aGUgc2VxdWVuY2VyIHN0YXJ0aW5nIHBvaW50IGlzIGFsc28gZGlzcGxhY2VkLCBhbmQgaXQgZGVwZW5kcyBvbiB0aGUgdGltZSB3aGVuIGl0IGdvdCBhbGl2ZWQraXRzIHBvc2l0aW9uIGF0IHRoYXQgbW9tZW50LlxyXG4gICAgIGlmKHRoaXMuc3VicG9zJXRoaXMuZXZyeT09MCl7XHJcbiAgICAgICAvLyBjb25zb2xlLmxvZyhcInNxXCIrdGhpcy5wb3MpO1xyXG4gICAgICAgLy8gZGF0YT17c2VxdWVuY2VyOnRoaXMuaWQscG9zOnRoaXMucG9zLHN0ZXBWYWw6dGhpcy5kYXRhW3RoaXMucG9zXS5ldmFsKCl9O1xyXG4gICAgICAgLy8gdGhpcy5vblN0ZXBUcmlnZ2VyKGRhdGEpO1xyXG4gICAgICAgLy8gc3RlcEZ1bmN0aW9uKGRhdGEpO1xyXG4gICAgICAgdGhpcy5wb3M9KHRoaXMuc3VicG9zL3RoaXMuZXZyeSklKHRoaXMubGVuKTtcclxuICAgICAgIHZhciB2bD10aGlzLmRhdGFbdGhpcy5wb3NdLmV2YWwoKTtcclxuICAgICAgIGlmKHZsKXtcclxuICAgICAgICAgLy8gdGhpcy5jaGFubmVsLmVuZ2luZS5zdGFydCgwLHRoaXMuY2hhbm5lbC5zdGFydE9mZnNldCx0aGlzLmNoYW5uZWwuZW5kVGltZSk7XHJcbiAgICAgICAgIC8vc28sIHRoaXMgaXMgY2FsbGVkIGVsc2V3aGVyZSBhc3dlbGxsLi4uLiB0aGUgY2hhbm5lbCBzaG91bGQgaGF2ZSBhIHRyaWdnZXIgZnVuY3Rpb25cclxuICAgICAgICAvLyAgdmFyIGxvb3BTdGFydD10aGlzLmNoYW5uZWwuc3RhcnRPZmZzZXQ7XHJcbiAgICAgICAgLy8gIHZhciBsb29wRW5kPXRoaXMuY2hhbm5lbC5lbmRUaW1lO1xyXG4gICAgICAgIC8vICB0aGlzLmNoYW5uZWwuc2FtcGxlci50cmlnZ2VyQXR0YWNrKGZhbHNlLDAsMSx7c3RhcnQ6bG9vcFN0YXJ0LGVuZDpsb29wRW5kfSk7XHJcbiAgICAgICAgdGhpcy5oYW5kbGUoXCJ0cmlnZ2VyXCIsdmwpO1xyXG4gICAgICAgfVxyXG4gICAgIH1lbHNle1xyXG4gICAgIH1cclxuICAgICAvL3doYXQgaXMgbW9yZSBlY29ub21pYz8/XHJcbiAgICAgLy8gdGhpcy5zdWJwb3M9KHRoaXMuc3VicG9zKzEpJSh0aGlzLmxlbip0aGlzLmV2cnkpO1xyXG4gICAgIC8vaSBndWVzcyB0aGF0Li4gYnV0IGl0IGNhbiBncm93IGV0ZXJuYWxseVxyXG4gICAgIHRoaXMuc3VicG9zKys7XHJcbiAgIH1cclxuIH1cclxuIHRoaXMuc2V0Q2xvY2s9ZnVuY3Rpb24oY2xvY2ssZGl2aXNpb25zKXtcclxuICAgaWYoZGl2aXNpb25zKVxyXG4gICB0aGlzLmV2cnk9ZGl2aXNpb25zO1xyXG4gICBpZihjbG9jay5vbil7XHJcbiAgICAgY2xvY2sub24oJ3RpY2snLGZ1bmN0aW9uKCl7dGhpc1NlcXVlbmNlci5zdGVwKCl9KTtcclxuICAgICBpZihjbG9jay5uYW1lIT1cImNsb2NrXCIpXHJcbiAgICAgY29uc29sZS53YXJuKFwieW91IHNldCB0aGUgY2xvY2sgb2YgYSBzZXF1ZW5jZXIgdG8gc29tZWh0aW5nIHRoYXQgaXMgbm90IGEgY2xvY2ssIGJ1dCBhIFwiK2Nsb2NrLm5hbWUpO1xyXG4gICB9ZWxzZXtcclxuICAgICBjb25zb2xlLndhcm4oXCJ5b3UgdHJpZWQgdG8gY29ubmVjdCBhIFwiK3RoaXMubmFtZStcIiB0byBhbiBvYmplY3QgdGhhdCBoYXMgbm8gZXZlbnQgaGFubGVycyBcIik7XHJcbiAgIH1cclxuICAgdGhpcy5jbG9jaz1jbG9jaztcclxuIH1cclxuIHRoaXMuZGllPWZ1bmN0aW9uKCl7XHJcbiAgIGZvcih2YXIgYm4gaW4gdGhpcy5kYXRhKXtcclxuICAgICB0aGlzLmRhdGFbYm5dLnNldERhdGEoMCk7XHJcbiAgIH1cclxuICAgdGhpcy5hbGl2ZT1mYWxzZTtcclxuICAgdGhpcy4kanEuZGV0YWNoKCk7XHJcbiB9XHJcbiAvLyB0aGlzLm9uU3RlcFRyaWdnZXI9ZnVuY3Rpb24oZGF0YSl7XHJcbiAvLyAgIC8vIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gLy8gfVxyXG4gLy8gdGhpcy4kanEub24oXCJtb3VzZWVudGVyXCIsZnVuY3Rpb24oKXtcclxuIC8vICAgZm9jdXNDaGFubmVsKG1lLmNoYW5uZWwuaWQpO1xyXG4gLy8gfSk7XHJcbiByZXR1cm4gdGhpcztcclxufVxyXG5cclxuZnVuY3Rpb24gU2VxdWVuY2VyQnV0dG9uKG4scGFyZW50KXtcclxuICBlZW1pdGVyLmNhbGwodGhpcyk7XHJcbiAgdGhpcy5vbihcInRlc3RcIixmdW5jdGlvbigpe2NvbnNvbGUubG9nKFwid29ya3MhXCIpfSk7XHJcbiAgdGhpcy5oYW5kbGUoXCJ0ZXN0XCIpO1xyXG4gIHRoaXMuJGpxPSQoJzxkaXYgY2xhc3M9XCJzZXFidXR0b25cIj48L2Rpdj4nKTtcclxuICB0aGlzLl9iaW5kTj1zeW5jbWFuLmJpbmRMaXN0LnB1c2godGhpcyktMTtcclxuICBwYXJlbnQuJGpxLmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgdGhpcy5kYXRhPTA7XHJcbiAgLy9wZW5kYW50OiBldmFsdWF0ZSB3ZXRoZXIgdGhlIHZhciBuIGlzIHN0aWxsIHVzZWZ1bC4gcmVtb3ZlIGl0IGF0IGV2ZXJ5IGVuZC5cclxuICB0aGlzLm49bjtcclxuICB2YXIgbWU9dGhpcztcclxuICB0aGlzLnNldERhdGE9ZnVuY3Rpb24odG8sZW1pdCl7XHJcbiAgICAvLyBpZihlbWl0PT10cnVlKXtcclxuICAgIC8vICAgc29ja0NoYW5nZShcInNlcWI6XCIrbWUuX2JpbmROK1wiXCIsXCJzVlwiLHRvKTtcclxuICAgIC8vIH1cclxuICAgIC8vIGNvbnNvbGUubG9nKFwic2RhdGFcIik7XHJcbiAgICAvL3NvY2tldCBtYXkgc2V0IGRhdGEgdG8gMCB3aGVuIGlzIGFscmVhZHkgMCwgZ2VuZXJhdGluZyBkaXNwbGFjZSBvZiBwYXJlbnQncyBhbGl2ZWRoaWxkXHJcbiAgICBpZih0byE9dGhpcy5kYXRhKXtcclxuICAgICAgaWYodG89PTEpe1xyXG4gICAgICAgIHRoaXMuZGF0YT0xO1xyXG4gICAgICAgIHRoaXMuJGpxLmFkZENsYXNzKFwib25cIik7XHJcbiAgICAgICAgcGFyZW50LmFsaXZlQ2hpbGQrKztcclxuICAgICAgfVxyXG4gICAgICBpZih0bz09MCl7XHJcbiAgICAgICAgdGhpcy5kYXRhPTA7XHJcbiAgICAgICAgdGhpcy4kanEucmVtb3ZlQ2xhc3MoXCJvblwiKTtcclxuICAgICAgICBwYXJlbnQuYWxpdmVDaGlsZC0tO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBjb25zb2xlLmxvZyhwYXJlbnQuYWxpdmVDaGlsZCk7XHJcbiAgICAvLyBjb25zb2xlLmxvZyhwYXJlbnQuYWxpdmVDaGlsZCk7XHJcbiAgfVxyXG4gIHRoaXMuJGpxLm9uKFwibW91c2Vkb3duIHRhcCB0b3VjaHN0YXJ0XCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIG1lLnNldERhdGEoTWF0aC5hYnMobWUuZGF0YS0xKSx0cnVlKTtcclxuICAgIC8vIG1lLmRhdGE9O1xyXG4gICAgaWYobWUuZGF0YT09MSl7XHJcbiAgICAgICBtb3VzZS5zd2l0Y2hpbmc9dHJ1ZTtcclxuICAgIH1lbHNle1xyXG4gICAgLy8gICAkKHRoaXMpLnJlbW92ZUNsYXNzKFwib25cIik7XHJcbiAgICAvLyAgIHBhcmVudC5hbGl2ZUNoaWxkLS07XHJcbiAgICAgICBtb3VzZS5zd2l0Y2hpbmc9ZmFsc2U7XHJcbiAgICAgfVxyXG4gIH0pO1xyXG4gIHRoaXMuJGpxLm9uKFwibW91c2VlbnRlciB0b3VjaGVudGVyXCIsZnVuY3Rpb24oKXtcclxuICAgIGlmKG1vdXNlLmJ1dHRvbkRvd24pe1xyXG4gICAgICBpZihtb3VzZS5zd2l0Y2hpbmcpe1xyXG4gICAgICAgIGlmKG1lLmRhdGE9PTApe1xyXG4gICAgICAgICAgbWUuc2V0RGF0YSgxLHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgfWVsc2V7XHJcbiAgICAgICAgaWYobWUuZGF0YT09MSl7XHJcbiAgICAgICAgICBtZS5zZXREYXRhKDAsdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgdGhpcy5ldmFsPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgJGpxPXRoaXMuJGpxO1xyXG4gICAgJGpxLmFkZENsYXNzKFwidHVyblwiKTtcclxuICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICRqcS5yZW1vdmVDbGFzcyhcInR1cm5cIik7XHJcbiAgICB9LDIwMCk7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhO1xyXG4gIH1cclxufVxyXG4iLCJ2YXIgY29tcG9uZW50QmFzZTtcclxubGV0IGVlbWl0ZXI9cmVxdWlyZSgnb25oYW5kbGVycycpO1xyXG52YXIgc3luY21hbixtb3VzZTtcclxuXHJcbmV4cG9ydHMuZW5hYmxlPWZ1bmN0aW9uKGdsb2JhbHMpe1xyXG4gIHN5bmNtYW49Z2xvYmFscy5zeW5jbWFuO1xyXG4gIG1vdXNlPWdsb2JhbHMubW91c2U7XG4gIGNvbXBvbmVudEJhc2U9Z2xvYmFscy5jb21wb25lbnRCYXNlO1xyXG4gIHJldHVybiBTbGlkZXI7XHJcbn07XHJcblxyXG4vKipcclxuKiBTbGlkZXIgcHJvZHVjZXMgYSB2ZXJ0aWNhbCBvciBob3Jpem9udGFsIHNsaWRlciB0aGF0IGFsbG93cyB0byBjb250cm9sIGEgdmFsdWUgZnJvbSBkcmFnZ2luZyB3aXRoIHRoZSBtb3VzZS5cclxuXHJcbipcclxuKiBAY2xhc3MgU2xpZGVyXHJcbiogQGNvbnN0cnVjdG9yXHJcbiogQHBhcmFtIHtqcXVlcnl9IHBhcmVudCBvciBET00gZWxlbWVudCB0byB3aGljaCB0aGlzIHNsaWRlciB3aWxsIGJlIGF0dGFjaGVkLlxyXG4qIGRlZmF1bHRzIHRvIGAkKFwiYm9keVwiKWBcclxuKiBAZGVmYXVsdFxyXG4qIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIG9iamVjdCBjb250YWluaW5nIG9wdGlvbnNcclxuKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5jc3MgYWRkaXRpb25hbCBjc3MgcHJvcGVydGllcyBmb3IgdGhlIHNsaWRlclxyXG4qIEBwYXJhbSB7ZnVuY3Rpb259IG9wdGlvbnMudmFsdWVGdW5jdGlvblxyXG4qIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLmxhYmVsIDpcIlwiXHJcbiogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMudmFsdWVGdW5jdGlvbiA6ZnVuY3Rpb24odmFsKXtcclxuICByZXR1cm4gdmFsO1xyXG59XHJcbiogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMudmFsdWUgOjBcclxuKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy5kYXRhIDp7dmFsdWU6MH1cclxuKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy5lcnRpY2FsIDp0cnVlXHJcbiogZGVmaW5lcyB0aGUgb3BlcmF0aW9uIHRvIGFwcGx5IHRvIHRoZSBpbnRlcm5hbCB2YWx1ZSB1cG9uIGV2YWx1YXRpb24uIHRoZSBkZWZhdWx0IGlzIGp1c3QgbGluZWFyXHJcblxyXG4qIEBleGFtcGxlIG15U2xpZGVyIG5ldyBNc0NvbXBvbmVudHMuU2xpZGVyKCQoXCJib2R5XCIpLHt2ZXJ0aWNhbDpmYWxzZSx2YWx1ZTowLjczfSk7XHJcbiovXHJcbmZ1bmN0aW9uIFNsaWRlcihwYXJlbnQsb3B0aW9ucyl7XHJcbiAgdmFyIHRoaXNTbGlkZXI9dGhpcztcclxuICB0aGlzLm5hbWU9XCJzbGlkZXJcIlxyXG4gIHZhciBkZWZhdWx0cz17XHJcbiAgICBsYWJlbDpcIlwiLFxyXG4gICAgdmFsdWVGdW5jdGlvbjpmdW5jdGlvbih2YWwpe1xyXG4gICAgICByZXR1cm4gdmFsO1xyXG4gICAgfSxcclxuICAgIHZhbHVlOjAsXHJcbiAgICBkYXRhOnt2YWx1ZTowfSxcclxuICAgIHZlcnRpY2FsOnRydWUsXHJcbiAgfVxyXG4gIGNvbXBvbmVudEJhc2UuY2FsbCh0aGlzLHBhcmVudCxvcHRpb25zLGRlZmF1bHRzKTtcclxuICAvL215IHJlZmVyZW5jZSBudW1iZXIgZm9yIGRhdGEgYmluZGluZy4gV2l0aCB0aGlzIG51bWJlciB0aGUgc29ja2V0IGJpbmRlciBrbm93cyB3aG8gaXMgdGhlIHJlY2lldmVyIG9mIHRoZSBkYXRhLCBhbmQgYWxzbyB3aXRoIHdoYXQgbmFtZSB0byBzZW5kIGl0XHJcbiAgLy9wZW5kYW50OiB0aGlzIGNhbiBwb3RlbnRpYWxseSBjcmVhdGUgYSBwcm9ibGVtLCBiZWNhdXNlIHR3byBvYmplY3RzIGNhbiBiZSBjcmVhdGVkIHNpbXVsdGFuZW91c2x5IGF0IGRpZmZlcmVudCBlbmRzIGF0IHRoZSBzYW1lIHRpbWUuXHJcbiAgLy9tYXliZSBpbnN0ZWFkIG9mIHRoZSBzaW1wbGUgcHVzaCwgdGhlcmUgY291bGQgYmUgYSBjYWxsYmFjaywgYWRuIHRoZSBvYmplY3Qgd2FpdHMgdG8gcmVjZWl2ZSBpdCdzIHNvY2tldCBpZCBvbmNlIGl0cyBjcmVhdGlvbiB3YXMgcHJvcGFnYXRlZCB0aHJvdWdob3V0IGFsbCB0aGUgbmV0d29yaywgb3IgbWF5YmUgdGhlcmUgaXMgYW4gYXJyYXkgZm9yIHNlbnRpbmcgYW5kIG90aGVyIGRpZmZlcmVudCBmb3IgcmVjZWl2aW5nLi4uIGZpcnN0IG9wdGlvbiBzZWVtcyBtb3JlIHNlbnNpYmxlXHJcbiAgLy8gdGhpcy5kYXRhPXt2YWx1ZTowfTtcclxuXHJcbiAgdGhpcy5fYmluZE49c3luY21hbi5iaW5kTGlzdC5wdXNoKHRoaXMpLTE7XHJcblxyXG4gIC8vIHRoaXMubGFiZWw9b3B0aW9ucy5sYWJlbHx8XCJcIjtcclxuICAvL3NsaWRlciBuZWVkcyBhZGRpdGlvbmFsICRqcSBvYmplY3RzIGZvciB0aGUgaW5uZXIgcm9sbGluZyBzbGlkZXIsIGFuZCBmb3IgbGFiZWwsIHdoaWNoIGlzIG5vdCB5ZXQgZnVsbHkgaW1wbGVtZW50ZWRcclxuICB0aGlzLiRmYWRlcmpxPSQoJzxkaXYgY2xhc3M9XCJzbGlkZXItaW5uZXJcIiBzdHlsZT1cInBvaW50ZXItZXZlbnRzOm5vbmU7IHBvc2l0aW9uOmFic29sdXRlXCI+PC9kaXY+Jyk7XHJcbiAgdGhpcy4kbGFiZWxqcT0kKCc8cCBjbGFzcz1cInNsaWRlcmxhYmVsXCI+PC9wPicpO1xyXG5cclxuICB0aGlzLiRqcS5hcHBlbmQodGhpcy4kZmFkZXJqcSk7XHJcbiAgdGhpcy4kanEuYXBwZW5kKHRoaXMuJGxhYmVsanEpO1xyXG5cclxuICBpZihvcHRpb25zLmNzcylcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgdGhpcy5jc3M9ZnVuY3Rpb24oY3NzKXtcclxuICAgIHRoaXMuJGpxLmNzcyhjc3MpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG4gIHRoaXMub25DaGFuZ2VDYWxsYmFjaz1mdW5jdGlvbigpe307XHJcbiAgLy9wZW5kYW50OiB0aGlzIHNob3VsZCBiZSBwYXJ0IG9mIGEgYmFzZSBwcm90b3R5cGUsIG5vdCByZXBlYXRlZCBpbiBlYWNoIHR5cGVcclxuICBpZih0eXBlb2YgKHBhcmVudC5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC5hcHBlbmQodGhpcy4kanEpO1xyXG4gIH1lbHNlIGlmKHR5cGVvZiAocGFyZW50LiRqcS5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC4kanEuYXBwZW5kKHRoaXMuJGpxKTtcclxuICB9ZWxzZXtcclxuICAgIGNvbnNvbGUubG9nKFwiYSBzbGlkZXIgY291bGRuJ3QgZmluZCBkb20gZWxlbWVudCB0byBhdHRhY2ggaGltc2VsZlwiKTtcclxuICB9XHJcbiAgdmFyIG1lPXRoaXM7XHJcbiAgdGhpcy5vbkNoYW5nZT1mdW5jdGlvbihjYWxsYmFjayl7XHJcbiAgICBtZS5vbkNoYW5nZUNhbGxiYWNrPWZ1bmN0aW9uKCl7Y2FsbGJhY2sobWUuZGF0YSl9O1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG4gIC8qKlxyXG4qIFNldCB0aGUgZGF0YSB0byBhIHZhbHVlLCBhbmQgcGVyZm9ybSB0aGUgZ3JhcGhpYyBjaGFuZ2VzIGFuZCBkYXRhIGJpbmRpbmdzIHRoYXQgY29ycmVzcG9uZCB0byB0aGlzIGNoYW5nZS5cclxuKiBJZiB5b3Ugd2FudGVkIHRvIGNoYW5nZSB0aGUgdmFsdWUsIGJ1dCBub3QgZ2V0IHRoaXMgY2hhbmdlIHJlZmxlY3RlZCBpbiB0aGUgc2xpZGVyIHBvc2l0aW9uLCB5b3Ugd291bGRcclxuKiBhc3NpZ24gdGhlIHNsaWRlci5kYXRhLnZhbHVlIHRvIHlvdXIgdmFsdWUuXHJcbiogQG1ldGhvZCBzZXREYXRhXHJcbiogQHBhcmFtIHtudW1iZXJ9IHRvIHRhcmdldCB2YWx1ZVxyXG4qIEBwYXJhbSB7Ym9vbGVhbn0gW2VtaXQ9ZmFsc2VdICpub3QgcmVhZHkqIHdldGhlciB0byBlbWl0IHRocm91Z2ggc3luY21hblxyXG4qIEByZXR1cm4ge3VuZGVmaW5lZH0gbm8gcmV0dXJuXHJcbiogQGV4YW1wbGUgbXlTbGlkZXIuc2V0RGF0YSgwLjUzKTtcclxuKi9cclxuICB0aGlzLnNldERhdGE9ZnVuY3Rpb24odG8sZW1pdCl7XHJcbiAgICBpZihlbWl0PT09dHJ1ZSl7XHJcbiAgICAgIC8vcGVuZGFudDogaW4gc2VxdWVuY2VycyB3ZSB1c2UgcGFyZW50LmlkLCBhbmQgaGVyZSB3ZSB1c2UgX2JpbmROLiBUb3dhcmRzIGEgY29udHJvbGxlciBBUEkgYW5kIGEgbW9yZSBzZW5zaWNhbCBjb2RlLCBJIHRoaW5rIGJvdGggc2hvdWxkIHVzZSB0aGUgYmluZCBlbGVtZW50IGFycmF5LiByZWFkIG5vdGUgaW4gZmlyc3QgbGluZSBvZiB0aGlzIGZpbGUuXHJcbiAgICAgIC8vcGVuZGFudDogcGFyZW50IGluIHNlcSBpcyB3aGF0IG1lIGlzIGhlcmUuIHRoaXMgaXMgcHJldHR5IGNvbmZ1c2luZyB2YXIgbmFtZSBkZWNpc2lvblxyXG4gICAgICBzeW5jbWFuLmVtaXQoXCJzbGlkOlwiK21lLl9iaW5kTitcIlwiLFwic1ZcIix0byk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmRhdGEudmFsdWU9dG87XHJcbiAgICB0aGlzLm9uQ2hhbmdlQ2FsbGJhY2soKTtcclxuICAgIHRoaXMudXBkYXRlRG9tKCk7XHJcbiAgfVxyXG4gIHRoaXMuYWRkQ2xhc3M9ZnVuY3Rpb24odG8pe1xyXG4gICAgdGhpcy4kanEuYWRkQ2xhc3ModG8pO1xyXG4gIH1cclxuICAvLyB0aGlzLnZlcnRpY2FsPW9wdGlvbnMudmVydGljYWx8fHRydWU7XHJcbiAgdGhpcy4kanEub24oXCJtb3VzZW1vdmVcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBpZihtZS5tb3VzZUFjdGl2ZSl7XHJcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgIGlmKG1lLnZlcnRpY2FsKXtcclxuICAgICAgICBtZS5zZXREYXRhKDEtZXZlbnQub2Zmc2V0WS9tZS4kanEuaGVpZ2h0KCksdHJ1ZSk7Ly8sdHJ1ZVxyXG4gICAgICB9ZWxzZXtcclxuICAgICAgICBtZS5zZXREYXRhKGV2ZW50Lm9mZnNldFgvbWUuJGpxLndpZHRoKCksdHJ1ZSk7Ly8sdHJ1ZVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgdGhpcy5vbihcIm9uTW91c2VTdGFydFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAvLyBpZihtZS52ZXJ0aWNhbCl7XHJcbiAgICAvLyAgIG1lLnNldERhdGEoMS1ldmVudC5vZmZzZXRZL21lLiRqcS5oZWlnaHQoKSx0cnVlKTsvLyx0cnVlXHJcbiAgICAvLyB9ZWxzZXtcclxuICAgIC8vICAgbWUuc2V0RGF0YShldmVudC5vZmZzZXRYL21lLiRqcS53aWR0aCgpLHRydWUpOy8vLHRydWVcclxuICAgIC8vIH1cclxuICB9KTtcclxuXHJcbiAgdGhpcy5vbihcIm9uTW91c2VFbmRcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBpZihtb3VzZS5idXR0b25Eb3duKXtcclxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgdmFyIGVtaXRUaGlzPWV2ZW50LnR5cGU9PVwibW91c2VsZWF2ZVwifHxldmVudC50eXBlPT1cIm1vdXNldXBcIlxyXG4gICAgICAvLyBpZihtZS52ZXJ0aWNhbCl7XHJcbiAgICAgIC8vICAgLy90aGUgc3RyYW5nZSBzZWNvbmQgcGFyYW1lbnRlciBpbiBzZXRkYXRhIHdhcyB0cnVlLCBidXQgaXQgY291bGQgY2xvZyB0aGUgc29ja2V0XHJcbiAgICAgIC8vICAgbWUuc2V0RGF0YSgxLWV2ZW50Lm9mZnNldFkvbWUuJGpxLmhlaWdodCgpLGVtaXRUaGlzKTsvLyx0cnVlXHJcbiAgICAgIC8vIH1lbHNle1xyXG4gICAgICAvLyAgIG1lLnNldERhdGEoZXZlbnQub2Zmc2V0WC9tZS4kanEud2lkdGgoKSxlbWl0VGhpcyk7Ly8sdHJ1ZVxyXG4gICAgICAvLyB9XHJcbiAgICB9ZWxzZXtcclxuICAgIH1cclxuICB9KTtcclxuICB0aGlzLmV2YWw9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBqcT10aGlzLiRqcTtcclxuICAgIGpxLmFkZENsYXNzKFwidHVyblwiKTtcclxuICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgIGpxLnJlbW92ZUNsYXNzKFwidHVyblwiKTtcclxuICAgIH0sMjAwKTtcclxuICAgIHJldHVybiB0aGlzLnZhbHVlRnVuY3Rpb24odGhpcy5kYXRhLnZhbHVlKTtcclxuICB9XHJcblxyXG4gIHRoaXMudXBkYXRlRG9tPWZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLnZlcnRpY2FsKXtcclxuICAgICAgdGhpcy4kZmFkZXJqcS5jc3Moe2JvdHRvbTowLHdpZHRoOlwiMTAwJVwiLGhlaWdodDp0aGlzLmRhdGEudmFsdWUqdGhpcy4kanEuaGVpZ2h0KCl9KTtcclxuICAgICAgdGhpcy5hZGRDbGFzcyhcInZlcnRpY2FsXCIpO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIHRoaXMuJGxhYmVsanEuaHRtbCh0aGlzLmxhYmVsKTtcclxuICAgICAgdGhpcy4kZmFkZXJqcS5jc3Moe2JvdHRvbTowLHdpZHRoOnRoaXMuZGF0YS52YWx1ZSp0aGlzLiRqcS53aWR0aCgpLGhlaWdodDpcIjEwMCVcIn0pO1xyXG4gICAgfVxyXG4gIH1cclxuICBjb25zb2xlLmxvZyh0aGlzLm9wdGlvbnMsXCJiYWxzXCIpO1xyXG4gIHRoaXMuc2V0RGF0YSh0aGlzLm9wdGlvbnMudmFsdWUpO1xyXG4gIHRoaXMudXBkYXRlRG9tKCk7XHJcbn0iLCJsZXQgZWVtaXRlcj1yZXF1aXJlKCdvbmhhbmRsZXJzJyk7XHJcbnZhciBnbG9iYWxzO1xyXG52YXIgbW91c2U7XHJcbmV4cG9ydHMuZ2V0PWZ1bmN0aW9uKGdsb2JhbHMpe1xyXG4gIC8vIHN5bmNtYW49Z2xvYmFscy5zeW5jbWFuO1xyXG4gIG1vdXNlPWdsb2JhbHMubW91c2U7XHJcbiAgcmV0dXJuIGNvbXBvbmVudEJhc2U7XHJcbn1cclxuLyoqXHJcbiAqIFRoZSBiYXNlIG9mIGNvbXBvbmVudHMuXHJcbiAqIEl0IGNvbnRhaW5zIHRoZSBmdW5jdGlvbiB0aGF0IGFyZSBzaGFyZWQgYW1vbmcgYWxsIE1zQ29tcG9uZW50cy4gTWFrZXMgbGl0dGxlIHNlbnNlIHRvIHVzZSB0aGlzIGFsb25lXHJcbiAqXHJcbiAqIEBjbGFzcyBjb21wb25lbnRCYXNlXHJcbiAqIEBjb25zdHJ1Y3RvciBuZXcgTXNDb21wb25lbnRzLmNvbXBvbmVudEJhc2UoRE9NL0pxdWVyeSBlbGVtZW50LHtwcm9wZXJ0aWVzfSlcclxuICogQGNvbnN0cnVjdG9yIGNvbXBvbmVudEJhc2UuY2FsbCh0aGlzLHBhcmVudCxvcHRpb25zLGRlZmF1bHRzKTtcclxuICpcclxuICogQHByb3BlcnR5IHBhcmVudFxyXG4gKiBAdHlwZSBKcXVlcnkgLyBEb20gZWxlbWVudCAvIGNvbXBvbmVudEJhc2VcclxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgdmFsdWVzIGZvciBjdXN0b21pemF0aW9uIG9mIHRoZSBjb21wb25lbnRcclxuICogQHBhcmFtIHtvYmplY3R9IGRlZmF1bHRzIHZhbHVlcyB0aGF0IHdpbGwgYmVsb25nIHRvIHRoZSBpbmhlcml0aW5nIG9iamVjdC5cclxuICogdGhlIGRlZmF1bHQgb2JqZWN0IHdpbGwgY29udGFpbiBhbGwgdGhlIGRlZmF1bHQgcHJvcGVydGllcyBmb3IgdGhlIG9iamVjdCBpdHNlbGZcclxuICogYXN3ZWxsIGFzIGZvciB0aGUgb2JqZWN0LnByb3BlcnRpZXMuXHJcbiAqXHJcbiAqIEFsbCBkZWZhdWx0IHZhbHVlcyB3aWxsIGJlIG92ZXJ3cml0dGVuIGJ5IHRoZSBvcHRpb25zIHZhbHVlcywgYW5kIHRoZXJlZm9yZVxyXG4gKiBkZWNsYXJpbmcgYSBkZWZhdWx0IGluIHRoZSBvYmplY3Qgd2lsbCBtYWtlIGEgcHJvcGVydHkgb2YgdGhlIG9wdGlvbnMgb2JqZWN0XHJcbiAqIHRvIGJlbG9uZyB0byB0aGUgb2JqZWN0LCB3aGVyZSBvdGhlcndpc2UgdGhlIG9wdGlvbnMgcHJvcGVydHkgd291bGQgcmVtYWluXHJcbiAqIGluIHRoZSBvYmplY3QucHJvcGVydGllcyBvbmx5LlxyXG4gKlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG5cclxuIGZ1bmN0aW9uIEFCdXR0b24ocGFyZW50LG9wdGlvbnMpe1xyXG4gICAgdmFyIGRlZmF1bHRzPXthOjAsYjoxfVxyXG4gICAgdGhpcy5uYW1lPVwiQUJ1dHRvblwiO1xyXG4gICAgY29tcG9uZW50QmFzZS5jYWxsKHRoaXMscGFyZW50LG9wdGlvbnMsZGVmYXVsdHMpO1xyXG4gfVxyXG4gdmFyIGQ9bmV3IEJ1dHRvbigkKGJvZHkpLHthOjQsYzo1fSk7XHJcbi8vd2lsbCBjcmVhdGUgYSBkaXYgd2l0aCBjbGFzcyBtcy1BQnV0dG9uLCBhbmQgdmFyIGQgd2lsbCBjb250YWluIHByb3BlcnRpZXNcclxuLy9hPTQsIGI9MSAmIG9wdGlvbnM9IHthOjQsYjoxLGM6NX1cclxuXHJcbiAqXHJcbiAqIEB0eXBlIG9iamVjdFxyXG4gKi9cclxuZnVuY3Rpb24gY29tcG9uZW50QmFzZShwYXJlbnQsb3B0aW9ucyxkZWZhdWx0cyl7XHJcbiAgdmFyIHRoaXNDb21wb25lbnQ9dGhpcztcclxuXHJcbiAgdmFyIGRlZmF1bHRzPWRlZmF1bHRzfHx7fTtcclxuICAvL21ha2Ugc3VyZSB0aGlzIG9iamVjdCB3aWxsIGNvbnRhaW4gZGVmYXVsdHMgYW5kIG9wdGlvbnMuXHJcbiAgaWYob3B0aW9ucyl7XHJcbiAgICB0aGlzLm9wdGlvbnM9b3B0aW9ucztcclxuICB9ZWxzZXtcclxuICAgIHRoaXMub3B0aW9ucz17fTtcclxuICB9XHJcblxyXG4gIC8vZGVmYXVsdHMgY29udGFpbiBkZWZhdWx0IHByb3BlcnRpZXMgZm9yIHRoZSBvYmplY3RcclxuICAvL29wdGlvbnMgY29udGFpbiB0aGUgdXNlciB3cml0dGVuIG9wdGlvbnMgdGhhdCB3aWxsIG92ZXJ3cml0ZSB0aGUgZGVmYXVsdHMuXHJcbiAgLy9vYmplY3Qga2VlcHMgdHJhY2sgb2YgdGhlIG9wdGlvbnMgaW4gdGhlIHRoaXMub3B0aW9ucywgc28gaWYgdGhlIG9iamVjdCBtdXRhdGVzLCBpdCBjYW4gYmUgcmV0cmlldmVkIGJhY2tcclxuICBmb3IodmFyIGEgaW4gZGVmYXVsdHMpe1xyXG4gICAgaWYoIXRoaXMub3B0aW9uc1thXSlcclxuICAgIHRoaXMub3B0aW9uc1thXT1kZWZhdWx0c1thXTtcclxuICAgIHRoaXNbYV09dGhpcy5vcHRpb25zW2FdO1xyXG4gIH1cclxuXHJcbiAgY29uc29sZS5sb2coXCJwb3N0XCIsdGhpcy5vcHRpb25zLG9wdGlvbnMsZGVmYXVsdHMpO1xyXG5cclxuICBlZW1pdGVyLmNhbGwodGhpcyk7XHJcbiAgaWYoIXRoaXMubmFtZSl7XHJcbiAgICB0aGlzLm5hbWU9XCJjb21wb25lbnRcIjtcclxuICB9XHJcbiAgLyoqXHJcbiAgICAqIEBwcm9wZXJ0eSB7JGpxfSBvd24ncyBqcXVlcnkgb2JqZWN0XHJcbiAgKi9cclxuICB0aGlzLiRqcT0kKCc8ZGl2IGNsYXNzPVwibXMtJyt0aGlzLm5hbWUrJ1wiPjwvZGl2PicpO1xyXG5cclxuICBpZihvcHRpb25zLmNzcylcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgICB0aGlzLmNzcz1mdW5jdGlvbihjc3Mpe1xyXG4gICAgdGhpcy4kanEuY3NzKG9wdGlvbnMuY3NzKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuICBpZih0eXBlb2YgKHBhcmVudC5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC5hcHBlbmQodGhpcy4kanEpO1xyXG4gIH1lbHNlIGlmKHR5cGVvZiAocGFyZW50LiRqcS5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC4kanEuYXBwZW5kKHRoaXMuJGpxKTtcclxuICB9ZWxzZXtcclxuICAgIGNvbnNvbGUubG9nKFwiYSBzbGlkZXIgY291bGRuJ3QgZmluZCBkb20gZWxlbWVudCB0byBhdHRhY2ggaGltc2VsZlwiKTtcclxuICB9XHJcbiAgLyoqXHJcbiAgKiBAcHJvcGVydHkgbW91c2VBY3RpdmF0aW9uTW9kZVxyXG4gICogQHR5cGUgU3RyaW5nXHJcbiAgKiAgZHJhZ0FsbDogdGhlIGJ1dHRvbnMgd2lsbCBhY3RpdmF0ZSB0aHJvdWdoIGFsbCB0aGUgdHJhamVjdG9yeSBvZiB0aGUgbW91c2Ugd2hpbGUgcHJlc3NlZFxyXG4gICogb25lQnlPbmU6IG9uZSBjbGljaz1vbmUgYnV0dG9uIHByZXNzXHJcbiAgKiBkcmFnTGFzdDogdGhlIG1vdXNlIGNhbiBiZSB0cmFnZ2VkIGFuZCB3aWxsIGFjdGl2YWUgYW5kIGhvdmVyIG9ubHkgdGhlIGxhc3QgYnV0dG9uIHRoYXQgaXQgZW50ZXJlZFxyXG4gICogaG92ZXI6IHRoZSBidXR0aW5zIGFyZSBhY3RpdmF0ZWQgdXBvbiBob3ZlciByZWdhcmRsZXNzIG9mIHdoZXRoZXIgaXMgY2xpY2tlZCBvciBub3RcclxuICAqL1xyXG4gIGlmKCFvcHRpb25zLm1vdXNlQWN0aXZhdGlvbk1vZGUpe1xyXG4gICAgb3B0aW9ucy5tb3VzZUFjdGl2YXRpb25Nb2RlPVwiZHJhZ0FsbFwiO1xyXG4gIH1cclxuICB0aGlzLm1vdXNlQWN0aXZlPWZhbHNlO1xyXG4gIGZ1bmN0aW9uIG1vdXNlQWN0aXZhdGUoZXZlbnQpe1xyXG4gICAgdGhpc0NvbXBvbmVudC5oYW5kbGUoXCJvbk1vdXNlU3RhcnRcIixldmVudCk7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgdGhpc0NvbXBvbmVudC5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcclxuICAgIHRoaXNDb21wb25lbnQubW91c2VBY3RpdmU9dHJ1ZTtcclxuICB9XHJcbiAgZnVuY3Rpb24gbW91c2VEZWFjdGl2YXRlKGV2ZW50KXtcclxuICAgIHRoaXNDb21wb25lbnQuaGFuZGxlKFwib25Nb3VzZUVuZFwiLGV2ZW50KTtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB0aGlzQ29tcG9uZW50LnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpO1xyXG4gICAgdGhpc0NvbXBvbmVudC5tb3VzZUFjdGl2ZT1mYWxzZTtcclxuICB9XHJcblxyXG4gIC8vdG8gYXZvaWQgaWZmeSBjaGFpbnMgdGhhdCBhcmUgYSBwYWluIHRvIGNoYW5nZVxyXG4gIGZ1bmN0aW9uIGFJc0luQihhLGIpe1xyXG4gICAgZm9yICh2YXIgYyBpbiBiKXtcclxuICAgICAgaWYoYT09YltjXSl7Y29uc29sZS5sb2coXCJ0cnVlXCIpO3JldHVybiB0cnVlO31cclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9O1xyXG5cclxuICB0aGlzLiRqcS5vbihcIm1vdXNlZG93biB0YXAgdG91Y2hzdGFydFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIC8vY2hlY2sgdGhhdCB1cG9uIHRoZSBjdXJyZW50IGV2ZW50LCBhIG1vdXNlQWN0aXZhdGUgc2hvdWxkIGJlIHRyaWdnZXJlZC5cclxuICAgIGlmKGFJc0luQihvcHRpb25zLm1vdXNlQWN0aXZhdGlvbk1vZGUsW1wiZHJhZ0FsbFwiLFwib25lQnlPbmVcIixcImRyYWdMYXN0XCJdKSl7XHJcbiAgICAgIG1vdXNlQWN0aXZhdGUoZXZlbnQpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICB0aGlzLiRqcS5vbihcIm1vdXNlZW50ZXJcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBpZihtb3VzZS5idXR0b25Eb3duKXtcclxuICAgICAgaWYoYUlzSW5CKG9wdGlvbnMubW91c2VBY3RpdmF0aW9uTW9kZSxbXCJkcmFnQWxsXCIsXCJkcmFnTGFzdFwiXSkpe1xyXG4gICAgICAgIG1vdXNlQWN0aXZhdGUoZXZlbnQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZihvcHRpb25zLm1vdXNlQWN0aXZhdGlvbk1vZGU9PVwiaG92ZXJcIil7XHJcbiAgICAgIG1vdXNlQWN0aXZhdGUoZXZlbnQpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHRoaXMuJGpxLm9uKFwibW91c2V1cFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIGlmKGFJc0luQihvcHRpb25zLm1vdXNlQWN0aXZhdGlvbk1vZGUsW1wiZHJhZ0FsbFwiLFwib25lQnlPbmVcIixcImRyYWdMYXN0XCJdKSl7XHJcbiAgICAgIG1vdXNlRGVhY3RpdmF0ZShldmVudCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgdGhpcy4kanEub24oXCJtb3VzZW91dFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIGlmKGFJc0luQihvcHRpb25zLm1vdXNlQWN0aXZhdGlvbk1vZGUsW1wiaG92ZXJcIixcIm9uZUJ5T25lXCIsXCJkcmFnTGFzdFwiXSkpe1xyXG4gICAgICBtb3VzZURlYWN0aXZhdGUoZXZlbnQpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuXHJcbiAgdGhpcy51cGRhdGVEb209ZnVuY3Rpb24oKXtcclxuICAgIHRoaXNDb21wb25lbnQuJGpxLmh0bWwodGhpcy5sYWJlbCk7XHJcbiAgfVxyXG4gIC8vYWxpYXNpbmcgb2YgdGhlc2UgdHdvIGhhbmR5IGZ1bmN0aW9uXHJcbiAgdGhpcy5hZGRDbGFzcz1mdW5jdGlvbih0byl7XHJcbiAgICB0aGlzQ29tcG9uZW50LiRqcS5hZGRDbGFzcyh0byk7XHJcbiAgfVxyXG4gIHRoaXMucmVtb3ZlQ2xhc3M9ZnVuY3Rpb24odG8pe1xyXG4gICAgdGhpc0NvbXBvbmVudC4kanEucmVtb3ZlQ2xhc3ModG8pO1xyXG4gIH1cclxufSIsIlxyXG5cclxudmFyIGF1ZGlvQ29udGV4dD1uZXcgQXVkaW9Db250ZXh0KCk7XHJcbnZhciBnbG9iYWxzPXt9O1xyXG5nbG9iYWxzLnN5bmNtYW49cmVxdWlyZSgnLi9zeW5jbWFuLmpzJykuZW5hYmxlKCk7XHJcbmdsb2JhbHMubW91c2U9cmVxdWlyZSgnLi9tb3VzZS5qcycpLmVuYWJsZSgpO1xyXG5nbG9iYWxzLmF1ZGlvQ29udGV4dD1hdWRpb0NvbnRleHQ7XHJcbnZhciBfY2I9cmVxdWlyZSgnLi9jb21wb25lbnRCYXNlLmpzJyk7XHJcbmdsb2JhbHMuY29tcG9uZW50QmFzZT1fY2IuZ2V0KHtzeW5jbWFuOmdsb2JhbHMuc3luY21hbixtb3VzZTpnbG9iYWxzLm1vdXNlfSk7XHJcblxyXG52YXIgU2xpZGVyPXJlcXVpcmUoJy4vU2xpZGVyLmpzJykuZW5hYmxlKGdsb2JhbHMpO1xyXG52YXIgU2VxdWVuY2VyPXJlcXVpcmUoJy4vU2VxdWVuY2VyLmpzJykuZW5hYmxlKGdsb2JhbHMpO1xyXG52YXIgQnV0dG9uPXJlcXVpcmUoJy4vQnV0dG9uLmpzJykuZW5hYmxlKGdsb2JhbHMpO1xyXG52YXIgQ2xvY2s9cmVxdWlyZSgnLi9DbG9jay5qcycpLmVuYWJsZShnbG9iYWxzKTtcclxuXHJcbi8qKlxyXG4qIEEgbGlicmFyeSBmb3IgZWFzeSBncmFwaGljIGNvbnRyb2wgb2Ygc3ludGhzLCBtdXNpYyBhbmQgcHJvYmFibHkgb3RoZXIgdGhpbmdzLlxyXG4qIFRoaXMgZG9jdW1lbnRhdGlvbiBoYXMgYSBsb25nIHdheSB0byBnby5cclxuKiBAaW5zdGFuY2UgTXNDb21wb25lbnRzXHJcbiogaW5zdGFuY2UgYW55IGxpYnJhcnkgY29tcG9uZW50IGJ5IG5ldyBgTXNDb21wb25lbnRzLmNvbXBvbmVudCgpYFxyXG4qIEBleGFtcGxlIHZhciBteVNsaWRlcj0gbmV3IE1zQ29tcG9uZW50cy5TbGlkZXIoKTtcclxuKi9cclxudmFyIE1zQ29tcG9uZW50cz17XHJcbiAgU2xpZGVyOlNsaWRlcixcclxuICBTZXF1ZW5jZXI6U2VxdWVuY2VyLFxyXG4gIEJ1dHRvbjpCdXR0b24sXHJcbiAgQ2xvY2s6Q2xvY2ssXHJcbiAgY3JlYXRlOmZ1bmN0aW9uKHdoYXQsb3B0aW9ucyx3aGVyZSl7XHJcbiAgICBpZighd2hlcmUpXHJcbiAgICAgIHdoZXJlPSQoXCJib2R5XCIpO1xyXG4gICAgcmV0dXJuIG5ldyB0aGlzW3doYXRdKHdoZXJlLG9wdGlvbnMpO1xyXG4gIH0sXHJcbn07XHJcbndpbmRvdy5Nc0NvbXBvbmVudHM9TXNDb21wb25lbnRzO1xyXG5jb25zb2xlLmxvZyhNc0NvbXBvbmVudHMpOyIsImV4cG9ydHMuZW5hYmxlPWZ1bmN0aW9uKCl7XHJcblxyXG4gICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XHJcbiAgICAkKGRvY3VtZW50KS5vbihcIm1vdXNlZG93biB0b3VjaHN0YXJ0IHRvdWNobW92ZVwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgbW91c2UuYnV0dG9uRG93bj10cnVlO1xyXG4gICAgICAvLyBjb25zb2xlLmxvZyhldmVudCk7XHJcbiAgICB9KTtcclxuICAgICQoZG9jdW1lbnQpLm9uKFwibW91c2V1cCB0b3VjaGVuZFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgbW91c2UuYnV0dG9uRG93bj1mYWxzZTtcclxuICAgIH0pO1xyXG4gICAgLy8gZG9jdW1lbnQub250b3VjaG1vdmUgPSBmdW5jdGlvbihldmVudCl7XHJcbiAgICAvLyAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAvLyB9XHJcbiAgfSk7XHJcbiAgXHJcbiAgcmV0dXJuIG1vdXNlO1xyXG59XHJcbnZhciBtb3VzZT17XHJcbiAgdG9vbDpcImRyYXdcIlxyXG59O1xyXG5cclxuXHJcbiIsIi8qXHJcblRoaXMgc2NyaXB0IGNvbnRhaW5zIGEgdGVtcGxhdGUgZm9yIGRhdGEtYmluZGluZyBtYW5hZ2VtZW50IGlmIHlvdSB3YW50IHRvIGRvIHNvLiBPdGhlcndpc2UsIGl0IHdpbGwganVzdCBwbGFjZWhvbGQgdmFyIG5hbWVzIHNvIHRoZXJlIGFyZSBubyB1bmRlZmluZWQgdmFycy5cclxuICAgIENvcHlyaWdodCAoQykgMjAxNiBKb2FxdcOtbiBBbGR1bmF0ZVxyXG5cclxuICAgIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbiAgICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG4gICAgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuICAgIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG4gICAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbiAgICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG4gICAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG4gICAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbiAgICBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG4gICAgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG5leHBvcnRzLmVuYWJsZT1mdW5jdGlvbigpe1xyXG4gIHJldHVybiBuZXcgU3luY21hbigpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gU3luY21hbigpe1xyXG4gIC8vbGlzdCBvZiBhbGwgdGhlIGl0ZW1zIHRoYXQgdXNlIGRhdGEgYmluZGluZ1xyXG4gIHRoaXMuYmluZExpc3Q9W107XHJcbiAgLy9ob3cgYXJlIHlvdSBlbWl0dGluZyBjaGFuZ2VzPyBpdCBkZXBlbmRzIG9uIHRoZSBzZXJ2ZXIgeW91IHVzZS5cclxuICB0aGlzLmVtaXQ9ZnVuY3Rpb24oKXt9XHJcbn1cclxuIl19