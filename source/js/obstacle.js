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
  this.points = 100;
  this.shakeAmount = 0.2;
  this.tumbling = true;
  this.orient = false;
  this.tumbleAxis = new THREE.Vector3();
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
  this.explosionGain = 2
  this.passSoundId = '';
  
  // Overrides
//  if ( props == null ) { props = {}; }
  for ( var propName in props ) {
    if ( this.hasOwnProperty( propName ) ) {
      this[propName] = props[propName];
    } else { console.log("Obstacle attempting to set unknown property.", propName); }
  }
  
  // derived values
  this.maxVelocityRadial = this.baseSpeed * (1-this.spiral);
  
  this.passSound = null;
  if ( this.passSoundId !== '' ) {
    this.passSound = new galaxies.audio.SimpleSound({
      source: galaxies.audio.getSound( this.passSoundId ),
      baseVolume: 1,
      loop: true,
    });
  }
  
  
  
  this.initModel();
  this.reset();

/*  
  // Iterate through provided model object to find the actual mesh and its material.
  // Only the first mesh/material is used.
  var material = null;
  var childrens = [];
  childrens.push(this.model);
  while ( childrens.length > 0 ) {
    var child = childrens.shift();
    if ( child==null ) { continue; }
    
    if ( child.material != null ) {
      material = child.material;
      break;
    }
    
    for ( var i=0, len = child.children.length; i<len; i++ ) {
      childrens.push( child.children[i] );
    }
  };
  //*/
  
}

galaxies.Obstacle.prototype.initModel = function() {
  //this.particleGroup = props.particleGroup;
  
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
  
  this.angle = Math.random()*Math.PI*2;
  this.radius = galaxies.engine.OBSTACLE_START_DISTANCE;
  this.updatePosition();
  
  this.object.lookAt( new THREE.Vector3() );
  
  /* // legacy feature from when obstacle could retreat without being destroyed
  if ( material !== null) {
    material.transparent = false;
  }*/
  
  this.life = this.baseLife;

  this.state = 'falling';
  
  this.isActive = false;
  
  this.velocityRadial = 0;
  this.velocityTangential = this.baseSpeed * this.spiral;
  
  this.tumbleAxis.set( Math.random()*2-1, Math.random()*2 -1, Math.random()*2 -1 );
  this.tumbleAxis.normalize();
  this.tumbleSpeed = this.baseTumbleSpeed;
  
  //console.log( this.type, spiral, this.velocityTangential );
  
  //this.ricochet = false;
  
  galaxies.engine.rootObject.add( this.object );
  //this.object.updateMatrixWorld ( true ); // ensure object position is set
}

galaxies.Obstacle.prototype.update = function( delta ) {
  
  this.angle += this.velocityTangential * delta/this.radius;
  this.radius += this.velocityRadial * delta;
  this.updatePosition();
  
  switch ( this.state ) {
  case 'retreating':
    break;
  case 'ricocheting':
    
    /*  // no more ricochet
    // Prevent ricochets from traveling all the way out, so
    // the player cannot score points off-screen
    if ( this.radius > clearDistance ) { this.deactivate(); }
    if ( this.isActive && (this.radius > galaxies.engine.OBSTACLE_VISIBLE_RADIUS ) ) {
      this.isActive = false;
      if ( material!=null ) {
        material.transparent = true;
      }
    }*/
    break;
  case 'falling':
    // accelerate and cap at prescribed obstacle speed
    this.velocityRadial += galaxies.engine.OBSTACLE_GRAVITY * delta;
    this.velocityRadial = Math.max( -this.maxVelocityRadial * galaxies.engine.speedScale, this.velocityRadial );
    
    if (( this.radius <= galaxies.engine.PLANET_DISTANCE )) {
      // This order is very important as hitPlayer may trigger game over which
      // must override the obstacle's state.
      this.splode( false );
      galaxies.engine.hitPlayer();
      break;
    }
    if ( this.radius < galaxies.engine.OBSTACLE_VISIBLE_RADIUS ) { this.isActive = true; }
    
    
    // idle sound level
    if ( this.passSound !== null ) {
      //this.passSound.update( delta ); // SimpleSound does not update
      var soundLevel = 2 - Math.abs(this.object.position.z - galaxies.engine.CAMERA_Z)/10;
      soundLevel = THREE.Math.clamp( soundLevel, 0, 2 );
      //console.log( soundLevel );
      this.passSound.volume = soundLevel;
    }
    //
    
    break;
  case 'waiting':
    /*
    // fixed orbit
    angle += delta * angularSpeed;
    
    var position = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0 );
    position.multiplyScalar( radius );
    this.object.position.copy( position );
    
    fallTimer+=delta;
    if (fallTimer >= fallTime ) {
      this.state = 'falling';
      
      galaxies.engine.rootObject.add( this.object );
      
      //velocity.set( -Math.sin(angle), Math.cos(angle) * radius );
      //angle = angle + (Math.PI/2);
      
      //this.angle = this.angle + (Math.PI/2);
      // Reusing timer variables for spiral, naughty!
      fallTime = 0;
      fallTimer = 0;
      break;*/
  } // switch

  if ( this.tumbling ) {
    this.object.rotateOnAxis( this.tumbleAxis, this.tumbleSpeed * delta );
  } else if ( this.orient ) {
    this.object.lookAt( galaxies.engine.rootObject.position );
  }
  
} 

