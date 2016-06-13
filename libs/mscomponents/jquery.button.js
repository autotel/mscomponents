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

Button=function(parent,options){
  //my reference number for data binding. With this number the socket binder knows who is the reciever of the data, and also with what name to send it
  //pendant: this can potentially create a problem, because two objects can be created simultaneously at different ends at the same time.
  //maybe instead of the simple push, there could be a callback, adn the object waits to receive it's socket id once its creation was propagated throughout all the network, or maybe there is an array for senting and other different for receiving... first option seems more sensible
  this.data={value:0};
  this.states=false;
  this._bindN=syncman.bindList.push(this)-1;
  this.$jq=$('<div class="ms-button">☻</div>');
  this.label=options.label||"";
  this.$jq.append(this.$faderjq);
  this.$jq.html(this.label);
  if(options.css)
    this.$jq.css(options.css);
  this.css=function(css){
    this.$jq.css(options.css);
    return this;
  }
  //if a switch variable is passed, this button will switch on each click among the stated states
  if(options.hasOwnProperty("switch")){
    this.states=[];
    this.data.currentState=0;
    this.states=options.switch;
    this.switchState(0);
  }
  this.onClickCallback=function(){};
  this.onReleaseCallback=function(){};
  //pendant: this should be part of a base prototype, not repeated in each type
  if(typeof (parent.append||false)=="function"){
    parent.append(this.$jq);
  }else if(typeof (parent.$jq.append||false)=="function"){
    parent.$jq.append(this.$jq);
  }else{
    console.log("a slider couldn't find dom element to attach himself");
  }
  var me=this;
  // this.onChange=function(callback){
  //   me.onClickCallback=function(){callback(me.data)};
  //   return this;
  // }

  this.$jq.on("mousedown tap touchstart",function(event){
    me.onClickCallback(me.data);
    event.preventDefault();
    me.switchState();
    me.addClass("active");
  });
  this.$jq.on("mouseup mouseleave",function(event){
    me.onReleaseCallback(me.data);
    event.preventDefault();
    me.removeClass("active");
  });
}

Button.prototype.updateDom=function(){
  this.$jq.html(this.label);
}

Button.prototype.onClick=function(callback){
  this.onClickCallback=callback;
  return this;
}
Button.prototype.onRelease=function(callback){
  this.onReleaseCallback=callback;
  return this;
}
Button.prototype.switchState=function(to){
  if(this.states){
    //change state number to next
    if(to){
      this.data.currentState=to%this.states.length;
    }else{
      this.data.currentState=(this.data.currentState+1)%this.states.length;
    }
    //apply all the properties that the state carry. This makes the button super hackable
    for(a in this.states[this.data.currentState]){
      this[a]=this.states[this.data.currentState][a];
      // console.log("["+a+"]",this[a]);
    }
  }
  this.updateDom();
}
//aliasing of these two handy function
Button.prototype.addClass=function(to){
  this.$jq.addClass(to);
}
Button.prototype.removeClass=function(to){
  this.$jq.removeClass(to);
}