"use strict";
/**
 * Projectile
 * The shuttlecock.
 *
 */

this.galaxies = this.galaxies || {};

galaxies.Projectile = function (type, model, startAngle, directionOffset, indestructible, particles) {
  this.angularSpeed = 10;
  this.object = new THREE.Object3D();
  this.object.up.set(0,0,1);
  this.rotationAxis = new THREE.Vector3(0, 1, 0);
  this.particleEmitters = [];
  this.particleGroups = [];

  this.initialize(type, model, startAngle, directionOffset, indestructible, particles);
};

galaxies.Projectile.prototype.initialize = function (type, model, startAngle, directionOffset, indestructible, particles) {
  this.reset();

  this.type = type;
  this.indestructible = !!indestructible;

  this.startAngle = startAngle;
  this.startPos = new THREE.Vector3(-Math.sin(startAngle), Math.cos(startAngle), 0);
  this.startPos.multiplyScalar(galaxies.engine.PROJ_START_Y);
  this.lookOffset = directionOffset || 0;

  this.setModel(model);

  this.attachParticles(particles);

  this.object.position.copy(this.startPos);

  var lookAngle = startAngle + this.lookOffset;
  var direction = new THREE.Vector3(-Math.sin(lookAngle), Math.cos(lookAngle), 0).add(this.startPos);

  this.object.rotation.set(Math.PI / 2, Math.atan2(direction.y, direction.x) + Math.PI / 2, 0);

  galaxies.utils.conify(this.object);

  this.findSeekTarget();
};

galaxies.Projectile.prototype.reset = function () {
  this.isExpired = false;
  this.firedByClone = false;
  this.alreadyCollidedWith = [];
  this.lastPos = new THREE.Vector3();
  this.lifeTimer = 0;
  this.inScene = false;

  this.flatCapsule = new galaxies.colliders.CapsuleCollider(new THREE.Vector3(), new THREE.Vector3(), 0);
  this.capsule = new galaxies.colliders.CapsuleCollider(new THREE.Vector3(), new THREE.Vector3(), 0);

  this.flatCapsule.rootPosition1 = this.flatCapsule.position1;
  this.flatCapsule.rootPosition2 = this.flatCapsule.position2;
  this.flatCapsule.rootRadius = this.flatCapsule.radius;

  this.capsule.rootPosition1 = this.capsule.position1;
  this.capsule.rootPosition2 = this.capsule.position2;
  this.capsule.rootRadius = this.capsule.radius;
};

galaxies.Projectile.prototype.setModel = function (model) {
  if (!model) {
    return;
  }

  if (!this.model || !(model.geometry === this.model.geometry && model.material === this.model.material)) {
    if (this.model) {
      this.object.remove(this.model);
    }

    this.model = model;
    this.object.add(this.model);
  } else {
    this.model.scale.copy(model.scale);
  }

  this.model.rotation.x = galaxies.engine.CONE_ANGLE;
  this.model.rotation.y = 0;
  this.model.rotation.z = 0;
};

galaxies.Projectile.prototype.attachParticles = function (particles) {
  if (!particles) {
    return;
  }

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

  this.particleEmitters.forEach(function (emitter) {
    emitter.position.value = this.startPos;
  }, this);

  this.particleGroups.forEach(function (group) {
    this.object.add(group.mesh);
  }, this);
};

galaxies.Projectile.prototype.addToScene = function () {
  if (this.isExpired) {
    return;
  }

  galaxies.engine.rootObject.add(this.object);
  galaxies.engine.planeSweep.add(this);

  this.inScene = true;

  this.particleEmitters.forEach(function (emitter) {
    emitter.enable();
  });
};

galaxies.Projectile.prototype.findSeekTarget = function () {
  this.seekTarget = null;

  if (this.type !== "seeker") {
    return;
  }

  var ufo = galaxies.engine.ufo,
      ourPos = this.object.position,
      ourAngle = galaxies.utils.normalizeAngle(galaxies.utils.flatAngle(ourPos)),
      maxAngleDiff = Math.PI / 2;

  if (ufo.state !== "inactive") {
    var ufoAngle = galaxies.utils.normalizeAngle(galaxies.utils.flatAngle(ufo.rootPosition.clone().sub(ourPos)));

    if (Math.abs(ufoAngle - ourAngle) < maxAngleDiff) {
      this.seekTarget = ufo;

      return;
    }
  }

  var visRadiusSq = galaxies.engine.OBSTACLE_VISIBLE_RADIUS * galaxies.engine.OBSTACLE_VISIBLE_RADIUS,
      smallestDiff = maxAngleDiff;

  galaxies.engine.obstacles.every(function (asteroid) {
    var position = asteroid.object.position.clone(),
        flSqr = galaxies.utils.flatLengthSqr(position);

    if (asteroid.state === "inactive" || flSqr > visRadiusSq) {
      return;
    }

    var asteroidAngle = galaxies.utils.normalizeAngle(galaxies.utils.flatAngle(position.sub(ourPos)));

    if (Math.abs(asteroidAngle - ourAngle) < smallestDiff) {
      this.seekTarget = asteroid;
    }
  }, this);
};

