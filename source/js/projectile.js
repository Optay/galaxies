"use strict";
/**
 * Projectile
 * The shuttlecock.
 *
 */

this.galaxies = this.galaxies || {};

galaxies.Projectile = function( model, angle, angleOffset, spread, indestructible, particleEmitter ) {
  this.angularSpeed = 10;
  this.isExpired = false;
  this.particleEmitter = particleEmitter;
  
  this.object = new THREE.Object3D();
  this.object.up.set(0,0,1);
  
  this.indestructible = false;
  if ( typeof(indestructible) === 'boolean' ) {
    this.indestructible = indestructible;
  }
  
  var rotateAxis = new THREE.Vector3(0,1,0);
  
  this.angleOffset = 0;
  if ( typeof( angleOffset ) === 'number' ) {
    this.angleOffset = angleOffset;
  }
  angle += angleOffset;

  // spread is expected to be -1 to 1
  if ( typeof(spread) != 'number' ) { spread = 0; }
  this.spreadAngle = spread * 45 * Math.PI/180;
  
  // set initial direction
  var direction = new THREE.Vector3( -Math.sin(angle), Math.cos(angle), 0 );
  direction.multiplyScalar( galaxies.engine.PROJ_START_Y );
  this.object.position.copy( direction );
  if (this.particleEmitter) {
    this.particleEmitter.position.value = direction;
  }
  direction.add( direction );
  this.object.lookAt( direction );
  
  this.model = model;
  this.object.add(this.model);
  this.model.rotation.x = galaxies.engine.CONE_ANGLE;
  
  galaxies.utils.conify(this.object);
  
  this.lifeTimer = 0;
  
  this.updatePosition = function( newAngle ) {
    newAngle += this.angleOffset;
    
    var distance = galaxies.utils.flatLength( this.object.position );
    direction.set( -Math.sin(newAngle), Math.cos(newAngle), 0 );
    direction.multiplyScalar( distance );
    
    this.object.position.copy( direction );
    if (this.particleEmitter) {
      this.particleEmitter.position.value = this.object.position;
      this.particleEmitter.rotation.value = direction;
    }
    direction.add( direction );
    this.object.lookAt( direction );
    this.object.rotateOnAxis( new THREE.Vector3(0,1,0), this.spreadAngle );
    direction.normalize();


    galaxies.utils.conify( this.object );
  }
  
  this.hit = function() {
    galaxies.fx.showHit( this.object.position );
   
    if ( !this.indestructible ) {
      this.destroy();
    }
  }
  
  /// Expired projectiles will be removed by engine
  this.destroy = function() {
    if (this.particleEmitter) {
      this.particleEmitter.disable();
      this.particleEmitter.group.releaseIntoPool(this.particleEmitter);
    }
    this.isExpired = true;
    this.lifeTimer = this.PROJECTILE_LIFE;
  }
  this.remove = function() {
    if ( this.object.parent!=null) {
      this.object.parent.remove(this.object);
    }
    if (this.particleEmitter) {
      this.particleEmitter.disable();
      this.particleEmitter.group.releaseIntoPool(this.particleEmitter);
    }
  }
  this.addToScene = function() {
    if (!this.isExpired) {
      galaxies.engine.rootObject.add( this.object );
      if (this.particleEmitter) {
        this.particleEmitter.enable();
      }
    }
  }
  this.update = function( delta ) {
    this.object.translateZ( this.PROJECTILE_SPEED * delta );
    if (this.particleEmitter) {
      this.particleEmitter.position.value = this.object.position.clone().sub(direction.clone().multiplyScalar(0.15));
    }
    this.model.rotateOnAxis( rotateAxis, this.angularSpeed * delta );
    this.lifeTimer += delta;
    if ( this.lifeTimer >= this.PROJECTILE_LIFE ) {
      this.isExpired = true;
    }
  }
}

galaxies.Projectile.prototype.PROJECTILE_SPEED = 3.0; // 3.0 in original
galaxies.Projectile.prototype.PROJECTILE_LIFE = 0; // This will be set by initial call to window resize


