(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

// var syncman={};
var syncman = require('./syncman.js').enable();
var Slider = require('./slider.js').enable(syncman, $);
var MsComponents = {
  Slider: Slider
};
window.MsComponents = MsComponents;
console.log(MsComponents);

},{"./slider.js":2,"./syncman.js":3}],2:[function(require,module,exports){
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
var syncman;
var $;
exports.enable = function (sman, jq) {
  syncman = sman;
  $ = jq;
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

},{}],3:[function(require,module,exports){
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

},{}]},{},[1])

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGluZGV4LmpzIiwic3JjXFxzbGlkZXIuanMiLCJzcmNcXHN5bmNtYW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBO0FBQ0EsSUFBSSxVQUFRLFFBQVEsY0FBUixFQUF3QixNQUF4QixFQUFaO0FBQ0EsSUFBSSxTQUFPLFFBQVEsYUFBUixFQUF1QixNQUF2QixDQUE4QixPQUE5QixFQUFzQyxDQUF0QyxDQUFYO0FBQ0EsSUFBSSxlQUFhO0FBQ2YsVUFBTztBQURRLENBQWpCO0FBR0EsT0FBTyxZQUFQLEdBQW9CLFlBQXBCO0FBQ0EsUUFBUSxHQUFSLENBQVksWUFBWjs7Ozs7QUNQQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkEsSUFBSSxPQUFKO0FBQ0EsSUFBSSxDQUFKO0FBQ0EsUUFBUSxNQUFSLEdBQWUsVUFBUyxJQUFULEVBQWMsRUFBZCxFQUFpQjtBQUM5QixZQUFRLElBQVI7QUFDQSxNQUFFLEVBQUY7QUFDQSxTQUFPLE1BQVA7QUFDRCxDQUpEO0FBS0EsU0FBUyxNQUFULENBQWdCLE1BQWhCLEVBQXVCLE9BQXZCLEVBQStCO0FBQzdCO0FBQ0E7QUFDQTtBQUNBLE9BQUssSUFBTCxHQUFVLEVBQUMsT0FBTSxDQUFQLEVBQVY7O0FBRUEsT0FBSyxNQUFMLEdBQVksUUFBUSxRQUFSLENBQWlCLElBQWpCLENBQXNCLElBQXRCLElBQTRCLENBQXhDO0FBQ0EsT0FBSyxHQUFMLEdBQVMsRUFBRSxnRUFBRixDQUFUO0FBQ0EsT0FBSyxRQUFMLEdBQWMsRUFBRSxpRkFBRixDQUFkO0FBQ0EsT0FBSyxLQUFMLEdBQVcsUUFBUSxLQUFSLElBQWUsRUFBMUI7QUFDQSxPQUFLLE9BQUwsR0FBYSxFQUFFLDZCQUFGLENBQWI7QUFDQSxPQUFLLEdBQUwsQ0FBUyxNQUFULENBQWdCLEtBQUssUUFBckI7QUFDQSxP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QUFPLFVBQVAsQ0FBa0IsWUFBVTtBQUMxQixTQUFHLFdBQUgsQ0FBZSxNQUFmO0FBQ0QsS0FGRCxFQUVFLEdBRkY7QUFHQSxXQUFPLEtBQUssSUFBTCxDQUFVLEtBQWpCO0FBQ0QsR0FQRDtBQVFBLE9BQUssU0FBTCxHQUFlLFlBQVU7QUFDdkIsUUFBRyxLQUFLLFFBQVIsRUFBaUI7QUFDZixXQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLEVBQUMsUUFBTyxDQUFSLEVBQVUsT0FBTSxNQUFoQixFQUF1QixRQUFPLEtBQUssSUFBTCxDQUFVLEtBQVYsR0FBZ0IsS0FBSyxHQUFMLENBQVMsTUFBVCxFQUE5QyxFQUFsQjtBQUNELEtBRkQsTUFFSztBQUNILFdBQUssT0FBTCxDQUFhLElBQWIsQ0FBa0IsS0FBSyxLQUF2QjtBQUNBLFdBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsRUFBQyxRQUFPLENBQVIsRUFBVSxPQUFNLEtBQUssSUFBTCxDQUFVLEtBQVYsR0FBZ0IsS0FBSyxHQUFMLENBQVMsS0FBVCxFQUFoQyxFQUFpRCxRQUFPLE1BQXhELEVBQWxCO0FBQ0Q7QUFDRixHQVBEO0FBUUEsT0FBSyxPQUFMLENBQWEsQ0FBYjtBQUNEOzs7OztBQ2hIRDs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBLFFBQVEsTUFBUixHQUFlLFlBQVU7QUFDdkIsV0FBTyxJQUFJLE9BQUosRUFBUDtBQUNELENBRkQ7O0FBSUEsU0FBUyxPQUFULEdBQWtCO0FBQ2hCO0FBQ0EsU0FBSyxRQUFMLEdBQWMsRUFBZDtBQUNBO0FBQ0EsU0FBSyxJQUFMLEdBQVUsWUFBVSxDQUFFLENBQXRCO0FBQ0QiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gdmFyIHN5bmNtYW49e307XHJcbnZhciBzeW5jbWFuPXJlcXVpcmUoJy4vc3luY21hbi5qcycpLmVuYWJsZSgpO1xyXG52YXIgU2xpZGVyPXJlcXVpcmUoJy4vc2xpZGVyLmpzJykuZW5hYmxlKHN5bmNtYW4sJCk7XHJcbnZhciBNc0NvbXBvbmVudHM9e1xyXG4gIFNsaWRlcjpTbGlkZXJcclxufTtcclxud2luZG93Lk1zQ29tcG9uZW50cz1Nc0NvbXBvbmVudHM7XHJcbmNvbnNvbGUubG9nKE1zQ29tcG9uZW50cyk7IiwiLypcclxuVGhpcyBzY3JpcHQgY3JlYXRlIERPTSBzbGlkZXJzIHRoYXQgY2FuIGJlIHVzZWQgaW4gd2ViIGJyb3dzZXIgdG8gY29udHJvbCBzdHVmZi4gVGhleSBjYW4gYmUgc3luY2VkIHRocm91Z2ggc29ja2V0cyBhbmQgb3RoZXJzIGJ5IHVzaW5nIGNhbGxiYWNrcy5cclxuICAgIENvcHlyaWdodCAoQykgMjAxNiBKb2FxdcOtbiBBbGR1bmF0ZVxyXG5cclxuICAgIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbiAgICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG4gICAgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuICAgIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG4gICAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbiAgICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG4gICAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG4gICAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbiAgICBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG4gICAgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcbnZhciBzeW5jbWFuO1xyXG52YXIgJDtcclxuZXhwb3J0cy5lbmFibGU9ZnVuY3Rpb24oc21hbixqcSl7XHJcbiAgc3luY21hbj1zbWFuO1xyXG4gICQ9anE7XHJcbiAgcmV0dXJuIFNsaWRlcjtcclxufTtcclxuZnVuY3Rpb24gU2xpZGVyKHBhcmVudCxvcHRpb25zKXtcclxuICAvL215IHJlZmVyZW5jZSBudW1iZXIgZm9yIGRhdGEgYmluZGluZy4gV2l0aCB0aGlzIG51bWJlciB0aGUgc29ja2V0IGJpbmRlciBrbm93cyB3aG8gaXMgdGhlIHJlY2lldmVyIG9mIHRoZSBkYXRhLCBhbmQgYWxzbyB3aXRoIHdoYXQgbmFtZSB0byBzZW5kIGl0XHJcbiAgLy9wZW5kYW50OiB0aGlzIGNhbiBwb3RlbnRpYWxseSBjcmVhdGUgYSBwcm9ibGVtLCBiZWNhdXNlIHR3byBvYmplY3RzIGNhbiBiZSBjcmVhdGVkIHNpbXVsdGFuZW91c2x5IGF0IGRpZmZlcmVudCBlbmRzIGF0IHRoZSBzYW1lIHRpbWUuXHJcbiAgLy9tYXliZSBpbnN0ZWFkIG9mIHRoZSBzaW1wbGUgcHVzaCwgdGhlcmUgY291bGQgYmUgYSBjYWxsYmFjaywgYWRuIHRoZSBvYmplY3Qgd2FpdHMgdG8gcmVjZWl2ZSBpdCdzIHNvY2tldCBpZCBvbmNlIGl0cyBjcmVhdGlvbiB3YXMgcHJvcGFnYXRlZCB0aHJvdWdob3V0IGFsbCB0aGUgbmV0d29yaywgb3IgbWF5YmUgdGhlcmUgaXMgYW4gYXJyYXkgZm9yIHNlbnRpbmcgYW5kIG90aGVyIGRpZmZlcmVudCBmb3IgcmVjZWl2aW5nLi4uIGZpcnN0IG9wdGlvbiBzZWVtcyBtb3JlIHNlbnNpYmxlXHJcbiAgdGhpcy5kYXRhPXt2YWx1ZTowfTtcclxuXHJcbiAgdGhpcy5fYmluZE49c3luY21hbi5iaW5kTGlzdC5wdXNoKHRoaXMpLTE7XHJcbiAgdGhpcy4kanE9JCgnPGRpdiBjbGFzcz1cInNsaWRlci1jb250YWluZXJcIiBzdHlsZT1cInBvc2l0aW9uOnJlbGF0aXZlXCI+PC9kaXY+Jyk7XHJcbiAgdGhpcy4kZmFkZXJqcT0kKCc8ZGl2IGNsYXNzPVwic2xpZGVyLWlubmVyXCIgc3R5bGU9XCJwb2ludGVyLWV2ZW50czpub25lOyBwb3NpdGlvbjphYnNvbHV0ZVwiPjwvZGl2PicpO1xyXG4gIHRoaXMubGFiZWw9b3B0aW9ucy5sYWJlbHx8XCJcIjtcclxuICB0aGlzLmxhYmVsanE9JCgnPHAgY2xhc3M9XCJzbGlkZXJsYWJlbFwiPjwvcD4nKTtcclxuICB0aGlzLiRqcS5hcHBlbmQodGhpcy4kZmFkZXJqcSk7XHJcbiAgdGhpcy4kanEuYXBwZW5kKHRoaXMubGFiZWxqcSk7XHJcbiAgaWYob3B0aW9ucy5jc3MpXHJcbiAgICB0aGlzLiRqcS5jc3Mob3B0aW9ucy5jc3MpO1xyXG4gIHRoaXMuY3NzPWZ1bmN0aW9uKGNzcyl7XHJcbiAgICB0aGlzLiRqcS5jc3MoY3NzKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuICB0aGlzLm9uQ2hhbmdlQ2FsbGJhY2s9ZnVuY3Rpb24oKXt9O1xyXG4gIC8vcGVuZGFudDogdGhpcyBzaG91bGQgYmUgcGFydCBvZiBhIGJhc2UgcHJvdG90eXBlLCBub3QgcmVwZWF0ZWQgaW4gZWFjaCB0eXBlXHJcbiAgaWYodHlwZW9mIChwYXJlbnQuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgICBwYXJlbnQuYXBwZW5kKHRoaXMuJGpxKTtcclxuICB9ZWxzZSBpZih0eXBlb2YgKHBhcmVudC4kanEuYXBwZW5kfHxmYWxzZSk9PVwiZnVuY3Rpb25cIil7XHJcbiAgICBwYXJlbnQuJGpxLmFwcGVuZCh0aGlzLiRqcSk7XHJcbiAgfWVsc2V7XHJcbiAgICBjb25zb2xlLmxvZyhcImEgc2xpZGVyIGNvdWxkbid0IGZpbmQgZG9tIGVsZW1lbnQgdG8gYXR0YWNoIGhpbXNlbGZcIik7XHJcbiAgfVxyXG4gIHZhciBtZT10aGlzO1xyXG4gIHRoaXMub25DaGFuZ2U9ZnVuY3Rpb24oY2FsbGJhY2spe1xyXG4gICAgbWUub25DaGFuZ2VDYWxsYmFjaz1mdW5jdGlvbigpe2NhbGxiYWNrKG1lLmRhdGEpfTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgdGhpcy5zZXREYXRhPWZ1bmN0aW9uKHRvLGVtaXQpe1xyXG4gICAgaWYoZW1pdD09PXRydWUpe1xyXG4gICAgICAvL3BlbmRhbnQ6IGluIHNlcXVlbmNlcnMgd2UgdXNlIHBhcmVudC5pZCwgYW5kIGhlcmUgd2UgdXNlIF9iaW5kTi4gVG93YXJkcyBhIGNvbnRyb2xsZXIgQVBJIGFuZCBhIG1vcmUgc2Vuc2ljYWwgY29kZSwgSSB0aGluayBib3RoIHNob3VsZCB1c2UgdGhlIGJpbmQgZWxlbWVudCBhcnJheS4gcmVhZCBub3RlIGluIGZpcnN0IGxpbmUgb2YgdGhpcyBmaWxlLlxyXG4gICAgICAvL3BlbmRhbnQ6IHBhcmVudCBpbiBzZXEgaXMgd2hhdCBtZSBpcyBoZXJlLiB0aGlzIGlzIHByZXR0eSBjb25mdXNpbmcgdmFyIG5hbWUgZGVjaXNpb25cclxuICAgICAgc3luY21hbi5lbWl0KFwic2xpZDpcIittZS5fYmluZE4rXCJcIixcInNWXCIsdG8pO1xyXG4gICAgfVxyXG4gICAgdGhpcy5kYXRhLnZhbHVlPXRvO1xyXG4gICAgdGhpcy5vbkNoYW5nZUNhbGxiYWNrKCk7XHJcbiAgICB0aGlzLnVwZGF0ZURvbSgpO1xyXG4gIH1cclxuICB0aGlzLmFkZENsYXNzPWZ1bmN0aW9uKHRvKXtcclxuICAgIHRoaXMuJGpxLmFkZENsYXNzKHRvKTtcclxuICB9XHJcbiAgdGhpcy52ZXJ0aWNhbD10cnVlO1xyXG4gIHRoaXMuYWRkQ2xhc3MoXCJ2ZXJ0aWNhbFwiKTtcclxuICB0aGlzLiRqcS5vbihcIm1vdXNlZG93biB0YXAgdG91Y2hzdGFydFwiLGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBpZihtZS52ZXJ0aWNhbCl7XHJcbiAgICAgIG1lLnNldERhdGEoMS1ldmVudC5vZmZzZXRZL21lLiRqcS5oZWlnaHQoKSx0cnVlKTsvLyx0cnVlXHJcbiAgICB9ZWxzZXtcclxuICAgICAgbWUuc2V0RGF0YShldmVudC5vZmZzZXRYL21lLiRqcS53aWR0aCgpLHRydWUpOy8vLHRydWVcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgdGhpcy4kanEub24oXCJtb3VzZW1vdmUgdG91Y2hlbnRlciBtb3VzZWxlYXZlIG1vdXNldXBcIixmdW5jdGlvbihldmVudCl7XHJcbiAgICBpZihtb3VzZS5idXR0b25Eb3duKXtcclxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgdmFyIGVtaXRUaGlzPWV2ZW50LnR5cGU9PVwibW91c2VsZWF2ZVwifHxldmVudC50eXBlPT1cIm1vdXNldXBcIlxyXG4gICAgICBpZihtZS52ZXJ0aWNhbCl7XHJcbiAgICAgICAgLy90aGUgc3RyYW5nZSBzZWNvbmQgcGFyYW1lbnRlciBpbiBzZXRkYXRhIHdhcyB0cnVlLCBidXQgaXQgY291bGQgY2xvZyB0aGUgc29ja2V0XHJcbiAgICAgICAgbWUuc2V0RGF0YSgxLWV2ZW50Lm9mZnNldFkvbWUuJGpxLmhlaWdodCgpLGVtaXRUaGlzKTsvLyx0cnVlXHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIG1lLnNldERhdGEoZXZlbnQub2Zmc2V0WC9tZS4kanEud2lkdGgoKSxlbWl0VGhpcyk7Ly8sdHJ1ZVxyXG4gICAgICB9XHJcbiAgICB9ZWxzZXtcclxuICAgIH1cclxuICB9KTtcclxuICB0aGlzLmV2YWw9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBqcT10aGlzLiRqcTtcclxuICAgIGpxLmFkZENsYXNzKFwidHVyblwiKTtcclxuICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgIGpxLnJlbW92ZUNsYXNzKFwidHVyblwiKTtcclxuICAgIH0sMjAwKTtcclxuICAgIHJldHVybiB0aGlzLmRhdGEudmFsdWU7XHJcbiAgfVxyXG4gIHRoaXMudXBkYXRlRG9tPWZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLnZlcnRpY2FsKXtcclxuICAgICAgdGhpcy4kZmFkZXJqcS5jc3Moe2JvdHRvbTowLHdpZHRoOlwiMTAwJVwiLGhlaWdodDp0aGlzLmRhdGEudmFsdWUqdGhpcy4kanEuaGVpZ2h0KCl9KTtcclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLmxhYmVsanEuaHRtbCh0aGlzLmxhYmVsKTtcclxuICAgICAgdGhpcy4kZmFkZXJqcS5jc3Moe2JvdHRvbTowLHdpZHRoOnRoaXMuZGF0YS52YWx1ZSp0aGlzLiRqcS53aWR0aCgpLGhlaWdodDpcIjEwMCVcIn0pO1xyXG4gICAgfVxyXG4gIH1cclxuICB0aGlzLnNldERhdGEoMCk7XHJcbn0iLCIvKlxyXG5UaGlzIHNjcmlwdCBjb250YWlucyBhIHRlbXBsYXRlIGZvciBkYXRhLWJpbmRpbmcgbWFuYWdlbWVudCBpZiB5b3Ugd2FudCB0byBkbyBzby4gT3RoZXJ3aXNlLCBpdCB3aWxsIGp1c3QgcGxhY2Vob2xkIHZhciBuYW1lcyBzbyB0aGVyZSBhcmUgbm8gdW5kZWZpbmVkIHZhcnMuXHJcbiAgICBDb3B5cmlnaHQgKEMpIDIwMTYgSm9hcXXDrW4gQWxkdW5hdGVcclxuXHJcbiAgICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG4gICAgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcclxuICAgIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXHJcbiAgICAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuICAgIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG4gICAgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcclxuICAgIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuICAgIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG4gICAgWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcclxuICAgIGFsb25nIHdpdGggdGhpcyBwcm9ncmFtLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxyXG4qL1xyXG5cclxuZXhwb3J0cy5lbmFibGU9ZnVuY3Rpb24oKXtcclxuICByZXR1cm4gbmV3IFN5bmNtYW4oKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFN5bmNtYW4oKXtcclxuICAvL2xpc3Qgb2YgYWxsIHRoZSBpdGVtcyB0aGF0IHVzZSBkYXRhIGJpbmRpbmdcclxuICB0aGlzLmJpbmRMaXN0PVtdO1xyXG4gIC8vaG93IGFyZSB5b3UgZW1pdHRpbmcgY2hhbmdlcz8gaXQgZGVwZW5kcyBvbiB0aGUgc2VydmVyIHlvdSB1c2UuXHJcbiAgdGhpcy5lbWl0PWZ1bmN0aW9uKCl7fVxyXG59XHJcbiJdfQ==