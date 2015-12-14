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
  this.lifetime = 10;
  
}
/*
galaxies.BaseTarget.prototype.destroy = function() {
}*/




/**
 * Capsule
 * Holds a powerup.
 * 
 */
galaxies.Capsule = function( isHeart ) {
  galaxies.BaseTarget.call(this);
  
  if ( isHeart ) {
    // Sprite
    var map = new THREE.Texture( galaxies.queue.getResult('heart') );
    map.minFilter = THREE.LinearFilter;
    map.needsUpdate = true;
    var heartMaterial = new THREE.SpriteMaterial({
      map: map,
      color: 0xffffff,
      transparent: true,
      opacity: 1.0
    } );
    this.model = new THREE.Sprite( heartMaterial );
    var scale = 0.6; // scale it down a little
    this.model.scale.set( scale, scale, scale );    
  } else {
    // Capsule mesh
    var geometry = new THREE.SphereGeometry(0.2, 10, 10);
    var mat = new THREE.MeshPhongMaterial( {
        color: 0xaaaaaa,
        specular: 0xffffff,
        shininess: 5} );
    this.model = new THREE.Mesh( geometry, mat );
  }
  
  
  
  this.object.add( this.model );
  galaxies.engine.rootObject.add( this.object );
  galaxies.engine.neutrals.push(this);

  this.hitThreshold = 0.3;
  
  this.lifetime = 10;
  
  this.typeInterval = this.lifetime/galaxies.engine.powerups.length;
  if ( isHeart ) {
    this.typeTime = Number.POSITIVE_INFINITY;
    this.powerupIndex = -1;
  } else {
    this.typeTime = this.typeInterval;
    this.powerupIndex = Math.round(Math.random()* (galaxies.engine.powerups.length - 1) );
  }
  this.updatePowerup();
  
  this.angle = 0;
  
  this.distance = galaxies.engine.VISIBLE_RADIUS * 0.9;// 3.1; // distance from origin of capsule position
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
  galaxies.engine.setPowerup( this.powerup );
  
  this.clear();
}

galaxies.Capsule.prototype.clear = function() {
  console.log("clear capsule");
  galaxies.engine.inactiveNeutrals.push(this);
  galaxies.engine.rootObject.remove( this.object );
  galaxies.engine.powerupCapsule = null;
}

galaxies.Capsule.prototype.appear = function() {
  this.angle = Math.random() * galaxies.utils.PI_2;
  this.position.set( Math.cos(this.angle) * this.distance,
                     Math.sin(this.angle) * this.distance,
                     0 );
  this.orbitAngle = 0;
}

galaxies.Capsule.prototype.updatePowerup = function() {
  if ( this.powerupIndex >= 0 ) {
    this.powerup = galaxies.engine.powerups[this.powerupIndex];
  } else {
    this.powerup = 'heart';
  }
  var color;
  switch (this.powerup) {
    case "clone": color = 0x00ffff; break;
    case "spread": color = 0x9900ff; break;
    case "golden": color = 0x00aa00; break;
    case "heart":
    default:
      color = 0xffffff;
      break;
  }
  this.model.material.color.setHex( color );
}

galaxies.Capsule.prototype.update = function( delta ) {
  this.timer += delta;
  if ( this.timer > this.lifetime ) { this.clear(); return; }
  
  if ( this.timer > this.typeTime ) {
    this.typeTime = this.typeTime + this.typeInterval;
    this.powerupIndex++;
    if ( this.powerupIndex >= galaxies.engine.powerups.length ) {
      this.powerupIndex = 0;
    }
    this.updatePowerup();
  }
  
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
    opacity: 1.0
  } );
  this.model = new THREE.Sprite( starMaterial );
  var starScale = 0.7; // scale it down a little
  this.model.scale.set( starScale, starScale, starScale );

  
  /*
  // FPO Geometry 
  var geometry = new THREE.TetrahedronGeometry(0.3, 0);
  var mat = new THREE.MeshPhongMaterial( {
      color: 0xffff00,
      specular: 0xffffff,
      emissive: 0xaaaa00,
      shininess: 5} );
  this.model = new THREE.Mesh( geometry, mat );*/
  
  this.object.add( this.model );
  
  galaxies.engine.rootObject.add( this.object );
  galaxies.engine.neutrals.push(this);
  
  var distance = galaxies.engine.VISIBLE_RADIUS * 0.91;
  this.object.position.set( Math.cos(angle) * distance,
                            Math.sin(angle) * distance,
                            0 );
  galaxies.utils.conify( this.object );

  this.hitThreshold = 0.3;
  
  this.lifetime = 4;
  this.timer = 0;

  this.axis = new THREE.Vector3(0,0,1);
  this.speed = 1;
}
galaxies.Star.prototype = Object.create( galaxies.BaseTarget.prototype );
galaxies.Star.prototype.constructor = galaxies.Star;
galaxies.Star.prototype.hit = function() {
  galaxies.engine.collectStar();
  
  this.clear();
}

galaxies.Star.prototype.clear = function() {
  console.log("clear star")
  galaxies.engine.inactiveNeutrals.push(this);
  galaxies.engine.rootObject.remove( this.object );
}

galaxies.Star.prototype.update = function( delta ) {
  this.timer += delta;
  if ( this.timer > this.lifetime ) { this.clear(); return; }
  
  //this.object.rotateOnAxis( this.axis, this.speed * delta );
  //this.object.rotation.set(0,0, this.object.rotation.z + this.speed * delta);
  
  this.model.material.rotation += this.speed * delta;
  
}


