(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{}],2:[function(require,module,exports){
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

},{"./componentBase":6}],3:[function(require,module,exports){
'use strict';

var syncman, mouse;
var OH = require("onhandlers");
exports.enable = function (globals) {
  syncman = globals.syncman;
  mouse = globals.mouse;
  return Clock;
};
function Clock(parent, options) {
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
  //pendant: this should be part of a base prototype, not repeated in each type
  if (typeof (parent.append || false) == "function") {
    parent.append(this.$jq);
  } else if (typeof (parent.$jq.append || false) == "function") {
    parent.$jq.append(this.$jq);
  } else {
    console.log("a clock couldn't find dom element to attach himself");
  }
  var me = this;
  this.tick = function () {
    thisClock.handle("tick");
    thisClock.addClass("tick");
    setTimeout(function () {
      thisClock.removeClass("tick");
    }, 20);
  };
  setInterval(this.tick, options.interval | 500);
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

},{"onhandlers":1}],4:[function(require,module,exports){
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
  this.name = "sequencer";
  componentBase.call(this, parent, options);
  // this.$jq=$('<div class="sequencer" id="seq_'+n+'"><p style="position:absolute"></p></div>');
  parent.append(this.$jq);
  this.alive = false;
  this._bindN = syncman.bindList.push(this) - 1;
  this.pos = 0;
  this.data = [];
  this.len = Math.pow(2, seqProg % 5 + 1);
  this.evry = Math.pow(2, seqProg % 4 + 1);
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
  this.setDisplace = function (to, emit) {
    if (emit == "only") {
      emit = true;
    } else {
      this.subpos = transportCurrentStep % (this.len * this.evry) + to;
    }
    if (emit == true) {
      sockChange("seq:" + me._bindN + "", "dspl", to);
    }
  };
  this.step = function () {
    var prevalive = this.alive;
    this.alive = this.aliveChild > 0;
    if (this.alive) {
      //if the state of this.alive changes, we must emit the displacement, because it is new
      if (!prevalive) {
        this.displace = (transportCurrentStep + this.subpos) % (this.len * this.evry);
        console.log("ok. emit displae: " + this.displace);
        this.setDisplace(this.displace, "only");
      };
      //each sequencer has a different speed rates. while some plays one step per click, others will have one step per several clock ticks.
      //the sequencer starting point is also displaced, and it depends on the time when it got alived+its position at that moment.
      if (this.subpos % this.evry == 0) {
        // console.log("sq"+this.pos);
        // data={sequencer:this.id,pos:this.pos,stepVal:this.data[this.pos].eval()};
        // this.onStepTrigger(data);
        // stepFunction(data);
        this.pos = this.subpos / this.evry % this.len;
        if (this.data[this.pos].eval() == 1) {
          // this.channel.engine.start(0,this.channel.startOffset,this.channel.endTime);
          //so, this is called elsewhere aswelll.... the channel should have a trigger function
          var loopStart = this.channel.startOffset;
          var loopEnd = this.channel.endTime;
          this.channel.sampler.triggerAttack(false, 0, 1, { start: loopStart, end: loopEnd });
        }
      } else {}
      //what is more economic??
      // this.subpos=(this.subpos+1)%(this.len*this.evry);
      //i guess that.. but it can grow eternally
      this.subpos++;
    }
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
  this.$jq.on("mouseenter", function () {
    focusChannel(me.channel.id);
  });
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

},{"./componentBase":6,"onhandlers":1}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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
  * dragAll: the buttons will activate through all the trajectory of the mouse while pressed
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

},{"onhandlers":1}],7:[function(require,module,exports){
'use strict';

// var syncman={};
var globals = {};
globals.syncman = require('./syncman.js').enable();
globals.mouse = require('./mouse.js').enable();
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

},{"./Button.js":2,"./Clock.js":3,"./Sequencer.js":4,"./Slider.js":5,"./mouse.js":8,"./syncman.js":9}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}]},{},[7])

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvb25oYW5kbGVycy9vbi5qcyIsInNyY1xcQnV0dG9uLmpzIiwic3JjXFxDbG9jay5qcyIsInNyY1xcU2VxdWVuY2VyLmpzIiwic3JjXFxTbGlkZXIuanMiLCJzcmNcXGNvbXBvbmVudEJhc2UuanMiLCJzcmNcXGluZGV4LmpzIiwic3JjXFxtb3VzZS5qcyIsInNyY1xcc3luY21hbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVDQSxJQUFJLGdCQUFjLFFBQVEsaUJBQVIsQ0FBbEI7QUFDQSxJQUFJLE9BQUosRUFBWSxLQUFaO0FBQ0EsUUFBUSxNQUFSLEdBQWUsVUFBUyxPQUFULEVBQWlCO0FBQzlCLFlBQVEsUUFBUSxPQUFoQjtBQUNBLFVBQU0sUUFBUSxLQUFkO0FBQ0Esa0JBQWMsY0FBYyxHQUFkLENBQWtCLEVBQUMsU0FBUSxPQUFULEVBQWlCLE9BQU0sS0FBdkIsRUFBbEIsQ0FBZDtBQUNBLFNBQU8sTUFBUDtBQUNELENBTEQ7QUFNQSxTQUFTLE1BQVQsQ0FBZ0IsTUFBaEIsRUFBdUIsT0FBdkIsRUFBK0I7QUFDN0IsT0FBSyxJQUFMLEdBQVUsUUFBVjtBQUNBLGdCQUFjLElBQWQsQ0FBbUIsSUFBbkIsRUFBd0IsTUFBeEIsRUFBK0IsT0FBL0I7QUFDQTtBQUNBO0FBQ0E7QUFD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QUFMLEdBQWMsRUFBZDtBQUNBO0FBQ0EsU0FBSyxJQUFMLEdBQVUsWUFBVSxDQUFFLENBQXRCO0FBQ0QiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLypcclxueW91IG1ha2UgdGhlIG9uSGFuZGxlcnMuY2FsbCh0aGlzKSBpbiB0aGUgb2JqZWN0IHRoYXQgbmVlZHMgdG8gaGF2ZSBoYW5kbGVycy5cclxudGhlbiB5b3UgY2FuIGNyZWF0ZSBhIGZ1bmN0aW9uIGNhbGxiYWNrIGZvciB0aGF0IG9iamVjdCB1c2luZyBvYmplY3Qub24oXCJoYW5kbGVyTmFtZS5vcHRpb25hbE5hbWVcIixjYWxsYmFja0Z1bmN0aW9uKCl7fSk7XHJcbnRoZSBvYmplY3QgY2FuIHJ1biB0aGUgaGFuZGxlIGNhbGxiYWNrcyBieSB1c2luZyB0aGlzLmhhbmRsZShcImhhbmRsZXJOYW1lXCIscGFyYW1ldGVyc1RvRmVlZCk7XHJcbiovXHJcbm1vZHVsZS5leHBvcnRzPWZ1bmN0aW9uKCkge1xyXG4gIHZhciBldmVudFZlcmJvc2U9ZmFsc2U7XHJcbiAgaWYgKCF0aGlzLm9ucykge1xyXG4gICAgdGhpcy5vbnMgPSBbXTtcclxuICB9XHJcbiAgdGhpcy5vbiA9IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrKSB7XHJcbiAgICB2YXIgbmFtZSA9IG5hbWUuc3BsaXQoXCIuXCIpO1xyXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBpZiAobmFtZS5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgIHRocm93IChcInNvcnJ5LCB5b3UgZ2F2ZSBhbiBpbnZhbGlkIGV2ZW50IG5hbWVcIik7XHJcbiAgICAgIH0gZWxzZSBpZiAobmFtZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLm9uc1tuYW1lWzBdXSkgdGhpcy5vbnNbbmFtZVswXV0gPSBbXTtcclxuICAgICAgICB0aGlzLm9uc1tuYW1lWzBdXS5wdXNoKFtmYWxzZSwgY2FsbGJhY2tdKTtcclxuICAgICAgfVxyXG4gICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLm9ucyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyAoXCJlcnJvciBhdCBtb3VzZS5vbiwgcHJvdmlkZWQgY2FsbGJhY2sgdGhhdCBpcyBub3QgYSBmdW5jdGlvblwiKTtcclxuICAgIH1cclxuICB9XHJcbiAgdGhpcy5vZmYgPSBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICB2YXIgbmFtZSA9IG5hbWUuc3BsaXQoXCIuXCIpO1xyXG4gICAgaWYgKG5hbWUubGVuZ3RoID4gMSkge1xyXG4gICAgICBpZiAoIXRoaXMub25zW25hbWVbMF1dKSB0aGlzLm9uc1tuYW1lWzBdXSA9IFtdO1xyXG4gICAgICAvLyBjb25zb2xlLmxvZyhcInByZXZcIix0aGlzLm9uc1tuYW1lWzBdXSk7XHJcbiAgICAgIHRoaXMub25zW25hbWVbMF1dLnNwbGljZSh0aGlzLm9uc1tuYW1lWzBdXS5pbmRleE9mKG5hbWVbMV0pLCAxKTtcclxuICAgICAgLy8gY29uc29sZS5sb2coXCJ0aGVuXCIsdGhpcy5vbnNbbmFtZVswXV0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhyb3cgKFwic29ycnksIHlvdSBnYXZlIGFuIGludmFsaWQgZXZlbnQgbmFtZVwiICsgbmFtZSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHRoaXMuaGFuZGxlID0gZnVuY3Rpb24oZm5hbWUsIHBhcmFtcykge1xyXG4gICAgaWYoZXZlbnRWZXJib3NlKSBjb25zb2xlLmxvZyhcIkV2ZW50IFwiK2ZuYW1lK1wiOlwiLHtjYWxsZXI6dGhpcyxwYXJhbXM6cGFyYW1zfSk7XHJcbiAgICBpZiAodGhpcy5vbnNbZm5hbWVdKSB7XHJcbiAgICAgIGZvciAodmFyIG4gaW4gdGhpcy5vbnNbZm5hbWVdKSB7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5vbnNbZm5hbWVdW25dWzFdKTtcclxuICAgICAgICB0aGlzLm9uc1tmbmFtZV1bbl1bMV0ocGFyYW1zKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufTsiLCJ2YXIgY29tcG9uZW50QmFzZT1yZXF1aXJlKCcuL2NvbXBvbmVudEJhc2UnKTtcclxudmFyIHN5bmNtYW4sbW91c2U7XHJcbmV4cG9ydHMuZW5hYmxlPWZ1bmN0aW9uKGdsb2JhbHMpe1xyXG4gIHN5bmNtYW49Z2xvYmFscy5zeW5jbWFuO1xyXG4gIG1vdXNlPWdsb2JhbHMubW91c2U7XHJcbiAgY29tcG9uZW50QmFzZT1jb21wb25lbnRCYXNlLmdldCh7c3luY21hbjpzeW5jbWFuLG1vdXNlOm1vdXNlfSk7XHJcbiAgcmV0dXJuIEJ1dHRvbjtcclxufVxyXG5mdW5jdGlvbiBCdXR0b24ocGFyZW50LG9wdGlvbnMpe1xyXG4gIHRoaXMubmFtZT1cImJ1dHRvblwiO1xyXG4gIGNvbXBvbmVudEJhc2UuY2FsbCh0aGlzLHBhcmVudCxvcHRpb25zKTtcclxuICAvL215IHJlZmVyZW5jZSBudW1iZXIgZm9yIGRhdGEgYmluZGluZy4gV2l0aCB0aGlzIG51bWJlciB0aGUgc29ja2V0IGJpbmRlciBrbm93cyB3aG8gaXMgdGhlIHJlY2lldmVyIG9mIHRoZSBkYXRhLCBhbmQgYWxzbyB3aXRoIHdoYXQgbmFtZSB0byBzZW5kIGl0XHJcbiAgLy9wZW5kYW50OiB0aGlzIGNhbiBwb3RlbnRpYWxseSBjcmVhdGUgYSBwcm9ibGVtLCBiZWNhdXNlIHR3byBvYmplY3RzIGNhbiBiZSBjcmVhdGVkIHNpbXVsdGFuZW91c2x5IGF0IGRpZmZlcmVudCBlbmRzIGF0IHRoZSBzYW1lIHRpbWUuXHJcbiAgLy9tYXliZSBpbnN0ZWFkIG9mIHRoZSBzaW1wbGUgcHVzaCwgdGhlcmUgY291bGQgYmUgYSBjYWxsYmFjaywgYWRuIHRoZSBvYmplY3Qgd2FpdHMgdG8gcmVjZWl2ZSBpdCdzIHNvY2tldCBpZCBvbmNlIGl0cyBjcmVhdGlvbiB3YXMgcHJvcGFnYXRlZCB0aHJvdWdob3V0IGFsbCB0aGUgbmV0d29yaywgb3IgbWF5YmUgdGhlcmUgaXMgYW4gYXJyYXkgZm9yIHNlbnRpbmcgYW5kIG90aGVyIGRpZmZlcmVudCBmb3IgcmVjZWl2aW5nLi4uIGZpcnN0IG9wdGlvbiBzZWVtcyBtb3JlIHNlbnNpYmxlXHJcbiAgdGhpcy5kYXRhPXt2YWx1ZTowfTtcclxuICB0aGlzLnN0YXRlcz1mYWxzZTtcclxuICB0aGlzLl9iaW5kTj1zeW5jbWFuLmJpbmRMaXN0LnB1c2godGhpcyktMTtcclxuICAvL3RoaXMuJGpxPSQoJzxkaXYgY2xhc3M9XCJtcy1idXR0b25cIj48L2Rpdj4nKTtcclxuICB0aGlzLmxhYmVsPW9wdGlvbnMubGFiZWx8fFwi4pi7XCI7XHJcbiAgdGhpcy4kanEuYXBwZW5kKHRoaXMuJGZhZGVyanEpO1xyXG4gIHRoaXMuJGpxLmh0bWwodGhpcy5sYWJlbCk7XHJcbiAgLy8gaWYob3B0aW9ucy5jc3MpXHJcbiAgLy8gICB0aGlzLiRqcS5jc3Mob3B0aW9ucy5jc3MpO1xyXG4gIC8vIHRoaXMuY3NzPWZ1bmN0aW9uKGNzcyl7XHJcbiAgLy8gICB0aGlzLiRqcS5jc3Mob3B0aW9ucy5jc3MpO1xyXG4gIC8vICAgcmV0dXJuIHRoaXM7XHJcbiAgLy8gfVxyXG4gIC8vaWYgYSBzd2l0Y2ggdmFyaWFibGUgaXMgcGFzc2VkLCB0aGlzIGJ1dHRvbiB3aWxsIHN3aXRjaCBvbiBlYWNoIGNsaWNrIGFtb25nIHRoZSBzdGF0ZWQgc3RhdGVzXHJcbiAgaWYob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShcInN3aXRjaFwiKSl7XHJcbiAgICB0aGlzLnN0YXRlcz1bXTtcclxuICAgIHRoaXMuZGF0YS5jdXJyZW50U3RhdGU9MDtcclxuICAgIHRoaXMuc3RhdGVzPW9wdGlvbnMuc3dpdGNoO1xyXG4gICAgdGhpcy5zd2l0Y2hTdGF0ZSgwKTtcclxuICB9XHJcbiAgdGhpcy5vbkNsaWNrQ2FsbGJhY2s9ZnVuY3Rpb24oKXt9O1xyXG4gIHRoaXMub25SZWxlYXNlQ2FsbGJhY2s9ZnVuY3Rpb24oKXt9O1xyXG4gIC8vcGVuZGFudDogdGhpcyBzaG91bGQgYmUgcGFydCBvZiBhIGJhc2UgcHJvdG90eXBlLCBub3QgcmVwZWF0ZWQgaW4gZWFjaCB0eXBlXHJcbiAgLy8gaWYodHlwZW9mIChwYXJlbnQuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgLy8gICBwYXJlbnQuYXBwZW5kKHRoaXMuJGpxKTtcclxuICAvLyB9ZWxzZSBpZih0eXBlb2YgKHBhcmVudC4kanEuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgLy8gICBwYXJlbnQuJGpxLmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgLy8gfWVsc2V7XHJcbiAgLy8gICBjb25zb2xlLmxvZyhcImEgc2xpZGVyIGNvdWxkbid0IGZpbmQgZG9tIGVsZW1lbnQgdG8gYXR0YWNoIGhpbXNlbGZcIik7XHJcbiAgLy8gfVxyXG4gIHZhciBtZT10aGlzO1xyXG4gIC8vIHRoaXMub25DaGFuZ2U9ZnVuY3Rpb24oY2FsbGJhY2spe1xyXG4gIC8vICAgbWUub25DbGlja0NhbGxiYWNrPWZ1bmN0aW9uKCl7Y2FsbGJhY2sobWUuZGF0YSl9O1xyXG4gIC8vICAgcmV0dXJuIHRoaXM7XHJcbiAgLy8gfVxyXG5cclxuICB0aGlzLiRqcS5vbihcIm1vdXNlZG93biB0YXAgdG91Y2hzdGFydFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIG1lLm9uQ2xpY2tDYWxsYmFjayhtZS5kYXRhKTtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBtZS5zd2l0Y2hTdGF0ZSgpO1xyXG4gICAgbWUuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XHJcbiAgfSk7XHJcbiAgdGhpcy4kanEub24oXCJtb3VzZXVwIG1vdXNlbGVhdmVcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBtZS5vblJlbGVhc2VDYWxsYmFjayhtZS5kYXRhKTtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBtZS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKTtcclxuICB9KTtcclxufVxyXG5cclxuXHJcbkJ1dHRvbi5wcm90b3R5cGUub25DbGljaz1mdW5jdGlvbihjYWxsYmFjayl7XHJcbiAgdGhpcy5vbkNsaWNrQ2FsbGJhY2s9Y2FsbGJhY2s7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn1cclxuQnV0dG9uLnByb3RvdHlwZS5vblJlbGVhc2U9ZnVuY3Rpb24oY2FsbGJhY2spe1xyXG4gIHRoaXMub25SZWxlYXNlQ2FsbGJhY2s9Y2FsbGJhY2s7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn1cclxuQnV0dG9uLnByb3RvdHlwZS5zd2l0Y2hTdGF0ZT1mdW5jdGlvbih0byl7XHJcbiAgaWYodGhpcy5zdGF0ZXMpe1xyXG4gICAgLy9jaGFuZ2Ugc3RhdGUgbnVtYmVyIHRvIG5leHRcclxuICAgIGlmKHRvKXtcclxuICAgICAgdGhpcy5kYXRhLmN1cnJlbnRTdGF0ZT10byV0aGlzLnN0YXRlcy5sZW5ndGg7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdGhpcy5kYXRhLmN1cnJlbnRTdGF0ZT0odGhpcy5kYXRhLmN1cnJlbnRTdGF0ZSsxKSV0aGlzLnN0YXRlcy5sZW5ndGg7XHJcbiAgICB9XHJcbiAgICAvL2FwcGx5IGFsbCB0aGUgcHJvcGVydGllcyB0aGF0IHRoZSBzdGF0ZSBjYXJyeS4gVGhpcyBtYWtlcyB0aGUgYnV0dG9uIHN1cGVyIGhhY2thYmxlXHJcbiAgICBmb3IoYSBpbiB0aGlzLnN0YXRlc1t0aGlzLmRhdGEuY3VycmVudFN0YXRlXSl7XHJcbiAgICAgIHRoaXNbYV09dGhpcy5zdGF0ZXNbdGhpcy5kYXRhLmN1cnJlbnRTdGF0ZV1bYV07XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKFwiW1wiK2ErXCJdXCIsdGhpc1thXSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHRoaXMudXBkYXRlRG9tKCk7XHJcbn1cclxuIiwiXHJcbnZhciBzeW5jbWFuLG1vdXNlO1xyXG52YXIgT0g9cmVxdWlyZShcIm9uaGFuZGxlcnNcIik7XHJcbmV4cG9ydHMuZW5hYmxlPWZ1bmN0aW9uKGdsb2JhbHMpe1xyXG4gIHN5bmNtYW49Z2xvYmFscy5zeW5jbWFuO1xyXG4gIG1vdXNlPWdsb2JhbHMubW91c2U7XHJcbiAgcmV0dXJuIENsb2NrO1xyXG59O1xyXG5mdW5jdGlvbiBDbG9jayhwYXJlbnQsb3B0aW9ucyl7XHJcbiAgT0guY2FsbCh0aGlzKTtcclxuICB2YXIgdGhpc0Nsb2NrPXRoaXM7XHJcbiAgdGhpcy5kYXRhPXt2YWx1ZTowfTtcclxuICB0aGlzLnN0YXRlcz1mYWxzZTtcclxuICB0aGlzLl9iaW5kTj1zeW5jbWFuLmJpbmRMaXN0LnB1c2godGhpcyktMTtcclxuICB0aGlzLiRqcT0kKCc8ZGl2IGNsYXNzPVwibXMtY2xvY2sgbXMtYnV0dG9uXCI+PC9kaXY+Jyk7XHJcbiAgdGhpcy5sYWJlbD1vcHRpb25zLmxhYmVsfHwn4oiGJztcclxuICB0aGlzLiRqcS5hcHBlbmQodGhpcy4kZmFkZXJqcSk7XHJcbiAgdGhpcy4kanEuaHRtbCh0aGlzLmxhYmVsKTtcclxuICBpZihvcHRpb25zLmNzcylcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgdGhpcy5jc3M9ZnVuY3Rpb24oY3NzKXtcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgLy9wZW5kYW50OiB0aGlzIHNob3VsZCBiZSBwYXJ0IG9mIGEgYmFzZSBwcm90b3R5cGUsIG5vdCByZXBlYXRlZCBpbiBlYWNoIHR5cGVcclxuICBpZih0eXBlb2YgKHBhcmVudC5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC5hcHBlbmQodGhpcy4kanEpO1xyXG4gIH1lbHNlIGlmKHR5cGVvZiAocGFyZW50LiRqcS5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC4kanEuYXBwZW5kKHRoaXMuJGpxKTtcclxuICB9ZWxzZXtcclxuICAgIGNvbnNvbGUubG9nKFwiYSBjbG9jayBjb3VsZG4ndCBmaW5kIGRvbSBlbGVtZW50IHRvIGF0dGFjaCBoaW1zZWxmXCIpO1xyXG4gIH1cclxuICB2YXIgbWU9dGhpcztcclxuICB0aGlzLnRpY2s9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXNDbG9jay5oYW5kbGUoXCJ0aWNrXCIpO1xyXG4gICAgdGhpc0Nsb2NrLmFkZENsYXNzKFwidGlja1wiKTtcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXt0aGlzQ2xvY2sucmVtb3ZlQ2xhc3MoXCJ0aWNrXCIpO30sMjApO1xyXG4gIH1cclxuICBzZXRJbnRlcnZhbCh0aGlzLnRpY2ssb3B0aW9ucy5pbnRlcnZhbHw1MDApO1xyXG59XHJcblxyXG5DbG9jay5wcm90b3R5cGUudXBkYXRlRG9tPWZ1bmN0aW9uKCl7XHJcbiAgdGhpcy4kanEuaHRtbCh0aGlzLmxhYmVsKTtcclxufVxyXG5cclxuXHJcblxyXG4vL2FsaWFzaW5nIG9mIHRoZXNlIHR3byBoYW5keSBmdW5jdGlvblxyXG5DbG9jay5wcm90b3R5cGUuYWRkQ2xhc3M9ZnVuY3Rpb24odG8pe1xyXG4gIHRoaXMuJGpxLmFkZENsYXNzKHRvKTtcclxufVxyXG5DbG9jay5wcm90b3R5cGUucmVtb3ZlQ2xhc3M9ZnVuY3Rpb24odG8pe1xyXG4gIHRoaXMuJGpxLnJlbW92ZUNsYXNzKHRvKTtcclxufSIsInZhciBjb21wb25lbnRCYXNlPXJlcXVpcmUoJy4vY29tcG9uZW50QmFzZScpO1xyXG5sZXQgZWVtaXRlcj1yZXF1aXJlKCdvbmhhbmRsZXJzJyk7XHJcbnZhciBzeW5jbWFuLG1vdXNlO1xyXG5leHBvcnRzLmVuYWJsZT1mdW5jdGlvbihnbG9iYWxzKXtcclxuICBzeW5jbWFuPWdsb2JhbHMuc3luY21hbjtcclxuICBtb3VzZT1nbG9iYWxzLm1vdXNlO1xyXG4gIGNvbXBvbmVudEJhc2U9Y29tcG9uZW50QmFzZS5nZXQoe3N5bmNtYW46c3luY21hbixtb3VzZTptb3VzZX0pO1xyXG4gIHJldHVybiBTZXF1ZW5jZXI7XHJcbn1cclxuLyoqXHJcbiAqIEEgZ2VuZXJhdG9yIG9mIHNlcXVlbmNlcnNcclxuICpcclxuICogQGNsYXNzIFNlcXVlbmNlclxyXG4gKiBAY29uc3RydWN0b3IgbmV3IE1zQ29tcG9uZW50cy5TZXF1ZW5jZXIoRE9NLyRqcXVlcnkgZWxlbWVudCx7cHJvcGVydGllc30pXHJcbiAqL1xyXG4gLy9kZWZpbmVzIGFsbCB0aGUgc2VxdWVuY2VyIHBhcmFtZXRlcnMgYnkgbWF0aCxcclxuIC8vbWF5YmUgaW4gYSBmdW50dXJlIGJ5IHN0eWxpbmcgdGFibGVcclxudmFyIHNlcVByb2c9NDtcclxuZnVuY3Rpb24gU2VxdWVuY2VyKHBhcmVudCxvcHRpb25zKXtcclxuIHZhciBuPW9wdGlvbnMubnx8MztcclxuIHRoaXMubmFtZT1cInNlcXVlbmNlclwiXHJcbiBjb21wb25lbnRCYXNlLmNhbGwodGhpcyxwYXJlbnQsb3B0aW9ucyk7XHJcbiAvLyB0aGlzLiRqcT0kKCc8ZGl2IGNsYXNzPVwic2VxdWVuY2VyXCIgaWQ9XCJzZXFfJytuKydcIj48cCBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlXCI+PC9wPjwvZGl2PicpO1xyXG4gcGFyZW50LmFwcGVuZCh0aGlzLiRqcSk7XHJcbiB0aGlzLmFsaXZlPWZhbHNlO1xyXG4gdGhpcy5fYmluZE49c3luY21hbi5iaW5kTGlzdC5wdXNoKHRoaXMpLTE7XHJcbiB0aGlzLnBvcz0wO1xyXG4gdGhpcy5kYXRhPVtdO1xyXG4gdGhpcy5sZW49TWF0aC5wb3coMiwoc2VxUHJvZyU1KSsxKTtcclxuIHRoaXMuZXZyeT1NYXRoLnBvdygyLChzZXFQcm9nJTQpKzEpO1xyXG4gLy9tdXN0IGNvdW50IGFuIFtldmVyeV0gYW1vdW50IG9mIGJlYXRzIGZvciBlYWNoIHBvcyBpbmNyZW1lbnQuXHJcbiB0aGlzLnN1YnBvcz0wO1xyXG4gdGhpcy4kanEuY3NzKHt3aWR0aDoxNipNYXRoLmNlaWwodGhpcy5sZW4vNCkrXCJweFwifSk7XHJcbiAvL3RoaXMuJGpxLmFkZENsYXNzKFwiY29sb3JfXCIrc2VxUHJvZyVjaGFubmVscy5sZW5ndGgpO1xyXG4gdGhpcy5kaXNwPTA7XHJcbiB0aGlzLmlkPW47XHJcbiB0aGlzLmJlYXREaXNwbGFjZT0wO1xyXG4gdmFyIG1lPXRoaXM7XHJcbiBzZXFQcm9nKys7XHJcbiAvL3RoaXMuY2hhbm5lbD1jaGFubmVsc1t0aGlzLmlkJWNoYW5uZWxzLmxlbmd0aF07XHJcbiBmb3IodmFyIGJuPTA7IGJuPHRoaXMubGVuOyBibisrKXtcclxuICAgdGhpcy5kYXRhW2JuXT1uZXcgU2VxdWVuY2VyQnV0dG9uKGJuLHRoaXMpXHJcbiB9XHJcbiB0aGlzLmFsaXZlQ2hpbGQ9MDtcclxuIHRoaXMuZGlzcGxhY2U9MDtcclxuIHRoaXMuc2V0RGlzcGxhY2U9ZnVuY3Rpb24odG8sZW1pdCl7XHJcbiAgIGlmKGVtaXQ9PVwib25seVwiKXtcclxuICAgICBlbWl0PXRydWU7XHJcbiAgIH1lbHNle1xyXG4gICAgIHRoaXMuc3VicG9zPSgodHJhbnNwb3J0Q3VycmVudFN0ZXApJSh0aGlzLmxlbip0aGlzLmV2cnkpKSt0bztcclxuICAgfVxyXG4gICBpZihlbWl0PT10cnVlKXtcclxuICAgICBzb2NrQ2hhbmdlKFwic2VxOlwiK21lLl9iaW5kTitcIlwiLFwiZHNwbFwiLHRvKTtcclxuICAgfVxyXG4gfVxyXG4gdGhpcy5zdGVwPWZ1bmN0aW9uKCl7XHJcbiAgIHZhciBwcmV2YWxpdmU9dGhpcy5hbGl2ZTtcclxuICAgdGhpcy5hbGl2ZT10aGlzLmFsaXZlQ2hpbGQ+MDtcclxuICAgaWYodGhpcy5hbGl2ZSl7XHJcbiAgICAgLy9pZiB0aGUgc3RhdGUgb2YgdGhpcy5hbGl2ZSBjaGFuZ2VzLCB3ZSBtdXN0IGVtaXQgdGhlIGRpc3BsYWNlbWVudCwgYmVjYXVzZSBpdCBpcyBuZXdcclxuICAgICBpZighcHJldmFsaXZlKXtcclxuICAgICAgIHRoaXMuZGlzcGxhY2U9KHRyYW5zcG9ydEN1cnJlbnRTdGVwK3RoaXMuc3VicG9zKSUodGhpcy5sZW4qdGhpcy5ldnJ5KTtcclxuICAgICAgIGNvbnNvbGUubG9nKFwib2suIGVtaXQgZGlzcGxhZTogXCIrdGhpcy5kaXNwbGFjZSk7XHJcbiAgICAgICB0aGlzLnNldERpc3BsYWNlKHRoaXMuZGlzcGxhY2UsXCJvbmx5XCIpO1xyXG4gICAgIH07XHJcbiAgICAgLy9lYWNoIHNlcXVlbmNlciBoYXMgYSBkaWZmZXJlbnQgc3BlZWQgcmF0ZXMuIHdoaWxlIHNvbWUgcGxheXMgb25lIHN0ZXAgcGVyIGNsaWNrLCBvdGhlcnMgd2lsbCBoYXZlIG9uZSBzdGVwIHBlciBzZXZlcmFsIGNsb2NrIHRpY2tzLlxyXG4gICAgIC8vdGhlIHNlcXVlbmNlciBzdGFydGluZyBwb2ludCBpcyBhbHNvIGRpc3BsYWNlZCwgYW5kIGl0IGRlcGVuZHMgb24gdGhlIHRpbWUgd2hlbiBpdCBnb3QgYWxpdmVkK2l0cyBwb3NpdGlvbiBhdCB0aGF0IG1vbWVudC5cclxuICAgICBpZih0aGlzLnN1YnBvcyV0aGlzLmV2cnk9PTApe1xyXG4gICAgICAgLy8gY29uc29sZS5sb2coXCJzcVwiK3RoaXMucG9zKTtcclxuICAgICAgIC8vIGRhdGE9e3NlcXVlbmNlcjp0aGlzLmlkLHBvczp0aGlzLnBvcyxzdGVwVmFsOnRoaXMuZGF0YVt0aGlzLnBvc10uZXZhbCgpfTtcclxuICAgICAgIC8vIHRoaXMub25TdGVwVHJpZ2dlcihkYXRhKTtcclxuICAgICAgIC8vIHN0ZXBGdW5jdGlvbihkYXRhKTtcclxuICAgICAgIHRoaXMucG9zPSh0aGlzLnN1YnBvcy90aGlzLmV2cnkpJSh0aGlzLmxlbik7XHJcbiAgICAgICBpZih0aGlzLmRhdGFbdGhpcy5wb3NdLmV2YWwoKT09MSl7XHJcbiAgICAgICAgIC8vIHRoaXMuY2hhbm5lbC5lbmdpbmUuc3RhcnQoMCx0aGlzLmNoYW5uZWwuc3RhcnRPZmZzZXQsdGhpcy5jaGFubmVsLmVuZFRpbWUpO1xyXG4gICAgICAgICAvL3NvLCB0aGlzIGlzIGNhbGxlZCBlbHNld2hlcmUgYXN3ZWxsbC4uLi4gdGhlIGNoYW5uZWwgc2hvdWxkIGhhdmUgYSB0cmlnZ2VyIGZ1bmN0aW9uXHJcbiAgICAgICAgIHZhciBsb29wU3RhcnQ9dGhpcy5jaGFubmVsLnN0YXJ0T2Zmc2V0O1xyXG4gICAgICAgICB2YXIgbG9vcEVuZD10aGlzLmNoYW5uZWwuZW5kVGltZTtcclxuICAgICAgICAgdGhpcy5jaGFubmVsLnNhbXBsZXIudHJpZ2dlckF0dGFjayhmYWxzZSwwLDEse3N0YXJ0Omxvb3BTdGFydCxlbmQ6bG9vcEVuZH0pO1xyXG4gICAgICAgfVxyXG4gICAgIH1lbHNle1xyXG4gICAgIH1cclxuICAgICAvL3doYXQgaXMgbW9yZSBlY29ub21pYz8/XHJcbiAgICAgLy8gdGhpcy5zdWJwb3M9KHRoaXMuc3VicG9zKzEpJSh0aGlzLmxlbip0aGlzLmV2cnkpO1xyXG4gICAgIC8vaSBndWVzcyB0aGF0Li4gYnV0IGl0IGNhbiBncm93IGV0ZXJuYWxseVxyXG4gICAgIHRoaXMuc3VicG9zKys7XHJcbiAgIH1cclxuIH1cclxuIHRoaXMuZGllPWZ1bmN0aW9uKCl7XHJcbiAgIGZvcih2YXIgYm4gaW4gdGhpcy5kYXRhKXtcclxuICAgICB0aGlzLmRhdGFbYm5dLnNldERhdGEoMCk7XHJcbiAgIH1cclxuICAgdGhpcy5hbGl2ZT1mYWxzZTtcclxuICAgdGhpcy4kanEuZGV0YWNoKCk7XHJcbiB9XHJcbiAvLyB0aGlzLm9uU3RlcFRyaWdnZXI9ZnVuY3Rpb24oZGF0YSl7XHJcbiAvLyAgIC8vIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gLy8gfVxyXG4gdGhpcy4kanEub24oXCJtb3VzZWVudGVyXCIsZnVuY3Rpb24oKXtcclxuICAgZm9jdXNDaGFubmVsKG1lLmNoYW5uZWwuaWQpO1xyXG4gfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFNlcXVlbmNlckJ1dHRvbihuLHBhcmVudCl7XHJcbiAgZWVtaXRlci5jYWxsKHRoaXMpO1xyXG4gIHRoaXMub24oXCJ0ZXN0XCIsZnVuY3Rpb24oKXtjb25zb2xlLmxvZyhcIndvcmtzIVwiKX0pO1xyXG4gIHRoaXMuaGFuZGxlKFwidGVzdFwiKTtcclxuICB0aGlzLiRqcT0kKCc8ZGl2IGNsYXNzPVwic2VxYnV0dG9uXCI+PC9kaXY+Jyk7XHJcbiAgdGhpcy5fYmluZE49c3luY21hbi5iaW5kTGlzdC5wdXNoKHRoaXMpLTE7XHJcbiAgcGFyZW50LiRqcS5hcHBlbmQodGhpcy4kanEpO1xyXG4gIHRoaXMuZGF0YT0wO1xyXG4gIC8vcGVuZGFudDogZXZhbHVhdGUgd2V0aGVyIHRoZSB2YXIgbiBpcyBzdGlsbCB1c2VmdWwuIHJlbW92ZSBpdCBhdCBldmVyeSBlbmQuXHJcbiAgdGhpcy5uPW47XHJcbiAgdmFyIG1lPXRoaXM7XHJcbiAgdGhpcy5zZXREYXRhPWZ1bmN0aW9uKHRvLGVtaXQpe1xyXG4gICAgLy8gaWYoZW1pdD09dHJ1ZSl7XHJcbiAgICAvLyAgIHNvY2tDaGFuZ2UoXCJzZXFiOlwiK21lLl9iaW5kTitcIlwiLFwic1ZcIix0byk7XHJcbiAgICAvLyB9XHJcbiAgICAvLyBjb25zb2xlLmxvZyhcInNkYXRhXCIpO1xyXG4gICAgLy9zb2NrZXQgbWF5IHNldCBkYXRhIHRvIDAgd2hlbiBpcyBhbHJlYWR5IDAsIGdlbmVyYXRpbmcgZGlzcGxhY2Ugb2YgcGFyZW50J3MgYWxpdmVkaGlsZFxyXG4gICAgaWYodG8hPXRoaXMuZGF0YSl7XHJcbiAgICAgIGlmKHRvPT0xKXtcclxuICAgICAgICB0aGlzLmRhdGE9MTtcclxuICAgICAgICB0aGlzLiRqcS5hZGRDbGFzcyhcIm9uXCIpO1xyXG4gICAgICAgIHBhcmVudC5hbGl2ZUNoaWxkKys7XHJcbiAgICAgIH1cclxuICAgICAgaWYodG89PTApe1xyXG4gICAgICAgIHRoaXMuZGF0YT0wO1xyXG4gICAgICAgIHRoaXMuJGpxLnJlbW92ZUNsYXNzKFwib25cIik7XHJcbiAgICAgICAgcGFyZW50LmFsaXZlQ2hpbGQtLTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gY29uc29sZS5sb2cocGFyZW50LmFsaXZlQ2hpbGQpO1xyXG4gIH1cclxuICB0aGlzLiRqcS5vbihcIm1vdXNlZG93biB0YXAgdG91Y2hzdGFydFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBtZS5zZXREYXRhKE1hdGguYWJzKG1lLmRhdGEtMSksdHJ1ZSk7XHJcbiAgICAvLyBtZS5kYXRhPTtcclxuICAgIGlmKG1lLmRhdGE9PTEpe1xyXG4gICAgICAgbW91c2Uuc3dpdGNoaW5nPXRydWU7XHJcbiAgICB9ZWxzZXtcclxuICAgIC8vICAgJCh0aGlzKS5yZW1vdmVDbGFzcyhcIm9uXCIpO1xyXG4gICAgLy8gICBwYXJlbnQuYWxpdmVDaGlsZC0tO1xyXG4gICAgICAgbW91c2Uuc3dpdGNoaW5nPWZhbHNlO1xyXG4gICAgIH1cclxuICB9KTtcclxuICB0aGlzLiRqcS5vbihcIm1vdXNlZW50ZXIgdG91Y2hlbnRlclwiLGZ1bmN0aW9uKCl7XHJcbiAgICBpZihtb3VzZS5idXR0b25Eb3duKXtcclxuICAgICAgaWYobW91c2Uuc3dpdGNoaW5nKXtcclxuICAgICAgICBpZihtZS5kYXRhPT0wKXtcclxuICAgICAgICAgIG1lLnNldERhdGEoMSx0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIGlmKG1lLmRhdGE9PTEpe1xyXG4gICAgICAgICAgbWUuc2V0RGF0YSgwLHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHRoaXMuZXZhbD1mdW5jdGlvbigpe1xyXG4gICAgdmFyICRqcT10aGlzLiRqcTtcclxuICAgICRqcS5hZGRDbGFzcyhcInR1cm5cIik7XHJcbiAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAkanEucmVtb3ZlQ2xhc3MoXCJ0dXJuXCIpO1xyXG4gICAgfSwyMDApO1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YTtcclxuICB9XHJcbn1cclxuIiwiLypcclxuVGhpcyBzY3JpcHQgY3JlYXRlIERPTSBzbGlkZXJzIHRoYXQgY2FuIGJlIHVzZWQgaW4gd2ViIGJyb3dzZXIgdG8gY29udHJvbCBzdHVmZi4gVGhleSBjYW4gYmUgc3luY2VkIHRocm91Z2ggc29ja2V0cyBhbmQgb3RoZXJzIGJ5IHVzaW5nIGNhbGxiYWNrcy5cclxuICAgIENvcHlyaWdodCAoQykgMjAxNiBKb2FxdcOtbiBBbGR1bmF0ZVxyXG5cclxuICAgIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbiAgICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG4gICAgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuICAgIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG4gICAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbiAgICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG4gICAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG4gICAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbiAgICBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG4gICAgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcbnZhciBzeW5jbWFuLG1vdXNlO1xyXG4vLyB2YXIgJDtcclxuZXhwb3J0cy5lbmFibGU9ZnVuY3Rpb24oZ2xvYmFscyl7XHJcbiAgc3luY21hbj1nbG9iYWxzLnN5bmNtYW47XHJcbiAgbW91c2U9Z2xvYmFscy5tb3VzZTtcclxuICByZXR1cm4gU2xpZGVyO1xyXG59O1xyXG5cclxuLyoqXHJcbiogVGhpcyBpcyB0aGUgZGVzY3JpcHRpb24gZm9yIFNsaWRlciBjbGFzc1xyXG4qXHJcbiogQGNsYXNzIFNsaWRlclxyXG4qIEBjb25zdHJ1Y3RvclxyXG4qL1xyXG5mdW5jdGlvbiBTbGlkZXIocGFyZW50LG9wdGlvbnMpe1xyXG4gIC8vbXkgcmVmZXJlbmNlIG51bWJlciBmb3IgZGF0YSBiaW5kaW5nLiBXaXRoIHRoaXMgbnVtYmVyIHRoZSBzb2NrZXQgYmluZGVyIGtub3dzIHdobyBpcyB0aGUgcmVjaWV2ZXIgb2YgdGhlIGRhdGEsIGFuZCBhbHNvIHdpdGggd2hhdCBuYW1lIHRvIHNlbmQgaXRcclxuICAvL3BlbmRhbnQ6IHRoaXMgY2FuIHBvdGVudGlhbGx5IGNyZWF0ZSBhIHByb2JsZW0sIGJlY2F1c2UgdHdvIG9iamVjdHMgY2FuIGJlIGNyZWF0ZWQgc2ltdWx0YW5lb3VzbHkgYXQgZGlmZmVyZW50IGVuZHMgYXQgdGhlIHNhbWUgdGltZS5cclxuICAvL21heWJlIGluc3RlYWQgb2YgdGhlIHNpbXBsZSBwdXNoLCB0aGVyZSBjb3VsZCBiZSBhIGNhbGxiYWNrLCBhZG4gdGhlIG9iamVjdCB3YWl0cyB0byByZWNlaXZlIGl0J3Mgc29ja2V0IGlkIG9uY2UgaXRzIGNyZWF0aW9uIHdhcyBwcm9wYWdhdGVkIHRocm91Z2hvdXQgYWxsIHRoZSBuZXR3b3JrLCBvciBtYXliZSB0aGVyZSBpcyBhbiBhcnJheSBmb3Igc2VudGluZyBhbmQgb3RoZXIgZGlmZmVyZW50IGZvciByZWNlaXZpbmcuLi4gZmlyc3Qgb3B0aW9uIHNlZW1zIG1vcmUgc2Vuc2libGVcclxuICB0aGlzLmRhdGE9e3ZhbHVlOjB9O1xyXG5cclxuICB0aGlzLl9iaW5kTj1zeW5jbWFuLmJpbmRMaXN0LnB1c2godGhpcyktMTtcclxuICB0aGlzLiRqcT0kKCc8ZGl2IGNsYXNzPVwic2xpZGVyLWNvbnRhaW5lclwiIHN0eWxlPVwicG9zaXRpb246cmVsYXRpdmVcIj48L2Rpdj4nKTtcclxuICB0aGlzLiRmYWRlcmpxPSQoJzxkaXYgY2xhc3M9XCJzbGlkZXItaW5uZXJcIiBzdHlsZT1cInBvaW50ZXItZXZlbnRzOm5vbmU7IHBvc2l0aW9uOmFic29sdXRlXCI+PC9kaXY+Jyk7XHJcbiAgdGhpcy5sYWJlbD1vcHRpb25zLmxhYmVsfHxcIlwiO1xyXG4gIHRoaXMubGFiZWxqcT0kKCc8cCBjbGFzcz1cInNsaWRlcmxhYmVsXCI+PC9wPicpO1xyXG4gIHRoaXMuJGpxLmFwcGVuZCh0aGlzLiRmYWRlcmpxKTtcclxuICB0aGlzLiRqcS5hcHBlbmQodGhpcy5sYWJlbGpxKTtcclxuICBpZihvcHRpb25zLmNzcylcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgdGhpcy5jc3M9ZnVuY3Rpb24oY3NzKXtcclxuICAgIHRoaXMuJGpxLmNzcyhjc3MpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG4gIHRoaXMub25DaGFuZ2VDYWxsYmFjaz1mdW5jdGlvbigpe307XHJcbiAgLy9wZW5kYW50OiB0aGlzIHNob3VsZCBiZSBwYXJ0IG9mIGEgYmFzZSBwcm90b3R5cGUsIG5vdCByZXBlYXRlZCBpbiBlYWNoIHR5cGVcclxuICBpZih0eXBlb2YgKHBhcmVudC5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC5hcHBlbmQodGhpcy4kanEpO1xyXG4gIH1lbHNlIGlmKHR5cGVvZiAocGFyZW50LiRqcS5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC4kanEuYXBwZW5kKHRoaXMuJGpxKTtcclxuICB9ZWxzZXtcclxuICAgIGNvbnNvbGUubG9nKFwiYSBzbGlkZXIgY291bGRuJ3QgZmluZCBkb20gZWxlbWVudCB0byBhdHRhY2ggaGltc2VsZlwiKTtcclxuICB9XHJcbiAgdmFyIG1lPXRoaXM7XHJcbiAgdGhpcy5vbkNoYW5nZT1mdW5jdGlvbihjYWxsYmFjayl7XHJcbiAgICBtZS5vbkNoYW5nZUNhbGxiYWNrPWZ1bmN0aW9uKCl7Y2FsbGJhY2sobWUuZGF0YSl9O1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG4gIC8qKlxyXG4qIE15IG1ldGhvZCBkZXNjcmlwdGlvbi4gIExpa2Ugb3RoZXIgcGllY2VzIG9mIHlvdXIgY29tbWVudCBibG9ja3MsXHJcbiogdGhpcyBjYW4gc3BhbiBtdWx0aXBsZSBsaW5lcy5cclxuKlxyXG4qIEBtZXRob2QgbWV0aG9kTmFtZVxyXG4qIEBwYXJhbSB7U3RyaW5nfSBmb28gQXJndW1lbnQgMVxyXG4qIEBwYXJhbSB7T2JqZWN0fSBjb25maWcgQSBjb25maWcgb2JqZWN0XHJcbiogQHBhcmFtIHtTdHJpbmd9IGNvbmZpZy5uYW1lIFRoZSBuYW1lIG9uIHRoZSBjb25maWcgb2JqZWN0XHJcbiogQHBhcmFtIHtGdW5jdGlvbn0gY29uZmlnLmNhbGxiYWNrIEEgY2FsbGJhY2sgZnVuY3Rpb24gb24gdGhlIGNvbmZpZyBvYmplY3RcclxuKiBAcGFyYW0ge0Jvb2xlYW59IFtleHRyYT1mYWxzZV0gRG8gZXh0cmEsIG9wdGlvbmFsIHdvcmtcclxuKiBAcmV0dXJuIHtCb29sZWFufSBSZXR1cm5zIHRydWUgb24gc3VjY2Vzc1xyXG4qL1xyXG4gIHRoaXMuc2V0RGF0YT1mdW5jdGlvbih0byxlbWl0KXtcclxuICAgIGlmKGVtaXQ9PT10cnVlKXtcclxuICAgICAgLy9wZW5kYW50OiBpbiBzZXF1ZW5jZXJzIHdlIHVzZSBwYXJlbnQuaWQsIGFuZCBoZXJlIHdlIHVzZSBfYmluZE4uIFRvd2FyZHMgYSBjb250cm9sbGVyIEFQSSBhbmQgYSBtb3JlIHNlbnNpY2FsIGNvZGUsIEkgdGhpbmsgYm90aCBzaG91bGQgdXNlIHRoZSBiaW5kIGVsZW1lbnQgYXJyYXkuIHJlYWQgbm90ZSBpbiBmaXJzdCBsaW5lIG9mIHRoaXMgZmlsZS5cclxuICAgICAgLy9wZW5kYW50OiBwYXJlbnQgaW4gc2VxIGlzIHdoYXQgbWUgaXMgaGVyZS4gdGhpcyBpcyBwcmV0dHkgY29uZnVzaW5nIHZhciBuYW1lIGRlY2lzaW9uXHJcbiAgICAgIHN5bmNtYW4uZW1pdChcInNsaWQ6XCIrbWUuX2JpbmROK1wiXCIsXCJzVlwiLHRvKTtcclxuICAgIH1cclxuICAgIHRoaXMuZGF0YS52YWx1ZT10bztcclxuICAgIHRoaXMub25DaGFuZ2VDYWxsYmFjaygpO1xyXG4gICAgdGhpcy51cGRhdGVEb20oKTtcclxuICB9XHJcbiAgdGhpcy5hZGRDbGFzcz1mdW5jdGlvbih0byl7XHJcbiAgICB0aGlzLiRqcS5hZGRDbGFzcyh0byk7XHJcbiAgfVxyXG4gIHRoaXMudmVydGljYWw9b3B0aW9ucy52ZXJ0aWNhbHx8dHJ1ZTtcclxuICB0aGlzLmFkZENsYXNzKFwidmVydGljYWxcIik7XHJcbiAgdGhpcy4kanEub24oXCJtb3VzZWRvd24gdGFwIHRvdWNoc3RhcnRcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgaWYobWUudmVydGljYWwpe1xyXG4gICAgICBtZS5zZXREYXRhKDEtZXZlbnQub2Zmc2V0WS9tZS4kanEuaGVpZ2h0KCksdHJ1ZSk7Ly8sdHJ1ZVxyXG4gICAgfWVsc2V7XHJcbiAgICAgIG1lLnNldERhdGEoZXZlbnQub2Zmc2V0WC9tZS4kanEud2lkdGgoKSx0cnVlKTsvLyx0cnVlXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHRoaXMuJGpxLm9uKFwibW91c2Vtb3ZlIHRvdWNoZW50ZXIgbW91c2VsZWF2ZSBtb3VzZXVwXCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgaWYobW91c2UuYnV0dG9uRG93bil7XHJcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgIHZhciBlbWl0VGhpcz1ldmVudC50eXBlPT1cIm1vdXNlbGVhdmVcInx8ZXZlbnQudHlwZT09XCJtb3VzZXVwXCJcclxuICAgICAgaWYobWUudmVydGljYWwpe1xyXG4gICAgICAgIC8vdGhlIHN0cmFuZ2Ugc2Vjb25kIHBhcmFtZW50ZXIgaW4gc2V0ZGF0YSB3YXMgdHJ1ZSwgYnV0IGl0IGNvdWxkIGNsb2cgdGhlIHNvY2tldFxyXG4gICAgICAgIG1lLnNldERhdGEoMS1ldmVudC5vZmZzZXRZL21lLiRqcS5oZWlnaHQoKSxlbWl0VGhpcyk7Ly8sdHJ1ZVxyXG4gICAgICB9ZWxzZXtcclxuICAgICAgICBtZS5zZXREYXRhKGV2ZW50Lm9mZnNldFgvbWUuJGpxLndpZHRoKCksZW1pdFRoaXMpOy8vLHRydWVcclxuICAgICAgfVxyXG4gICAgfWVsc2V7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgdGhpcy5ldmFsPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIganE9dGhpcy4kanE7XHJcbiAgICBqcS5hZGRDbGFzcyhcInR1cm5cIik7XHJcbiAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICBqcS5yZW1vdmVDbGFzcyhcInR1cm5cIik7XHJcbiAgICB9LDIwMCk7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhLnZhbHVlO1xyXG4gIH1cclxuICB0aGlzLnVwZGF0ZURvbT1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy52ZXJ0aWNhbCl7XHJcbiAgICAgIHRoaXMuJGZhZGVyanEuY3NzKHtib3R0b206MCx3aWR0aDpcIjEwMCVcIixoZWlnaHQ6dGhpcy5kYXRhLnZhbHVlKnRoaXMuJGpxLmhlaWdodCgpfSk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdGhpcy5sYWJlbGpxLmh0bWwodGhpcy5sYWJlbCk7XHJcbiAgICAgIHRoaXMuJGZhZGVyanEuY3NzKHtib3R0b206MCx3aWR0aDp0aGlzLmRhdGEudmFsdWUqdGhpcy4kanEud2lkdGgoKSxoZWlnaHQ6XCIxMDAlXCJ9KTtcclxuICAgIH1cclxuICB9XHJcbiAgdGhpcy5zZXREYXRhKDApO1xyXG59IiwibGV0IGVlbWl0ZXI9cmVxdWlyZSgnb25oYW5kbGVycycpO1xyXG52YXIgZ2xvYmFscztcclxudmFyIG1vdXNlO1xyXG5leHBvcnRzLmdldD1mdW5jdGlvbihnbG9iYWxzKXtcclxuICAvLyBzeW5jbWFuPWdsb2JhbHMuc3luY21hbjtcclxuICBtb3VzZT1nbG9iYWxzLm1vdXNlO1xyXG4gIHJldHVybiBjb21wb25lbnRCYXNlO1xyXG59XHJcbi8qKlxyXG4gKiBUaGUgYmFzZSBvZiBjb21wb25lbnRzLlxyXG4gKiBJdCBjb250YWlucyB0aGUgZnVuY3Rpb24gdGhhdCBhcmUgc2hhcmVkIGFtb25nIGFsbCBNc0NvbXBvbmVudHMuIE1ha2VzIGxpdHRsZSBzZW5zZSB0byB1c2UgdGhpcyBhbG9uZVxyXG4gKlxyXG4gKiBAY2xhc3MgY29tcG9uZW50QmFzZVxyXG4gKiBAY29uc3RydWN0b3IgbmV3IE1zQ29tcG9uZW50cy5jb21wb25lbnRCYXNlKERPTS9KcXVlcnkgZWxlbWVudCx7cHJvcGVydGllc30pXHJcbiAqXHJcbiAqIEBwcm9wZXJ0eSBwYXJlbnRcclxuICogQHR5cGUgSnF1ZXJ5IC8gRG9tIGVsZW1lbnQgLyBjb21wb25lbnRCYXNlXHJcbiAqIEBwcm9wZXJ0eSBvcHRpb25zXHJcbiAqIEB0eXBlIG9iamVjdFxyXG4gKi9cclxuZnVuY3Rpb24gY29tcG9uZW50QmFzZShwYXJlbnQsb3B0aW9ucyl7XHJcbiAgZWVtaXRlci5jYWxsKHRoaXMpO1xyXG4gIHRoaXMub3B0aW9ucz1vcHRpb25zO1xyXG4gIHZhciB0aGlzQ29tcG9uZW50PXRoaXM7XHJcbiAgaWYoIXRoaXMubmFtZSl7XHJcbiAgICB0aGlzLm5hbWU9XCJjb21wb25lbnRcIjtcclxuICB9XHJcbiAgdGhpcy4kanE9JCgnPGRpdiBjbGFzcz1cIm1zLScrdGhpcy5uYW1lKydcIj48L2Rpdj4nKTtcclxuICBpZihvcHRpb25zLmNzcylcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgdGhpcy5jc3M9ZnVuY3Rpb24oY3NzKXtcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgaWYodHlwZW9mIChwYXJlbnQuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgICBwYXJlbnQuYXBwZW5kKHRoaXMuJGpxKTtcclxuICB9ZWxzZSBpZih0eXBlb2YgKHBhcmVudC4kanEuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgICBwYXJlbnQuJGpxLmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgfWVsc2V7XHJcbiAgICBjb25zb2xlLmxvZyhcImEgc2xpZGVyIGNvdWxkbid0IGZpbmQgZG9tIGVsZW1lbnQgdG8gYXR0YWNoIGhpbXNlbGZcIik7XHJcbiAgfVxyXG4gIC8qKlxyXG4gICogQHByb3BlcnR5IG1vdXNlQWN0aXZhdGlvbk1vZGVcclxuICAqIEB0eXBlIFN0cmluZ1xyXG4gICogZHJhZ0FsbDogdGhlIGJ1dHRvbnMgd2lsbCBhY3RpdmF0ZSB0aHJvdWdoIGFsbCB0aGUgdHJhamVjdG9yeSBvZiB0aGUgbW91c2Ugd2hpbGUgcHJlc3NlZFxyXG4gICogb25lQnlPbmU6IG9uZSBjbGljaz1vbmUgYnV0dG9uIHByZXNzXHJcbiAgKiBkcmFnTGFzdDogdGhlIG1vdXNlIGNhbiBiZSB0cmFnZ2VkIGFuZCB3aWxsIGFjdGl2YWUgYW5kIGhvdmVyIG9ubHkgdGhlIGxhc3QgYnV0dG9uIHRoYXQgaXQgZW50ZXJlZFxyXG4gICogaG92ZXI6IHRoZSBidXR0aW5zIGFyZSBhY3RpdmF0ZWQgdXBvbiBob3ZlciByZWdhcmRsZXNzIG9mIHdoZXRoZXIgaXMgY2xpY2tlZCBvciBub3RcclxuICAqL1xyXG4gIGlmKCFvcHRpb25zLm1vdXNlQWN0aXZhdGlvbk1vZGUpe1xyXG4gICAgb3B0aW9ucy5tb3VzZUFjdGl2YXRpb25Nb2RlPVwiZHJhZ0FsbFwiO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gbW91c2VBY3RpdmF0ZShldmVudCl7XHJcbiAgICB0aGlzQ29tcG9uZW50LmhhbmRsZShcIm9uTW91c2VTdGFydFwiKTtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB0aGlzQ29tcG9uZW50LmFkZENsYXNzKFwiYWN0aXZlXCIpO1xyXG4gIH1cclxuICBmdW5jdGlvbiBtb3VzZURlYWN0aXZhdGUoZXZlbnQpe1xyXG4gICAgdGhpc0NvbXBvbmVudC5oYW5kbGUoXCJvbk1vdXNlRW5kXCIpO1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIHRoaXNDb21wb25lbnQucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIik7XHJcbiAgfVxyXG5cclxuICAvL3RvIGF2b2lkIGlmIGNoYWlucyB0aGF0IGFyZSBhIHBhaW4gdG8gY2hhbmdlXHJcbiAgZnVuY3Rpb24gYUlzSW5CKGEsYil7XHJcbiAgICBmb3IgKHZhciBjIGluIGIpe1xyXG4gICAgICBpZihhPT1iW2NdKXtjb25zb2xlLmxvZyhcInRydWVcIik7cmV0dXJuIHRydWU7fVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH07XHJcblxyXG4gIHRoaXMuJGpxLm9uKFwibW91c2Vkb3duIHRhcCB0b3VjaHN0YXJ0XCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgLy9jaGVjayB0aGF0IHVwb24gdGhlIGN1cnJlbnQgZXZlbnQsIGEgbW91c2VBY3RpdmF0ZSBzaG91bGQgYmUgdHJpZ2dlcmVkLlxyXG4gICAgaWYoYUlzSW5CKG9wdGlvbnMubW91c2VBY3RpdmF0aW9uTW9kZSxbXCJkcmFnQWxsXCIsXCJvbmVCeU9uZVwiLFwiZHJhZ0xhc3RcIl0pKXtcclxuICAgICAgbW91c2VBY3RpdmF0ZShldmVudCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHRoaXMuJGpxLm9uKFwibW91c2VlbnRlclwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIGlmKG1vdXNlLmJ1dHRvbkRvd24pe1xyXG4gICAgICBpZihhSXNJbkIob3B0aW9ucy5tb3VzZUFjdGl2YXRpb25Nb2RlLFtcImRyYWdBbGxcIixcImRyYWdMYXN0XCJdKSl7XHJcbiAgICAgICAgbW91c2VBY3RpdmF0ZShldmVudCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGlmKG9wdGlvbnMubW91c2VBY3RpdmF0aW9uTW9kZT09XCJob3ZlclwiKXtcclxuICAgICAgbW91c2VBY3RpdmF0ZShldmVudCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgdGhpcy4kanEub24oXCJtb3VzZXVwXCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgaWYoYUlzSW5CKG9wdGlvbnMubW91c2VBY3RpdmF0aW9uTW9kZSxbXCJkcmFnQWxsXCIsXCJvbmVCeU9uZVwiLFwiZHJhZ0xhc3RcIl0pKXtcclxuICAgICAgbW91c2VEZWFjdGl2YXRlKGV2ZW50KTtcclxuICAgIH1cclxuICB9KTtcclxuICB0aGlzLiRqcS5vbihcIm1vdXNlb3V0XCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgaWYoYUlzSW5CKG9wdGlvbnMubW91c2VBY3RpdmF0aW9uTW9kZSxbXCJob3ZlclwiLFwib25lQnlPbmVcIixcImRyYWdMYXN0XCJdKSl7XHJcbiAgICAgIG1vdXNlRGVhY3RpdmF0ZShldmVudCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG5cclxuICB0aGlzLnVwZGF0ZURvbT1mdW5jdGlvbigpe1xyXG4gICAgdGhpc0NvbXBvbmVudC4kanEuaHRtbCh0aGlzLmxhYmVsKTtcclxuICB9XHJcbiAgLy9hbGlhc2luZyBvZiB0aGVzZSB0d28gaGFuZHkgZnVuY3Rpb25cclxuICB0aGlzLmFkZENsYXNzPWZ1bmN0aW9uKHRvKXtcclxuICAgIHRoaXNDb21wb25lbnQuJGpxLmFkZENsYXNzKHRvKTtcclxuICB9XHJcbiAgdGhpcy5yZW1vdmVDbGFzcz1mdW5jdGlvbih0byl7XHJcbiAgICB0aGlzQ29tcG9uZW50LiRqcS5yZW1vdmVDbGFzcyh0byk7XHJcbiAgfVxyXG59IiwiLy8gdmFyIHN5bmNtYW49e307XHJcbnZhciBnbG9iYWxzPXt9O1xyXG5nbG9iYWxzLnN5bmNtYW49cmVxdWlyZSgnLi9zeW5jbWFuLmpzJykuZW5hYmxlKCk7XHJcbmdsb2JhbHMubW91c2U9cmVxdWlyZSgnLi9tb3VzZS5qcycpLmVuYWJsZSgpO1xyXG52YXIgU2xpZGVyPXJlcXVpcmUoJy4vU2xpZGVyLmpzJykuZW5hYmxlKGdsb2JhbHMpO1xyXG52YXIgU2VxdWVuY2VyPXJlcXVpcmUoJy4vU2VxdWVuY2VyLmpzJykuZW5hYmxlKGdsb2JhbHMpO1xyXG52YXIgQnV0dG9uPXJlcXVpcmUoJy4vQnV0dG9uLmpzJykuZW5hYmxlKGdsb2JhbHMpO1xyXG52YXIgQ2xvY2s9cmVxdWlyZSgnLi9DbG9jay5qcycpLmVuYWJsZShnbG9iYWxzKTtcclxudmFyIE1zQ29tcG9uZW50cz17XHJcbiAgU2xpZGVyOlNsaWRlcixcclxuICBTZXF1ZW5jZXI6U2VxdWVuY2VyLFxyXG4gIEJ1dHRvbjpCdXR0b24sXHJcbiAgQ2xvY2s6Q2xvY2ssXHJcbiAgY3JlYXRlOmZ1bmN0aW9uKHdoYXQsb3B0aW9ucyx3aGVyZSl7XHJcbiAgICBpZighd2hlcmUpXHJcbiAgICAgIHdoZXJlPSQoXCJib2R5XCIpO1xyXG4gICAgcmV0dXJuIG5ldyB0aGlzW3doYXRdKHdoZXJlLG9wdGlvbnMpO1xyXG4gIH0sXHJcbn07XHJcbndpbmRvdy5Nc0NvbXBvbmVudHM9TXNDb21wb25lbnRzO1xyXG5jb25zb2xlLmxvZyhNc0NvbXBvbmVudHMpOyIsImV4cG9ydHMuZW5hYmxlPWZ1bmN0aW9uKCl7XHJcblxyXG4gICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XHJcbiAgICAkKGRvY3VtZW50KS5vbihcIm1vdXNlZG93biB0b3VjaHN0YXJ0IHRvdWNobW92ZVwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgbW91c2UuYnV0dG9uRG93bj10cnVlO1xyXG4gICAgICAvLyBjb25zb2xlLmxvZyhldmVudCk7XHJcbiAgICB9KTtcclxuICAgICQoZG9jdW1lbnQpLm9uKFwibW91c2V1cCB0b3VjaGVuZFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgbW91c2UuYnV0dG9uRG93bj1mYWxzZTtcclxuICAgIH0pO1xyXG4gICAgLy8gZG9jdW1lbnQub250b3VjaG1vdmUgPSBmdW5jdGlvbihldmVudCl7XHJcbiAgICAvLyAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAvLyB9XHJcbiAgfSk7XHJcbiAgXHJcbiAgcmV0dXJuIG1vdXNlO1xyXG59XHJcbnZhciBtb3VzZT17XHJcbiAgdG9vbDpcImRyYXdcIlxyXG59O1xyXG5cclxuXHJcbiIsIi8qXHJcblRoaXMgc2NyaXB0IGNvbnRhaW5zIGEgdGVtcGxhdGUgZm9yIGRhdGEtYmluZGluZyBtYW5hZ2VtZW50IGlmIHlvdSB3YW50IHRvIGRvIHNvLiBPdGhlcndpc2UsIGl0IHdpbGwganVzdCBwbGFjZWhvbGQgdmFyIG5hbWVzIHNvIHRoZXJlIGFyZSBubyB1bmRlZmluZWQgdmFycy5cclxuICAgIENvcHlyaWdodCAoQykgMjAxNiBKb2FxdcOtbiBBbGR1bmF0ZVxyXG5cclxuICAgIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbiAgICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG4gICAgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuICAgIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG4gICAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbiAgICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG4gICAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG4gICAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbiAgICBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG4gICAgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG5leHBvcnRzLmVuYWJsZT1mdW5jdGlvbigpe1xyXG4gIHJldHVybiBuZXcgU3luY21hbigpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gU3luY21hbigpe1xyXG4gIC8vbGlzdCBvZiBhbGwgdGhlIGl0ZW1zIHRoYXQgdXNlIGRhdGEgYmluZGluZ1xyXG4gIHRoaXMuYmluZExpc3Q9W107XHJcbiAgLy9ob3cgYXJlIHlvdSBlbWl0dGluZyBjaGFuZ2VzPyBpdCBkZXBlbmRzIG9uIHRoZSBzZXJ2ZXIgeW91IHVzZS5cclxuICB0aGlzLmVtaXQ9ZnVuY3Rpb24oKXt9XHJcbn1cclxuIl19