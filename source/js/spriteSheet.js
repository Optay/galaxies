"use strict";

this.galaxies = this.galaxies || {};

galaxies.SpriteSheet = function( texture, frames, frameRate ) {
  this.framePeriod = 1/frameRate;
  this.frames = frames;
  
  var playing = false;
  
  var frameIndex = 0;
  var timer = 0;
  var loopCounter;
  
  var width = texture.image.width;
  var height = texture.image.height;
  
  this.texture = texture;
  
  this.updateFrame = function( index ) {
    // update frame
    frameIndex = index;
    var frame = this.frames[frameIndex];
    
    this.texture.repeat.set( frame[2]/width, frame[3]/height );
    
    this.texture.offset.x = (frame[0])/width;
    this.texture.offset.y = 1-((frame[1] + frame[3])/height);
  }
  
  this.update = function( delta ) {
    if ( !playing ) { return; }
    
    timer += delta;
    
    var newFrameIndex = Math.floor(timer / this.framePeriod);
    
    if ( newFrameIndex > frameIndex ) {
      if ( newFrameIndex >= this.frames.length ) {
        loopCounter--;
        newFrameIndex = 0;
        timer = 0;
      }
      if ( loopCounter === 0 ) { // animation complete
        this.stop();
        return;
      }
      this.updateFrame(newFrameIndex );
    }
  }
  
  this.play = function( loops ) {
    if ( typeof(loops) === 'undefined' ) {
      loops = 1;
    }
    loopCounter = loops;
    timer = 0;
    frameIndex = 0;
    playing = true;
  }
  
  this.stop = function() {
    frameIndex = 0;
    this.updateFrame( frameIndex );
    playing = false;
  }
  
  this.updateFrame(0);

}
