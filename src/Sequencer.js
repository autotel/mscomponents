var componentBase=require('./componentBase');
let eemiter=require('onhandlers');
var syncman,mouse;
exports.enable=function(globals){
  syncman=globals.syncman;
  mouse=globals.mouse;
  componentBase=componentBase.get({syncman:syncman,mouse:mouse});
  return Sequencer;
}
/**
 * A generator of sequencers
 *
 * @class Sequencer
 * @constructor new MsComponents.Sequencer(DOM/$jquery element,{properties})
 */
 //defines all the sequencer parameters by math,
 //maybe in a funture by styling table
var seqProg=4;
function Sequencer(parent,options){
 var n=options.n||3;
 var thisSequencer=this;
 this.name="sequencer"
 componentBase.call(this,parent,options);
 // this.$jq=$('<div class="sequencer" id="seq_'+n+'"><p style="position:absolute"></p></div>');
 parent.append(this.$jq);
 this.alive=false;
 this._bindN=syncman.bindList.push(this)-1;
 this.pos=0;
 this.data=[];
 /**
  * @param len
  *how many steps the sequencer has
  * @alias length
  */
 this.len=options.len|options.length|Math.pow(2,(seqProg%5)+1);
 /**
  * @param evry
  * how many clock steps make a sequencer step
  * @alias stepDivision
  */
 this.evry=options.evry|options.stepDivision|Math.pow(2,(seqProg%4)+1);
 //must count an [every] amount of beats for each pos increment.
 this.subpos=0;
 this.$jq.css({width:16*Math.ceil(this.len/4)+"px"});
 //this.$jq.addClass("color_"+seqProg%channels.length);
 this.disp=0;
 this.id=n;
 this.beatDisplace=0;
 var me=this;
 seqProg++;
 //this.channel=channels[this.id%channels.length];
 for(var bn=0; bn<this.len; bn++){
   this.data[bn]=new SequencerButton(bn,this)
 }
 this.aliveChild=0;
 this.displace=0;
 this.setDisplace=function(to/*,emit*/){
  //  if(emit=="only"){
    //  emit=true;
  //  }else{
     this.subpos=((this.clock.currentStep)%(this.len*this.evry))+to;
  //  }
  //  if(emit==true){
  //    sockChange("seq:"+me._bindN+"","dspl",to);
  //  }
 }
 this.step=function(){
   var prevalive=this.alive;
   this.alive=this.aliveChild>0;
  //  console.log(this.aliveChild);
   if(this.alive){
    //  console.log("sete");
     //if the state of this.alive changes, we must emit the displacement, because it is new
     if(!prevalive){
       this.displace=(this.clock.currentStep+this.subpos)%(this.len*this.evry);
       //console.log("ok. emit displae: "+this.displace);
       //this.setDisplace(this.displace,"only");
     };
     //each sequencer has a different speed rates. while some plays one step per click, others will have one step per several clock ticks.
     //the sequencer starting point is also displaced, and it depends on the time when it got alived+its position at that moment.
     if(this.subpos%this.evry==0){
       // console.log("sq"+this.pos);
       // data={sequencer:this.id,pos:this.pos,stepVal:this.data[this.pos].eval()};
       // this.onStepTrigger(data);
       // stepFunction(data);
       this.pos=(this.subpos/this.evry)%(this.len);
       var vl=this.data[this.pos].eval();
       if(vl){
         // this.channel.engine.start(0,this.channel.startOffset,this.channel.endTime);
         //so, this is called elsewhere aswelll.... the channel should have a trigger function
        //  var loopStart=this.channel.startOffset;
        //  var loopEnd=this.channel.endTime;
        //  this.channel.sampler.triggerAttack(false,0,1,{start:loopStart,end:loopEnd});
        this.handle("trigger",vl);
       }
     }else{
     }
     //what is more economic??
     // this.subpos=(this.subpos+1)%(this.len*this.evry);
     //i guess that.. but it can grow eternally
     this.subpos++;
   }
 }
 this.setClock=function(clock,divisions){
   if(divisions)
   this.evry=divisions;
   if(clock.on){
     clock.on('tick',function(){thisSequencer.step()});
     if(clock.name!="clock")
     console.warn("you set the clock of a sequencer to somehting that is not a clock, but a "+clock.name);
   }else{
     console.warn("you tried to connect a "+this.name+" to an object that has no event hanlers ");
   }
   this.clock=clock;
 }
 this.die=function(){
   for(var bn in this.data){
     this.data[bn].setData(0);
   }
   this.alive=false;
   this.$jq.detach();
 }
 // this.onStepTrigger=function(data){
 //   // console.log(data);
 // }
 // this.$jq.on("mouseenter",function(){
 //   focusChannel(me.channel.id);
 // });
 return this;
}

function SequencerButton(n,parent){
  eemiter.call(this);
  this.on("test",function(){console.log("works!")});
  this.handle("test");
  this.$jq=$('<div class="seqbutton"></div>');
  this._bindN=syncman.bindList.push(this)-1;
  parent.$jq.append(this.$jq);
  this.data=0;
  //pendant: evaluate wether the var n is still useful. remove it at every end.
  this.n=n;
  var me=this;
  this.setData=function(to,emit){
    // if(emit==true){
    //   sockChange("seqb:"+me._bindN+"","sV",to);
    // }
    // console.log("sdata");
    //socket may set data to 0 when is already 0, generating displace of parent's alivedhild
    if(to!=this.data){
      if(to==1){
        this.data=1;
        this.$jq.addClass("on");
        parent.aliveChild++;
      }
      if(to==0){
        this.data=0;
        this.$jq.removeClass("on");
        parent.aliveChild--;
      }
    }
    // console.log(parent.aliveChild);
    // console.log(parent.aliveChild);
  }
  this.$jq.on("mousedown tap touchstart",function(event){
    event.preventDefault();
    me.setData(Math.abs(me.data-1),true);
    // me.data=;
    if(me.data==1){
       mouse.switching=true;
    }else{
    //   $(this).removeClass("on");
    //   parent.aliveChild--;
       mouse.switching=false;
     }
  });
  this.$jq.on("mouseenter touchenter",function(){
    if(mouse.buttonDown){
      if(mouse.switching){
        if(me.data==0){
          me.setData(1,true);
        }
      }else{
        if(me.data==1){
          me.setData(0,true);
        }
      }
    }
  });
  this.eval=function(){
    var $jq=this.$jq;
    $jq.addClass("turn");
    window.setTimeout(function(){
      $jq.removeClass("turn");
    },200);
    return this.data;
  }
}
