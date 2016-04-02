"use strict";
/**
 * Projectile
 * The shuttlecock.
 *
 */

this.galaxies = this.galaxies || {};

galaxies.Projectile = function( model, startAngle, directionOffset, indestructible, particles ) {
  directionOffset = directionOffset || 0;

  this.angularSpeed = 10;
  this.isExpired = false;
  this.particleEmitters = [];
  this.particleGroups = [];

  if (particles) {
    if (!(particles instanceof Array)) {
      particles = [particles];
    }

    particles.forEach(function (emitterOrGroup) {
      if (emitterOrGroup instanceof SPE.Emitter) {
        this.particleEmitters.push(emitterOrGroup);
      } else if (emitterOrGroup instanceof SPE.Group) {
        this.particleGroups.push(emitterOrGroup);
      }
    }, this);
  }

  this.object = new THREE.Object3D();
  this.object.up.set(0,0,1);
  this.lastPos = new THREE.Vector3();
  
  this.indestructible = false;
  if ( typeof(indestructible) === 'boolean' ) {
    this.indestructible = indestructible;
  }
  
  var rotateAxis = new THREE.Vector3(0,1,0);

  // set initial direction
  this.startAngle = startAngle;
  this.startPos = new THREE.Vector3(-Math.sin(startAngle), Math.cos(startAngle), 0);
  this.startPos.multiplyScalar(galaxies.engine.PROJ_START_Y);

  this.particleEmitters.forEach(function (emitter) {
    emitter.position.valueOf = this.startPos;
  }, this);

  this.particleGroups.forEach(function (group) {
    this.object.add(group.mesh);
  }, this);

  this.object.position.copy( this.startPos );
  this.lookOffset = directionOffset;

  var lookAngle = startAngle + directionOffset;
  var direction = new THREE.Vector3(-Math.sin(lookAngle), Math.cos(lookAngle), 0).add(this.startPos);
  this.object.lookAt( direction );
  
  this.model = model;
  this.object.add(this.model);
  this.model.rotation.x = galaxies.engine.CONE_ANGLE;
  
  galaxies.utils.conify(this.object);
  
  this.lifeTimer = 0;
  
  this.updatePosition = function( newAngle ) {
    var newStart = new THREE.Vector3(-Math.sin(newAngle), Math.cos(newAngle), 0);
    newStart.multiplyScalar(galaxies.engine.PROJ_START_Y);

    var lookAngle = newAngle + this.lookOffset;
    var distanceFromOldStart = galaxies.utils.flatLength(this.object.position.clone().sub(this.startPos));
    var direction = new THREE.Vector3(-Math.sin(lookAngle), Math.cos(lookAngle), 0);

    this.startPos = newStart;

    this.object.position.copy(direction.clone().multiplyScalar(distanceFromOldStart).add(newStart));

    if (this.particleEmitter) {
      this.particleEmitter.position.value = this.object.position;
      this.particleEmitter.rotation.value = direction;
    }

    direction.multiplyScalar(distanceFromOldStart + 1).add( newStart );
    this.object.lookAt( direction );

    galaxies.utils.conify( this.object );
  }
  
  this.hit = function() {
    galaxies.fx.showHit( this.object.position );

    if (galaxies.utils.inShotGroup(this)) {
      ++galaxies.engine.projectilesHitRound;

      galaxies.utils.removeConnectedShotGroup(this);
    }

    if ( !this.indestructible ) {
      this.destroy();
    }
  }
  
  /// Expired projectiles will be removed by engine
  this.destroy = function() {
    this.isExpired = true;
    this.lifeTimer = this.PROJECTILE_LIFE;
  }

  this.remove = function() {
    galaxies.utils.removeConnectedShotGroup(this);
    if (this.object.parent != null) {
      this.object.parent.remove(this.object);
    }
    galaxies.engine.planeSweep.remove(this);

    this.particleEmitters.forEach(function (emitter) {
      emitter.disable();
      emitter.group.releaseIntoPool(emitter);
    });

    this.particleEmitters = [];

    this.particleGroups.forEach(function (group) {
      group.dispose();
    });

    this.particleGroups = [];
  }

  this.addToScene = function() {
    if (!this.isExpired) {
      galaxies.engine.rootObject.add( this.object );
      galaxies.engine.planeSweep.add(this);

      this.particleEmitters.forEach(function (emitter) {
        emitter.enable();
      });
    }
  }
  this.update = function( delta ) {
    this.lastPos.copy(this.object.position);

    if (galaxies.utils.flatLengthSqr(this.lastPos) < Math.pow(galaxies.engine.PROJ_START_Y + 1, 2)) {
      this.lastPos.multiplyScalar(0.75);
    }

    this.object.translateZ( this.PROJECTILE_SPEED * delta );

    this.particleEmitters.forEach(function (emitter) {
      emitter.position.value = this.object.position;
    }, this);

    this.particleGroups.forEach(function (group) {
      group.tick(delta);
    });

    this.model.rotateOnAxis( rotateAxis, this.angularSpeed * delta );
    this.lifeTimer += delta;
    if ( this.lifeTimer >= this.PROJECTILE_LIFE ) {
      this.isExpired = true;
    }
  }
}

galaxies.Projectile.prototype.PROJECTILE_SPEED = 3.0; // 3.0 in original
galaxies.Projectile.prototype.PROJECTILE_LIFE = 0; // This will be set by initial call to window resize


