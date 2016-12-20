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
    this.currentStep++;
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvb25oYW5kbGVycy9vbi5qcyIsInNyY1xcQnV0dG9uLmpzIiwic3JjXFxDbG9jay5qcyIsInNyY1xcU2VxdWVuY2VyLmpzIiwic3JjXFxTbGlkZXIuanMiLCJzcmNcXGNvbXBvbmVudEJhc2UuanMiLCJzcmNcXGluZGV4LmpzIiwic3JjXFxtb3VzZS5qcyIsInNyY1xcc3luY21hbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVDQSxJQUFJLGdCQUFjLFFBQVEsaUJBQVIsQ0FBbEI7QUFDQSxJQUFJLE9BQUosRUFBWSxLQUFaO0FBQ0EsUUFBUSxNQUFSLEdBQWUsVUFBUyxPQUFULEVBQWlCO0FBQzlCLFlBQVEsUUFBUSxPQUFoQjtBQUNBLFVBQU0sUUFBUSxLQUFkO0FBQ0Esa0JBQWMsY0FBYyxHQUFkLENBQWtCLEVBQUMsU0FBUSxPQUFULEVBQWlCLE9BQU0sS0FBdkIsRUFBbEIsQ0FBZDtBQUNBLFNBQU8sTUFBUDtBQUNELENBTEQ7QUFNQSxTQUFTLE1BQVQsQ0FBZ0IsTUFBaEIsRUFBdUIsT0FBdkIsRUFBK0I7QUFDN0IsT0FBSyxJQUFMLEdBQVUsUUFBVjtBQUNBLGdCQUFjLElBQWQsQ0FBbUIsSUFBbkIsRUFBd0IsTUFBeEIsRUFBK0IsT0FBL0I7QUFDQTtBQUNBO0FBQ0E7QUFD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QVhEOztBQWFBLFNBQU8sS0FBUDtBQUNELENBaEJEO0FBaUJBLElBQUksUUFBTTtBQUNSLFFBQUs7QUFERyxDQUFWOzs7OztBQ2pCQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBLFFBQVEsTUFBUixHQUFlLFlBQVU7QUFDdkIsV0FBTyxJQUFJLE9BQUosRUFBUDtBQUNELENBRkQ7O0FBSUEsU0FBUyxPQUFULEdBQWtCO0FBQ2hCO0FBQ0EsU0FBSyxRQUFMLEdBQWMsRUFBZDtBQUNBO0FBQ0EsU0FBSyxJQUFMLEdBQVUsWUFBVSxDQUFFLENBQXRCO0FBQ0QiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLypcclxueW91IG1ha2UgdGhlIG9uSGFuZGxlcnMuY2FsbCh0aGlzKSBpbiB0aGUgb2JqZWN0IHRoYXQgbmVlZHMgdG8gaGF2ZSBoYW5kbGVycy5cclxudGhlbiB5b3UgY2FuIGNyZWF0ZSBhIGZ1bmN0aW9uIGNhbGxiYWNrIGZvciB0aGF0IG9iamVjdCB1c2luZyBvYmplY3Qub24oXCJoYW5kbGVyTmFtZS5vcHRpb25hbE5hbWVcIixjYWxsYmFja0Z1bmN0aW9uKCl7fSk7XHJcbnRoZSBvYmplY3QgY2FuIHJ1biB0aGUgaGFuZGxlIGNhbGxiYWNrcyBieSB1c2luZyB0aGlzLmhhbmRsZShcImhhbmRsZXJOYW1lXCIscGFyYW1ldGVyc1RvRmVlZCk7XHJcbiovXHJcbm1vZHVsZS5leHBvcnRzPWZ1bmN0aW9uKCkge1xyXG4gIHZhciBldmVudFZlcmJvc2U9ZmFsc2U7XHJcbiAgaWYgKCF0aGlzLm9ucykge1xyXG4gICAgdGhpcy5vbnMgPSBbXTtcclxuICB9XHJcbiAgdGhpcy5vbiA9IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrKSB7XHJcbiAgICB2YXIgbmFtZSA9IG5hbWUuc3BsaXQoXCIuXCIpO1xyXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBpZiAobmFtZS5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgIHRocm93IChcInNvcnJ5LCB5b3UgZ2F2ZSBhbiBpbnZhbGlkIGV2ZW50IG5hbWVcIik7XHJcbiAgICAgIH0gZWxzZSBpZiAobmFtZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLm9uc1tuYW1lWzBdXSkgdGhpcy5vbnNbbmFtZVswXV0gPSBbXTtcclxuICAgICAgICB0aGlzLm9uc1tuYW1lWzBdXS5wdXNoKFtmYWxzZSwgY2FsbGJhY2tdKTtcclxuICAgICAgfVxyXG4gICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLm9ucyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyAoXCJlcnJvciBhdCBtb3VzZS5vbiwgcHJvdmlkZWQgY2FsbGJhY2sgdGhhdCBpcyBub3QgYSBmdW5jdGlvblwiKTtcclxuICAgIH1cclxuICB9XHJcbiAgdGhpcy5vZmYgPSBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICB2YXIgbmFtZSA9IG5hbWUuc3BsaXQoXCIuXCIpO1xyXG4gICAgaWYgKG5hbWUubGVuZ3RoID4gMSkge1xyXG4gICAgICBpZiAoIXRoaXMub25zW25hbWVbMF1dKSB0aGlzLm9uc1tuYW1lWzBdXSA9IFtdO1xyXG4gICAgICAvLyBjb25zb2xlLmxvZyhcInByZXZcIix0aGlzLm9uc1tuYW1lWzBdXSk7XHJcbiAgICAgIHRoaXMub25zW25hbWVbMF1dLnNwbGljZSh0aGlzLm9uc1tuYW1lWzBdXS5pbmRleE9mKG5hbWVbMV0pLCAxKTtcclxuICAgICAgLy8gY29uc29sZS5sb2coXCJ0aGVuXCIsdGhpcy5vbnNbbmFtZVswXV0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhyb3cgKFwic29ycnksIHlvdSBnYXZlIGFuIGludmFsaWQgZXZlbnQgbmFtZVwiICsgbmFtZSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHRoaXMuaGFuZGxlID0gZnVuY3Rpb24oZm5hbWUsIHBhcmFtcykge1xyXG4gICAgaWYoZXZlbnRWZXJib3NlKSBjb25zb2xlLmxvZyhcIkV2ZW50IFwiK2ZuYW1lK1wiOlwiLHtjYWxsZXI6dGhpcyxwYXJhbXM6cGFyYW1zfSk7XHJcbiAgICBpZiAodGhpcy5vbnNbZm5hbWVdKSB7XHJcbiAgICAgIGZvciAodmFyIG4gaW4gdGhpcy5vbnNbZm5hbWVdKSB7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5vbnNbZm5hbWVdW25dWzFdKTtcclxuICAgICAgICB0aGlzLm9uc1tmbmFtZV1bbl1bMV0ocGFyYW1zKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufTsiLCJ2YXIgY29tcG9uZW50QmFzZT1yZXF1aXJlKCcuL2NvbXBvbmVudEJhc2UnKTtcclxudmFyIHN5bmNtYW4sbW91c2U7XHJcbmV4cG9ydHMuZW5hYmxlPWZ1bmN0aW9uKGdsb2JhbHMpe1xyXG4gIHN5bmNtYW49Z2xvYmFscy5zeW5jbWFuO1xyXG4gIG1vdXNlPWdsb2JhbHMubW91c2U7XHJcbiAgY29tcG9uZW50QmFzZT1jb21wb25lbnRCYXNlLmdldCh7c3luY21hbjpzeW5jbWFuLG1vdXNlOm1vdXNlfSk7XHJcbiAgcmV0dXJuIEJ1dHRvbjtcclxufVxyXG5mdW5jdGlvbiBCdXR0b24ocGFyZW50LG9wdGlvbnMpe1xyXG4gIHRoaXMubmFtZT1cImJ1dHRvblwiO1xyXG4gIGNvbXBvbmVudEJhc2UuY2FsbCh0aGlzLHBhcmVudCxvcHRpb25zKTtcclxuICAvL215IHJlZmVyZW5jZSBudW1iZXIgZm9yIGRhdGEgYmluZGluZy4gV2l0aCB0aGlzIG51bWJlciB0aGUgc29ja2V0IGJpbmRlciBrbm93cyB3aG8gaXMgdGhlIHJlY2lldmVyIG9mIHRoZSBkYXRhLCBhbmQgYWxzbyB3aXRoIHdoYXQgbmFtZSB0byBzZW5kIGl0XHJcbiAgLy9wZW5kYW50OiB0aGlzIGNhbiBwb3RlbnRpYWxseSBjcmVhdGUgYSBwcm9ibGVtLCBiZWNhdXNlIHR3byBvYmplY3RzIGNhbiBiZSBjcmVhdGVkIHNpbXVsdGFuZW91c2x5IGF0IGRpZmZlcmVudCBlbmRzIGF0IHRoZSBzYW1lIHRpbWUuXHJcbiAgLy9tYXliZSBpbnN0ZWFkIG9mIHRoZSBzaW1wbGUgcHVzaCwgdGhlcmUgY291bGQgYmUgYSBjYWxsYmFjaywgYWRuIHRoZSBvYmplY3Qgd2FpdHMgdG8gcmVjZWl2ZSBpdCdzIHNvY2tldCBpZCBvbmNlIGl0cyBjcmVhdGlvbiB3YXMgcHJvcGFnYXRlZCB0aHJvdWdob3V0IGFsbCB0aGUgbmV0d29yaywgb3IgbWF5YmUgdGhlcmUgaXMgYW4gYXJyYXkgZm9yIHNlbnRpbmcgYW5kIG90aGVyIGRpZmZlcmVudCBmb3IgcmVjZWl2aW5nLi4uIGZpcnN0IG9wdGlvbiBzZWVtcyBtb3JlIHNlbnNpYmxlXHJcbiAgdGhpcy5kYXRhPXt2YWx1ZTowfTtcclxuICB0aGlzLnN0YXRlcz1mYWxzZTtcclxuICB0aGlzLl9iaW5kTj1zeW5jbWFuLmJpbmRMaXN0LnB1c2godGhpcyktMTtcclxuICAvL3RoaXMuJGpxPSQoJzxkaXYgY2xhc3M9XCJtcy1idXR0b25cIj48L2Rpdj4nKTtcclxuICB0aGlzLmxhYmVsPW9wdGlvbnMubGFiZWx8fFwi4pi7XCI7XHJcbiAgdGhpcy4kanEuYXBwZW5kKHRoaXMuJGZhZGVyanEpO1xyXG4gIHRoaXMuJGpxLmh0bWwodGhpcy5sYWJlbCk7XHJcbiAgLy8gaWYob3B0aW9ucy5jc3MpXHJcbiAgLy8gICB0aGlzLiRqcS5jc3Mob3B0aW9ucy5jc3MpO1xyXG4gIC8vIHRoaXMuY3NzPWZ1bmN0aW9uKGNzcyl7XHJcbiAgLy8gICB0aGlzLiRqcS5jc3Mob3B0aW9ucy5jc3MpO1xyXG4gIC8vICAgcmV0dXJuIHRoaXM7XHJcbiAgLy8gfVxyXG4gIC8vaWYgYSBzd2l0Y2ggdmFyaWFibGUgaXMgcGFzc2VkLCB0aGlzIGJ1dHRvbiB3aWxsIHN3aXRjaCBvbiBlYWNoIGNsaWNrIGFtb25nIHRoZSBzdGF0ZWQgc3RhdGVzXHJcbiAgaWYob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShcInN3aXRjaFwiKSl7XHJcbiAgICB0aGlzLnN0YXRlcz1bXTtcclxuICAgIHRoaXMuZGF0YS5jdXJyZW50U3RhdGU9MDtcclxuICAgIHRoaXMuc3RhdGVzPW9wdGlvbnMuc3dpdGNoO1xyXG4gICAgdGhpcy5zd2l0Y2hTdGF0ZSgwKTtcclxuICB9XHJcbiAgdGhpcy5vbkNsaWNrQ2FsbGJhY2s9ZnVuY3Rpb24oKXt9O1xyXG4gIHRoaXMub25SZWxlYXNlQ2FsbGJhY2s9ZnVuY3Rpb24oKXt9O1xyXG4gIC8vcGVuZGFudDogdGhpcyBzaG91bGQgYmUgcGFydCBvZiBhIGJhc2UgcHJvdG90eXBlLCBub3QgcmVwZWF0ZWQgaW4gZWFjaCB0eXBlXHJcbiAgLy8gaWYodHlwZW9mIChwYXJlbnQuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgLy8gICBwYXJlbnQuYXBwZW5kKHRoaXMuJGpxKTtcclxuICAvLyB9ZWxzZSBpZih0eXBlb2YgKHBhcmVudC4kanEuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgLy8gICBwYXJlbnQuJGpxLmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgLy8gfWVsc2V7XHJcbiAgLy8gICBjb25zb2xlLmxvZyhcImEgc2xpZGVyIGNvdWxkbid0IGZpbmQgZG9tIGVsZW1lbnQgdG8gYXR0YWNoIGhpbXNlbGZcIik7XHJcbiAgLy8gfVxyXG4gIHZhciBtZT10aGlzO1xyXG4gIC8vIHRoaXMub25DaGFuZ2U9ZnVuY3Rpb24oY2FsbGJhY2spe1xyXG4gIC8vICAgbWUub25DbGlja0NhbGxiYWNrPWZ1bmN0aW9uKCl7Y2FsbGJhY2sobWUuZGF0YSl9O1xyXG4gIC8vICAgcmV0dXJuIHRoaXM7XHJcbiAgLy8gfVxyXG5cclxuICB0aGlzLiRqcS5vbihcIm1vdXNlZG93biB0YXAgdG91Y2hzdGFydFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIG1lLm9uQ2xpY2tDYWxsYmFjayhtZS5kYXRhKTtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBtZS5zd2l0Y2hTdGF0ZSgpO1xyXG4gICAgbWUuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XHJcbiAgfSk7XHJcbiAgdGhpcy4kanEub24oXCJtb3VzZXVwIG1vdXNlbGVhdmVcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBtZS5vblJlbGVhc2VDYWxsYmFjayhtZS5kYXRhKTtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBtZS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKTtcclxuICB9KTtcclxufVxyXG5cclxuXHJcbkJ1dHRvbi5wcm90b3R5cGUub25DbGljaz1mdW5jdGlvbihjYWxsYmFjayl7XHJcbiAgdGhpcy5vbkNsaWNrQ2FsbGJhY2s9Y2FsbGJhY2s7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn1cclxuQnV0dG9uLnByb3RvdHlwZS5vblJlbGVhc2U9ZnVuY3Rpb24oY2FsbGJhY2spe1xyXG4gIHRoaXMub25SZWxlYXNlQ2FsbGJhY2s9Y2FsbGJhY2s7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn1cclxuQnV0dG9uLnByb3RvdHlwZS5zd2l0Y2hTdGF0ZT1mdW5jdGlvbih0byl7XHJcbiAgaWYodGhpcy5zdGF0ZXMpe1xyXG4gICAgLy9jaGFuZ2Ugc3RhdGUgbnVtYmVyIHRvIG5leHRcclxuICAgIGlmKHRvKXtcclxuICAgICAgdGhpcy5kYXRhLmN1cnJlbnRTdGF0ZT10byV0aGlzLnN0YXRlcy5sZW5ndGg7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdGhpcy5kYXRhLmN1cnJlbnRTdGF0ZT0odGhpcy5kYXRhLmN1cnJlbnRTdGF0ZSsxKSV0aGlzLnN0YXRlcy5sZW5ndGg7XHJcbiAgICB9XHJcbiAgICAvL2FwcGx5IGFsbCB0aGUgcHJvcGVydGllcyB0aGF0IHRoZSBzdGF0ZSBjYXJyeS4gVGhpcyBtYWtlcyB0aGUgYnV0dG9uIHN1cGVyIGhhY2thYmxlXHJcbiAgICBmb3IoYSBpbiB0aGlzLnN0YXRlc1t0aGlzLmRhdGEuY3VycmVudFN0YXRlXSl7XHJcbiAgICAgIHRoaXNbYV09dGhpcy5zdGF0ZXNbdGhpcy5kYXRhLmN1cnJlbnRTdGF0ZV1bYV07XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKFwiW1wiK2ErXCJdXCIsdGhpc1thXSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHRoaXMudXBkYXRlRG9tKCk7XHJcbn1cclxuIiwiXHJcbnZhciBzeW5jbWFuLG1vdXNlO1xyXG52YXIgT0g9cmVxdWlyZShcIm9uaGFuZGxlcnNcIik7XHJcbmV4cG9ydHMuZW5hYmxlPWZ1bmN0aW9uKGdsb2JhbHMpe1xyXG4gIHN5bmNtYW49Z2xvYmFscy5zeW5jbWFuO1xyXG4gIG1vdXNlPWdsb2JhbHMubW91c2U7XHJcbiAgcmV0dXJuIENsb2NrO1xyXG59O1xyXG5mdW5jdGlvbiBDbG9jayhwYXJlbnQsb3B0aW9ucyl7XHJcbiAgdGhpcy5jdXJyZW50U3RlcD0wO1xyXG4gIHRoaXMubmFtZT1cImNsb2NrXCI7XHJcbiAgT0guY2FsbCh0aGlzKTtcclxuICB2YXIgdGhpc0Nsb2NrPXRoaXM7XHJcbiAgdGhpcy5kYXRhPXt2YWx1ZTowfTtcclxuICB0aGlzLnN0YXRlcz1mYWxzZTtcclxuICB0aGlzLl9iaW5kTj1zeW5jbWFuLmJpbmRMaXN0LnB1c2godGhpcyktMTtcclxuICB0aGlzLiRqcT0kKCc8ZGl2IGNsYXNzPVwibXMtY2xvY2sgbXMtYnV0dG9uXCI+PC9kaXY+Jyk7XHJcbiAgdGhpcy5sYWJlbD1vcHRpb25zLmxhYmVsfHwn4oiGJztcclxuICB0aGlzLiRqcS5hcHBlbmQodGhpcy4kZmFkZXJqcSk7XHJcbiAgdGhpcy4kanEuaHRtbCh0aGlzLmxhYmVsKTtcclxuICBpZihvcHRpb25zLmNzcylcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgdGhpcy5jc3M9ZnVuY3Rpb24oY3NzKXtcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgLy9wZW5kYW50OiB0aGlzIHNob3VsZCBiZSBwYXJ0IG9mIGEgYmFzZSBwcm90b3R5cGUsIG5vdCByZXBlYXRlZCBpbiBlYWNoIHR5cGVcclxuICBpZih0eXBlb2YgKHBhcmVudC5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC5hcHBlbmQodGhpcy4kanEpO1xyXG4gIH1lbHNlIGlmKHR5cGVvZiAocGFyZW50LiRqcS5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC4kanEuYXBwZW5kKHRoaXMuJGpxKTtcclxuICB9ZWxzZXtcclxuICAgIGNvbnNvbGUubG9nKFwiYSBjbG9jayBjb3VsZG4ndCBmaW5kIGRvbSBlbGVtZW50IHRvIGF0dGFjaCBoaW1zZWxmXCIpO1xyXG4gIH1cclxuICB2YXIgbWU9dGhpcztcclxuICB0aGlzLnRpY2s9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXNDbG9jay5oYW5kbGUoXCJ0aWNrXCIpO1xyXG4gICAgdGhpc0Nsb2NrLmFkZENsYXNzKFwidGlja1wiKTtcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXt0aGlzQ2xvY2sucmVtb3ZlQ2xhc3MoXCJ0aWNrXCIpO30sMjApO1xyXG4gICAgdGhpcy5jdXJyZW50U3RlcCsrO1xyXG4gIH1cclxuICBzZXRJbnRlcnZhbCh0aGlzLnRpY2ssb3B0aW9ucy5pbnRlcnZhbHw1MDApO1xyXG59XHJcblxyXG5DbG9jay5wcm90b3R5cGUudXBkYXRlRG9tPWZ1bmN0aW9uKCl7XHJcbiAgdGhpcy4kanEuaHRtbCh0aGlzLmxhYmVsKTtcclxufVxyXG5cclxuXHJcblxyXG4vL2FsaWFzaW5nIG9mIHRoZXNlIHR3byBoYW5keSBmdW5jdGlvblxyXG5DbG9jay5wcm90b3R5cGUuYWRkQ2xhc3M9ZnVuY3Rpb24odG8pe1xyXG4gIHRoaXMuJGpxLmFkZENsYXNzKHRvKTtcclxufVxyXG5DbG9jay5wcm90b3R5cGUucmVtb3ZlQ2xhc3M9ZnVuY3Rpb24odG8pe1xyXG4gIHRoaXMuJGpxLnJlbW92ZUNsYXNzKHRvKTtcclxufSIsInZhciBjb21wb25lbnRCYXNlPXJlcXVpcmUoJy4vY29tcG9uZW50QmFzZScpO1xyXG5sZXQgZWVtaXRlcj1yZXF1aXJlKCdvbmhhbmRsZXJzJyk7XHJcbnZhciBzeW5jbWFuLG1vdXNlO1xyXG5leHBvcnRzLmVuYWJsZT1mdW5jdGlvbihnbG9iYWxzKXtcclxuICBzeW5jbWFuPWdsb2JhbHMuc3luY21hbjtcclxuICBtb3VzZT1nbG9iYWxzLm1vdXNlO1xyXG4gIGNvbXBvbmVudEJhc2U9Y29tcG9uZW50QmFzZS5nZXQoe3N5bmNtYW46c3luY21hbixtb3VzZTptb3VzZX0pO1xyXG4gIHJldHVybiBTZXF1ZW5jZXI7XHJcbn1cclxuLyoqXHJcbiAqIEEgZ2VuZXJhdG9yIG9mIHNlcXVlbmNlcnNcclxuICpcclxuICogQGNsYXNzIFNlcXVlbmNlclxyXG4gKiBAY29uc3RydWN0b3IgbmV3IE1zQ29tcG9uZW50cy5TZXF1ZW5jZXIoRE9NLyRqcXVlcnkgZWxlbWVudCx7cHJvcGVydGllc30pXHJcbiAqL1xyXG4gLy9kZWZpbmVzIGFsbCB0aGUgc2VxdWVuY2VyIHBhcmFtZXRlcnMgYnkgbWF0aCxcclxuIC8vbWF5YmUgaW4gYSBmdW50dXJlIGJ5IHN0eWxpbmcgdGFibGVcclxudmFyIHNlcVByb2c9NDtcclxuZnVuY3Rpb24gU2VxdWVuY2VyKHBhcmVudCxvcHRpb25zKXtcclxuIHZhciBuPW9wdGlvbnMubnx8MztcclxuIHZhciB0aGlzU2VxdWVuY2VyPXRoaXM7XHJcbiB0aGlzLm5hbWU9XCJzZXF1ZW5jZXJcIlxyXG4gY29tcG9uZW50QmFzZS5jYWxsKHRoaXMscGFyZW50LG9wdGlvbnMpO1xyXG4gLy8gdGhpcy4kanE9JCgnPGRpdiBjbGFzcz1cInNlcXVlbmNlclwiIGlkPVwic2VxXycrbisnXCI+PHAgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZVwiPjwvcD48L2Rpdj4nKTtcclxuIHBhcmVudC5hcHBlbmQodGhpcy4kanEpO1xyXG4gdGhpcy5hbGl2ZT1mYWxzZTtcclxuIHRoaXMuX2JpbmROPXN5bmNtYW4uYmluZExpc3QucHVzaCh0aGlzKS0xO1xyXG4gdGhpcy5wb3M9MDtcclxuIHRoaXMuZGF0YT1bXTtcclxuIC8qKlxyXG4gICogQHBhcmFtIGxlblxyXG4gICpob3cgbWFueSBzdGVwcyB0aGUgc2VxdWVuY2VyIGhhc1xyXG4gICogQGFsaWFzIGxlbmd0aFxyXG4gICovXHJcbiB0aGlzLmxlbj1vcHRpb25zLmxlbnxvcHRpb25zLmxlbmd0aHxNYXRoLnBvdygyLChzZXFQcm9nJTUpKzEpO1xyXG4gLyoqXHJcbiAgKiBAcGFyYW0gZXZyeVxyXG4gICogaG93IG1hbnkgY2xvY2sgc3RlcHMgbWFrZSBhIHNlcXVlbmNlciBzdGVwXHJcbiAgKiBAYWxpYXMgc3RlcERpdmlzaW9uXHJcbiAgKi9cclxuIHRoaXMuZXZyeT1vcHRpb25zLmV2cnl8b3B0aW9ucy5zdGVwRGl2aXNpb258TWF0aC5wb3coMiwoc2VxUHJvZyU0KSsxKTtcclxuIC8vbXVzdCBjb3VudCBhbiBbZXZlcnldIGFtb3VudCBvZiBiZWF0cyBmb3IgZWFjaCBwb3MgaW5jcmVtZW50LlxyXG4gdGhpcy5zdWJwb3M9MDtcclxuIHRoaXMuJGpxLmNzcyh7d2lkdGg6MTYqTWF0aC5jZWlsKHRoaXMubGVuLzQpK1wicHhcIn0pO1xyXG4gLy90aGlzLiRqcS5hZGRDbGFzcyhcImNvbG9yX1wiK3NlcVByb2clY2hhbm5lbHMubGVuZ3RoKTtcclxuIHRoaXMuZGlzcD0wO1xyXG4gdGhpcy5pZD1uO1xyXG4gdGhpcy5iZWF0RGlzcGxhY2U9MDtcclxuIHZhciBtZT10aGlzO1xyXG4gc2VxUHJvZysrO1xyXG4gLy90aGlzLmNoYW5uZWw9Y2hhbm5lbHNbdGhpcy5pZCVjaGFubmVscy5sZW5ndGhdO1xyXG4gZm9yKHZhciBibj0wOyBibjx0aGlzLmxlbjsgYm4rKyl7XHJcbiAgIHRoaXMuZGF0YVtibl09bmV3IFNlcXVlbmNlckJ1dHRvbihibix0aGlzKVxyXG4gfVxyXG4gdGhpcy5hbGl2ZUNoaWxkPTA7XHJcbiB0aGlzLmRpc3BsYWNlPTA7XHJcbiB0aGlzLnNldERpc3BsYWNlPWZ1bmN0aW9uKHRvLyosZW1pdCovKXtcclxuICAvLyAgaWYoZW1pdD09XCJvbmx5XCIpe1xyXG4gICAgLy8gIGVtaXQ9dHJ1ZTtcclxuICAvLyAgfWVsc2V7XHJcbiAgICAgdGhpcy5zdWJwb3M9KCh0aGlzLmNsb2NrLmN1cnJlbnRTdGVwKSUodGhpcy5sZW4qdGhpcy5ldnJ5KSkrdG87XHJcbiAgLy8gIH1cclxuICAvLyAgaWYoZW1pdD09dHJ1ZSl7XHJcbiAgLy8gICAgc29ja0NoYW5nZShcInNlcTpcIittZS5fYmluZE4rXCJcIixcImRzcGxcIix0byk7XHJcbiAgLy8gIH1cclxuIH1cclxuIHRoaXMuc3RlcD1mdW5jdGlvbigpe1xyXG4gICB2YXIgcHJldmFsaXZlPXRoaXMuYWxpdmU7XHJcbiAgIHRoaXMuYWxpdmU9dGhpcy5hbGl2ZUNoaWxkPjA7XHJcbiAgLy8gIGNvbnNvbGUubG9nKHRoaXMuYWxpdmVDaGlsZCk7XHJcbiAgIGlmKHRoaXMuYWxpdmUpe1xyXG4gICAgLy8gIGNvbnNvbGUubG9nKFwic2V0ZVwiKTtcclxuICAgICAvL2lmIHRoZSBzdGF0ZSBvZiB0aGlzLmFsaXZlIGNoYW5nZXMsIHdlIG11c3QgZW1pdCB0aGUgZGlzcGxhY2VtZW50LCBiZWNhdXNlIGl0IGlzIG5ld1xyXG4gICAgIGlmKCFwcmV2YWxpdmUpe1xyXG4gICAgICAgdGhpcy5kaXNwbGFjZT0odGhpcy5jbG9jay5jdXJyZW50U3RlcCt0aGlzLnN1YnBvcyklKHRoaXMubGVuKnRoaXMuZXZyeSk7XHJcbiAgICAgICAvL2NvbnNvbGUubG9nKFwib2suIGVtaXQgZGlzcGxhZTogXCIrdGhpcy5kaXNwbGFjZSk7XHJcbiAgICAgICAvL3RoaXMuc2V0RGlzcGxhY2UodGhpcy5kaXNwbGFjZSxcIm9ubHlcIik7XHJcbiAgICAgfTtcclxuICAgICAvL2VhY2ggc2VxdWVuY2VyIGhhcyBhIGRpZmZlcmVudCBzcGVlZCByYXRlcy4gd2hpbGUgc29tZSBwbGF5cyBvbmUgc3RlcCBwZXIgY2xpY2ssIG90aGVycyB3aWxsIGhhdmUgb25lIHN0ZXAgcGVyIHNldmVyYWwgY2xvY2sgdGlja3MuXHJcbiAgICAgLy90aGUgc2VxdWVuY2VyIHN0YXJ0aW5nIHBvaW50IGlzIGFsc28gZGlzcGxhY2VkLCBhbmQgaXQgZGVwZW5kcyBvbiB0aGUgdGltZSB3aGVuIGl0IGdvdCBhbGl2ZWQraXRzIHBvc2l0aW9uIGF0IHRoYXQgbW9tZW50LlxyXG4gICAgIGlmKHRoaXMuc3VicG9zJXRoaXMuZXZyeT09MCl7XHJcbiAgICAgICAvLyBjb25zb2xlLmxvZyhcInNxXCIrdGhpcy5wb3MpO1xyXG4gICAgICAgLy8gZGF0YT17c2VxdWVuY2VyOnRoaXMuaWQscG9zOnRoaXMucG9zLHN0ZXBWYWw6dGhpcy5kYXRhW3RoaXMucG9zXS5ldmFsKCl9O1xyXG4gICAgICAgLy8gdGhpcy5vblN0ZXBUcmlnZ2VyKGRhdGEpO1xyXG4gICAgICAgLy8gc3RlcEZ1bmN0aW9uKGRhdGEpO1xyXG4gICAgICAgdGhpcy5wb3M9KHRoaXMuc3VicG9zL3RoaXMuZXZyeSklKHRoaXMubGVuKTtcclxuICAgICAgIHZhciB2bD10aGlzLmRhdGFbdGhpcy5wb3NdLmV2YWwoKTtcclxuICAgICAgIGlmKHZsKXtcclxuICAgICAgICAgLy8gdGhpcy5jaGFubmVsLmVuZ2luZS5zdGFydCgwLHRoaXMuY2hhbm5lbC5zdGFydE9mZnNldCx0aGlzLmNoYW5uZWwuZW5kVGltZSk7XHJcbiAgICAgICAgIC8vc28sIHRoaXMgaXMgY2FsbGVkIGVsc2V3aGVyZSBhc3dlbGxsLi4uLiB0aGUgY2hhbm5lbCBzaG91bGQgaGF2ZSBhIHRyaWdnZXIgZnVuY3Rpb25cclxuICAgICAgICAvLyAgdmFyIGxvb3BTdGFydD10aGlzLmNoYW5uZWwuc3RhcnRPZmZzZXQ7XHJcbiAgICAgICAgLy8gIHZhciBsb29wRW5kPXRoaXMuY2hhbm5lbC5lbmRUaW1lO1xyXG4gICAgICAgIC8vICB0aGlzLmNoYW5uZWwuc2FtcGxlci50cmlnZ2VyQXR0YWNrKGZhbHNlLDAsMSx7c3RhcnQ6bG9vcFN0YXJ0LGVuZDpsb29wRW5kfSk7XHJcbiAgICAgICAgdGhpcy5oYW5kbGUoXCJ0cmlnZ2VyXCIsdmwpO1xyXG4gICAgICAgfVxyXG4gICAgIH1lbHNle1xyXG4gICAgIH1cclxuICAgICAvL3doYXQgaXMgbW9yZSBlY29ub21pYz8/XHJcbiAgICAgLy8gdGhpcy5zdWJwb3M9KHRoaXMuc3VicG9zKzEpJSh0aGlzLmxlbip0aGlzLmV2cnkpO1xyXG4gICAgIC8vaSBndWVzcyB0aGF0Li4gYnV0IGl0IGNhbiBncm93IGV0ZXJuYWxseVxyXG4gICAgIHRoaXMuc3VicG9zKys7XHJcbiAgIH1cclxuIH1cclxuIHRoaXMuc2V0Q2xvY2s9ZnVuY3Rpb24oY2xvY2ssZGl2aXNpb25zKXtcclxuICAgaWYoZGl2aXNpb25zKVxyXG4gICB0aGlzLmV2cnk9ZGl2aXNpb25zO1xyXG4gICBpZihjbG9jay5vbil7XHJcbiAgICAgY2xvY2sub24oJ3RpY2snLGZ1bmN0aW9uKCl7dGhpc1NlcXVlbmNlci5zdGVwKCl9KTtcclxuICAgICBpZihjbG9jay5uYW1lIT1cImNsb2NrXCIpXHJcbiAgICAgY29uc29sZS53YXJuKFwieW91IHNldCB0aGUgY2xvY2sgb2YgYSBzZXF1ZW5jZXIgdG8gc29tZWh0aW5nIHRoYXQgaXMgbm90IGEgY2xvY2ssIGJ1dCBhIFwiK2Nsb2NrLm5hbWUpO1xyXG4gICB9ZWxzZXtcclxuICAgICBjb25zb2xlLndhcm4oXCJ5b3UgdHJpZWQgdG8gY29ubmVjdCBhIFwiK3RoaXMubmFtZStcIiB0byBhbiBvYmplY3QgdGhhdCBoYXMgbm8gZXZlbnQgaGFubGVycyBcIik7XHJcbiAgIH1cclxuICAgdGhpcy5jbG9jaz1jbG9jaztcclxuIH1cclxuIHRoaXMuZGllPWZ1bmN0aW9uKCl7XHJcbiAgIGZvcih2YXIgYm4gaW4gdGhpcy5kYXRhKXtcclxuICAgICB0aGlzLmRhdGFbYm5dLnNldERhdGEoMCk7XHJcbiAgIH1cclxuICAgdGhpcy5hbGl2ZT1mYWxzZTtcclxuICAgdGhpcy4kanEuZGV0YWNoKCk7XHJcbiB9XHJcbiAvLyB0aGlzLm9uU3RlcFRyaWdnZXI9ZnVuY3Rpb24oZGF0YSl7XHJcbiAvLyAgIC8vIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gLy8gfVxyXG4gLy8gdGhpcy4kanEub24oXCJtb3VzZWVudGVyXCIsZnVuY3Rpb24oKXtcclxuIC8vICAgZm9jdXNDaGFubmVsKG1lLmNoYW5uZWwuaWQpO1xyXG4gLy8gfSk7XHJcbiByZXR1cm4gdGhpcztcclxufVxyXG5cclxuZnVuY3Rpb24gU2VxdWVuY2VyQnV0dG9uKG4scGFyZW50KXtcclxuICBlZW1pdGVyLmNhbGwodGhpcyk7XHJcbiAgdGhpcy5vbihcInRlc3RcIixmdW5jdGlvbigpe2NvbnNvbGUubG9nKFwid29ya3MhXCIpfSk7XHJcbiAgdGhpcy5oYW5kbGUoXCJ0ZXN0XCIpO1xyXG4gIHRoaXMuJGpxPSQoJzxkaXYgY2xhc3M9XCJzZXFidXR0b25cIj48L2Rpdj4nKTtcclxuICB0aGlzLl9iaW5kTj1zeW5jbWFuLmJpbmRMaXN0LnB1c2godGhpcyktMTtcclxuICBwYXJlbnQuJGpxLmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgdGhpcy5kYXRhPTA7XHJcbiAgLy9wZW5kYW50OiBldmFsdWF0ZSB3ZXRoZXIgdGhlIHZhciBuIGlzIHN0aWxsIHVzZWZ1bC4gcmVtb3ZlIGl0IGF0IGV2ZXJ5IGVuZC5cclxuICB0aGlzLm49bjtcclxuICB2YXIgbWU9dGhpcztcclxuICB0aGlzLnNldERhdGE9ZnVuY3Rpb24odG8sZW1pdCl7XHJcbiAgICAvLyBpZihlbWl0PT10cnVlKXtcclxuICAgIC8vICAgc29ja0NoYW5nZShcInNlcWI6XCIrbWUuX2JpbmROK1wiXCIsXCJzVlwiLHRvKTtcclxuICAgIC8vIH1cclxuICAgIC8vIGNvbnNvbGUubG9nKFwic2RhdGFcIik7XHJcbiAgICAvL3NvY2tldCBtYXkgc2V0IGRhdGEgdG8gMCB3aGVuIGlzIGFscmVhZHkgMCwgZ2VuZXJhdGluZyBkaXNwbGFjZSBvZiBwYXJlbnQncyBhbGl2ZWRoaWxkXHJcbiAgICBpZih0byE9dGhpcy5kYXRhKXtcclxuICAgICAgaWYodG89PTEpe1xyXG4gICAgICAgIHRoaXMuZGF0YT0xO1xyXG4gICAgICAgIHRoaXMuJGpxLmFkZENsYXNzKFwib25cIik7XHJcbiAgICAgICAgcGFyZW50LmFsaXZlQ2hpbGQrKztcclxuICAgICAgfVxyXG4gICAgICBpZih0bz09MCl7XHJcbiAgICAgICAgdGhpcy5kYXRhPTA7XHJcbiAgICAgICAgdGhpcy4kanEucmVtb3ZlQ2xhc3MoXCJvblwiKTtcclxuICAgICAgICBwYXJlbnQuYWxpdmVDaGlsZC0tO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBjb25zb2xlLmxvZyhwYXJlbnQuYWxpdmVDaGlsZCk7XHJcbiAgICAvLyBjb25zb2xlLmxvZyhwYXJlbnQuYWxpdmVDaGlsZCk7XHJcbiAgfVxyXG4gIHRoaXMuJGpxLm9uKFwibW91c2Vkb3duIHRhcCB0b3VjaHN0YXJ0XCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIG1lLnNldERhdGEoTWF0aC5hYnMobWUuZGF0YS0xKSx0cnVlKTtcclxuICAgIC8vIG1lLmRhdGE9O1xyXG4gICAgaWYobWUuZGF0YT09MSl7XHJcbiAgICAgICBtb3VzZS5zd2l0Y2hpbmc9dHJ1ZTtcclxuICAgIH1lbHNle1xyXG4gICAgLy8gICAkKHRoaXMpLnJlbW92ZUNsYXNzKFwib25cIik7XHJcbiAgICAvLyAgIHBhcmVudC5hbGl2ZUNoaWxkLS07XHJcbiAgICAgICBtb3VzZS5zd2l0Y2hpbmc9ZmFsc2U7XHJcbiAgICAgfVxyXG4gIH0pO1xyXG4gIHRoaXMuJGpxLm9uKFwibW91c2VlbnRlciB0b3VjaGVudGVyXCIsZnVuY3Rpb24oKXtcclxuICAgIGlmKG1vdXNlLmJ1dHRvbkRvd24pe1xyXG4gICAgICBpZihtb3VzZS5zd2l0Y2hpbmcpe1xyXG4gICAgICAgIGlmKG1lLmRhdGE9PTApe1xyXG4gICAgICAgICAgbWUuc2V0RGF0YSgxLHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgfWVsc2V7XHJcbiAgICAgICAgaWYobWUuZGF0YT09MSl7XHJcbiAgICAgICAgICBtZS5zZXREYXRhKDAsdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgdGhpcy5ldmFsPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgJGpxPXRoaXMuJGpxO1xyXG4gICAgJGpxLmFkZENsYXNzKFwidHVyblwiKTtcclxuICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICRqcS5yZW1vdmVDbGFzcyhcInR1cm5cIik7XHJcbiAgICB9LDIwMCk7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhO1xyXG4gIH1cclxufVxyXG4iLCIvKlxyXG5UaGlzIHNjcmlwdCBjcmVhdGUgRE9NIHNsaWRlcnMgdGhhdCBjYW4gYmUgdXNlZCBpbiB3ZWIgYnJvd3NlciB0byBjb250cm9sIHN0dWZmLiBUaGV5IGNhbiBiZSBzeW5jZWQgdGhyb3VnaCBzb2NrZXRzIGFuZCBvdGhlcnMgYnkgdXNpbmcgY2FsbGJhY2tzLlxyXG4gICAgQ29weXJpZ2h0IChDKSAyMDE2IEpvYXF1w61uIEFsZHVuYXRlXHJcblxyXG4gICAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcclxuICAgIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbiAgICB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4gICAgKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cclxuXHJcbiAgICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuICAgIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbiAgICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbiAgICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG5cclxuICAgIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbiAgICBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxudmFyIHN5bmNtYW4sbW91c2U7XHJcbi8vIHZhciAkO1xyXG5leHBvcnRzLmVuYWJsZT1mdW5jdGlvbihnbG9iYWxzKXtcclxuICBzeW5jbWFuPWdsb2JhbHMuc3luY21hbjtcclxuICBtb3VzZT1nbG9iYWxzLm1vdXNlO1xyXG4gIHJldHVybiBTbGlkZXI7XHJcbn07XHJcblxyXG4vKipcclxuKiBUaGlzIGlzIHRoZSBkZXNjcmlwdGlvbiBmb3IgU2xpZGVyIGNsYXNzXHJcbipcclxuKiBAY2xhc3MgU2xpZGVyXHJcbiogQGNvbnN0cnVjdG9yXHJcbiovXHJcbmZ1bmN0aW9uIFNsaWRlcihwYXJlbnQsb3B0aW9ucyl7XHJcbiAgLy9teSByZWZlcmVuY2UgbnVtYmVyIGZvciBkYXRhIGJpbmRpbmcuIFdpdGggdGhpcyBudW1iZXIgdGhlIHNvY2tldCBiaW5kZXIga25vd3Mgd2hvIGlzIHRoZSByZWNpZXZlciBvZiB0aGUgZGF0YSwgYW5kIGFsc28gd2l0aCB3aGF0IG5hbWUgdG8gc2VuZCBpdFxyXG4gIC8vcGVuZGFudDogdGhpcyBjYW4gcG90ZW50aWFsbHkgY3JlYXRlIGEgcHJvYmxlbSwgYmVjYXVzZSB0d28gb2JqZWN0cyBjYW4gYmUgY3JlYXRlZCBzaW11bHRhbmVvdXNseSBhdCBkaWZmZXJlbnQgZW5kcyBhdCB0aGUgc2FtZSB0aW1lLlxyXG4gIC8vbWF5YmUgaW5zdGVhZCBvZiB0aGUgc2ltcGxlIHB1c2gsIHRoZXJlIGNvdWxkIGJlIGEgY2FsbGJhY2ssIGFkbiB0aGUgb2JqZWN0IHdhaXRzIHRvIHJlY2VpdmUgaXQncyBzb2NrZXQgaWQgb25jZSBpdHMgY3JlYXRpb24gd2FzIHByb3BhZ2F0ZWQgdGhyb3VnaG91dCBhbGwgdGhlIG5ldHdvcmssIG9yIG1heWJlIHRoZXJlIGlzIGFuIGFycmF5IGZvciBzZW50aW5nIGFuZCBvdGhlciBkaWZmZXJlbnQgZm9yIHJlY2VpdmluZy4uLiBmaXJzdCBvcHRpb24gc2VlbXMgbW9yZSBzZW5zaWJsZVxyXG4gIHRoaXMuZGF0YT17dmFsdWU6MH07XHJcblxyXG4gIHRoaXMuX2JpbmROPXN5bmNtYW4uYmluZExpc3QucHVzaCh0aGlzKS0xO1xyXG4gIHRoaXMuJGpxPSQoJzxkaXYgY2xhc3M9XCJzbGlkZXItY29udGFpbmVyXCIgc3R5bGU9XCJwb3NpdGlvbjpyZWxhdGl2ZVwiPjwvZGl2PicpO1xyXG4gIHRoaXMuJGZhZGVyanE9JCgnPGRpdiBjbGFzcz1cInNsaWRlci1pbm5lclwiIHN0eWxlPVwicG9pbnRlci1ldmVudHM6bm9uZTsgcG9zaXRpb246YWJzb2x1dGVcIj48L2Rpdj4nKTtcclxuICB0aGlzLmxhYmVsPW9wdGlvbnMubGFiZWx8fFwiXCI7XHJcbiAgdGhpcy5sYWJlbGpxPSQoJzxwIGNsYXNzPVwic2xpZGVybGFiZWxcIj48L3A+Jyk7XHJcbiAgdGhpcy4kanEuYXBwZW5kKHRoaXMuJGZhZGVyanEpO1xyXG4gIHRoaXMuJGpxLmFwcGVuZCh0aGlzLmxhYmVsanEpO1xyXG4gIGlmKG9wdGlvbnMuY3NzKVxyXG4gICAgdGhpcy4kanEuY3NzKG9wdGlvbnMuY3NzKTtcclxuICB0aGlzLmNzcz1mdW5jdGlvbihjc3Mpe1xyXG4gICAgdGhpcy4kanEuY3NzKGNzcyk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgdGhpcy5vbkNoYW5nZUNhbGxiYWNrPWZ1bmN0aW9uKCl7fTtcclxuICAvL3BlbmRhbnQ6IHRoaXMgc2hvdWxkIGJlIHBhcnQgb2YgYSBiYXNlIHByb3RvdHlwZSwgbm90IHJlcGVhdGVkIGluIGVhY2ggdHlwZVxyXG4gIGlmKHR5cGVvZiAocGFyZW50LmFwcGVuZHx8ZmFsc2UpPT1cImZ1bmN0aW9uXCIpe1xyXG4gICAgcGFyZW50LmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgfWVsc2UgaWYodHlwZW9mIChwYXJlbnQuJGpxLmFwcGVuZHx8ZmFsc2UpPT1cImZ1bmN0aW9uXCIpe1xyXG4gICAgcGFyZW50LiRqcS5hcHBlbmQodGhpcy4kanEpO1xyXG4gIH1lbHNle1xyXG4gICAgY29uc29sZS5sb2coXCJhIHNsaWRlciBjb3VsZG4ndCBmaW5kIGRvbSBlbGVtZW50IHRvIGF0dGFjaCBoaW1zZWxmXCIpO1xyXG4gIH1cclxuICB2YXIgbWU9dGhpcztcclxuICB0aGlzLm9uQ2hhbmdlPWZ1bmN0aW9uKGNhbGxiYWNrKXtcclxuICAgIG1lLm9uQ2hhbmdlQ2FsbGJhY2s9ZnVuY3Rpb24oKXtjYWxsYmFjayhtZS5kYXRhKX07XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgLyoqXHJcbiogTXkgbWV0aG9kIGRlc2NyaXB0aW9uLiAgTGlrZSBvdGhlciBwaWVjZXMgb2YgeW91ciBjb21tZW50IGJsb2NrcyxcclxuKiB0aGlzIGNhbiBzcGFuIG11bHRpcGxlIGxpbmVzLlxyXG4qXHJcbiogQG1ldGhvZCBtZXRob2ROYW1lXHJcbiogQHBhcmFtIHtTdHJpbmd9IGZvbyBBcmd1bWVudCAxXHJcbiogQHBhcmFtIHtPYmplY3R9IGNvbmZpZyBBIGNvbmZpZyBvYmplY3RcclxuKiBAcGFyYW0ge1N0cmluZ30gY29uZmlnLm5hbWUgVGhlIG5hbWUgb24gdGhlIGNvbmZpZyBvYmplY3RcclxuKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb25maWcuY2FsbGJhY2sgQSBjYWxsYmFjayBmdW5jdGlvbiBvbiB0aGUgY29uZmlnIG9iamVjdFxyXG4qIEBwYXJhbSB7Qm9vbGVhbn0gW2V4dHJhPWZhbHNlXSBEbyBleHRyYSwgb3B0aW9uYWwgd29ya1xyXG4qIEByZXR1cm4ge0Jvb2xlYW59IFJldHVybnMgdHJ1ZSBvbiBzdWNjZXNzXHJcbiovXHJcbiAgdGhpcy5zZXREYXRhPWZ1bmN0aW9uKHRvLGVtaXQpe1xyXG4gICAgaWYoZW1pdD09PXRydWUpe1xyXG4gICAgICAvL3BlbmRhbnQ6IGluIHNlcXVlbmNlcnMgd2UgdXNlIHBhcmVudC5pZCwgYW5kIGhlcmUgd2UgdXNlIF9iaW5kTi4gVG93YXJkcyBhIGNvbnRyb2xsZXIgQVBJIGFuZCBhIG1vcmUgc2Vuc2ljYWwgY29kZSwgSSB0aGluayBib3RoIHNob3VsZCB1c2UgdGhlIGJpbmQgZWxlbWVudCBhcnJheS4gcmVhZCBub3RlIGluIGZpcnN0IGxpbmUgb2YgdGhpcyBmaWxlLlxyXG4gICAgICAvL3BlbmRhbnQ6IHBhcmVudCBpbiBzZXEgaXMgd2hhdCBtZSBpcyBoZXJlLiB0aGlzIGlzIHByZXR0eSBjb25mdXNpbmcgdmFyIG5hbWUgZGVjaXNpb25cclxuICAgICAgc3luY21hbi5lbWl0KFwic2xpZDpcIittZS5fYmluZE4rXCJcIixcInNWXCIsdG8pO1xyXG4gICAgfVxyXG4gICAgdGhpcy5kYXRhLnZhbHVlPXRvO1xyXG4gICAgdGhpcy5vbkNoYW5nZUNhbGxiYWNrKCk7XHJcbiAgICB0aGlzLnVwZGF0ZURvbSgpO1xyXG4gIH1cclxuICB0aGlzLmFkZENsYXNzPWZ1bmN0aW9uKHRvKXtcclxuICAgIHRoaXMuJGpxLmFkZENsYXNzKHRvKTtcclxuICB9XHJcbiAgdGhpcy52ZXJ0aWNhbD1vcHRpb25zLnZlcnRpY2FsfHx0cnVlO1xyXG4gIHRoaXMuYWRkQ2xhc3MoXCJ2ZXJ0aWNhbFwiKTtcclxuICB0aGlzLiRqcS5vbihcIm1vdXNlZG93biB0YXAgdG91Y2hzdGFydFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBpZihtZS52ZXJ0aWNhbCl7XHJcbiAgICAgIG1lLnNldERhdGEoMS1ldmVudC5vZmZzZXRZL21lLiRqcS5oZWlnaHQoKSx0cnVlKTsvLyx0cnVlXHJcbiAgICB9ZWxzZXtcclxuICAgICAgbWUuc2V0RGF0YShldmVudC5vZmZzZXRYL21lLiRqcS53aWR0aCgpLHRydWUpOy8vLHRydWVcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgdGhpcy4kanEub24oXCJtb3VzZW1vdmUgdG91Y2hlbnRlciBtb3VzZWxlYXZlIG1vdXNldXBcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBpZihtb3VzZS5idXR0b25Eb3duKXtcclxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgdmFyIGVtaXRUaGlzPWV2ZW50LnR5cGU9PVwibW91c2VsZWF2ZVwifHxldmVudC50eXBlPT1cIm1vdXNldXBcIlxyXG4gICAgICBpZihtZS52ZXJ0aWNhbCl7XHJcbiAgICAgICAgLy90aGUgc3RyYW5nZSBzZWNvbmQgcGFyYW1lbnRlciBpbiBzZXRkYXRhIHdhcyB0cnVlLCBidXQgaXQgY291bGQgY2xvZyB0aGUgc29ja2V0XHJcbiAgICAgICAgbWUuc2V0RGF0YSgxLWV2ZW50Lm9mZnNldFkvbWUuJGpxLmhlaWdodCgpLGVtaXRUaGlzKTsvLyx0cnVlXHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIG1lLnNldERhdGEoZXZlbnQub2Zmc2V0WC9tZS4kanEud2lkdGgoKSxlbWl0VGhpcyk7Ly8sdHJ1ZVxyXG4gICAgICB9XHJcbiAgICB9ZWxzZXtcclxuICAgIH1cclxuICB9KTtcclxuICB0aGlzLmV2YWw9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBqcT10aGlzLiRqcTtcclxuICAgIGpxLmFkZENsYXNzKFwidHVyblwiKTtcclxuICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgIGpxLnJlbW92ZUNsYXNzKFwidHVyblwiKTtcclxuICAgIH0sMjAwKTtcclxuICAgIHJldHVybiB0aGlzLmRhdGEudmFsdWU7XHJcbiAgfVxyXG4gIHRoaXMudXBkYXRlRG9tPWZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLnZlcnRpY2FsKXtcclxuICAgICAgdGhpcy4kZmFkZXJqcS5jc3Moe2JvdHRvbTowLHdpZHRoOlwiMTAwJVwiLGhlaWdodDp0aGlzLmRhdGEudmFsdWUqdGhpcy4kanEuaGVpZ2h0KCl9KTtcclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLmxhYmVsanEuaHRtbCh0aGlzLmxhYmVsKTtcclxuICAgICAgdGhpcy4kZmFkZXJqcS5jc3Moe2JvdHRvbTowLHdpZHRoOnRoaXMuZGF0YS52YWx1ZSp0aGlzLiRqcS53aWR0aCgpLGhlaWdodDpcIjEwMCVcIn0pO1xyXG4gICAgfVxyXG4gIH1cclxuICB0aGlzLnNldERhdGEoMCk7XHJcbn0iLCJsZXQgZWVtaXRlcj1yZXF1aXJlKCdvbmhhbmRsZXJzJyk7XHJcbnZhciBnbG9iYWxzO1xyXG52YXIgbW91c2U7XHJcbmV4cG9ydHMuZ2V0PWZ1bmN0aW9uKGdsb2JhbHMpe1xyXG4gIC8vIHN5bmNtYW49Z2xvYmFscy5zeW5jbWFuO1xyXG4gIG1vdXNlPWdsb2JhbHMubW91c2U7XHJcbiAgcmV0dXJuIGNvbXBvbmVudEJhc2U7XHJcbn1cclxuLyoqXHJcbiAqIFRoZSBiYXNlIG9mIGNvbXBvbmVudHMuXHJcbiAqIEl0IGNvbnRhaW5zIHRoZSBmdW5jdGlvbiB0aGF0IGFyZSBzaGFyZWQgYW1vbmcgYWxsIE1zQ29tcG9uZW50cy4gTWFrZXMgbGl0dGxlIHNlbnNlIHRvIHVzZSB0aGlzIGFsb25lXHJcbiAqXHJcbiAqIEBjbGFzcyBjb21wb25lbnRCYXNlXHJcbiAqIEBjb25zdHJ1Y3RvciBuZXcgTXNDb21wb25lbnRzLmNvbXBvbmVudEJhc2UoRE9NL0pxdWVyeSBlbGVtZW50LHtwcm9wZXJ0aWVzfSlcclxuICpcclxuICogQHByb3BlcnR5IHBhcmVudFxyXG4gKiBAdHlwZSBKcXVlcnkgLyBEb20gZWxlbWVudCAvIGNvbXBvbmVudEJhc2VcclxuICogQHByb3BlcnR5IG9wdGlvbnNcclxuICogQHR5cGUgb2JqZWN0XHJcbiAqL1xyXG5mdW5jdGlvbiBjb21wb25lbnRCYXNlKHBhcmVudCxvcHRpb25zKXtcclxuICBlZW1pdGVyLmNhbGwodGhpcyk7XHJcbiAgdGhpcy5vcHRpb25zPW9wdGlvbnM7XHJcbiAgdmFyIHRoaXNDb21wb25lbnQ9dGhpcztcclxuICBpZighdGhpcy5uYW1lKXtcclxuICAgIHRoaXMubmFtZT1cImNvbXBvbmVudFwiO1xyXG4gIH1cclxuICB0aGlzLiRqcT0kKCc8ZGl2IGNsYXNzPVwibXMtJyt0aGlzLm5hbWUrJ1wiPjwvZGl2PicpO1xyXG4gIGlmKG9wdGlvbnMuY3NzKVxyXG4gICAgdGhpcy4kanEuY3NzKG9wdGlvbnMuY3NzKTtcclxuICB0aGlzLmNzcz1mdW5jdGlvbihjc3Mpe1xyXG4gICAgdGhpcy4kanEuY3NzKG9wdGlvbnMuY3NzKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuICBpZih0eXBlb2YgKHBhcmVudC5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC5hcHBlbmQodGhpcy4kanEpO1xyXG4gIH1lbHNlIGlmKHR5cGVvZiAocGFyZW50LiRqcS5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC4kanEuYXBwZW5kKHRoaXMuJGpxKTtcclxuICB9ZWxzZXtcclxuICAgIGNvbnNvbGUubG9nKFwiYSBzbGlkZXIgY291bGRuJ3QgZmluZCBkb20gZWxlbWVudCB0byBhdHRhY2ggaGltc2VsZlwiKTtcclxuICB9XHJcbiAgLyoqXHJcbiAgKiBAcHJvcGVydHkgbW91c2VBY3RpdmF0aW9uTW9kZVxyXG4gICogQHR5cGUgU3RyaW5nXHJcbiAgKiBkcmFnQWxsOiB0aGUgYnV0dG9ucyB3aWxsIGFjdGl2YXRlIHRocm91Z2ggYWxsIHRoZSB0cmFqZWN0b3J5IG9mIHRoZSBtb3VzZSB3aGlsZSBwcmVzc2VkXHJcbiAgKiBvbmVCeU9uZTogb25lIGNsaWNrPW9uZSBidXR0b24gcHJlc3NcclxuICAqIGRyYWdMYXN0OiB0aGUgbW91c2UgY2FuIGJlIHRyYWdnZWQgYW5kIHdpbGwgYWN0aXZhZSBhbmQgaG92ZXIgb25seSB0aGUgbGFzdCBidXR0b24gdGhhdCBpdCBlbnRlcmVkXHJcbiAgKiBob3ZlcjogdGhlIGJ1dHRpbnMgYXJlIGFjdGl2YXRlZCB1cG9uIGhvdmVyIHJlZ2FyZGxlc3Mgb2Ygd2hldGhlciBpcyBjbGlja2VkIG9yIG5vdFxyXG4gICovXHJcbiAgaWYoIW9wdGlvbnMubW91c2VBY3RpdmF0aW9uTW9kZSl7XHJcbiAgICBvcHRpb25zLm1vdXNlQWN0aXZhdGlvbk1vZGU9XCJkcmFnQWxsXCI7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBtb3VzZUFjdGl2YXRlKGV2ZW50KXtcclxuICAgIHRoaXNDb21wb25lbnQuaGFuZGxlKFwib25Nb3VzZVN0YXJ0XCIpO1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIHRoaXNDb21wb25lbnQuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XHJcbiAgfVxyXG4gIGZ1bmN0aW9uIG1vdXNlRGVhY3RpdmF0ZShldmVudCl7XHJcbiAgICB0aGlzQ29tcG9uZW50LmhhbmRsZShcIm9uTW91c2VFbmRcIik7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgdGhpc0NvbXBvbmVudC5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKTtcclxuICB9XHJcblxyXG4gIC8vdG8gYXZvaWQgaWYgY2hhaW5zIHRoYXQgYXJlIGEgcGFpbiB0byBjaGFuZ2VcclxuICBmdW5jdGlvbiBhSXNJbkIoYSxiKXtcclxuICAgIGZvciAodmFyIGMgaW4gYil7XHJcbiAgICAgIGlmKGE9PWJbY10pe2NvbnNvbGUubG9nKFwidHJ1ZVwiKTtyZXR1cm4gdHJ1ZTt9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfTtcclxuXHJcbiAgdGhpcy4kanEub24oXCJtb3VzZWRvd24gdGFwIHRvdWNoc3RhcnRcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICAvL2NoZWNrIHRoYXQgdXBvbiB0aGUgY3VycmVudCBldmVudCwgYSBtb3VzZUFjdGl2YXRlIHNob3VsZCBiZSB0cmlnZ2VyZWQuXHJcbiAgICBpZihhSXNJbkIob3B0aW9ucy5tb3VzZUFjdGl2YXRpb25Nb2RlLFtcImRyYWdBbGxcIixcIm9uZUJ5T25lXCIsXCJkcmFnTGFzdFwiXSkpe1xyXG4gICAgICBtb3VzZUFjdGl2YXRlKGV2ZW50KTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgdGhpcy4kanEub24oXCJtb3VzZWVudGVyXCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgaWYobW91c2UuYnV0dG9uRG93bil7XHJcbiAgICAgIGlmKGFJc0luQihvcHRpb25zLm1vdXNlQWN0aXZhdGlvbk1vZGUsW1wiZHJhZ0FsbFwiLFwiZHJhZ0xhc3RcIl0pKXtcclxuICAgICAgICBtb3VzZUFjdGl2YXRlKGV2ZW50KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYob3B0aW9ucy5tb3VzZUFjdGl2YXRpb25Nb2RlPT1cImhvdmVyXCIpe1xyXG4gICAgICBtb3VzZUFjdGl2YXRlKGV2ZW50KTtcclxuICAgIH1cclxuICB9KTtcclxuICB0aGlzLiRqcS5vbihcIm1vdXNldXBcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBpZihhSXNJbkIob3B0aW9ucy5tb3VzZUFjdGl2YXRpb25Nb2RlLFtcImRyYWdBbGxcIixcIm9uZUJ5T25lXCIsXCJkcmFnTGFzdFwiXSkpe1xyXG4gICAgICBtb3VzZURlYWN0aXZhdGUoZXZlbnQpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHRoaXMuJGpxLm9uKFwibW91c2VvdXRcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBpZihhSXNJbkIob3B0aW9ucy5tb3VzZUFjdGl2YXRpb25Nb2RlLFtcImhvdmVyXCIsXCJvbmVCeU9uZVwiLFwiZHJhZ0xhc3RcIl0pKXtcclxuICAgICAgbW91c2VEZWFjdGl2YXRlKGV2ZW50KTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcblxyXG4gIHRoaXMudXBkYXRlRG9tPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzQ29tcG9uZW50LiRqcS5odG1sKHRoaXMubGFiZWwpO1xyXG4gIH1cclxuICAvL2FsaWFzaW5nIG9mIHRoZXNlIHR3byBoYW5keSBmdW5jdGlvblxyXG4gIHRoaXMuYWRkQ2xhc3M9ZnVuY3Rpb24odG8pe1xyXG4gICAgdGhpc0NvbXBvbmVudC4kanEuYWRkQ2xhc3ModG8pO1xyXG4gIH1cclxuICB0aGlzLnJlbW92ZUNsYXNzPWZ1bmN0aW9uKHRvKXtcclxuICAgIHRoaXNDb21wb25lbnQuJGpxLnJlbW92ZUNsYXNzKHRvKTtcclxuICB9XHJcbn0iLCIvLyB2YXIgc3luY21hbj17fTtcclxudmFyIGdsb2JhbHM9e307XHJcbmdsb2JhbHMuc3luY21hbj1yZXF1aXJlKCcuL3N5bmNtYW4uanMnKS5lbmFibGUoKTtcclxuZ2xvYmFscy5tb3VzZT1yZXF1aXJlKCcuL21vdXNlLmpzJykuZW5hYmxlKCk7XHJcbnZhciBTbGlkZXI9cmVxdWlyZSgnLi9TbGlkZXIuanMnKS5lbmFibGUoZ2xvYmFscyk7XHJcbnZhciBTZXF1ZW5jZXI9cmVxdWlyZSgnLi9TZXF1ZW5jZXIuanMnKS5lbmFibGUoZ2xvYmFscyk7XHJcbnZhciBCdXR0b249cmVxdWlyZSgnLi9CdXR0b24uanMnKS5lbmFibGUoZ2xvYmFscyk7XHJcbnZhciBDbG9jaz1yZXF1aXJlKCcuL0Nsb2NrLmpzJykuZW5hYmxlKGdsb2JhbHMpO1xyXG52YXIgTXNDb21wb25lbnRzPXtcclxuICBTbGlkZXI6U2xpZGVyLFxyXG4gIFNlcXVlbmNlcjpTZXF1ZW5jZXIsXHJcbiAgQnV0dG9uOkJ1dHRvbixcclxuICBDbG9jazpDbG9jayxcclxuICBjcmVhdGU6ZnVuY3Rpb24od2hhdCxvcHRpb25zLHdoZXJlKXtcclxuICAgIGlmKCF3aGVyZSlcclxuICAgICAgd2hlcmU9JChcImJvZHlcIik7XHJcbiAgICByZXR1cm4gbmV3IHRoaXNbd2hhdF0od2hlcmUsb3B0aW9ucyk7XHJcbiAgfSxcclxufTtcclxud2luZG93Lk1zQ29tcG9uZW50cz1Nc0NvbXBvbmVudHM7XHJcbmNvbnNvbGUubG9nKE1zQ29tcG9uZW50cyk7IiwiZXhwb3J0cy5lbmFibGU9ZnVuY3Rpb24oKXtcclxuXHJcbiAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcclxuICAgICQoZG9jdW1lbnQpLm9uKFwibW91c2Vkb3duIHRvdWNoc3RhcnQgdG91Y2htb3ZlXCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICBtb3VzZS5idXR0b25Eb3duPXRydWU7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKGV2ZW50KTtcclxuICAgIH0pO1xyXG4gICAgJChkb2N1bWVudCkub24oXCJtb3VzZXVwIHRvdWNoZW5kXCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICBtb3VzZS5idXR0b25Eb3duPWZhbHNlO1xyXG4gICAgfSk7XHJcbiAgICAvLyBkb2N1bWVudC5vbnRvdWNobW92ZSA9IGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIC8vICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIC8vIH1cclxuICB9KTtcclxuICBcclxuICByZXR1cm4gbW91c2U7XHJcbn1cclxudmFyIG1vdXNlPXtcclxuICB0b29sOlwiZHJhd1wiXHJcbn07XHJcblxyXG5cclxuIiwiLypcclxuVGhpcyBzY3JpcHQgY29udGFpbnMgYSB0ZW1wbGF0ZSBmb3IgZGF0YS1iaW5kaW5nIG1hbmFnZW1lbnQgaWYgeW91IHdhbnQgdG8gZG8gc28uIE90aGVyd2lzZSwgaXQgd2lsbCBqdXN0IHBsYWNlaG9sZCB2YXIgbmFtZXMgc28gdGhlcmUgYXJlIG5vIHVuZGVmaW5lZCB2YXJzLlxyXG4gICAgQ29weXJpZ2h0IChDKSAyMDE2IEpvYXF1w61uIEFsZHVuYXRlXHJcblxyXG4gICAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcclxuICAgIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbiAgICB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4gICAgKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cclxuXHJcbiAgICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuICAgIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbiAgICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbiAgICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG5cclxuICAgIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbiAgICBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxuXHJcbmV4cG9ydHMuZW5hYmxlPWZ1bmN0aW9uKCl7XHJcbiAgcmV0dXJuIG5ldyBTeW5jbWFuKCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBTeW5jbWFuKCl7XHJcbiAgLy9saXN0IG9mIGFsbCB0aGUgaXRlbXMgdGhhdCB1c2UgZGF0YSBiaW5kaW5nXHJcbiAgdGhpcy5iaW5kTGlzdD1bXTtcclxuICAvL2hvdyBhcmUgeW91IGVtaXR0aW5nIGNoYW5nZXM/IGl0IGRlcGVuZHMgb24gdGhlIHNlcnZlciB5b3UgdXNlLlxyXG4gIHRoaXMuZW1pdD1mdW5jdGlvbigpe31cclxufVxyXG4iXX0=