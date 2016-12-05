(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
repository of this module is at
https://github.com/autotel/on
*/
module.exports=function(){
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
          //pendant: how to make a better error handling? otherwise the function is bubbling the error to the handle() caller!!
          try{
            // console.log(this.ons[fname][n][1]);
            this.ons[fname][n][1](params);
          }catch(e){
            console.error("onHandler: error with "+fname+" callback:",e);
          }
        }
      }
    }
};
},{}],2:[function(require,module,exports){
"use strict";

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
"use strict";

var eemiter = require('onhandlers');
var syncman, mouse;
// var $;
exports.enable = function (sman, m) {
  syncman = sman;
  mouse = m;

  return Sequencer;
};

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

},{"onhandlers":1}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
'use strict';

// var syncman={};
var syncman = require('./syncman.js').enable();
var mouse = require('./mouse.js').enable();
var Slider = require('./Slider.js').enable(syncman, mouse);
var Sequencer = require('./Sequencer.js').enable(syncman, mouse);
var Button = require('./Button.js').enable(syncman, mouse);

var MsComponents = {
  Slider: Slider,
  Sequencer: Sequencer,
  Button: Button,
  create: function create(what, options, where) {
    if (!where) where = $("body");
    return new this[what](where, options);
  }
};
window.MsComponents = MsComponents;
console.log(MsComponents);

},{"./Button.js":2,"./Sequencer.js":3,"./Slider.js":4,"./mouse.js":6,"./syncman.js":7}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{}]},{},[5])

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvb25oYW5kbGVycy9vbi5qcyIsInNyY1xcQnV0dG9uLmpzIiwic3JjXFxTZXF1ZW5jZXIuanMiLCJzcmNcXFNsaWRlci5qcyIsInNyY1xcaW5kZXguanMiLCJzcmNcXG1vdXNlLmpzIiwic3JjXFxzeW5jbWFuLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoREE7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBLElBQUksT0FBSixFQUFZLEtBQVo7QUFDQSxRQUFRLE1BQVIsR0FBZSxVQUFTLElBQVQsRUFBYyxDQUFkLEVBQWdCO0FBQzdCLFlBQVEsSUFBUjtBQUNBLFVBQU0sQ0FBTjtBQUNBLFNBQU8sTUFBUDtBQUNELENBSkQ7QUFLQSxTQUFTLE1BQVQsQ0FBZ0IsTUFBaEIsRUFBdUIsT0FBdkIsRUFBK0I7QUFDN0I7QUFDQTtBQUNBO0FBQ0EsT0FBSyxJQUFMLEdBQVUsRUFBQyxPQUFNLENBQVAsRUFBVjtBQUNBLE9BQUssTUFBTCxHQUFZLEtBQVo7QUFDQSxPQUFLLE1BQUwsR0FBWSxRQUFRLFFBQVIsQ0FBaUIsSUFBakIsQ0FBc0IsSUFBdEIsSUFBNEIsQ0FBeEM7QUFDQSxPQUFLLEdBQUwsR0FBUyxFQUFFLCtCQUFGLENBQVQ7QUFDQSxPQUFLLEtBQUws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UDtBQUNELENBRkQ7O0FBSUEsU0FBUyxPQUFULEdBQWtCO0FBQ2hCO0FBQ0EsU0FBSyxRQUFMLEdBQWMsRUFBZDtBQUNBO0FBQ0EsU0FBSyxJQUFMLEdBQVUsWUFBVSxDQUFFLENBQXRCO0FBQ0QiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLypcclxucmVwb3NpdG9yeSBvZiB0aGlzIG1vZHVsZSBpcyBhdFxyXG5odHRwczovL2dpdGh1Yi5jb20vYXV0b3RlbC9vblxyXG4qL1xyXG5tb2R1bGUuZXhwb3J0cz1mdW5jdGlvbigpe1xyXG4gICAgdmFyIGV2ZW50VmVyYm9zZT1mYWxzZTtcclxuICAgIGlmICghdGhpcy5vbnMpIHtcclxuICAgICAgdGhpcy5vbnMgPSBbXTtcclxuICAgIH1cclxuICAgIHRoaXMub24gPSBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaykge1xyXG4gICAgICB2YXIgbmFtZSA9IG5hbWUuc3BsaXQoXCIuXCIpO1xyXG4gICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgaWYgKG5hbWUubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgIHRocm93IChcInNvcnJ5LCB5b3UgZ2F2ZSBhbiBpbnZhbGlkIGV2ZW50IG5hbWVcIik7XHJcbiAgICAgICAgfSBlbHNlIGlmIChuYW1lLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgIGlmICghdGhpcy5vbnNbbmFtZVswXV0pIHRoaXMub25zW25hbWVbMF1dID0gW107XHJcbiAgICAgICAgICB0aGlzLm9uc1tuYW1lWzBdXS5wdXNoKFtmYWxzZSwgY2FsbGJhY2tdKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5vbnMpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IChcImVycm9yIGF0IG1vdXNlLm9uLCBwcm92aWRlZCBjYWxsYmFjayB0aGF0IGlzIG5vdCBhIGZ1bmN0aW9uXCIpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLm9mZiA9IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgICAgdmFyIG5hbWUgPSBuYW1lLnNwbGl0KFwiLlwiKTtcclxuICAgICAgaWYgKG5hbWUubGVuZ3RoID4gMSkge1xyXG4gICAgICAgIGlmICghdGhpcy5vbnNbbmFtZVswXV0pIHRoaXMub25zW25hbWVbMF1dID0gW107XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJwcmV2XCIsdGhpcy5vbnNbbmFtZVswXV0pO1xyXG4gICAgICAgIHRoaXMub25zW25hbWVbMF1dLnNwbGljZSh0aGlzLm9uc1tuYW1lWzBdXS5pbmRleE9mKG5hbWVbMV0pLCAxKTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcInRoZW5cIix0aGlzLm9uc1tuYW1lWzBdXSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgKFwic29ycnksIHlvdSBnYXZlIGFuIGludmFsaWQgZXZlbnQgbmFtZVwiICsgbmFtZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuaGFuZGxlID0gZnVuY3Rpb24oZm5hbWUsIHBhcmFtcykge1xyXG4gICAgICBpZihldmVudFZlcmJvc2UpIGNvbnNvbGUubG9nKFwiRXZlbnQgXCIrZm5hbWUrXCI6XCIse2NhbGxlcjp0aGlzLHBhcmFtczpwYXJhbXN9KTtcclxuICAgICAgaWYgKHRoaXMub25zW2ZuYW1lXSkge1xyXG4gICAgICAgIGZvciAodmFyIG4gaW4gdGhpcy5vbnNbZm5hbWVdKSB7XHJcbiAgICAgICAgICAvL3BlbmRhbnQ6IGhvdyB0byBtYWtlIGEgYmV0dGVyIGVycm9yIGhhbmRsaW5nPyBvdGhlcndpc2UgdGhlIGZ1bmN0aW9uIGlzIGJ1YmJsaW5nIHRoZSBlcnJvciB0byB0aGUgaGFuZGxlKCkgY2FsbGVyISFcclxuICAgICAgICAgIHRyeXtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5vbnNbZm5hbWVdW25dWzFdKTtcclxuICAgICAgICAgICAgdGhpcy5vbnNbZm5hbWVdW25dWzFdKHBhcmFtcyk7XHJcbiAgICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJvbkhhbmRsZXI6IGVycm9yIHdpdGggXCIrZm5hbWUrXCIgY2FsbGJhY2s6XCIsZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbn07IiwiLypcclxuVGhpcyBzY3JpcHQgY3JlYXRlIERPTSBzbGlkZXJzIHRoYXQgY2FuIGJlIHVzZWQgaW4gd2ViIGJyb3dzZXIgdG8gY29udHJvbCBzdHVmZi4gVGhleSBjYW4gYmUgc3luY2VkIHRocm91Z2ggc29ja2V0cyBhbmQgb3RoZXJzIGJ5IHVzaW5nIGNhbGxiYWNrcy5cclxuICAgIENvcHlyaWdodCAoQykgMjAxNiBKb2FxdcOtbiBBbGR1bmF0ZVxyXG5cclxuICAgIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbiAgICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG4gICAgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuICAgIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG4gICAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbiAgICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG4gICAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG4gICAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbiAgICBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG4gICAgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcbnZhciBzeW5jbWFuLG1vdXNlO1xyXG5leHBvcnRzLmVuYWJsZT1mdW5jdGlvbihzbWFuLG0pe1xyXG4gIHN5bmNtYW49c21hbjtcclxuICBtb3VzZT1tO1xyXG4gIHJldHVybiBCdXR0b247XHJcbn07XHJcbmZ1bmN0aW9uIEJ1dHRvbihwYXJlbnQsb3B0aW9ucyl7XHJcbiAgLy9teSByZWZlcmVuY2UgbnVtYmVyIGZvciBkYXRhIGJpbmRpbmcuIFdpdGggdGhpcyBudW1iZXIgdGhlIHNvY2tldCBiaW5kZXIga25vd3Mgd2hvIGlzIHRoZSByZWNpZXZlciBvZiB0aGUgZGF0YSwgYW5kIGFsc28gd2l0aCB3aGF0IG5hbWUgdG8gc2VuZCBpdFxyXG4gIC8vcGVuZGFudDogdGhpcyBjYW4gcG90ZW50aWFsbHkgY3JlYXRlIGEgcHJvYmxlbSwgYmVjYXVzZSB0d28gb2JqZWN0cyBjYW4gYmUgY3JlYXRlZCBzaW11bHRhbmVvdXNseSBhdCBkaWZmZXJlbnQgZW5kcyBhdCB0aGUgc2FtZSB0aW1lLlxyXG4gIC8vbWF5YmUgaW5zdGVhZCBvZiB0aGUgc2ltcGxlIHB1c2gsIHRoZXJlIGNvdWxkIGJlIGEgY2FsbGJhY2ssIGFkbiB0aGUgb2JqZWN0IHdhaXRzIHRvIHJlY2VpdmUgaXQncyBzb2NrZXQgaWQgb25jZSBpdHMgY3JlYXRpb24gd2FzIHByb3BhZ2F0ZWQgdGhyb3VnaG91dCBhbGwgdGhlIG5ldHdvcmssIG9yIG1heWJlIHRoZXJlIGlzIGFuIGFycmF5IGZvciBzZW50aW5nIGFuZCBvdGhlciBkaWZmZXJlbnQgZm9yIHJlY2VpdmluZy4uLiBmaXJzdCBvcHRpb24gc2VlbXMgbW9yZSBzZW5zaWJsZVxyXG4gIHRoaXMuZGF0YT17dmFsdWU6MH07XHJcbiAgdGhpcy5zdGF0ZXM9ZmFsc2U7XHJcbiAgdGhpcy5fYmluZE49c3luY21hbi5iaW5kTGlzdC5wdXNoKHRoaXMpLTE7XHJcbiAgdGhpcy4kanE9JCgnPGRpdiBjbGFzcz1cIm1zLWJ1dHRvblwiPjwvZGl2PicpO1xyXG4gIHRoaXMubGFiZWw9b3B0aW9ucy5sYWJlbHx8XCLimLtcIjtcclxuICB0aGlzLiRqcS5hcHBlbmQodGhpcy4kZmFkZXJqcSk7XHJcbiAgdGhpcy4kanEuaHRtbCh0aGlzLmxhYmVsKTtcclxuICBpZihvcHRpb25zLmNzcylcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgdGhpcy5jc3M9ZnVuY3Rpb24oY3NzKXtcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgLy9pZiBhIHN3aXRjaCB2YXJpYWJsZSBpcyBwYXNzZWQsIHRoaXMgYnV0dG9uIHdpbGwgc3dpdGNoIG9uIGVhY2ggY2xpY2sgYW1vbmcgdGhlIHN0YXRlZCBzdGF0ZXNcclxuICBpZihvcHRpb25zLmhhc093blByb3BlcnR5KFwic3dpdGNoXCIpKXtcclxuICAgIHRoaXMuc3RhdGVzPVtdO1xyXG4gICAgdGhpcy5kYXRhLmN1cnJlbnRTdGF0ZT0wO1xyXG4gICAgdGhpcy5zdGF0ZXM9b3B0aW9ucy5zd2l0Y2g7XHJcbiAgICB0aGlzLnN3aXRjaFN0YXRlKDApO1xyXG4gIH1cclxuICB0aGlzLm9uQ2xpY2tDYWxsYmFjaz1mdW5jdGlvbigpe307XHJcbiAgdGhpcy5vblJlbGVhc2VDYWxsYmFjaz1mdW5jdGlvbigpe307XHJcbiAgLy9wZW5kYW50OiB0aGlzIHNob3VsZCBiZSBwYXJ0IG9mIGEgYmFzZSBwcm90b3R5cGUsIG5vdCByZXBlYXRlZCBpbiBlYWNoIHR5cGVcclxuICBpZih0eXBlb2YgKHBhcmVudC5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC5hcHBlbmQodGhpcy4kanEpO1xyXG4gIH1lbHNlIGlmKHR5cGVvZiAocGFyZW50LiRqcS5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC4kanEuYXBwZW5kKHRoaXMuJGpxKTtcclxuICB9ZWxzZXtcclxuICAgIGNvbnNvbGUubG9nKFwiYSBzbGlkZXIgY291bGRuJ3QgZmluZCBkb20gZWxlbWVudCB0byBhdHRhY2ggaGltc2VsZlwiKTtcclxuICB9XHJcbiAgdmFyIG1lPXRoaXM7XHJcbiAgLy8gdGhpcy5vbkNoYW5nZT1mdW5jdGlvbihjYWxsYmFjayl7XHJcbiAgLy8gICBtZS5vbkNsaWNrQ2FsbGJhY2s9ZnVuY3Rpb24oKXtjYWxsYmFjayhtZS5kYXRhKX07XHJcbiAgLy8gICByZXR1cm4gdGhpcztcclxuICAvLyB9XHJcblxyXG4gIHRoaXMuJGpxLm9uKFwibW91c2Vkb3duIHRhcCB0b3VjaHN0YXJ0XCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgbWUub25DbGlja0NhbGxiYWNrKG1lLmRhdGEpO1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIG1lLnN3aXRjaFN0YXRlKCk7XHJcbiAgICBtZS5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcclxuICB9KTtcclxuICB0aGlzLiRqcS5vbihcIm1vdXNldXAgbW91c2VsZWF2ZVwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIG1lLm9uUmVsZWFzZUNhbGxiYWNrKG1lLmRhdGEpO1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIG1lLnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5CdXR0b24ucHJvdG90eXBlLnVwZGF0ZURvbT1mdW5jdGlvbigpe1xyXG4gIHRoaXMuJGpxLmh0bWwodGhpcy5sYWJlbCk7XHJcbn1cclxuXHJcbkJ1dHRvbi5wcm90b3R5cGUub25DbGljaz1mdW5jdGlvbihjYWxsYmFjayl7XHJcbiAgdGhpcy5vbkNsaWNrQ2FsbGJhY2s9Y2FsbGJhY2s7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn1cclxuQnV0dG9uLnByb3RvdHlwZS5vblJlbGVhc2U9ZnVuY3Rpb24oY2FsbGJhY2spe1xyXG4gIHRoaXMub25SZWxlYXNlQ2FsbGJhY2s9Y2FsbGJhY2s7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn1cclxuQnV0dG9uLnByb3RvdHlwZS5zd2l0Y2hTdGF0ZT1mdW5jdGlvbih0byl7XHJcbiAgaWYodGhpcy5zdGF0ZXMpe1xyXG4gICAgLy9jaGFuZ2Ugc3RhdGUgbnVtYmVyIHRvIG5leHRcclxuICAgIGlmKHRvKXtcclxuICAgICAgdGhpcy5kYXRhLmN1cnJlbnRTdGF0ZT10byV0aGlzLnN0YXRlcy5sZW5ndGg7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdGhpcy5kYXRhLmN1cnJlbnRTdGF0ZT0odGhpcy5kYXRhLmN1cnJlbnRTdGF0ZSsxKSV0aGlzLnN0YXRlcy5sZW5ndGg7XHJcbiAgICB9XHJcbiAgICAvL2FwcGx5IGFsbCB0aGUgcHJvcGVydGllcyB0aGF0IHRoZSBzdGF0ZSBjYXJyeS4gVGhpcyBtYWtlcyB0aGUgYnV0dG9uIHN1cGVyIGhhY2thYmxlXHJcbiAgICBmb3IoYSBpbiB0aGlzLnN0YXRlc1t0aGlzLmRhdGEuY3VycmVudFN0YXRlXSl7XHJcbiAgICAgIHRoaXNbYV09dGhpcy5zdGF0ZXNbdGhpcy5kYXRhLmN1cnJlbnRTdGF0ZV1bYV07XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKFwiW1wiK2ErXCJdXCIsdGhpc1thXSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHRoaXMudXBkYXRlRG9tKCk7XHJcbn1cclxuLy9hbGlhc2luZyBvZiB0aGVzZSB0d28gaGFuZHkgZnVuY3Rpb25cclxuQnV0dG9uLnByb3RvdHlwZS5hZGRDbGFzcz1mdW5jdGlvbih0byl7XHJcbiAgdGhpcy4kanEuYWRkQ2xhc3ModG8pO1xyXG59XHJcbkJ1dHRvbi5wcm90b3R5cGUucmVtb3ZlQ2xhc3M9ZnVuY3Rpb24odG8pe1xyXG4gIHRoaXMuJGpxLnJlbW92ZUNsYXNzKHRvKTtcclxufSIsImxldCBlZW1pdGVyPXJlcXVpcmUoJ29uaGFuZGxlcnMnKTtcclxudmFyIHN5bmNtYW4sbW91c2U7XHJcbi8vIHZhciAkO1xyXG5leHBvcnRzLmVuYWJsZT1mdW5jdGlvbihzbWFuLG0pe1xyXG4gIHN5bmNtYW49c21hbjtcclxuICBtb3VzZT1tO1xyXG5cclxuICByZXR1cm4gU2VxdWVuY2VyO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gU2VxdWVuY2VyQnV0dG9uKG4scGFyZW50KXtcclxuICBlZW1pdGVyLmNhbGwodGhpcyk7XHJcbiAgdGhpcy5vbihcInRlc3RcIixmdW5jdGlvbigpe2NvbnNvbGUubG9nKFwid29ya3MhXCIpfSk7XHJcbiAgdGhpcy5oYW5kbGUoXCJ0ZXN0XCIpO1xyXG4gIHRoaXMuanE9JCgnPGRpdiBjbGFzcz1cInNlcWJ1dHRvblwiPjwvZGl2PicpO1xyXG4gIHRoaXMuX2JpbmROPXN5bmNtYW4uYmluZExpc3QucHVzaCh0aGlzKS0xO1xyXG4gIHBhcmVudC5qcS5hcHBlbmQodGhpcy5qcSk7XHJcbiAgdGhpcy5kYXRhPTA7XHJcbiAgLy9wZW5kYW50OiBldmFsdWF0ZSB3ZXRoZXIgdGhlIHZhciBuIGlzIHN0aWxsIHVzZWZ1bC4gcmVtb3ZlIGl0IGF0IGV2ZXJ5IGVuZC5cclxuICB0aGlzLm49bjtcclxuICB2YXIgbWU9dGhpcztcclxuICB0aGlzLnNldERhdGE9ZnVuY3Rpb24odG8sZW1pdCl7XHJcbiAgICAvLyBpZihlbWl0PT10cnVlKXtcclxuICAgIC8vICAgc29ja0NoYW5nZShcInNlcWI6XCIrbWUuX2JpbmROK1wiXCIsXCJzVlwiLHRvKTtcclxuICAgIC8vIH1cclxuICAgIC8vIGNvbnNvbGUubG9nKFwic2RhdGFcIik7XHJcbiAgICAvL3NvY2tldCBtYXkgc2V0IGRhdGEgdG8gMCB3aGVuIGlzIGFscmVhZHkgMCwgZ2VuZXJhdGluZyBkaXNwbGFjZSBvZiBwYXJlbnQncyBhbGl2ZWRoaWxkXHJcbiAgICBpZih0byE9dGhpcy5kYXRhKXtcclxuICAgICAgaWYodG89PTEpe1xyXG4gICAgICAgIHRoaXMuZGF0YT0xO1xyXG4gICAgICAgIHRoaXMuanEuYWRkQ2xhc3MoXCJvblwiKTtcclxuICAgICAgICBwYXJlbnQuYWxpdmVDaGlsZCsrO1xyXG4gICAgICB9XHJcbiAgICAgIGlmKHRvPT0wKXtcclxuICAgICAgICB0aGlzLmRhdGE9MDtcclxuICAgICAgICB0aGlzLmpxLnJlbW92ZUNsYXNzKFwib25cIik7XHJcbiAgICAgICAgcGFyZW50LmFsaXZlQ2hpbGQtLTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gY29uc29sZS5sb2cocGFyZW50LmFsaXZlQ2hpbGQpO1xyXG4gIH1cclxuICB0aGlzLmpxLm9uKFwibW91c2Vkb3duIHRhcCB0b3VjaHN0YXJ0XCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIG1lLnNldERhdGEoTWF0aC5hYnMobWUuZGF0YS0xKSx0cnVlKTtcclxuICAgIC8vIG1lLmRhdGE9O1xyXG4gICAgaWYobWUuZGF0YT09MSl7XHJcbiAgICAgICBtb3VzZS5zd2l0Y2hpbmc9dHJ1ZTtcclxuICAgIH1lbHNle1xyXG4gICAgLy8gICAkKHRoaXMpLnJlbW92ZUNsYXNzKFwib25cIik7XHJcbiAgICAvLyAgIHBhcmVudC5hbGl2ZUNoaWxkLS07XHJcbiAgICAgICBtb3VzZS5zd2l0Y2hpbmc9ZmFsc2U7XHJcbiAgICAgfVxyXG4gIH0pO1xyXG4gIHRoaXMuanEub24oXCJtb3VzZWVudGVyIHRvdWNoZW50ZXJcIixmdW5jdGlvbigpe1xyXG4gICAgaWYobW91c2UuYnV0dG9uRG93bil7XHJcbiAgICAgIGlmKG1vdXNlLnN3aXRjaGluZyl7XHJcbiAgICAgICAgaWYobWUuZGF0YT09MCl7XHJcbiAgICAgICAgICBtZS5zZXREYXRhKDEsdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ZWxzZXtcclxuICAgICAgICBpZihtZS5kYXRhPT0xKXtcclxuICAgICAgICAgIG1lLnNldERhdGEoMCx0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxuICB0aGlzLmV2YWw9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBqcT10aGlzLmpxO1xyXG4gICAganEuYWRkQ2xhc3MoXCJ0dXJuXCIpO1xyXG4gICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAganEucmVtb3ZlQ2xhc3MoXCJ0dXJuXCIpO1xyXG4gICAgfSwyMDApO1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YTtcclxuICB9XHJcbn1cclxuLy9kZWZpbmVzIGFsbCB0aGUgc2VxdWVuY2VyIHBhcmFtZXRlcnMgYnkgbWF0aCxcclxuLy9tYXliZSBpbiBhIGZ1bnR1cmUgYnkgc3R5bGluZyB0YWJsZVxyXG52YXIgc2VxUHJvZz00O1xyXG5mdW5jdGlvbiBTZXF1ZW5jZXIocGFyZW50LG9wdGlvbnMpe1xyXG4gIHZhciBuPW9wdGlvbnMubnx8MztcclxuICB0aGlzLmpxPSQoJzxkaXYgY2xhc3M9XCJzZXF1ZW5jZXJcIiBpZD1cInNlcV8nK24rJ1wiPjxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGVcIj48L3A+PC9kaXY+Jyk7XHJcbiAgcGFyZW50LmFwcGVuZCh0aGlzLmpxKTtcclxuICB0aGlzLmFsaXZlPWZhbHNlO1xyXG4gIHRoaXMuX2JpbmROPXN5bmNtYW4uYmluZExpc3QucHVzaCh0aGlzKS0xO1xyXG4gIHRoaXMucG9zPTA7XHJcbiAgdGhpcy5kYXRhPVtdO1xyXG4gIHRoaXMubGVuPU1hdGgucG93KDIsKHNlcVByb2clNSkrMSk7XHJcbiAgdGhpcy5ldnJ5PU1hdGgucG93KDIsKHNlcVByb2clNCkrMSk7XHJcbiAgLy9tdXN0IGNvdW50IGFuIFtldmVyeV0gYW1vdW50IG9mIGJlYXRzIGZvciBlYWNoIHBvcyBpbmNyZW1lbnQuXHJcbiAgdGhpcy5zdWJwb3M9MDtcclxuICB0aGlzLmpxLmNzcyh7d2lkdGg6MTYqTWF0aC5jZWlsKHRoaXMubGVuLzQpK1wicHhcIn0pO1xyXG4gIC8vdGhpcy5qcS5hZGRDbGFzcyhcImNvbG9yX1wiK3NlcVByb2clY2hhbm5lbHMubGVuZ3RoKTtcclxuICB0aGlzLmRpc3A9MDtcclxuICB0aGlzLmlkPW47XHJcbiAgdGhpcy5iZWF0RGlzcGxhY2U9MDtcclxuICB2YXIgbWU9dGhpcztcclxuICBzZXFQcm9nKys7XHJcbiAgLy90aGlzLmNoYW5uZWw9Y2hhbm5lbHNbdGhpcy5pZCVjaGFubmVscy5sZW5ndGhdO1xyXG4gIGZvcih2YXIgYm49MDsgYm48dGhpcy5sZW47IGJuKyspe1xyXG4gICAgdGhpcy5kYXRhW2JuXT1uZXcgU2VxdWVuY2VyQnV0dG9uKGJuLHRoaXMpXHJcbiAgfVxyXG4gIHRoaXMuYWxpdmVDaGlsZD0wO1xyXG4gIHRoaXMuZGlzcGxhY2U9MDtcclxuICB0aGlzLnNldERpc3BsYWNlPWZ1bmN0aW9uKHRvLGVtaXQpe1xyXG4gICAgaWYoZW1pdD09XCJvbmx5XCIpe1xyXG4gICAgICBlbWl0PXRydWU7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdGhpcy5zdWJwb3M9KCh0cmFuc3BvcnRDdXJyZW50U3RlcCklKHRoaXMubGVuKnRoaXMuZXZyeSkpK3RvO1xyXG4gICAgfVxyXG4gICAgaWYoZW1pdD09dHJ1ZSl7XHJcbiAgICAgIHNvY2tDaGFuZ2UoXCJzZXE6XCIrbWUuX2JpbmROK1wiXCIsXCJkc3BsXCIsdG8pO1xyXG4gICAgfVxyXG4gIH1cclxuICB0aGlzLnN0ZXA9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBwcmV2YWxpdmU9dGhpcy5hbGl2ZTtcclxuICAgIHRoaXMuYWxpdmU9dGhpcy5hbGl2ZUNoaWxkPjA7XHJcbiAgICBpZih0aGlzLmFsaXZlKXtcclxuICAgICAgLy9pZiB0aGUgc3RhdGUgb2YgdGhpcy5hbGl2ZSBjaGFuZ2VzLCB3ZSBtdXN0IGVtaXQgdGhlIGRpc3BsYWNlbWVudCwgYmVjYXVzZSBpdCBpcyBuZXdcclxuICAgICAgaWYoIXByZXZhbGl2ZSl7XHJcbiAgICAgICAgdGhpcy5kaXNwbGFjZT0odHJhbnNwb3J0Q3VycmVudFN0ZXArdGhpcy5zdWJwb3MpJSh0aGlzLmxlbip0aGlzLmV2cnkpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwib2suIGVtaXQgZGlzcGxhZTogXCIrdGhpcy5kaXNwbGFjZSk7XHJcbiAgICAgICAgdGhpcy5zZXREaXNwbGFjZSh0aGlzLmRpc3BsYWNlLFwib25seVwiKTtcclxuICAgICAgfTtcclxuICAgICAgLy9lYWNoIHNlcXVlbmNlciBoYXMgYSBkaWZmZXJlbnQgc3BlZWQgcmF0ZXMuIHdoaWxlIHNvbWUgcGxheXMgb25lIHN0ZXAgcGVyIGNsaWNrLCBvdGhlcnMgd2lsbCBoYXZlIG9uZSBzdGVwIHBlciBzZXZlcmFsIGNsb2NrIHRpY2tzLlxyXG4gICAgICAvL3RoZSBzZXF1ZW5jZXIgc3RhcnRpbmcgcG9pbnQgaXMgYWxzbyBkaXNwbGFjZWQsIGFuZCBpdCBkZXBlbmRzIG9uIHRoZSB0aW1lIHdoZW4gaXQgZ290IGFsaXZlZCtpdHMgcG9zaXRpb24gYXQgdGhhdCBtb21lbnQuXHJcbiAgICAgIGlmKHRoaXMuc3VicG9zJXRoaXMuZXZyeT09MCl7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJzcVwiK3RoaXMucG9zKTtcclxuICAgICAgICAvLyBkYXRhPXtzZXF1ZW5jZXI6dGhpcy5pZCxwb3M6dGhpcy5wb3Msc3RlcFZhbDp0aGlzLmRhdGFbdGhpcy5wb3NdLmV2YWwoKX07XHJcbiAgICAgICAgLy8gdGhpcy5vblN0ZXBUcmlnZ2VyKGRhdGEpO1xyXG4gICAgICAgIC8vIHN0ZXBGdW5jdGlvbihkYXRhKTtcclxuICAgICAgICB0aGlzLnBvcz0odGhpcy5zdWJwb3MvdGhpcy5ldnJ5KSUodGhpcy5sZW4pO1xyXG4gICAgICAgIGlmKHRoaXMuZGF0YVt0aGlzLnBvc10uZXZhbCgpPT0xKXtcclxuICAgICAgICAgIC8vIHRoaXMuY2hhbm5lbC5lbmdpbmUuc3RhcnQoMCx0aGlzLmNoYW5uZWwuc3RhcnRPZmZzZXQsdGhpcy5jaGFubmVsLmVuZFRpbWUpO1xyXG4gICAgICAgICAgLy9zbywgdGhpcyBpcyBjYWxsZWQgZWxzZXdoZXJlIGFzd2VsbGwuLi4uIHRoZSBjaGFubmVsIHNob3VsZCBoYXZlIGEgdHJpZ2dlciBmdW5jdGlvblxyXG4gICAgICAgICAgdmFyIGxvb3BTdGFydD10aGlzLmNoYW5uZWwuc3RhcnRPZmZzZXQ7XHJcbiAgICAgICAgICB2YXIgbG9vcEVuZD10aGlzLmNoYW5uZWwuZW5kVGltZTtcclxuICAgICAgICAgIHRoaXMuY2hhbm5lbC5zYW1wbGVyLnRyaWdnZXJBdHRhY2soZmFsc2UsMCwxLHtzdGFydDpsb29wU3RhcnQsZW5kOmxvb3BFbmR9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICB9XHJcbiAgICAgIC8vd2hhdCBpcyBtb3JlIGVjb25vbWljPz9cclxuICAgICAgLy8gdGhpcy5zdWJwb3M9KHRoaXMuc3VicG9zKzEpJSh0aGlzLmxlbip0aGlzLmV2cnkpO1xyXG4gICAgICAvL2kgZ3Vlc3MgdGhhdC4uIGJ1dCBpdCBjYW4gZ3JvdyBldGVybmFsbHlcclxuICAgICAgdGhpcy5zdWJwb3MrKztcclxuICAgIH1cclxuICB9XHJcbiAgdGhpcy5kaWU9ZnVuY3Rpb24oKXtcclxuICAgIGZvcih2YXIgYm4gaW4gdGhpcy5kYXRhKXtcclxuICAgICAgdGhpcy5kYXRhW2JuXS5zZXREYXRhKDApO1xyXG4gICAgfVxyXG4gICAgdGhpcy5hbGl2ZT1mYWxzZTtcclxuICAgIHRoaXMuanEuZGV0YWNoKCk7XHJcbiAgfVxyXG4gIC8vIHRoaXMub25TdGVwVHJpZ2dlcj1mdW5jdGlvbihkYXRhKXtcclxuICAvLyAgIC8vIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gIC8vIH1cclxuICB0aGlzLmpxLm9uKFwibW91c2VlbnRlclwiLGZ1bmN0aW9uKCl7XHJcbiAgICBmb2N1c0NoYW5uZWwobWUuY2hhbm5lbC5pZCk7XHJcbiAgfSk7XHJcbn0iLCIvKlxyXG5UaGlzIHNjcmlwdCBjcmVhdGUgRE9NIHNsaWRlcnMgdGhhdCBjYW4gYmUgdXNlZCBpbiB3ZWIgYnJvd3NlciB0byBjb250cm9sIHN0dWZmLiBUaGV5IGNhbiBiZSBzeW5jZWQgdGhyb3VnaCBzb2NrZXRzIGFuZCBvdGhlcnMgYnkgdXNpbmcgY2FsbGJhY2tzLlxyXG4gICAgQ29weXJpZ2h0IChDKSAyMDE2IEpvYXF1w61uIEFsZHVuYXRlXHJcblxyXG4gICAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcclxuICAgIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbiAgICB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4gICAgKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cclxuXHJcbiAgICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuICAgIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbiAgICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbiAgICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG5cclxuICAgIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbiAgICBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxudmFyIHN5bmNtYW4sbW91c2U7XHJcbi8vIHZhciAkO1xyXG5leHBvcnRzLmVuYWJsZT1mdW5jdGlvbihzbWFuLG0pe1xyXG4gIHN5bmNtYW49c21hbjtcclxuICBtb3VzZT1tO1xyXG4gIHJldHVybiBTbGlkZXI7XHJcbn07XHJcblxyXG4vKipcclxuKiBUaGlzIGlzIHRoZSBkZXNjcmlwdGlvbiBmb3IgU2xpZGVyIGNsYXNzXHJcbipcclxuKiBAY2xhc3MgU2xpZGVyXHJcbiogQGNvbnN0cnVjdG9yXHJcbiovXHJcbmZ1bmN0aW9uIFNsaWRlcihwYXJlbnQsb3B0aW9ucyl7XHJcbiAgLy9teSByZWZlcmVuY2UgbnVtYmVyIGZvciBkYXRhIGJpbmRpbmcuIFdpdGggdGhpcyBudW1iZXIgdGhlIHNvY2tldCBiaW5kZXIga25vd3Mgd2hvIGlzIHRoZSByZWNpZXZlciBvZiB0aGUgZGF0YSwgYW5kIGFsc28gd2l0aCB3aGF0IG5hbWUgdG8gc2VuZCBpdFxyXG4gIC8vcGVuZGFudDogdGhpcyBjYW4gcG90ZW50aWFsbHkgY3JlYXRlIGEgcHJvYmxlbSwgYmVjYXVzZSB0d28gb2JqZWN0cyBjYW4gYmUgY3JlYXRlZCBzaW11bHRhbmVvdXNseSBhdCBkaWZmZXJlbnQgZW5kcyBhdCB0aGUgc2FtZSB0aW1lLlxyXG4gIC8vbWF5YmUgaW5zdGVhZCBvZiB0aGUgc2ltcGxlIHB1c2gsIHRoZXJlIGNvdWxkIGJlIGEgY2FsbGJhY2ssIGFkbiB0aGUgb2JqZWN0IHdhaXRzIHRvIHJlY2VpdmUgaXQncyBzb2NrZXQgaWQgb25jZSBpdHMgY3JlYXRpb24gd2FzIHByb3BhZ2F0ZWQgdGhyb3VnaG91dCBhbGwgdGhlIG5ldHdvcmssIG9yIG1heWJlIHRoZXJlIGlzIGFuIGFycmF5IGZvciBzZW50aW5nIGFuZCBvdGhlciBkaWZmZXJlbnQgZm9yIHJlY2VpdmluZy4uLiBmaXJzdCBvcHRpb24gc2VlbXMgbW9yZSBzZW5zaWJsZVxyXG4gIHRoaXMuZGF0YT17dmFsdWU6MH07XHJcblxyXG4gIHRoaXMuX2JpbmROPXN5bmNtYW4uYmluZExpc3QucHVzaCh0aGlzKS0xO1xyXG4gIHRoaXMuJGpxPSQoJzxkaXYgY2xhc3M9XCJzbGlkZXItY29udGFpbmVyXCIgc3R5bGU9XCJwb3NpdGlvbjpyZWxhdGl2ZVwiPjwvZGl2PicpO1xyXG4gIHRoaXMuJGZhZGVyanE9JCgnPGRpdiBjbGFzcz1cInNsaWRlci1pbm5lclwiIHN0eWxlPVwicG9pbnRlci1ldmVudHM6bm9uZTsgcG9zaXRpb246YWJzb2x1dGVcIj48L2Rpdj4nKTtcclxuICB0aGlzLmxhYmVsPW9wdGlvbnMubGFiZWx8fFwiXCI7XHJcbiAgdGhpcy5sYWJlbGpxPSQoJzxwIGNsYXNzPVwic2xpZGVybGFiZWxcIj48L3A+Jyk7XHJcbiAgdGhpcy4kanEuYXBwZW5kKHRoaXMuJGZhZGVyanEpO1xyXG4gIHRoaXMuJGpxLmFwcGVuZCh0aGlzLmxhYmVsanEpO1xyXG4gIGlmKG9wdGlvbnMuY3NzKVxyXG4gICAgdGhpcy4kanEuY3NzKG9wdGlvbnMuY3NzKTtcclxuICB0aGlzLmNzcz1mdW5jdGlvbihjc3Mpe1xyXG4gICAgdGhpcy4kanEuY3NzKGNzcyk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgdGhpcy5vbkNoYW5nZUNhbGxiYWNrPWZ1bmN0aW9uKCl7fTtcclxuICAvL3BlbmRhbnQ6IHRoaXMgc2hvdWxkIGJlIHBhcnQgb2YgYSBiYXNlIHByb3RvdHlwZSwgbm90IHJlcGVhdGVkIGluIGVhY2ggdHlwZVxyXG4gIGlmKHR5cGVvZiAocGFyZW50LmFwcGVuZHx8ZmFsc2UpPT1cImZ1bmN0aW9uXCIpe1xyXG4gICAgcGFyZW50LmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgfWVsc2UgaWYodHlwZW9mIChwYXJlbnQuJGpxLmFwcGVuZHx8ZmFsc2UpPT1cImZ1bmN0aW9uXCIpe1xyXG4gICAgcGFyZW50LiRqcS5hcHBlbmQodGhpcy4kanEpO1xyXG4gIH1lbHNle1xyXG4gICAgY29uc29sZS5sb2coXCJhIHNsaWRlciBjb3VsZG4ndCBmaW5kIGRvbSBlbGVtZW50IHRvIGF0dGFjaCBoaW1zZWxmXCIpO1xyXG4gIH1cclxuICB2YXIgbWU9dGhpcztcclxuICB0aGlzLm9uQ2hhbmdlPWZ1bmN0aW9uKGNhbGxiYWNrKXtcclxuICAgIG1lLm9uQ2hhbmdlQ2FsbGJhY2s9ZnVuY3Rpb24oKXtjYWxsYmFjayhtZS5kYXRhKX07XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgLyoqXHJcbiogTXkgbWV0aG9kIGRlc2NyaXB0aW9uLiAgTGlrZSBvdGhlciBwaWVjZXMgb2YgeW91ciBjb21tZW50IGJsb2NrcyxcclxuKiB0aGlzIGNhbiBzcGFuIG11bHRpcGxlIGxpbmVzLlxyXG4qXHJcbiogQG1ldGhvZCBtZXRob2ROYW1lXHJcbiogQHBhcmFtIHtTdHJpbmd9IGZvbyBBcmd1bWVudCAxXHJcbiogQHBhcmFtIHtPYmplY3R9IGNvbmZpZyBBIGNvbmZpZyBvYmplY3RcclxuKiBAcGFyYW0ge1N0cmluZ30gY29uZmlnLm5hbWUgVGhlIG5hbWUgb24gdGhlIGNvbmZpZyBvYmplY3RcclxuKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb25maWcuY2FsbGJhY2sgQSBjYWxsYmFjayBmdW5jdGlvbiBvbiB0aGUgY29uZmlnIG9iamVjdFxyXG4qIEBwYXJhbSB7Qm9vbGVhbn0gW2V4dHJhPWZhbHNlXSBEbyBleHRyYSwgb3B0aW9uYWwgd29ya1xyXG4qIEByZXR1cm4ge0Jvb2xlYW59IFJldHVybnMgdHJ1ZSBvbiBzdWNjZXNzXHJcbiovXHJcbiAgdGhpcy5zZXREYXRhPWZ1bmN0aW9uKHRvLGVtaXQpe1xyXG4gICAgaWYoZW1pdD09PXRydWUpe1xyXG4gICAgICAvL3BlbmRhbnQ6IGluIHNlcXVlbmNlcnMgd2UgdXNlIHBhcmVudC5pZCwgYW5kIGhlcmUgd2UgdXNlIF9iaW5kTi4gVG93YXJkcyBhIGNvbnRyb2xsZXIgQVBJIGFuZCBhIG1vcmUgc2Vuc2ljYWwgY29kZSwgSSB0aGluayBib3RoIHNob3VsZCB1c2UgdGhlIGJpbmQgZWxlbWVudCBhcnJheS4gcmVhZCBub3RlIGluIGZpcnN0IGxpbmUgb2YgdGhpcyBmaWxlLlxyXG4gICAgICAvL3BlbmRhbnQ6IHBhcmVudCBpbiBzZXEgaXMgd2hhdCBtZSBpcyBoZXJlLiB0aGlzIGlzIHByZXR0eSBjb25mdXNpbmcgdmFyIG5hbWUgZGVjaXNpb25cclxuICAgICAgc3luY21hbi5lbWl0KFwic2xpZDpcIittZS5fYmluZE4rXCJcIixcInNWXCIsdG8pO1xyXG4gICAgfVxyXG4gICAgdGhpcy5kYXRhLnZhbHVlPXRvO1xyXG4gICAgdGhpcy5vbkNoYW5nZUNhbGxiYWNrKCk7XHJcbiAgICB0aGlzLnVwZGF0ZURvbSgpO1xyXG4gIH1cclxuICB0aGlzLmFkZENsYXNzPWZ1bmN0aW9uKHRvKXtcclxuICAgIHRoaXMuJGpxLmFkZENsYXNzKHRvKTtcclxuICB9XHJcbiAgdGhpcy52ZXJ0aWNhbD1vcHRpb25zLnZlcnRpY2FsfHx0cnVlO1xyXG4gIHRoaXMuYWRkQ2xhc3MoXCJ2ZXJ0aWNhbFwiKTtcclxuICB0aGlzLiRqcS5vbihcIm1vdXNlZG93biB0YXAgdG91Y2hzdGFydFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBpZihtZS52ZXJ0aWNhbCl7XHJcbiAgICAgIG1lLnNldERhdGEoMS1ldmVudC5vZmZzZXRZL21lLiRqcS5oZWlnaHQoKSx0cnVlKTsvLyx0cnVlXHJcbiAgICB9ZWxzZXtcclxuICAgICAgbWUuc2V0RGF0YShldmVudC5vZmZzZXRYL21lLiRqcS53aWR0aCgpLHRydWUpOy8vLHRydWVcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgdGhpcy4kanEub24oXCJtb3VzZW1vdmUgdG91Y2hlbnRlciBtb3VzZWxlYXZlIG1vdXNldXBcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBpZihtb3VzZS5idXR0b25Eb3duKXtcclxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgdmFyIGVtaXRUaGlzPWV2ZW50LnR5cGU9PVwibW91c2VsZWF2ZVwifHxldmVudC50eXBlPT1cIm1vdXNldXBcIlxyXG4gICAgICBpZihtZS52ZXJ0aWNhbCl7XHJcbiAgICAgICAgLy90aGUgc3RyYW5nZSBzZWNvbmQgcGFyYW1lbnRlciBpbiBzZXRkYXRhIHdhcyB0cnVlLCBidXQgaXQgY291bGQgY2xvZyB0aGUgc29ja2V0XHJcbiAgICAgICAgbWUuc2V0RGF0YSgxLWV2ZW50Lm9mZnNldFkvbWUuJGpxLmhlaWdodCgpLGVtaXRUaGlzKTsvLyx0cnVlXHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIG1lLnNldERhdGEoZXZlbnQub2Zmc2V0WC9tZS4kanEud2lkdGgoKSxlbWl0VGhpcyk7Ly8sdHJ1ZVxyXG4gICAgICB9XHJcbiAgICB9ZWxzZXtcclxuICAgIH1cclxuICB9KTtcclxuICB0aGlzLmV2YWw9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBqcT10aGlzLiRqcTtcclxuICAgIGpxLmFkZENsYXNzKFwidHVyblwiKTtcclxuICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgIGpxLnJlbW92ZUNsYXNzKFwidHVyblwiKTtcclxuICAgIH0sMjAwKTtcclxuICAgIHJldHVybiB0aGlzLmRhdGEudmFsdWU7XHJcbiAgfVxyXG4gIHRoaXMudXBkYXRlRG9tPWZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLnZlcnRpY2FsKXtcclxuICAgICAgdGhpcy4kZmFkZXJqcS5jc3Moe2JvdHRvbTowLHdpZHRoOlwiMTAwJVwiLGhlaWdodDp0aGlzLmRhdGEudmFsdWUqdGhpcy4kanEuaGVpZ2h0KCl9KTtcclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLmxhYmVsanEuaHRtbCh0aGlzLmxhYmVsKTtcclxuICAgICAgdGhpcy4kZmFkZXJqcS5jc3Moe2JvdHRvbTowLHdpZHRoOnRoaXMuZGF0YS52YWx1ZSp0aGlzLiRqcS53aWR0aCgpLGhlaWdodDpcIjEwMCVcIn0pO1xyXG4gICAgfVxyXG4gIH1cclxuICB0aGlzLnNldERhdGEoMCk7XHJcbn0iLCIvLyB2YXIgc3luY21hbj17fTtcclxudmFyIHN5bmNtYW49cmVxdWlyZSgnLi9zeW5jbWFuLmpzJykuZW5hYmxlKCk7XHJcbnZhciBtb3VzZT1yZXF1aXJlKCcuL21vdXNlLmpzJykuZW5hYmxlKCk7XHJcbnZhciBTbGlkZXI9cmVxdWlyZSgnLi9TbGlkZXIuanMnKS5lbmFibGUoc3luY21hbixtb3VzZSk7XHJcbnZhciBTZXF1ZW5jZXI9cmVxdWlyZSgnLi9TZXF1ZW5jZXIuanMnKS5lbmFibGUoc3luY21hbixtb3VzZSk7XHJcbnZhciBCdXR0b249cmVxdWlyZSgnLi9CdXR0b24uanMnKS5lbmFibGUoc3luY21hbixtb3VzZSk7XHJcblxyXG52YXIgTXNDb21wb25lbnRzPXtcclxuICBTbGlkZXI6U2xpZGVyLFxyXG4gIFNlcXVlbmNlcjpTZXF1ZW5jZXIsXHJcbiAgQnV0dG9uOkJ1dHRvbixcclxuICBjcmVhdGU6ZnVuY3Rpb24od2hhdCxvcHRpb25zLHdoZXJlKXtcclxuICAgIGlmKCF3aGVyZSlcclxuICAgICAgd2hlcmU9JChcImJvZHlcIik7XHJcbiAgICByZXR1cm4gbmV3IHRoaXNbd2hhdF0od2hlcmUsb3B0aW9ucyk7XHJcbiAgfSxcclxufTtcclxud2luZG93Lk1zQ29tcG9uZW50cz1Nc0NvbXBvbmVudHM7XHJcbmNvbnNvbGUubG9nKE1zQ29tcG9uZW50cyk7IiwiZXhwb3J0cy5lbmFibGU9ZnVuY3Rpb24oKXtcclxuICByZXR1cm4gbW91c2U7XHJcbn1cclxudmFyIG1vdXNlPXtcclxuICB0b29sOlwiZHJhd1wiXHJcbn07XHJcblxyXG5cclxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcclxuICAkKGRvY3VtZW50KS5vbihcIm1vdXNlZG93biB0b3VjaHN0YXJ0IHRvdWNobW92ZVwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIG1vdXNlLmJ1dHRvbkRvd249dHJ1ZTtcclxuICAgIC8vIGNvbnNvbGUubG9nKGV2ZW50KTtcclxuICB9KTtcclxuICAkKGRvY3VtZW50KS5vbihcIm1vdXNldXAgdG91Y2hlbmRcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBtb3VzZS5idXR0b25Eb3duPWZhbHNlO1xyXG4gIH0pO1xyXG4gIC8vIGRvY3VtZW50Lm9udG91Y2htb3ZlID0gZnVuY3Rpb24oZXZlbnQpe1xyXG4gIC8vICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAvLyB9XHJcbn0pOyIsIi8qXHJcblRoaXMgc2NyaXB0IGNvbnRhaW5zIGEgdGVtcGxhdGUgZm9yIGRhdGEtYmluZGluZyBtYW5hZ2VtZW50IGlmIHlvdSB3YW50IHRvIGRvIHNvLiBPdGhlcndpc2UsIGl0IHdpbGwganVzdCBwbGFjZWhvbGQgdmFyIG5hbWVzIHNvIHRoZXJlIGFyZSBubyB1bmRlZmluZWQgdmFycy5cclxuICAgIENvcHlyaWdodCAoQykgMjAxNiBKb2FxdcOtbiBBbGR1bmF0ZVxyXG5cclxuICAgIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbiAgICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG4gICAgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuICAgIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG4gICAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbiAgICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG4gICAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG4gICAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbiAgICBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG4gICAgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG5leHBvcnRzLmVuYWJsZT1mdW5jdGlvbigpe1xyXG4gIHJldHVybiBuZXcgU3luY21hbigpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gU3luY21hbigpe1xyXG4gIC8vbGlzdCBvZiBhbGwgdGhlIGl0ZW1zIHRoYXQgdXNlIGRhdGEgYmluZGluZ1xyXG4gIHRoaXMuYmluZExpc3Q9W107XHJcbiAgLy9ob3cgYXJlIHlvdSBlbWl0dGluZyBjaGFuZ2VzPyBpdCBkZXBlbmRzIG9uIHRoZSBzZXJ2ZXIgeW91IHVzZS5cclxuICB0aGlzLmVtaXQ9ZnVuY3Rpb24oKXt9XHJcbn1cclxuIl19