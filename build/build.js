(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
"use strict";

var syncman, mouse;
// var $;
exports.enable = function (sman, m) {
  syncman = sman;
  mouse = m;
  return Sequencer;
};

function SequencerButton(n, parent) {
  this.jq = $('<div class="seqbutton"></div>');
  this._bindN = syncman.bindList.push(this) - 1;
  parent.jq.append(this.jq);
  this.data = 0;
  //pendant: evaluate wether the var n is still useful. remove it at every end.
  this.n = n;
  var me = this;
  this.setData = function (to, emit) {
    if (emit == true) {
      sockChange("seqb:" + me._bindN + "", "sV", to);
    }
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

},{}],3:[function(require,module,exports){
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
  this.vertical = true;
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

},{}],4:[function(require,module,exports){
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
  Button: Button
};
window.MsComponents = MsComponents;
console.log(MsComponents);

},{"./Button.js":1,"./Sequencer.js":2,"./Slider.js":3,"./mouse.js":5,"./syncman.js":6}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}]},{},[4])

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXEJ1dHRvbi5qcyIsInNyY1xcU2VxdWVuY2VyLmpzIiwic3JjXFxTbGlkZXIuanMiLCJzcmNcXGluZGV4LmpzIiwic3JjXFxtb3VzZS5qcyIsInNyY1xcc3luY21hbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBLElBQUksT0FBSixFQUFZLEtBQVo7QUFDQSxRQUFRLE1BQVIsR0FBZSxVQUFTLElBQVQsRUFBYyxDQUFkLEVBQWdCO0FBQzdCLFlBQVEsSUFBUjtBQUNBLFVBQU0sQ0FBTjtBQUNBLFNBQU8sTUFBUDtBQUNELENBSkQ7QUFLQSxTQUFTLE1BQVQsQ0FBZ0IsTUFBaEIsRUFBdUIsT0FBdkIsRUFBK0I7QUFDN0I7QUFDQTtBQUNBO0FBQ0EsT0FBSyxJQUFMLEdBQVUsRUFBQyxPQUFNLENBQVAsRUFBVjtBQUNBLE9BQUssTUFBTCxHQUFZLEtBQVo7QUFDQSxPQUFLLE1BQUwsR0FBWSxRQUFRLFFBQVIsQ0FBaUIsSUFBakIsQ0FBc0IsSUFBdEIsSUFBNEIsQ0FBeEM7QUFDQSxPQUFLLEdBQUwsR0FBUyxFQUFFLCtCQUFGLENBQVQ7QUFDQSxPQUFLLEtBQUwsR0FBVyxRQUFRLEtBQVIsSUFBZSxHQUExQjtBQUNBLE9BQUssR0FBTCxDQUFTLE1BQVQsQ0FBZ0IsS0FBSyxRQUFyQjtBQUNBLE9BQUssR0FBTCxDQUFTLElBQVQsQ0FBYyxLQUFLLEtBQW5CO0FBQ0EsTUFBRyxRQUFRLEdBQVgsRUFDRSxLQUFLLEdBQUwsQ0FBUyxHQUFULENBQWEsUUFBUSxHQUFyQjtBQUNGLE9BQUssR0FBTCxHQUFTLFVBQVMsR0FBVCxFQUFhO0FBQ3BCLFNBQUssR0FBTCxDQUFTLEdBQVQsQ0FBYSxRQUFRLEdBQXJCO0FBQ0EsV0FBTyxJQUFQO0FBQ0QsR0FIRDtBQUlBO0FB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UUFBTTtBQUNSLFFBQUs7QUFERyxDQUFWOztBQUtBLEVBQUUsUUFBRixFQUFZLEtBQVosQ0FBa0IsWUFBVTtBQUMxQixJQUFFLFFBQUYsRUFBWSxFQUFaLENBQWUsZ0NBQWYsRUFBZ0QsVUFBUyxLQUFULEVBQWU7QUFDN0QsVUFBTSxVQUFOLEdBQWlCLElBQWpCO0FBQ0E7QUFDRCxHQUhEO0FBSUEsSUFBRSxRQUFGLEVBQVksRUFBWixDQUFlLGtCQUFmLEVBQWtDLFVBQVMsS0FBVCxFQUFlO0FBQy9DLFVBQU0sVUFBTixHQUFpQixLQUFqQjtBQUNELEdBRkQ7QUFHQTtBQUNBO0FBQ0E7QUFDRCxDQVhEOzs7OztBQ1JBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkEsUUFBUSxNQUFSLEdBQWUsWUFBVTtBQUN2QixXQUFPLElBQUksT0FBSixFQUFQO0FBQ0QsQ0FGRDs7QUFJQSxTQUFTLE9BQVQsR0FBa0I7QUFDaEI7QUFDQSxTQUFLLFFBQUwsR0FBYyxFQUFkO0FBQ0E7QUFDQSxTQUFLLElBQUwsR0FBVSxZQUFVLENBQUUsQ0FBdEI7QUFDRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxyXG5UaGlzIHNjcmlwdCBjcmVhdGUgRE9NIHNsaWRlcnMgdGhhdCBjYW4gYmUgdXNlZCBpbiB3ZWIgYnJvd3NlciB0byBjb250cm9sIHN0dWZmLiBUaGV5IGNhbiBiZSBzeW5jZWQgdGhyb3VnaCBzb2NrZXRzIGFuZCBvdGhlcnMgYnkgdXNpbmcgY2FsbGJhY2tzLlxyXG4gICAgQ29weXJpZ2h0IChDKSAyMDE2IEpvYXF1w61uIEFsZHVuYXRlXHJcblxyXG4gICAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcclxuICAgIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbiAgICB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4gICAgKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cclxuXHJcbiAgICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuICAgIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbiAgICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbiAgICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG5cclxuICAgIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbiAgICBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxudmFyIHN5bmNtYW4sbW91c2U7XHJcbmV4cG9ydHMuZW5hYmxlPWZ1bmN0aW9uKHNtYW4sbSl7XHJcbiAgc3luY21hbj1zbWFuO1xyXG4gIG1vdXNlPW07XHJcbiAgcmV0dXJuIEJ1dHRvbjtcclxufTtcclxuZnVuY3Rpb24gQnV0dG9uKHBhcmVudCxvcHRpb25zKXtcclxuICAvL215IHJlZmVyZW5jZSBudW1iZXIgZm9yIGRhdGEgYmluZGluZy4gV2l0aCB0aGlzIG51bWJlciB0aGUgc29ja2V0IGJpbmRlciBrbm93cyB3aG8gaXMgdGhlIHJlY2lldmVyIG9mIHRoZSBkYXRhLCBhbmQgYWxzbyB3aXRoIHdoYXQgbmFtZSB0byBzZW5kIGl0XHJcbiAgLy9wZW5kYW50OiB0aGlzIGNhbiBwb3RlbnRpYWxseSBjcmVhdGUgYSBwcm9ibGVtLCBiZWNhdXNlIHR3byBvYmplY3RzIGNhbiBiZSBjcmVhdGVkIHNpbXVsdGFuZW91c2x5IGF0IGRpZmZlcmVudCBlbmRzIGF0IHRoZSBzYW1lIHRpbWUuXHJcbiAgLy9tYXliZSBpbnN0ZWFkIG9mIHRoZSBzaW1wbGUgcHVzaCwgdGhlcmUgY291bGQgYmUgYSBjYWxsYmFjaywgYWRuIHRoZSBvYmplY3Qgd2FpdHMgdG8gcmVjZWl2ZSBpdCdzIHNvY2tldCBpZCBvbmNlIGl0cyBjcmVhdGlvbiB3YXMgcHJvcGFnYXRlZCB0aHJvdWdob3V0IGFsbCB0aGUgbmV0d29yaywgb3IgbWF5YmUgdGhlcmUgaXMgYW4gYXJyYXkgZm9yIHNlbnRpbmcgYW5kIG90aGVyIGRpZmZlcmVudCBmb3IgcmVjZWl2aW5nLi4uIGZpcnN0IG9wdGlvbiBzZWVtcyBtb3JlIHNlbnNpYmxlXHJcbiAgdGhpcy5kYXRhPXt2YWx1ZTowfTtcclxuICB0aGlzLnN0YXRlcz1mYWxzZTtcclxuICB0aGlzLl9iaW5kTj1zeW5jbWFuLmJpbmRMaXN0LnB1c2godGhpcyktMTtcclxuICB0aGlzLiRqcT0kKCc8ZGl2IGNsYXNzPVwibXMtYnV0dG9uXCI+PC9kaXY+Jyk7XHJcbiAgdGhpcy5sYWJlbD1vcHRpb25zLmxhYmVsfHxcIuKYu1wiO1xyXG4gIHRoaXMuJGpxLmFwcGVuZCh0aGlzLiRmYWRlcmpxKTtcclxuICB0aGlzLiRqcS5odG1sKHRoaXMubGFiZWwpO1xyXG4gIGlmKG9wdGlvbnMuY3NzKVxyXG4gICAgdGhpcy4kanEuY3NzKG9wdGlvbnMuY3NzKTtcclxuICB0aGlzLmNzcz1mdW5jdGlvbihjc3Mpe1xyXG4gICAgdGhpcy4kanEuY3NzKG9wdGlvbnMuY3NzKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuICAvL2lmIGEgc3dpdGNoIHZhcmlhYmxlIGlzIHBhc3NlZCwgdGhpcyBidXR0b24gd2lsbCBzd2l0Y2ggb24gZWFjaCBjbGljayBhbW9uZyB0aGUgc3RhdGVkIHN0YXRlc1xyXG4gIGlmKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoXCJzd2l0Y2hcIikpe1xyXG4gICAgdGhpcy5zdGF0ZXM9W107XHJcbiAgICB0aGlzLmRhdGEuY3VycmVudFN0YXRlPTA7XHJcbiAgICB0aGlzLnN0YXRlcz1vcHRpb25zLnN3aXRjaDtcclxuICAgIHRoaXMuc3dpdGNoU3RhdGUoMCk7XHJcbiAgfVxyXG4gIHRoaXMub25DbGlja0NhbGxiYWNrPWZ1bmN0aW9uKCl7fTtcclxuICB0aGlzLm9uUmVsZWFzZUNhbGxiYWNrPWZ1bmN0aW9uKCl7fTtcclxuICAvL3BlbmRhbnQ6IHRoaXMgc2hvdWxkIGJlIHBhcnQgb2YgYSBiYXNlIHByb3RvdHlwZSwgbm90IHJlcGVhdGVkIGluIGVhY2ggdHlwZVxyXG4gIGlmKHR5cGVvZiAocGFyZW50LmFwcGVuZHx8ZmFsc2UpPT1cImZ1bmN0aW9uXCIpe1xyXG4gICAgcGFyZW50LmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgfWVsc2UgaWYodHlwZW9mIChwYXJlbnQuJGpxLmFwcGVuZHx8ZmFsc2UpPT1cImZ1bmN0aW9uXCIpe1xyXG4gICAgcGFyZW50LiRqcS5hcHBlbmQodGhpcy4kanEpO1xyXG4gIH1lbHNle1xyXG4gICAgY29uc29sZS5sb2coXCJhIHNsaWRlciBjb3VsZG4ndCBmaW5kIGRvbSBlbGVtZW50IHRvIGF0dGFjaCBoaW1zZWxmXCIpO1xyXG4gIH1cclxuICB2YXIgbWU9dGhpcztcclxuICAvLyB0aGlzLm9uQ2hhbmdlPWZ1bmN0aW9uKGNhbGxiYWNrKXtcclxuICAvLyAgIG1lLm9uQ2xpY2tDYWxsYmFjaz1mdW5jdGlvbigpe2NhbGxiYWNrKG1lLmRhdGEpfTtcclxuICAvLyAgIHJldHVybiB0aGlzO1xyXG4gIC8vIH1cclxuXHJcbiAgdGhpcy4kanEub24oXCJtb3VzZWRvd24gdGFwIHRvdWNoc3RhcnRcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBtZS5vbkNsaWNrQ2FsbGJhY2sobWUuZGF0YSk7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgbWUuc3dpdGNoU3RhdGUoKTtcclxuICAgIG1lLmFkZENsYXNzKFwiYWN0aXZlXCIpO1xyXG4gIH0pO1xyXG4gIHRoaXMuJGpxLm9uKFwibW91c2V1cCBtb3VzZWxlYXZlXCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgbWUub25SZWxlYXNlQ2FsbGJhY2sobWUuZGF0YSk7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgbWUucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIik7XHJcbiAgfSk7XHJcbn1cclxuXHJcbkJ1dHRvbi5wcm90b3R5cGUudXBkYXRlRG9tPWZ1bmN0aW9uKCl7XHJcbiAgdGhpcy4kanEuaHRtbCh0aGlzLmxhYmVsKTtcclxufVxyXG5cclxuQnV0dG9uLnByb3RvdHlwZS5vbkNsaWNrPWZ1bmN0aW9uKGNhbGxiYWNrKXtcclxuICB0aGlzLm9uQ2xpY2tDYWxsYmFjaz1jYWxsYmFjaztcclxuICByZXR1cm4gdGhpcztcclxufVxyXG5CdXR0b24ucHJvdG90eXBlLm9uUmVsZWFzZT1mdW5jdGlvbihjYWxsYmFjayl7XHJcbiAgdGhpcy5vblJlbGVhc2VDYWxsYmFjaz1jYWxsYmFjaztcclxuICByZXR1cm4gdGhpcztcclxufVxyXG5CdXR0b24ucHJvdG90eXBlLnN3aXRjaFN0YXRlPWZ1bmN0aW9uKHRvKXtcclxuICBpZih0aGlzLnN0YXRlcyl7XHJcbiAgICAvL2NoYW5nZSBzdGF0ZSBudW1iZXIgdG8gbmV4dFxyXG4gICAgaWYodG8pe1xyXG4gICAgICB0aGlzLmRhdGEuY3VycmVudFN0YXRlPXRvJXRoaXMuc3RhdGVzLmxlbmd0aDtcclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLmRhdGEuY3VycmVudFN0YXRlPSh0aGlzLmRhdGEuY3VycmVudFN0YXRlKzEpJXRoaXMuc3RhdGVzLmxlbmd0aDtcclxuICAgIH1cclxuICAgIC8vYXBwbHkgYWxsIHRoZSBwcm9wZXJ0aWVzIHRoYXQgdGhlIHN0YXRlIGNhcnJ5LiBUaGlzIG1ha2VzIHRoZSBidXR0b24gc3VwZXIgaGFja2FibGVcclxuICAgIGZvcihhIGluIHRoaXMuc3RhdGVzW3RoaXMuZGF0YS5jdXJyZW50U3RhdGVdKXtcclxuICAgICAgdGhpc1thXT10aGlzLnN0YXRlc1t0aGlzLmRhdGEuY3VycmVudFN0YXRlXVthXTtcclxuICAgICAgLy8gY29uc29sZS5sb2coXCJbXCIrYStcIl1cIix0aGlzW2FdKTtcclxuICAgIH1cclxuICB9XHJcbiAgdGhpcy51cGRhdGVEb20oKTtcclxufVxyXG4vL2FsaWFzaW5nIG9mIHRoZXNlIHR3byBoYW5keSBmdW5jdGlvblxyXG5CdXR0b24ucHJvdG90eXBlLmFkZENsYXNzPWZ1bmN0aW9uKHRvKXtcclxuICB0aGlzLiRqcS5hZGRDbGFzcyh0byk7XHJcbn1cclxuQnV0dG9uLnByb3RvdHlwZS5yZW1vdmVDbGFzcz1mdW5jdGlvbih0byl7XHJcbiAgdGhpcy4kanEucmVtb3ZlQ2xhc3ModG8pO1xyXG59IiwidmFyIHN5bmNtYW4sbW91c2U7XHJcbi8vIHZhciAkO1xyXG5leHBvcnRzLmVuYWJsZT1mdW5jdGlvbihzbWFuLG0pe1xyXG4gIHN5bmNtYW49c21hbjtcclxuICBtb3VzZT1tO1xyXG4gIHJldHVybiBTZXF1ZW5jZXI7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBTZXF1ZW5jZXJCdXR0b24obixwYXJlbnQpe1xyXG4gIHRoaXMuanE9JCgnPGRpdiBjbGFzcz1cInNlcWJ1dHRvblwiPjwvZGl2PicpO1xyXG4gIHRoaXMuX2JpbmROPXN5bmNtYW4uYmluZExpc3QucHVzaCh0aGlzKS0xO1xyXG4gIHBhcmVudC5qcS5hcHBlbmQodGhpcy5qcSk7XHJcbiAgdGhpcy5kYXRhPTA7XHJcbiAgLy9wZW5kYW50OiBldmFsdWF0ZSB3ZXRoZXIgdGhlIHZhciBuIGlzIHN0aWxsIHVzZWZ1bC4gcmVtb3ZlIGl0IGF0IGV2ZXJ5IGVuZC5cclxuICB0aGlzLm49bjtcclxuICB2YXIgbWU9dGhpcztcclxuICB0aGlzLnNldERhdGE9ZnVuY3Rpb24odG8sZW1pdCl7XHJcbiAgICBpZihlbWl0PT10cnVlKXtcclxuICAgICAgc29ja0NoYW5nZShcInNlcWI6XCIrbWUuX2JpbmROK1wiXCIsXCJzVlwiLHRvKTtcclxuICAgIH1cclxuICAgIC8vc29ja2V0IG1heSBzZXQgZGF0YSB0byAwIHdoZW4gaXMgYWxyZWFkeSAwLCBnZW5lcmF0aW5nIGRpc3BsYWNlIG9mIHBhcmVudCdzIGFsaXZlZGhpbGRcclxuICAgIGlmKHRvIT10aGlzLmRhdGEpe1xyXG4gICAgICBpZih0bz09MSl7XHJcbiAgICAgICAgdGhpcy5kYXRhPTE7XHJcbiAgICAgICAgdGhpcy5qcS5hZGRDbGFzcyhcIm9uXCIpO1xyXG4gICAgICAgIHBhcmVudC5hbGl2ZUNoaWxkKys7XHJcbiAgICAgIH1cclxuICAgICAgaWYodG89PTApe1xyXG4gICAgICAgIHRoaXMuZGF0YT0wO1xyXG4gICAgICAgIHRoaXMuanEucmVtb3ZlQ2xhc3MoXCJvblwiKTtcclxuICAgICAgICBwYXJlbnQuYWxpdmVDaGlsZC0tO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBjb25zb2xlLmxvZyhwYXJlbnQuYWxpdmVDaGlsZCk7XHJcbiAgfVxyXG4gIHRoaXMuanEub24oXCJtb3VzZWRvd24gdGFwIHRvdWNoc3RhcnRcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgbWUuc2V0RGF0YShNYXRoLmFicyhtZS5kYXRhLTEpLHRydWUpO1xyXG4gICAgLy8gbWUuZGF0YT07XHJcbiAgICBpZihtZS5kYXRhPT0xKXtcclxuICAgICAgIG1vdXNlLnN3aXRjaGluZz10cnVlO1xyXG4gICAgfWVsc2V7XHJcbiAgICAvLyAgICQodGhpcykucmVtb3ZlQ2xhc3MoXCJvblwiKTtcclxuICAgIC8vICAgcGFyZW50LmFsaXZlQ2hpbGQtLTtcclxuICAgICAgIG1vdXNlLnN3aXRjaGluZz1mYWxzZTtcclxuICAgICB9XHJcbiAgfSk7XHJcbiAgdGhpcy5qcS5vbihcIm1vdXNlZW50ZXIgdG91Y2hlbnRlclwiLGZ1bmN0aW9uKCl7XHJcbiAgICBpZihtb3VzZS5idXR0b25Eb3duKXtcclxuICAgICAgaWYobW91c2Uuc3dpdGNoaW5nKXtcclxuICAgICAgICBpZihtZS5kYXRhPT0wKXtcclxuICAgICAgICAgIG1lLnNldERhdGEoMSx0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIGlmKG1lLmRhdGE9PTEpe1xyXG4gICAgICAgICAgbWUuc2V0RGF0YSgwLHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHRoaXMuZXZhbD1mdW5jdGlvbigpe1xyXG4gICAgdmFyIGpxPXRoaXMuanE7XHJcbiAgICBqcS5hZGRDbGFzcyhcInR1cm5cIik7XHJcbiAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICBqcS5yZW1vdmVDbGFzcyhcInR1cm5cIik7XHJcbiAgICB9LDIwMCk7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhO1xyXG4gIH1cclxufVxyXG4vL2RlZmluZXMgYWxsIHRoZSBzZXF1ZW5jZXIgcGFyYW1ldGVycyBieSBtYXRoLFxyXG4vL21heWJlIGluIGEgZnVudHVyZSBieSBzdHlsaW5nIHRhYmxlXHJcbnZhciBzZXFQcm9nPTQ7XHJcbmZ1bmN0aW9uIFNlcXVlbmNlcihwYXJlbnQsb3B0aW9ucyl7XHJcbiAgdmFyIG49b3B0aW9ucy5ufHwzO1xyXG4gIHRoaXMuanE9JCgnPGRpdiBjbGFzcz1cInNlcXVlbmNlclwiIGlkPVwic2VxXycrbisnXCI+PHAgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZVwiPjwvcD48L2Rpdj4nKTtcclxuICBwYXJlbnQuYXBwZW5kKHRoaXMuanEpO1xyXG4gIHRoaXMuYWxpdmU9ZmFsc2U7XHJcbiAgdGhpcy5fYmluZE49c3luY21hbi5iaW5kTGlzdC5wdXNoKHRoaXMpLTE7XHJcbiAgdGhpcy5wb3M9MDtcclxuICB0aGlzLmRhdGE9W107XHJcbiAgdGhpcy5sZW49TWF0aC5wb3coMiwoc2VxUHJvZyU1KSsxKTtcclxuICB0aGlzLmV2cnk9TWF0aC5wb3coMiwoc2VxUHJvZyU0KSsxKTtcclxuICAvL211c3QgY291bnQgYW4gW2V2ZXJ5XSBhbW91bnQgb2YgYmVhdHMgZm9yIGVhY2ggcG9zIGluY3JlbWVudC5cclxuICB0aGlzLnN1YnBvcz0wO1xyXG4gIHRoaXMuanEuY3NzKHt3aWR0aDoxNipNYXRoLmNlaWwodGhpcy5sZW4vNCkrXCJweFwifSk7XHJcbiAgLy90aGlzLmpxLmFkZENsYXNzKFwiY29sb3JfXCIrc2VxUHJvZyVjaGFubmVscy5sZW5ndGgpO1xyXG4gIHRoaXMuZGlzcD0wO1xyXG4gIHRoaXMuaWQ9bjtcclxuICB0aGlzLmJlYXREaXNwbGFjZT0wO1xyXG4gIHZhciBtZT10aGlzO1xyXG4gIHNlcVByb2crKztcclxuICAvL3RoaXMuY2hhbm5lbD1jaGFubmVsc1t0aGlzLmlkJWNoYW5uZWxzLmxlbmd0aF07XHJcbiAgZm9yKHZhciBibj0wOyBibjx0aGlzLmxlbjsgYm4rKyl7XHJcbiAgICB0aGlzLmRhdGFbYm5dPW5ldyBTZXF1ZW5jZXJCdXR0b24oYm4sdGhpcylcclxuICB9XHJcbiAgdGhpcy5hbGl2ZUNoaWxkPTA7XHJcbiAgdGhpcy5kaXNwbGFjZT0wO1xyXG4gIHRoaXMuc2V0RGlzcGxhY2U9ZnVuY3Rpb24odG8sZW1pdCl7XHJcbiAgICBpZihlbWl0PT1cIm9ubHlcIil7XHJcbiAgICAgIGVtaXQ9dHJ1ZTtcclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLnN1YnBvcz0oKHRyYW5zcG9ydEN1cnJlbnRTdGVwKSUodGhpcy5sZW4qdGhpcy5ldnJ5KSkrdG87XHJcbiAgICB9XHJcbiAgICBpZihlbWl0PT10cnVlKXtcclxuICAgICAgc29ja0NoYW5nZShcInNlcTpcIittZS5fYmluZE4rXCJcIixcImRzcGxcIix0byk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHRoaXMuc3RlcD1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHByZXZhbGl2ZT10aGlzLmFsaXZlO1xyXG4gICAgdGhpcy5hbGl2ZT10aGlzLmFsaXZlQ2hpbGQ+MDtcclxuICAgIGlmKHRoaXMuYWxpdmUpe1xyXG4gICAgICAvL2lmIHRoZSBzdGF0ZSBvZiB0aGlzLmFsaXZlIGNoYW5nZXMsIHdlIG11c3QgZW1pdCB0aGUgZGlzcGxhY2VtZW50LCBiZWNhdXNlIGl0IGlzIG5ld1xyXG4gICAgICBpZighcHJldmFsaXZlKXtcclxuICAgICAgICB0aGlzLmRpc3BsYWNlPSh0cmFuc3BvcnRDdXJyZW50U3RlcCt0aGlzLnN1YnBvcyklKHRoaXMubGVuKnRoaXMuZXZyeSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJvay4gZW1pdCBkaXNwbGFlOiBcIit0aGlzLmRpc3BsYWNlKTtcclxuICAgICAgICB0aGlzLnNldERpc3BsYWNlKHRoaXMuZGlzcGxhY2UsXCJvbmx5XCIpO1xyXG4gICAgICB9O1xyXG4gICAgICAvL2VhY2ggc2VxdWVuY2VyIGhhcyBhIGRpZmZlcmVudCBzcGVlZCByYXRlcy4gd2hpbGUgc29tZSBwbGF5cyBvbmUgc3RlcCBwZXIgY2xpY2ssIG90aGVycyB3aWxsIGhhdmUgb25lIHN0ZXAgcGVyIHNldmVyYWwgY2xvY2sgdGlja3MuXHJcbiAgICAgIC8vdGhlIHNlcXVlbmNlciBzdGFydGluZyBwb2ludCBpcyBhbHNvIGRpc3BsYWNlZCwgYW5kIGl0IGRlcGVuZHMgb24gdGhlIHRpbWUgd2hlbiBpdCBnb3QgYWxpdmVkK2l0cyBwb3NpdGlvbiBhdCB0aGF0IG1vbWVudC5cclxuICAgICAgaWYodGhpcy5zdWJwb3MldGhpcy5ldnJ5PT0wKXtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcInNxXCIrdGhpcy5wb3MpO1xyXG4gICAgICAgIC8vIGRhdGE9e3NlcXVlbmNlcjp0aGlzLmlkLHBvczp0aGlzLnBvcyxzdGVwVmFsOnRoaXMuZGF0YVt0aGlzLnBvc10uZXZhbCgpfTtcclxuICAgICAgICAvLyB0aGlzLm9uU3RlcFRyaWdnZXIoZGF0YSk7XHJcbiAgICAgICAgLy8gc3RlcEZ1bmN0aW9uKGRhdGEpO1xyXG4gICAgICAgIHRoaXMucG9zPSh0aGlzLnN1YnBvcy90aGlzLmV2cnkpJSh0aGlzLmxlbik7XHJcbiAgICAgICAgaWYodGhpcy5kYXRhW3RoaXMucG9zXS5ldmFsKCk9PTEpe1xyXG4gICAgICAgICAgLy8gdGhpcy5jaGFubmVsLmVuZ2luZS5zdGFydCgwLHRoaXMuY2hhbm5lbC5zdGFydE9mZnNldCx0aGlzLmNoYW5uZWwuZW5kVGltZSk7XHJcbiAgICAgICAgICAvL3NvLCB0aGlzIGlzIGNhbGxlZCBlbHNld2hlcmUgYXN3ZWxsbC4uLi4gdGhlIGNoYW5uZWwgc2hvdWxkIGhhdmUgYSB0cmlnZ2VyIGZ1bmN0aW9uXHJcbiAgICAgICAgICB2YXIgbG9vcFN0YXJ0PXRoaXMuY2hhbm5lbC5zdGFydE9mZnNldDtcclxuICAgICAgICAgIHZhciBsb29wRW5kPXRoaXMuY2hhbm5lbC5lbmRUaW1lO1xyXG4gICAgICAgICAgdGhpcy5jaGFubmVsLnNhbXBsZXIudHJpZ2dlckF0dGFjayhmYWxzZSwwLDEse3N0YXJ0Omxvb3BTdGFydCxlbmQ6bG9vcEVuZH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfWVsc2V7XHJcbiAgICAgIH1cclxuICAgICAgLy93aGF0IGlzIG1vcmUgZWNvbm9taWM/P1xyXG4gICAgICAvLyB0aGlzLnN1YnBvcz0odGhpcy5zdWJwb3MrMSklKHRoaXMubGVuKnRoaXMuZXZyeSk7XHJcbiAgICAgIC8vaSBndWVzcyB0aGF0Li4gYnV0IGl0IGNhbiBncm93IGV0ZXJuYWxseVxyXG4gICAgICB0aGlzLnN1YnBvcysrO1xyXG4gICAgfVxyXG4gIH1cclxuICB0aGlzLmRpZT1mdW5jdGlvbigpe1xyXG4gICAgZm9yKHZhciBibiBpbiB0aGlzLmRhdGEpe1xyXG4gICAgICB0aGlzLmRhdGFbYm5dLnNldERhdGEoMCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmFsaXZlPWZhbHNlO1xyXG4gICAgdGhpcy5qcS5kZXRhY2goKTtcclxuICB9XHJcbiAgLy8gdGhpcy5vblN0ZXBUcmlnZ2VyPWZ1bmN0aW9uKGRhdGEpe1xyXG4gIC8vICAgLy8gY29uc29sZS5sb2coZGF0YSk7XHJcbiAgLy8gfVxyXG4gIHRoaXMuanEub24oXCJtb3VzZWVudGVyXCIsZnVuY3Rpb24oKXtcclxuICAgIGZvY3VzQ2hhbm5lbChtZS5jaGFubmVsLmlkKTtcclxuICB9KTtcclxufSIsIi8qXHJcblRoaXMgc2NyaXB0IGNyZWF0ZSBET00gc2xpZGVycyB0aGF0IGNhbiBiZSB1c2VkIGluIHdlYiBicm93c2VyIHRvIGNvbnRyb2wgc3R1ZmYuIFRoZXkgY2FuIGJlIHN5bmNlZCB0aHJvdWdoIHNvY2tldHMgYW5kIG90aGVycyBieSB1c2luZyBjYWxsYmFja3MuXHJcbiAgICBDb3B5cmlnaHQgKEMpIDIwMTYgSm9hcXXDrW4gQWxkdW5hdGVcclxuXHJcbiAgICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG4gICAgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcclxuICAgIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXHJcbiAgICAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuICAgIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG4gICAgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcclxuICAgIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuICAgIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG4gICAgWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcclxuICAgIGFsb25nIHdpdGggdGhpcyBwcm9ncmFtLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxyXG4qL1xyXG52YXIgc3luY21hbixtb3VzZTtcclxuLy8gdmFyICQ7XHJcbmV4cG9ydHMuZW5hYmxlPWZ1bmN0aW9uKHNtYW4sbSl7XHJcbiAgc3luY21hbj1zbWFuO1xyXG4gIG1vdXNlPW07XHJcbiAgcmV0dXJuIFNsaWRlcjtcclxufTtcclxuXHJcbi8qKlxyXG4qIFRoaXMgaXMgdGhlIGRlc2NyaXB0aW9uIGZvciBTbGlkZXIgY2xhc3NcclxuKlxyXG4qIEBjbGFzcyBTbGlkZXJcclxuKiBAY29uc3RydWN0b3JcclxuKi9cclxuZnVuY3Rpb24gU2xpZGVyKHBhcmVudCxvcHRpb25zKXtcclxuICAvL215IHJlZmVyZW5jZSBudW1iZXIgZm9yIGRhdGEgYmluZGluZy4gV2l0aCB0aGlzIG51bWJlciB0aGUgc29ja2V0IGJpbmRlciBrbm93cyB3aG8gaXMgdGhlIHJlY2lldmVyIG9mIHRoZSBkYXRhLCBhbmQgYWxzbyB3aXRoIHdoYXQgbmFtZSB0byBzZW5kIGl0XHJcbiAgLy9wZW5kYW50OiB0aGlzIGNhbiBwb3RlbnRpYWxseSBjcmVhdGUgYSBwcm9ibGVtLCBiZWNhdXNlIHR3byBvYmplY3RzIGNhbiBiZSBjcmVhdGVkIHNpbXVsdGFuZW91c2x5IGF0IGRpZmZlcmVudCBlbmRzIGF0IHRoZSBzYW1lIHRpbWUuXHJcbiAgLy9tYXliZSBpbnN0ZWFkIG9mIHRoZSBzaW1wbGUgcHVzaCwgdGhlcmUgY291bGQgYmUgYSBjYWxsYmFjaywgYWRuIHRoZSBvYmplY3Qgd2FpdHMgdG8gcmVjZWl2ZSBpdCdzIHNvY2tldCBpZCBvbmNlIGl0cyBjcmVhdGlvbiB3YXMgcHJvcGFnYXRlZCB0aHJvdWdob3V0IGFsbCB0aGUgbmV0d29yaywgb3IgbWF5YmUgdGhlcmUgaXMgYW4gYXJyYXkgZm9yIHNlbnRpbmcgYW5kIG90aGVyIGRpZmZlcmVudCBmb3IgcmVjZWl2aW5nLi4uIGZpcnN0IG9wdGlvbiBzZWVtcyBtb3JlIHNlbnNpYmxlXHJcbiAgdGhpcy5kYXRhPXt2YWx1ZTowfTtcclxuXHJcbiAgdGhpcy5fYmluZE49c3luY21hbi5iaW5kTGlzdC5wdXNoKHRoaXMpLTE7XHJcbiAgdGhpcy4kanE9JCgnPGRpdiBjbGFzcz1cInNsaWRlci1jb250YWluZXJcIiBzdHlsZT1cInBvc2l0aW9uOnJlbGF0aXZlXCI+PC9kaXY+Jyk7XHJcbiAgdGhpcy4kZmFkZXJqcT0kKCc8ZGl2IGNsYXNzPVwic2xpZGVyLWlubmVyXCIgc3R5bGU9XCJwb2ludGVyLWV2ZW50czpub25lOyBwb3NpdGlvbjphYnNvbHV0ZVwiPjwvZGl2PicpO1xyXG4gIHRoaXMubGFiZWw9b3B0aW9ucy5sYWJlbHx8XCJcIjtcclxuICB0aGlzLmxhYmVsanE9JCgnPHAgY2xhc3M9XCJzbGlkZXJsYWJlbFwiPjwvcD4nKTtcclxuICB0aGlzLiRqcS5hcHBlbmQodGhpcy4kZmFkZXJqcSk7XHJcbiAgdGhpcy4kanEuYXBwZW5kKHRoaXMubGFiZWxqcSk7XHJcbiAgaWYob3B0aW9ucy5jc3MpXHJcbiAgICB0aGlzLiRqcS5jc3Mob3B0aW9ucy5jc3MpO1xyXG4gIHRoaXMuY3NzPWZ1bmN0aW9uKGNzcyl7XHJcbiAgICB0aGlzLiRqcS5jc3MoY3NzKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuICB0aGlzLm9uQ2hhbmdlQ2FsbGJhY2s9ZnVuY3Rpb24oKXt9O1xyXG4gIC8vcGVuZGFudDogdGhpcyBzaG91bGQgYmUgcGFydCBvZiBhIGJhc2UgcHJvdG90eXBlLCBub3QgcmVwZWF0ZWQgaW4gZWFjaCB0eXBlXHJcbiAgaWYodHlwZW9mIChwYXJlbnQuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgICBwYXJlbnQuYXBwZW5kKHRoaXMuJGpxKTtcclxuICB9ZWxzZSBpZih0eXBlb2YgKHBhcmVudC4kanEuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgICBwYXJlbnQuJGpxLmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgfWVsc2V7XHJcbiAgICBjb25zb2xlLmxvZyhcImEgc2xpZGVyIGNvdWxkbid0IGZpbmQgZG9tIGVsZW1lbnQgdG8gYXR0YWNoIGhpbXNlbGZcIik7XHJcbiAgfVxyXG4gIHZhciBtZT10aGlzO1xyXG4gIHRoaXMub25DaGFuZ2U9ZnVuY3Rpb24oY2FsbGJhY2spe1xyXG4gICAgbWUub25DaGFuZ2VDYWxsYmFjaz1mdW5jdGlvbigpe2NhbGxiYWNrKG1lLmRhdGEpfTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuICAvKipcclxuKiBNeSBtZXRob2QgZGVzY3JpcHRpb24uICBMaWtlIG90aGVyIHBpZWNlcyBvZiB5b3VyIGNvbW1lbnQgYmxvY2tzLFxyXG4qIHRoaXMgY2FuIHNwYW4gbXVsdGlwbGUgbGluZXMuXHJcbipcclxuKiBAbWV0aG9kIG1ldGhvZE5hbWVcclxuKiBAcGFyYW0ge1N0cmluZ30gZm9vIEFyZ3VtZW50IDFcclxuKiBAcGFyYW0ge09iamVjdH0gY29uZmlnIEEgY29uZmlnIG9iamVjdFxyXG4qIEBwYXJhbSB7U3RyaW5nfSBjb25maWcubmFtZSBUaGUgbmFtZSBvbiB0aGUgY29uZmlnIG9iamVjdFxyXG4qIEBwYXJhbSB7RnVuY3Rpb259IGNvbmZpZy5jYWxsYmFjayBBIGNhbGxiYWNrIGZ1bmN0aW9uIG9uIHRoZSBjb25maWcgb2JqZWN0XHJcbiogQHBhcmFtIHtCb29sZWFufSBbZXh0cmE9ZmFsc2VdIERvIGV4dHJhLCBvcHRpb25hbCB3b3JrXHJcbiogQHJldHVybiB7Qm9vbGVhbn0gUmV0dXJucyB0cnVlIG9uIHN1Y2Nlc3NcclxuKi9cclxuICB0aGlzLnNldERhdGE9ZnVuY3Rpb24odG8sZW1pdCl7XHJcbiAgICBpZihlbWl0PT09dHJ1ZSl7XHJcbiAgICAgIC8vcGVuZGFudDogaW4gc2VxdWVuY2VycyB3ZSB1c2UgcGFyZW50LmlkLCBhbmQgaGVyZSB3ZSB1c2UgX2JpbmROLiBUb3dhcmRzIGEgY29udHJvbGxlciBBUEkgYW5kIGEgbW9yZSBzZW5zaWNhbCBjb2RlLCBJIHRoaW5rIGJvdGggc2hvdWxkIHVzZSB0aGUgYmluZCBlbGVtZW50IGFycmF5LiByZWFkIG5vdGUgaW4gZmlyc3QgbGluZSBvZiB0aGlzIGZpbGUuXHJcbiAgICAgIC8vcGVuZGFudDogcGFyZW50IGluIHNlcSBpcyB3aGF0IG1lIGlzIGhlcmUuIHRoaXMgaXMgcHJldHR5IGNvbmZ1c2luZyB2YXIgbmFtZSBkZWNpc2lvblxyXG4gICAgICBzeW5jbWFuLmVtaXQoXCJzbGlkOlwiK21lLl9iaW5kTitcIlwiLFwic1ZcIix0byk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmRhdGEudmFsdWU9dG87XHJcbiAgICB0aGlzLm9uQ2hhbmdlQ2FsbGJhY2soKTtcclxuICAgIHRoaXMudXBkYXRlRG9tKCk7XHJcbiAgfVxyXG4gIHRoaXMuYWRkQ2xhc3M9ZnVuY3Rpb24odG8pe1xyXG4gICAgdGhpcy4kanEuYWRkQ2xhc3ModG8pO1xyXG4gIH1cclxuICB0aGlzLnZlcnRpY2FsPXRydWU7XHJcbiAgdGhpcy5hZGRDbGFzcyhcInZlcnRpY2FsXCIpO1xyXG4gIHRoaXMuJGpxLm9uKFwibW91c2Vkb3duIHRhcCB0b3VjaHN0YXJ0XCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIGlmKG1lLnZlcnRpY2FsKXtcclxuICAgICAgbWUuc2V0RGF0YSgxLWV2ZW50Lm9mZnNldFkvbWUuJGpxLmhlaWdodCgpLHRydWUpOy8vLHRydWVcclxuICAgIH1lbHNle1xyXG4gICAgICBtZS5zZXREYXRhKGV2ZW50Lm9mZnNldFgvbWUuJGpxLndpZHRoKCksdHJ1ZSk7Ly8sdHJ1ZVxyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICB0aGlzLiRqcS5vbihcIm1vdXNlbW92ZSB0b3VjaGVudGVyIG1vdXNlbGVhdmUgbW91c2V1cFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIGlmKG1vdXNlLmJ1dHRvbkRvd24pe1xyXG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICB2YXIgZW1pdFRoaXM9ZXZlbnQudHlwZT09XCJtb3VzZWxlYXZlXCJ8fGV2ZW50LnR5cGU9PVwibW91c2V1cFwiXHJcbiAgICAgIGlmKG1lLnZlcnRpY2FsKXtcclxuICAgICAgICAvL3RoZSBzdHJhbmdlIHNlY29uZCBwYXJhbWVudGVyIGluIHNldGRhdGEgd2FzIHRydWUsIGJ1dCBpdCBjb3VsZCBjbG9nIHRoZSBzb2NrZXRcclxuICAgICAgICBtZS5zZXREYXRhKDEtZXZlbnQub2Zmc2V0WS9tZS4kanEuaGVpZ2h0KCksZW1pdFRoaXMpOy8vLHRydWVcclxuICAgICAgfWVsc2V7XHJcbiAgICAgICAgbWUuc2V0RGF0YShldmVudC5vZmZzZXRYL21lLiRqcS53aWR0aCgpLGVtaXRUaGlzKTsvLyx0cnVlXHJcbiAgICAgIH1cclxuICAgIH1lbHNle1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHRoaXMuZXZhbD1mdW5jdGlvbigpe1xyXG4gICAgdmFyIGpxPXRoaXMuJGpxO1xyXG4gICAganEuYWRkQ2xhc3MoXCJ0dXJuXCIpO1xyXG4gICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAganEucmVtb3ZlQ2xhc3MoXCJ0dXJuXCIpO1xyXG4gICAgfSwyMDApO1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YS52YWx1ZTtcclxuICB9XHJcbiAgdGhpcy51cGRhdGVEb209ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMudmVydGljYWwpe1xyXG4gICAgICB0aGlzLiRmYWRlcmpxLmNzcyh7Ym90dG9tOjAsd2lkdGg6XCIxMDAlXCIsaGVpZ2h0OnRoaXMuZGF0YS52YWx1ZSp0aGlzLiRqcS5oZWlnaHQoKX0pO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIHRoaXMubGFiZWxqcS5odG1sKHRoaXMubGFiZWwpO1xyXG4gICAgICB0aGlzLiRmYWRlcmpxLmNzcyh7Ym90dG9tOjAsd2lkdGg6dGhpcy5kYXRhLnZhbHVlKnRoaXMuJGpxLndpZHRoKCksaGVpZ2h0OlwiMTAwJVwifSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHRoaXMuc2V0RGF0YSgwKTtcclxufSIsIi8vIHZhciBzeW5jbWFuPXt9O1xyXG52YXIgc3luY21hbj1yZXF1aXJlKCcuL3N5bmNtYW4uanMnKS5lbmFibGUoKTtcclxudmFyIG1vdXNlPXJlcXVpcmUoJy4vbW91c2UuanMnKS5lbmFibGUoKTtcclxudmFyIFNsaWRlcj1yZXF1aXJlKCcuL1NsaWRlci5qcycpLmVuYWJsZShzeW5jbWFuLG1vdXNlKTtcclxudmFyIFNlcXVlbmNlcj1yZXF1aXJlKCcuL1NlcXVlbmNlci5qcycpLmVuYWJsZShzeW5jbWFuLG1vdXNlKTtcclxudmFyIEJ1dHRvbj1yZXF1aXJlKCcuL0J1dHRvbi5qcycpLmVuYWJsZShzeW5jbWFuLG1vdXNlKTtcclxudmFyIE1zQ29tcG9uZW50cz17XHJcbiAgU2xpZGVyOlNsaWRlcixcclxuICBTZXF1ZW5jZXI6U2VxdWVuY2VyLFxyXG4gIEJ1dHRvbjpCdXR0b25cclxufTtcclxud2luZG93Lk1zQ29tcG9uZW50cz1Nc0NvbXBvbmVudHM7XHJcbmNvbnNvbGUubG9nKE1zQ29tcG9uZW50cyk7IiwiZXhwb3J0cy5lbmFibGU9ZnVuY3Rpb24oKXtcclxuICByZXR1cm4gbW91c2U7XHJcbn1cclxudmFyIG1vdXNlPXtcclxuICB0b29sOlwiZHJhd1wiXHJcbn07XHJcblxyXG5cclxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcclxuICAkKGRvY3VtZW50KS5vbihcIm1vdXNlZG93biB0b3VjaHN0YXJ0IHRvdWNobW92ZVwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIG1vdXNlLmJ1dHRvbkRvd249dHJ1ZTtcclxuICAgIC8vIGNvbnNvbGUubG9nKGV2ZW50KTtcclxuICB9KTtcclxuICAkKGRvY3VtZW50KS5vbihcIm1vdXNldXAgdG91Y2hlbmRcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBtb3VzZS5idXR0b25Eb3duPWZhbHNlO1xyXG4gIH0pO1xyXG4gIC8vIGRvY3VtZW50Lm9udG91Y2htb3ZlID0gZnVuY3Rpb24oZXZlbnQpe1xyXG4gIC8vICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAvLyB9XHJcbn0pOyIsIi8qXHJcblRoaXMgc2NyaXB0IGNvbnRhaW5zIGEgdGVtcGxhdGUgZm9yIGRhdGEtYmluZGluZyBtYW5hZ2VtZW50IGlmIHlvdSB3YW50IHRvIGRvIHNvLiBPdGhlcndpc2UsIGl0IHdpbGwganVzdCBwbGFjZWhvbGQgdmFyIG5hbWVzIHNvIHRoZXJlIGFyZSBubyB1bmRlZmluZWQgdmFycy5cclxuICAgIENvcHlyaWdodCAoQykgMjAxNiBKb2FxdcOtbiBBbGR1bmF0ZVxyXG5cclxuICAgIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbiAgICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG4gICAgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuICAgIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG4gICAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbiAgICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG4gICAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG4gICAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbiAgICBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG4gICAgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG5leHBvcnRzLmVuYWJsZT1mdW5jdGlvbigpe1xyXG4gIHJldHVybiBuZXcgU3luY21hbigpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gU3luY21hbigpe1xyXG4gIC8vbGlzdCBvZiBhbGwgdGhlIGl0ZW1zIHRoYXQgdXNlIGRhdGEgYmluZGluZ1xyXG4gIHRoaXMuYmluZExpc3Q9W107XHJcbiAgLy9ob3cgYXJlIHlvdSBlbWl0dGluZyBjaGFuZ2VzPyBpdCBkZXBlbmRzIG9uIHRoZSBzZXJ2ZXIgeW91IHVzZS5cclxuICB0aGlzLmVtaXQ9ZnVuY3Rpb24oKXt9XHJcbn1cclxuIl19