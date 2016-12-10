// var syncman={};
var syncman=require('./syncman.js').enable();
var mouse=require('./mouse.js').enable();
var Slider=require('./Slider.js').enable(syncman,mouse);
var Sequencer=require('./Sequencer.js').enable(syncman,mouse);
var Button=require('./Button.js').enable(syncman,mouse);
var Clock=require('./Clock.js').enable(syncman,mouse);
var MsComponents={
  Slider:Slider,
  Sequencer:Sequencer,
  Button:Button,
  Clock:Clock,
  create:function(what,options,where){
    if(!where)
      where=$("body");
    return new this[what](where,options);
  },
};
window.MsComponents=MsComponents;
console.log(MsComponents);