var audioContext=new AudioContext();
var globals={};
globals.syncman=require('./syncman.js').enable();
globals.mouse=require('./mouse.js').enable();
globals.audioContext=audioContext;

var Slider=require('./Slider.js').enable(globals);
var Sequencer=require('./Sequencer.js').enable(globals);
var Button=require('./Button.js').enable(globals);
var Clock=require('./Clock.js').enable(globals);

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