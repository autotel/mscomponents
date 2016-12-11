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
"use strict";

var syncman, mouse;
var OH = require("onhandlers");
exports.enable = function (globals) {
  syncman = globals.syncman;
  mouse = globals.mouse;
  return Clock;
};
function Clock(parent, options) {
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
  var thisSequencer = this;
  this.name = "sequencer";
  componentBase.call(this, parent, options);
  // this.$jq=$('<div class="sequencer" id="seq_'+n+'"><p style="position:absolute"></p></div>');
  parent.append(this.$jq);
  this.alive = false;
  this._bindN = syncman.bindList.push(this) - 1;
  this.pos = 0;
  this.data = [];
  //set length or interval to options or default
  this.len = options.len | Math.pow(2, seqProg % 5 + 1);
  this.evry = options.evry | Math.pow(2, seqProg % 4 + 1);
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
    //  console.log(this.aliveChild);
    if (this.alive) {
      //  console.log("sete");
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
          //  var loopStart=this.channel.startOffset;
          //  var loopEnd=this.channel.endTime;
          //  this.channel.sampler.triggerAttack(false,0,1,{start:loopStart,end:loopEnd});
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvb25oYW5kbGVycy9vbi5qcyIsInNyY1xcQnV0dG9uLmpzIiwic3JjXFxDbG9jay5qcyIsInNyY1xcU2VxdWVuY2VyLmpzIiwic3JjXFxTbGlkZXIuanMiLCJzcmNcXGNvbXBvbmVudEJhc2UuanMiLCJzcmNcXGluZGV4LmpzIiwic3JjXFxtb3VzZS5qcyIsInNyY1xcc3luY21hbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVDQSxJQUFJLGdCQUFjLFFBQVEsaUJBQVIsQ0FBbEI7QUFDQSxJQUFJLE9BQUosRUFBWSxLQUFaO0FBQ0EsUUFBUSxNQUFSLEdBQWUsVUFBUyxPQUFULEVBQWlCO0FBQzlCLFlBQVEsUUFBUSxPQUFoQjtBQUNBLFVBQU0sUUFBUSxLQUFkO0FBQ0Esa0JBQWMsY0FBYyxHQUFkLENBQWtCLEVBQUMsU0FBUSxPQUFULEVBQWlCLE9BQU0sS0FBdkIsRUFBbEIsQ0FBZDtBQUNBLFNBQU8sTUFBUDtBQUNELENBTEQ7QUFNQSxTQUFTLE1BQVQsQ0FBZ0IsTUFBaEIsRUFBdUIsT0FBdkIsRUFBK0I7QUFDN0IsT0FBSyxJQUFMLEdBQVUsUUFBVjtBQUNBLGdCQUFjLElBQWQsQ0FBbUIsSUFBbkIsRUFBd0IsTUFBeEIsRUFBK0IsT0FBL0I7QUFDQTtBQUNBO0FBQ0E7QUFD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O0FBYUEsU0FBTyxLQUFQO0FBQ0QsQ0FoQkQ7QUFpQkEsSUFBSSxRQUFNO0FBQ1IsUUFBSztBQURHLENBQVY7Ozs7O0FDakJBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkEsUUFBUSxNQUFSLEdBQWUsWUFBVTtBQUN2QixXQUFPLElBQUksT0FBSixFQUFQO0FBQ0QsQ0FGRDs7QUFJQSxTQUFTLE9BQVQsR0FBa0I7QUFDaEI7QUFDQSxTQUFLLFFBQUwsR0FBYyxFQUFkO0FBQ0E7QUFDQSxTQUFLLElBQUwsR0FBVSxZQUFVLENBQUUsQ0FBdEI7QUFDRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxyXG55b3UgbWFrZSB0aGUgb25IYW5kbGVycy5jYWxsKHRoaXMpIGluIHRoZSBvYmplY3QgdGhhdCBuZWVkcyB0byBoYXZlIGhhbmRsZXJzLlxyXG50aGVuIHlvdSBjYW4gY3JlYXRlIGEgZnVuY3Rpb24gY2FsbGJhY2sgZm9yIHRoYXQgb2JqZWN0IHVzaW5nIG9iamVjdC5vbihcImhhbmRsZXJOYW1lLm9wdGlvbmFsTmFtZVwiLGNhbGxiYWNrRnVuY3Rpb24oKXt9KTtcclxudGhlIG9iamVjdCBjYW4gcnVuIHRoZSBoYW5kbGUgY2FsbGJhY2tzIGJ5IHVzaW5nIHRoaXMuaGFuZGxlKFwiaGFuZGxlck5hbWVcIixwYXJhbWV0ZXJzVG9GZWVkKTtcclxuKi9cclxubW9kdWxlLmV4cG9ydHM9ZnVuY3Rpb24oKSB7XHJcbiAgdmFyIGV2ZW50VmVyYm9zZT1mYWxzZTtcclxuICBpZiAoIXRoaXMub25zKSB7XHJcbiAgICB0aGlzLm9ucyA9IFtdO1xyXG4gIH1cclxuICB0aGlzLm9uID0gZnVuY3Rpb24obmFtZSwgY2FsbGJhY2spIHtcclxuICAgIHZhciBuYW1lID0gbmFtZS5zcGxpdChcIi5cIik7XHJcbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIGlmIChuYW1lLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgdGhyb3cgKFwic29ycnksIHlvdSBnYXZlIGFuIGludmFsaWQgZXZlbnQgbmFtZVwiKTtcclxuICAgICAgfSBlbHNlIGlmIChuYW1lLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBpZiAoIXRoaXMub25zW25hbWVbMF1dKSB0aGlzLm9uc1tuYW1lWzBdXSA9IFtdO1xyXG4gICAgICAgIHRoaXMub25zW25hbWVbMF1dLnB1c2goW2ZhbHNlLCBjYWxsYmFja10pO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMub25zKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IChcImVycm9yIGF0IG1vdXNlLm9uLCBwcm92aWRlZCBjYWxsYmFjayB0aGF0IGlzIG5vdCBhIGZ1bmN0aW9uXCIpO1xyXG4gICAgfVxyXG4gIH1cclxuICB0aGlzLm9mZiA9IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgIHZhciBuYW1lID0gbmFtZS5zcGxpdChcIi5cIik7XHJcbiAgICBpZiAobmFtZS5sZW5ndGggPiAxKSB7XHJcbiAgICAgIGlmICghdGhpcy5vbnNbbmFtZVswXV0pIHRoaXMub25zW25hbWVbMF1dID0gW107XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKFwicHJldlwiLHRoaXMub25zW25hbWVbMF1dKTtcclxuICAgICAgdGhpcy5vbnNbbmFtZVswXV0uc3BsaWNlKHRoaXMub25zW25hbWVbMF1dLmluZGV4T2YobmFtZVsxXSksIDEpO1xyXG4gICAgICAvLyBjb25zb2xlLmxvZyhcInRoZW5cIix0aGlzLm9uc1tuYW1lWzBdXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyAoXCJzb3JyeSwgeW91IGdhdmUgYW4gaW52YWxpZCBldmVudCBuYW1lXCIgKyBuYW1lKTtcclxuICAgIH1cclxuICB9XHJcbiAgdGhpcy5oYW5kbGUgPSBmdW5jdGlvbihmbmFtZSwgcGFyYW1zKSB7XHJcbiAgICBpZihldmVudFZlcmJvc2UpIGNvbnNvbGUubG9nKFwiRXZlbnQgXCIrZm5hbWUrXCI6XCIse2NhbGxlcjp0aGlzLHBhcmFtczpwYXJhbXN9KTtcclxuICAgIGlmICh0aGlzLm9uc1tmbmFtZV0pIHtcclxuICAgICAgZm9yICh2YXIgbiBpbiB0aGlzLm9uc1tmbmFtZV0pIHtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLm9uc1tmbmFtZV1bbl1bMV0pO1xyXG4gICAgICAgIHRoaXMub25zW2ZuYW1lXVtuXVsxXShwYXJhbXMpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59OyIsInZhciBjb21wb25lbnRCYXNlPXJlcXVpcmUoJy4vY29tcG9uZW50QmFzZScpO1xyXG52YXIgc3luY21hbixtb3VzZTtcclxuZXhwb3J0cy5lbmFibGU9ZnVuY3Rpb24oZ2xvYmFscyl7XHJcbiAgc3luY21hbj1nbG9iYWxzLnN5bmNtYW47XHJcbiAgbW91c2U9Z2xvYmFscy5tb3VzZTtcclxuICBjb21wb25lbnRCYXNlPWNvbXBvbmVudEJhc2UuZ2V0KHtzeW5jbWFuOnN5bmNtYW4sbW91c2U6bW91c2V9KTtcclxuICByZXR1cm4gQnV0dG9uO1xyXG59XHJcbmZ1bmN0aW9uIEJ1dHRvbihwYXJlbnQsb3B0aW9ucyl7XHJcbiAgdGhpcy5uYW1lPVwiYnV0dG9uXCI7XHJcbiAgY29tcG9uZW50QmFzZS5jYWxsKHRoaXMscGFyZW50LG9wdGlvbnMpO1xyXG4gIC8vbXkgcmVmZXJlbmNlIG51bWJlciBmb3IgZGF0YSBiaW5kaW5nLiBXaXRoIHRoaXMgbnVtYmVyIHRoZSBzb2NrZXQgYmluZGVyIGtub3dzIHdobyBpcyB0aGUgcmVjaWV2ZXIgb2YgdGhlIGRhdGEsIGFuZCBhbHNvIHdpdGggd2hhdCBuYW1lIHRvIHNlbmQgaXRcclxuICAvL3BlbmRhbnQ6IHRoaXMgY2FuIHBvdGVudGlhbGx5IGNyZWF0ZSBhIHByb2JsZW0sIGJlY2F1c2UgdHdvIG9iamVjdHMgY2FuIGJlIGNyZWF0ZWQgc2ltdWx0YW5lb3VzbHkgYXQgZGlmZmVyZW50IGVuZHMgYXQgdGhlIHNhbWUgdGltZS5cclxuICAvL21heWJlIGluc3RlYWQgb2YgdGhlIHNpbXBsZSBwdXNoLCB0aGVyZSBjb3VsZCBiZSBhIGNhbGxiYWNrLCBhZG4gdGhlIG9iamVjdCB3YWl0cyB0byByZWNlaXZlIGl0J3Mgc29ja2V0IGlkIG9uY2UgaXRzIGNyZWF0aW9uIHdhcyBwcm9wYWdhdGVkIHRocm91Z2hvdXQgYWxsIHRoZSBuZXR3b3JrLCBvciBtYXliZSB0aGVyZSBpcyBhbiBhcnJheSBmb3Igc2VudGluZyBhbmQgb3RoZXIgZGlmZmVyZW50IGZvciByZWNlaXZpbmcuLi4gZmlyc3Qgb3B0aW9uIHNlZW1zIG1vcmUgc2Vuc2libGVcclxuICB0aGlzLmRhdGE9e3ZhbHVlOjB9O1xyXG4gIHRoaXMuc3RhdGVzPWZhbHNlO1xyXG4gIHRoaXMuX2JpbmROPXN5bmNtYW4uYmluZExpc3QucHVzaCh0aGlzKS0xO1xyXG4gIC8vdGhpcy4kanE9JCgnPGRpdiBjbGFzcz1cIm1zLWJ1dHRvblwiPjwvZGl2PicpO1xyXG4gIHRoaXMubGFiZWw9b3B0aW9ucy5sYWJlbHx8XCLimLtcIjtcclxuICB0aGlzLiRqcS5hcHBlbmQodGhpcy4kZmFkZXJqcSk7XHJcbiAgdGhpcy4kanEuaHRtbCh0aGlzLmxhYmVsKTtcclxuICAvLyBpZihvcHRpb25zLmNzcylcclxuICAvLyAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgLy8gdGhpcy5jc3M9ZnVuY3Rpb24oY3NzKXtcclxuICAvLyAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgLy8gICByZXR1cm4gdGhpcztcclxuICAvLyB9XHJcbiAgLy9pZiBhIHN3aXRjaCB2YXJpYWJsZSBpcyBwYXNzZWQsIHRoaXMgYnV0dG9uIHdpbGwgc3dpdGNoIG9uIGVhY2ggY2xpY2sgYW1vbmcgdGhlIHN0YXRlZCBzdGF0ZXNcclxuICBpZihvcHRpb25zLmhhc093blByb3BlcnR5KFwic3dpdGNoXCIpKXtcclxuICAgIHRoaXMuc3RhdGVzPVtdO1xyXG4gICAgdGhpcy5kYXRhLmN1cnJlbnRTdGF0ZT0wO1xyXG4gICAgdGhpcy5zdGF0ZXM9b3B0aW9ucy5zd2l0Y2g7XHJcbiAgICB0aGlzLnN3aXRjaFN0YXRlKDApO1xyXG4gIH1cclxuICB0aGlzLm9uQ2xpY2tDYWxsYmFjaz1mdW5jdGlvbigpe307XHJcbiAgdGhpcy5vblJlbGVhc2VDYWxsYmFjaz1mdW5jdGlvbigpe307XHJcbiAgLy9wZW5kYW50OiB0aGlzIHNob3VsZCBiZSBwYXJ0IG9mIGEgYmFzZSBwcm90b3R5cGUsIG5vdCByZXBlYXRlZCBpbiBlYWNoIHR5cGVcclxuICAvLyBpZih0eXBlb2YgKHBhcmVudC5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAvLyAgIHBhcmVudC5hcHBlbmQodGhpcy4kanEpO1xyXG4gIC8vIH1lbHNlIGlmKHR5cGVvZiAocGFyZW50LiRqcS5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAvLyAgIHBhcmVudC4kanEuYXBwZW5kKHRoaXMuJGpxKTtcclxuICAvLyB9ZWxzZXtcclxuICAvLyAgIGNvbnNvbGUubG9nKFwiYSBzbGlkZXIgY291bGRuJ3QgZmluZCBkb20gZWxlbWVudCB0byBhdHRhY2ggaGltc2VsZlwiKTtcclxuICAvLyB9XHJcbiAgdmFyIG1lPXRoaXM7XHJcbiAgLy8gdGhpcy5vbkNoYW5nZT1mdW5jdGlvbihjYWxsYmFjayl7XHJcbiAgLy8gICBtZS5vbkNsaWNrQ2FsbGJhY2s9ZnVuY3Rpb24oKXtjYWxsYmFjayhtZS5kYXRhKX07XHJcbiAgLy8gICByZXR1cm4gdGhpcztcclxuICAvLyB9XHJcblxyXG4gIHRoaXMuJGpxLm9uKFwibW91c2Vkb3duIHRhcCB0b3VjaHN0YXJ0XCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgbWUub25DbGlja0NhbGxiYWNrKG1lLmRhdGEpO1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIG1lLnN3aXRjaFN0YXRlKCk7XHJcbiAgICBtZS5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcclxuICB9KTtcclxuICB0aGlzLiRqcS5vbihcIm1vdXNldXAgbW91c2VsZWF2ZVwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIG1lLm9uUmVsZWFzZUNhbGxiYWNrKG1lLmRhdGEpO1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIG1lLnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5cclxuQnV0dG9uLnByb3RvdHlwZS5vbkNsaWNrPWZ1bmN0aW9uKGNhbGxiYWNrKXtcclxuICB0aGlzLm9uQ2xpY2tDYWxsYmFjaz1jYWxsYmFjaztcclxuICByZXR1cm4gdGhpcztcclxufVxyXG5CdXR0b24ucHJvdG90eXBlLm9uUmVsZWFzZT1mdW5jdGlvbihjYWxsYmFjayl7XHJcbiAgdGhpcy5vblJlbGVhc2VDYWxsYmFjaz1jYWxsYmFjaztcclxuICByZXR1cm4gdGhpcztcclxufVxyXG5CdXR0b24ucHJvdG90eXBlLnN3aXRjaFN0YXRlPWZ1bmN0aW9uKHRvKXtcclxuICBpZih0aGlzLnN0YXRlcyl7XHJcbiAgICAvL2NoYW5nZSBzdGF0ZSBudW1iZXIgdG8gbmV4dFxyXG4gICAgaWYodG8pe1xyXG4gICAgICB0aGlzLmRhdGEuY3VycmVudFN0YXRlPXRvJXRoaXMuc3RhdGVzLmxlbmd0aDtcclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLmRhdGEuY3VycmVudFN0YXRlPSh0aGlzLmRhdGEuY3VycmVudFN0YXRlKzEpJXRoaXMuc3RhdGVzLmxlbmd0aDtcclxuICAgIH1cclxuICAgIC8vYXBwbHkgYWxsIHRoZSBwcm9wZXJ0aWVzIHRoYXQgdGhlIHN0YXRlIGNhcnJ5LiBUaGlzIG1ha2VzIHRoZSBidXR0b24gc3VwZXIgaGFja2FibGVcclxuICAgIGZvcihhIGluIHRoaXMuc3RhdGVzW3RoaXMuZGF0YS5jdXJyZW50U3RhdGVdKXtcclxuICAgICAgdGhpc1thXT10aGlzLnN0YXRlc1t0aGlzLmRhdGEuY3VycmVudFN0YXRlXVthXTtcclxuICAgICAgLy8gY29uc29sZS5sb2coXCJbXCIrYStcIl1cIix0aGlzW2FdKTtcclxuICAgIH1cclxuICB9XHJcbiAgdGhpcy51cGRhdGVEb20oKTtcclxufVxyXG4iLCJcclxudmFyIHN5bmNtYW4sbW91c2U7XHJcbnZhciBPSD1yZXF1aXJlKFwib25oYW5kbGVyc1wiKTtcclxuZXhwb3J0cy5lbmFibGU9ZnVuY3Rpb24oZ2xvYmFscyl7XHJcbiAgc3luY21hbj1nbG9iYWxzLnN5bmNtYW47XHJcbiAgbW91c2U9Z2xvYmFscy5tb3VzZTtcclxuICByZXR1cm4gQ2xvY2s7XHJcbn07XHJcbmZ1bmN0aW9uIENsb2NrKHBhcmVudCxvcHRpb25zKXtcclxuICB0aGlzLm5hbWU9XCJjbG9ja1wiO1xyXG4gIE9ILmNhbGwodGhpcyk7XHJcbiAgdmFyIHRoaXNDbG9jaz10aGlzO1xyXG4gIHRoaXMuZGF0YT17dmFsdWU6MH07XHJcbiAgdGhpcy5zdGF0ZXM9ZmFsc2U7XHJcbiAgdGhpcy5fYmluZE49c3luY21hbi5iaW5kTGlzdC5wdXNoKHRoaXMpLTE7XHJcbiAgdGhpcy4kanE9JCgnPGRpdiBjbGFzcz1cIm1zLWNsb2NrIG1zLWJ1dHRvblwiPjwvZGl2PicpO1xyXG4gIHRoaXMubGFiZWw9b3B0aW9ucy5sYWJlbHx8J+KIhic7XHJcbiAgdGhpcy4kanEuYXBwZW5kKHRoaXMuJGZhZGVyanEpO1xyXG4gIHRoaXMuJGpxLmh0bWwodGhpcy5sYWJlbCk7XHJcbiAgaWYob3B0aW9ucy5jc3MpXHJcbiAgICB0aGlzLiRqcS5jc3Mob3B0aW9ucy5jc3MpO1xyXG4gIHRoaXMuY3NzPWZ1bmN0aW9uKGNzcyl7XHJcbiAgICB0aGlzLiRqcS5jc3Mob3B0aW9ucy5jc3MpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG4gIC8vcGVuZGFudDogdGhpcyBzaG91bGQgYmUgcGFydCBvZiBhIGJhc2UgcHJvdG90eXBlLCBub3QgcmVwZWF0ZWQgaW4gZWFjaCB0eXBlXHJcbiAgaWYodHlwZW9mIChwYXJlbnQuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgICBwYXJlbnQuYXBwZW5kKHRoaXMuJGpxKTtcclxuICB9ZWxzZSBpZih0eXBlb2YgKHBhcmVudC4kanEuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgICBwYXJlbnQuJGpxLmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgfWVsc2V7XHJcbiAgICBjb25zb2xlLmxvZyhcImEgY2xvY2sgY291bGRuJ3QgZmluZCBkb20gZWxlbWVudCB0byBhdHRhY2ggaGltc2VsZlwiKTtcclxuICB9XHJcbiAgdmFyIG1lPXRoaXM7XHJcbiAgdGhpcy50aWNrPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzQ2xvY2suaGFuZGxlKFwidGlja1wiKTtcclxuICAgIHRoaXNDbG9jay5hZGRDbGFzcyhcInRpY2tcIik7XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7dGhpc0Nsb2NrLnJlbW92ZUNsYXNzKFwidGlja1wiKTt9LDIwKTtcclxuICB9XHJcbiAgc2V0SW50ZXJ2YWwodGhpcy50aWNrLG9wdGlvbnMuaW50ZXJ2YWx8NTAwKTtcclxufVxyXG5cclxuQ2xvY2sucHJvdG90eXBlLnVwZGF0ZURvbT1mdW5jdGlvbigpe1xyXG4gIHRoaXMuJGpxLmh0bWwodGhpcy5sYWJlbCk7XHJcbn1cclxuXHJcblxyXG5cclxuLy9hbGlhc2luZyBvZiB0aGVzZSB0d28gaGFuZHkgZnVuY3Rpb25cclxuQ2xvY2sucHJvdG90eXBlLmFkZENsYXNzPWZ1bmN0aW9uKHRvKXtcclxuICB0aGlzLiRqcS5hZGRDbGFzcyh0byk7XHJcbn1cclxuQ2xvY2sucHJvdG90eXBlLnJlbW92ZUNsYXNzPWZ1bmN0aW9uKHRvKXtcclxuICB0aGlzLiRqcS5yZW1vdmVDbGFzcyh0byk7XHJcbn0iLCJ2YXIgY29tcG9uZW50QmFzZT1yZXF1aXJlKCcuL2NvbXBvbmVudEJhc2UnKTtcclxubGV0IGVlbWl0ZXI9cmVxdWlyZSgnb25oYW5kbGVycycpO1xyXG52YXIgc3luY21hbixtb3VzZTtcclxuZXhwb3J0cy5lbmFibGU9ZnVuY3Rpb24oZ2xvYmFscyl7XHJcbiAgc3luY21hbj1nbG9iYWxzLnN5bmNtYW47XHJcbiAgbW91c2U9Z2xvYmFscy5tb3VzZTtcclxuICBjb21wb25lbnRCYXNlPWNvbXBvbmVudEJhc2UuZ2V0KHtzeW5jbWFuOnN5bmNtYW4sbW91c2U6bW91c2V9KTtcclxuICByZXR1cm4gU2VxdWVuY2VyO1xyXG59XHJcbi8qKlxyXG4gKiBBIGdlbmVyYXRvciBvZiBzZXF1ZW5jZXJzXHJcbiAqXHJcbiAqIEBjbGFzcyBTZXF1ZW5jZXJcclxuICogQGNvbnN0cnVjdG9yIG5ldyBNc0NvbXBvbmVudHMuU2VxdWVuY2VyKERPTS8kanF1ZXJ5IGVsZW1lbnQse3Byb3BlcnRpZXN9KVxyXG4gKi9cclxuIC8vZGVmaW5lcyBhbGwgdGhlIHNlcXVlbmNlciBwYXJhbWV0ZXJzIGJ5IG1hdGgsXHJcbiAvL21heWJlIGluIGEgZnVudHVyZSBieSBzdHlsaW5nIHRhYmxlXHJcbnZhciBzZXFQcm9nPTQ7XHJcbmZ1bmN0aW9uIFNlcXVlbmNlcihwYXJlbnQsb3B0aW9ucyl7XHJcbiB2YXIgbj1vcHRpb25zLm58fDM7XHJcbiB2YXIgdGhpc1NlcXVlbmNlcj10aGlzO1xyXG4gdGhpcy5uYW1lPVwic2VxdWVuY2VyXCJcclxuIGNvbXBvbmVudEJhc2UuY2FsbCh0aGlzLHBhcmVudCxvcHRpb25zKTtcclxuIC8vIHRoaXMuJGpxPSQoJzxkaXYgY2xhc3M9XCJzZXF1ZW5jZXJcIiBpZD1cInNlcV8nK24rJ1wiPjxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGVcIj48L3A+PC9kaXY+Jyk7XHJcbiBwYXJlbnQuYXBwZW5kKHRoaXMuJGpxKTtcclxuIHRoaXMuYWxpdmU9ZmFsc2U7XHJcbiB0aGlzLl9iaW5kTj1zeW5jbWFuLmJpbmRMaXN0LnB1c2godGhpcyktMTtcclxuIHRoaXMucG9zPTA7XHJcbiB0aGlzLmRhdGE9W107XHJcbiAvL3NldCBsZW5ndGggb3IgaW50ZXJ2YWwgdG8gb3B0aW9ucyBvciBkZWZhdWx0XHJcbiB0aGlzLmxlbj1vcHRpb25zLmxlbnxNYXRoLnBvdygyLChzZXFQcm9nJTUpKzEpO1xyXG4gdGhpcy5ldnJ5PW9wdGlvbnMuZXZyeXxNYXRoLnBvdygyLChzZXFQcm9nJTQpKzEpO1xyXG4gLy9tdXN0IGNvdW50IGFuIFtldmVyeV0gYW1vdW50IG9mIGJlYXRzIGZvciBlYWNoIHBvcyBpbmNyZW1lbnQuXHJcbiB0aGlzLnN1YnBvcz0wO1xyXG4gdGhpcy4kanEuY3NzKHt3aWR0aDoxNipNYXRoLmNlaWwodGhpcy5sZW4vNCkrXCJweFwifSk7XHJcbiAvL3RoaXMuJGpxLmFkZENsYXNzKFwiY29sb3JfXCIrc2VxUHJvZyVjaGFubmVscy5sZW5ndGgpO1xyXG4gdGhpcy5kaXNwPTA7XHJcbiB0aGlzLmlkPW47XHJcbiB0aGlzLmJlYXREaXNwbGFjZT0wO1xyXG4gdmFyIG1lPXRoaXM7XHJcbiBzZXFQcm9nKys7XHJcbiAvL3RoaXMuY2hhbm5lbD1jaGFubmVsc1t0aGlzLmlkJWNoYW5uZWxzLmxlbmd0aF07XHJcbiBmb3IodmFyIGJuPTA7IGJuPHRoaXMubGVuOyBibisrKXtcclxuICAgdGhpcy5kYXRhW2JuXT1uZXcgU2VxdWVuY2VyQnV0dG9uKGJuLHRoaXMpXHJcbiB9XHJcbiB0aGlzLmFsaXZlQ2hpbGQ9MDtcclxuIHRoaXMuZGlzcGxhY2U9MDtcclxuIHRoaXMuc2V0RGlzcGxhY2U9ZnVuY3Rpb24odG8sZW1pdCl7XHJcbiAgIGlmKGVtaXQ9PVwib25seVwiKXtcclxuICAgICBlbWl0PXRydWU7XHJcbiAgIH1lbHNle1xyXG4gICAgIHRoaXMuc3VicG9zPSgodHJhbnNwb3J0Q3VycmVudFN0ZXApJSh0aGlzLmxlbip0aGlzLmV2cnkpKSt0bztcclxuICAgfVxyXG4gICBpZihlbWl0PT10cnVlKXtcclxuICAgICBzb2NrQ2hhbmdlKFwic2VxOlwiK21lLl9iaW5kTitcIlwiLFwiZHNwbFwiLHRvKTtcclxuICAgfVxyXG4gfVxyXG4gdGhpcy5zdGVwPWZ1bmN0aW9uKCl7XHJcbiAgIHZhciBwcmV2YWxpdmU9dGhpcy5hbGl2ZTtcclxuICAgdGhpcy5hbGl2ZT10aGlzLmFsaXZlQ2hpbGQ+MDtcclxuICAvLyAgY29uc29sZS5sb2codGhpcy5hbGl2ZUNoaWxkKTtcclxuICAgaWYodGhpcy5hbGl2ZSl7XHJcbiAgICAvLyAgY29uc29sZS5sb2coXCJzZXRlXCIpO1xyXG4gICAgIC8vaWYgdGhlIHN0YXRlIG9mIHRoaXMuYWxpdmUgY2hhbmdlcywgd2UgbXVzdCBlbWl0IHRoZSBkaXNwbGFjZW1lbnQsIGJlY2F1c2UgaXQgaXMgbmV3XHJcbiAgICAgaWYoIXByZXZhbGl2ZSl7XHJcbiAgICAgICB0aGlzLmRpc3BsYWNlPSh0cmFuc3BvcnRDdXJyZW50U3RlcCt0aGlzLnN1YnBvcyklKHRoaXMubGVuKnRoaXMuZXZyeSk7XHJcbiAgICAgICBjb25zb2xlLmxvZyhcIm9rLiBlbWl0IGRpc3BsYWU6IFwiK3RoaXMuZGlzcGxhY2UpO1xyXG4gICAgICAgdGhpcy5zZXREaXNwbGFjZSh0aGlzLmRpc3BsYWNlLFwib25seVwiKTtcclxuICAgICB9O1xyXG4gICAgIC8vZWFjaCBzZXF1ZW5jZXIgaGFzIGEgZGlmZmVyZW50IHNwZWVkIHJhdGVzLiB3aGlsZSBzb21lIHBsYXlzIG9uZSBzdGVwIHBlciBjbGljaywgb3RoZXJzIHdpbGwgaGF2ZSBvbmUgc3RlcCBwZXIgc2V2ZXJhbCBjbG9jayB0aWNrcy5cclxuICAgICAvL3RoZSBzZXF1ZW5jZXIgc3RhcnRpbmcgcG9pbnQgaXMgYWxzbyBkaXNwbGFjZWQsIGFuZCBpdCBkZXBlbmRzIG9uIHRoZSB0aW1lIHdoZW4gaXQgZ290IGFsaXZlZCtpdHMgcG9zaXRpb24gYXQgdGhhdCBtb21lbnQuXHJcbiAgICAgaWYodGhpcy5zdWJwb3MldGhpcy5ldnJ5PT0wKXtcclxuICAgICAgIC8vIGNvbnNvbGUubG9nKFwic3FcIit0aGlzLnBvcyk7XHJcbiAgICAgICAvLyBkYXRhPXtzZXF1ZW5jZXI6dGhpcy5pZCxwb3M6dGhpcy5wb3Msc3RlcFZhbDp0aGlzLmRhdGFbdGhpcy5wb3NdLmV2YWwoKX07XHJcbiAgICAgICAvLyB0aGlzLm9uU3RlcFRyaWdnZXIoZGF0YSk7XHJcbiAgICAgICAvLyBzdGVwRnVuY3Rpb24oZGF0YSk7XHJcbiAgICAgICB0aGlzLnBvcz0odGhpcy5zdWJwb3MvdGhpcy5ldnJ5KSUodGhpcy5sZW4pO1xyXG4gICAgICAgaWYodGhpcy5kYXRhW3RoaXMucG9zXS5ldmFsKCk9PTEpe1xyXG4gICAgICAgICAvLyB0aGlzLmNoYW5uZWwuZW5naW5lLnN0YXJ0KDAsdGhpcy5jaGFubmVsLnN0YXJ0T2Zmc2V0LHRoaXMuY2hhbm5lbC5lbmRUaW1lKTtcclxuICAgICAgICAgLy9zbywgdGhpcyBpcyBjYWxsZWQgZWxzZXdoZXJlIGFzd2VsbGwuLi4uIHRoZSBjaGFubmVsIHNob3VsZCBoYXZlIGEgdHJpZ2dlciBmdW5jdGlvblxyXG4gICAgICAgIC8vICB2YXIgbG9vcFN0YXJ0PXRoaXMuY2hhbm5lbC5zdGFydE9mZnNldDtcclxuICAgICAgICAvLyAgdmFyIGxvb3BFbmQ9dGhpcy5jaGFubmVsLmVuZFRpbWU7XHJcbiAgICAgICAgLy8gIHRoaXMuY2hhbm5lbC5zYW1wbGVyLnRyaWdnZXJBdHRhY2soZmFsc2UsMCwxLHtzdGFydDpsb29wU3RhcnQsZW5kOmxvb3BFbmR9KTtcclxuICAgICAgIH1cclxuICAgICB9ZWxzZXtcclxuICAgICB9XHJcbiAgICAgLy93aGF0IGlzIG1vcmUgZWNvbm9taWM/P1xyXG4gICAgIC8vIHRoaXMuc3VicG9zPSh0aGlzLnN1YnBvcysxKSUodGhpcy5sZW4qdGhpcy5ldnJ5KTtcclxuICAgICAvL2kgZ3Vlc3MgdGhhdC4uIGJ1dCBpdCBjYW4gZ3JvdyBldGVybmFsbHlcclxuICAgICB0aGlzLnN1YnBvcysrO1xyXG4gICB9XHJcbiB9XHJcbiB0aGlzLnNldENsb2NrPWZ1bmN0aW9uKGNsb2NrLGRpdmlzaW9ucyl7XHJcbiAgIGlmKGRpdmlzaW9ucylcclxuICAgdGhpcy5ldnJ5PWRpdmlzaW9ucztcclxuICAgaWYoY2xvY2sub24pe1xyXG4gICAgIGNsb2NrLm9uKCd0aWNrJyxmdW5jdGlvbigpe3RoaXNTZXF1ZW5jZXIuc3RlcCgpfSk7XHJcbiAgICAgaWYoY2xvY2submFtZSE9XCJjbG9ja1wiKVxyXG4gICAgIGNvbnNvbGUud2FybihcInlvdSBzZXQgdGhlIGNsb2NrIG9mIGEgc2VxdWVuY2VyIHRvIHNvbWVodGluZyB0aGF0IGlzIG5vdCBhIGNsb2NrLCBidXQgYSBcIitjbG9jay5uYW1lKTtcclxuICAgfWVsc2V7XHJcbiAgICAgY29uc29sZS53YXJuKFwieW91IHRyaWVkIHRvIGNvbm5lY3QgYSBcIit0aGlzLm5hbWUrXCIgdG8gYW4gb2JqZWN0IHRoYXQgaGFzIG5vIGV2ZW50IGhhbmxlcnMgXCIpO1xyXG4gICB9XHJcbiB9XHJcbiB0aGlzLmRpZT1mdW5jdGlvbigpe1xyXG4gICBmb3IodmFyIGJuIGluIHRoaXMuZGF0YSl7XHJcbiAgICAgdGhpcy5kYXRhW2JuXS5zZXREYXRhKDApO1xyXG4gICB9XHJcbiAgIHRoaXMuYWxpdmU9ZmFsc2U7XHJcbiAgIHRoaXMuJGpxLmRldGFjaCgpO1xyXG4gfVxyXG4gLy8gdGhpcy5vblN0ZXBUcmlnZ2VyPWZ1bmN0aW9uKGRhdGEpe1xyXG4gLy8gICAvLyBjb25zb2xlLmxvZyhkYXRhKTtcclxuIC8vIH1cclxuIC8vIHRoaXMuJGpxLm9uKFwibW91c2VlbnRlclwiLGZ1bmN0aW9uKCl7XHJcbiAvLyAgIGZvY3VzQ2hhbm5lbChtZS5jaGFubmVsLmlkKTtcclxuIC8vIH0pO1xyXG4gcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFNlcXVlbmNlckJ1dHRvbihuLHBhcmVudCl7XHJcbiAgZWVtaXRlci5jYWxsKHRoaXMpO1xyXG4gIHRoaXMub24oXCJ0ZXN0XCIsZnVuY3Rpb24oKXtjb25zb2xlLmxvZyhcIndvcmtzIVwiKX0pO1xyXG4gIHRoaXMuaGFuZGxlKFwidGVzdFwiKTtcclxuICB0aGlzLiRqcT0kKCc8ZGl2IGNsYXNzPVwic2VxYnV0dG9uXCI+PC9kaXY+Jyk7XHJcbiAgdGhpcy5fYmluZE49c3luY21hbi5iaW5kTGlzdC5wdXNoKHRoaXMpLTE7XHJcbiAgcGFyZW50LiRqcS5hcHBlbmQodGhpcy4kanEpO1xyXG4gIHRoaXMuZGF0YT0wO1xyXG4gIC8vcGVuZGFudDogZXZhbHVhdGUgd2V0aGVyIHRoZSB2YXIgbiBpcyBzdGlsbCB1c2VmdWwuIHJlbW92ZSBpdCBhdCBldmVyeSBlbmQuXHJcbiAgdGhpcy5uPW47XHJcbiAgdmFyIG1lPXRoaXM7XHJcbiAgdGhpcy5zZXREYXRhPWZ1bmN0aW9uKHRvLGVtaXQpe1xyXG4gICAgLy8gaWYoZW1pdD09dHJ1ZSl7XHJcbiAgICAvLyAgIHNvY2tDaGFuZ2UoXCJzZXFiOlwiK21lLl9iaW5kTitcIlwiLFwic1ZcIix0byk7XHJcbiAgICAvLyB9XHJcbiAgICAvLyBjb25zb2xlLmxvZyhcInNkYXRhXCIpO1xyXG4gICAgLy9zb2NrZXQgbWF5IHNldCBkYXRhIHRvIDAgd2hlbiBpcyBhbHJlYWR5IDAsIGdlbmVyYXRpbmcgZGlzcGxhY2Ugb2YgcGFyZW50J3MgYWxpdmVkaGlsZFxyXG4gICAgaWYodG8hPXRoaXMuZGF0YSl7XHJcbiAgICAgIGlmKHRvPT0xKXtcclxuICAgICAgICB0aGlzLmRhdGE9MTtcclxuICAgICAgICB0aGlzLiRqcS5hZGRDbGFzcyhcIm9uXCIpO1xyXG4gICAgICAgIHBhcmVudC5hbGl2ZUNoaWxkKys7XHJcbiAgICAgIH1cclxuICAgICAgaWYodG89PTApe1xyXG4gICAgICAgIHRoaXMuZGF0YT0wO1xyXG4gICAgICAgIHRoaXMuJGpxLnJlbW92ZUNsYXNzKFwib25cIik7XHJcbiAgICAgICAgcGFyZW50LmFsaXZlQ2hpbGQtLTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gY29uc29sZS5sb2cocGFyZW50LmFsaXZlQ2hpbGQpO1xyXG4gICAgLy8gY29uc29sZS5sb2cocGFyZW50LmFsaXZlQ2hpbGQpO1xyXG4gIH1cclxuICB0aGlzLiRqcS5vbihcIm1vdXNlZG93biB0YXAgdG91Y2hzdGFydFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBtZS5zZXREYXRhKE1hdGguYWJzKG1lLmRhdGEtMSksdHJ1ZSk7XHJcbiAgICAvLyBtZS5kYXRhPTtcclxuICAgIGlmKG1lLmRhdGE9PTEpe1xyXG4gICAgICAgbW91c2Uuc3dpdGNoaW5nPXRydWU7XHJcbiAgICB9ZWxzZXtcclxuICAgIC8vICAgJCh0aGlzKS5yZW1vdmVDbGFzcyhcIm9uXCIpO1xyXG4gICAgLy8gICBwYXJlbnQuYWxpdmVDaGlsZC0tO1xyXG4gICAgICAgbW91c2Uuc3dpdGNoaW5nPWZhbHNlO1xyXG4gICAgIH1cclxuICB9KTtcclxuICB0aGlzLiRqcS5vbihcIm1vdXNlZW50ZXIgdG91Y2hlbnRlclwiLGZ1bmN0aW9uKCl7XHJcbiAgICBpZihtb3VzZS5idXR0b25Eb3duKXtcclxuICAgICAgaWYobW91c2Uuc3dpdGNoaW5nKXtcclxuICAgICAgICBpZihtZS5kYXRhPT0wKXtcclxuICAgICAgICAgIG1lLnNldERhdGEoMSx0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIGlmKG1lLmRhdGE9PTEpe1xyXG4gICAgICAgICAgbWUuc2V0RGF0YSgwLHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHRoaXMuZXZhbD1mdW5jdGlvbigpe1xyXG4gICAgdmFyICRqcT10aGlzLiRqcTtcclxuICAgICRqcS5hZGRDbGFzcyhcInR1cm5cIik7XHJcbiAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAkanEucmVtb3ZlQ2xhc3MoXCJ0dXJuXCIpO1xyXG4gICAgfSwyMDApO1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YTtcclxuICB9XHJcbn1cclxuIiwiLypcclxuVGhpcyBzY3JpcHQgY3JlYXRlIERPTSBzbGlkZXJzIHRoYXQgY2FuIGJlIHVzZWQgaW4gd2ViIGJyb3dzZXIgdG8gY29udHJvbCBzdHVmZi4gVGhleSBjYW4gYmUgc3luY2VkIHRocm91Z2ggc29ja2V0cyBhbmQgb3RoZXJzIGJ5IHVzaW5nIGNhbGxiYWNrcy5cclxuICAgIENvcHlyaWdodCAoQykgMjAxNiBKb2FxdcOtbiBBbGR1bmF0ZVxyXG5cclxuICAgIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbiAgICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG4gICAgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuICAgIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG4gICAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbiAgICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG4gICAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG4gICAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbiAgICBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG4gICAgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcbnZhciBzeW5jbWFuLG1vdXNlO1xyXG4vLyB2YXIgJDtcclxuZXhwb3J0cy5lbmFibGU9ZnVuY3Rpb24oZ2xvYmFscyl7XHJcbiAgc3luY21hbj1nbG9iYWxzLnN5bmNtYW47XHJcbiAgbW91c2U9Z2xvYmFscy5tb3VzZTtcclxuICByZXR1cm4gU2xpZGVyO1xyXG59O1xyXG5cclxuLyoqXHJcbiogVGhpcyBpcyB0aGUgZGVzY3JpcHRpb24gZm9yIFNsaWRlciBjbGFzc1xyXG4qXHJcbiogQGNsYXNzIFNsaWRlclxyXG4qIEBjb25zdHJ1Y3RvclxyXG4qL1xyXG5mdW5jdGlvbiBTbGlkZXIocGFyZW50LG9wdGlvbnMpe1xyXG4gIC8vbXkgcmVmZXJlbmNlIG51bWJlciBmb3IgZGF0YSBiaW5kaW5nLiBXaXRoIHRoaXMgbnVtYmVyIHRoZSBzb2NrZXQgYmluZGVyIGtub3dzIHdobyBpcyB0aGUgcmVjaWV2ZXIgb2YgdGhlIGRhdGEsIGFuZCBhbHNvIHdpdGggd2hhdCBuYW1lIHRvIHNlbmQgaXRcclxuICAvL3BlbmRhbnQ6IHRoaXMgY2FuIHBvdGVudGlhbGx5IGNyZWF0ZSBhIHByb2JsZW0sIGJlY2F1c2UgdHdvIG9iamVjdHMgY2FuIGJlIGNyZWF0ZWQgc2ltdWx0YW5lb3VzbHkgYXQgZGlmZmVyZW50IGVuZHMgYXQgdGhlIHNhbWUgdGltZS5cclxuICAvL21heWJlIGluc3RlYWQgb2YgdGhlIHNpbXBsZSBwdXNoLCB0aGVyZSBjb3VsZCBiZSBhIGNhbGxiYWNrLCBhZG4gdGhlIG9iamVjdCB3YWl0cyB0byByZWNlaXZlIGl0J3Mgc29ja2V0IGlkIG9uY2UgaXRzIGNyZWF0aW9uIHdhcyBwcm9wYWdhdGVkIHRocm91Z2hvdXQgYWxsIHRoZSBuZXR3b3JrLCBvciBtYXliZSB0aGVyZSBpcyBhbiBhcnJheSBmb3Igc2VudGluZyBhbmQgb3RoZXIgZGlmZmVyZW50IGZvciByZWNlaXZpbmcuLi4gZmlyc3Qgb3B0aW9uIHNlZW1zIG1vcmUgc2Vuc2libGVcclxuICB0aGlzLmRhdGE9e3ZhbHVlOjB9O1xyXG5cclxuICB0aGlzLl9iaW5kTj1zeW5jbWFuLmJpbmRMaXN0LnB1c2godGhpcyktMTtcclxuICB0aGlzLiRqcT0kKCc8ZGl2IGNsYXNzPVwic2xpZGVyLWNvbnRhaW5lclwiIHN0eWxlPVwicG9zaXRpb246cmVsYXRpdmVcIj48L2Rpdj4nKTtcclxuICB0aGlzLiRmYWRlcmpxPSQoJzxkaXYgY2xhc3M9XCJzbGlkZXItaW5uZXJcIiBzdHlsZT1cInBvaW50ZXItZXZlbnRzOm5vbmU7IHBvc2l0aW9uOmFic29sdXRlXCI+PC9kaXY+Jyk7XHJcbiAgdGhpcy5sYWJlbD1vcHRpb25zLmxhYmVsfHxcIlwiO1xyXG4gIHRoaXMubGFiZWxqcT0kKCc8cCBjbGFzcz1cInNsaWRlcmxhYmVsXCI+PC9wPicpO1xyXG4gIHRoaXMuJGpxLmFwcGVuZCh0aGlzLiRmYWRlcmpxKTtcclxuICB0aGlzLiRqcS5hcHBlbmQodGhpcy5sYWJlbGpxKTtcclxuICBpZihvcHRpb25zLmNzcylcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgdGhpcy5jc3M9ZnVuY3Rpb24oY3NzKXtcclxuICAgIHRoaXMuJGpxLmNzcyhjc3MpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG4gIHRoaXMub25DaGFuZ2VDYWxsYmFjaz1mdW5jdGlvbigpe307XHJcbiAgLy9wZW5kYW50OiB0aGlzIHNob3VsZCBiZSBwYXJ0IG9mIGEgYmFzZSBwcm90b3R5cGUsIG5vdCByZXBlYXRlZCBpbiBlYWNoIHR5cGVcclxuICBpZih0eXBlb2YgKHBhcmVudC5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC5hcHBlbmQodGhpcy4kanEpO1xyXG4gIH1lbHNlIGlmKHR5cGVvZiAocGFyZW50LiRqcS5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC4kanEuYXBwZW5kKHRoaXMuJGpxKTtcclxuICB9ZWxzZXtcclxuICAgIGNvbnNvbGUubG9nKFwiYSBzbGlkZXIgY291bGRuJ3QgZmluZCBkb20gZWxlbWVudCB0byBhdHRhY2ggaGltc2VsZlwiKTtcclxuICB9XHJcbiAgdmFyIG1lPXRoaXM7XHJcbiAgdGhpcy5vbkNoYW5nZT1mdW5jdGlvbihjYWxsYmFjayl7XHJcbiAgICBtZS5vbkNoYW5nZUNhbGxiYWNrPWZ1bmN0aW9uKCl7Y2FsbGJhY2sobWUuZGF0YSl9O1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG4gIC8qKlxyXG4qIE15IG1ldGhvZCBkZXNjcmlwdGlvbi4gIExpa2Ugb3RoZXIgcGllY2VzIG9mIHlvdXIgY29tbWVudCBibG9ja3MsXHJcbiogdGhpcyBjYW4gc3BhbiBtdWx0aXBsZSBsaW5lcy5cclxuKlxyXG4qIEBtZXRob2QgbWV0aG9kTmFtZVxyXG4qIEBwYXJhbSB7U3RyaW5nfSBmb28gQXJndW1lbnQgMVxyXG4qIEBwYXJhbSB7T2JqZWN0fSBjb25maWcgQSBjb25maWcgb2JqZWN0XHJcbiogQHBhcmFtIHtTdHJpbmd9IGNvbmZpZy5uYW1lIFRoZSBuYW1lIG9uIHRoZSBjb25maWcgb2JqZWN0XHJcbiogQHBhcmFtIHtGdW5jdGlvbn0gY29uZmlnLmNhbGxiYWNrIEEgY2FsbGJhY2sgZnVuY3Rpb24gb24gdGhlIGNvbmZpZyBvYmplY3RcclxuKiBAcGFyYW0ge0Jvb2xlYW59IFtleHRyYT1mYWxzZV0gRG8gZXh0cmEsIG9wdGlvbmFsIHdvcmtcclxuKiBAcmV0dXJuIHtCb29sZWFufSBSZXR1cm5zIHRydWUgb24gc3VjY2Vzc1xyXG4qL1xyXG4gIHRoaXMuc2V0RGF0YT1mdW5jdGlvbih0byxlbWl0KXtcclxuICAgIGlmKGVtaXQ9PT10cnVlKXtcclxuICAgICAgLy9wZW5kYW50OiBpbiBzZXF1ZW5jZXJzIHdlIHVzZSBwYXJlbnQuaWQsIGFuZCBoZXJlIHdlIHVzZSBfYmluZE4uIFRvd2FyZHMgYSBjb250cm9sbGVyIEFQSSBhbmQgYSBtb3JlIHNlbnNpY2FsIGNvZGUsIEkgdGhpbmsgYm90aCBzaG91bGQgdXNlIHRoZSBiaW5kIGVsZW1lbnQgYXJyYXkuIHJlYWQgbm90ZSBpbiBmaXJzdCBsaW5lIG9mIHRoaXMgZmlsZS5cclxuICAgICAgLy9wZW5kYW50OiBwYXJlbnQgaW4gc2VxIGlzIHdoYXQgbWUgaXMgaGVyZS4gdGhpcyBpcyBwcmV0dHkgY29uZnVzaW5nIHZhciBuYW1lIGRlY2lzaW9uXHJcbiAgICAgIHN5bmNtYW4uZW1pdChcInNsaWQ6XCIrbWUuX2JpbmROK1wiXCIsXCJzVlwiLHRvKTtcclxuICAgIH1cclxuICAgIHRoaXMuZGF0YS52YWx1ZT10bztcclxuICAgIHRoaXMub25DaGFuZ2VDYWxsYmFjaygpO1xyXG4gICAgdGhpcy51cGRhdGVEb20oKTtcclxuICB9XHJcbiAgdGhpcy5hZGRDbGFzcz1mdW5jdGlvbih0byl7XHJcbiAgICB0aGlzLiRqcS5hZGRDbGFzcyh0byk7XHJcbiAgfVxyXG4gIHRoaXMudmVydGljYWw9b3B0aW9ucy52ZXJ0aWNhbHx8dHJ1ZTtcclxuICB0aGlzLmFkZENsYXNzKFwidmVydGljYWxcIik7XHJcbiAgdGhpcy4kanEub24oXCJtb3VzZWRvd24gdGFwIHRvdWNoc3RhcnRcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgaWYobWUudmVydGljYWwpe1xyXG4gICAgICBtZS5zZXREYXRhKDEtZXZlbnQub2Zmc2V0WS9tZS4kanEuaGVpZ2h0KCksdHJ1ZSk7Ly8sdHJ1ZVxyXG4gICAgfWVsc2V7XHJcbiAgICAgIG1lLnNldERhdGEoZXZlbnQub2Zmc2V0WC9tZS4kanEud2lkdGgoKSx0cnVlKTsvLyx0cnVlXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHRoaXMuJGpxLm9uKFwibW91c2Vtb3ZlIHRvdWNoZW50ZXIgbW91c2VsZWF2ZSBtb3VzZXVwXCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgaWYobW91c2UuYnV0dG9uRG93bil7XHJcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgIHZhciBlbWl0VGhpcz1ldmVudC50eXBlPT1cIm1vdXNlbGVhdmVcInx8ZXZlbnQudHlwZT09XCJtb3VzZXVwXCJcclxuICAgICAgaWYobWUudmVydGljYWwpe1xyXG4gICAgICAgIC8vdGhlIHN0cmFuZ2Ugc2Vjb25kIHBhcmFtZW50ZXIgaW4gc2V0ZGF0YSB3YXMgdHJ1ZSwgYnV0IGl0IGNvdWxkIGNsb2cgdGhlIHNvY2tldFxyXG4gICAgICAgIG1lLnNldERhdGEoMS1ldmVudC5vZmZzZXRZL21lLiRqcS5oZWlnaHQoKSxlbWl0VGhpcyk7Ly8sdHJ1ZVxyXG4gICAgICB9ZWxzZXtcclxuICAgICAgICBtZS5zZXREYXRhKGV2ZW50Lm9mZnNldFgvbWUuJGpxLndpZHRoKCksZW1pdFRoaXMpOy8vLHRydWVcclxuICAgICAgfVxyXG4gICAgfWVsc2V7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgdGhpcy5ldmFsPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIganE9dGhpcy4kanE7XHJcbiAgICBqcS5hZGRDbGFzcyhcInR1cm5cIik7XHJcbiAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICBqcS5yZW1vdmVDbGFzcyhcInR1cm5cIik7XHJcbiAgICB9LDIwMCk7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhLnZhbHVlO1xyXG4gIH1cclxuICB0aGlzLnVwZGF0ZURvbT1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy52ZXJ0aWNhbCl7XHJcbiAgICAgIHRoaXMuJGZhZGVyanEuY3NzKHtib3R0b206MCx3aWR0aDpcIjEwMCVcIixoZWlnaHQ6dGhpcy5kYXRhLnZhbHVlKnRoaXMuJGpxLmhlaWdodCgpfSk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdGhpcy5sYWJlbGpxLmh0bWwodGhpcy5sYWJlbCk7XHJcbiAgICAgIHRoaXMuJGZhZGVyanEuY3NzKHtib3R0b206MCx3aWR0aDp0aGlzLmRhdGEudmFsdWUqdGhpcy4kanEud2lkdGgoKSxoZWlnaHQ6XCIxMDAlXCJ9KTtcclxuICAgIH1cclxuICB9XHJcbiAgdGhpcy5zZXREYXRhKDApO1xyXG59IiwibGV0IGVlbWl0ZXI9cmVxdWlyZSgnb25oYW5kbGVycycpO1xyXG52YXIgZ2xvYmFscztcclxudmFyIG1vdXNlO1xyXG5leHBvcnRzLmdldD1mdW5jdGlvbihnbG9iYWxzKXtcclxuICAvLyBzeW5jbWFuPWdsb2JhbHMuc3luY21hbjtcclxuICBtb3VzZT1nbG9iYWxzLm1vdXNlO1xyXG4gIHJldHVybiBjb21wb25lbnRCYXNlO1xyXG59XHJcbi8qKlxyXG4gKiBUaGUgYmFzZSBvZiBjb21wb25lbnRzLlxyXG4gKiBJdCBjb250YWlucyB0aGUgZnVuY3Rpb24gdGhhdCBhcmUgc2hhcmVkIGFtb25nIGFsbCBNc0NvbXBvbmVudHMuIE1ha2VzIGxpdHRsZSBzZW5zZSB0byB1c2UgdGhpcyBhbG9uZVxyXG4gKlxyXG4gKiBAY2xhc3MgY29tcG9uZW50QmFzZVxyXG4gKiBAY29uc3RydWN0b3IgbmV3IE1zQ29tcG9uZW50cy5jb21wb25lbnRCYXNlKERPTS9KcXVlcnkgZWxlbWVudCx7cHJvcGVydGllc30pXHJcbiAqXHJcbiAqIEBwcm9wZXJ0eSBwYXJlbnRcclxuICogQHR5cGUgSnF1ZXJ5IC8gRG9tIGVsZW1lbnQgLyBjb21wb25lbnRCYXNlXHJcbiAqIEBwcm9wZXJ0eSBvcHRpb25zXHJcbiAqIEB0eXBlIG9iamVjdFxyXG4gKi9cclxuZnVuY3Rpb24gY29tcG9uZW50QmFzZShwYXJlbnQsb3B0aW9ucyl7XHJcbiAgZWVtaXRlci5jYWxsKHRoaXMpO1xyXG4gIHRoaXMub3B0aW9ucz1vcHRpb25zO1xyXG4gIHZhciB0aGlzQ29tcG9uZW50PXRoaXM7XHJcbiAgaWYoIXRoaXMubmFtZSl7XHJcbiAgICB0aGlzLm5hbWU9XCJjb21wb25lbnRcIjtcclxuICB9XHJcbiAgdGhpcy4kanE9JCgnPGRpdiBjbGFzcz1cIm1zLScrdGhpcy5uYW1lKydcIj48L2Rpdj4nKTtcclxuICBpZihvcHRpb25zLmNzcylcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgdGhpcy5jc3M9ZnVuY3Rpb24oY3NzKXtcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgaWYodHlwZW9mIChwYXJlbnQuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgICBwYXJlbnQuYXBwZW5kKHRoaXMuJGpxKTtcclxuICB9ZWxzZSBpZih0eXBlb2YgKHBhcmVudC4kanEuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgICBwYXJlbnQuJGpxLmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgfWVsc2V7XHJcbiAgICBjb25zb2xlLmxvZyhcImEgc2xpZGVyIGNvdWxkbid0IGZpbmQgZG9tIGVsZW1lbnQgdG8gYXR0YWNoIGhpbXNlbGZcIik7XHJcbiAgfVxyXG4gIC8qKlxyXG4gICogQHByb3BlcnR5IG1vdXNlQWN0aXZhdGlvbk1vZGVcclxuICAqIEB0eXBlIFN0cmluZ1xyXG4gICogZHJhZ0FsbDogdGhlIGJ1dHRvbnMgd2lsbCBhY3RpdmF0ZSB0aHJvdWdoIGFsbCB0aGUgdHJhamVjdG9yeSBvZiB0aGUgbW91c2Ugd2hpbGUgcHJlc3NlZFxyXG4gICogb25lQnlPbmU6IG9uZSBjbGljaz1vbmUgYnV0dG9uIHByZXNzXHJcbiAgKiBkcmFnTGFzdDogdGhlIG1vdXNlIGNhbiBiZSB0cmFnZ2VkIGFuZCB3aWxsIGFjdGl2YWUgYW5kIGhvdmVyIG9ubHkgdGhlIGxhc3QgYnV0dG9uIHRoYXQgaXQgZW50ZXJlZFxyXG4gICogaG92ZXI6IHRoZSBidXR0aW5zIGFyZSBhY3RpdmF0ZWQgdXBvbiBob3ZlciByZWdhcmRsZXNzIG9mIHdoZXRoZXIgaXMgY2xpY2tlZCBvciBub3RcclxuICAqL1xyXG4gIGlmKCFvcHRpb25zLm1vdXNlQWN0aXZhdGlvbk1vZGUpe1xyXG4gICAgb3B0aW9ucy5tb3VzZUFjdGl2YXRpb25Nb2RlPVwiZHJhZ0FsbFwiO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gbW91c2VBY3RpdmF0ZShldmVudCl7XHJcbiAgICB0aGlzQ29tcG9uZW50LmhhbmRsZShcIm9uTW91c2VTdGFydFwiKTtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB0aGlzQ29tcG9uZW50LmFkZENsYXNzKFwiYWN0aXZlXCIpO1xyXG4gIH1cclxuICBmdW5jdGlvbiBtb3VzZURlYWN0aXZhdGUoZXZlbnQpe1xyXG4gICAgdGhpc0NvbXBvbmVudC5oYW5kbGUoXCJvbk1vdXNlRW5kXCIpO1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIHRoaXNDb21wb25lbnQucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIik7XHJcbiAgfVxyXG5cclxuICAvL3RvIGF2b2lkIGlmIGNoYWlucyB0aGF0IGFyZSBhIHBhaW4gdG8gY2hhbmdlXHJcbiAgZnVuY3Rpb24gYUlzSW5CKGEsYil7XHJcbiAgICBmb3IgKHZhciBjIGluIGIpe1xyXG4gICAgICBpZihhPT1iW2NdKXtjb25zb2xlLmxvZyhcInRydWVcIik7cmV0dXJuIHRydWU7fVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH07XHJcblxyXG4gIHRoaXMuJGpxLm9uKFwibW91c2Vkb3duIHRhcCB0b3VjaHN0YXJ0XCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgLy9jaGVjayB0aGF0IHVwb24gdGhlIGN1cnJlbnQgZXZlbnQsIGEgbW91c2VBY3RpdmF0ZSBzaG91bGQgYmUgdHJpZ2dlcmVkLlxyXG4gICAgaWYoYUlzSW5CKG9wdGlvbnMubW91c2VBY3RpdmF0aW9uTW9kZSxbXCJkcmFnQWxsXCIsXCJvbmVCeU9uZVwiLFwiZHJhZ0xhc3RcIl0pKXtcclxuICAgICAgbW91c2VBY3RpdmF0ZShldmVudCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHRoaXMuJGpxLm9uKFwibW91c2VlbnRlclwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIGlmKG1vdXNlLmJ1dHRvbkRvd24pe1xyXG4gICAgICBpZihhSXNJbkIob3B0aW9ucy5tb3VzZUFjdGl2YXRpb25Nb2RlLFtcImRyYWdBbGxcIixcImRyYWdMYXN0XCJdKSl7XHJcbiAgICAgICAgbW91c2VBY3RpdmF0ZShldmVudCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGlmKG9wdGlvbnMubW91c2VBY3RpdmF0aW9uTW9kZT09XCJob3ZlclwiKXtcclxuICAgICAgbW91c2VBY3RpdmF0ZShldmVudCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgdGhpcy4kanEub24oXCJtb3VzZXVwXCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgaWYoYUlzSW5CKG9wdGlvbnMubW91c2VBY3RpdmF0aW9uTW9kZSxbXCJkcmFnQWxsXCIsXCJvbmVCeU9uZVwiLFwiZHJhZ0xhc3RcIl0pKXtcclxuICAgICAgbW91c2VEZWFjdGl2YXRlKGV2ZW50KTtcclxuICAgIH1cclxuICB9KTtcclxuICB0aGlzLiRqcS5vbihcIm1vdXNlb3V0XCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgaWYoYUlzSW5CKG9wdGlvbnMubW91c2VBY3RpdmF0aW9uTW9kZSxbXCJob3ZlclwiLFwib25lQnlPbmVcIixcImRyYWdMYXN0XCJdKSl7XHJcbiAgICAgIG1vdXNlRGVhY3RpdmF0ZShldmVudCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG5cclxuICB0aGlzLnVwZGF0ZURvbT1mdW5jdGlvbigpe1xyXG4gICAgdGhpc0NvbXBvbmVudC4kanEuaHRtbCh0aGlzLmxhYmVsKTtcclxuICB9XHJcbiAgLy9hbGlhc2luZyBvZiB0aGVzZSB0d28gaGFuZHkgZnVuY3Rpb25cclxuICB0aGlzLmFkZENsYXNzPWZ1bmN0aW9uKHRvKXtcclxuICAgIHRoaXNDb21wb25lbnQuJGpxLmFkZENsYXNzKHRvKTtcclxuICB9XHJcbiAgdGhpcy5yZW1vdmVDbGFzcz1mdW5jdGlvbih0byl7XHJcbiAgICB0aGlzQ29tcG9uZW50LiRqcS5yZW1vdmVDbGFzcyh0byk7XHJcbiAgfVxyXG59IiwiLy8gdmFyIHN5bmNtYW49e307XHJcbnZhciBnbG9iYWxzPXt9O1xyXG5nbG9iYWxzLnN5bmNtYW49cmVxdWlyZSgnLi9zeW5jbWFuLmpzJykuZW5hYmxlKCk7XHJcbmdsb2JhbHMubW91c2U9cmVxdWlyZSgnLi9tb3VzZS5qcycpLmVuYWJsZSgpO1xyXG52YXIgU2xpZGVyPXJlcXVpcmUoJy4vU2xpZGVyLmpzJykuZW5hYmxlKGdsb2JhbHMpO1xyXG52YXIgU2VxdWVuY2VyPXJlcXVpcmUoJy4vU2VxdWVuY2VyLmpzJykuZW5hYmxlKGdsb2JhbHMpO1xyXG52YXIgQnV0dG9uPXJlcXVpcmUoJy4vQnV0dG9uLmpzJykuZW5hYmxlKGdsb2JhbHMpO1xyXG52YXIgQ2xvY2s9cmVxdWlyZSgnLi9DbG9jay5qcycpLmVuYWJsZShnbG9iYWxzKTtcclxudmFyIE1zQ29tcG9uZW50cz17XHJcbiAgU2xpZGVyOlNsaWRlcixcclxuICBTZXF1ZW5jZXI6U2VxdWVuY2VyLFxyXG4gIEJ1dHRvbjpCdXR0b24sXHJcbiAgQ2xvY2s6Q2xvY2ssXHJcbiAgY3JlYXRlOmZ1bmN0aW9uKHdoYXQsb3B0aW9ucyx3aGVyZSl7XHJcbiAgICBpZighd2hlcmUpXHJcbiAgICAgIHdoZXJlPSQoXCJib2R5XCIpO1xyXG4gICAgcmV0dXJuIG5ldyB0aGlzW3doYXRdKHdoZXJlLG9wdGlvbnMpO1xyXG4gIH0sXHJcbn07XHJcbndpbmRvdy5Nc0NvbXBvbmVudHM9TXNDb21wb25lbnRzO1xyXG5jb25zb2xlLmxvZyhNc0NvbXBvbmVudHMpOyIsImV4cG9ydHMuZW5hYmxlPWZ1bmN0aW9uKCl7XHJcblxyXG4gICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XHJcbiAgICAkKGRvY3VtZW50KS5vbihcIm1vdXNlZG93biB0b3VjaHN0YXJ0IHRvdWNobW92ZVwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgbW91c2UuYnV0dG9uRG93bj10cnVlO1xyXG4gICAgICAvLyBjb25zb2xlLmxvZyhldmVudCk7XHJcbiAgICB9KTtcclxuICAgICQoZG9jdW1lbnQpLm9uKFwibW91c2V1cCB0b3VjaGVuZFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgbW91c2UuYnV0dG9uRG93bj1mYWxzZTtcclxuICAgIH0pO1xyXG4gICAgLy8gZG9jdW1lbnQub250b3VjaG1vdmUgPSBmdW5jdGlvbihldmVudCl7XHJcbiAgICAvLyAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAvLyB9XHJcbiAgfSk7XHJcbiAgXHJcbiAgcmV0dXJuIG1vdXNlO1xyXG59XHJcbnZhciBtb3VzZT17XHJcbiAgdG9vbDpcImRyYXdcIlxyXG59O1xyXG5cclxuXHJcbiIsIi8qXHJcblRoaXMgc2NyaXB0IGNvbnRhaW5zIGEgdGVtcGxhdGUgZm9yIGRhdGEtYmluZGluZyBtYW5hZ2VtZW50IGlmIHlvdSB3YW50IHRvIGRvIHNvLiBPdGhlcndpc2UsIGl0IHdpbGwganVzdCBwbGFjZWhvbGQgdmFyIG5hbWVzIHNvIHRoZXJlIGFyZSBubyB1bmRlZmluZWQgdmFycy5cclxuICAgIENvcHlyaWdodCAoQykgMjAxNiBKb2FxdcOtbiBBbGR1bmF0ZVxyXG5cclxuICAgIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbiAgICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG4gICAgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuICAgIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG4gICAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbiAgICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG4gICAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG4gICAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbiAgICBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG4gICAgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG5leHBvcnRzLmVuYWJsZT1mdW5jdGlvbigpe1xyXG4gIHJldHVybiBuZXcgU3luY21hbigpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gU3luY21hbigpe1xyXG4gIC8vbGlzdCBvZiBhbGwgdGhlIGl0ZW1zIHRoYXQgdXNlIGRhdGEgYmluZGluZ1xyXG4gIHRoaXMuYmluZExpc3Q9W107XHJcbiAgLy9ob3cgYXJlIHlvdSBlbWl0dGluZyBjaGFuZ2VzPyBpdCBkZXBlbmRzIG9uIHRoZSBzZXJ2ZXIgeW91IHVzZS5cclxuICB0aGlzLmVtaXQ9ZnVuY3Rpb24oKXt9XHJcbn1cclxuIl19