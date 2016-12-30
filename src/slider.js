var componentBase;
let eemiter=require('onhandlers');
var syncman,mouse;

exports.enable=function(globals){
  syncman=globals.syncman;
  mouse=globals.mouse;
  componentBase=globals.componentBase;
  return Slider;
};

/**
* Slider produces a vertical or horizontal slider that allows to control a value from dragging with the mouse.

*
* @class Slider
* @constructor
* @param {jquery} parent or DOM element to which this slider will be attached.
* defaults to `$("body")`
* @default
* @param {object} options object containing options
* @param {String} options.css additional css properties for the slider
* @param {function} options.valueFunction
* @param {object} options.label :""
* @param {object} options.valueFunction :function(val){
  return val;
}
* @param {object} options.value :0
* @param {object} options.data :{value:0}
* @param {object} options.ertical :true
* defines the operation to apply to the internal value upon evaluation. the default is just linear

* @example mySlider new MsComponents.Slider($("body"),{vertical:false,value:0.73});
*/
function Slider(parent,options){
  var thisSlider=this;
  this.name="slider"
  var defaults={
    label:"",
    valueFunction:function(val){
      return val;
    },
    mouseActivationMode:"dragLast",
    value:0,
    data:{value:0},
    vertical:true,
  }
  componentBase.call(this,parent,options,defaults);
  //my reference number for data binding. With this number the socket binder knows who is the reciever of the data, and also with what name to send it
  //pendant: this can potentially create a problem, because two objects can be created simultaneously at different ends at the same time.
  //maybe instead of the simple push, there could be a callback, adn the object waits to receive it's socket id once its creation was propagated throughout all the network, or maybe there is an array for senting and other different for receiving... first option seems more sensible
  // this.data={value:0};

  this._bindN=syncman.bindList.push(this)-1;

  // this.label=options.label||"";
  //slider needs additional $jq objects for the inner rolling slider, and for label, which is not yet fully implemented
  this.$faderjq=$('<div class="slider-inner" style="pointer-events:none; position:absolute"></div>');
  this.$labeljq=$('<p class="sliderlabel"></p>');

  this.$jq.append(this.$faderjq);
  this.$jq.append(this.$labeljq);

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
  /**
* Set the data to a value, and perform the graphic changes and data bindings that correspond to this change.
* If you wanted to change the value, but not get this change reflected in the slider position, you would
* assign the slider.data.value to your value.
* @method setData
* @param {number} to target value
* @param {boolean} [emit=false] *not ready* wether to emit through syncman
* @return {undefined} no return
* @example mySlider.setData(0.53);
*/
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
  // this.vertical=options.vertical||true;
  this.$jq.on("mousemove",function(event){
    if(me.mouseActive){
      event.preventDefault();
      if(me.vertical){
        me.setData(1-event.offsetY/me.$jq.height(),true);//,true
      }else{
        me.setData(event.offsetX/me.$jq.width(),true);//,true
      }
    }
  });
  this.on("onMouseStart",function(event){
    event.preventDefault();
    // if(me.vertical){
    //   me.setData(1-event.offsetY/me.$jq.height(),true);//,true
    // }else{
    //   me.setData(event.offsetX/me.$jq.width(),true);//,true
    // }
  });

  this.on("onMouseEnd",function(event){
    if(mouse.buttonDown){
      event.preventDefault();
      var emitThis=event.type=="mouseleave"||event.type=="mouseup"
      // if(me.vertical){
      //   //the strange second paramenter in setdata was true, but it could clog the socket
      //   me.setData(1-event.offsetY/me.$jq.height(),emitThis);//,true
      // }else{
      //   me.setData(event.offsetX/me.$jq.width(),emitThis);//,true
      // }
    }else{
    }
  });
  this.eval=function(){
    var jq=this.$jq;
    jq.addClass("turn");
    window.setTimeout(function(){
      jq.removeClass("turn");
    },200);
    return this.valueFunction(this.data.value);
  }

  this.updateDom=function(){
    if(this.vertical){
      this.$faderjq.css({bottom:0,width:"100%",height:this.data.value*this.$jq.height()});
      this.addClass("vertical");
    }else{
      this.$labeljq.html(this.label);
      this.$faderjq.css({bottom:0,width:this.data.value*this.$jq.width(),height:"100%"});
      this.addClass("horizontal");
    }
  }
  console.log(this.options,"bals");
  this.setData(this.options.value);
  this.updateDom();
}