"use strict";
/**
 * Obstacle: the object responsible for asteroids, satellites (pods),
 * and comets.
 *
 */

this.galaxies = this.galaxies || {};

/**
 * PLAIN ASTEROID
 */
galaxies.Obstacle = function ( props ) {
  // Default values
  this.type = 'asteroid';
  this.hitThreshold = 0.6;
  this.points = [10, 20, 30, 100];
  this.shakeAmount = 0.2;
  this.tumbling = true;
  this.orient = false;
  this.tumbleAxis = new THREE.Vector3();
  this.updateTumbleAxisOnHit = false;
  this.baseTumbleSpeed = 1.5;
  this.spiral = 0;
  this.baseSpeed = 0.2;
  this.mass = 1;
  this.baseLife = 1;
  this.state = 'inactive'; // state values: waiting, falling, ricocheting, inactive
  this.isActive = false; // will the object accept interactions
  this.hitSound = 'asteroidhit';
  this.rubbleType = 'plain';
  this.explodeSound = 'asteroidsplode';
  this.explosionGain = 2;
  this.passSoundId = '';
  
  // Overrides
  for ( var propName in props ) {
    if ( this.hasOwnProperty( propName ) ) {
      this[propName] = props[propName];
    } else { console.log("Obstacle attempting to set unknown property.", propName); }
  }
  
  this.passSound = null;
  if ( this.passSoundId !== '' ) {
    this.passSound = new galaxies.audio.SimpleSound({
      source: galaxies.audio.getSound( this.passSoundId ),
      baseVolume: 0,
      loop: true
    });
  }



  this.initModel();
  this.reset();

}

galaxies.Obstacle.prototype.SPEED_SCALE = 2;

galaxies.Obstacle.prototype.initModel = function() {
  
  var material = galaxies.resources.materials['asteroid'].clone();
  this.object = new THREE.Mesh( galaxies.resources.geometries['asteroid'], material );
  this.object.scale.set( 0.375, 0.375, 0.375 );
  this.object.up.set(0,0,1);
}

galaxies.Obstacle.prototype.setAngle = function( newAngle ) {
  this.angle = newAngle;
  this.updatePosition();
}

galaxies.Obstacle.prototype.updatePosition = function() {
  this.object.position.set( Math.cos(this.angle) * this.radius,
                            Math.sin(this.angle) * this.radius,
                            this.object.position.z );
  galaxies.utils.conify( this.object );
}

galaxies.Obstacle.prototype.reset = function() {
  this.age = 0;

  this.angle = Math.random()*Math.PI*2;
  this.radius = galaxies.engine.OBSTACLE_START_DISTANCE;
  this.previousRadius = this.radius;
  this.updatePosition();

  this.object.lookAt( new THREE.Vector3() );
  
  this.life = this.baseLife;

  this.state = 'falling';
  
  this.isActive = false;
  
  this.velocityRadial = 0;
  this.maxVelocityRadial = this.baseSpeed * (1-this.spiral);
  this.velocityTangential = this.baseSpeed * this.spiral;
  
  this.tumbleAxis.set( Math.random()*2-1, Math.random()*2 -1, Math.random()*2 -1 );
  this.tumbleAxis.normalize();
  this.tumbleSpeed = this.baseTumbleSpeed;

  if ( this.passSound !== null ) {
    this.passSound.volume = 0;
  }

  galaxies.engine.rootObject.add( this.object );

  galaxies.engine.planeSweep.add(this);
}

