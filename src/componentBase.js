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
 * @constructor componentBase.call(this,parent,options,defaults);
 *
 * @property parent
 * @type Jquery / Dom element / componentBase
 * @param {object} options values for customization of the component
 * @param {object} defaults values that will belong to the inheriting object.
 * the default object will contain all the default properties for the object itself
 * aswell as for the object.properties.
 *
 * All default values will be overwritten by the options values, and therefore
 * declaring a default in the object will make a property of the options object
 * to belong to the object, where otherwise the options property would remain
 * in the object.properties only.
 *
 *
 * @example

 function AButton(parent,options){
    var defaults={a:0,b:1}
    this.name="AButton";
    componentBase.call(this,parent,options,defaults);
 }
 var d=new Button($(body),{a:4,c:5});
//will create a div with class ms-AButton, and var d will contain properties
//a=4, b=1 & options= {a:4,b:1,c:5}

 *
 * @type object
 */
function componentBase(parent,options,defaults){
  var thisComponent=this;

  var defaults=defaults||{};
  //make sure this object will contain defaults and options.
  if(options){
    this.options=options;
  }else{
    this.options={};
  }

  //defaults contain default properties for the object
  //options contain the user written options that will overwrite the defaults.
  //object keeps track of the options in the this.options, so if the object mutates, it can be retrieved back
  for(var a in defaults){
    if(!this.options[a])
    this.options[a]=defaults[a];
    this[a]=this.options[a];
  }

  console.log("post",this.options,options,defaults);

  eemiter.call(this);
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
    thisComponent.handle("onMouseStart",event);
    event.preventDefault();
    thisComponent.addClass("active");
  }
  function mouseDeactivate(event){
    thisComponent.handle("onMouseEnd",event);
    event.preventDefault();
    thisComponent.removeClass("active");
  }

  //to avoid iffy chains that are a pain to change
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