"use strict";
/**
 * Obstacle: the object responsible for asteroids, satellites (pods),
 * and comets.
 *
 */

this.galaxies = this.galaxies || {};


/// Rename this 'Obstacle'
galaxies.Obstacle = function ( props ) {
  var PLANET_DISTANCE = 1.25;
  var RICOCHET_SPEED = 0.35;
  
  this.type = props.type;
  
  this.particleGroup = props.particleGroup;
  this.points = props.points;
  this.explodeType = props.explodeType;
  
  var angle = 0;
  //var angularSpeed = this.speed/radius;
  
  var tumble = props.tumble;
  var tumbling = tumble;
  var tumbleAxis = new THREE.Vector3();
  var tumbleOnHit = props.tumbleOnHit;
  var baseTumbleSpeed = 1.5;
  var tumbleSpeed = baseTumbleSpeed;
  
  var baseSpeed = props.speed;
  var velocity = new THREE.Vector3();
  
  //this.falling = false;
  var fallSpeed = 8;
  var fallTimer = 0;
  var fallTime = 0;
  var spiralTime = props.spiral * 60 + 1;
  
  //this.ricochet = false;
  this.ricochetCount = 0;
  
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
  
  var clearDistance = galaxies.engine.OBSTACLE_VISIBLE_RADIUS * 1.2;
  var startDistance = galaxies.engine.OBSTACLE_VISIBLE_RADIUS * 1.2;
  if (this.passSound != null ) {
    startDistance = galaxies.engine.OBSTACLE_VISIBLE_RADIUS * 2;
  }
  
  this.reset = function() {
    angle = Math.random()*Math.PI*2;
    var position = new THREE.Vector3( Math.cos(angle), Math.sin(angle), 0 );
    
    position.multiplyScalar( startDistance );
    this.object.position.copy(position);
    this.object.lookAt( new THREE.Vector3() );
    
    if ( material !== null) {
      material.transparent = false;
    }
    
    this.state = 'waiting';
    this.isActive = false;
    fallTime = Math.random() * 3; // random delay to make obstacles arrive less uniformly
    fallTimer = 0;
    velocity.set(0,0,0);

    this.speed = baseSpeed * galaxies.engine.speedScale;
    
    tumbleAxis.set( Math.random()*2-1, Math.random()*2 -1, Math.random()*2 -1 );
    tumbleAxis.normalize();
    tumbling = tumble;
    tumbleSpeed = baseTumbleSpeed;
    
    //this.ricochet = false;
  }
    
  this.update = function( delta ) {
    switch ( this.state ) {
    case 'retreating':
      this.object.position.add( velocity.clone().multiplyScalar(delta) );
      break;
    case 'ricocheting':
      this.object.position.add( velocity.clone().multiplyScalar(delta) );
      
      // Prevent ricochets from traveling all the way out, so
      // the player cannot score points off-screen
      var radius = galaxies.utils.flatLength( this.object.position );
      if ( radius > clearDistance ) { this.deactivate(); }
      if ( this.isActive && (radius > galaxies.engine.OBSTACLE_VISIBLE_RADIUS ) ) {
        this.isActive = false;
        if ( material!=null ) {
          material.transparent = true;
        }
      }
      break;
    case 'falling':
      // fall motion
      var targetAngle = Math.atan2( -this.object.position.y, -this.object.position.x );
      angle = targetAngle - (Math.PI/2);
      //while ( targetAngle<angle) { targetAngle += (Math.PI * 2); }
      
      // Time-based spiral
      fallTimer+=delta;
      fallTimer = THREE.Math.clamp( fallTimer, 0, spiralTime);
      var fallAngle = THREE.Math.mapLinear(fallTimer, 0, spiralTime, angle, targetAngle );
      
      /*
      // Distance-based spiral
      var distance = this.object.position.length();
      distance = THREE.Math.clamp( distance, 0, radius );
      //var fallAngle = THREE.Math.mapLinear( radius-distance, 0, radius, angle, targetAngle );
      var fallAngle = angle;
      */
      
//      angle = angle + ( targetAngle - angle )*delta;
      
      velocity.set( Math.cos(fallAngle), Math.sin(fallAngle), 0 );
      velocity.multiplyScalar( this.speed * delta );
      
      var radius = galaxies.utils.flatLength( this.object.position );
      if (( radius <= PLANET_DISTANCE ) && (velocity.length() < PLANET_DISTANCE) ) {
        // This order is very important as hitPlayer may trigger game over which
        // must override the obstacle's state.
        this.splode();
        galaxies.engine.hitPlayer();
        break;
      }
      if ( radius < galaxies.engine.OBSTACLE_VISIBLE_RADIUS ) { this.isActive = true; }
      this.object.position.add( velocity );
      
      /*
      // clamp vertical position
      if ( this.object.position.y < -OBSTACLE_START_RADIUS ) { this.object.position.setY( -OBSTACLE_START_RADIUS ); }
      if ( this.object.position.y > OBSTACLE_START_RADIUS ) { this.object.position.setY( OBSTACLE_START_RADIUS ); }
      */
      
      
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
        //this.falling = true;
        this.state = 'falling';
        
        galaxies.engine.rootObject.add( this.object );
        
        //velocity.set( -Math.sin(angle), Math.cos(angle) * radius );
        //angle = angle + (Math.PI/2);
        
        angle = angle + (Math.PI/2);
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
    
    velocity.copy( this.object.position );
    velocity.z = 0;
    velocity.setLength( 3 * RICOCHET_SPEED * galaxies.engine.speedScale );
    
    if (tumbleOnHit) { tumbling = true; }
    
    // silence!
    this.removePassSound();
    
  }
  
  this.hit = function( hitPosition, ricochet ) {
    //if ( this.ricochet ) {
    if ( this.passSound !== null ) {
      this.passSound.volume = 0;
    }
    
    if ( this.state === 'ricocheting' ) {
      galaxies.engine.showCombo( (this.ricochetCount * this.points), this.object );
      this.splode();
      return;
    }
    
    new galaxies.audio.PositionedSound({
      source: galaxies.audio.getSound(hitSound),
      position: galaxies.utils.rootPosition(this.object),
      baseVolume: 2,
      loop: false
    });
    this.state= 'ricocheting';
    
    //this.ricochet = true;
    
    if ( typeof(ricochet) === 'undefined' ) {
      this.ricochetCount = 1;
    } else {
      this.ricochetCount = ricochet+1;
    }
    
    if ( tumbleOnHit ) {
      tumbling = true;
      tumbleSpeed = baseTumbleSpeed * this.ricochetCount * 2.5;
    }
    
    //console.log( this.ricochetCount );
    
    velocity.copy( this.object.position );
    velocity.sub( hitPosition );
    velocity.z = 0;
    velocity.setLength( RICOCHET_SPEED * galaxies.engine.speedScale );
    //console.log(velocity);
  }
  
  this.splode = function() {
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
        break;
      case 'debris':
        galaxies.fx.showDebris( this.object.position, velocity );
        break;
      case 'rubble':
      default:
        galaxies.fx.showRubble( this.object.position, velocity );
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
