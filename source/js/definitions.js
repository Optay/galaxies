"use strict";
/*
function Orbit() {
    // Instantiate shot object
    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshPhongMaterial( {
        color: 0x555555,
        specular: 0xdddddd,
        emissive: 0x555555,
        shininess: 10} );
    
    this.object = new THREE.Mesh( geometry, material );
    
    var center = new THREE.Vector3(9, 0, 0);
    var angle = 0;
    var speed = 0.3;
    var radius = 12;
    
    this.update = function( delta ) {
        angle += delta * speed;
        var position = new THREE.Vector3( Math.cos(angle), Math.sin(angle), 0 );
        position.multiplyScalar( radius );
        position.add( center );
        
        this.object.position.copy( position );
    }
    
    /// Reverse direction
    this.destroy = function() {
        speed = -speed;
    }
    
}*/

function Ufo() {
  this.points = 1000;
  
  var geometry = new THREE.CylinderGeometry( 0.4, 0.4, 0.25, 8, 1, false);
  var objectColor = new THREE.Color( 1,1,1 );
  var material = new THREE.MeshLambertMaterial( {
      color: objectColor.getHex(),
      emissive: 0x333333,
      shading: THREE.SmoothShading } );
  
  this.object = new THREE.Mesh( geometry, material );
  this.object.rotation.set(0,0,Math.PI/2);
                     
  var anchor = new THREE.Object3D();
  anchor.add( this.object );
  rootObject.add( anchor );
  
  var angle = Math.random() * PI_2; // random start angle
  var angularSpeed = 0.7 * speedScale;
  var rotationAxis = new THREE.Vector3(0,1,0);
  
  /*
  var targetPositions = [
    new THREE.Vector3(0.5,0,41),
    new THREE.Vector3(3.3,0,0),
    new THREE.Vector3(2.9,0,0),
    new THREE.Vector3(2.5,0,0),
    new THREE.Vector3(0.5,0,41)
  ];
  */
  var targetPositions = [
    new THREE.Vector3(1,0,cameraZ + 10),
    new THREE.Vector3(OBSTACLE_VISIBLE_RADIUS,0,0),
    new THREE.Vector3(OBSTACLE_VISIBLE_RADIUS * 0.9,0,0),
    new THREE.Vector3(OBSTACLE_VISIBLE_RADIUS * 0.75,0,0),
    new THREE.Vector3(1,0,cameraZ + 10)
  ];
  targetPositions[1].z = getConifiedDepth( targetPositions[1] );
  targetPositions[2].z = getConifiedDepth( targetPositions[2] );
  targetPositions[3].z = getConifiedDepth( targetPositions[3] );
  
  var tween = createjs.Ease.quadInOut;
  
  var stepAngle = 0;
  var transitionAngle = 0;
  var step = 1;
  this.object.position.copy( targetPositions[0] );
  var lastPosition = targetPositions[0];
  
  this.isHittable = false;
  this.alive = true;
  
  this.update = function( delta ) {
    angle += angularSpeed * delta;
    anchor.rotation.set(0,0,angle);
    
    if ( angle > stepAngle ) {
      lastPosition = this.object.position.clone();
      step++;
      if ( step === (targetPositions.length-1) ) {
        // fire!
        hitPlayer();
        stepAngle = angle + PI_2;
        transitionAngle = angle + PI_2;
      } else if ( step >= targetPositions.length ) {
        this.reset();
      } else {
        // step down
        stepAngle = angle + (PI_2);
        transitionAngle = angle + (Math.PI/2);
      }
    }
    
    var progress = 1 - (transitionAngle - angle)/ (Math.PI/2);
    progress = tween( THREE.Math.clamp(progress,0,1) );
    this.object.position.lerpVectors( lastPosition, targetPositions[step], progress );
    
    if ( this.alive && !this.isHittable && (angle>transitionAngle) && (step==1) ) {
      this.isHittable = true;
    }
    
  }
  
  this.hit = function() {
    if ( !this.isHittable || !this.alive ) { return; }
    this.alive = false;
    this.isHittable = false;
    
    // score is scaled by how far away you hit the ufo.
    showCombo( this.points * (4-step), this.object );
    
    step = (targetPositions.length -1);
    lastPosition = this.object.position.clone();
    stepAngle = angle + PI_2;
    transitionAngle = angle + (Math.PI/2);
    
    // play sound
    playSound( getSound('shoot',false), rootPosition(this.object), 1 );
    
  }
  
  // put object at step 0 and idle it for a random time
  this.reset = function() {
    step = 0;
    transitionAngle = angle + Math.random() * 3 * Math.PI;
    stepAngle = transitionAngle;
    this.alive = true;
    lastPosition = targetPositions[0];
    this.object.position.copy( targetPositions[0] );
  }
  
  this.reset();

}

