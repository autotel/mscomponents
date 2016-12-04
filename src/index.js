// var syncman={};
var syncman=require('./syncman.js').enable();
var Slider=require('./slider.js').enable(syncman,$);
var MsComponents={
  Slider:Slider
};
window.MsComponents=MsComponents;
console.log(MsComponents);