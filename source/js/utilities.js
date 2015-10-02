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

this.galaxies.utils.supportsEC3 = function() {
  var codecString = 'audio/mp4; codecs="ec-3"';
  
  if ( (typeof MediaSource !== 'undefined') ) {
    return MediaSource.isTypeSupported( codecString );
  } else {
    var testEl = document.createElement( "video" );
    if ( testEl.canPlayType ) {
      return ( ( 'probably' === testEl.canPlayType( codecString ) ) );
    } else {
      return false;
    }
  }  
}



// Patch SPE to allow negative speeds to make particles move inwards.
// This is used by the UFO laser charge effect.
SPE.Emitter.prototype.randomizeExistingVelocityVector3OnSphere = function( v, base, position, speed, speedSpread ) {
        v.copy( position )
            .sub( base )
            .normalize()
            .multiplyScalar( this.randomFloat( speed, speedSpread ) );
            //.multiplyScalar( Math.abs( this.randomFloat( speed, speedSpread ) ) );
};



