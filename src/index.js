// var syncman={};
var syncman=require('./syncman.js').enable();
var mouse=require('./mouse.js').enable();
var Slider=require('./Slider.js').enable(syncman,mouse);
var Sequencer=require('./Sequencer.js').enable(syncman,mouse);
var Button=require('./Button.js').enable(syncman,mouse);
var MsComponents={
  Slider:Slider,
  Sequencer:Sequencer,
  Button:Button
};
window.MsComponents=MsComponents;
console.log(MsComponents);