# wapi-diffuser
A module blur sound.
Usage example in src/index.js
##to create and connect a blurModule
```javascript
//for the case of es6.
//otherwise I think that BlurModule becomes available upon inclusion of build.js
var bm=require('./blurModule.js');
//constructor requires your audioContext
var module=new bm.BlurModule(audioContext);
//you can connect it to a web audio api source
yourSoundSource.connect(module.audioInput);
 ```
##to control the level of blur
module.control is to adjust the blur level, from zero to 1. 
```javascript
module.control(e.clientX/(window.innerWidth-5));
```