galaxies.Obstacle.prototype.update = function( delta ) {
  this.age += delta;
  
  // creates a nice curve that starts at 1 and increase to SPEED_SCALE
  // steeply as the obstacle approaches the planet
  // Graph it:
  // https://www.desmos.com/calculator
  var speedScale = (galaxies.engine.OBSTACLE_START_DISTANCE - galaxies.engine.PLANET_DISTANCE - this.radius ) / (galaxies.engine.OBSTACLE_START_DISTANCE- galaxies.engine.PLANET_DISTANCE); // normalize to 0-1, 0 at start position, 1 when it reaches the planet
  speedScale = 1 - this.SPEED_SCALE / (20*( speedScale - 1.05) );

  speedScale *= 7.5 * galaxies.engine.CONE_SLOPE;

  var distanceToPlanet = this.radius - galaxies.engine.PLANET_DISTANCE,
      charHeight = galaxies.engine.CHARACTER_HEIGHT * (0.08 + galaxies.engine.CONE_SLOPE * 0.3);

  if (distanceToPlanet < charHeight) {
    speedScale *= 4;
  }

  this.previousRadius = this.radius;
  
  this.angle += this.velocityTangential * delta/this.radius;
  this.radius += speedScale * this.velocityRadial * delta;
  this.updatePosition();
  
  switch ( this.state ) {
    // retreat and ricochet are no longer part of the game mechanics
  case 'retreating':
    break;
  case 'ricocheting':
    break;
  case 'falling':
    // accelerate and cap at prescribed obstacle speed
    this.velocityRadial += galaxies.engine.OBSTACLE_GRAVITY * delta;
    this.velocityRadial = Math.max( -this.maxVelocityRadial * galaxies.engine.speedScale, this.velocityRadial );

    var innerDist = galaxies.engine.shielded ? (galaxies.engine.SHIELD_RADIUS - galaxies.engine.PLANET_DISTANCE) : 0;

    if ( distanceToPlanet <= charHeight ) {
      // This order is very important as hitPlayer may trigger game over which
      // must override the obstacle's state.

      var angle = Math.atan2(-this.object.position.x, this.object.position.y);

      if (distanceToPlanet <= innerDist || Math.abs(galaxies.utils.normalizeAngle(angle - galaxies.engine.angle)) < 0.35) {
        this.splode(false);
        galaxies.engine.hitPlayer();
        break;
      }

      if (galaxies.engine.currentPowerup === "clone") {
        var cloneAngle = galaxies.engine.player.cloneSprite.material.rotation;

        if (Math.abs(galaxies.utils.normalizeAngle(angle - cloneAngle)) < 0.35) {
          this.splode(false);
          galaxies.engine.setPowerup('');
          break;
        }
      }
    }
    if ( this.radius < galaxies.engine.OBSTACLE_VISIBLE_RADIUS ) { this.isActive = true; }
    
    
    // idle sound level
    if ( this.passSound !== null ) {
      var soundLevel = 2 - Math.abs(this.object.position.z - galaxies.engine.CAMERA_Z)/10;
      soundLevel = THREE.Math.clamp( soundLevel, 0, 2 );
      
      if (this.age < 2) {
        soundLevel *= this.age / 2;
      }
      
      this.passSound.volume = soundLevel;
    }
    //
    
    break;
  case 'waiting':

  } // switch

  if ( this.tumbling ) {
    this.object.rotateOnAxis( this.tumbleAxis, this.tumbleSpeed * delta );
  } else if ( this.orient ) {
    this.object.lookAt( galaxies.engine.rootObject.position );
  }
  
} 

// Reverse course, no more interactions, the day is won
galaxies.Obstacle.prototype.retreat = function() {
  this.isActive = false;
  this.state = 'retreating';
  
  this.velocityRadial = ( 3 * this.baseSpeed * galaxies.engine.speedScale );
  
  this.tumbling = true;
  
  // silence!
  if ( this.passSound !== null ) {
    this.passSound.volume = 0;
  }
  
}