galaxies.Projectile.prototype.updatePosition = function (newAngle) {
  var newStart = new THREE.Vector3(-Math.sin(newAngle), Math.cos(newAngle), 0);
  newStart.multiplyScalar(galaxies.engine.PROJ_START_Y);
  
  var lookAngle = newAngle + this.lookOffset;
  var distanceFromOldStart = galaxies.utils.flatLength(this.object.position.clone().sub(this.startPos));
  var direction = new THREE.Vector3(-Math.sin(lookAngle), Math.cos(lookAngle), 0);

  this.startPos = newStart;

  this.object.position.copy(direction.clone().multiplyScalar(distanceFromOldStart).add(newStart));

  var objPos = this.object.position;

  this.particleEmitters.forEach(function (emitter) {
    emitter.position.value = objPos;
    emitter.rotation.value = direction;
  });

  direction.multiplyScalar(distanceFromOldStart + 1).add( newStart );

  this.object.rotation.set(Math.PI / 2, Math.atan2(direction.y, direction.x) + Math.PI / 2, 0);

  galaxies.utils.conify(this.object);

  this.findSeekTarget();
};

galaxies.Projectile.prototype.hit = function () {
  galaxies.fx.showHit(this.object.position, this.type);

  if (galaxies.utils.inShotGroup(this)) {
    ++galaxies.engine.projectilesHitRound;

    galaxies.utils.removeConnectedShotGroup(this);
  }

  if (!this.indestructible) {
    this.destroy();
  }
};

galaxies.Projectile.prototype.destroy = function () {
  this.isExpired = true;
  this.lifeTimer = this.PROJECTILE_LIFE;
};

galaxies.Projectile.prototype.remove = function () {
  galaxies.utils.removeConnectedShotGroup(this);

  this.inScene = false;

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
    this.object.remove(group.mesh);

    group.dispose();
  }, this);

  this.particleGroups = [];
};

galaxies.Projectile.prototype.update = function (delta) {
  if (!this.inScene || this.isExpired) {
    return;
  }

  this.lastPos.copy(this.object.position);

  if (galaxies.utils.flatLengthSqr(this.lastPos) < Math.pow(galaxies.engine.PROJ_START_Y + 1, 2)) {
    this.lastPos.multiplyScalar(0.75);
  }

  if (this.seekTarget) {
    var seekPos = (this.seekTarget.rootPosition || this.seekTarget.object.position).clone();

    if (galaxies.utils.flatLengthSqr(seekPos) < galaxies.utils.flatLengthSqr(this.object.position)) {
      this.seekTarget = null;
    } else {
      var currentAngle = galaxies.utils.normalizeAngle(this.object.rotation.y - Math.PI / 2),
          maxDiff = 2 * Math.PI * delta;

      seekPos.z = this.object.position.z;

      seekPos.sub(this.object.position);

      this.object.rotation.y = Math.min(Math.max(Math.atan2(seekPos.y, seekPos.x), currentAngle - maxDiff),
              currentAngle + maxDiff) + Math.PI / 2;
    }
  }

  this.object.translateZ(this.PROJECTILE_SPEED * delta);

  this.capsule.position1.copy(this.lastPos);
  this.capsule.position2.copy(this.object.position);

  this.particleEmitters.forEach(function (emitter) {
    emitter.position.value = this.object.position;
  }, this);

  this.particleGroups.forEach(function (group) {
    group.tick(delta);
  });

  this.model.rotateOnAxis(this.rotationAxis, this.angularSpeed * delta);
  this.lifeTimer += delta;

  if ( this.lifeTimer >= this.PROJECTILE_LIFE ) {
    this.isExpired = true;
  }
};

galaxies.Projectile.prototype.PROJECTILE_SPEED = 0; // Set by initial call to window resize
galaxies.Projectile.prototype.PROJECTILE_LIFE = 0; // This will be set by initial call to window resize


