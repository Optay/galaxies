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
  
  galaxies.engine.OBSTACLE_VISIBLE_RADIUS
}
galaxies.BaseTarget.prototype.destroy = function() {
  
}




/**
 * Capsule
 * Holds a powerup.
 * 
 */
galaxies.Capsule = function( powerup ) {
  galaxies.BaseTarget.call(this);
  
  this.powerup = powerup;
  
  var color = 0xaabbcc;
  switch (this.powerup) {
    case "clone": color = 0xffcccc; break;
    case "spread": color = 0xff0000; break;
    case "golden": color = 0xffccaa; break;
  }
  
  var geometry = new THREE.SphereGeometry(0.2, 10, 10);
  var mat = new THREE.MeshPhongMaterial( {
      color: color,
      specular: 0xffffff,
      shininess: 5} );
  this.model = new THREE.Mesh( geometry, mat );
  this.object.add( this.model );
  
  galaxies.engine.rootObject.add( this.object );
  galaxies.engine.neutrals.push(this);

  this.hitThreshold = 0.3;
  
  this.lifetime = 10;
  
  this.angle = 0;
  this.distance = 3.1; // distance from origin of capsule position
  this.orbitAngle = 0;
  this.orbitRadius = 0.5; // magnitude of oscillation
  this.orbitVelocity = 0.9; // speed of oscillation
  this.position = new THREE.Vector3();
  
  this.appear();
}

galaxies.Capsule.prototype = Object.create( galaxies.BaseTarget.prototype );
galaxies.Capsule.prototype.constructor = galaxies.Capsule;
galaxies.Capsule.prototype.hit = function() {
  // release the powerup
  console.log("Capsule.hit");
  galaxies.engine.powerupCount++;
  galaxies.engine.setPowerup( this.powerup );
  
  this.clear();
}

galaxies.Capsule.prototype.clear = function() {
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

galaxies.Capsule.prototype.update = function( delta ) {
  this.timer += delta;
  if ( this.timer > this.lifetime ) { this.clear(); }
  
  this.orbitAngle = Math.sin( this.timer*this.orbitVelocity) * this.orbitRadius;
  
  this.object.position.set(
    Math.cos(this.angle + this.orbitAngle) * this.distance,
    Math.sin(this.angle + this.orbitAngle) * this.distance,
    0 );
  
  galaxies.utils.conify( this.object );
  
}






