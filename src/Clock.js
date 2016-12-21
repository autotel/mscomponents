
var syncman,mouse,audioContext;
var OH=require("onhandlers");
var Timer=require("web-audio-scheduler");
exports.enable=function(globals){
  console.log("timer",Timer);
  syncman=globals.syncman;
  mouse=globals.mouse;
  audioContext=globals.audioContext;
  return Clock;
};
function Clock(parent,options){

  var defaults={
    interval:0.1
  }
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
  //this should go in componentBase. It applies options or defaults.
  if(!options)
  options={};
  for(var a in defaults){
    if(!options[a])
    options[a]=defaults[a];
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

  this.timer = new Timer({ context: audioContext });
  var intervalHandle;
  //the current timer technology doesn't make interval but rather schedules ahead, thus these vars:
  var lastTimerScheduled=0;
  var lastTimerExecuted=0;
  var createFurtherTimerSchedules=function(howMany){
    var addUpTo=lastTimerScheduled+howMany;
    for(lastTimerScheduled; lastTimerScheduled<addUpTo; lastTimerScheduled++)
    me.timer.insert(options.interval*lastTimerScheduled, me.tick,{tickn:lastTimerScheduled});
  }
  this.tick=function(a){
    lastTimerExecuted++;
    createFurtherTimerSchedules(4);
    thisClock.handle("tick");
    thisClock.addClass("tick");
    // console.log("tick");
    setTimeout(function(){thisClock.removeClass("tick");},20);
    this.currentStep++;
  }
  this.start=function(){
    // console.log(options.interval);
    createFurtherTimerSchedules(4);
    this.timer.start();
    //intervalHandle=window.setInterval(this.tick,options.interval|1);
  }
  this.stop=function(){
    this.timer.stop();
    ///this.timer.remove(intervalHandle);
    //window.clearInterval(intervalHandle);
  }
  if(options.start)
  this.start();

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