galaxies.Obstacle.prototype.hit = function( hitPosition, damage, multiply, forceDestroy ) {
  if ( this.state === 'inactive' ) { return; }

  if (typeof damage !== "number") {
    damage = 1;
  }
  
  this.life -= damage;
  
  if (typeof(multiply)!=='number') { multiply = 1; }
  
  this.velocityRadial = galaxies.Projectile.prototype.PROJECTILE_SPEED * 0.10;
  // update angular velocity based on hit position.
  var hitVector = this.object.position.clone();
  hitVector.sub( hitPosition );
  var hitDistance = hitVector.length();

  if (this.updateTumbleAxisOnHit) {
    this.tumbleAxis.set(-hitVector.y, hitVector.x, 0).normalize();
    this.tumbleSpeed = 8;
  }
  
  var angleDiff = this.angle - Math.atan2( hitPosition.y, hitPosition.x );
  angleDiff = galaxies.utils.mod( (angleDiff+Math.PI), (2*Math.PI)) - Math.PI; // Convert to minimum angle -Pi to Pi
  
  // This is an approximation as we are using angle*radius which gives us an arc length.
  // We should really be calculating the chord length 2*sin(angle/2).
  // This will be (roughly) between -1 and 1.
  var angularAmount = angleDiff * this.radius / hitDistance;
  
  this.velocityTangential += galaxies.Projectile.prototype.PROJECTILE_SPEED * 0.20 * angularAmount;
  
  // update tumble
  this.tumbleSpeed += (this.baseTumbleSpeed * angularAmount);
  
  if ( forceDestroy || (this.life <=0 ) ) {
    
    var pointIndex = Math.floor( (this.points.length) * (1 - ( (this.radius-galaxies.engine.PLANET_DISTANCE) / (galaxies.engine.OBSTACLE_START_DISTANCE-galaxies.engine.PLANET_DISTANCE) )) );
    pointIndex = Math.min( this.points.length - 1, pointIndex );
    
    galaxies.engine.showCombo( this.points[pointIndex], multiply, this.object );
    this.splode();
    return;
  }
  
  new galaxies.audio.PositionedSound({
    source: galaxies.audio.getSound(this.hitSound),
    position: galaxies.utils.rootPosition(this.object),
    baseVolume: 2,
    loop: false
  });
  
  

}

galaxies.Obstacle.prototype.splode = function( spawn ) {
  // Object must be deactivated first to prevent circular hit/splode calls for comets
  this.deactivate();
  
  if ( typeof(spawn)!=='boolean') {
    spawn = true;
  }
  
  new galaxies.audio.PositionedSound({
    source: galaxies.audio.getSound(this.explodeSound),
    position: galaxies.utils.rootPosition(this.object),
    baseVolume: this.explosionGain,
    loop: false
  });
  
  galaxies.fx.shakeCamera(this.shakeAmount);
  
  var c = Math.cos(this.angle);
  var s = Math.sin(this.angle);
  var velocity = new THREE.Vector3( c * this.velocityRadial - s * this.velocityTangential,
                                    s * this.velocityRadial + c * this.velocityTangential,
                                    0 );
  galaxies.fx.showRubble( this.rubbleType, this.object.position, velocity );
  
  if ( spawn ) {
    for (var i=0; i<this.spawnNumber; i++ ) {
      var child = galaxies.engine.addObstacle( this.spawnType );
      
      child.radius = this.radius + THREE.Math.randFloatSpread( this.hitThreshold * galaxies.engine.CONE_SLOPE );

      // Create range of velocities from -baseSpeed to +baseSpeed scaled by a constant.
      var tan = this.velocityTangential + ((2 * i/(this.spawnNumber-1))-1) * (this.baseSpeed * 4);
      child.velocityRadial = this.velocityRadial;
      child.velocityTangential = tan;
      child.angle = this.angle + (tan/10);
      
      child.updatePosition();
      galaxies.utils.conify( child.object );
    }
  }
  
  
}

galaxies.Obstacle.prototype.deactivate = function() {
  if ( this.passSound !== null ) { this.passSound.volume = 0; }
  this.state = 'inactive';
  this.remove();
}

galaxies.Obstacle.prototype.remove = function() {
  galaxies.engine.planeSweep.remove(this);

  if ( this.object.parent!=null) {
    this.object.parent.remove(this.object);
  }
}

// Clear this object, so it will be garbage collected.
galaxies.Obstacle.prototype.destruct = function() {
  if ( this.passSound !== null ) { this.passSound.volume = 0; }
  this.remove();
}