galaxies.Obstacle.prototype.removePassSound = function() {
  if ( this.passSound !== null ) {
    //this.sound.source.stop(0); // API does not require an argument, but Safari 8 does.
    this.source.stop(0); // API does not require an argument, but Safari 8 does.
    this.passSound = null;
  }
}

// Reverse course, no more interactions, the day is won
galaxies.Obstacle.prototype.retreat = function() {
  this.isActive = false;
  this.state = 'retreating';
  
  this.velocityRadial = ( 3 * this.baseSpeed * galaxies.engine.speedScale );
  
  this.tumbling = true;
  
  // silence!
  this.removePassSound();
  
}

galaxies.Obstacle.prototype.hit = function( hitPosition, multiply, forceDestroy ) {
  if ( this.state === 'inactive' ) { return; }
  
  this.life--;
  
  if (typeof(multiply)!=='number') { multiply = 1; }
  
  this.velocityRadial = galaxies.Projectile.prototype.PROJECTILE_SPEED * 0.10;
  // update angular velocity based on hit position.
  var hitVector = this.object.position.clone();
  hitVector.sub( hitPosition );
  var hitDistance = hitVector.length();
  
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
    galaxies.engine.showCombo( this.points, multiply, this.object );
    this.splode();
    return;
  }
  
  new galaxies.audio.PositionedSound({
    source: galaxies.audio.getSound(this.hitSound),
    position: galaxies.utils.rootPosition(this.object),
    baseVolume: 2,
    loop: false
  });
  
  
  // Old ricochet system, currently disabled, probably can be removed
  //if ( this.life === 1 ) {
  /*
  if ( false ) {
    this.state = 'ricocheting';
    
    if ( typeof(ricochet) === 'number' ) {
      this.ricochetCount = ricochet+1;
    }
    
    if ( tumbleOnHit ) {
      tumbling = true;
      tumbleSpeed = baseTumbleSpeed * this.ricochetCount * 2.5;
    }
    
    //console.log( this.ricochetCount );
    var hitVector = this.object.position.clone();
    hitVector.sub( hitPosition );
    
    var flatPosition = this.object.position.clone();
    hitVector.z = 0;
    flatPosition.z = 0;
    
    // TODO - ricochet?
    //velocityRadial = -velocityRadial;
    //velocityRadial = Math.abs( RICOCHET_SPEED * galaxies.engine.speedScale * this.baseSpeed );
  }
  */
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
      //child.radius = this.radius;

      // Create range of velocities from -baseSpeed to +baseSpeed scaled by a constant.
      var tan = this.velocityTangential + ((2 * i/(this.spawnNumber-1))-1) * (this.baseSpeed * 4);
      child.velocityRadial = this.velocityRadial;
      child.velocityTangential = tan;
      child.angle = this.angle + (tan/10);
      
      //console.log( tan, child.angle );
      //child.angle = this.angle;
      
      child.updatePosition();
      galaxies.utils.conify( child.object );
      //offset.setLength( this.hitThreshold * galaxies.engine.CONE_SLOPE );
    }
  }
  
  
}

galaxies.Obstacle.prototype.deactivate = function() {
  if ( this.passSound !== null ) { this.passSound.volume = 0; }
  this.state = 'inactive';
  this.remove();
  //this.resetPosition();
}

galaxies.Obstacle.prototype.remove = function() {
  if ( this.object.parent!=null) {
    this.object.parent.remove(this.object);
  }
}

// Clear this object, so it will be garbage collected.
galaxies.Obstacle.prototype.destruct = function() {
  this.removePassSound();
  this.remove();
}




/**
 * ICE ASTEROID
 */
