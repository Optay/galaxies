"use strict";
/**
 * Targets
 * 
 * This includes powerup capsules, stars, other neutral objects that can be hit
 * but do not directly threaten the player.
 *
 */

this.galaxies = this.galaxies || {};


galaxies.BaseTarget = function() {
  this.object = new THREE.Object3D();
  
  this.timer = 0;
  this.lifetime = 3.5;
  this.isActive = false;
}

galaxies.BaseTarget.prototype.activate = function() {
  this.isActive = true;
}





/**
 * Capsule
 * Holds a powerup.
 * 
 */
galaxies.Capsule = function( powerupType ) {
  galaxies.BaseTarget.call(this);

  var map = new THREE.Texture(galaxies.queue.getResult('tripleicon'));

  map.minFilter = THREE.LinearFilter;
  map.needsUpdate = true;

  var mat = new THREE.SpriteMaterial({
    map: map,
    color: 0xFFFFFF,
    transparent: true,
    opacity: 0.0
  });

  this.model = new THREE.Sprite(mat);
  
  this.object.add( this.model );
  galaxies.engine.rootObject.add( this.object );
  galaxies.engine.neutrals.push(this);
  galaxies.engine.planeSweep.add(this);

  this.hitThreshold = 0.3;
  
  this.lifetime = 10;
  
  this.typeInterval = this.lifetime/galaxies.engine.powerups.length;
  if ( powerupType === "heart" ) {
    this.typeTime = Number.POSITIVE_INFINITY;
    this.lifetime /= 2;
    this.powerupIndex = -1;
  } else {
    this.typeTime = this.typeInterval;
    this.powerupIndex = Math.round(Math.random()* (galaxies.engine.powerups.length - 1) );
  }
  this.updatePowerup(powerupType);
  
  this.angle = 0;
  
  this.distance = galaxies.engine.VISIBLE_RADIUS * (galaxies.engine.inTutorial ? 0.9 : 0.97); // distance from origin of capsule position
  this.orbitAngle = 0;
  this.orbitRadius = 0.2; // magnitude of oscillation
  this.orbitVelocity = 0.7; // speed of oscillation
  this.position = new THREE.Vector3();
  
  this.appear();
}

galaxies.Capsule.prototype = Object.create( galaxies.BaseTarget.prototype );
galaxies.Capsule.prototype.constructor = galaxies.Capsule;
galaxies.Capsule.prototype.hit = function() {
  // release the powerup
  console.log("Capsule.hit");
  galaxies.engine.setPowerup( this.powerup, this.object );
  
  var soundId = 'powerupcollect';
  if ( this.powerup === 'heart' ) {
    soundId = 'heartcollect';
  }
  new galaxies.audio.PositionedSound({
    source: galaxies.audio.getSound(soundId),
    position: galaxies.utils.rootPosition( this.object ),
    baseVolume: 2,
    loop: false
  });

  galaxies.fx.showStaricles(this.object.position, this.powerup);

  this.clear();
}

galaxies.Capsule.prototype.clear = function() {
  console.log("clear capsule");
  galaxies.engine.inactiveNeutrals.push(this);
  galaxies.engine.rootObject.remove( this.object );
  galaxies.engine.powerupCapsules.splice(galaxies.engine.powerupCapsules.indexOf(this), 1);
}

galaxies.Capsule.prototype.appear = function() {
  this.angle = Math.random() * galaxies.utils.PI_2;
  this.position.set( Math.cos(this.angle) * this.distance,
                     Math.sin(this.angle) * this.distance,
                     0 );
  this.orbitAngle = 0;
  
  // fade in
  createjs.Tween.removeTweens( this.model.material );
  createjs.Tween.get( this.model.material )
    .to( { opacity: 1 }, 500 )
    .call( this.activate, null, this );
}