/**
 * ICE ASTEROID
 */
galaxies.ObstacleIce = function () {
  var props = {};
  props.type = 'asteroidice';
  props.points = [25, 50, 100, 250];
  props.shakeAmount = 0.6;
  props.baseSpeed = 0.25;
  props.mass = 2;
  props.baseLife = 2;
  
  galaxies.Obstacle.call(this, props);
}
galaxies.ObstacleIce.prototype = Object.create( galaxies.Obstacle.prototype );
galaxies.ObstacleIce.prototype.constructor = galaxies.ObstacleIce;
galaxies.ObstacleIce.prototype.initModel = function() {
  var material = galaxies.resources.materials['asteroid'].clone();
  this.object = new THREE.Mesh( galaxies.resources.geometries['asteroid'], material );
  this.object.scale.set( 0.40, 0.40, 0.40 );
  
  this.ice = new THREE.Mesh( new THREE.DodecahedronGeometry( 1.2 ),
                            galaxies.resources.materials['asteroidice'] );
  this.object.add( this.ice );
}
galaxies.ObstacleIce.prototype.hit = function( hitPosition, damage, multiply, forceDestroy ) {
  // parent object's hit
  galaxies.Obstacle.prototype.hit.call( this, hitPosition, damage, multiply, forceDestroy );
  
  // Lose the ice shell
  if ( this.life === 1 ) {
    this.object.remove( this.ice );
    
    var c = Math.cos(this.angle);
    var s = Math.sin(this.angle);
    var velocity = new THREE.Vector3( c * this.velocityRadial - s * this.velocityTangential,
                                      s * this.velocityRadial + c * this.velocityTangential,
                                      1 );
    galaxies.fx.showRubble( 'ice', this.object.position, velocity );
  }
}
galaxies.ObstacleIce.prototype.reset = function() {
  galaxies.Obstacle.prototype.reset.call( this );
  this.object.add( this.ice );
}

/**
 * COMET
 */
galaxies.ObstacleComet = function() {
  var props = {};
  props.type = 'comet';
  props.baseLife = 1;
  props.baseSpeed = 1.5;//1.2;
  props.spiral = 0.85;
  props.points = [200, 400, 750, 1500];
  props.shakeAmount = 1.6;
  props.tumbling = false;
  props.orient = false;
  props.rubbleType = '';
  props.passSoundId = 'cometloop';
  
  props.explodeSound = 'cometexplode';
  props.explosionGain = 7;
  
  galaxies.Obstacle.call( this, props );
}
galaxies.ObstacleComet.prototype = Object.create( galaxies.Obstacle.prototype );
galaxies.ObstacleComet.prototype.constructor = galaxies.ObstacleComet;
galaxies.ObstacleComet.prototype.initModel = function() {
  var texture = new THREE.Texture( galaxies.queue.getResult('starparticle') );
  texture.needsUpdate = true;

  // solid core (for when particles are thin at edge of screen )
  var mat = new THREE.SpriteMaterial( { map: texture, color: 0xffffff, fog: true, blending: THREE.AdditiveBlending } );
  this.object = new THREE.Sprite( mat );
  this.object.up.set(0, 0, 1);
}
galaxies.ObstacleComet.prototype.remove = function () {
  galaxies.Obstacle.prototype.remove.call(this);

  if (this.particleEmitter) {
    this.particleEmitter.disable();
    this.particleEmitter.group.releaseIntoPool(this.particleEmitter);
    this.particleEmitter = null;
  }
};
galaxies.ObstacleComet.prototype.reset = function () {
  galaxies.Obstacle.prototype.reset.call(this);

  this.particleEmitter = galaxies.fx.getComet();
  this.particleEmitter.enable();
};
galaxies.ObstacleComet.prototype.update = function(delta) {
  var scaledDelta = delta * 2,
      prevPosition = this.object.position.clone();

  galaxies.Obstacle.prototype.update.call( this, scaledDelta );

  this.object.lookAt(prevPosition.sub(this.object.position).multiplyScalar(-1).add(this.object.position));

  if (this.particleEmitter) {
    this.particleEmitter.position.value = this.object.position;
    this.particleEmitter.rotation.value = this.object.rotation;
  }

  if (this.state === 'falling') {
    this.velocityRadial += scaledDelta * this.age / 10;

    this.radius = Math.max(this.radius, galaxies.engine.PLANET_RADIUS + this.hitThreshold + 0.1);

    if (this.age > 2 && this.radius > galaxies.engine.OBSTACLE_VISIBLE_RADIUS) {
      this.passSound.volume = Math.max(this.passSound.volume - scaledDelta, 0);

      if (this.passSound.volume === 0) {
        this.deactivate();
      }
    }
  }
}
galaxies.ObstacleComet.prototype.splode = function() {
  galaxies.Obstacle.prototype.splode.call( this, false );
  
  galaxies.fx.showFireworks( this.object.position );
  
  // hit all obstacles within range of explosion
  var range = 5;
  for ( var i=0, len=galaxies.engine.obstacles.length; i<len; i++ ) {
    var obs = galaxies.engine.obstacles[i];
    if ( obs === this ) { continue; }
    var relativePosition = new THREE.Vector3();
    relativePosition.subVectors( obs.object.position, this.object.position );
    relativePosition.z = 0;
    if ( relativePosition.length() < range ) {
      obs.hit( this.object.position, 2, 2 );
    }
  }

  var worldPos = this.object.localToWorld(new THREE.Vector3()),
      edgePos = this.object.position.clone().normalize().setZ(0).multiplyScalar(range).add(this.object.position);

  galaxies.fx.showWarpBubble(worldPos, edgePos);
}

