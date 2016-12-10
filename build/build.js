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

var syncman, mouse;
exports.enable = function (sman, m) {
  syncman = sman;
  mouse = m;
  return Button;
};
function Button(parent, options) {
  //my reference number for data binding. With this number the socket binder knows who is the reciever of the data, and also with what name to send it
  //pendant: this can potentially create a problem, because two objects can be created simultaneously at different ends at the same time.
  //maybe instead of the simple push, there could be a callback, adn the object waits to receive it's socket id once its creation was propagated throughout all the network, or maybe there is an array for senting and other different for receiving... first option seems more sensible
  this.data = { value: 0 };
  this.states = false;
  this._bindN = syncman.bindList.push(this) - 1;
  this.$jq = $('<div class="ms-button"></div>');
  this.label = options.label || "☻";
  this.$jq.append(this.$faderjq);
  this.$jq.html(this.label);
  if (options.css) this.$jq.css(options.css);
  this.css = function (css) {
    this.$jq.css(options.css);
    return this;
  };
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
  if (typeof (parent.append || false) == "function") {
    parent.append(this.$jq);
  } else if (typeof (parent.$jq.append || false) == "function") {
    parent.$jq.append(this.$jq);
  } else {
    console.log("a slider couldn't find dom element to attach himself");
  }
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

Button.prototype.updateDom = function () {
  this.$jq.html(this.label);
};

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
//aliasing of these two handy function
Button.prototype.addClass = function (to) {
  this.$jq.addClass(to);
};
Button.prototype.removeClass = function (to) {
  this.$jq.removeClass(to);
};

},{}],3:[function(require,module,exports){
'use strict';

var syncman, mouse;
var OH = require("onhandlers");
exports.enable = function (sman, m) {
  syncman = sman;
  mouse = m;
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
"use strict";

var eemiter = require('onhandlers');
var syncman, mouse;
// var $;
exports.enable = function (sman, m) {
  syncman = sman;
  mouse = m;

  return Sequencer;
};
/**
 * A generator of sequencers
 *
 * @class SequencerButton
 * @constructor new MsComponents.Sequencer(DOM/Jquery element,{properties})
 */
function SequencerButton(n, parent) {
  eemiter.call(this);
  this.on("test", function () {
    console.log("works!");
  });
  this.handle("test");
  this.jq = $('<div class="seqbutton"></div>');
  this._bindN = syncman.bindList.push(this) - 1;
  parent.jq.append(this.jq);
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
        this.jq.addClass("on");
        parent.aliveChild++;
      }
      if (to == 0) {
        this.data = 0;
        this.jq.removeClass("on");
        parent.aliveChild--;
      }
    }
    // console.log(parent.aliveChild);
  };
  this.jq.on("mousedown tap touchstart", function (event) {
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
  this.jq.on("mouseenter touchenter", function () {
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
    var jq = this.jq;
    jq.addClass("turn");
    window.setTimeout(function () {
      jq.removeClass("turn");
    }, 200);
    return this.data;
  };
}
//defines all the sequencer parameters by math,
//maybe in a funture by styling table
var seqProg = 4;
function Sequencer(parent, options) {
  var n = options.n || 3;
  this.jq = $('<div class="sequencer" id="seq_' + n + '"><p style="position:absolute"></p></div>');
  parent.append(this.jq);
  this.alive = false;
  this._bindN = syncman.bindList.push(this) - 1;
  this.pos = 0;
  this.data = [];
  this.len = Math.pow(2, seqProg % 5 + 1);
  this.evry = Math.pow(2, seqProg % 4 + 1);
  //must count an [every] amount of beats for each pos increment.
  this.subpos = 0;
  this.jq.css({ width: 16 * Math.ceil(this.len / 4) + "px" });
  //this.jq.addClass("color_"+seqProg%channels.length);
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
    this.jq.detach();
  };
  // this.onStepTrigger=function(data){
  //   // console.log(data);
  // }
  this.jq.on("mouseenter", function () {
    focusChannel(me.channel.id);
  });
}

},{"onhandlers":1}],5:[function(require,module,exports){
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
exports.enable = function (sman, m) {
  syncman = sman;
  mouse = m;
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

// var syncman={};
var syncman = require('./syncman.js').enable();
var mouse = require('./mouse.js').enable();
var Slider = require('./Slider.js').enable(syncman, mouse);
var Sequencer = require('./Sequencer.js').enable(syncman, mouse);
var Button = require('./Button.js').enable(syncman, mouse);
var Clock = require('./Clock.js').enable(syncman, mouse);
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

},{"./Button.js":2,"./Clock.js":3,"./Sequencer.js":4,"./Slider.js":5,"./mouse.js":7,"./syncman.js":8}],7:[function(require,module,exports){
"use strict";

exports.enable = function () {
  return mouse;
};
var mouse = {
  tool: "draw"
};

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

},{}],8:[function(require,module,exports){
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

},{}]},{},[6])

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvb25oYW5kbGVycy9vbi5qcyIsInNyY1xcQnV0dG9uLmpzIiwic3JjXFxDbG9jay5qcyIsInNyY1xcU2VxdWVuY2VyLmpzIiwic3JjXFxTbGlkZXIuanMiLCJzcmNcXGluZGV4LmpzIiwic3JjXFxtb3VzZS5qcyIsInNyY1xcc3luY21hbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVDQSxJQUFJLE9BQUosRUFBWSxLQUFaO0FBQ0EsUUFBUSxNQUFSLEdBQWUsVUFBUyxJQUFULEVBQWMsQ0FBZCxFQUFnQjtBQUM3QixZQUFRLElBQVI7QUFDQSxVQUFNLENBQU47QUFDQSxTQUFPLE1BQVA7QUFDRCxDQUpEO0FBS0EsU0FBUyxNQUFULENBQWdCLE1BQWhCLEVBQXVCLE9BQXZCLEVBQStCO0FBQzdCO0FBQ0E7QUFDQTtBQUNBLE9BQUssSUFBTCxHQUFVLEVBQUMsT0FBTSxDQUFQLEVBQVY7QUFDQSxPQUFLLE1BQUwsR0FBWSxLQUFaO0FBQ0EsT0FBSyxNQUFMLEdBQVksUUFBUSxRQUFSLENBQWlCLElBQWpCLENBQXNCLElBQXRCLElBQTRCLENBQXhDO0FBQ0EsT0FBSyxHQUFMLEdBQVMsRUFBRSwrQkFBRixDQUFUO0FBQ0EsT0FBSyxLQUFMLEdBQVcsUUFBUSxLQUFSLElBQWUsR0FBMUI7QUFDQSxPQUFLLEdBQUwsQ0FBUyxNQUFULENBQWdCLEtBQUssUUFBckI7QUFDQSxPQUFLLEdBQUwsQ0FBUyxJQUFULENBQWMsS0FBSyxLQUFuQjtBQUNBLE1BQUcsUUFBUSxHQUFYLEVBQ0UsS0FBSyxHQUFMLENBQVMsR0FBVCxDQUFhLFFBQVEsR0FBckI7QUFDRixPQUFLLEdBQUwsR0FBUyxVQUFTLEdBQVQsRUFBYTtBQUNwQixTQUFLLEdBQUwsQ0FBUyxHQUFULENBQWEsUUFBUSxHQUFyQjtBQUNBLFdBQU8sSUFBUDtBQUNELEdBSEQ7QUFJQTtBQUNBLE1BQUcsUUFBUSxjQUFSLENBQXVCLFFBQXZCLENBQUgsRUFBb0M7QUFDbEMsU0FBSyxNQUFMLEdBQVksRUFBWjtBQUNBLFNBQUssSUFBTCxDQUFVLFlBQVYsR0FBdUIsQ0FBdkI7QUFDQSxTQUFLLE1BQUwsR0FBWSxRQUFRLE1BQXBCO0FBQ0EsU0FBSyxXQUFMLENBQWlCLENBQWpCO0FBQ0Q7QUFDRCxPQUFLLGVBQUwsR0FBcUIsWUFBVSxDQUFFLENBQWpDO0FBQ0EsT0FBSyxpQkFBTCxHQUF1QixZQUFVLENBQUUsQ0FBbkM7QUFDQTtBQUNBLE1BQUcsUUFBUSxPQUFPLE1BQVAsSUFBZSxLQUF2QixLQUErQixVQUFsQyxFQUE2QztBQUMzQyxXQUFPLE1BQVAsQ0FBYyxLQUFLLEdBQW5CO0FBQ0QsR0FGRCxNQUVNLElBQUcsUUFBUSxPQUFPLEdBQVAsQ0FBVyxNQUFYLElBQW1CLEtBQTNCLEtBQW1DLFVBQXRDLEVBQWlEO0FBQ3JELFdBQU8sR0FBUCxDQUFXLE1BQVgsQ0FBa0IsS0FBSyxHQUF2QjtBQUNELEdBRkssTUFFRDtBQUNILFlBQVEsR0FBUixDQUFZLHNEQUFaO0FBQ0Q7QUFDRCxNQUFJLEtBQUcsSUFBUDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQUssR0FBTCxDQUFTLEVBQVQsQ0FBWSwwQkFBWixFQUF1QyxVQUFTLEtBQVQsRUFBZTtBQUNwRCxPQUFHLGVBQUgsQ0FBbUIsR0FBRyxJQUF0QjtBQUNBLFVBQU0sY0FBTjtBQUNBLE9BQUcsV0FBSDtBQUNBLE9BQUcsUUFBSCxDQUFZLFFBQVo7QUFDRCxHQUxEO0FBTUEsT0FBSyxHQUFMLENBQVMsRUFBVCxDQUFZLG9CQUFaLEVBQWlDLFVBQVMsS0FBVCxFQUFlO0FBQzlDLE9BQUcsaUJBQUgsQ0FBcUIsR0FBRyxJQUF4QjtBQUNBLFVBQU0sY0FBTjtBQUNBLE9BQUcsV0FBSCxDQUFlLFFBQWY7QUFDRCxHQUpEO0FBS0Q7O0FBRUQsT0FBTyxTQUFQLENBQWlCLFNBQWpCLEdBQTJCLFlBQVU7QUFDbkMsT0FBSyxHQUFMLENBQVMsSUFBVCxDQUFjLEtBQUssS0FBbkI7QUFDRCxDQUZEOztBQUlBLE9BQU8sU0FBUCxDQUFpQixPQUFqQixHQUF5QixVQUFTLFFBQVQsRUFBa0I7QUFDekMsT0FBSyxlQUFMLEdBQXFCLFFBQXJCO0FBQ0EsU0FBTyxJQUFQO0FBQ0QsQ0FIRDtBQUlBLE9BQU8sU0FBUCxDQUFpQixTQUFqQixHQUEyQixVQUFTLFFBQVQsRUFBa0I7QUFDM0MsT0FBSyxpQkFBTCxHQUF1QixRQUF2QjtBQUNBLFNBQU8sSUFBUDtBQUNELENBSEQ7QUFJQSxPQUFPLFNBQVAsQ0FBaUIsV0FBakIsR0FBNkIsVUFBUyxFQUFULEVBQVk7QUFDdkMsTUFBRyxLQUFLLE1BQVIsRUFBZTtBQUNiO0FBQ0EsUUFBRyxFQUFILEVBQU07QUFDSixXQUFLLElBQUwsQ0FBVSxZQUFWLEdBQXVCLEtBQUcsS0FBSyxNQUFMLENBQVksTUFBdEM7QUFDRCxLQUZELE1BRUs7QUFDSCxXQUFLLElBQUwsQ0FBVSxZQUFWLEdBQXVCLENBQUMsS0FBSyxJQUFMLENBQVUsWUFBVixHQUF1QixDQUF4QixJQUEyQixLQUFLLE1BQUwsQ0FBWSxNQUE5RDtBQUNEO0FBQ0Q7QUFDQSxTQUFJLENBQUosSUFBUyxLQUFLLE1BQUwsQ0FBWSxLQUFLLElBQUwsQ0FBVSxZQUF0QixDQUFULEVBQTZDO0FBQzNDLFdBQUssQ0FBTCxJQUFRLEtBQUssTUFBTCxDQUFZLEtBQUssSUFBTCxDQUFVLFlBQXRCLEVBQW9DLENBQXBDLENBQVI7QUFDQTtBQUNEO0FBQ0Y7QUFDRCxPQUFLLFNBQUw7QUFDRCxDQWZEO0FBZ0JBO0FBQ0EsT0FBTyxTQUFQLENBQWlCLFFBQWpCLEdBQTBCLFVBQVMsRUFBVCxFQUFZO0FBQ3BDLE9BQUssR0FBTCxDQUFTLFFBQVQsQ0FBa0IsRUFBbEI7QUFDRCxDQUZEO0FBR0EsT0FBTyxTQUFQLENBQWlCLFdBQWpCLEdBQTZCLFVBQVMsRUFBVCxFQUFZO0FBQ3ZDLE9BQUssR0FBTCxDQUFTLFdBQVQsQ0FBcUIsRUFBckI7QUFDRCxDQUZEOzs7OztBQzFGQSxJQUFJLE9BQUosRUFBWSxLQUFaO0FBQ0EsSUFBSSxLQUFHLFFBQVEsWUFBUixDQUFQO0FBQ0EsUUFBUSxNQUFSLEdBQWUsVUFBUyxJQUFULEVBQWMsQ0FBZCxFQUFnQjtBQUM3QixZQUFRLElBQVI7QUFDQSxVQUFNLENBQU47QUFDQSxTQUFPLEtBQVA7QUFDRCxDQUpEO0FBS0EsU0FBUyxLQUFULENBQWUsTUFBZixFQUFzQixPQUF0QixFQUE4QjtBQUM1QixLQUFHLElBQUgsQ0FBUSxJQUFSO0FBQ0EsTUFBSSxZQUFVLElBQWQ7QUFDQSxPQUFLLElBQUwsR0FBVSxFQUFDLE9BQU0sQ0FBUCxFQUFWO0FBQ0EsT0FBSyxNQUFMLEdBQVksS0FBWjtBQUNBLE9BQUssTUFBTCxHQUFZLFFBQVEsUUFBUixDQUFpQixJQUFqQixDQUFzQixJQUF0QixJQUE0QixDQUF4QztBQUNBLE9BQUssR0FBTCxHQUFTLEVBQUUsd0NBQUYsQ0FBVDtBQUNBLE9BQUssS0FBTCxHQUFXLFFBQVEsS0FBUixJQUFlLEdBQTFCO0FBQ0EsT0FBSyxHQUFMLENBQVMsTUFBVCxDQUFnQixLQUFLLFFBQXJCO0FBQ0EsT0FBSyxHQUFMLENBQVMsSUFBVCxDQUFjLEtBQUssS0FBbkI7QUFDQSxNQUFHLFFBQVEsR0FBWCxFQUNFLEtBQUssR0FBTCxDQUFTLEdBQVQsQ0FBYSxRQUFRLEdBQXJCO0FBQ0YsT0FBSyxHQUFMLEdBQVMsVUFBUyxHQUFULEVBQWE7QUFDcEIsU0FBSyxHQUFMLENBQVMsR0FBVCxDQUFhLFFBQVEsR0FBckI7QUFDQSxXQUFPLElBQVA7QUFDRCxHQUhEO0FBSUE7QUFDQSxNQUFHLFFBQVEsT0FBTyxNQUFQLElBQWUsS0FBdkIsS0FBK0IsVUFBbEMsRUFBNkM7QUFDM0MsV0FBTyxNQUFQLENBQWMsS0FBSyxHQUFuQjtBQUNELEdBRkQsTUFFTSxJQUFHLFFBQVEsT0FBTyxHQUFQLENBQVcsTUFBWCxJQUFtQixLQUEzQixLQUFtQyxVQUF0QyxFQUFpRDtBQUNyRCxXQUFPLEdBQVAsQ0FBVyxNQUFYLENBQWtCLEtBQUssR0FBdkI7QUFDRCxHQUZLLE1BRUQ7QUFDSCxZQUFRLEdBQVIsQ0FBWSxxREFBWjtBQUNEO0FBQ0QsTUFBSSxLQUFHLElBQVA7QUFDQSxPQUFLLElBQUwsR0FBVSxZQUFVO0FBQ2xCLGNBQVUsTUFBVixDQUFpQixNQUFqQjtBQUNBLGNBQVUsUUFBVixDQUFtQixNQUFuQjtBQUNBLGVBQVcsWUFBVTtBQUFDLGdCQUFVLFdBQVYsQ0FBc0IsTUFBdEI7QUFBK0IsS0FBckQsRUFBc0QsRUFBdEQ7QUFDRCxHQUpEO0FBS0EsY0FBWSxLQUFLLElBQWpCLEVBQXNCLFFBQVEsUUFBUixHQUFpQixHQUF2QztBQUNEOztBQUVELE1BQU0sU0FBTixDQUFnQixTQUFoQixHQUEwQixZQUFVO0FBQ2xDLE9BQUssR0FBTCxDQUFTLElBQVQsQ0FBYyxLQUFLLEtBQW5CO0FBQ0QsQ0FGRDs7QUFNQTtBQUNBLE1BQU0sU0FBTixDQUFnQixRQUFoQixHQUF5QixVQUFTLEVBQVQsRUFBWTtBQUNuQyxPQUFLLEdBQUwsQ0FBUyxRQUFULENBQWtCLEVBQWxCO0FBQ0QsQ0FGRDtBQUdBLE1BQU0sU0FBTixDQUFnQixXQUFoQixHQUE0QixVQUFTLEVBQVQsRUFBWTtBQUN0QyxPQUFLLEdBQUwsQ0FBUyxXQUFULENBQXFCLEVBQXJCO0FBQ0QsQ0FGRDs7Ozs7QUNuREEsSUFBSSxVQUFRLFFBQVEsWUFBUixDQUFaO0FBQ0EsSUFBSSxPQUFKLEVBQVksS0FBWjtBQUNBO0FBQ0EsUUFBUSxNQUFSLEdBQWUsVUFBUyxJQUFULEVBQWMsQ0FBZCxFQUFnQjtBQUM3QixZQUFRLElBQVI7QUFDQSxVQUFNLENBQU47O0FBRUEsU0FBTyxTQUFQO0FBQ0QsQ0FMRDtBQU1BOzs7Ozs7QUFNQSxTQUFTLGVBQVQsQ0FBeUIsQ0FBekIsRUFBMkIsTUFBM0IsRUFBa0M7QUFDaEMsVUFBUSxJQUFSLENBQWEsSUFBYjtBQUNBLE9BQUssRUFBTCxDQUFRLE1BQVIsRUFBZSxZQUFVO0FBQUMsWUFBUSxHQUFSLENBQVksUUFBWjtBQUFzQixHQUFoRDtBQUNBLE9BQUssTUFBTCxDQUFZLE1BQVo7QUFDQSxPQUFLLEVBQUwsR0FBUSxFQUFFLCtCQUFGLENBQVI7QUFDQSxPQUFLLE1BQUwsR0FBWSxRQUFRLFFBQVIsQ0FBaUIsSUFBakIsQ0FBc0IsSUFBdEIsSUFBNEIsQ0FBeEM7QUFDQSxTQUFPLEVBQVAsQ0FBVSxNQUFWLENBQWlCLEtBQUssRUFBdEI7QUFDQSxPQUFLLElBQUwsR0FBVSxDQUFWO0FBQ0E7QUFDQSxPQUFLLENBQUwsR0FBTyxDQUFQO0FBQ0EsTUFBSSxLQUFHLElBQVA7QUFDQSxPQUFLLE9BQUwsR0FBYSxVQUFTLEVBQVQsRUFBWSxJQUFaLEVBQWlCO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFHLE1BQUksS0FBSyxJQUFaLEVBQWlCO0FBQ2YsVUFBRyxNQUFJLENBQVAsRUFBUztBQUNQLGFBQUssSUFBTCxHQUFVLENBQVY7QUFDQSxhQUFLLEVBQUwsQ0FBUSxRQUFSLENBQWlCLElBQWpCO0FBQ0EsZUFBTyxVQUFQO0FBQ0Q7QUFDRCxVQUFHLE1BQUksQ0FBUCxFQUFTO0FBQ1AsYUFBSyxJQUFMLEdBQVUsQ0FBVjtBQUNBLGFBQUssRUFBTCxDQUFRLFdBQVIsQ0FBb0IsSUFBcEI7QUFDQSxlQUFPLFVBQVA7QUFDRDtBQUNGO0FBQ0Q7QUFDRCxHQW5CRDtBQW9CQSxPQUFLLEVBQUwsQ0FBUSxFQUFSLENBQVcsMEJBQVgsRUFBc0MsVUFBUyxLQUFULEVBQWU7QUFDbkQsVUFBTSxjQUFOO0FBQ0EsT0FBRyxPQUFILENBQVcsS0FBSyxHQUFMLENBQVMsR0FBRyxJQUFILEdBQVEsQ0FBakIsQ0FBWCxFQUErQixJQUEvQjtBQUNBO0FBQ0EsUUFBRyxHQUFHLElBQUgsSUFBUyxDQUFaLEVBQWM7QUFDWCxZQUFNLFNBQU4sR0FBZ0IsSUFBaEI7QUFDRixLQUZELE1BRUs7QUFDTDtBQUNBO0FBQ0csWUFBTSxTQUFOLEdBQWdCLEtBQWhCO0FBQ0Q7QUFDSCxHQVhEO0FBWUEsT0FBSyxFQUFMLENBQVEsRUFBUixDQUFXLHVCQUFYLEVBQW1DLFlBQVU7QUFDM0MsUUFBRyxNQUFNLFVBQVQsRUFBb0I7QUFDbEIsVUFBRyxNQUFNLFNBQVQsRUFBbUI7QUFDakIsWUFBRyxHQUFHLElBQUgsSUFBUyxDQUFaLEVBQWM7QUFDWixhQUFHLE9BQUgsQ0FBVyxDQUFYLEVBQWEsSUFBYjtBQUNEO0FBQ0YsT0FKRCxNQUlLO0FBQ0gsWUFBRyxHQUFHLElBQUgsSUFBUyxDQUFaLEVBQWM7QUFDWixhQUFHLE9BQUgsQ0FBVyxDQUFYLEVBQWEsSUFBYjtBQUNEO0FBQ0Y7QUFDRjtBQUNGLEdBWkQ7QUFhQSxPQUFLLElBQUwsR0FBVSxZQUFVO0FBQ2xCLFFBQUksS0FBRyxLQUFLLEVBQVo7QUFDQSxPQUFHLFFBQUgsQ0FBWSxNQUFaO0FBQ0EsV0FBTyxVQUFQLENBQWtCLFlBQVU7QUFDMUIsU0FBRyxXQUFILENBQWUsTUFBZjtBQUNELEtBRkQsRUFFRSxHQUZGO0FBR0EsV0FBTyxLQUFLLElBQVo7QUFDRCxHQVBEO0FBUUQ7QUFDRDtBQUNBO0FBQ0EsSUFBSSxVQUFRLENBQVo7QUFDQSxTQUFTLFNBQVQsQ0FBbUIsTUFBbkIsRUFBMEIsT0FBMUIsRUFBa0M7QUFDaEMsTUFBSSxJQUFFLFFBQVEsQ0FBUixJQUFXLENBQWpCO0FBQ0EsT0FBSyxFQUFMLEdBQVEsRUFBRSxvQ0FBa0MsQ0FBbEMsR0FBb0MsMkNBQXRDLENBQVI7QUFDQSxTQUFPLE1BQVAsQ0FBYyxLQUFLLEVBQW5CO0FBQ0EsT0FBSyxLQUFMLEdBQVcsS0FBWDtBQUNBLE9BQUssTUFBTCxHQUFZLFFBQVEsUUFBUixDQUFpQixJQUFqQixDQUFzQixJQUF0QixJQUE0QixDQUF4QztBQUNBLE9BQUssR0FBTCxHQUFTLENBQVQ7QUFDQSxPQUFLLElBQUwsR0FBVSxFQUFWO0FBQ0EsT0FBSyxHQUFMLEdBQVMsS0FBSyxHQUFMLENBQVMsQ0FBVCxFQUFZLFVBQVEsQ0FBVCxHQUFZLENBQXZCLENBQVQ7QUFDQSxPQUFLLElBQUwsR0FBVSxLQUFLLEdBQUwsQ0FBUyxDQUFULEVBQVksVUFBUSxDQUFULEdBQVksQ0FBdkIsQ0FBVjtBQUNBO0FBQ0EsT0FBSyxNQUFMLEdBQVksQ0FBWjtBQUNBLE9BQUssRUFBTCxDQUFRLEdBQVIsQ0FBWSxFQUFDLE9BQU0sS0FBRyxLQUFLLElBQUwsQ0FBVSxLQUFLLEdBQUwsR0FBUyxDQUFuQixDQUFILEdBQXlCLElBQWhDLEVBQVo7QUFDQTtBQUNBLE9BQUssSUFBTCxHQUFVLENBQVY7QUFDQSxPQUFLLEVBQUwsR0FBUSxDQUFSO0FBQ0EsT0FBSyxZQUFMLEdBQWtCLENBQWxCO0FBQ0EsTUFBSSxLQUFHLElBQVA7QUFDQTtBQUNBO0FBQ0EsT0FBSSxJQUFJLEtBQUcsQ0FBWCxFQUFjLEtBQUcsS0FBSyxHQUF0QixFQUEyQixJQUEzQixFQUFnQztBQUM5QixTQUFLLElBQUwsQ0FBVSxFQUFWLElBQWMsSUFBSSxlQUFKLENBQW9CLEVBQXBCLEVBQXVCLElBQXZCLENBQWQ7QUFDRDtBQUNELE9BQUssVUFBTCxHQUFnQixDQUFoQjtBQUNBLE9BQUssUUFBTCxHQUFjLENBQWQ7QUFDQSxPQUFLLFdBQUwsR0FBaUIsVUFBUyxFQUFULEVBQVksSUFBWixFQUFpQjtBQUNoQyxRQUFHLFFBQU0sTUFBVCxFQUFnQjtBQUNkLGFBQUssSUFBTDtBQUNELEtBRkQsTUFFSztBQUNILFdBQUssTUFBTCxHQUFjLG9CQUFELElBQXdCLEtBQUssR0FBTCxHQUFTLEtBQUssSUFBdEMsQ0FBRCxHQUE4QyxFQUExRDtBQUNEO0FBQ0QsUUFBRyxRQUFNLElBQVQsRUFBYztBQUNaLGlCQUFXLFNBQU8sR0FBRyxNQUFWLEdBQWlCLEVBQTVCLEVBQStCLE1BQS9CLEVBQXNDLEVBQXRDO0FBQ0Q7QUFDRixHQVREO0FBVUEsT0FBSyxJQUFMLEdBQVUsWUFBVTtBQUNsQixRQUFJLFlBQVUsS0FBSyxLQUFuQjtBQUNBLFNBQUssS0FBTCxHQUFXLEtBQUssVUFBTCxHQUFnQixDQUEzQjtBQUNBLFFBQUcsS0FBSyxLQUFSLEVBQWM7QUFDWjtBQUNBLFVBQUcsQ0FBQyxTQUFKLEVBQWM7QUFDWixhQUFLLFFBQUwsR0FBYyxDQUFDLHVCQUFxQixLQUFLLE1BQTNCLEtBQW9DLEtBQUssR0FBTCxHQUFTLEtBQUssSUFBbEQsQ0FBZDtBQUNBLGdCQUFRLEdBQVIsQ0FBWSx1QkFBcUIsS0FBSyxRQUF0QztBQUNBLGFBQUssV0FBTCxDQUFpQixLQUFLLFFBQXRCLEVBQStCLE1BQS9CO0FBQ0Q7QUFDRDtBQUNBO0FBQ0EsVUFBRyxLQUFLLE1BQUwsR0FBWSxLQUFLLElBQWpCLElBQXVCLENBQTFCLEVBQTRCO0FBQzFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBSyxHQUFMLEdBQVUsS0FBSyxNQUFMLEdBQVksS0FBSyxJQUFsQixHQUF5QixLQUFLLEdBQXZDO0FBQ0EsWUFBRyxLQUFLLElBQUwsQ0FBVSxLQUFLLEdBQWYsRUFBb0IsSUFBcEIsTUFBNEIsQ0FBL0IsRUFBaUM7QUFDL0I7QUFDQTtBQUNBLGNBQUksWUFBVSxLQUFLLE9BQUwsQ0FBYSxXQUEzQjtBQUNBLGNBQUksVUFBUSxLQUFLLE9BQUwsQ0FBYSxPQUF6QjtBQUNBLGVBQUssT0FBTCxDQUFhLE9BQWIsQ0FBcUIsYUFBckIsQ0FBbUMsS0FBbkMsRUFBeUMsQ0FBekMsRUFBMkMsQ0FBM0MsRUFBNkMsRUFBQyxPQUFNLFNBQVAsRUFBaUIsS0FBSSxPQUFyQixFQUE3QztBQUNEO0FBQ0YsT0FiRCxNQWFLLENBQ0o7QUFDRDtBQUNBO0FBQ0E7QUFDQSxXQUFLLE1BQUw7QUFDRDtBQUNGLEdBaENEO0FBaUNBLE9BQUssR0FBTCxHQUFTLFlBQVU7QUFDakIsU0FBSSxJQUFJLEVBQVIsSUFBYyxLQUFLLElBQW5CLEVBQXdCO0FBQ3RCLFdBQUssSUFBTCxDQUFVLEVBQVYsRUFBYyxPQUFkLENBQXNCLENBQXRCO0FBQ0Q7QUFDRCxTQUFLLEtBQUwsR0FBVyxLQUFYO0FBQ0EsU0FBSyxFQUFMLENBQVEsTUFBUjtBQUNELEdBTkQ7QUFPQTtBQUNBO0FBQ0E7QUFDQSxPQUFLLEVBQUwsQ0FBUSxFQUFSLENBQVcsWUFBWCxFQUF3QixZQUFVO0FBQ2hDLGlCQUFhLEdBQUcsT0FBSCxDQUFXLEVBQXhCO0FBQ0QsR0FGRDtBQUdEOzs7OztBQ3BLRDs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkEsSUFBSSxPQUFKLEVBQVksS0FBWjtBQUNBO0FBQ0EsUUFBUSxNQUFSLEdBQWUsVUFBUyxJQUFULEVBQWMsQ0FBZCxFQUFnQjtBQUM3QixZQUFRLElBQVI7QUFDQSxVQUFNLENBQU47QUFDQSxTQUFPLE1BQVA7QUFDRCxDQUpEOztBQU1BOzs7Ozs7QUFNQSxTQUFTLE1BQVQsQ0FBZ0IsTUFBaEIsRUFBdUIsT0FBdkIsRUFBK0I7QUFDN0I7QUFDQTtBQUNBO0FBQ0EsT0FBSyxJQUFMLEdBQVUsRUFBQyxPQUFNLENBQVAsRUFBVjs7QUFFQSxPQUFLLE1BQUwsR0FBWSxRQUFRLFFBQVIsQ0FBaUIsSUFBakIsQ0FBc0IsSUFBdEIsSUFBNEIsQ0FBeEM7QUFDQSxPQUFLLEdBQUwsR0FBUyxFQUFFLGdFQUFGLENBQVQ7QUFDQSxPQUFLLFFBQUwsR0FBYyxFQUFFLGlGQUFGLENBQWQ7QUFDQSxPQUFLLEtBQUwsR0FBVyxRQUFRLEtBQVIsSUFBZSxFQUExQjtBQUNBLE9BQUssT0FBTCxHQUFhLEVBQUUsNkJBQUYsQ0FBYjtBQUNBLE9BQUssR0FBTCxDQUFTLE1BQVQsQ0FBZ0IsS0FBSyxRQUFyQjtBQUNBLE9BQUssR0FBTCxDQUFTLE1BQVQsQ0FBZ0IsS0FBSyxPQUFyQjtBQUNBLE1BQUcsUUFBUSxHQUFYLEVBQ0UsS0FBSyxHQUFMLENBQVMsR0FBVCxDQUFhLFFBQVEsR0FBckI7QUFDRixPQUFLLEdBQUwsR0FBUyxVQUFTLEdBQVQsRUFBYTtBQUNwQixTQUFLLEdBQUwsQ0FBUyxHQUFULENBQWEsR0FBYjtBQUNBLFdBQU8sSUFBUDtBQUNELEdBSEQ7QUFJQSxPQUFLLGdCQUFMLEdBQXNCLFlBQVUsQ0FBRSxDQUFsQztBQUNBO0FBQ0EsTUFBRyxRQUFRLE9BQU8sTUFBUCxJQUFlLEtBQXZCLEtBQStCLFVBQWxDLEVBQTZDO0FBQzNDLFdBQU8sTUFBUCxDQUFjLEtBQUssR0FBbkI7QUFDRCxHQUZELE1BRU0sSUFBRyxRQUFRLE9BQU8sR0FBUCxDQUFXLE1BQVgsSUFBbUIsS0FBM0IsS0FBbUMsVUFBdEMsRUFBaUQ7QUFDckQsV0FBTyxHQUFQLENBQVcsTUFBWCxDQUFrQixLQUFLLEdBQXZCO0FBQ0QsR0FGSyxNQUVEO0FBQ0gsWUFBUSxHQUFSLENBQVksc0RBQVo7QUFDRDtBQUNELE1BQUksS0FBRyxJQUFQO0FBQ0EsT0FBSyxRQUFMLEdBQWMsVUFBUyxRQUFULEVBQWtCO0FBQzlCLE9BQUcsZ0JBQUgsR0FBb0IsWUFBVTtBQUFDLGVBQVMsR0FBRyxJQUFaO0FBQWtCLEtBQWpEO0FBQ0EsV0FBTyxJQUFQO0FBQ0QsR0FIRDtBQUlBOzs7Ozs7Ozs7Ozs7QUFZQSxPQUFLLE9BQUwsR0FBYSxVQUFTLEVBQVQsRUFBWSxJQUFaLEVBQWlCO0FBQzVCLFFBQUcsU0FBTyxJQUFWLEVBQWU7QUFDYjtBQUNBO0FBQ0EsY0FBUSxJQUFSLENBQWEsVUFBUSxHQUFHLE1BQVgsR0FBa0IsRUFBL0IsRUFBa0MsSUFBbEMsRUFBdUMsRUFBdkM7QUFDRDtBQUNELFNBQUssSUFBTCxDQUFVLEtBQVYsR0FBZ0IsRUFBaEI7QUFDQSxTQUFLLGdCQUFMO0FBQ0EsU0FBSyxTQUFMO0FBQ0QsR0FURDtBQVVBLE9BQUssUUFBTCxHQUFjLFVBQVMsRUFBVCxFQUFZO0FBQ3hCLFNBQUssR0FBTCxDQUFTLFFBQVQsQ0FBa0IsRUFBbEI7QUFDRCxHQUZEO0FBR0EsT0FBSyxRQUFMLEdBQWMsUUFBUSxRQUFSLElBQWtCLElBQWhDO0FBQ0EsT0FBSyxRQUFMLENBQWMsVUFBZDtBQUNBLE9BQUssR0FBTCxDQUFTLEVBQVQsQ0FBWSwwQkFBWixFQUF1QyxVQUFTLEtBQVQsRUFBZTtBQUNwRCxVQUFNLGNBQU47QUFDQSxRQUFHLEdBQUcsUUFBTixFQUFlO0FBQ2IsU0FBRyxPQUFILENBQVcsSUFBRSxNQUFNLE9BQU4sR0FBYyxHQUFHLEdBQUgsQ0FBTyxNQUFQLEVBQTNCLEVBQTJDLElBQTNDLEVBRGEsQ0FDb0M7QUFDbEQsS0FGRCxNQUVLO0FBQ0gsU0FBRyxPQUFILENBQVcsTUFBTSxPQUFOLEdBQWMsR0FBRyxHQUFILENBQU8sS0FBUCxFQUF6QixFQUF3QyxJQUF4QyxFQURHLENBQzJDO0FBQy9DO0FBQ0YsR0FQRDs7QUFTQSxPQUFLLEdBQUwsQ0FBUyxFQUFULENBQVkseUNBQVosRUFBc0QsVUFBUyxLQUFULEVBQWU7QUFDbkUsUUFBRyxNQUFNLFVBQVQsRUFBb0I7QUFDbEIsWUFBTSxjQUFOO0FBQ0EsVUFBSSxXQUFTLE1BQU0sSUFBTixJQUFZLFlBQVosSUFBMEIsTUFBTSxJQUFOLElBQVksU0FBbkQ7QUFDQSxVQUFHLEdBQUcsUUFBTixFQUFlO0FBQ2I7QUFDQSxXQUFHLE9BQUgsQ0FBVyxJQUFFLE1BQU0sT0FBTixHQUFjLEdBQUcsR0FBSCxDQUFPLE1BQVAsRUFBM0IsRUFBMkMsUUFBM0MsRUFGYSxDQUV3QztBQUN0RCxPQUhELE1BR0s7QUFDSCxXQUFHLE9BQUgsQ0FBVyxNQUFNLE9BQU4sR0FBYyxHQUFHLEdBQUgsQ0FBTyxLQUFQLEVBQXpCLEVBQXdDLFFBQXhDLEVBREcsQ0FDK0M7QUFDbkQ7QUFDRixLQVRELE1BU0ssQ0FDSjtBQUNGLEdBWkQ7QUFhQSxPQUFLLElBQUwsR0FBVSxZQUFVO0FBQ2xCLFFBQUksS0FBRyxLQUFLLEdBQVo7QUFDQSxPQUFHLFFBQUgsQ0FBWSxNQUFaO0FBQ0EsV0FBTyxVQUFQLENBQWtCLFlBQVU7QUFDMUIsU0FBRyxXQUFILENBQWUsTUFBZjtBQUNELEtBRkQsRUFFRSxHQUZGO0FBR0EsV0FBTyxLQUFLLElBQUwsQ0FBVSxLQUFqQjtBQUNELEdBUEQ7QUFRQSxPQUFLLFNBQUwsR0FBZSxZQUFVO0FBQ3ZCLFFBQUcsS0FBSyxRQUFSLEVBQWlCO0FBQ2YsV0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixFQUFDLFFBQU8sQ0FBUixFQUFVLE9BQU0sTUFBaEIsRUFBdUIsUUFBTyxLQUFLLElBQUwsQ0FBVSxLQUFWLEdBQWdCLEtBQUssR0FBTCxDQUFTLE1BQVQsRUFBOUMsRUFBbEI7QUFDRCxLQUZELE1BRUs7QUFDSCxXQUFLLE9BQUwsQ0FBYSxJQUFiLENBQWtCLEtBQUssS0FBdkI7QUFDQSxXQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLEVBQUMsUUFBTyxDQUFSLEVBQVUsT0FBTSxLQUFLLElBQUwsQ0FBVSxLQUFWLEdBQWdCLEtBQUssR0FBTCxDQUFTLEtBQVQsRUFBaEMsRUFBaUQsUUFBTyxNQUF4RCxFQUFsQjtBQUNEO0FBQ0YsR0FQRDtBQVFBLE9BQUssT0FBTCxDQUFhLENBQWI7QUFDRDs7Ozs7QUNsSUQ7QUFDQSxJQUFJLFVBQVEsUUFBUSxjQUFSLEVBQXdCLE1BQXhCLEVBQVo7QUFDQSxJQUFJLFFBQU0sUUFBUSxZQUFSLEVBQXNCLE1BQXRCLEVBQVY7QUFDQSxJQUFJLFNBQU8sUUFBUSxhQUFSLEVBQXVCLE1BQXZCLENBQThCLE9BQTlCLEVBQXNDLEtBQXRDLENBQVg7QUFDQSxJQUFJLFlBQVUsUUFBUSxnQkFBUixFQUEwQixNQUExQixDQUFpQyxPQUFqQyxFQUF5QyxLQUF6QyxDQUFkO0FBQ0EsSUFBSSxTQUFPLFFBQVEsYUFBUixFQUF1QixNQUF2QixDQUE4QixPQUE5QixFQUFzQyxLQUF0QyxDQUFYO0FBQ0EsSUFBSSxRQUFNLFFBQVEsWUFBUixFQUFzQixNQUF0QixDQUE2QixPQUE3QixFQUFxQyxLQUFyQyxDQUFWO0FBQ0EsSUFBSSxlQUFhO0FBQ2YsVUFBTyxNQURRO0FBRWYsYUFBVSxTQUZLO0FBR2YsVUFBTyxNQUhRO0FBSWYsU0FBTSxLQUpTO0FBS2YsVUFBTyxnQkFBUyxJQUFULEVBQWMsT0FBZCxFQUFzQixLQUF0QixFQUE0QjtBQUNqQyxRQUFHLENBQUMsS0FBSixFQUNFLFFBQU0sRUFBRSxNQUFGLENBQU47QUFDRixXQUFPLElBQUksS0FBSyxJQUFMLENBQUosQ0FBZSxLQUFmLEVBQXFCLE9BQXJCLENBQVA7QUFDRDtBQVRjLENBQWpCO0FBV0EsT0FBTyxZQUFQLEdBQW9CLFlBQXBCO0FBQ0EsUUFBUSxHQUFSLENBQVksWUFBWjs7Ozs7QUNuQkEsUUFBUSxNQUFSLEdBQWUsWUFBVTtBQUN2QixTQUFPLEtBQVA7QUFDRCxDQUZEO0FBR0EsSUFBSSxRQUFNO0FBQ1IsUUFBSztBQURHLENBQVY7O0FBS0EsRUFBRSxRQUFGLEVBQVksS0FBWixDQUFrQixZQUFVO0FBQzFCLElBQUUsUUFBRixFQUFZLEVBQVosQ0FBZSxnQ0FBZixFQUFnRCxVQUFTLEtBQVQsRUFBZTtBQUM3RCxVQUFNLFVBQU4sR0FBaUIsSUFBakI7QUFDQTtBQUNELEdBSEQ7QUFJQSxJQUFFLFFBQUYsRUFBWSxFQUFaLENBQWUsa0JBQWYsRUFBa0MsVUFBUyxLQUFULEVBQWU7QUFDL0MsVUFBTSxVQUFOLEdBQWlCLEtBQWpCO0FBQ0QsR0FGRDtBQUdBO0FBQ0E7QUFDQTtBQUNELENBWEQ7Ozs7O0FDUkE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQSxRQUFRLE1BQVIsR0FBZSxZQUFVO0FBQ3ZCLFdBQU8sSUFBSSxPQUFKLEVBQVA7QUFDRCxDQUZEOztBQUlBLFNBQVMsT0FBVCxHQUFrQjtBQUNoQjtBQUNBLFNBQUssUUFBTCxHQUFjLEVBQWQ7QUFDQTtBQUNBLFNBQUssSUFBTCxHQUFVLFlBQVUsQ0FBRSxDQUF0QjtBQUNEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qXHJcbnlvdSBtYWtlIHRoZSBvbkhhbmRsZXJzLmNhbGwodGhpcykgaW4gdGhlIG9iamVjdCB0aGF0IG5lZWRzIHRvIGhhdmUgaGFuZGxlcnMuXHJcbnRoZW4geW91IGNhbiBjcmVhdGUgYSBmdW5jdGlvbiBjYWxsYmFjayBmb3IgdGhhdCBvYmplY3QgdXNpbmcgb2JqZWN0Lm9uKFwiaGFuZGxlck5hbWUub3B0aW9uYWxOYW1lXCIsY2FsbGJhY2tGdW5jdGlvbigpe30pO1xyXG50aGUgb2JqZWN0IGNhbiBydW4gdGhlIGhhbmRsZSBjYWxsYmFja3MgYnkgdXNpbmcgdGhpcy5oYW5kbGUoXCJoYW5kbGVyTmFtZVwiLHBhcmFtZXRlcnNUb0ZlZWQpO1xyXG4qL1xyXG5tb2R1bGUuZXhwb3J0cz1mdW5jdGlvbigpIHtcclxuICB2YXIgZXZlbnRWZXJib3NlPWZhbHNlO1xyXG4gIGlmICghdGhpcy5vbnMpIHtcclxuICAgIHRoaXMub25zID0gW107XHJcbiAgfVxyXG4gIHRoaXMub24gPSBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaykge1xyXG4gICAgdmFyIG5hbWUgPSBuYW1lLnNwbGl0KFwiLlwiKTtcclxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgaWYgKG5hbWUubGVuZ3RoID09IDApIHtcclxuICAgICAgICB0aHJvdyAoXCJzb3JyeSwgeW91IGdhdmUgYW4gaW52YWxpZCBldmVudCBuYW1lXCIpO1xyXG4gICAgICB9IGVsc2UgaWYgKG5hbWUubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGlmICghdGhpcy5vbnNbbmFtZVswXV0pIHRoaXMub25zW25hbWVbMF1dID0gW107XHJcbiAgICAgICAgdGhpcy5vbnNbbmFtZVswXV0ucHVzaChbZmFsc2UsIGNhbGxiYWNrXSk7XHJcbiAgICAgIH1cclxuICAgICAgLy8gY29uc29sZS5sb2codGhpcy5vbnMpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhyb3cgKFwiZXJyb3IgYXQgbW91c2Uub24sIHByb3ZpZGVkIGNhbGxiYWNrIHRoYXQgaXMgbm90IGEgZnVuY3Rpb25cIik7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHRoaXMub2ZmID0gZnVuY3Rpb24obmFtZSkge1xyXG4gICAgdmFyIG5hbWUgPSBuYW1lLnNwbGl0KFwiLlwiKTtcclxuICAgIGlmIChuYW1lLmxlbmd0aCA+IDEpIHtcclxuICAgICAgaWYgKCF0aGlzLm9uc1tuYW1lWzBdXSkgdGhpcy5vbnNbbmFtZVswXV0gPSBbXTtcclxuICAgICAgLy8gY29uc29sZS5sb2coXCJwcmV2XCIsdGhpcy5vbnNbbmFtZVswXV0pO1xyXG4gICAgICB0aGlzLm9uc1tuYW1lWzBdXS5zcGxpY2UodGhpcy5vbnNbbmFtZVswXV0uaW5kZXhPZihuYW1lWzFdKSwgMSk7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKFwidGhlblwiLHRoaXMub25zW25hbWVbMF1dKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IChcInNvcnJ5LCB5b3UgZ2F2ZSBhbiBpbnZhbGlkIGV2ZW50IG5hbWVcIiArIG5hbWUpO1xyXG4gICAgfVxyXG4gIH1cclxuICB0aGlzLmhhbmRsZSA9IGZ1bmN0aW9uKGZuYW1lLCBwYXJhbXMpIHtcclxuICAgIGlmKGV2ZW50VmVyYm9zZSkgY29uc29sZS5sb2coXCJFdmVudCBcIitmbmFtZStcIjpcIix7Y2FsbGVyOnRoaXMscGFyYW1zOnBhcmFtc30pO1xyXG4gICAgaWYgKHRoaXMub25zW2ZuYW1lXSkge1xyXG4gICAgICBmb3IgKHZhciBuIGluIHRoaXMub25zW2ZuYW1lXSkge1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMub25zW2ZuYW1lXVtuXVsxXSk7XHJcbiAgICAgICAgdGhpcy5vbnNbZm5hbWVdW25dWzFdKHBhcmFtcyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn07IiwidmFyIHN5bmNtYW4sbW91c2U7XHJcbmV4cG9ydHMuZW5hYmxlPWZ1bmN0aW9uKHNtYW4sbSl7XHJcbiAgc3luY21hbj1zbWFuO1xyXG4gIG1vdXNlPW07XHJcbiAgcmV0dXJuIEJ1dHRvbjtcclxufTtcclxuZnVuY3Rpb24gQnV0dG9uKHBhcmVudCxvcHRpb25zKXtcclxuICAvL215IHJlZmVyZW5jZSBudW1iZXIgZm9yIGRhdGEgYmluZGluZy4gV2l0aCB0aGlzIG51bWJlciB0aGUgc29ja2V0IGJpbmRlciBrbm93cyB3aG8gaXMgdGhlIHJlY2lldmVyIG9mIHRoZSBkYXRhLCBhbmQgYWxzbyB3aXRoIHdoYXQgbmFtZSB0byBzZW5kIGl0XHJcbiAgLy9wZW5kYW50OiB0aGlzIGNhbiBwb3RlbnRpYWxseSBjcmVhdGUgYSBwcm9ibGVtLCBiZWNhdXNlIHR3byBvYmplY3RzIGNhbiBiZSBjcmVhdGVkIHNpbXVsdGFuZW91c2x5IGF0IGRpZmZlcmVudCBlbmRzIGF0IHRoZSBzYW1lIHRpbWUuXHJcbiAgLy9tYXliZSBpbnN0ZWFkIG9mIHRoZSBzaW1wbGUgcHVzaCwgdGhlcmUgY291bGQgYmUgYSBjYWxsYmFjaywgYWRuIHRoZSBvYmplY3Qgd2FpdHMgdG8gcmVjZWl2ZSBpdCdzIHNvY2tldCBpZCBvbmNlIGl0cyBjcmVhdGlvbiB3YXMgcHJvcGFnYXRlZCB0aHJvdWdob3V0IGFsbCB0aGUgbmV0d29yaywgb3IgbWF5YmUgdGhlcmUgaXMgYW4gYXJyYXkgZm9yIHNlbnRpbmcgYW5kIG90aGVyIGRpZmZlcmVudCBmb3IgcmVjZWl2aW5nLi4uIGZpcnN0IG9wdGlvbiBzZWVtcyBtb3JlIHNlbnNpYmxlXHJcbiAgdGhpcy5kYXRhPXt2YWx1ZTowfTtcclxuICB0aGlzLnN0YXRlcz1mYWxzZTtcclxuICB0aGlzLl9iaW5kTj1zeW5jbWFuLmJpbmRMaXN0LnB1c2godGhpcyktMTtcclxuICB0aGlzLiRqcT0kKCc8ZGl2IGNsYXNzPVwibXMtYnV0dG9uXCI+PC9kaXY+Jyk7XHJcbiAgdGhpcy5sYWJlbD1vcHRpb25zLmxhYmVsfHxcIuKYu1wiO1xyXG4gIHRoaXMuJGpxLmFwcGVuZCh0aGlzLiRmYWRlcmpxKTtcclxuICB0aGlzLiRqcS5odG1sKHRoaXMubGFiZWwpO1xyXG4gIGlmKG9wdGlvbnMuY3NzKVxyXG4gICAgdGhpcy4kanEuY3NzKG9wdGlvbnMuY3NzKTtcclxuICB0aGlzLmNzcz1mdW5jdGlvbihjc3Mpe1xyXG4gICAgdGhpcy4kanEuY3NzKG9wdGlvbnMuY3NzKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuICAvL2lmIGEgc3dpdGNoIHZhcmlhYmxlIGlzIHBhc3NlZCwgdGhpcyBidXR0b24gd2lsbCBzd2l0Y2ggb24gZWFjaCBjbGljayBhbW9uZyB0aGUgc3RhdGVkIHN0YXRlc1xyXG4gIGlmKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoXCJzd2l0Y2hcIikpe1xyXG4gICAgdGhpcy5zdGF0ZXM9W107XHJcbiAgICB0aGlzLmRhdGEuY3VycmVudFN0YXRlPTA7XHJcbiAgICB0aGlzLnN0YXRlcz1vcHRpb25zLnN3aXRjaDtcclxuICAgIHRoaXMuc3dpdGNoU3RhdGUoMCk7XHJcbiAgfVxyXG4gIHRoaXMub25DbGlja0NhbGxiYWNrPWZ1bmN0aW9uKCl7fTtcclxuICB0aGlzLm9uUmVsZWFzZUNhbGxiYWNrPWZ1bmN0aW9uKCl7fTtcclxuICAvL3BlbmRhbnQ6IHRoaXMgc2hvdWxkIGJlIHBhcnQgb2YgYSBiYXNlIHByb3RvdHlwZSwgbm90IHJlcGVhdGVkIGluIGVhY2ggdHlwZVxyXG4gIGlmKHR5cGVvZiAocGFyZW50LmFwcGVuZHx8ZmFsc2UpPT1cImZ1bmN0aW9uXCIpe1xyXG4gICAgcGFyZW50LmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgfWVsc2UgaWYodHlwZW9mIChwYXJlbnQuJGpxLmFwcGVuZHx8ZmFsc2UpPT1cImZ1bmN0aW9uXCIpe1xyXG4gICAgcGFyZW50LiRqcS5hcHBlbmQodGhpcy4kanEpO1xyXG4gIH1lbHNle1xyXG4gICAgY29uc29sZS5sb2coXCJhIHNsaWRlciBjb3VsZG4ndCBmaW5kIGRvbSBlbGVtZW50IHRvIGF0dGFjaCBoaW1zZWxmXCIpO1xyXG4gIH1cclxuICB2YXIgbWU9dGhpcztcclxuICAvLyB0aGlzLm9uQ2hhbmdlPWZ1bmN0aW9uKGNhbGxiYWNrKXtcclxuICAvLyAgIG1lLm9uQ2xpY2tDYWxsYmFjaz1mdW5jdGlvbigpe2NhbGxiYWNrKG1lLmRhdGEpfTtcclxuICAvLyAgIHJldHVybiB0aGlzO1xyXG4gIC8vIH1cclxuXHJcbiAgdGhpcy4kanEub24oXCJtb3VzZWRvd24gdGFwIHRvdWNoc3RhcnRcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBtZS5vbkNsaWNrQ2FsbGJhY2sobWUuZGF0YSk7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgbWUuc3dpdGNoU3RhdGUoKTtcclxuICAgIG1lLmFkZENsYXNzKFwiYWN0aXZlXCIpO1xyXG4gIH0pO1xyXG4gIHRoaXMuJGpxLm9uKFwibW91c2V1cCBtb3VzZWxlYXZlXCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgbWUub25SZWxlYXNlQ2FsbGJhY2sobWUuZGF0YSk7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgbWUucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIik7XHJcbiAgfSk7XHJcbn1cclxuXHJcbkJ1dHRvbi5wcm90b3R5cGUudXBkYXRlRG9tPWZ1bmN0aW9uKCl7XHJcbiAgdGhpcy4kanEuaHRtbCh0aGlzLmxhYmVsKTtcclxufVxyXG5cclxuQnV0dG9uLnByb3RvdHlwZS5vbkNsaWNrPWZ1bmN0aW9uKGNhbGxiYWNrKXtcclxuICB0aGlzLm9uQ2xpY2tDYWxsYmFjaz1jYWxsYmFjaztcclxuICByZXR1cm4gdGhpcztcclxufVxyXG5CdXR0b24ucHJvdG90eXBlLm9uUmVsZWFzZT1mdW5jdGlvbihjYWxsYmFjayl7XHJcbiAgdGhpcy5vblJlbGVhc2VDYWxsYmFjaz1jYWxsYmFjaztcclxuICByZXR1cm4gdGhpcztcclxufVxyXG5CdXR0b24ucHJvdG90eXBlLnN3aXRjaFN0YXRlPWZ1bmN0aW9uKHRvKXtcclxuICBpZih0aGlzLnN0YXRlcyl7XHJcbiAgICAvL2NoYW5nZSBzdGF0ZSBudW1iZXIgdG8gbmV4dFxyXG4gICAgaWYodG8pe1xyXG4gICAgICB0aGlzLmRhdGEuY3VycmVudFN0YXRlPXRvJXRoaXMuc3RhdGVzLmxlbmd0aDtcclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLmRhdGEuY3VycmVudFN0YXRlPSh0aGlzLmRhdGEuY3VycmVudFN0YXRlKzEpJXRoaXMuc3RhdGVzLmxlbmd0aDtcclxuICAgIH1cclxuICAgIC8vYXBwbHkgYWxsIHRoZSBwcm9wZXJ0aWVzIHRoYXQgdGhlIHN0YXRlIGNhcnJ5LiBUaGlzIG1ha2VzIHRoZSBidXR0b24gc3VwZXIgaGFja2FibGVcclxuICAgIGZvcihhIGluIHRoaXMuc3RhdGVzW3RoaXMuZGF0YS5jdXJyZW50U3RhdGVdKXtcclxuICAgICAgdGhpc1thXT10aGlzLnN0YXRlc1t0aGlzLmRhdGEuY3VycmVudFN0YXRlXVthXTtcclxuICAgICAgLy8gY29uc29sZS5sb2coXCJbXCIrYStcIl1cIix0aGlzW2FdKTtcclxuICAgIH1cclxuICB9XHJcbiAgdGhpcy51cGRhdGVEb20oKTtcclxufVxyXG4vL2FsaWFzaW5nIG9mIHRoZXNlIHR3byBoYW5keSBmdW5jdGlvblxyXG5CdXR0b24ucHJvdG90eXBlLmFkZENsYXNzPWZ1bmN0aW9uKHRvKXtcclxuICB0aGlzLiRqcS5hZGRDbGFzcyh0byk7XHJcbn1cclxuQnV0dG9uLnByb3RvdHlwZS5yZW1vdmVDbGFzcz1mdW5jdGlvbih0byl7XHJcbiAgdGhpcy4kanEucmVtb3ZlQ2xhc3ModG8pO1xyXG59IiwiXHJcbnZhciBzeW5jbWFuLG1vdXNlO1xyXG52YXIgT0g9cmVxdWlyZShcIm9uaGFuZGxlcnNcIik7XHJcbmV4cG9ydHMuZW5hYmxlPWZ1bmN0aW9uKHNtYW4sbSl7XHJcbiAgc3luY21hbj1zbWFuO1xyXG4gIG1vdXNlPW07XHJcbiAgcmV0dXJuIENsb2NrO1xyXG59O1xyXG5mdW5jdGlvbiBDbG9jayhwYXJlbnQsb3B0aW9ucyl7XHJcbiAgT0guY2FsbCh0aGlzKTtcclxuICB2YXIgdGhpc0Nsb2NrPXRoaXM7XHJcbiAgdGhpcy5kYXRhPXt2YWx1ZTowfTtcclxuICB0aGlzLnN0YXRlcz1mYWxzZTtcclxuICB0aGlzLl9iaW5kTj1zeW5jbWFuLmJpbmRMaXN0LnB1c2godGhpcyktMTtcclxuICB0aGlzLiRqcT0kKCc8ZGl2IGNsYXNzPVwibXMtY2xvY2sgbXMtYnV0dG9uXCI+PC9kaXY+Jyk7XHJcbiAgdGhpcy5sYWJlbD1vcHRpb25zLmxhYmVsfHwn4oiGJztcclxuICB0aGlzLiRqcS5hcHBlbmQodGhpcy4kZmFkZXJqcSk7XHJcbiAgdGhpcy4kanEuaHRtbCh0aGlzLmxhYmVsKTtcclxuICBpZihvcHRpb25zLmNzcylcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgdGhpcy5jc3M9ZnVuY3Rpb24oY3NzKXtcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgLy9wZW5kYW50OiB0aGlzIHNob3VsZCBiZSBwYXJ0IG9mIGEgYmFzZSBwcm90b3R5cGUsIG5vdCByZXBlYXRlZCBpbiBlYWNoIHR5cGVcclxuICBpZih0eXBlb2YgKHBhcmVudC5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC5hcHBlbmQodGhpcy4kanEpO1xyXG4gIH1lbHNlIGlmKHR5cGVvZiAocGFyZW50LiRqcS5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC4kanEuYXBwZW5kKHRoaXMuJGpxKTtcclxuICB9ZWxzZXtcclxuICAgIGNvbnNvbGUubG9nKFwiYSBjbG9jayBjb3VsZG4ndCBmaW5kIGRvbSBlbGVtZW50IHRvIGF0dGFjaCBoaW1zZWxmXCIpO1xyXG4gIH1cclxuICB2YXIgbWU9dGhpcztcclxuICB0aGlzLnRpY2s9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXNDbG9jay5oYW5kbGUoXCJ0aWNrXCIpO1xyXG4gICAgdGhpc0Nsb2NrLmFkZENsYXNzKFwidGlja1wiKTtcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXt0aGlzQ2xvY2sucmVtb3ZlQ2xhc3MoXCJ0aWNrXCIpO30sMjApO1xyXG4gIH1cclxuICBzZXRJbnRlcnZhbCh0aGlzLnRpY2ssb3B0aW9ucy5pbnRlcnZhbHw1MDApO1xyXG59XHJcblxyXG5DbG9jay5wcm90b3R5cGUudXBkYXRlRG9tPWZ1bmN0aW9uKCl7XHJcbiAgdGhpcy4kanEuaHRtbCh0aGlzLmxhYmVsKTtcclxufVxyXG5cclxuXHJcblxyXG4vL2FsaWFzaW5nIG9mIHRoZXNlIHR3byBoYW5keSBmdW5jdGlvblxyXG5DbG9jay5wcm90b3R5cGUuYWRkQ2xhc3M9ZnVuY3Rpb24odG8pe1xyXG4gIHRoaXMuJGpxLmFkZENsYXNzKHRvKTtcclxufVxyXG5DbG9jay5wcm90b3R5cGUucmVtb3ZlQ2xhc3M9ZnVuY3Rpb24odG8pe1xyXG4gIHRoaXMuJGpxLnJlbW92ZUNsYXNzKHRvKTtcclxufSIsImxldCBlZW1pdGVyPXJlcXVpcmUoJ29uaGFuZGxlcnMnKTtcclxudmFyIHN5bmNtYW4sbW91c2U7XHJcbi8vIHZhciAkO1xyXG5leHBvcnRzLmVuYWJsZT1mdW5jdGlvbihzbWFuLG0pe1xyXG4gIHN5bmNtYW49c21hbjtcclxuICBtb3VzZT1tO1xyXG5cclxuICByZXR1cm4gU2VxdWVuY2VyO1xyXG59O1xyXG4vKipcclxuICogQSBnZW5lcmF0b3Igb2Ygc2VxdWVuY2Vyc1xyXG4gKlxyXG4gKiBAY2xhc3MgU2VxdWVuY2VyQnV0dG9uXHJcbiAqIEBjb25zdHJ1Y3RvciBuZXcgTXNDb21wb25lbnRzLlNlcXVlbmNlcihET00vSnF1ZXJ5IGVsZW1lbnQse3Byb3BlcnRpZXN9KVxyXG4gKi9cclxuZnVuY3Rpb24gU2VxdWVuY2VyQnV0dG9uKG4scGFyZW50KXtcclxuICBlZW1pdGVyLmNhbGwodGhpcyk7XHJcbiAgdGhpcy5vbihcInRlc3RcIixmdW5jdGlvbigpe2NvbnNvbGUubG9nKFwid29ya3MhXCIpfSk7XHJcbiAgdGhpcy5oYW5kbGUoXCJ0ZXN0XCIpO1xyXG4gIHRoaXMuanE9JCgnPGRpdiBjbGFzcz1cInNlcWJ1dHRvblwiPjwvZGl2PicpO1xyXG4gIHRoaXMuX2JpbmROPXN5bmNtYW4uYmluZExpc3QucHVzaCh0aGlzKS0xO1xyXG4gIHBhcmVudC5qcS5hcHBlbmQodGhpcy5qcSk7XHJcbiAgdGhpcy5kYXRhPTA7XHJcbiAgLy9wZW5kYW50OiBldmFsdWF0ZSB3ZXRoZXIgdGhlIHZhciBuIGlzIHN0aWxsIHVzZWZ1bC4gcmVtb3ZlIGl0IGF0IGV2ZXJ5IGVuZC5cclxuICB0aGlzLm49bjtcclxuICB2YXIgbWU9dGhpcztcclxuICB0aGlzLnNldERhdGE9ZnVuY3Rpb24odG8sZW1pdCl7XHJcbiAgICAvLyBpZihlbWl0PT10cnVlKXtcclxuICAgIC8vICAgc29ja0NoYW5nZShcInNlcWI6XCIrbWUuX2JpbmROK1wiXCIsXCJzVlwiLHRvKTtcclxuICAgIC8vIH1cclxuICAgIC8vIGNvbnNvbGUubG9nKFwic2RhdGFcIik7XHJcbiAgICAvL3NvY2tldCBtYXkgc2V0IGRhdGEgdG8gMCB3aGVuIGlzIGFscmVhZHkgMCwgZ2VuZXJhdGluZyBkaXNwbGFjZSBvZiBwYXJlbnQncyBhbGl2ZWRoaWxkXHJcbiAgICBpZih0byE9dGhpcy5kYXRhKXtcclxuICAgICAgaWYodG89PTEpe1xyXG4gICAgICAgIHRoaXMuZGF0YT0xO1xyXG4gICAgICAgIHRoaXMuanEuYWRkQ2xhc3MoXCJvblwiKTtcclxuICAgICAgICBwYXJlbnQuYWxpdmVDaGlsZCsrO1xyXG4gICAgICB9XHJcbiAgICAgIGlmKHRvPT0wKXtcclxuICAgICAgICB0aGlzLmRhdGE9MDtcclxuICAgICAgICB0aGlzLmpxLnJlbW92ZUNsYXNzKFwib25cIik7XHJcbiAgICAgICAgcGFyZW50LmFsaXZlQ2hpbGQtLTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gY29uc29sZS5sb2cocGFyZW50LmFsaXZlQ2hpbGQpO1xyXG4gIH1cclxuICB0aGlzLmpxLm9uKFwibW91c2Vkb3duIHRhcCB0b3VjaHN0YXJ0XCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIG1lLnNldERhdGEoTWF0aC5hYnMobWUuZGF0YS0xKSx0cnVlKTtcclxuICAgIC8vIG1lLmRhdGE9O1xyXG4gICAgaWYobWUuZGF0YT09MSl7XHJcbiAgICAgICBtb3VzZS5zd2l0Y2hpbmc9dHJ1ZTtcclxuICAgIH1lbHNle1xyXG4gICAgLy8gICAkKHRoaXMpLnJlbW92ZUNsYXNzKFwib25cIik7XHJcbiAgICAvLyAgIHBhcmVudC5hbGl2ZUNoaWxkLS07XHJcbiAgICAgICBtb3VzZS5zd2l0Y2hpbmc9ZmFsc2U7XHJcbiAgICAgfVxyXG4gIH0pO1xyXG4gIHRoaXMuanEub24oXCJtb3VzZWVudGVyIHRvdWNoZW50ZXJcIixmdW5jdGlvbigpe1xyXG4gICAgaWYobW91c2UuYnV0dG9uRG93bil7XHJcbiAgICAgIGlmKG1vdXNlLnN3aXRjaGluZyl7XHJcbiAgICAgICAgaWYobWUuZGF0YT09MCl7XHJcbiAgICAgICAgICBtZS5zZXREYXRhKDEsdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ZWxzZXtcclxuICAgICAgICBpZihtZS5kYXRhPT0xKXtcclxuICAgICAgICAgIG1lLnNldERhdGEoMCx0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxuICB0aGlzLmV2YWw9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBqcT10aGlzLmpxO1xyXG4gICAganEuYWRkQ2xhc3MoXCJ0dXJuXCIpO1xyXG4gICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAganEucmVtb3ZlQ2xhc3MoXCJ0dXJuXCIpO1xyXG4gICAgfSwyMDApO1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YTtcclxuICB9XHJcbn1cclxuLy9kZWZpbmVzIGFsbCB0aGUgc2VxdWVuY2VyIHBhcmFtZXRlcnMgYnkgbWF0aCxcclxuLy9tYXliZSBpbiBhIGZ1bnR1cmUgYnkgc3R5bGluZyB0YWJsZVxyXG52YXIgc2VxUHJvZz00O1xyXG5mdW5jdGlvbiBTZXF1ZW5jZXIocGFyZW50LG9wdGlvbnMpe1xyXG4gIHZhciBuPW9wdGlvbnMubnx8MztcclxuICB0aGlzLmpxPSQoJzxkaXYgY2xhc3M9XCJzZXF1ZW5jZXJcIiBpZD1cInNlcV8nK24rJ1wiPjxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGVcIj48L3A+PC9kaXY+Jyk7XHJcbiAgcGFyZW50LmFwcGVuZCh0aGlzLmpxKTtcclxuICB0aGlzLmFsaXZlPWZhbHNlO1xyXG4gIHRoaXMuX2JpbmROPXN5bmNtYW4uYmluZExpc3QucHVzaCh0aGlzKS0xO1xyXG4gIHRoaXMucG9zPTA7XHJcbiAgdGhpcy5kYXRhPVtdO1xyXG4gIHRoaXMubGVuPU1hdGgucG93KDIsKHNlcVByb2clNSkrMSk7XHJcbiAgdGhpcy5ldnJ5PU1hdGgucG93KDIsKHNlcVByb2clNCkrMSk7XHJcbiAgLy9tdXN0IGNvdW50IGFuIFtldmVyeV0gYW1vdW50IG9mIGJlYXRzIGZvciBlYWNoIHBvcyBpbmNyZW1lbnQuXHJcbiAgdGhpcy5zdWJwb3M9MDtcclxuICB0aGlzLmpxLmNzcyh7d2lkdGg6MTYqTWF0aC5jZWlsKHRoaXMubGVuLzQpK1wicHhcIn0pO1xyXG4gIC8vdGhpcy5qcS5hZGRDbGFzcyhcImNvbG9yX1wiK3NlcVByb2clY2hhbm5lbHMubGVuZ3RoKTtcclxuICB0aGlzLmRpc3A9MDtcclxuICB0aGlzLmlkPW47XHJcbiAgdGhpcy5iZWF0RGlzcGxhY2U9MDtcclxuICB2YXIgbWU9dGhpcztcclxuICBzZXFQcm9nKys7XHJcbiAgLy90aGlzLmNoYW5uZWw9Y2hhbm5lbHNbdGhpcy5pZCVjaGFubmVscy5sZW5ndGhdO1xyXG4gIGZvcih2YXIgYm49MDsgYm48dGhpcy5sZW47IGJuKyspe1xyXG4gICAgdGhpcy5kYXRhW2JuXT1uZXcgU2VxdWVuY2VyQnV0dG9uKGJuLHRoaXMpXHJcbiAgfVxyXG4gIHRoaXMuYWxpdmVDaGlsZD0wO1xyXG4gIHRoaXMuZGlzcGxhY2U9MDtcclxuICB0aGlzLnNldERpc3BsYWNlPWZ1bmN0aW9uKHRvLGVtaXQpe1xyXG4gICAgaWYoZW1pdD09XCJvbmx5XCIpe1xyXG4gICAgICBlbWl0PXRydWU7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdGhpcy5zdWJwb3M9KCh0cmFuc3BvcnRDdXJyZW50U3RlcCklKHRoaXMubGVuKnRoaXMuZXZyeSkpK3RvO1xyXG4gICAgfVxyXG4gICAgaWYoZW1pdD09dHJ1ZSl7XHJcbiAgICAgIHNvY2tDaGFuZ2UoXCJzZXE6XCIrbWUuX2JpbmROK1wiXCIsXCJkc3BsXCIsdG8pO1xyXG4gICAgfVxyXG4gIH1cclxuICB0aGlzLnN0ZXA9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBwcmV2YWxpdmU9dGhpcy5hbGl2ZTtcclxuICAgIHRoaXMuYWxpdmU9dGhpcy5hbGl2ZUNoaWxkPjA7XHJcbiAgICBpZih0aGlzLmFsaXZlKXtcclxuICAgICAgLy9pZiB0aGUgc3RhdGUgb2YgdGhpcy5hbGl2ZSBjaGFuZ2VzLCB3ZSBtdXN0IGVtaXQgdGhlIGRpc3BsYWNlbWVudCwgYmVjYXVzZSBpdCBpcyBuZXdcclxuICAgICAgaWYoIXByZXZhbGl2ZSl7XHJcbiAgICAgICAgdGhpcy5kaXNwbGFjZT0odHJhbnNwb3J0Q3VycmVudFN0ZXArdGhpcy5zdWJwb3MpJSh0aGlzLmxlbip0aGlzLmV2cnkpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwib2suIGVtaXQgZGlzcGxhZTogXCIrdGhpcy5kaXNwbGFjZSk7XHJcbiAgICAgICAgdGhpcy5zZXREaXNwbGFjZSh0aGlzLmRpc3BsYWNlLFwib25seVwiKTtcclxuICAgICAgfTtcclxuICAgICAgLy9lYWNoIHNlcXVlbmNlciBoYXMgYSBkaWZmZXJlbnQgc3BlZWQgcmF0ZXMuIHdoaWxlIHNvbWUgcGxheXMgb25lIHN0ZXAgcGVyIGNsaWNrLCBvdGhlcnMgd2lsbCBoYXZlIG9uZSBzdGVwIHBlciBzZXZlcmFsIGNsb2NrIHRpY2tzLlxyXG4gICAgICAvL3RoZSBzZXF1ZW5jZXIgc3RhcnRpbmcgcG9pbnQgaXMgYWxzbyBkaXNwbGFjZWQsIGFuZCBpdCBkZXBlbmRzIG9uIHRoZSB0aW1lIHdoZW4gaXQgZ290IGFsaXZlZCtpdHMgcG9zaXRpb24gYXQgdGhhdCBtb21lbnQuXHJcbiAgICAgIGlmKHRoaXMuc3VicG9zJXRoaXMuZXZyeT09MCl7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJzcVwiK3RoaXMucG9zKTtcclxuICAgICAgICAvLyBkYXRhPXtzZXF1ZW5jZXI6dGhpcy5pZCxwb3M6dGhpcy5wb3Msc3RlcFZhbDp0aGlzLmRhdGFbdGhpcy5wb3NdLmV2YWwoKX07XHJcbiAgICAgICAgLy8gdGhpcy5vblN0ZXBUcmlnZ2VyKGRhdGEpO1xyXG4gICAgICAgIC8vIHN0ZXBGdW5jdGlvbihkYXRhKTtcclxuICAgICAgICB0aGlzLnBvcz0odGhpcy5zdWJwb3MvdGhpcy5ldnJ5KSUodGhpcy5sZW4pO1xyXG4gICAgICAgIGlmKHRoaXMuZGF0YVt0aGlzLnBvc10uZXZhbCgpPT0xKXtcclxuICAgICAgICAgIC8vIHRoaXMuY2hhbm5lbC5lbmdpbmUuc3RhcnQoMCx0aGlzLmNoYW5uZWwuc3RhcnRPZmZzZXQsdGhpcy5jaGFubmVsLmVuZFRpbWUpO1xyXG4gICAgICAgICAgLy9zbywgdGhpcyBpcyBjYWxsZWQgZWxzZXdoZXJlIGFzd2VsbGwuLi4uIHRoZSBjaGFubmVsIHNob3VsZCBoYXZlIGEgdHJpZ2dlciBmdW5jdGlvblxyXG4gICAgICAgICAgdmFyIGxvb3BTdGFydD10aGlzLmNoYW5uZWwuc3RhcnRPZmZzZXQ7XHJcbiAgICAgICAgICB2YXIgbG9vcEVuZD10aGlzLmNoYW5uZWwuZW5kVGltZTtcclxuICAgICAgICAgIHRoaXMuY2hhbm5lbC5zYW1wbGVyLnRyaWdnZXJBdHRhY2soZmFsc2UsMCwxLHtzdGFydDpsb29wU3RhcnQsZW5kOmxvb3BFbmR9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICB9XHJcbiAgICAgIC8vd2hhdCBpcyBtb3JlIGVjb25vbWljPz9cclxuICAgICAgLy8gdGhpcy5zdWJwb3M9KHRoaXMuc3VicG9zKzEpJSh0aGlzLmxlbip0aGlzLmV2cnkpO1xyXG4gICAgICAvL2kgZ3Vlc3MgdGhhdC4uIGJ1dCBpdCBjYW4gZ3JvdyBldGVybmFsbHlcclxuICAgICAgdGhpcy5zdWJwb3MrKztcclxuICAgIH1cclxuICB9XHJcbiAgdGhpcy5kaWU9ZnVuY3Rpb24oKXtcclxuICAgIGZvcih2YXIgYm4gaW4gdGhpcy5kYXRhKXtcclxuICAgICAgdGhpcy5kYXRhW2JuXS5zZXREYXRhKDApO1xyXG4gICAgfVxyXG4gICAgdGhpcy5hbGl2ZT1mYWxzZTtcclxuICAgIHRoaXMuanEuZGV0YWNoKCk7XHJcbiAgfVxyXG4gIC8vIHRoaXMub25TdGVwVHJpZ2dlcj1mdW5jdGlvbihkYXRhKXtcclxuICAvLyAgIC8vIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gIC8vIH1cclxuICB0aGlzLmpxLm9uKFwibW91c2VlbnRlclwiLGZ1bmN0aW9uKCl7XHJcbiAgICBmb2N1c0NoYW5uZWwobWUuY2hhbm5lbC5pZCk7XHJcbiAgfSk7XHJcbn0iLCIvKlxyXG5UaGlzIHNjcmlwdCBjcmVhdGUgRE9NIHNsaWRlcnMgdGhhdCBjYW4gYmUgdXNlZCBpbiB3ZWIgYnJvd3NlciB0byBjb250cm9sIHN0dWZmLiBUaGV5IGNhbiBiZSBzeW5jZWQgdGhyb3VnaCBzb2NrZXRzIGFuZCBvdGhlcnMgYnkgdXNpbmcgY2FsbGJhY2tzLlxyXG4gICAgQ29weXJpZ2h0IChDKSAyMDE2IEpvYXF1w61uIEFsZHVuYXRlXHJcblxyXG4gICAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcclxuICAgIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbiAgICB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4gICAgKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cclxuXHJcbiAgICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuICAgIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbiAgICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbiAgICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG5cclxuICAgIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbiAgICBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxudmFyIHN5bmNtYW4sbW91c2U7XHJcbi8vIHZhciAkO1xyXG5leHBvcnRzLmVuYWJsZT1mdW5jdGlvbihzbWFuLG0pe1xyXG4gIHN5bmNtYW49c21hbjtcclxuICBtb3VzZT1tO1xyXG4gIHJldHVybiBTbGlkZXI7XHJcbn07XHJcblxyXG4vKipcclxuKiBUaGlzIGlzIHRoZSBkZXNjcmlwdGlvbiBmb3IgU2xpZGVyIGNsYXNzXHJcbipcclxuKiBAY2xhc3MgU2xpZGVyXHJcbiogQGNvbnN0cnVjdG9yXHJcbiovXHJcbmZ1bmN0aW9uIFNsaWRlcihwYXJlbnQsb3B0aW9ucyl7XHJcbiAgLy9teSByZWZlcmVuY2UgbnVtYmVyIGZvciBkYXRhIGJpbmRpbmcuIFdpdGggdGhpcyBudW1iZXIgdGhlIHNvY2tldCBiaW5kZXIga25vd3Mgd2hvIGlzIHRoZSByZWNpZXZlciBvZiB0aGUgZGF0YSwgYW5kIGFsc28gd2l0aCB3aGF0IG5hbWUgdG8gc2VuZCBpdFxyXG4gIC8vcGVuZGFudDogdGhpcyBjYW4gcG90ZW50aWFsbHkgY3JlYXRlIGEgcHJvYmxlbSwgYmVjYXVzZSB0d28gb2JqZWN0cyBjYW4gYmUgY3JlYXRlZCBzaW11bHRhbmVvdXNseSBhdCBkaWZmZXJlbnQgZW5kcyBhdCB0aGUgc2FtZSB0aW1lLlxyXG4gIC8vbWF5YmUgaW5zdGVhZCBvZiB0aGUgc2ltcGxlIHB1c2gsIHRoZXJlIGNvdWxkIGJlIGEgY2FsbGJhY2ssIGFkbiB0aGUgb2JqZWN0IHdhaXRzIHRvIHJlY2VpdmUgaXQncyBzb2NrZXQgaWQgb25jZSBpdHMgY3JlYXRpb24gd2FzIHByb3BhZ2F0ZWQgdGhyb3VnaG91dCBhbGwgdGhlIG5ldHdvcmssIG9yIG1heWJlIHRoZXJlIGlzIGFuIGFycmF5IGZvciBzZW50aW5nIGFuZCBvdGhlciBkaWZmZXJlbnQgZm9yIHJlY2VpdmluZy4uLiBmaXJzdCBvcHRpb24gc2VlbXMgbW9yZSBzZW5zaWJsZVxyXG4gIHRoaXMuZGF0YT17dmFsdWU6MH07XHJcblxyXG4gIHRoaXMuX2JpbmROPXN5bmNtYW4uYmluZExpc3QucHVzaCh0aGlzKS0xO1xyXG4gIHRoaXMuJGpxPSQoJzxkaXYgY2xhc3M9XCJzbGlkZXItY29udGFpbmVyXCIgc3R5bGU9XCJwb3NpdGlvbjpyZWxhdGl2ZVwiPjwvZGl2PicpO1xyXG4gIHRoaXMuJGZhZGVyanE9JCgnPGRpdiBjbGFzcz1cInNsaWRlci1pbm5lclwiIHN0eWxlPVwicG9pbnRlci1ldmVudHM6bm9uZTsgcG9zaXRpb246YWJzb2x1dGVcIj48L2Rpdj4nKTtcclxuICB0aGlzLmxhYmVsPW9wdGlvbnMubGFiZWx8fFwiXCI7XHJcbiAgdGhpcy5sYWJlbGpxPSQoJzxwIGNsYXNzPVwic2xpZGVybGFiZWxcIj48L3A+Jyk7XHJcbiAgdGhpcy4kanEuYXBwZW5kKHRoaXMuJGZhZGVyanEpO1xyXG4gIHRoaXMuJGpxLmFwcGVuZCh0aGlzLmxhYmVsanEpO1xyXG4gIGlmKG9wdGlvbnMuY3NzKVxyXG4gICAgdGhpcy4kanEuY3NzKG9wdGlvbnMuY3NzKTtcclxuICB0aGlzLmNzcz1mdW5jdGlvbihjc3Mpe1xyXG4gICAgdGhpcy4kanEuY3NzKGNzcyk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgdGhpcy5vbkNoYW5nZUNhbGxiYWNrPWZ1bmN0aW9uKCl7fTtcclxuICAvL3BlbmRhbnQ6IHRoaXMgc2hvdWxkIGJlIHBhcnQgb2YgYSBiYXNlIHByb3RvdHlwZSwgbm90IHJlcGVhdGVkIGluIGVhY2ggdHlwZVxyXG4gIGlmKHR5cGVvZiAocGFyZW50LmFwcGVuZHx8ZmFsc2UpPT1cImZ1bmN0aW9uXCIpe1xyXG4gICAgcGFyZW50LmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgfWVsc2UgaWYodHlwZW9mIChwYXJlbnQuJGpxLmFwcGVuZHx8ZmFsc2UpPT1cImZ1bmN0aW9uXCIpe1xyXG4gICAgcGFyZW50LiRqcS5hcHBlbmQodGhpcy4kanEpO1xyXG4gIH1lbHNle1xyXG4gICAgY29uc29sZS5sb2coXCJhIHNsaWRlciBjb3VsZG4ndCBmaW5kIGRvbSBlbGVtZW50IHRvIGF0dGFjaCBoaW1zZWxmXCIpO1xyXG4gIH1cclxuICB2YXIgbWU9dGhpcztcclxuICB0aGlzLm9uQ2hhbmdlPWZ1bmN0aW9uKGNhbGxiYWNrKXtcclxuICAgIG1lLm9uQ2hhbmdlQ2FsbGJhY2s9ZnVuY3Rpb24oKXtjYWxsYmFjayhtZS5kYXRhKX07XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgLyoqXHJcbiogTXkgbWV0aG9kIGRlc2NyaXB0aW9uLiAgTGlrZSBvdGhlciBwaWVjZXMgb2YgeW91ciBjb21tZW50IGJsb2NrcyxcclxuKiB0aGlzIGNhbiBzcGFuIG11bHRpcGxlIGxpbmVzLlxyXG4qXHJcbiogQG1ldGhvZCBtZXRob2ROYW1lXHJcbiogQHBhcmFtIHtTdHJpbmd9IGZvbyBBcmd1bWVudCAxXHJcbiogQHBhcmFtIHtPYmplY3R9IGNvbmZpZyBBIGNvbmZpZyBvYmplY3RcclxuKiBAcGFyYW0ge1N0cmluZ30gY29uZmlnLm5hbWUgVGhlIG5hbWUgb24gdGhlIGNvbmZpZyBvYmplY3RcclxuKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb25maWcuY2FsbGJhY2sgQSBjYWxsYmFjayBmdW5jdGlvbiBvbiB0aGUgY29uZmlnIG9iamVjdFxyXG4qIEBwYXJhbSB7Qm9vbGVhbn0gW2V4dHJhPWZhbHNlXSBEbyBleHRyYSwgb3B0aW9uYWwgd29ya1xyXG4qIEByZXR1cm4ge0Jvb2xlYW59IFJldHVybnMgdHJ1ZSBvbiBzdWNjZXNzXHJcbiovXHJcbiAgdGhpcy5zZXREYXRhPWZ1bmN0aW9uKHRvLGVtaXQpe1xyXG4gICAgaWYoZW1pdD09PXRydWUpe1xyXG4gICAgICAvL3BlbmRhbnQ6IGluIHNlcXVlbmNlcnMgd2UgdXNlIHBhcmVudC5pZCwgYW5kIGhlcmUgd2UgdXNlIF9iaW5kTi4gVG93YXJkcyBhIGNvbnRyb2xsZXIgQVBJIGFuZCBhIG1vcmUgc2Vuc2ljYWwgY29kZSwgSSB0aGluayBib3RoIHNob3VsZCB1c2UgdGhlIGJpbmQgZWxlbWVudCBhcnJheS4gcmVhZCBub3RlIGluIGZpcnN0IGxpbmUgb2YgdGhpcyBmaWxlLlxyXG4gICAgICAvL3BlbmRhbnQ6IHBhcmVudCBpbiBzZXEgaXMgd2hhdCBtZSBpcyBoZXJlLiB0aGlzIGlzIHByZXR0eSBjb25mdXNpbmcgdmFyIG5hbWUgZGVjaXNpb25cclxuICAgICAgc3luY21hbi5lbWl0KFwic2xpZDpcIittZS5fYmluZE4rXCJcIixcInNWXCIsdG8pO1xyXG4gICAgfVxyXG4gICAgdGhpcy5kYXRhLnZhbHVlPXRvO1xyXG4gICAgdGhpcy5vbkNoYW5nZUNhbGxiYWNrKCk7XHJcbiAgICB0aGlzLnVwZGF0ZURvbSgpO1xyXG4gIH1cclxuICB0aGlzLmFkZENsYXNzPWZ1bmN0aW9uKHRvKXtcclxuICAgIHRoaXMuJGpxLmFkZENsYXNzKHRvKTtcclxuICB9XHJcbiAgdGhpcy52ZXJ0aWNhbD1vcHRpb25zLnZlcnRpY2FsfHx0cnVlO1xyXG4gIHRoaXMuYWRkQ2xhc3MoXCJ2ZXJ0aWNhbFwiKTtcclxuICB0aGlzLiRqcS5vbihcIm1vdXNlZG93biB0YXAgdG91Y2hzdGFydFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBpZihtZS52ZXJ0aWNhbCl7XHJcbiAgICAgIG1lLnNldERhdGEoMS1ldmVudC5vZmZzZXRZL21lLiRqcS5oZWlnaHQoKSx0cnVlKTsvLyx0cnVlXHJcbiAgICB9ZWxzZXtcclxuICAgICAgbWUuc2V0RGF0YShldmVudC5vZmZzZXRYL21lLiRqcS53aWR0aCgpLHRydWUpOy8vLHRydWVcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgdGhpcy4kanEub24oXCJtb3VzZW1vdmUgdG91Y2hlbnRlciBtb3VzZWxlYXZlIG1vdXNldXBcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBpZihtb3VzZS5idXR0b25Eb3duKXtcclxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgdmFyIGVtaXRUaGlzPWV2ZW50LnR5cGU9PVwibW91c2VsZWF2ZVwifHxldmVudC50eXBlPT1cIm1vdXNldXBcIlxyXG4gICAgICBpZihtZS52ZXJ0aWNhbCl7XHJcbiAgICAgICAgLy90aGUgc3RyYW5nZSBzZWNvbmQgcGFyYW1lbnRlciBpbiBzZXRkYXRhIHdhcyB0cnVlLCBidXQgaXQgY291bGQgY2xvZyB0aGUgc29ja2V0XHJcbiAgICAgICAgbWUuc2V0RGF0YSgxLWV2ZW50Lm9mZnNldFkvbWUuJGpxLmhlaWdodCgpLGVtaXRUaGlzKTsvLyx0cnVlXHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIG1lLnNldERhdGEoZXZlbnQub2Zmc2V0WC9tZS4kanEud2lkdGgoKSxlbWl0VGhpcyk7Ly8sdHJ1ZVxyXG4gICAgICB9XHJcbiAgICB9ZWxzZXtcclxuICAgIH1cclxuICB9KTtcclxuICB0aGlzLmV2YWw9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBqcT10aGlzLiRqcTtcclxuICAgIGpxLmFkZENsYXNzKFwidHVyblwiKTtcclxuICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgIGpxLnJlbW92ZUNsYXNzKFwidHVyblwiKTtcclxuICAgIH0sMjAwKTtcclxuICAgIHJldHVybiB0aGlzLmRhdGEudmFsdWU7XHJcbiAgfVxyXG4gIHRoaXMudXBkYXRlRG9tPWZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLnZlcnRpY2FsKXtcclxuICAgICAgdGhpcy4kZmFkZXJqcS5jc3Moe2JvdHRvbTowLHdpZHRoOlwiMTAwJVwiLGhlaWdodDp0aGlzLmRhdGEudmFsdWUqdGhpcy4kanEuaGVpZ2h0KCl9KTtcclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLmxhYmVsanEuaHRtbCh0aGlzLmxhYmVsKTtcclxuICAgICAgdGhpcy4kZmFkZXJqcS5jc3Moe2JvdHRvbTowLHdpZHRoOnRoaXMuZGF0YS52YWx1ZSp0aGlzLiRqcS53aWR0aCgpLGhlaWdodDpcIjEwMCVcIn0pO1xyXG4gICAgfVxyXG4gIH1cclxuICB0aGlzLnNldERhdGEoMCk7XHJcbn0iLCIvLyB2YXIgc3luY21hbj17fTtcclxudmFyIHN5bmNtYW49cmVxdWlyZSgnLi9zeW5jbWFuLmpzJykuZW5hYmxlKCk7XHJcbnZhciBtb3VzZT1yZXF1aXJlKCcuL21vdXNlLmpzJykuZW5hYmxlKCk7XHJcbnZhciBTbGlkZXI9cmVxdWlyZSgnLi9TbGlkZXIuanMnKS5lbmFibGUoc3luY21hbixtb3VzZSk7XHJcbnZhciBTZXF1ZW5jZXI9cmVxdWlyZSgnLi9TZXF1ZW5jZXIuanMnKS5lbmFibGUoc3luY21hbixtb3VzZSk7XHJcbnZhciBCdXR0b249cmVxdWlyZSgnLi9CdXR0b24uanMnKS5lbmFibGUoc3luY21hbixtb3VzZSk7XHJcbnZhciBDbG9jaz1yZXF1aXJlKCcuL0Nsb2NrLmpzJykuZW5hYmxlKHN5bmNtYW4sbW91c2UpO1xyXG52YXIgTXNDb21wb25lbnRzPXtcclxuICBTbGlkZXI6U2xpZGVyLFxyXG4gIFNlcXVlbmNlcjpTZXF1ZW5jZXIsXHJcbiAgQnV0dG9uOkJ1dHRvbixcclxuICBDbG9jazpDbG9jayxcclxuICBjcmVhdGU6ZnVuY3Rpb24od2hhdCxvcHRpb25zLHdoZXJlKXtcclxuICAgIGlmKCF3aGVyZSlcclxuICAgICAgd2hlcmU9JChcImJvZHlcIik7XHJcbiAgICByZXR1cm4gbmV3IHRoaXNbd2hhdF0od2hlcmUsb3B0aW9ucyk7XHJcbiAgfSxcclxufTtcclxud2luZG93Lk1zQ29tcG9uZW50cz1Nc0NvbXBvbmVudHM7XHJcbmNvbnNvbGUubG9nKE1zQ29tcG9uZW50cyk7IiwiZXhwb3J0cy5lbmFibGU9ZnVuY3Rpb24oKXtcclxuICByZXR1cm4gbW91c2U7XHJcbn1cclxudmFyIG1vdXNlPXtcclxuICB0b29sOlwiZHJhd1wiXHJcbn07XHJcblxyXG5cclxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcclxuICAkKGRvY3VtZW50KS5vbihcIm1vdXNlZG93biB0b3VjaHN0YXJ0IHRvdWNobW92ZVwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIG1vdXNlLmJ1dHRvbkRvd249dHJ1ZTtcclxuICAgIC8vIGNvbnNvbGUubG9nKGV2ZW50KTtcclxuICB9KTtcclxuICAkKGRvY3VtZW50KS5vbihcIm1vdXNldXAgdG91Y2hlbmRcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBtb3VzZS5idXR0b25Eb3duPWZhbHNlO1xyXG4gIH0pO1xyXG4gIC8vIGRvY3VtZW50Lm9udG91Y2htb3ZlID0gZnVuY3Rpb24oZXZlbnQpe1xyXG4gIC8vICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAvLyB9XHJcbn0pOyIsIi8qXHJcblRoaXMgc2NyaXB0IGNvbnRhaW5zIGEgdGVtcGxhdGUgZm9yIGRhdGEtYmluZGluZyBtYW5hZ2VtZW50IGlmIHlvdSB3YW50IHRvIGRvIHNvLiBPdGhlcndpc2UsIGl0IHdpbGwganVzdCBwbGFjZWhvbGQgdmFyIG5hbWVzIHNvIHRoZXJlIGFyZSBubyB1bmRlZmluZWQgdmFycy5cclxuICAgIENvcHlyaWdodCAoQykgMjAxNiBKb2FxdcOtbiBBbGR1bmF0ZVxyXG5cclxuICAgIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbiAgICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG4gICAgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuICAgIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG4gICAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbiAgICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG4gICAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG4gICAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbiAgICBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG4gICAgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG5leHBvcnRzLmVuYWJsZT1mdW5jdGlvbigpe1xyXG4gIHJldHVybiBuZXcgU3luY21hbigpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gU3luY21hbigpe1xyXG4gIC8vbGlzdCBvZiBhbGwgdGhlIGl0ZW1zIHRoYXQgdXNlIGRhdGEgYmluZGluZ1xyXG4gIHRoaXMuYmluZExpc3Q9W107XHJcbiAgLy9ob3cgYXJlIHlvdSBlbWl0dGluZyBjaGFuZ2VzPyBpdCBkZXBlbmRzIG9uIHRoZSBzZXJ2ZXIgeW91IHVzZS5cclxuICB0aGlzLmVtaXQ9ZnVuY3Rpb24oKXt9XHJcbn1cclxuIl19