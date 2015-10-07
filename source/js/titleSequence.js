"use strict";
/**
 * Rotating title sequence
 *
 */

this.galaxies = this.galaxies || {};

galaxies.TitleSequence = function() {
  
  var titleTransition = function() {
    var waitTime = TITLE_TIME_MS;
    if ( currentTitleIndex === 0 ) {
      waitTime = waitTime/2;
    }
    
    // spin wheel
    createjs.Tween.removeTweens( titleHub.rotation );
    createjs.Tween.get( titleHub.rotation )
      .wait(waitTime)
      .to( { x: 2*Math.PI/4 }, TRANSITION_TIME_HALF_MS, createjs.Ease.quadIn )
      .to( { x: -1*Math.PI/4 }, 0 )
      .call( nextTitle )
      .to( { x: 0 }, TRANSITION_TIME_HALF_MS, createjs.Ease.quadOut )
      .call( checkTitleSequence );
    
    // tilt wheel
    createjs.Tween.removeTweens( titlePivot.rotation );
    createjs.Tween.get( titlePivot.rotation )
      .wait(waitTime)
      .to( { z: Math.PI/4 }, TRANSITION_TIME_HALF_MS, createjs.Ease.quadIn )
      .to( { z: -Math.PI/4 }, 0)
      .to( { z: 0 }, TRANSITION_TIME_HALF_MS, createjs.Ease.quadOut );
    
    // rotate view to match wheel motion
    var start = rootObject.rotation.x;
    createjs.Tween.removeTweens( rootObject.rotation );
    createjs.Tween.get( rootObject.rotation )
      .wait(waitTime)
      .to( { x: start - Math.PI/4 }, TRANSITION_TIME_MS, createjs.Ease.quadInOut );
    
    // audio object
    // Whoosh object goes beyond rest position, so sound doesn't stop so abruptly.
    // Whoosh tween also lasts duration of whoosh audio.
    createjs.Tween.removeTweens( wooshObject.position );
    createjs.Tween.get( wooshObject.position )
      .wait( waitTime*9/10 )
      .to( {x:0, y:10, z: cameraZ*2}, 0 )
      .call( function() {
        //restart the sound...
        whooshSound.sound.startSound();
        //console.log("starting whoosh sound");
      }, this)
      .to( {x:0, y:5, z:-cameraZ}, 3000, createjs.Ease.quadInOut );
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
      titleTransition();
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
  var titleScale = 100;
  var titleStartAngle = 0;//PI_2/titleImageIds.length * -0.2;
  
  var wooshObject = new THREE.Object3D();
  var whooshSound = new ObjectSound( getSound('titlewoosh'), wooshObject, 10, false, false );
  
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
    var map = new THREE.Texture( image, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter );
    map.needsUpdate = true;
    
    var mat = new THREE.SpriteMaterial( {
      color: 0xffffff,
      map: map,
      } );
    titles[i] = mat;
  }
  
  var title = new THREE.Sprite( titles[0] );
  titleHub.add( title );
//titles[i].rotateOnAxis(titleRotationAxis, i * 0.1);//PI_2/len );
  
  var extraTextureLux = new THREE.Texture( galaxies.queue.getResult( 'titleExtraLux' ) );
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
    rootObject.add( titleRoot );
    
    startTimers();
    /*
    clock.start();
    createjs.Ticker.paused = false;
    */
    
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
    
  }


  
  
  var deactivate = function() {
    rootObject.remove( titleRoot );
    
    if ( titleFrameRequest != null ) {
      window.cancelAnimationFrame(titleFrameRequest);
      titleFrameRequest = null;
    }
    
    // stop motion
    createjs.Tween.removeTweens( titleHub.rotation );
    createjs.Tween.removeTweens( titlePivot.rotation );
    createjs.Tween.removeTweens( rootObject.rotation );
    createjs.Tween.removeTweens( wooshObject.position );

  }

  var animateTitle = function() {
    titleFrameRequest = requestAnimationFrame( animateTitle );
    updateTitle();
  };
  
  // Tick function
  // TODO - drift functionality is repeated from game loop... should be common somehow.
  var updateTitle = function() {
    var delta = clock.getDelta();
    if ( delta===0 ) { return; } // paused!
    
    whooshSound.update(delta);
    
    driftObject.rotateOnAxis( driftAxis, driftSpeed * delta );
    title.material.rotation = titlePivot.rotation.z; // match lean angle of wheel
    
    renderer.render( scene, camera );
  }
  
  
  return {
    activate: activate,
    deactivate: deactivate
  };
  
};

