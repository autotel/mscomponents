let eemiter=require('onhandlers');
var globals;
var mouse;
exports.get=function(globals){
  // syncman=globals.syncman;
  mouse=globals.mouse;
  return componentBase;
}
/**
 * The base of components.
 * It contains the function that are shared among all MsComponents. Makes little sense to use this alone
 *
 * @class componentBase
 * @constructor new MsComponents.componentBase(DOM/Jquery element,{properties})
 *
 * @property parent
 * @type Jquery / Dom element / componentBase
 * @property options
 * @type object
 */
function componentBase(parent,options){
  eemiter.call(this);
  this.options=options;
  var thisComponent=this;
  if(!this.name){
    this.name="component";
  }
  /**
    * @property {$jq} own's jquery object
  */
  this.$jq=$('<div class="ms-'+this.name+'"></div>');

  if(options.css)
    this.$jq.css(options.css);
  this.css=function(css){
    this.$jq.css(options.css);
    return this;
  }
  if(typeof (parent.append||false)=="function"){
    parent.append(this.$jq);
  }else if(typeof (parent.$jq.append||false)=="function"){
    parent.$jq.append(this.$jq);
  }else{
    console.log("a slider couldn't find dom element to attach himself");
  }
  /**
  * @property mouseActivationMode
  * @type String
  *  dragAll: the buttons will activate through all the trajectory of the mouse while pressed
  * oneByOne: one click=one button press
  * dragLast: the mouse can be tragged and will activae and hover only the last button that it entered
  * hover: the buttins are activated upon hover regardless of whether is clicked or not
  */
  if(!options.mouseActivationMode){
    options.mouseActivationMode="dragAll";
  }

  function mouseActivate(event){
    thisComponent.handle("onMouseStart");
    event.preventDefault();
    thisComponent.addClass("active");
  }
  function mouseDeactivate(event){
    thisComponent.handle("onMouseEnd");
    event.preventDefault();
    thisComponent.removeClass("active");
  }

  //to avoid if chains that are a pain to change
  function aIsInB(a,b){
    for (var c in b){
      if(a==b[c]){console.log("true");return true;}
    }
    return false;
  };

  this.$jq.on("mousedown tap touchstart",function(event){
    //check that upon the current event, a mouseActivate should be triggered.
    if(aIsInB(options.mouseActivationMode,["dragAll","oneByOne","dragLast"])){
      mouseActivate(event);
    }
  });

  this.$jq.on("mouseenter",function(event){
    if(mouse.buttonDown){
      if(aIsInB(options.mouseActivationMode,["dragAll","dragLast"])){
        mouseActivate(event);
      }
    }
    if(options.mouseActivationMode=="hover"){
      mouseActivate(event);
    }
  });
  this.$jq.on("mouseup",function(event){
    if(aIsInB(options.mouseActivationMode,["dragAll","oneByOne","dragLast"])){
      mouseDeactivate(event);
    }
  });
  this.$jq.on("mouseout",function(event){
    if(aIsInB(options.mouseActivationMode,["hover","oneByOne","dragLast"])){
      mouseDeactivate(event);
    }
  });


  this.updateDom=function(){
    thisComponent.$jq.html(this.label);
  }
  //aliasing of these two handy function
  this.addClass=function(to){
    thisComponent.$jq.addClass(to);
  }
  this.removeClass=function(to){
    thisComponent.$jq.removeClass(to);
  }
}