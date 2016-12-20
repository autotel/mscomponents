
var syncman,mouse;
var OH=require("onhandlers");
exports.enable=function(globals){
  syncman=globals.syncman;
  mouse=globals.mouse;
  return Clock;
};
function Clock(parent,options){
  this.currentStep=0;
  this.name="clock";
  OH.call(this);
  var thisClock=this;
  this.data={value:0};
  this.states=false;
  this._bindN=syncman.bindList.push(this)-1;
  this.$jq=$('<div class="ms-clock ms-button"></div>');
  this.label=options.label||'∆';
  this.$jq.append(this.$faderjq);
  this.$jq.html(this.label);
  if(options.css)
    this.$jq.css(options.css);
  this.css=function(css){
    this.$jq.css(options.css);
    return this;
  }
  //pendant: this should be part of a base prototype, not repeated in each type
  if(typeof (parent.append||false)=="function"){
    parent.append(this.$jq);
  }else if(typeof (parent.$jq.append||false)=="function"){
    parent.$jq.append(this.$jq);
  }else{
    console.log("a clock couldn't find dom element to attach himself");
  }
  var me=this;
  this.tick=function(){
    thisClock.handle("tick");
    thisClock.addClass("tick");
    setTimeout(function(){thisClock.removeClass("tick");},20);
    this.currentStep++;
  }
  setInterval(this.tick,options.interval|500);
}

Clock.prototype.updateDom=function(){
  this.$jq.html(this.label);
}



//aliasing of these two handy function
Clock.prototype.addClass=function(to){
  this.$jq.addClass(to);
}
Clock.prototype.removeClass=function(to){
  this.$jq.removeClass(to);
}