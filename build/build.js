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
var seqProg = 0;
function Sequencer(parent, options) {
  var n = options.n || 3;
  parent.append('<div class="sequencer" id="seq_' + n + '"><p style="position:absolute"></p></div>');
  this.alive = false;
  this._bindN = syncman.bindList.push(this) - 1;
  this.jq = $('#seq_' + n);
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXEJ1dHRvbi5qcyIsInNyY1xcU2VxdWVuY2VyLmpzIiwic3JjXFxTbGlkZXIuanMiLCJzcmNcXGluZGV4LmpzIiwic3JjXFxtb3VzZS5qcyIsInNyY1xcc3luY21hbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBLElBQUksT0FBSixFQUFZLEtBQVo7QUFDQSxRQUFRLE1BQVIsR0FBZSxVQUFTLElBQVQsRUFBYyxDQUFkLEVBQWdCO0FBQzdCLFlBQVEsSUFBUjtBQUNBLFVBQU0sQ0FBTjtBQUNBLFNBQU8sTUFBUDtBQUNELENBSkQ7QUFLQSxTQUFTLE1BQVQsQ0FBZ0IsTUFBaEIsRUFBdUIsT0FBdkIsRUFBK0I7QUFDN0I7QUFDQTtBQUNBO0FBQ0EsT0FBSyxJQUFMLEdBQVUsRUFBQyxPQUFNLENBQVAsRUFBVjtBQUNBLE9BQUssTUFBTCxHQUFZLEtBQVo7QUFDQSxPQUFLLE1BQUwsR0FBWSxRQUFRLFFBQVIsQ0FBaUIsSUFBakIsQ0FBc0IsSUFBdEIsSUFBNEIsQ0FBeEM7QUFDQSxPQUFLLEdBQUwsR0FBUyxFQUFFLCtCQUFGLENBQVQ7QUFDQSxPQUFLLEtBQUwsR0FBVyxRQUFRLEtBQVIsSUFBZSxHQUExQjtBQUNBLE9BQUssR0FBTCxDQUFTLE1BQVQsQ0FBZ0IsS0FBSyxRQUFyQjtBQUNBLE9BQUssR0FBTCxDQUFTLElBQVQsQ0FBYyxLQUFLLEtBQW5CO0FBQ0EsTUFBRyxRQUFRLEdBQVgsRUFDRSxLQUFLLEdBQUwsQ0FBUyxHQUFULENBQWEsUUFBUSxHQUFyQjtBQUNGLE9BQUssR0FBTCxHQUFTLFVBQVMsR0FBVCxFQUFhO0FBQ3BCLFNBQUssR0FBTCxDQUFTLEdBQVQsQ0FBYSxRQUFRLEdBQXJCO0FBQ0EsV0FBTyxJQUFQO0FBQ0QsR0FIRDtBQUlBO0FB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QUtBLEVBQUUsUUFBRixFQUFZLEtBQVosQ0FBa0IsWUFBVTtBQUMxQixJQUFFLFFBQUYsRUFBWSxFQUFaLENBQWUsZ0NBQWYsRUFBZ0QsVUFBUyxLQUFULEVBQWU7QUFDN0QsVUFBTSxVQUFOLEdBQWlCLElBQWpCO0FBQ0E7QUFDRCxHQUhEO0FBSUEsSUFBRSxRQUFGLEVBQVksRUFBWixDQUFlLGtCQUFmLEVBQWtDLFVBQVMsS0FBVCxFQUFlO0FBQy9DLFVBQU0sVUFBTixHQUFpQixLQUFqQjtBQUNELEdBRkQ7QUFHQTtBQUNBO0FBQ0E7QUFDRCxDQVhEOzs7OztBQ1JBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkEsUUFBUSxNQUFSLEdBQWUsWUFBVTtBQUN2QixXQUFPLElBQUksT0FBSixFQUFQO0FBQ0QsQ0FGRDs7QUFJQSxTQUFTLE9BQVQsR0FBa0I7QUFDaEI7QUFDQSxTQUFLLFFBQUwsR0FBYyxFQUFkO0FBQ0E7QUFDQSxTQUFLLElBQUwsR0FBVSxZQUFVLENBQUUsQ0FBdEI7QUFDRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxyXG5UaGlzIHNjcmlwdCBjcmVhdGUgRE9NIHNsaWRlcnMgdGhhdCBjYW4gYmUgdXNlZCBpbiB3ZWIgYnJvd3NlciB0byBjb250cm9sIHN0dWZmLiBUaGV5IGNhbiBiZSBzeW5jZWQgdGhyb3VnaCBzb2NrZXRzIGFuZCBvdGhlcnMgYnkgdXNpbmcgY2FsbGJhY2tzLlxyXG4gICAgQ29weXJpZ2h0IChDKSAyMDE2IEpvYXF1w61uIEFsZHVuYXRlXHJcblxyXG4gICAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcclxuICAgIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbiAgICB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4gICAgKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cclxuXHJcbiAgICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuICAgIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbiAgICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbiAgICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG5cclxuICAgIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbiAgICBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxudmFyIHN5bmNtYW4sbW91c2U7XHJcbmV4cG9ydHMuZW5hYmxlPWZ1bmN0aW9uKHNtYW4sbSl7XHJcbiAgc3luY21hbj1zbWFuO1xyXG4gIG1vdXNlPW07XHJcbiAgcmV0dXJuIEJ1dHRvbjtcclxufTtcclxuZnVuY3Rpb24gQnV0dG9uKHBhcmVudCxvcHRpb25zKXtcclxuICAvL215IHJlZmVyZW5jZSBudW1iZXIgZm9yIGRhdGEgYmluZGluZy4gV2l0aCB0aGlzIG51bWJlciB0aGUgc29ja2V0IGJpbmRlciBrbm93cyB3aG8gaXMgdGhlIHJlY2lldmVyIG9mIHRoZSBkYXRhLCBhbmQgYWxzbyB3aXRoIHdoYXQgbmFtZSB0byBzZW5kIGl0XHJcbiAgLy9wZW5kYW50OiB0aGlzIGNhbiBwb3RlbnRpYWxseSBjcmVhdGUgYSBwcm9ibGVtLCBiZWNhdXNlIHR3byBvYmplY3RzIGNhbiBiZSBjcmVhdGVkIHNpbXVsdGFuZW91c2x5IGF0IGRpZmZlcmVudCBlbmRzIGF0IHRoZSBzYW1lIHRpbWUuXHJcbiAgLy9tYXliZSBpbnN0ZWFkIG9mIHRoZSBzaW1wbGUgcHVzaCwgdGhlcmUgY291bGQgYmUgYSBjYWxsYmFjaywgYWRuIHRoZSBvYmplY3Qgd2FpdHMgdG8gcmVjZWl2ZSBpdCdzIHNvY2tldCBpZCBvbmNlIGl0cyBjcmVhdGlvbiB3YXMgcHJvcGFnYXRlZCB0aHJvdWdob3V0IGFsbCB0aGUgbmV0d29yaywgb3IgbWF5YmUgdGhlcmUgaXMgYW4gYXJyYXkgZm9yIHNlbnRpbmcgYW5kIG90aGVyIGRpZmZlcmVudCBmb3IgcmVjZWl2aW5nLi4uIGZpcnN0IG9wdGlvbiBzZWVtcyBtb3JlIHNlbnNpYmxlXHJcbiAgdGhpcy5kYXRhPXt2YWx1ZTowfTtcclxuICB0aGlzLnN0YXRlcz1mYWxzZTtcclxuICB0aGlzLl9iaW5kTj1zeW5jbWFuLmJpbmRMaXN0LnB1c2godGhpcyktMTtcclxuICB0aGlzLiRqcT0kKCc8ZGl2IGNsYXNzPVwibXMtYnV0dG9uXCI+PC9kaXY+Jyk7XHJcbiAgdGhpcy5sYWJlbD1vcHRpb25zLmxhYmVsfHxcIuKYu1wiO1xyXG4gIHRoaXMuJGpxLmFwcGVuZCh0aGlzLiRmYWRlcmpxKTtcclxuICB0aGlzLiRqcS5odG1sKHRoaXMubGFiZWwpO1xyXG4gIGlmKG9wdGlvbnMuY3NzKVxyXG4gICAgdGhpcy4kanEuY3NzKG9wdGlvbnMuY3NzKTtcclxuICB0aGlzLmNzcz1mdW5jdGlvbihjc3Mpe1xyXG4gICAgdGhpcy4kanEuY3NzKG9wdGlvbnMuY3NzKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuICAvL2lmIGEgc3dpdGNoIHZhcmlhYmxlIGlzIHBhc3NlZCwgdGhpcyBidXR0b24gd2lsbCBzd2l0Y2ggb24gZWFjaCBjbGljayBhbW9uZyB0aGUgc3RhdGVkIHN0YXRlc1xyXG4gIGlmKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoXCJzd2l0Y2hcIikpe1xyXG4gICAgdGhpcy5zdGF0ZXM9W107XHJcbiAgICB0aGlzLmRhdGEuY3VycmVudFN0YXRlPTA7XHJcbiAgICB0aGlzLnN0YXRlcz1vcHRpb25zLnN3aXRjaDtcclxuICAgIHRoaXMuc3dpdGNoU3RhdGUoMCk7XHJcbiAgfVxyXG4gIHRoaXMub25DbGlja0NhbGxiYWNrPWZ1bmN0aW9uKCl7fTtcclxuICB0aGlzLm9uUmVsZWFzZUNhbGxiYWNrPWZ1bmN0aW9uKCl7fTtcclxuICAvL3BlbmRhbnQ6IHRoaXMgc2hvdWxkIGJlIHBhcnQgb2YgYSBiYXNlIHByb3RvdHlwZSwgbm90IHJlcGVhdGVkIGluIGVhY2ggdHlwZVxyXG4gIGlmKHR5cGVvZiAocGFyZW50LmFwcGVuZHx8ZmFsc2UpPT1cImZ1bmN0aW9uXCIpe1xyXG4gICAgcGFyZW50LmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgfWVsc2UgaWYodHlwZW9mIChwYXJlbnQuJGpxLmFwcGVuZHx8ZmFsc2UpPT1cImZ1bmN0aW9uXCIpe1xyXG4gICAgcGFyZW50LiRqcS5hcHBlbmQodGhpcy4kanEpO1xyXG4gIH1lbHNle1xyXG4gICAgY29uc29sZS5sb2coXCJhIHNsaWRlciBjb3VsZG4ndCBmaW5kIGRvbSBlbGVtZW50IHRvIGF0dGFjaCBoaW1zZWxmXCIpO1xyXG4gIH1cclxuICB2YXIgbWU9dGhpcztcclxuICAvLyB0aGlzLm9uQ2hhbmdlPWZ1bmN0aW9uKGNhbGxiYWNrKXtcclxuICAvLyAgIG1lLm9uQ2xpY2tDYWxsYmFjaz1mdW5jdGlvbigpe2NhbGxiYWNrKG1lLmRhdGEpfTtcclxuICAvLyAgIHJldHVybiB0aGlzO1xyXG4gIC8vIH1cclxuXHJcbiAgdGhpcy4kanEub24oXCJtb3VzZWRvd24gdGFwIHRvdWNoc3RhcnRcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBtZS5vbkNsaWNrQ2FsbGJhY2sobWUuZGF0YSk7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgbWUuc3dpdGNoU3RhdGUoKTtcclxuICAgIG1lLmFkZENsYXNzKFwiYWN0aXZlXCIpO1xyXG4gIH0pO1xyXG4gIHRoaXMuJGpxLm9uKFwibW91c2V1cCBtb3VzZWxlYXZlXCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgbWUub25SZWxlYXNlQ2FsbGJhY2sobWUuZGF0YSk7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgbWUucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIik7XHJcbiAgfSk7XHJcbn1cclxuXHJcbkJ1dHRvbi5wcm90b3R5cGUudXBkYXRlRG9tPWZ1bmN0aW9uKCl7XHJcbiAgdGhpcy4kanEuaHRtbCh0aGlzLmxhYmVsKTtcclxufVxyXG5cclxuQnV0dG9uLnByb3RvdHlwZS5vbkNsaWNrPWZ1bmN0aW9uKGNhbGxiYWNrKXtcclxuICB0aGlzLm9uQ2xpY2tDYWxsYmFjaz1jYWxsYmFjaztcclxuICByZXR1cm4gdGhpcztcclxufVxyXG5CdXR0b24ucHJvdG90eXBlLm9uUmVsZWFzZT1mdW5jdGlvbihjYWxsYmFjayl7XHJcbiAgdGhpcy5vblJlbGVhc2VDYWxsYmFjaz1jYWxsYmFjaztcclxuICByZXR1cm4gdGhpcztcclxufVxyXG5CdXR0b24ucHJvdG90eXBlLnN3aXRjaFN0YXRlPWZ1bmN0aW9uKHRvKXtcclxuICBpZih0aGlzLnN0YXRlcyl7XHJcbiAgICAvL2NoYW5nZSBzdGF0ZSBudW1iZXIgdG8gbmV4dFxyXG4gICAgaWYodG8pe1xyXG4gICAgICB0aGlzLmRhdGEuY3VycmVudFN0YXRlPXRvJXRoaXMuc3RhdGVzLmxlbmd0aDtcclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLmRhdGEuY3VycmVudFN0YXRlPSh0aGlzLmRhdGEuY3VycmVudFN0YXRlKzEpJXRoaXMuc3RhdGVzLmxlbmd0aDtcclxuICAgIH1cclxuICAgIC8vYXBwbHkgYWxsIHRoZSBwcm9wZXJ0aWVzIHRoYXQgdGhlIHN0YXRlIGNhcnJ5LiBUaGlzIG1ha2VzIHRoZSBidXR0b24gc3VwZXIgaGFja2FibGVcclxuICAgIGZvcihhIGluIHRoaXMuc3RhdGVzW3RoaXMuZGF0YS5jdXJyZW50U3RhdGVdKXtcclxuICAgICAgdGhpc1thXT10aGlzLnN0YXRlc1t0aGlzLmRhdGEuY3VycmVudFN0YXRlXVthXTtcclxuICAgICAgLy8gY29uc29sZS5sb2coXCJbXCIrYStcIl1cIix0aGlzW2FdKTtcclxuICAgIH1cclxuICB9XHJcbiAgdGhpcy51cGRhdGVEb20oKTtcclxufVxyXG4vL2FsaWFzaW5nIG9mIHRoZXNlIHR3byBoYW5keSBmdW5jdGlvblxyXG5CdXR0b24ucHJvdG90eXBlLmFkZENsYXNzPWZ1bmN0aW9uKHRvKXtcclxuICB0aGlzLiRqcS5hZGRDbGFzcyh0byk7XHJcbn1cclxuQnV0dG9uLnByb3RvdHlwZS5yZW1vdmVDbGFzcz1mdW5jdGlvbih0byl7XHJcbiAgdGhpcy4kanEucmVtb3ZlQ2xhc3ModG8pO1xyXG59IiwidmFyIHN5bmNtYW4sbW91c2U7XHJcbi8vIHZhciAkO1xyXG5leHBvcnRzLmVuYWJsZT1mdW5jdGlvbihzbWFuLG0pe1xyXG4gIHN5bmNtYW49c21hbjtcclxuICBtb3VzZT1tO1xyXG4gIHJldHVybiBTZXF1ZW5jZXI7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBTZXF1ZW5jZXJCdXR0b24obixwYXJlbnQpe1xyXG4gIHRoaXMuanE9JCgnPGRpdiBjbGFzcz1cInNlcWJ1dHRvblwiPjwvZGl2PicpO1xyXG4gIHRoaXMuX2JpbmROPXN5bmNtYW4uYmluZExpc3QucHVzaCh0aGlzKS0xO1xyXG4gIHBhcmVudC5qcS5hcHBlbmQodGhpcy5qcSk7XHJcbiAgdGhpcy5kYXRhPTA7XHJcbiAgLy9wZW5kYW50OiBldmFsdWF0ZSB3ZXRoZXIgdGhlIHZhciBuIGlzIHN0aWxsIHVzZWZ1bC4gcmVtb3ZlIGl0IGF0IGV2ZXJ5IGVuZC5cclxuICB0aGlzLm49bjtcclxuICB2YXIgbWU9dGhpcztcclxuICB0aGlzLnNldERhdGE9ZnVuY3Rpb24odG8sZW1pdCl7XHJcbiAgICBpZihlbWl0PT10cnVlKXtcclxuICAgICAgc29ja0NoYW5nZShcInNlcWI6XCIrbWUuX2JpbmROK1wiXCIsXCJzVlwiLHRvKTtcclxuICAgIH1cclxuICAgIC8vc29ja2V0IG1heSBzZXQgZGF0YSB0byAwIHdoZW4gaXMgYWxyZWFkeSAwLCBnZW5lcmF0aW5nIGRpc3BsYWNlIG9mIHBhcmVudCdzIGFsaXZlZGhpbGRcclxuICAgIGlmKHRvIT10aGlzLmRhdGEpe1xyXG4gICAgICBpZih0bz09MSl7XHJcbiAgICAgICAgdGhpcy5kYXRhPTE7XHJcbiAgICAgICAgdGhpcy5qcS5hZGRDbGFzcyhcIm9uXCIpO1xyXG4gICAgICAgIHBhcmVudC5hbGl2ZUNoaWxkKys7XHJcbiAgICAgIH1cclxuICAgICAgaWYodG89PTApe1xyXG4gICAgICAgIHRoaXMuZGF0YT0wO1xyXG4gICAgICAgIHRoaXMuanEucmVtb3ZlQ2xhc3MoXCJvblwiKTtcclxuICAgICAgICBwYXJlbnQuYWxpdmVDaGlsZC0tO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBjb25zb2xlLmxvZyhwYXJlbnQuYWxpdmVDaGlsZCk7XHJcbiAgfVxyXG4gIHRoaXMuanEub24oXCJtb3VzZWRvd24gdGFwIHRvdWNoc3RhcnRcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgbWUuc2V0RGF0YShNYXRoLmFicyhtZS5kYXRhLTEpLHRydWUpO1xyXG4gICAgLy8gbWUuZGF0YT07XHJcbiAgICBpZihtZS5kYXRhPT0xKXtcclxuICAgICAgIG1vdXNlLnN3aXRjaGluZz10cnVlO1xyXG4gICAgfWVsc2V7XHJcbiAgICAvLyAgICQodGhpcykucmVtb3ZlQ2xhc3MoXCJvblwiKTtcclxuICAgIC8vICAgcGFyZW50LmFsaXZlQ2hpbGQtLTtcclxuICAgICAgIG1vdXNlLnN3aXRjaGluZz1mYWxzZTtcclxuICAgICB9XHJcbiAgfSk7XHJcbiAgdGhpcy5qcS5vbihcIm1vdXNlZW50ZXIgdG91Y2hlbnRlclwiLGZ1bmN0aW9uKCl7XHJcbiAgICBpZihtb3VzZS5idXR0b25Eb3duKXtcclxuICAgICAgaWYobW91c2Uuc3dpdGNoaW5nKXtcclxuICAgICAgICBpZihtZS5kYXRhPT0wKXtcclxuICAgICAgICAgIG1lLnNldERhdGEoMSx0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIGlmKG1lLmRhdGE9PTEpe1xyXG4gICAgICAgICAgbWUuc2V0RGF0YSgwLHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHRoaXMuZXZhbD1mdW5jdGlvbigpe1xyXG4gICAgdmFyIGpxPXRoaXMuanE7XHJcbiAgICBqcS5hZGRDbGFzcyhcInR1cm5cIik7XHJcbiAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICBqcS5yZW1vdmVDbGFzcyhcInR1cm5cIik7XHJcbiAgICB9LDIwMCk7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhO1xyXG4gIH1cclxufVxyXG4vL2RlZmluZXMgYWxsIHRoZSBzZXF1ZW5jZXIgcGFyYW1ldGVycyBieSBtYXRoLFxyXG4vL21heWJlIGluIGEgZnVudHVyZSBieSBzdHlsaW5nIHRhYmxlXHJcbnZhciBzZXFQcm9nPTA7XHJcbmZ1bmN0aW9uIFNlcXVlbmNlcihwYXJlbnQsb3B0aW9ucyl7XHJcbiAgdmFyIG49b3B0aW9ucy5ufHwzO1xyXG4gIHBhcmVudC5hcHBlbmQoJzxkaXYgY2xhc3M9XCJzZXF1ZW5jZXJcIiBpZD1cInNlcV8nK24rJ1wiPjxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGVcIj48L3A+PC9kaXY+Jyk7XHJcbiAgdGhpcy5hbGl2ZT1mYWxzZTtcclxuICB0aGlzLl9iaW5kTj1zeW5jbWFuLmJpbmRMaXN0LnB1c2godGhpcyktMTtcclxuICB0aGlzLmpxPSQoJyNzZXFfJytuKTtcclxuICB0aGlzLnBvcz0wO1xyXG4gIHRoaXMuZGF0YT1bXTtcclxuICB0aGlzLmxlbj1NYXRoLnBvdygyLChzZXFQcm9nJTUpKzEpO1xyXG4gIHRoaXMuZXZyeT1NYXRoLnBvdygyLChzZXFQcm9nJTQpKzEpO1xyXG4gIC8vbXVzdCBjb3VudCBhbiBbZXZlcnldIGFtb3VudCBvZiBiZWF0cyBmb3IgZWFjaCBwb3MgaW5jcmVtZW50LlxyXG4gIHRoaXMuc3VicG9zPTA7XHJcbiAgdGhpcy5qcS5jc3Moe3dpZHRoOjE2Kk1hdGguY2VpbCh0aGlzLmxlbi80KStcInB4XCJ9KTtcclxuICAvL3RoaXMuanEuYWRkQ2xhc3MoXCJjb2xvcl9cIitzZXFQcm9nJWNoYW5uZWxzLmxlbmd0aCk7XHJcbiAgdGhpcy5kaXNwPTA7XHJcbiAgdGhpcy5pZD1uO1xyXG4gIHRoaXMuYmVhdERpc3BsYWNlPTA7XHJcbiAgdmFyIG1lPXRoaXM7XHJcbiAgc2VxUHJvZysrO1xyXG4gIC8vdGhpcy5jaGFubmVsPWNoYW5uZWxzW3RoaXMuaWQlY2hhbm5lbHMubGVuZ3RoXTtcclxuICBmb3IodmFyIGJuPTA7IGJuPHRoaXMubGVuOyBibisrKXtcclxuICAgIHRoaXMuZGF0YVtibl09bmV3IFNlcXVlbmNlckJ1dHRvbihibix0aGlzKVxyXG4gIH1cclxuICB0aGlzLmFsaXZlQ2hpbGQ9MDtcclxuICB0aGlzLmRpc3BsYWNlPTA7XHJcbiAgdGhpcy5zZXREaXNwbGFjZT1mdW5jdGlvbih0byxlbWl0KXtcclxuICAgIGlmKGVtaXQ9PVwib25seVwiKXtcclxuICAgICAgZW1pdD10cnVlO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIHRoaXMuc3VicG9zPSgodHJhbnNwb3J0Q3VycmVudFN0ZXApJSh0aGlzLmxlbip0aGlzLmV2cnkpKSt0bztcclxuICAgIH1cclxuICAgIGlmKGVtaXQ9PXRydWUpe1xyXG4gICAgICBzb2NrQ2hhbmdlKFwic2VxOlwiK21lLl9iaW5kTitcIlwiLFwiZHNwbFwiLHRvKTtcclxuICAgIH1cclxuICB9XHJcbiAgdGhpcy5zdGVwPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgcHJldmFsaXZlPXRoaXMuYWxpdmU7XHJcbiAgICB0aGlzLmFsaXZlPXRoaXMuYWxpdmVDaGlsZD4wO1xyXG4gICAgaWYodGhpcy5hbGl2ZSl7XHJcbiAgICAgIC8vaWYgdGhlIHN0YXRlIG9mIHRoaXMuYWxpdmUgY2hhbmdlcywgd2UgbXVzdCBlbWl0IHRoZSBkaXNwbGFjZW1lbnQsIGJlY2F1c2UgaXQgaXMgbmV3XHJcbiAgICAgIGlmKCFwcmV2YWxpdmUpe1xyXG4gICAgICAgIHRoaXMuZGlzcGxhY2U9KHRyYW5zcG9ydEN1cnJlbnRTdGVwK3RoaXMuc3VicG9zKSUodGhpcy5sZW4qdGhpcy5ldnJ5KTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIm9rLiBlbWl0IGRpc3BsYWU6IFwiK3RoaXMuZGlzcGxhY2UpO1xyXG4gICAgICAgIHRoaXMuc2V0RGlzcGxhY2UodGhpcy5kaXNwbGFjZSxcIm9ubHlcIik7XHJcbiAgICAgIH07XHJcbiAgICAgIC8vZWFjaCBzZXF1ZW5jZXIgaGFzIGEgZGlmZmVyZW50IHNwZWVkIHJhdGVzLiB3aGlsZSBzb21lIHBsYXlzIG9uZSBzdGVwIHBlciBjbGljaywgb3RoZXJzIHdpbGwgaGF2ZSBvbmUgc3RlcCBwZXIgc2V2ZXJhbCBjbG9jayB0aWNrcy5cclxuICAgICAgLy90aGUgc2VxdWVuY2VyIHN0YXJ0aW5nIHBvaW50IGlzIGFsc28gZGlzcGxhY2VkLCBhbmQgaXQgZGVwZW5kcyBvbiB0aGUgdGltZSB3aGVuIGl0IGdvdCBhbGl2ZWQraXRzIHBvc2l0aW9uIGF0IHRoYXQgbW9tZW50LlxyXG4gICAgICBpZih0aGlzLnN1YnBvcyV0aGlzLmV2cnk9PTApe1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwic3FcIit0aGlzLnBvcyk7XHJcbiAgICAgICAgLy8gZGF0YT17c2VxdWVuY2VyOnRoaXMuaWQscG9zOnRoaXMucG9zLHN0ZXBWYWw6dGhpcy5kYXRhW3RoaXMucG9zXS5ldmFsKCl9O1xyXG4gICAgICAgIC8vIHRoaXMub25TdGVwVHJpZ2dlcihkYXRhKTtcclxuICAgICAgICAvLyBzdGVwRnVuY3Rpb24oZGF0YSk7XHJcbiAgICAgICAgdGhpcy5wb3M9KHRoaXMuc3VicG9zL3RoaXMuZXZyeSklKHRoaXMubGVuKTtcclxuICAgICAgICBpZih0aGlzLmRhdGFbdGhpcy5wb3NdLmV2YWwoKT09MSl7XHJcbiAgICAgICAgICAvLyB0aGlzLmNoYW5uZWwuZW5naW5lLnN0YXJ0KDAsdGhpcy5jaGFubmVsLnN0YXJ0T2Zmc2V0LHRoaXMuY2hhbm5lbC5lbmRUaW1lKTtcclxuICAgICAgICAgIC8vc28sIHRoaXMgaXMgY2FsbGVkIGVsc2V3aGVyZSBhc3dlbGxsLi4uLiB0aGUgY2hhbm5lbCBzaG91bGQgaGF2ZSBhIHRyaWdnZXIgZnVuY3Rpb25cclxuICAgICAgICAgIHZhciBsb29wU3RhcnQ9dGhpcy5jaGFubmVsLnN0YXJ0T2Zmc2V0O1xyXG4gICAgICAgICAgdmFyIGxvb3BFbmQ9dGhpcy5jaGFubmVsLmVuZFRpbWU7XHJcbiAgICAgICAgICB0aGlzLmNoYW5uZWwuc2FtcGxlci50cmlnZ2VyQXR0YWNrKGZhbHNlLDAsMSx7c3RhcnQ6bG9vcFN0YXJ0LGVuZDpsb29wRW5kfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ZWxzZXtcclxuICAgICAgfVxyXG4gICAgICAvL3doYXQgaXMgbW9yZSBlY29ub21pYz8/XHJcbiAgICAgIC8vIHRoaXMuc3VicG9zPSh0aGlzLnN1YnBvcysxKSUodGhpcy5sZW4qdGhpcy5ldnJ5KTtcclxuICAgICAgLy9pIGd1ZXNzIHRoYXQuLiBidXQgaXQgY2FuIGdyb3cgZXRlcm5hbGx5XHJcbiAgICAgIHRoaXMuc3VicG9zKys7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHRoaXMuZGllPWZ1bmN0aW9uKCl7XHJcbiAgICBmb3IodmFyIGJuIGluIHRoaXMuZGF0YSl7XHJcbiAgICAgIHRoaXMuZGF0YVtibl0uc2V0RGF0YSgwKTtcclxuICAgIH1cclxuICAgIHRoaXMuYWxpdmU9ZmFsc2U7XHJcbiAgICB0aGlzLmpxLmRldGFjaCgpO1xyXG4gIH1cclxuICAvLyB0aGlzLm9uU3RlcFRyaWdnZXI9ZnVuY3Rpb24oZGF0YSl7XHJcbiAgLy8gICAvLyBjb25zb2xlLmxvZyhkYXRhKTtcclxuICAvLyB9XHJcbiAgdGhpcy5qcS5vbihcIm1vdXNlZW50ZXJcIixmdW5jdGlvbigpe1xyXG4gICAgZm9jdXNDaGFubmVsKG1lLmNoYW5uZWwuaWQpO1xyXG4gIH0pO1xyXG59IiwiLypcclxuVGhpcyBzY3JpcHQgY3JlYXRlIERPTSBzbGlkZXJzIHRoYXQgY2FuIGJlIHVzZWQgaW4gd2ViIGJyb3dzZXIgdG8gY29udHJvbCBzdHVmZi4gVGhleSBjYW4gYmUgc3luY2VkIHRocm91Z2ggc29ja2V0cyBhbmQgb3RoZXJzIGJ5IHVzaW5nIGNhbGxiYWNrcy5cclxuICAgIENvcHlyaWdodCAoQykgMjAxNiBKb2FxdcOtbiBBbGR1bmF0ZVxyXG5cclxuICAgIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbiAgICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG4gICAgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuICAgIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG4gICAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbiAgICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG4gICAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG4gICAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbiAgICBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG4gICAgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcbnZhciBzeW5jbWFuLG1vdXNlO1xyXG4vLyB2YXIgJDtcclxuZXhwb3J0cy5lbmFibGU9ZnVuY3Rpb24oc21hbixtKXtcclxuICBzeW5jbWFuPXNtYW47XHJcbiAgbW91c2U9bTtcclxuICByZXR1cm4gU2xpZGVyO1xyXG59O1xyXG5mdW5jdGlvbiBTbGlkZXIocGFyZW50LG9wdGlvbnMpe1xyXG4gIC8vbXkgcmVmZXJlbmNlIG51bWJlciBmb3IgZGF0YSBiaW5kaW5nLiBXaXRoIHRoaXMgbnVtYmVyIHRoZSBzb2NrZXQgYmluZGVyIGtub3dzIHdobyBpcyB0aGUgcmVjaWV2ZXIgb2YgdGhlIGRhdGEsIGFuZCBhbHNvIHdpdGggd2hhdCBuYW1lIHRvIHNlbmQgaXRcclxuICAvL3BlbmRhbnQ6IHRoaXMgY2FuIHBvdGVudGlhbGx5IGNyZWF0ZSBhIHByb2JsZW0sIGJlY2F1c2UgdHdvIG9iamVjdHMgY2FuIGJlIGNyZWF0ZWQgc2ltdWx0YW5lb3VzbHkgYXQgZGlmZmVyZW50IGVuZHMgYXQgdGhlIHNhbWUgdGltZS5cclxuICAvL21heWJlIGluc3RlYWQgb2YgdGhlIHNpbXBsZSBwdXNoLCB0aGVyZSBjb3VsZCBiZSBhIGNhbGxiYWNrLCBhZG4gdGhlIG9iamVjdCB3YWl0cyB0byByZWNlaXZlIGl0J3Mgc29ja2V0IGlkIG9uY2UgaXRzIGNyZWF0aW9uIHdhcyBwcm9wYWdhdGVkIHRocm91Z2hvdXQgYWxsIHRoZSBuZXR3b3JrLCBvciBtYXliZSB0aGVyZSBpcyBhbiBhcnJheSBmb3Igc2VudGluZyBhbmQgb3RoZXIgZGlmZmVyZW50IGZvciByZWNlaXZpbmcuLi4gZmlyc3Qgb3B0aW9uIHNlZW1zIG1vcmUgc2Vuc2libGVcclxuICB0aGlzLmRhdGE9e3ZhbHVlOjB9O1xyXG5cclxuICB0aGlzLl9iaW5kTj1zeW5jbWFuLmJpbmRMaXN0LnB1c2godGhpcyktMTtcclxuICB0aGlzLiRqcT0kKCc8ZGl2IGNsYXNzPVwic2xpZGVyLWNvbnRhaW5lclwiIHN0eWxlPVwicG9zaXRpb246cmVsYXRpdmVcIj48L2Rpdj4nKTtcclxuICB0aGlzLiRmYWRlcmpxPSQoJzxkaXYgY2xhc3M9XCJzbGlkZXItaW5uZXJcIiBzdHlsZT1cInBvaW50ZXItZXZlbnRzOm5vbmU7IHBvc2l0aW9uOmFic29sdXRlXCI+PC9kaXY+Jyk7XHJcbiAgdGhpcy5sYWJlbD1vcHRpb25zLmxhYmVsfHxcIlwiO1xyXG4gIHRoaXMubGFiZWxqcT0kKCc8cCBjbGFzcz1cInNsaWRlcmxhYmVsXCI+PC9wPicpO1xyXG4gIHRoaXMuJGpxLmFwcGVuZCh0aGlzLiRmYWRlcmpxKTtcclxuICB0aGlzLiRqcS5hcHBlbmQodGhpcy5sYWJlbGpxKTtcclxuICBpZihvcHRpb25zLmNzcylcclxuICAgIHRoaXMuJGpxLmNzcyhvcHRpb25zLmNzcyk7XHJcbiAgdGhpcy5jc3M9ZnVuY3Rpb24oY3NzKXtcclxuICAgIHRoaXMuJGpxLmNzcyhjc3MpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG4gIHRoaXMub25DaGFuZ2VDYWxsYmFjaz1mdW5jdGlvbigpe307XHJcbiAgLy9wZW5kYW50OiB0aGlzIHNob3VsZCBiZSBwYXJ0IG9mIGEgYmFzZSBwcm90b3R5cGUsIG5vdCByZXBlYXRlZCBpbiBlYWNoIHR5cGVcclxuICBpZih0eXBlb2YgKHBhcmVudC5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC5hcHBlbmQodGhpcy4kanEpO1xyXG4gIH1lbHNlIGlmKHR5cGVvZiAocGFyZW50LiRqcS5hcHBlbmR8fGZhbHNlKT09XCJmdW5jdGlvblwiKXtcclxuICAgIHBhcmVudC4kanEuYXBwZW5kKHRoaXMuJGpxKTtcclxuICB9ZWxzZXtcclxuICAgIGNvbnNvbGUubG9nKFwiYSBzbGlkZXIgY291bGRuJ3QgZmluZCBkb20gZWxlbWVudCB0byBhdHRhY2ggaGltc2VsZlwiKTtcclxuICB9XHJcbiAgdmFyIG1lPXRoaXM7XHJcbiAgdGhpcy5vbkNoYW5nZT1mdW5jdGlvbihjYWxsYmFjayl7XHJcbiAgICBtZS5vbkNoYW5nZUNhbGxiYWNrPWZ1bmN0aW9uKCl7Y2FsbGJhY2sobWUuZGF0YSl9O1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICB0aGlzLnNldERhdGE9ZnVuY3Rpb24odG8sZW1pdCl7XHJcbiAgICBpZihlbWl0PT09dHJ1ZSl7XHJcbiAgICAgIC8vcGVuZGFudDogaW4gc2VxdWVuY2VycyB3ZSB1c2UgcGFyZW50LmlkLCBhbmQgaGVyZSB3ZSB1c2UgX2JpbmROLiBUb3dhcmRzIGEgY29udHJvbGxlciBBUEkgYW5kIGEgbW9yZSBzZW5zaWNhbCBjb2RlLCBJIHRoaW5rIGJvdGggc2hvdWxkIHVzZSB0aGUgYmluZCBlbGVtZW50IGFycmF5LiByZWFkIG5vdGUgaW4gZmlyc3QgbGluZSBvZiB0aGlzIGZpbGUuXHJcbiAgICAgIC8vcGVuZGFudDogcGFyZW50IGluIHNlcSBpcyB3aGF0IG1lIGlzIGhlcmUuIHRoaXMgaXMgcHJldHR5IGNvbmZ1c2luZyB2YXIgbmFtZSBkZWNpc2lvblxyXG4gICAgICBzeW5jbWFuLmVtaXQoXCJzbGlkOlwiK21lLl9iaW5kTitcIlwiLFwic1ZcIix0byk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmRhdGEudmFsdWU9dG87XHJcbiAgICB0aGlzLm9uQ2hhbmdlQ2FsbGJhY2soKTtcclxuICAgIHRoaXMudXBkYXRlRG9tKCk7XHJcbiAgfVxyXG4gIHRoaXMuYWRkQ2xhc3M9ZnVuY3Rpb24odG8pe1xyXG4gICAgdGhpcy4kanEuYWRkQ2xhc3ModG8pO1xyXG4gIH1cclxuICB0aGlzLnZlcnRpY2FsPXRydWU7XHJcbiAgdGhpcy5hZGRDbGFzcyhcInZlcnRpY2FsXCIpO1xyXG4gIHRoaXMuJGpxLm9uKFwibW91c2Vkb3duIHRhcCB0b3VjaHN0YXJ0XCIsZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIGlmKG1lLnZlcnRpY2FsKXtcclxuICAgICAgbWUuc2V0RGF0YSgxLWV2ZW50Lm9mZnNldFkvbWUuJGpxLmhlaWdodCgpLHRydWUpOy8vLHRydWVcclxuICAgIH1lbHNle1xyXG4gICAgICBtZS5zZXREYXRhKGV2ZW50Lm9mZnNldFgvbWUuJGpxLndpZHRoKCksdHJ1ZSk7Ly8sdHJ1ZVxyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICB0aGlzLiRqcS5vbihcIm1vdXNlbW92ZSB0b3VjaGVudGVyIG1vdXNlbGVhdmUgbW91c2V1cFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIGlmKG1vdXNlLmJ1dHRvbkRvd24pe1xyXG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICB2YXIgZW1pdFRoaXM9ZXZlbnQudHlwZT09XCJtb3VzZWxlYXZlXCJ8fGV2ZW50LnR5cGU9PVwibW91c2V1cFwiXHJcbiAgICAgIGlmKG1lLnZlcnRpY2FsKXtcclxuICAgICAgICAvL3RoZSBzdHJhbmdlIHNlY29uZCBwYXJhbWVudGVyIGluIHNldGRhdGEgd2FzIHRydWUsIGJ1dCBpdCBjb3VsZCBjbG9nIHRoZSBzb2NrZXRcclxuICAgICAgICBtZS5zZXREYXRhKDEtZXZlbnQub2Zmc2V0WS9tZS4kanEuaGVpZ2h0KCksZW1pdFRoaXMpOy8vLHRydWVcclxuICAgICAgfWVsc2V7XHJcbiAgICAgICAgbWUuc2V0RGF0YShldmVudC5vZmZzZXRYL21lLiRqcS53aWR0aCgpLGVtaXRUaGlzKTsvLyx0cnVlXHJcbiAgICAgIH1cclxuICAgIH1lbHNle1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHRoaXMuZXZhbD1mdW5jdGlvbigpe1xyXG4gICAgdmFyIGpxPXRoaXMuJGpxO1xyXG4gICAganEuYWRkQ2xhc3MoXCJ0dXJuXCIpO1xyXG4gICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAganEucmVtb3ZlQ2xhc3MoXCJ0dXJuXCIpO1xyXG4gICAgfSwyMDApO1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YS52YWx1ZTtcclxuICB9XHJcbiAgdGhpcy51cGRhdGVEb209ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMudmVydGljYWwpe1xyXG4gICAgICB0aGlzLiRmYWRlcmpxLmNzcyh7Ym90dG9tOjAsd2lkdGg6XCIxMDAlXCIsaGVpZ2h0OnRoaXMuZGF0YS52YWx1ZSp0aGlzLiRqcS5oZWlnaHQoKX0pO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIHRoaXMubGFiZWxqcS5odG1sKHRoaXMubGFiZWwpO1xyXG4gICAgICB0aGlzLiRmYWRlcmpxLmNzcyh7Ym90dG9tOjAsd2lkdGg6dGhpcy5kYXRhLnZhbHVlKnRoaXMuJGpxLndpZHRoKCksaGVpZ2h0OlwiMTAwJVwifSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHRoaXMuc2V0RGF0YSgwKTtcclxufSIsIi8vIHZhciBzeW5jbWFuPXt9O1xyXG52YXIgc3luY21hbj1yZXF1aXJlKCcuL3N5bmNtYW4uanMnKS5lbmFibGUoKTtcclxudmFyIG1vdXNlPXJlcXVpcmUoJy4vbW91c2UuanMnKS5lbmFibGUoKTtcclxudmFyIFNsaWRlcj1yZXF1aXJlKCcuL1NsaWRlci5qcycpLmVuYWJsZShzeW5jbWFuLG1vdXNlKTtcclxudmFyIFNlcXVlbmNlcj1yZXF1aXJlKCcuL1NlcXVlbmNlci5qcycpLmVuYWJsZShzeW5jbWFuLG1vdXNlKTtcclxudmFyIEJ1dHRvbj1yZXF1aXJlKCcuL0J1dHRvbi5qcycpLmVuYWJsZShzeW5jbWFuLG1vdXNlKTtcclxudmFyIE1zQ29tcG9uZW50cz17XHJcbiAgU2xpZGVyOlNsaWRlcixcclxuICBTZXF1ZW5jZXI6U2VxdWVuY2VyLFxyXG4gIEJ1dHRvbjpCdXR0b25cclxufTtcclxud2luZG93Lk1zQ29tcG9uZW50cz1Nc0NvbXBvbmVudHM7XHJcbmNvbnNvbGUubG9nKE1zQ29tcG9uZW50cyk7IiwiZXhwb3J0cy5lbmFibGU9ZnVuY3Rpb24oKXtcclxuICByZXR1cm4gbW91c2U7XHJcbn1cclxudmFyIG1vdXNlPXtcclxuICB0b29sOlwiZHJhd1wiXHJcbn07XHJcblxyXG5cclxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcclxuICAkKGRvY3VtZW50KS5vbihcIm1vdXNlZG93biB0b3VjaHN0YXJ0IHRvdWNobW92ZVwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIG1vdXNlLmJ1dHRvbkRvd249dHJ1ZTtcclxuICAgIC8vIGNvbnNvbGUubG9nKGV2ZW50KTtcclxuICB9KTtcclxuICAkKGRvY3VtZW50KS5vbihcIm1vdXNldXAgdG91Y2hlbmRcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBtb3VzZS5idXR0b25Eb3duPWZhbHNlO1xyXG4gIH0pO1xyXG4gIC8vIGRvY3VtZW50Lm9udG91Y2htb3ZlID0gZnVuY3Rpb24oZXZlbnQpe1xyXG4gIC8vICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAvLyB9XHJcbn0pOyIsIi8qXHJcblRoaXMgc2NyaXB0IGNvbnRhaW5zIGEgdGVtcGxhdGUgZm9yIGRhdGEtYmluZGluZyBtYW5hZ2VtZW50IGlmIHlvdSB3YW50IHRvIGRvIHNvLiBPdGhlcndpc2UsIGl0IHdpbGwganVzdCBwbGFjZWhvbGQgdmFyIG5hbWVzIHNvIHRoZXJlIGFyZSBubyB1bmRlZmluZWQgdmFycy5cclxuICAgIENvcHlyaWdodCAoQykgMjAxNiBKb2FxdcOtbiBBbGR1bmF0ZVxyXG5cclxuICAgIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbiAgICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG4gICAgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuICAgIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG4gICAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbiAgICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG4gICAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG4gICAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbiAgICBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG4gICAgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG5leHBvcnRzLmVuYWJsZT1mdW5jdGlvbigpe1xyXG4gIHJldHVybiBuZXcgU3luY21hbigpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gU3luY21hbigpe1xyXG4gIC8vbGlzdCBvZiBhbGwgdGhlIGl0ZW1zIHRoYXQgdXNlIGRhdGEgYmluZGluZ1xyXG4gIHRoaXMuYmluZExpc3Q9W107XHJcbiAgLy9ob3cgYXJlIHlvdSBlbWl0dGluZyBjaGFuZ2VzPyBpdCBkZXBlbmRzIG9uIHRoZSBzZXJ2ZXIgeW91IHVzZS5cclxuICB0aGlzLmVtaXQ9ZnVuY3Rpb24oKXt9XHJcbn1cclxuIl19