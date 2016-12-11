exports.enable=function(){

  $(document).ready(function(){
    $(document).on("mousedown touchstart touchmove",function(event){
      mouse.buttonDown=true;
      // console.log(event);
    });
    $(document).on("mouseup touchend",function(event){
      mouse.buttonDown=false;
    });
    // document.ontouchmove = function(event){
    //   event.preventDefault();
    // }
  });
  
  return mouse;
}
var mouse={
  tool:"draw"
};


