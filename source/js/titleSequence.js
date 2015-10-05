"use strict";
/**
 * Rotating title sequence
 *
 */

this.galaxies = this.galaxies || {};

galaxies.TitleSequence = function() {
  
  var titleTransition = function() {
    createjs.Tween.removeTweens( titleHub.rotation );
    createjs.Tween.get( titleHub.rotation )
      .wait(2000)
      .to( { x: 2*Math.PI/4 }, 250 )
      .to( { x: -1*Math.PI/4 }, 0 )
      .call( nextTitle )
      .to( { x: 0 }, 250 )
      .call( checkTitleSequence )
  }
  var nextTitle = function() {
    currentTitleIndex ++;
    updateTitleSprite();
  }  
  var updateTitleSprite = function() {
    title.material = titles[currentTitleIndex];
    title.position.set( 0, -TITLE_OFFSET, 0 );
    title.scale.set( title.material.map.image.width/titleScale, title.material.map.image.height/titleScale , 1 );
  }
  var checkTitleSequence = function() {
    if ( currentTitleIndex < (titles.length-1) ) {
      titleTransition();
    }
  }
  
  var rotationAxis = new THREE.Vector3();
  var driftAxis = new THREE.Vector3(1,0,0);
  var driftSpeed = 0.05;
  
  var titleFrameRequest;
  
  
  var TITLE_HUB_OFFSET = 100;
  var TITLE_OFFSET = TITLE_HUB_OFFSET - 5;
  
  var titleHub = new THREE.Object3D();
  titleHub.position.set( 0, TITLE_HUB_OFFSET, 0 );
  
  var titles = [];
  var currentTitleIndex = 0;
  
  var titleImageIds = ['title5', 'title1', 'title2', 'title3', 'title4', 'title5'];
  var titleRotationAxis = new THREE.Vector3(1,0,0);
  var titleScale = 100;

  var titleStartAngle = 0;//PI_2/titleImageIds.length * -0.2;
  
  for ( var i=0, len=titleImageIds.length; i<len; i++ ) {
    var image = galaxies.queue.getResult(titleImageIds[i]);
    var map = new THREE.Texture( image, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter );
    map.needsUpdate = true;
    
    var mat = new THREE.SpriteMaterial( {
      color: 0xffffff,
      map: map
      } );
    titles[i] = mat;
  }
  
  var title = new THREE.Sprite( titles[0] );
  titleHub.add( title );
//titles[i].rotateOnAxis(titleRotationAxis, i * 0.1);//PI_2/len );
    
  updateTitleSprite();

  
  var activate = function() {
    rootObject.add( titleHub );
    clock.start();
    createjs.Ticker.paused = false;
    
    // reset hub
    titleHub.rotation.set(0,0,0);
    titleHub.rotateOnAxis( titleRotationAxis, titleStartAngle );
    
    currentTitleIndex = 0;
    updateTitleSprite();
    titleTransition();
   
    if ( titleFrameRequest == null ) {
      animateTitle();
    }
    
    driftAxis.set( THREE.Math.randFloatSpread(1), THREE.Math.randFloatSpread(1), THREE.Math.randFloatSpread(1) );
    driftAxis.normalize();
    
    // begin camera motion
  }


  
  
  var deactivate = function() {
    rootObject.remove( titleHub );
    clock.stop();
    
    if ( titleFrameRequest != null ) {
      window.cancelAnimationFrame(titleFrameRequest);
      titleFrameRequest = null;
    }
    // stop camera motion
  }

  var animateTitle = function() {
    titleFrameRequest = requestAnimationFrame( animateTitle );
    updateTitle();
  };
  
  var updateTitle = function() {
    var delta = clock.getDelta();
    if ( delta===0 ) { return; } // paused!
    
    rootObject.rotateOnAxis( driftAxis, driftSpeed * delta );
    
    renderer.render( scene, camera );
  }
  
  
  return {
    activate: activate,
    deactivate: deactivate
  };
  
};

