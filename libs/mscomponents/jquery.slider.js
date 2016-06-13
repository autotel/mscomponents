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

Slider=function(parent,options){
  //my reference number for data binding. With this number the socket binder knows who is the reciever of the data, and also with what name to send it
  //pendant: this can potentially create a problem, because two objects can be created simultaneously at different ends at the same time.
  //maybe instead of the simple push, there could be a callback, adn the object waits to receive it's socket id once its creation was propagated throughout all the network, or maybe there is an array for senting and other different for receiving... first option seems more sensible
  this.data={value:0};

  this._bindN=syncman.bindList.push(this)-1;
  this.$jq=$('<div class="slider-container" style="position:relative"></div>');
  this.$faderjq=$('<div class="slider-inner" style="pointer-events:none; position:absolute"></div>');
  this.label=options.label||"";
  this.labeljq=$('<p class="sliderlabel"></p>');
  this.$jq.append(this.$faderjq);
  this.$jq.append(this.labeljq);
  if(options.css)
    this.$jq.css(options.css);
  this.css=function(css){
    this.$jq.css(css);
    return this;
  }
  this.onChangeCallback=function(){};
  //pendant: this should be part of a base prototype, not repeated in each type
  if(typeof (parent.append||false)=="function"){
    parent.append(this.$jq);
  }else if(typeof (parent.$jq.append||false)=="function"){
    parent.$jq.append(this.$jq);
  }else{
    console.log("a slider couldn't find dom element to attach himself");
  }
  var me=this;
  this.onChange=function(callback){
    me.onChangeCallback=function(){callback(me.data)};
    return this;
  }

  this.setData=function(to,emit){
    if(emit===true){
      //pendant: in sequencers we use parent.id, and here we use _bindN. Towards a controller API and a more sensical code, I think both should use the bind element array. read note in first line of this file.
      //pendant: parent in seq is what me is here. this is pretty confusing var name decision
      syncman.emit("slid:"+me._bindN+"","sV",to);
    }
    this.data.value=to;
    this.onChangeCallback();
    this.updateDom();
  }
  this.addClass=function(to){
    this.$jq.addClass(to);
  }
  this.vertical=true;
  this.addClass("vertical");
  this.$jq.on("mousedown tap touchstart",function(event){
    event.preventDefault();
    if(me.vertical){
      me.setData(1-event.offsetY/me.$jq.height(),true);//,true
    }else{
      me.setData(event.offsetX/me.$jq.width(),true);//,true
    }
  });

  this.$jq.on("mousemove touchenter mouseleave mouseup",function(event){
    if(mouse.buttonDown){
      event.preventDefault();
      var emitThis=event.type=="mouseleave"||event.type=="mouseup"
      if(me.vertical){
        //the strange second paramenter in setdata was true, but it could clog the socket
        me.setData(1-event.offsetY/me.$jq.height(),emitThis);//,true
      }else{
        me.setData(event.offsetX/me.$jq.width(),emitThis);//,true
      }
    }else{
    }
  });
  this.eval=function(){
    var jq=this.$jq;
    jq.addClass("turn");
    window.setTimeout(function(){
      jq.removeClass("turn");
    },200);
    return this.data.value;
  }
  this.updateDom=function(){
    if(this.vertical){
      this.$faderjq.css({bottom:0,width:"100%",height:this.data.value*this.$jq.height()});
    }else{
      this.labeljq.html(this.label);
      this.$faderjq.css({bottom:0,width:this.data.value*this.$jq.width(),height:"100%"});
    }
  }
  this.setData(0);
}