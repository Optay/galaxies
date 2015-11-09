"use strict";
/**
 * Rotating title sequence
 *
 */

this.galaxies = this.galaxies || {};

galaxies.TitleSequence = function() {
  
  var titleTransition = function() {
    
    // spin wheel
    createjs.Tween.removeTweens( titleHub.rotation );
    createjs.Tween.get( titleHub.rotation )
      .to( { x: 2*Math.PI/4 }, TRANSITION_TIME_HALF_MS, createjs.Ease.quadIn )
      .to( { x: -1*Math.PI/4 }, 0 )
      .call( nextTitle )
      .to( { x: 0 }, TRANSITION_TIME_HALF_MS, createjs.Ease.quadOut )
      .call( checkTitleSequence );
    
    // tilt wheel
    createjs.Tween.removeTweens( titlePivot.rotation );
    createjs.Tween.get( titlePivot.rotation )
      .to( { z: Math.PI/4 }, TRANSITION_TIME_HALF_MS, createjs.Ease.quadIn )
      .to( { z: -Math.PI/4 }, 0)
      .to( { z: 0 }, TRANSITION_TIME_HALF_MS, createjs.Ease.quadOut );
    
    // rotate view to match wheel motion
    var start = galaxies.engine.rootObject.rotation.x;
    createjs.Tween.removeTweens( galaxies.engine.rootObject.rotation );
    createjs.Tween.get( galaxies.engine.rootObject.rotation )
      .to( { x: start - Math.PI/4 }, TRANSITION_TIME_MS, createjs.Ease.quadInOut );
  }
  // Audio start must be offset from title motion to sync hence the separate function.
  var titleTransitionAudio = function() {
    // Whoosh object goes beyond rest position, so sound doesn't stop so abruptly.
    // Whoosh tween also lasts duration of whoosh audio.
    createjs.Tween.removeTweens( whooshObject.position );
    createjs.Tween.get( whooshObject.position )
      .to( {x:0, y:10, z: galaxies.engine.CAMERA_Z+20}, 0 )
      .call( function() {
        whooshSound.sound.startSound();
        //console.log("starting whoosh sound");
      }, this)
      .to( {x:0, y:10, z:-10}, 3000, createjs.Ease.quadInOut );
  }
  var nextTitle = function() {
    currentTitleIndex ++;
    updateTitleSprite();
  }  
  var updateTitleSprite = function() {
    title.material = titles[currentTitleIndex];
    title.position.set( 0, -TITLE_OFFSET, 0 );
    
    if ( title.material.map ) {
      title.scale.set( title.material.map.image.width/titleScale, title.material.map.image.height/titleScale , 1 );
    }
    
    if ( titleExtra != null ) { titleHub.remove( titleExtra ); }
    titleExtra = titleExtras[currentTitleIndex];
    if ( titleExtra!=null ) { titleHub.add( titleExtra ); }
  }
  var checkTitleSequence = function() {
    if ( currentTitleIndex < (titles.length-1) ) {
      var waitTime = TITLE_TIME_MS;
      if ( currentTitleIndex === 0 ) {
        waitTime = waitTime/2;
      }
      createjs.Tween.removeTweens( this );
      createjs.Tween.get( this )
        .wait(waitTime)
        .call( titleTransition, this );

      createjs.Tween.get( whooshObject, {override:true} )
        .wait( waitTime - 500 )
        .call( titleTransitionAudio, this );
      
    }
  }
  
  var rotationAxis = new THREE.Vector3();
  var driftAxis = new THREE.Vector3(1,0,0);
  var driftSpeed = 0.05;
  
  var titleFrameRequest;
  var titleRoot; // the root object
  
  var TITLE_TIME_MS = 4000;
  var TRANSITION_TIME_MS = 500;
  var TRANSITION_TIME_HALF_MS = TRANSITION_TIME_MS/2;
  
  
  var TITLE_HUB_OFFSET = 100;
  var TITLE_OFFSET = TITLE_HUB_OFFSET - 5;
  
  var titlePivot = new THREE.Object3D();
  titlePivot.position.set(0,0,0);
  titleRoot = titlePivot;
  
  var titleHub = new THREE.Object3D();
  titleHub.position.set( 0, TITLE_HUB_OFFSET, 0 );
  titlePivot.add( titleHub );
  
  var titles = []; // Title sprite materials
  var titleExtras = []; // Sprite objects
  var titleExtra; // Reference to current object
  var currentTitleIndex = 0;
  
  var titleImageIds = ['', 'title5', 'title1', 'title2', 'title3', 'title4', 'title5'];
  var titleRotationAxis = new THREE.Vector3(1,0,0);
  var titleScale = 80; //100
  var titleStartAngle = 0;//galaxies.utils.PI_2/titleImageIds.length * -0.2;
  
  var whooshObject = new THREE.Object3D();
  var whooshSound = new galaxies.audio.ObjectSound( galaxies.audio.getSound('titlewoosh'), whooshObject, 5, false, false );
  
  for ( var i=0, len=titleImageIds.length; i<len; i++ ) {
    if ( titleImageIds[i] == '' ) {
      titles[i] = new THREE.SpriteMaterial({
        map: null,
        opacity: 0,
        transparent: true
      } );
      continue;
    }
    
    var image = galaxies.queue.getResult(titleImageIds[i]);
    var map = new THREE.Texture( image );
    map.magFilter = THREE.LinearFilter;
    map.minFilter = THREE.LinearMipMapLinearFilter;
    map.needsUpdate = true;
    
    var mat = new THREE.SpriteMaterial( {
      color: 0xffffff,
      map: map,
      } );
    titles[i] = mat;
  }
  
  var title = new THREE.Sprite( titles[0] );
  titleHub.add( title );
//titles[i].rotateOnAxis(titleRotationAxis, i * 0.1);//galaxies.utils.PI_2/len );
  
  var extraTextureLux = new THREE.Texture( galaxies.queue.getResult( 'titleExtraLux' ) );
  extraTextureLux.magFilter = THREE.LinearFilter;
  extraTextureLux.minFilter = THREE.LinearFilter;
  extraTextureLux.needsUpdate = true;
  titleExtras[3] = new THREE.Sprite(
    new THREE.SpriteMaterial( {
      color: 0xffffff,
      map: extraTextureLux
    } )
  );
  titleExtras[3].position.set(13,-TITLE_OFFSET,6);
  titleExtras[3].scale.set( titleExtras[3].material.map.image.width/70, titleExtras[3].material.map.image.height/70, 1 );
  
  var extraTextureTrunkford = new THREE.Texture( galaxies.queue.getResult( 'titleExtraTrunkford' ) );
  extraTextureTrunkford.magFilter = THREE.LinearFilter;
  extraTextureTrunkford.minFilter = THREE.LinearFilter;
  extraTextureTrunkford.needsUpdate = true;
  titleExtras[5] = new THREE.Sprite(
    new THREE.SpriteMaterial( {
      color: 0xffffff,
      map: extraTextureTrunkford
    } )
  );
  titleExtras[5].position.set(16,-TITLE_OFFSET,4);
  titleExtras[5].scale.set( titleExtras[5].material.map.image.width/60, titleExtras[5].material.map.image.height/60, 1 );
  
  updateTitleSprite();

  
  var activate = function() {
    galaxies.engine.rootObject.add( titleRoot );
    
    galaxies.engine.startTimers();
    
    // reset hub
    titleHub.rotation.set(0,0,0);
    titleHub.rotateOnAxis( titleRotationAxis, titleStartAngle );
    
    currentTitleIndex = 0;
    updateTitleSprite();
    checkTitleSequence.call(this); // need context in order to set tweens on the titleSequence object
   
    if ( titleFrameRequest == null ) {
      animateTitle();
    }
    
    driftAxis.set( THREE.Math.randFloatSpread(1), THREE.Math.randFloatSpread(1), THREE.Math.randFloatSpread(1) );
    driftAxis.normalize();
    
  }


  
  
  var deactivate = function() {
    galaxies.engine.rootObject.remove( titleRoot );
    
    if ( titleFrameRequest != null ) {
      window.cancelAnimationFrame(titleFrameRequest);
      titleFrameRequest = null;
    }
    
    // stop motion
    createjs.Tween.removeTweens( this );
    createjs.Tween.removeTweens( titleHub.rotation );
    createjs.Tween.removeTweens( titlePivot.rotation );
    createjs.Tween.removeTweens( galaxies.engine.rootObject.rotation );
    createjs.Tween.removeTweens( whooshObject.position );

  }

  var animateTitle = function() {
    titleFrameRequest = requestAnimationFrame( animateTitle );
    updateTitle();
  };
  
  // Tick function
  // TODO - drift functionality is repeated from game loop... should be common somehow.
  var updateTitle = function() {
    var delta = galaxies.engine.clock.getDelta();
    if ( delta===0 ) { return; } // paused!
    
    whooshSound.update(delta);
    
    galaxies.engine.driftObject.rotateOnAxis( driftAxis, driftSpeed * delta );
    title.material.rotation = titlePivot.rotation.z; // match lean angle of wheel
    
    galaxies.engine.renderer.render( galaxies.engine.scene, galaxies.engine.camera );
  }
  
  
  return {
    activate: activate,
    deactivate: deactivate
  };
  
};

