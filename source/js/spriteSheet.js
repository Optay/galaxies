"use strict";

this.galaxies = this.galaxies || {};

galaxies.SpriteSheet = function( texture, frames, frameRate ) {
  this.framePeriod = 1/frameRate;
  this.frames = frames;
  
  var playing = false;
  
  var frameIndex = 0;
  var timer = 0;
  
  var width = texture.image.width;
  var height = texture.image.height;
  
  this.texture = texture;
  
  //this.texture.wrapS = this.texture.wrapT = THREE.RepeatWrapping;
  
  this.updateFrame = function( index ) {
    //console.log( index );
    // update frame
    frameIndex = index;
    var frame = this.frames[frameIndex];
    //console.log( frame );
    
    this.texture.repeat.set( frame[2]/width, frame[3]/height );
    //console.log( frame[2]/width, frame[3]/height );
    
    this.texture.offset.x = (frame[0])/width;
    this.texture.offset.y = 1-((frame[1] + frame[3])/height);
    
    //console.log( 1 - (frame[1]/height), frame[3], height );
    
    //this.texture.needsUpdate = true;
  }
  
  this.update = function( delta ) {
    if ( !playing ) { return; }
    
    timer += delta;
    
    var newFrameIndex = Math.floor(timer / this.framePeriod);
    
    if ( newFrameIndex > frameIndex ) {
      if ( newFrameIndex >= this.frames.length ) {
        // animation complete
        //console.log("animation complete");
        frameIndex = 0;
        this.updateFrame( frameIndex );
        playing = false;
        return;
      }
      this.updateFrame(newFrameIndex );
    }
  }
  
  this.play = function() {
    timer = 0;
    frameIndex = 0;
    playing = true;
    //console.log("play animation");
  }
  
  this.updateFrame(0);
  
  
/*  
texture, tilesHoriz, tilesVert, numTiles, tileDispDuration) 
{	
	// note: texture passed by reference, will be updated by the update function.
		
	this.tilesHorizontal = tilesHoriz;
	this.tilesVertical = tilesVert;
	// how many images does this spritesheet contain?
	//  usually equals tilesHoriz * tilesVert, but not necessarily,
	//  if there at blank tiles at the bottom of the spritesheet. 
	this.numberOfTiles = numTiles;
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
	texture.repeat.set( 1 / this.tilesHorizontal, 1 / this.tilesVertical );
	// how long should each image be displayed?
	this.tileDisplayDuration = tileDispDuration;
	// how long has the current image been displayed?
	this.currentDisplayTime = 0;
	// which image is currently being displayed?
	this.currentTile = 0;
		
	this.update = function( milliSec )
	{
		this.currentDisplayTime += milliSec;
		while (this.currentDisplayTime > this.tileDisplayDuration)
		{
			this.currentDisplayTime -= this.tileDisplayDuration;
			this.currentTile++;
			if (this.currentTile == this.numberOfTiles)
				this.currentTile = 0;
			var currentColumn = this.currentTile % this.tilesHorizontal;
			texture.offset.x = currentColumn / this.tilesHorizontal;
			var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
			texture.offset.y = currentRow / this.tilesVertical;
		}
	};  
  
  
  /*
   *
   *
lux_shoot._SpriteSheet = new createjs.SpriteSheet({images: ["lux_serve.png"],

 // x, y, width, height, imageIndex*, regX*, regY*
frames: [[0,0,110,158,0,-8,16.349999999999994],
		 [110,0,129,152,0,4,14.349999999999994],
		 [239,0,129,167,0,4,29.349999999999994],
		 [368,0,129,183,0,4,45.349999999999994],
		 [0,183,141,190,0,-27,52.349999999999994],
		 [141,183,141,195,0,-27,57.349999999999994],
		 [282,183,141,200,0,-27,62.349999999999994],
		 [0,383,111,196,0,-8,81.35],
		 [111,383,111,196,0,-8,81.35],
		 [222,383,98,183,0,0,76.35],
		 [320,383,97,158,0,0,51.349999999999994],
		 [0,579,103,172,0,0,29.349999999999994],
		 [0,579,103,172,0,0,29.349999999999994],
		 [103,579,108,139,0,-4,-1.6500000000000057],
		 [103,579,108,139,0,-4,-1.6500000000000057],
		 [103,579,108,139,0,-4,-1.6500000000000057]]});
		 */
}