galaxies.ObstacleIce = function () {
  var props = {};
  props.type = 'asteroidice';
  props.points = 250;
  props.shakeAmount = 0.6;
  props.baseSpeed = 0.18;
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
galaxies.ObstacleIce.prototype.hit = function( hitPosition, multiply, forceDestroy ) {
  // parent object's hit
  galaxies.Obstacle.prototype.hit.call( this, hitPosition, multiply, forceDestroy );
  
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
  props.baseLife = 2;
  props.baseSpeed = 1.2;
  props.spiral = 0.8;
  props.points = 250;
  props.shakeAmount = 1.6;
  props.tumbling = false;
  props.orient = true;
  props.rubbleType = '';
  props.passSoundId = 'cometloop';
  
  props.explodeSound = 'cometexplode';
  props.explosionGain = 7;
  
  galaxies.Obstacle.call( this, props );
}
galaxies.ObstacleComet.prototype = Object.create( galaxies.Obstacle.prototype );
galaxies.ObstacleComet.prototype.constructor = galaxies.ObstacleComet;
galaxies.ObstacleComet.prototype.initModel = function() {
  var emitterSettings = {
    type: SPE.distributions.BOX,
    particleCount: 160,
    duration: null,
    maxAge: { value: 1.5 },
    position: { spread: new THREE.Vector3(0.6, 0.6, 0.6) },
    velocity: { value: new THREE.Vector3(0, 0, -5), 
                spread: new THREE.Vector3(0.2, 0.2, 2) },
    color: { value: [new THREE.Color("rgb(6, 6, 20)"), new THREE.Color("rgb(255, 77, 0)") ] },
    opacity: { value: [0.8, 0.1] },
    size: { value: [6, 2],
            spread: [4] }
  };
  
  var texture = new THREE.Texture( galaxies.queue.getResult('starparticle') );
  texture.needsUpdate = true;
  this.particleGroup = new SPE.Group({
    texture: { value: texture },
    blending: THREE.AdditiveBlending,
    transparent: true,
    alphaTest: 0,
    depthWrite: false
  });
  this.particleGroup.addEmitter( new SPE.Emitter( emitterSettings) );
  
  this.object = this.particleGroup.mesh;
  this.object.up.set(0,0,1);

  // solid core (for when particles are thin at edge of screen )
  var mat = new THREE.SpriteMaterial( { map: texture, color: 0xffffff, fog: true, blending: THREE.AdditiveBlending } );
  var core = new THREE.Sprite( mat );
  this.object.add( core );
}
galaxies.ObstacleComet.prototype.update = function(delta) {
  galaxies.Obstacle.prototype.update.call( this, delta );
  this.particleGroup.tick(delta);
}
galaxies.ObstacleComet.prototype.splode = function() {
  galaxies.Obstacle.prototype.splode.call( this, false );
  
  galaxies.fx.showFireworks( this.object.position );
  
  // hit all obstacles within range of explosion
  var range = 3;
  for ( var i=0, len=galaxies.engine.obstacles.length; i<len; i++ ) {
    var obs = galaxies.engine.obstacles[i];
    if ( obs === this ) { continue; }
    var relativePosition = new THREE.Vector3();
    relativePosition.subVectors( obs.object.position, this.object.position );
    relativePosition.z = 0;
    if ( relativePosition.length() < range ) {
      obs.hit( this.object.position, 2 );
    }
  }
  
  // add distortion sphere
  galaxies.fx.showDistortionCircle( this.object.position, range );
}

/**
 * RADIOACTIVE ROID, spawns three babies
 */
galaxies.ObstacleRad = function() {
  var props = {};
  props.type = 'asteroidrad';
  props.baseLife = 3;
  props.baseSpeed = 0.08;
  props.points = 500;
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
  props.baseSpeed = 0.15;
  props.points = 50;
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











/// Factory function for creating standard obstacles.
galaxies.Obstacle.create = function( type ) {
 
  switch(type) {
    /*
    case 'satellite':
      props.speed = 0.5;
      props.spiral = 0.7;
      props.points = 250;
      props.orient = true;
      props.explodeType = 'debris';
      props.hitSound = 'metalhit';
      props.explodeSound = 'satellitesplode';
      
      var material = new THREE.MeshPhongMaterial();
      material.setValues( galaxies.resources.materials['satellite'] );
      var model = new THREE.Mesh( galaxies.resources.geometries['satellite'], material );
      model.position.y = -2;
      model.rotation.y = Math.random() * galaxies.utils.PI_2; // random roll to show window
      
      var modelOrient = new THREE.Object3D(); // holder positioned at center of model and rotated to orient it.
      modelOrient.add(model);
      modelOrient.rotation.x = 1.3; // Face away from camera, but not completely aligned with cone surface
      modelOrient.rotation.z = 0.5; // Face direction of motion a little
      
      props.anchor = new THREE.Object3D(); // holder at center, z-axis faces forward, we made it!
      props.anchor.add(modelOrient);
      var satScale = 0.4;
      props.anchor.scale.set(satScale, satScale, satScale);
      
      props.model = modelOrient;
      
      break;*/
    case 'comet':
      return new galaxies.ObstacleComet();
      break;
    case 'asteroidmetal':
    case 'asteroidice':
      return new galaxies.ObstacleIce();
      break;
    case 'asteroidrad':
      return new galaxies.ObstacleRad();
      break;
    case 'asteroidradchild':
      return new galaxies.ObstacleRadChild();
      break;
    case 'asteroid':
    default:
      return new galaxies.Obstacle();
      break;
      
  }
}