function Asteroid( _speed, _spiral, _geometry, _tumble, _points ) {
  var PLANET_DISTANCE = 1.25;
  var RICOCHET_SPEED = 0.35;
  
  this.points = _points;
  
  this.speed = _speed * speedScale;
  var angle = 0;
  //var angularSpeed = this.speed/radius;
  
  var tumble = _tumble;
  var tumbling = tumble;
  var tumbleAxis = new THREE.Vector3();
  var baseTumbleSpeed = 1.5;
  var tumbleSpeed = baseTumbleSpeed;
  
  var velocity = new THREE.Vector3();
  
  //this.falling = false;
  var fallSpeed = 8;
  var fallTimer = 0;
  var fallTime = 0;
  var spiralTime = _spiral * 60 + 1;
  
  //this.ricochet = false;
  this.ricochetCount = 0;
  
  // state values: waiting, falling, ricocheting, inactive
  this.state = 'waiting';
  this.isActive = false; // will the object accept interactions
  
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
      shading: THREE.FlatShading } );
  
  this.object = new THREE.Mesh( geometry, material );
  
  this.resetPosition= function() {
      angle = Math.random()*Math.PI*2;
      var position = new THREE.Vector3( Math.cos(angle), Math.sin(angle), 0 );
      position.multiplyScalar( OBSTACLE_START_RADIUS );
      this.object.position.copy(position);
      this.object.lookAt( new THREE.Vector3() );
      
      this.object.material.transparent = false;
      
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
    case 'ricocheting':
      this.object.position.add( velocity.clone().multiplyScalar(delta) );
      
      // Prevent ricochets from traveling all the way out, so
      // the player cannot score points off-screen
      var radius = flatLength( this.object.position );
      if ( radius > OBSTACLE_START_RADIUS ) { this.destroy(); }
      if ( this.isActive && (radius > OBSTACLE_VISIBLE_RADIUS ) ) {
        this.isActive = false;
        this.object.material.transparent = true;
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
        hitPlayer();
        this.resetPosition();
      }
      if ( radius < OBSTACLE_VISIBLE_RADIUS ) { this.isActive = true; }
      this.object.position.add( velocity );
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
    }
    
  } 
  
  this.hit = function( hitPosition, ricochet ) {
    //if ( this.ricochet ) {
    
    // play sound
    playSound( getSound('shoot',false), rootPosition(this.object), 1 );
    
    if ( this.state === 'ricocheting' ) {
      showCombo( (this.ricochetCount * this.points), this.object );
      this.destroy();
      return;
    }
    this.state= 'ricocheting';
    //this.ricochet = true;
    
    if ( typeof(ricochet) === 'undefined' ) {
      this.ricochetCount = 1;
    } else {
      this.ricochetCount = ricochet+1;
    }
    
    tumbling = true;
    tumbleSpeed = baseTumbleSpeed * this.ricochetCount * 2.5;
    
    //console.log( this.ricochetCount );
    
    velocity.copy( this.object.position );
    velocity.sub( hitPosition );
    velocity.z = 0;
    velocity.setLength( RICOCHET_SPEED * speedScale );
    //console.log(velocity);
  }
  
  this.destroy = function() {
    this.state = 'inactive';
    this.remove();
    //this.resetPosition();
  }
  this.remove = function() {
    if ( this.object.parent!=null) {
      this.object.parent.remove(this.object);
    }
  }
  
  this.resetPosition();
  
}



function Projectile( object, direction ) {
    this.angularSpeed = 10
    this.isExpired = false;
    
    this.object = object;
    direction.add( object.position );
    object.lookAt( direction );
    //this.direction = direction.multiplyScalar( SPEED );
    //console.log( object.position, direction );
    
    this.lifeTimer = 0;
    
    /// Expire and schedule for removal
    this.destroy = function() {
      this.isExpired = true;
      this.lifeTimer = PROJECTILE_LIFE;
    }
    this.remove = function() {
      this.object.parent.remove(this.object);
    }
    this.update = function( delta ) {
      this.object.translateZ( projectileSpeed * delta );
      //this.object.rotateOnAxis( new THREE.Vector3(0,0,1), this.angularSpeed * delta );
      this.lifeTimer += delta;
      if ( this.lifeTimer >= PROJECTILE_LIFE ) {
        this.isExpired = true;
        //console.log( flatLength(this.object.position) );
      }
    }
}