/**
 * RADIOACTIVE ROID, spawns three babies
 */
galaxies.ObstacleRad = function() {
  var props = {};
  props.type = 'asteroidrad';
  props.baseLife = 2;
  props.baseSpeed = 0.2;
  props.points = [50, 75, 150, 500];
  props.shakeAmount = 1.2;
  props.hitThreshold = 0.9;
  props.rubbleType = 'rad';
  this.spawnType = 'asteroidradchild';
  this.spawnNumber = 3;
  
  galaxies.Obstacle.call( this, props );
  
}
galaxies.ObstacleRad.prototype = Object.create( galaxies.Obstacle.prototype );
galaxies.ObstacleRad.prototype.constructor = galaxies.ObstacleRad;
galaxies.ObstacleRad.prototype.initModel = function() {
  this.object = new THREE.Mesh( galaxies.resources.geometries['asteroid'], galaxies.resources.materials['asteroidrad'] );
  this.object.scale.set( 0.5, 0.5, 0.5 );
  
  galaxies.fx.addGlowbject( this.object, 0x00ff00 );
  
}

/**
 * SON OF RADIOACTIVE ROID
 */
galaxies.ObstacleRadChild = function() {
  var props = {};
  props.type = 'asteroidradchild';
  props.baseLife = 1;
  props.baseSpeed = 0.4;
  props.points = [50, 75, 150, 500];
  props.hitThreshold = 0.5;
  props.rubbleType = 'rad';
  
  galaxies.Obstacle.call( this, props );
}
galaxies.ObstacleRadChild.prototype = Object.create( galaxies.Obstacle.prototype );
galaxies.ObstacleRadChild.prototype.constructor = galaxies.ObstacleRadChild;
galaxies.ObstacleRadChild.prototype.initModel = function() {
  this.object = new THREE.Mesh( galaxies.resources.geometries['asteroid'], galaxies.resources.materials['asteroidrad'] );
  this.object.scale.set( 0.3, 0.3, 0.3 );
      
  galaxies.fx.addGlowbject( this.object, 0x00ff00 );
  
}


