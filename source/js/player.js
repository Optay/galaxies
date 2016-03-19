"use strict";

this.galaxies = this.galaxies || {};

this.galaxies.Player = function() {
  
  var characters = {};
  
  
  var characterRotator = new THREE.Object3D();
  characterRotator.position.z = 0.5;

  var characterMap = new THREE.Texture( galaxies.queue.getResult('lux') );
  var baseAnimator = new galaxies.SpriteSheet(
    characterMap,
    [
      [0,0,232,339,0,23,143],
      [232,0,232,339,0,23,143],
      [464,0,232,339,0,23,143],
      [696,0,232,339,0,23,143],
      [0,339,232,339,0,23,143],
      [232,339,232,339,0,23,143],
      [464,339,232,339,0,23,143],
      [696,339,232,339,0,23,143],
      [0,678,232,339,0,23,143],
      [232,678,232,339,0,23,143],
      [464,678,232,339,0,23,143],
      [696,678,232,339,0,23,143],
      [0,1017,232,339,0,23,143],
      [232,1017,232,339,0,23,143],
      [464,1017,232,339,0,23,143],
      [696,1017,232,339,0,23,143],
      
      ], 
    30
    );
  characterMap.needsUpdate = true;
  var baseAspectRatio = 232/339;
  var baseTeleportMap = new THREE.Texture( galaxies.queue.getResult('lux') );
  baseTeleportMap.needsUpdate = true;
  var baseTeleport = new galaxies.SpriteSheet(
    baseTeleportMap,
    [
      [0,1356,232,339,0,23,143],
      [232,1356,232,339,0,23,143],
      [464,1356,232,339,0,23,143],
      [696,1356,232,339,0,23,143]
     ], 
    30
    );
  
  
  var goldenMap = new THREE.Texture( galaxies.queue.getResult('luxgolden') );
  var goldenAnimator = new galaxies.SpriteSheet(
    goldenMap,
    [
     [0,0,232,338,0,23,143],
     [232,0,232,338,0,23,143],
     [464,0,232,338,0,23,143],
     [696,0,232,338,0,23,143],
     [0,338,232,338,0,23,143],
     [232,338,232,338,0,23,143],
     [464,338,232,338,0,23,143],
     [696,338,232,338,0,23,143],
     [0,676,232,338,0,23,143],
     [232,676,232,338,0,23,143],
     [464,676,232,338,0,23,143],
     [696,676,232,338,0,23,143],
     [0,1014,232,338,0,23,143],
     [232,1014,232,338,0,23,143],
     [464,1014,232,338,0,23,143],
     [696,1014,232,338,0,23,143],

    ],
    30
    );
  goldenMap.needsUpdate = true;
  var goldenAspectRatio = 232/338;
  var goldenTeleportMap = new THREE.Texture( galaxies.queue.getResult('luxgolden') );
  goldenTeleportMap.needsUpdate = true;
  var goldenTeleport = new galaxies.SpriteSheet(
    goldenTeleportMap,
    [ // NOTE: these values are not the same as in the supplied sprite script, they are offset by four pixels
      [0,1352,232,338,0,23,143],
      [232,1352,232,338,0,23,143],
      [464,1352,232,338,0,23,143],
      [696,1352,232,338,0,23,143]
    ], 
    30
    );
  
  var spreadMap = new THREE.Texture( galaxies.queue.getResult('luxspread') );
  var spreadAnimator = new galaxies.SpriteSheet(
    spreadMap,
    [
      [0,0,233,339,0,23,143],
      [233,0,233,339,0,23,143],
      [466,0,233,339,0,23,143],
      [699,0,233,339,0,23,143],
      [0,339,233,339,0,23,143],
      [233,339,233,339,0,23,143],
      [466,339,233,339,0,23,143],
      [699,339,233,339,0,23,143],
      [0,678,233,339,0,23,143],
      [233,678,233,339,0,23,143],
      [466,678,233,339,0,23,143],
      [699,678,233,339,0,23,143],
      [0,1017,233,339,0,23,143],
      [233,1017,233,339,0,23,143],
      [466,1017,233,339,0,23,143],
      [699,1017,233,339,0,23,143],
      [0,1356,233,339,0,23,143],
      [233,1356,233,339,0,23,143],
      [466,1356,233,339,0,23,143],
      [699,1356,233,339,0,23,143],
  
    ],
    30
    );
  spreadMap.needsUpdate = true;
  var spreadAspectRatio = 233/339;
  var spreadTeleportMap = new THREE.Texture( galaxies.queue.getResult('luxspread') );
  spreadTeleportMap.needsUpdate = true;
  var spreadTeleport = new galaxies.SpriteSheet(
    spreadTeleportMap,
    [
      [0,1695,233,339,0,23,143],
      [233,1695,233,339,0,23,143],
      [466,1695,233,339,0,23,143],
      [699,1695,233,339,0,23,143],
     ], 
    30
    );
  
  
  var cloneMap = new THREE.Texture( galaxies.queue.getResult('luxclone') );
  var cloneAnimator = new galaxies.SpriteSheet(
    cloneMap,
    [
     [0,0,232,339,0,23,127],
     [232,0,232,339,0,23,127],
     [464,0,232,339,0,23,127],
     [696,0,232,339,0,23,127],
     [0,339,232,339,0,23,127],
     [232,339,232,339,0,23,127],
     [464,339,232,339,0,23,127],
     [696,339,232,339,0,23,127],
     [0,678,232,339,0,23,127],
     [232,678,232,339,0,23,127],
     [464,678,232,339,0,23,127],
     [696,678,232,339,0,23,127],
     [0,1017,232,339,0,23,127],
     [232,1017,232,339,0,23,127],
     [464,1017,232,339,0,23,127],
     [696,1017,232,339,0,23,127],

    ], 
    30
    );
  cloneMap.needsUpdate = true;
  var cloneAspectRatio = 164/229;
  var cloneTeleportMap = new THREE.Texture( galaxies.queue.getResult('luxclone') );
  var cloneTeleportAnimator = new galaxies.SpriteSheet(
    cloneTeleportMap,
    [
      [0,1356,232,339,0,23,127],
      [232,1356,232,339,0,23,127],
      [464,1356,232,339,0,23,127],
      [696,1356,232,339,0,23,127]
     ], 
    30
    );
  cloneTeleportMap.needsUpdate = true;
  
  // teleport
  var teleportSprite;
  var teleportAnimator;
  var TELEPORT_TIME_MS = 1500;
  var TELEPORT_TIME_HALF_MS = TELEPORT_TIME_MS/2;
  var teleporting = false;
  var teleportingClone = false;
  
  var teleportMaterial = new THREE.SpriteMaterial({
    map: baseTeleportMap,
    color: 0xffffff,
    transparent: true,
    opacity: 0.0
  } );
  teleportSprite = new THREE.Sprite( teleportMaterial );
  teleportSprite.position.z = 0.1; // must appear in front of base character sprite
  
  
  
  characters['golden'] = {
    map: goldenMap,
    animator: goldenAnimator,
    scale: goldenAspectRatio * galaxies.engine.CHARACTER_HEIGHT,
    teleportMap: goldenTeleportMap,
    teleportAnimator: goldenTeleport
  };
  characters['spread'] = {
    map: spreadMap,
    animator: spreadAnimator,
    scale: spreadAspectRatio * galaxies.engine.CHARACTER_HEIGHT,
    teleportMap: spreadTeleportMap,
    teleportAnimator: spreadTeleport
  };
  characters['base'] = {
    map: characterMap,
    animator: baseAnimator,
    scale: baseAspectRatio * galaxies.engine.CHARACTER_HEIGHT,
    teleportMap: baseTeleportMap,
    teleportAnimator: baseTeleport
  };
  characters['clone'] = characters['base'];
  
  
  // CHARACTER SPRITE
  var activeAnimator = baseAnimator;
  var characterMaterial = new THREE.SpriteMaterial({
    map: characterMap,
    color: 0xffffff,
    transparent: true,
    opacity: 1.0
  } );
  //var characterMaterial = new THREE.SpriteMaterial( { color: 0xffffff } );
  var character = new THREE.Sprite( characterMaterial );
  characterRotator.add( character );

  
  // CLONE SPRITE
  var cloneMaterial = new THREE.SpriteMaterial({
    map: cloneMap,
    color: 0xffffff,
    transparent: true,
    opacity: 1.0
  } );
  var clone = new THREE.Sprite( cloneMaterial );
  var cloneScale = cloneAspectRatio * galaxies.engine.CHARACTER_HEIGHT;
  clone.position.set( -cloneScale * 0.15, -galaxies.engine.CHARACTER_POSITION, 0 );
  clone.scale.set(cloneScale, galaxies.engine.CHARACTER_HEIGHT, cloneScale);
  
  var cloneTeleportMaterial = new THREE.SpriteMaterial({
    map: cloneTeleportMap,
    color: 0xffffff,
    transparent: true,
    opacity: 0.0
  } );
  var cloneTeleportSprite = new THREE.Sprite( cloneTeleportMaterial );
  cloneTeleportSprite.position.z = 0.1; // must appear in front of base character sprite      
  
  
  
  
  
  
  
  var show = function() {
    characterRotator.add( character );
  }
  var hide = function() {
    if ( character.parent === characterRotator ) {
      characterRotator.remove( character );
    }
  }
  var animateShoot = function() {
    activeAnimator.play();
    if ( (clone.parent !== null) && ( !teleportingClone ) ) {
      cloneAnimator.play();
    }
  }
  var animateHit = function() {
    if ( !createjs.Tween.hasActiveTweens( character.position ) ) {
      createjs.Tween.get( character.position )
        .to({y:galaxies.engine.PLANET_RADIUS + galaxies.engine.CHARACTER_HEIGHT}, 250, createjs.Ease.quadOut)
        .to({y:galaxies.engine.CHARACTER_POSITION}, 250, createjs.Ease.quadOut);
    }
  }
  var clearTweens = function() {
    createjs.Tween.removeTweens( character.position );
  }
  
  
  var addClone = function() {
    characterRotator.add( clone );
    teleportInClone();
  }
  var removeClone = function() {
    if ( clone.parent === characterRotator ) {
      teleportOutClone( function() { characterRotator.remove(clone); } );
    }
  }
  
  
  
  var update = function( delta, angle ) {
    characterRotator.rotation.set( 0, 0, angle );
    character.material.rotation = angle;
    activeAnimator.update( delta );
    
    if ( clone.parent !== null ) {
      cloneAnimator.update(delta);
      clone.material.rotation = Math.PI + angle;
    }
    if ( teleporting ) {
      teleportAnimator.update( delta );
      teleportSprite.material.rotation = character.material.rotation;
    }
    if (teleportingClone) {
      cloneTeleportAnimator.update( delta );
      cloneTeleportSprite.material.rotation = clone.material.rotation;
    }
    
  }
  
  
  var reset = function( angle ) {
    activeAnimator.stop();
    activeAnimator = baseAnimator;
    activeAnimator.updateFrame(0);
    
    character.rotation.set(0,0,0);
    character.material.rotation = angle;
    character.position.y = galaxies.engine.CHARACTER_POSITION;
    
  }
  
  
  
  var teleportOut = function() {
    teleporting = true;
    
    character.add( teleportSprite );
    teleportSprite.material.rotation = character.material.rotation;
    teleportSprite.material.opacity = 0;
    teleportAnimator.play(-1); // negative loop count will loop indefinitely
    
    // fade in and out
    createjs.Tween.removeTweens( teleportSprite.material );
    createjs.Tween.get( teleportSprite.material )
      .to( { opacity: 1 }, TELEPORT_TIME_HALF_MS )
      .set( { opacity: 0 }, character.material )
      .to( { opacity: 0 }, TELEPORT_TIME_HALF_MS )
      .call( teleportEffectComplete, this );
    
    teleportOutClone();
  }
  
  var teleportOutClone = function( callback ) {
    if ( clone.parent !== null ) {
      teleportingClone = true;
      
      clone.add( cloneTeleportSprite );
      cloneTeleportSprite.material.rotation = clone.material.rotation;
      cloneTeleportSprite.material.opacity = 0;
      cloneTeleportAnimator.play(-1); // negative loop count will loop indefinitely

      new galaxies.audio.PositionedSound({
          source: galaxies.audio.getSound('teleportout'),
          position: galaxies.utils.rootPosition( clone ),
          baseVolume: 10,
          loop: false
      });
      
      createjs.Tween.removeTweens( cloneTeleportSprite.material );
      createjs.Tween.get( cloneTeleportSprite.material )
        .to( { opacity: 1 }, TELEPORT_TIME_HALF_MS )
        .set( { opacity: 0 }, clone.material )
        .to( { opacity: 0 }, TELEPORT_TIME_HALF_MS )
        .call( teleportCloneComplete )
        .call( callback );
    }
  }
  
  var teleportEffectComplete = function() {
    teleportAnimator.stop();
    teleportSprite.parent.remove(teleportSprite);
    if ( cloneTeleportSprite.parent ) { cloneTeleportSprite.parent.remove( cloneTeleportSprite ); }
    teleporting = false;
  }
  var teleportCloneComplete = function() {
    cloneTeleportAnimator.stop();
    if ( cloneTeleportSprite.parent ) { cloneTeleportSprite.parent.remove( cloneTeleportSprite ); }
    teleportingClone = false;
  }
  
  var teleportIn = function( callback ) {
    
    character.add( teleportSprite );
    teleportSprite.material.rotation = character.material.rotation;
    teleportSprite.material.opacity = 0;
    teleportAnimator.play(-1); // negative loop count will loop indefinitely
    character.material.opacity = 0;
    
    // fade in and out
    createjs.Tween.removeTweens( teleportSprite.material );
    createjs.Tween.get( teleportSprite.material )
      .to( { opacity: 1 }, TELEPORT_TIME_HALF_MS )
      .set( { opacity: 1 }, character.material )
      .to( { opacity: 0 }, TELEPORT_TIME_HALF_MS )
      .call( teleportEffectComplete, this )
      .call( callback, this );
      
    teleporting = true;
    
    if ( clone.parent !== null ) {
      teleportInClone();
    }
    
  }
  
  var teleportInClone = function() {
    teleportingClone = true;
    
    clone.add( cloneTeleportSprite );
    cloneTeleportSprite.material.rotation = clone.material.rotation;
    cloneTeleportSprite.material.opacity = 0;
    cloneTeleportAnimator.play(-1); // negative loop count will loop indefinitely

    new galaxies.audio.PositionedSound({
        source: galaxies.audio.getSound('teleportin'),
        position: galaxies.utils.rootPosition( clone ),
        baseVolume: 10,
        loop: false
    });
    
    createjs.Tween.removeTweens( cloneTeleportSprite.material );
    createjs.Tween.get( cloneTeleportSprite.material )
      .to( { opacity: 1 }, TELEPORT_TIME_HALF_MS )
      .set( { opacity: 1 }, clone.material )
      .to( { opacity: 0 }, TELEPORT_TIME_HALF_MS )
      .call( teleportCloneComplete );
  }
  
  var setPowerup = function( powerup ) {
    if ( powerup === '' ) { powerup = 'base'; }
    removeClone();
    
    if ( powerup === 'clone' ) {
      addClone();
    }
    
    character.material.map = characters[powerup].map;
    activeAnimator = characters[powerup].animator;
    teleportSprite.material.map = characters[powerup].teleportMap;
    teleportAnimator = characters[powerup].teleportAnimator;
    
    character.position.set( characters[powerup].scale * 0.15, galaxies.engine.CHARACTER_POSITION, 0 ); // note that character is offset horizontally because sprites are not centered
    character.scale.set( characters[powerup].scale, galaxies.engine.CHARACTER_HEIGHT, characters[powerup].scale);
    
  }
  
  var die = function() {
    activeAnimator.updateFrame(10);
  }


  // initialize position and scale
  setPowerup('');

  
  
  
  
  
  return {
    root: characterRotator,
    sprite: character,
    show: show,
    hide: hide,
    addClone: addClone,
    removeClone: removeClone,
    animateShoot: animateShoot,
    animateHit: animateHit,
    clearTweens: clearTweens,
    teleportIn: teleportIn,
    teleportOut: teleportOut,
    update: update,
    reset: reset,
    setPowerup: setPowerup,
    die: die
    
  };
};