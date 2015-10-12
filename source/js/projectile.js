"use strict";
/**
 * Projectile
 * The shuttlecock.
 *
 */

this.galaxies = this.galaxies || {};

galaxies.Projectile = function( model, angle ) {
  this.angularSpeed = 10
  this.isExpired = false;
  
  this.object = new THREE.Object3D();
  this.object.up.set(0,0,1);
  
  var rotateAxis = new THREE.Vector3(0,1,0);
  
  // set initial direction
  var direction = new THREE.Vector3( -Math.sin(angle), Math.cos(angle), 0 );
  direction.multiplyScalar( galaxies.engine.PROJ_START_Y );
  this.object.position.copy( direction );
  direction.add( direction );
  this.object.lookAt( direction );
  
  this.model = model;
  this.object.add(this.model);
  this.model.rotation.x = galaxies.engine.CONE_ANGLE;
  
  galaxies.utils.conify(this.object);
  
  //object.rotation.x = object.rotation.z + Math.PI/2;
  //this.direction = direction.multiplyScalar( SPEED );
  //console.log( object.position, direction );
  
  this.lifeTimer = 0;
  
  this.updatePosition = function( newAngle ) {
    
    var distance = galaxies.utils.flatLength( this.object.position );
    direction.set( -Math.sin(newAngle), Math.cos(newAngle), 0 );
    direction.multiplyScalar( distance );
    
    this.object.position.copy( direction );
    direction.add( direction );
    this.object.lookAt( direction );
    galaxies.utils.conify( this.object );
  }
  
  /// Expire and schedule for removal
  this.destroy = function() {
    galaxies.fx.showHit( this.object.position );
    
    this.isExpired = true;
    this.lifeTimer = this.PROJECTILE_LIFE;
  }
  this.remove = function() {
    if ( this.object.parent!=null) {
      this.object.parent.remove(this.object);
    }
  }
  this.addToScene = function() {
    if (!this.isExpired) {
      galaxies.engine.rootObject.add( this.object );
    }
  }
  this.update = function( delta ) {
    this.object.translateZ( this.PROJECTILE_SPEED * delta );
    this.model.rotateOnAxis( rotateAxis, this.angularSpeed * delta );
    this.lifeTimer += delta;
    if ( this.lifeTimer >= this.PROJECTILE_LIFE ) {
      this.isExpired = true;
    }
  }
}

galaxies.Projectile.prototype.PROJECTILE_SPEED = 3.0;
galaxies.Projectile.prototype.PROJECTILE_LIFE = 0; // This will be set by initial call to window resize