galaxies.Capsule.prototype.updatePowerup = function(powerupType) {
  /*if ( this.powerupIndex >= 0 ) {
    this.powerup = galaxies.engine.powerups[this.powerupIndex];
  } else {
    this.powerup = 'heart';
  }*/

  this.powerup = powerupType;

  var map;

  this.model.scale.set(1, 1, 1);
  this.model.material.color.set(0xFFFFFF);

  switch (powerupType) {
    case "clone":
      map = new THREE.Texture(galaxies.queue.getResult("alienproicon"));
      break;
    case "spread":
      map = new THREE.Texture(galaxies.queue.getResult("tripleicon"));
      break;
    case "golden":
      map = new THREE.Texture(galaxies.queue.getResult("rainbowicon"));
      break;
    case "seeker":
      map = new THREE.Texture();
      this.model.material.color.set(0x0000FF);
      break;
    case "heart":
      map = new THREE.Texture(galaxies.queue.getResult("heart"));
      this.model.scale.set(0.7, 0.7, 0.7);
      break;
    case "timeWarp":
      map = new THREE.Texture(galaxies.queue.getResult("slomo"));
      break;
    case "shield":
      map = new THREE.Texture(galaxies.queue.getResult("shield"));
      break;
  }

  map.minFilter = THREE.LinearFilter;
  map.needsUpdate = true;

  this.model.material.map = map;
}

galaxies.Capsule.prototype.update = function( delta ) {
  
  this.timer += delta;
  if ( this.isActive && (this.timer > this.lifetime) ) {
    // fade out
    this.isActive = false;
    createjs.Tween.removeTweens( this.model.material );
    createjs.Tween.get( this.model.material )
      .to( { opacity: 0 }, 500 )
      .call( this.clear, null, this );
    
    return;
  }
  
  /*if ( this.timer > this.typeTime ) {
    this.typeTime = this.typeTime + this.typeInterval;
    this.powerupIndex++;
    if ( this.powerupIndex >= galaxies.engine.powerups.length ) {
      this.powerupIndex = 0;
    }
    this.updatePowerup();
  }*/

  this.orbitAngle = Math.sin( this.timer*this.orbitVelocity) * this.orbitRadius;

  this.object.position.set(
    Math.cos(this.angle + this.orbitAngle) * this.distance,
    Math.sin(this.angle + this.orbitAngle) * this.distance,
    0 );
  
  galaxies.utils.conify( this.object );
  
}


// Stars are bonus objects that need to be hit to be collected.
// They expire after a set time.
galaxies.Star = function( angle ) {
  galaxies.BaseTarget.call(this);

  var map = new THREE.Texture( galaxies.queue.getResult('star') );
  map.minFilter = THREE.LinearFilter;
  map.needsUpdate = true;
  
  var starMaterial = new THREE.SpriteMaterial({
    map: map,
    color: 0xffffff,
    transparent: true,
    opacity: 0.0
  } );
  this.model = new THREE.Sprite( starMaterial );
  var starScale = 0.8; // scale it down a little
  this.model.scale.set( starScale, starScale, starScale );

  
  this.object.add( this.model );
  
  galaxies.engine.rootObject.add( this.object );
  galaxies.engine.neutrals.push(this);
  galaxies.engine.planeSweep.add(this);
  
  var distance = galaxies.engine.VISIBLE_RADIUS * 0.98;
  this.object.position.set( Math.cos(angle) * distance,
                            Math.sin(angle) * distance,
                            0 );
  galaxies.utils.conify( this.object );

  this.hitThreshold = 0.3;
  
  this.lifetime = 4;
  this.timer = 0;

  this.axis = new THREE.Vector3(0,0,1);
  this.speed = 1;
  
  // fade in
  createjs.Tween.removeTweens( this.model.material );
  createjs.Tween.get( this.model.material )
    .to( { opacity: 1 }, 500 )
    .call( this.activate, null, this );
}
galaxies.Star.prototype = Object.create( galaxies.BaseTarget.prototype );
galaxies.Star.prototype.constructor = galaxies.Star;
galaxies.Star.prototype.hit = function() {
  galaxies.engine.collectStar(this.object);
  new galaxies.audio.PositionedSound({
    source: galaxies.audio.getSound('starcollect'),
    position: galaxies.utils.rootPosition( this.object ),
    baseVolume: 4,
    loop: false
  });
  
  galaxies.fx.showStaricles( this.object.position );
  
  this.clear();
}

galaxies.Star.prototype.clear = function() {
  console.log("clear star")
  galaxies.engine.inactiveNeutrals.push(this);
  galaxies.engine.rootObject.remove( this.object );
}

galaxies.Star.prototype.update = function( delta ) {
  
  this.timer += delta;
  if ( this.isActive && (this.timer > this.lifetime) ) {
    this.isActive = false;
    
    // fade out
    createjs.Tween.removeTweens( this.model.material );
    createjs.Tween.get( this.model.material )
      .to( { opacity: 0 }, 500 )
      .call( this.clear, null, this );
      
    return;
  }
  
  this.model.material.rotation += this.speed * delta;
  
}


