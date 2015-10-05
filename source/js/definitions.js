"use strict";

/// Rename this 'Obstacle'
function Asteroid( props ) {
  var PLANET_DISTANCE = 1.25;
  var RICOCHET_SPEED = 0.35;
  
  this.particleGroup = props.particleGroup;
  
  this.points = props.points;
  this.speed = props.speed * speedScale;
  this.orient = props.orient;
  
  this.explodeType = props.explodeType;
  
  var angle = 0;
  //var angularSpeed = this.speed/radius;
  
  var tumble = props.tumble;
  var tumbling = tumble;
  var tumbleAxis = new THREE.Vector3();
  var tumbleOnHit = props.tumbleOnHit;
  var baseTumbleSpeed = 1.5;
  var tumbleSpeed = baseTumbleSpeed;
  
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
  
  this.model = props.model;
  
  //var axisHelper = new THREE.AxisHelper( 2 );
  //this.object.add( axisHelper );  
  
  var material;
  if ( this.model != null ) {
    material = this.model.material;
  }
  
  /*
  var geometry = _geometry;
  if ( typeof(_geometry)==='undefined' ) {
    geometry = new THREE.BoxGeometry( 0.7, 0.7, 0.7 );
  }
  
  // Ghetto color difference between objects (didn't want to pass in another parameter)
  var objectColor = new THREE.Color( this.points/500, this.points/500, this.points/500 );
  var material = new THREE.MeshLambertMaterial( {
      color: objectColor.getHex(),
      opacity: 0.4,
      transparent: false,
      emissive: 0x555555,
      shading: THREE.SmoothShading } );//THREE.FlatShading
  
  this.object = new THREE.Mesh( geometry, material );
  this.object.scale.set( scale, scale, scale );
  /*
  var objLoader = new THREE.OBJLoader();
  this.object = objLoader.parse( galaxies.queue.getResult('asteroidmodel') );
  this.object.material = material;
  this.object.scale.set(0.5, 0.5, 0.5);*/
  
  
  // Sound
  var hitSound = props.hitSound;
  var explodeSound = props.explodeSound;
  this.passSound = null;
  if ( props.passSound != null ) {
    //console.log(_passSoundId);
    this.passSound = new ObjectSound( getSound( props.passSound, true), this.object, 0 );
    //directionalSources.push(passSound);
  }
  
  var clearDistance = OBSTACLE_VISIBLE_RADIUS * 1.2;
  var startDistance = OBSTACLE_VISIBLE_RADIUS * 1.2;
  if (this.passSound != null ) {
    startDistance = OBSTACLE_VISIBLE_RADIUS * 2;
  }
  
  this.resetPosition= function() {
      angle = Math.random()*Math.PI*2;
      var position = new THREE.Vector3( Math.cos(angle), Math.sin(angle), 0 );
      
      position.multiplyScalar( startDistance );
      this.object.position.copy(position);
      this.object.lookAt( new THREE.Vector3() );
      
      if ( material!=null) {
        material.transparent = false;
      }
      
      this.state = 'waiting';
      this.isActive = false;
      fallTime = Math.random() * 10 + 1;
      fallTimer = 0;
      velocity.set(0,0,0);
      
      tumbleAxis.set( Math.random()*2 -1, Math.random()*2 -1, Math.random()*2 -1 );
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
      var radius = flatLength( this.object.position );
      if ( radius > clearDistance ) { this.destroy(); }
      if ( this.isActive && (radius > OBSTACLE_VISIBLE_RADIUS ) ) {
        this.isActive = false;
        if ( material!=null) {
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
      
      var radius = flatLength( this.object.position );
      if (( radius <= PLANET_DISTANCE ) && (velocity.length() < PLANET_DISTANCE) ) {
        // This order is very important as hitPlayer may trigger game over which
        // must override the obstacle's state.
        this.destroy();
        hitPlayer();
        break;
      }
      if ( radius < OBSTACLE_VISIBLE_RADIUS ) { this.isActive = true; }
      this.object.position.add( velocity );
      
      /*
      // clamp vertical position
      if ( this.object.position.y < -OBSTACLE_START_RADIUS ) { this.object.position.setY( -OBSTACLE_START_RADIUS ); }
      if ( this.object.position.y > OBSTACLE_START_RADIUS ) { this.object.position.setY( OBSTACLE_START_RADIUS ); }
      */
      
      
      // idle sound level
      if ( this.passSound !== null ) {
        this.passSound.update( delta );
        var soundLevel = 2 - Math.abs(this.object.position.z - cameraZ)/10;
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
        
        rootObject.add( this.object );
        
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
      this.object.lookAt( rootObject.position );
    }
    
    if ( this.particleGroup != null ) {
      this.particleGroup.tick(delta);
    }
    
  } 
  
  this.removePassSound = function() {
    if ( this.passSound !== null ) {
      this.passSound.sound.source.stop();
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
    velocity.setLength( 3 * RICOCHET_SPEED * speedScale );
    
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
      showCombo( (this.ricochetCount * this.points), this.object );
      new PositionedSound( getSound(explodeSound,false), rootPosition(this.object), 2 );
      //playSound( getSound(explodeSound,false), rootPosition(this.object), 2 );
      
      galaxies.fx.shakeCamera(0.5);

      switch ( this.explodeType) {
        case 'fireworks':
          galaxies.fx.showFireworks( this.object.position );
          break;
        case 'rubble':
        default:
          galaxies.fx.showRubble( this.object.position, velocity );
      }
      
      this.destroy();
      return;
    }
    
    new PositionedSound( getSound(hitSound,false), rootPosition(this.object), 1 );
    //playSound( getSound('fpo',false), rootPosition(this.object), 1 );
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
    velocity.setLength( RICOCHET_SPEED * speedScale );
    //console.log(velocity);
  }
  
  this.destroy = function() {
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
  
  this.destruct = function() {
    this.removePassSound();
    this.remove();
  }
  
  this.resetPosition();
  
}



function Projectile( model, angle ) {
  this.angularSpeed = 10
  this.isExpired = false;
  
  this.object = new THREE.Object3D();
  this.object.up.set(0,0,1);
  
  var rotateAxis = new THREE.Vector3(0,1,0);
  
  // set initial direction
  var direction = new THREE.Vector3( -Math.sin(angle), Math.cos(angle), 0 );
  direction.multiplyScalar( PROJ_START_Y );
  this.object.position.copy( direction );
  direction.add( direction );
  this.object.lookAt( direction );
  
  this.model = model;
  this.object.add(this.model);
  this.model.rotation.x = coneAngle;
  
  conify(this.object);
  
  //object.rotation.x = object.rotation.z + Math.PI/2;
  //this.direction = direction.multiplyScalar( SPEED );
  //console.log( object.position, direction );
  
  this.lifeTimer = 0;
  
  this.updatePosition = function( newAngle ) {
    
    var distance = flatLength( this.object.position );
    direction.set( -Math.sin(newAngle), Math.cos(newAngle), 0 );
    direction.multiplyScalar( distance );
    
    this.object.position.copy( direction );
    direction.add( direction );
    this.object.lookAt( direction );
    conify( this.object );
  }
  
  /// Expire and schedule for removal
  this.destroy = function() {
    galaxies.fx.showHit( this.object.position );
    
    this.isExpired = true;
    this.lifeTimer = PROJECTILE_LIFE;
  }
  this.remove = function() {
    if ( this.object.parent!=null) {
      this.object.parent.remove(this.object);
    }
  }
  this.addToScene = function() {
    if (!this.isExpired) {
      rootObject.add( this.object );
    }
  }
  this.update = function( delta ) {
    this.object.translateZ( projectileSpeed * delta );
    this.model.rotateOnAxis( rotateAxis, this.angularSpeed * delta );
    this.lifeTimer += delta;
    if ( this.lifeTimer >= PROJECTILE_LIFE ) {
      this.isExpired = true;
      //console.log( flatLength(this.object.position) );
    }
  }
}
