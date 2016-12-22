

var audioContext=new AudioContext();
var globals={};
globals.syncman=require('./syncman.js').enable();
globals.mouse=require('./mouse.js').enable();
globals.audioContext=audioContext;

var Slider=require('./Slider.js').enable(globals);
var Sequencer=require('./Sequencer.js').enable(globals);
var Button=require('./Button.js').enable(globals);
var Clock=require('./Clock.js').enable(globals);

/**
* A library for easy graphic control of synths, music and probably other things.
* @instance MsComponents
* instance any library component by new `MsComponents.component()`
* @example var mySlider= new MsComponents.Slider();
*/
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