galaxies.ObstacleSpiky = function () {
  var props = {};

  props.type = 'asteroidmetal';
  props.hitThreshold = 0.6;
  props.points = [100, 150, 300, 800];
  props.shakeAmount = 1.4;
  props.updateTumbleAxisOnHit = true;
  props.baseTumbleSpeed = 0.8;
  props.spiral = 0.75;
  props.baseSpeed = 0.5;
  props.mass = 3;
  props.baseLife = 4;
  props.hitSound = 'metalhit';
  props.rubbleType = '';
  props.explodeSound = 'satellitesplode';

  galaxies.Obstacle.call(this, props);
};

galaxies.ObstacleSpiky.prototype = Object.create( galaxies.Obstacle.prototype );
galaxies.ObstacleSpiky.prototype.constructor = galaxies.ObstacleSpiky;
galaxies.ObstacleSpiky.prototype.initModel = function() {
  this.object = new THREE.Mesh(galaxies.resources.geometries['spiky'], galaxies.resources.materials['spiky'].clone());
  this.object.scale.set(0.4, 0.4, 0.4);
};

galaxies.ObstacleSpiky.prototype.hit = function( hitPosition, damage, multiply, forceDestroy ) {
  // parent object's hit
  galaxies.Obstacle.prototype.hit.call( this, hitPosition, 1, multiply, forceDestroy );

  var emissiveColor;

  switch (this.life) {
    case 3:
        emissiveColor = 0x00FF00;
      break;
    case 2:
        emissiveColor = 0xFFFF00;
      break;
    case 1:
        emissiveColor = 0xFF0000;
      break;
  }

  this.baseSpeed *= 2;
  this.maxVelocityRadial = this.baseSpeed * (1-this.spiral);
  this.velocityTangential = this.baseSpeed * this.spiral;

  this.object.material.emissive.setHex(emissiveColor);
};

galaxies.ObstacleSpiky.prototype.reset = function () {
  this.baseSpeed = 0.5;

  galaxies.Obstacle.prototype.reset.call(this);
};

galaxies.ObstacleSpiky.prototype.splode = function () {
  galaxies.Obstacle.prototype.splode.call(this);

  galaxies.fx.showBlueExplosion(this.object.position);
};

galaxies.MiniUFO = function () {
  var props = {
    type: "miniUFO",
    hitThreshold: 0.4,
    tumbling: false,
    orient: false,
    spiral: 0.7,
    baseSpeed: 0.4,
    hitSound: "ufohit",
    rubbleType: "debris",
    shakeAmount: 1.5
  };

  this.onLaserHit = this.onLaserHit.bind(this);

  galaxies.Obstacle.call(this, props);

  this.initParticles();
};

galaxies.MiniUFO.prototype = Object.create(galaxies.Obstacle.prototype);
galaxies.MiniUFO.constructor = galaxies.MiniUFO;

galaxies.MiniUFO.prototype.initModel = function () {
  this.object = galaxies.resources.geometries['ufo'].clone();
  this.object.children[0].material = galaxies.resources.materials['ufo'].clone();
  this.object.children[1].material = galaxies.resources.materials['ufocanopy'].clone();

  this.object.scale.set(0.35, 0.35, 0.35);
};

galaxies.MiniUFO.prototype.initParticles = function () {
  var texture = new THREE.Texture(galaxies.queue.getResult("starparticle"));

  texture.needsUpdate = true;

  this.laserChargeEmitter = new SPE.Emitter({
    type: SPE.distributions.SPHERE,
    particleCount: 50,
    direction: -1,
    duration: 0.4,
    maxAge: {value: 0.6, spread: 0.4},
    position: {radius: 0.1},
    velocity: {value: new THREE.Vector3(2, 0, 0)},
    drag: {value: 0.5},
    color: {value: [new THREE.Color(0.8, 1, 0.8), new THREE.Color(0.3, 0.7, 0.3)]},
    opacity: {value: [1, 0]},
    size: {value: [0.5, 1]}
  });

  this.laserChargeGroup = new SPE.Group({
    texture: {value: texture},
    blending: THREE.AdditiveBlending,
    transparent: true,
    maxParticleCount: 100
  });

  this.laserChargeGroup.addEmitter(this.laserChargeEmitter);
  this.laserChargeGroup.mesh.position.setY(-0.8);

  this.laserChargeEmitter.disable();

  this.object.add(this.laserChargeGroup.mesh);
};

