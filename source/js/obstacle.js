"use strict";
/**
 * Obstacle: the object responsible for asteroids, satellites (pods),
 * and comets.
 *
 */

this.galaxies = this.galaxies || {};


galaxies.Obstacle = function ( props ) {

  this.type = props.type;
  
  var PLANET_DISTANCE = 1.25;
  var RICOCHET_SPEED = 0.35;
  this.hitThreshold = 1.0;
  if ( typeof(props.hitThreshold) === 'number' ) { this.hitThreshold = props.hitThreshold; }
  
  this.particleGroup = props.particleGroup;
  this.points = props.points;
  this.explodeType = props.explodeType;
  
  this.angle = 0;
  this.radius = 0;
  
  var tumble = props.tumble;
  var tumbling = tumble;
  var tumbleAxis = new THREE.Vector3();
  var tumbleOnHit = props.tumbleOnHit;
  var baseTumbleSpeed = 1.5;
  var tumbleSpeed = baseTumbleSpeed;
  
  var spiral = props.spiral;
  var baseSpeed = props.speed;
  this.velocityRadial = 0;
  var maxVelocityRadial = baseSpeed * (1-spiral);
  this.velocityTangential = baseSpeed * spiral;
  var gravity = -0.5;
  
  this.mass = 1;
  
  var fallTimer = 0;
  var fallTime = 0;
  
  this.ricochetCount = 1;
  
  if ( typeof(props.life)!=='number' ) { props.life = 2; }
  this.baseLife = props.life;
  this.life = props.life;
  
  // state values: waiting, falling, ricocheting, inactive
  this.state = 'waiting';
  this.isActive = false; // will the object accept interactions
  
  this.object = props.anchor;
  this.object.up.set(0,0,1);
  
  this.orient = props.orient;
  this.model = props.model;
  
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
  //
  
  this.spawnType = props.spawnType;
  this.spawnNumber = props.spawnNumber;
  
  //var axisHelper = new THREE.AxisHelper( 2 );
  //this.object.add( axisHelper );  
  
  // Sound
  var hitSound = props.hitSound;
  var explodeSound = props.explodeSound;
  this.passSound = null;
  if ( props.passSound != null ) {
    //console.log(_passSoundId);
    this.passSound = new galaxies.audio.ObjectSound( galaxies.audio.getSound( props.passSound), this.object, 0, true );
    //directionalSources.push(passSound);
  }
  if ( typeof( props.explosionGain ) !=='number' ) { props.explosionGain = 2; }
  var explosionGain = props.explosionGain;
  
  var clearDistance = galaxies.engine.OBSTACLE_VISIBLE_RADIUS * 1.0;//1.2;
  var startDistance = galaxies.engine.OBSTACLE_VISIBLE_RADIUS * 1.1;//1.2;
/*  if (this.passSound != null ) {
    startDistance = galaxies.engine.OBSTACLE_VISIBLE_RADIUS * 2;
  }*/

  
  
  
  
  
  
  // fix reset/tick order problem
  // tweak pattern density
  // add comets
  
  this.setAngle = function( newAngle ) {
    this.angle = newAngle;
    this.updatePosition();
  }
  
  this.updatePosition = function() {
    this.object.position.setX( Math.cos(this.angle) );
    this.object.position.setY( Math.sin(this.angle) );
    this.object.position.multiplyScalar( this.radius );
  }
  
  
  this.reset = function() {
    this.angle = Math.random()*Math.PI*2;
    this.radius = startDistance;
    var position = new THREE.Vector3( Math.cos(this.angle), Math.sin(this.angle), 0 );
    position.multiplyScalar( this.radius );
    
    this.object.position.copy(position);
    this.object.lookAt( new THREE.Vector3() );
    
    if ( material !== null) {
      material.transparent = false;
    }
    
    this.life = this.baseLife;
    
    this.state = 'waiting';
    this.isActive = false;
    //fallTime = Math.random() * 3; // random delay to make obstacles arrive less uniformly
    fallTime = 0;
    fallTimer = 0;
    
    this.velocityRadial = 0;
    this.velocityTangential = baseSpeed * spiral;
    
    tumbleAxis.set( Math.random()*2-1, Math.random()*2 -1, Math.random()*2 -1 );
    tumbleAxis.normalize();
    tumbling = tumble;
    tumbleSpeed = baseTumbleSpeed;
    
    
    //console.log( this.type, spiral, this.velocityTangential );
  
    
    //this.ricochet = false;
  }
    
  this.update = function( delta ) {
    switch ( this.state ) {
    case 'retreating':
      this.angle += this.velocityTangential * delta/this.radius;
      this.radius += this.velocityRadial * delta;
      this.updatePosition();
      break;
    case 'ricocheting':
      this.angle += this.velocityTangential * delta/this.radius;
      this.radius += this.velocityRadial * delta;
      this.updatePosition();
      
      // Prevent ricochets from traveling all the way out, so
      // the player cannot score points off-screen
      if ( this.radius > clearDistance ) { this.deactivate(); }
      if ( this.isActive && (this.radius > galaxies.engine.OBSTACLE_VISIBLE_RADIUS ) ) {
        this.isActive = false;
        if ( material!=null ) {
          material.transparent = true;
        }
      }
      break;
    case 'falling':
      // accelerate and cap at prescribed obstacle speed
      this.velocityRadial += gravity * delta;
      this.velocityRadial = Math.max( -maxVelocityRadial * galaxies.engine.speedScale, this.velocityRadial );
      
      this.angle += this.velocityTangential * delta/this.radius;
      this.radius += this.velocityRadial * delta;
      this.updatePosition();
      
      if (( this.radius <= PLANET_DISTANCE )) {
        // This order is very important as hitPlayer may trigger game over which
        // must override the obstacle's state.
        this.splode( false );
        galaxies.engine.hitPlayer();
        break;
      }
      if ( this.radius < galaxies.engine.OBSTACLE_VISIBLE_RADIUS ) { this.isActive = true; }
      
      
      // idle sound level
      if ( this.passSound !== null ) {
        this.passSound.update( delta );
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
      */
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
        break;
      } // switch
    }
    
    if ( tumbling ) {
      this.object.rotateOnAxis( tumbleAxis, tumbleSpeed * delta );
    } else if ( this.orient ) {
      this.object.lookAt( galaxies.engine.rootObject.position );
    }
    
    if ( this.particleGroup != null ) {
      this.particleGroup.tick(delta);
    }
    galaxies.utils.conify( this.object );
    
  } 
  
  this.removePassSound = function() {
    if ( this.passSound !== null ) {
      this.passSound.sound.source.stop(0); // API does not require an argument, but Safari 8 does.
      //removeSource( this.passSound );
      this.passSound = null;
    }
  }
  
  // Reverse course, no more interactions, the day is won
  this.retreat = function() {
    this.isActive = false;
    this.state = 'retreating';
    
    this.velocityRadial = ( 3 * RICOCHET_SPEED * galaxies.engine.speedScale );
    
    if (tumbleOnHit) { tumbling = true; }
    
    // silence!
    this.removePassSound();
    
  }
  
  this.hit = function( hitPosition, multiply, forceDestroy ) {
    this.life--;
    
    if (typeof(multiply)!=='number') { multiply = 1; }
    
    this.velocityRadial = galaxies.Projectile.prototype.PROJECTILE_SPEED * 0.20;
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
    tumbleSpeed += (baseTumbleSpeed * angularAmount);
    
    if ( forceDestroy || (this.life <=0 ) ) {
      galaxies.engine.showCombo( this.points, multiply, this.object );
      this.splode();
      return;
    }
    
    new galaxies.audio.PositionedSound({
      source: galaxies.audio.getSound(hitSound),
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
  
  this.splode = function( spawn ) {
    if ( typeof(spawn)!=='boolean') {
      spawn = true;
    }
    
    new galaxies.audio.PositionedSound({
      source: galaxies.audio.getSound(explodeSound),
      position: galaxies.utils.rootPosition(this.object),
      baseVolume: explosionGain,
      loop: false
    });
    
    galaxies.fx.shakeCamera(0.5);
    
    switch ( this.explodeType) {
      case 'fireworks':
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

        
        
        break;
      case 'debris':
        var c = Math.cos(this.angle);
        var s = Math.sin(this.angle);
        var velocity = new THREE.Vector3( c * this.velocityRadial - s * this.velocityTangential,
                                          s * this.velocityRadial + c * this.velocityTangential,
                                          0 );
        galaxies.fx.showDebris( this.object.position, velocity );
        break;
      case 'rubble':
      default:
        var c = Math.cos(this.angle);
        var s = Math.sin(this.angle);
        var velocity = new THREE.Vector3( c * this.velocityRadial - s * this.velocityTangential,
                                          s * this.velocityRadial + c * this.velocityTangential,
                                          0 );
        galaxies.fx.showRubble( this.object.position, velocity );
    }
    
    if ( spawn ) {
      for (var i=0; i<this.spawnNumber; i++ ) {
        var child = galaxies.engine.addObstacle( this.spawnType );
        
        child.radius = this.radius + THREE.Math.randFloatSpread( this.hitThreshold * galaxies.engine.CONE_SLOPE );
        //child.radius = this.radius;
  
        // Create range of velocities from -baseSpeed to +baseSpeed scaled by a constant.
        var tan = this.velocityTangential + ((2 * i/(this.spawnNumber-1))-1) * (baseSpeed * 4);
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
    
    
    this.deactivate();
  }
  
  this.deactivate = function() {
    if ( this.passSound !== null ) { this.passSound.volume = 0; }
    this.state = 'inactive';
    this.remove();
    //this.resetPosition();
  }
  
  this.remove = function() {
    if ( this.object.parent!=null) {
      this.object.parent.remove(this.object);
    }
  }
  
  // Clear this object, so it will be garbage collected.
  this.destruct = function() {
    this.removePassSound();
    this.remove();
  }
  
  this.reset();
  
}

/// Factory function for creating standard obstacles.
galaxies.Obstacle.create = function( type ) {
  var props = {};
  props.speed = 0.2;
  props.tumble = false;
  props.tumbleOnHit = true;
  props.spiral = 0;
  props.points = 100;
  props.hitSound = 'asteroidhit';
  props.explodeSound = 'asteroidsplode';
  props.passSound = null;
  props.orient = false;
  props.explodeType = 'rubble';
  props.type = type;
  props.spawnType = '';
  props.spawnNumber = 0;
  
  switch(type) {
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
      
      break;
    case 'comet':
      props.speed = 1.2;
      props.spiral = 0.8;
      props.points = 500;
      props.orient = true;
      props.tumbleOnHit = false;
      props.explodeType = 'fireworks';
      
      props.explodeSound = 'cometexplode';
      props.explosionGain = 7;
      
      var emitterSettings = {
        type: 'cube',
        positionSpread: new THREE.Vector3(0.6, 0.6, 0.6),
        velocity: new THREE.Vector3(0, 0, -5),
        velocitySpread: new THREE.Vector3(0.2, 0.2, 2),
        sizeStart: 6,
        sizeStartSpread: 4,
        sizeEnd: 2,
        opacityStart: 0.8,
        opacityEnd: 0.1,
        colorStart: new THREE.Color("rgb(6, 6, 20)"),
        colorEnd: new THREE.Color("rgb(255, 77, 0)"),
        particlesPerSecond: 10,
        particleCount: 200,
        alive: 1.0,
        duration: null
      };
      
      var texture = new THREE.Texture( galaxies.queue.getResult('starparticle') );
      texture.needsUpdate = true;
      var particleGroup = new SPE.Group({
        texture: texture,
        maxAge: 1.5,
        blending: THREE.AdditiveBlending//THREE.AdditiveBlending
      });
      particleGroup.addEmitter( new SPE.Emitter( emitterSettings) );
      props.particleGroup = particleGroup;
      props.anchor = particleGroup.mesh;
      
      // solid core (for when particles are thin at edge of screen )
      var mat = new THREE.SpriteMaterial( { map: texture, color: 0xffffff, fog: true, blending: THREE.AdditiveBlending } );
      var core = new THREE.Sprite( mat );
      props.anchor.add( core );
      
      break;
    
    case 'asteroidmetal':
      props.life = 2;
      props.speed = 0.18;
      props.tumble = true;
      props.points = 100;
      props.hitThreshold = 0.6;
      props.hitSound = 'asteroidhit';
      props.explodeSound = 'asteroidsplode';
      var material = new THREE.MeshPhongMaterial();
      material.setValues( galaxies.resources.materials['asteroidmetal'] );
      props.model = new THREE.Mesh( galaxies.resources.geometries['asteroid'], material );
      props.model.scale.set( 0.40, 0.40, 0.40 );
      props.anchor = props.model; // no container object in this case
      break;
    case 'asteroidrad':
      props.life = 3;
      props.speed = 0.08;
      props.tumble = true;
      props.points = 100;
      props.hitThreshold = 0.9;
      props.hitSound = 'asteroidhit';
      props.explodeSound = 'asteroidsplode';
      var material = new THREE.MeshPhongMaterial();
      material.setValues( galaxies.resources.materials['asteroidrad'] );
      props.model = new THREE.Mesh( galaxies.resources.geometries['asteroid'], material );
      props.model.scale.set( 0.5, 0.5, 0.5 );
      props.anchor = props.model; // no container object in this case
      
      props.spawnType = 'asteroidradchild';
      props.spawnNumber = 3;
      break;
    case 'asteroidradchild':
      props.life = 1;
      props.speed = 0.15;
      props.tumble = true;
      props.points = 50;
      props.hitThreshold = 0.5;
      props.hitSound = 'asteroidhit';
      props.explodeSound = 'asteroidsplode';
      var material = new THREE.MeshPhongMaterial();
      material.setValues( galaxies.resources.materials['asteroidrad'] );
      props.model = new THREE.Mesh( galaxies.resources.geometries['asteroid'], material );
      props.model.scale.set( 0.3, 0.3, 0.3 );
      props.anchor = props.model; // no container object in this case
      
      break;
    case 'asteroid':
    default:
      props.life = 1;
      props.speed = 0.20;
      props.tumble = true;
      props.points = 100;
      props.hitThreshold = 0.6;
      props.hitSound = 'asteroidhit';
      props.explodeSound = 'asteroidsplode';
      
      var material = new THREE.MeshPhongMaterial();
      material.setValues( galaxies.resources.materials['asteroid'] );
      props.model = new THREE.Mesh( galaxies.resources.geometries['asteroid'], material );
      props.model.scale.set( 0.375, 0.375, 0.375 );
      props.anchor = props.model; // no container object in this case
      
      break;
      
  }
  return (new galaxies.Obstacle(props));
}
