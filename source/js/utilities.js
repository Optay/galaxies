"use strict";

this.galaxies = this.galaxies || {};

this.galaxies.utils = this.galaxies.utils || {};

// A linear tapered sinusoidal easing function.
// Used for shaking camera.
this.galaxies.utils.getShakeEase = function ( frequency ) {
  return function( t ) {
    var val = Math.cos( t * frequency ) * (1-t);
    //console.log(t, val);
    return val;
  };
};

// Identify desktop platforms to recommend correct browser with EC-3.
this.galaxies.utils.isOSX = function() {
  var agt = navigator.userAgent;
  return ( /Mac OS X/.test(agt) );
}
this.galaxies.utils.isWindows = function() {
  var agt = navigator.userAgent;
  return ( /Windows/.test(agt) && !/phone/i.test(agt) );
}



// Identify which audio format to use.
this.galaxies.utils.testAudioSupport = function( callback ) {
  // Has test been run?
  if ( typeof( galaxies.utils.supportsOGG ) !== 'undefined' ) {
    callback();
    return;
  }
  
  // Test OGG
  var oggTester = document.createElement("audio"); // Construct new Audio object
  var codecString = 'audio/ogg;codecs="vorbis"';
  galaxies.utils.supportsOGG = (oggTester.canPlayType(codecString)==='probably'); // cast to boolean
  console.log( "Supports OGG?", galaxies.utils.supportsOGG );
  //
  
  // Test EC-3
  // Note: Feature detection with MediaSource returns incorrect result in Safari 8. 
  // This code was created by Dolby.
  // https://github.com/DolbyDev/Browser_Feature_Detection
  var video = document.createElement('video');

  if (video.canPlayType('audio/mp4;codecs="ec-3"') === '' || video.canPlayType('audio/mp4;codecs="ac-3"') === '') {
      galaxies.utils.supportsEC3 = false;
      callback();
  } else {
      var audio = new Audio();
      audio.muted = true;
      audio.addEventListener('error', function () {
          galaxies.utils.supportsEC3 = false;
          callback();
      }, false);
      audio.addEventListener('seeked', function () {
          galaxies.utils.supportsEC3 = true;
          callback();
      }, false);

      audio.addEventListener('canplaythrough', function () {
          try {
              audio.currentTime = 2;
          } catch (e) {
            callback();
          }
      }, false);
      audio.src = 'audio/silence.mp4';
      audio.play();
  }  
}



// Patch SPE to allow negative speeds to make sphere particles move inwards.
// This is used by the UFO laser charge effect.
SPE.Emitter.prototype.randomizeExistingVelocityVector3OnSphere = function( v, base, position, speed, speedSpread ) {
        v.copy( position )
            .sub( base )
            .normalize()
            .multiplyScalar( this.randomFloat( speed, speedSpread ) );
            //.multiplyScalar( Math.abs( this.randomFloat( speed, speedSpread ) ) );
};