galaxies.MiniUFO.prototype.onLaserHit = function (didHitPlayer) {
  ++this.shotsFired;

  if (didHitPlayer) {
    ++this.shotsHit;
  }
};

galaxies.MiniUFO.prototype.reset = function () {
  galaxies.Obstacle.prototype.reset.call(this);

  this.timeToNextShot = 4;
  this.angleOffset = Math.PI / 2;
  this.shotsFired = 0;
  this.shotsHit = 0;
};

galaxies.MiniUFO.prototype.splode = function( spawn ) {
  galaxies.Obstacle.prototype.splode.call(this, spawn);

  galaxies.fx.explode(this.object.position);
};

galaxies.MiniUFO.prototype.update = function (delta) {
  galaxies.Obstacle.prototype.update.call(this, delta);

  //this.object.rotation.set(Math.PI, galaxies.engine.CONE_ANGLE * 3, -Math.PI/2);
  this.object.rotation.set(0, Math.PI, 0);
  this.object.rotateOnAxis(new THREE.Vector3(0, 0, -1), this.angle - this.angleOffset);
  this.object.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 6);

  this.laserChargeGroup.tick(delta);

  if (this.state === "falling") {
    this.timeToNextShot -= delta;

    if (this.timeToNextShot <= 0) {
      if (this.timeToNextShot + delta > 0) {
        this.laserChargeEmitter.enable();
      }

      if (this.timeToNextShot <= -1) {
        var laserBullet = galaxies.engine.getLaserBullet(),
            position = this.object.position.clone(),
            destinationAngle = Math.random() * 2 * Math.PI,
            destinationPoint = new THREE.Vector3(Math.cos(destinationAngle), Math.sin(destinationAngle), 0)
                .multiplyScalar(galaxies.engine.PLANET_RADIUS * 0.9),
            direction = position.clone().multiplyScalar(-1).normalize();

        position.add(direction.clone());

        direction = destinationPoint.sub(position).normalize();

        laserBullet.addToScene(position, direction);

        laserBullet.addImpactCallback(this.onLaserHit);

        new galaxies.audio.PositionedSound({
          source: galaxies.audio.getSound('ufoshoot'),
          position: this.object.position,
          baseVolume: 1.5,
          loop: false
        });

        this.timeToNextShot += 4;
      }
    }

    if (this.radius < galaxies.engine.PLANET_DISTANCE + galaxies.engine.CHARACTER_HEIGHT * 0.15 ||
        this.shotsFired > 1 || this.shotsHit > 0) {
      this.state = "retreating";
      this.maxVelocityRadial *= 3;
    }
  }

  if (this.state === "retreating") {
    this.angleOffset = Math.min(this.angleOffset + delta * Math.PI / 6, Math.PI * 0.95);
    this.velocityRadial = Math.min(this.velocityRadial + 2 * (this.angleOffset - 1) * delta,
        this.maxVelocityRadial * galaxies.engine.speedScale);

    this.radius += this.velocityRadial * delta;

    if (this.radius > galaxies.engine.OBSTACLE_VISIBLE_RADIUS) {
      this.deactivate();
    }
  }

};


/// Factory function for creating standard obstacles.
galaxies.Obstacle.create = function( type ) {
 
  switch(type) {

    case 'comet':
      return new galaxies.ObstacleComet();
      break;
    case 'asteroidmetal':
      return new galaxies.ObstacleSpiky();
    case 'asteroidice':
      return new galaxies.ObstacleIce();
      break;
    case 'asteroidrad':
      return new galaxies.ObstacleRad();
      break;
    case 'asteroidradchild':
      return new galaxies.ObstacleRadChild();
      break;
    case 'miniUFO':
      return new galaxies.MiniUFO();
      break;
    case 'asteroid':
    default:
      return new galaxies.Obstacle();
      break;
      
  }
}
