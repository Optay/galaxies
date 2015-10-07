"use strict";

this.galaxies = this.galaxies || {};

this.galaxies.Ufo = function() {
  this.points = 1000;
  
  /*
  var geometry = new THREE.CylinderGeometry( 0.4, 0.4, 0.25, 8, 1, false);
  
  var objectColor = new THREE.Color( 1,1,1 );
  var material = new THREE.MeshLambertMaterial( {
      color: objectColor.getHex(),
      emissive: 0x333333,
      shading: THREE.SmoothShading } );
  
  this.object = new THREE.Mesh( geometry, material );*/
  
  this.object = new THREE.Object3D();
  this.model = geometries['ufo'];
  /*new THREE.Mesh(
    geometries['ufo'],
    new THREE.MeshFaceMaterial( [ materials['ufo2'], materials['ufo'], materials['ufo3'] ] )
  );
  */
  this.model.children[0].material = materials['ufo'];
  this.model.children[1].material = materials['ufocanopy'];
  
  
  this.model.scale.set(0.6, 0.6, 0.6);
  this.model.rotation.set(Math.PI,0,-Math.PI/2);
  
  this.object.add( this.model );
  
  var trunkMap = new THREE.Texture( galaxies.queue.getResult('trunkford') );
  trunkMap.needsUpdate = true;
  var trunkMat = new THREE.MeshLambertMaterial({
    map: trunkMap,
    color: 0xffffff,
    transparent: true,
    //depthTest: false,
    //depthWrite: false,
    side: THREE.DoubleSide
  } );
  //var characterMaterial = new THREE.SpriteMaterial( { color: 0xffffff } );
  var trunkford = new THREE.Mesh( new THREE.PlaneGeometry(1.23,1), trunkMat ); // 1.23 is aspect ratio of texture
  trunkford.position.set( 0, 0.4, 0.4 );
  trunkford.scale.set(0.6, 0.6, 1);
  trunkford.rotation.set( 0, Math.PI, 0 );
  this.model.add( trunkford );
  
  var anchor = new THREE.Object3D();
  anchor.add( this.object );
  
  var state = 'inactive'; // values for state: idle, in, out, orbit, inactive
  var stepTimer = 0;
  var stepTime = 0;
  var transitionTime = 0;
  
  var hitCounter = 0;
  var HITS = 2;
  
  var angle = Math.random() * PI_2; // random start angle
  var angularSpeed = 0.7;
  var rotationAxis = new THREE.Vector3(0,1,0);
  
  // laser
  var laserChargeParticles = {
    type: 'sphere',
    radius: 1,
    //acceleration: new THREE.Vector3(0,0,-40),//THREE.Vector3(0,-40,0),
    speed: -1,
    //speedSpread: 5,
    sizeStart: 1,
    sizeStartSpread: 1,
    sizeEnd: 2,
    opacityStart: 0,
    opacityEnd: 1,
    colorStart: new THREE.Color(0.300, 1.000, 0.300),
    colorStartSpread: new THREE.Vector3(0.1, 0.1, 0.1),
    colorEnd: new THREE.Color(0.500, 1.000, 0.800),
    particlesPerSecond: 50,
    particleCount: 50,
    alive: 1.0,
    duration: 0.5//0.1
  };
  var texture = new THREE.Texture( galaxies.queue.getResult('starparticle') );
  texture.needsUpdate = true;
  var laserChargeGroup = new SPE.Group({
    texture: texture,
    maxAge: 1,
    blending: THREE.AdditiveBlending
  });
  var laserChargeEmitter = new SPE.Emitter( laserChargeParticles );
  laserChargeGroup.addEmitter( laserChargeEmitter );
  laserChargeGroup.mesh.position.x = -0.5;
  
  
  var smokeParticles = {
    type: 'cube',
    acceleration: new THREE.Vector3(0,0,-3),
    velocity: new THREE.Vector3(0, -2, 0),
    velocitySpread: new THREE.Vector3(1, 1, 1),
    //speedSpread: 5,
    sizeStart: 3,
    sizeStartSpread: 1,
    sizeEnd: 3,
    opacityStart: 1,
    opacityEnd: 0,
    colorStart: new THREE.Color(0.600, 0.600, 0.600),
    colorStartSpread: new THREE.Vector3(0.1, 0.1, 0.1),
    colorEnd: new THREE.Color(0.200, 0.200, 0.200),
    particlesPerSecond: 10,
    particleCount: 50,
    alive: 0.0,
    duration: null//0.1
  };
  var smokeTexture = new THREE.Texture( galaxies.queue.getResult('projhitparticle') );
  smokeTexture.needsUpdate = true;
  var smokeGroup = new SPE.Group({
    texture: smokeTexture,
    maxAge: 2,
    blending: THREE.NormalBlending
  });
  var smokeEmitter = new SPE.Emitter( smokeParticles );
  smokeGroup.addEmitter( smokeEmitter );
  this.object.add( smokeGroup.mesh );
  
  
  
  //rootObject.add( laserChargeGroup.mesh );
  this.object.add( laserChargeGroup.mesh );

  var laserOrient = new THREE.Object3D();
  laserOrient.position.set(-0.5, 0, 0);
  laserOrient.rotation.set(0,2.03,0); // This angle set so beam of given length intersects with planet.
  //this.object.add( laserOrient ); // For testing

  var laserGeometry = new THREE.PlaneGeometry( 5, 0.3 );
  var laserTexture = new THREE.Texture(
    galaxies.queue.getResult('laserbeam') );
  laserTexture.needsUpdate = true;
  var laserMaterial = new THREE.MeshBasicMaterial( {
    map: laserTexture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1
  } );
  var laserBeam = new THREE.Mesh( laserGeometry, laserMaterial );
  laserBeam.position.set(2.5, 0, 0);
  laserOrient.add( laserBeam );

//  var axisHelper = new THREE.AxisHelper(1);
//  this.object.add( axisHelper );
  

  /*
  var targetPositions = [
    new THREE.Vector3(0.5,0,41),
    new THREE.Vector3(3.3,0,0),
    new THREE.Vector3(2.9,0,0),
    new THREE.Vector3(2.5,0,0),
    new THREE.Vector3(0.5,0,41)
  ];
  */
  
  // Sound!
  this.ufoSound = new ObjectSound( getSound('ufo'), this.object, 0 );
  //directionalSources.push( ufoSound );
  
  var idleZ = cameraZ + 10;
  var idlePosition = new THREE.Vector3(1,0,idleZ);

  var orbitPositions = [
    new THREE.Vector3(OBSTACLE_VISIBLE_RADIUS,0,0),
    new THREE.Vector3(OBSTACLE_VISIBLE_RADIUS * 0.9,0,0),
    new THREE.Vector3(OBSTACLE_VISIBLE_RADIUS * 0.75,0,0)
  ];
  orbitPositions[0].z = getConifiedDepth( orbitPositions[0] );
  orbitPositions[1].z = getConifiedDepth( orbitPositions[1] );
  orbitPositions[2].z = getConifiedDepth( orbitPositions[2] );
  var orbitPosition = orbitPositions[1];
  
  /*
  var laserMaterial = new THREE.SpriteMaterial( {
    color: 0xffffff,
    fog: true,
    opacity: 1,
    transparent: true
  } );
  var laser = new THREE.Sprite( laserMaterial );
  laser.position.set( OBSTACLE_VISIBLE_RADIUS * 0.75 + 1, 0, 0 );
  laser.scale.set( OBSTACLE_VISIBLE_RADIUS * 1.5, 1, 1);
  var laserHolder = new THREE.Object3D();
  laserHolder.add( laser );
  */
  //rootObject.add( laserHolder );
  
  
  var tween = createjs.Ease.quadInOut;
  var inTween;
  
  var stepAngle = 0;
  var transitionAngle = 0;
  var step = 0;
  this.object.position.copy( idlePosition );
  var lastPosition = idlePosition;
  var targetPosition = idlePosition;
  var lastAngle = 0;
  var targetAngle = 0;
  
  this.isHittable = false;
  this.alive = true;
  
  this.update = function( delta ) {
    stepTimer += delta;
    
    switch ( state ) {
    case 'idle':
      if ( stepTimer >= stepTime ) {
        state = 'in';
        stepTime = 4;
        transitionTime = 4;
        stepTimer = 0;
        lastPosition = this.object.position.clone();
        //targetPosition = orbitPositions[0];
        targetPosition = orbitPosition;
        
        // Starting angle is set so ufo stays to right or left as it flies in.
        angle = Math.round(Math.random()) * Math.PI - Math.PI/4;
        
        var a = angularSpeed / (2*transitionTime);
        var c = angle;
        
        inTween = function( t ) {
          return a*t*t + c;
        };
        
        this.isHittable = true;
        
        // Tip to attack posture
        this.model.rotation.y = Math.PI/3;
        createjs.Tween.removeTweens( this.model.rotation );
        createjs.Tween.get(this.model.rotation).wait(2000).to({y: 0}, 2000, createjs.Ease.quadOut );
        
        new PositionedSound( getSound('trunkfordlaugh'), new THREE.Vector3(0,0,cameraZ*1.5), 4, false );
        
        /*
        console.log( angle );
        for (var i=0; i<transitionTime; i+=0.1 ) {
          console.log( i, inTween(i).toFixed(2) );
        }*/
        
        console.log( 'idle -> in' );
      }
      break;
    case 'in':
      angle = inTween( stepTimer );
      
      if ( stepTimer >= stepTime ) {
        state = 'orbit';
        stepTime = 1;//(Math.PI*2/3)/angularSpeed; // time between shots
        transitionTime = stepTime/4;
        stepTimer = 0;
        step = 0;
        lastPosition = this.object.position.clone();
        //targetPosition = orbitPositions[step];
        targetPosition = orbitPosition;
        console.log( 'in -> orbit' );
      }
      break;
    case 'orbit':
      angle += angularSpeed * delta;
      
      if ( stepTimer >= stepTime ) {
        console.log( 'orbit step' );
        
        // Fire
        laserChargeEmitter.alive = 1.0;
        createjs.Tween.get(laserBeam).wait(1000).call( function() {
          new PositionedSound( getSound('ufoshoot'), rootPosition(this.object), 1, false );
          
          this.object.add(laserOrient);
          laserBeam.material.opacity = 1;
  
          createjs.Tween.get(laserBeam.material).to({opacity:0}, 300, createjs.Ease.quadOut).call( function() {
            this.object.remove(laserOrient);
            //laserBeam.material.opacity = 1; // for testing
          }, null, this );
          
          laserOrient.rotation.z = (Math.round( Math.random() )* 2 - 1) * Math.PI/16;
          
          if ( step > 2 ) {
            hitPlayer();
            this.leave();
            laserOrient.rotation.z = 0;
          }

        }, null, this );
        
        //lastPosition = this.object.position.clone();
        //targetPosition = orbitPositions[step];
        
        step++;
        stepTimer = 0;
        stepTime = 2;
      }
      
      break;
    case 'out':
      angle = THREE.Math.mapLinear( stepTimer, 0, transitionTime/2, lastAngle, targetAngle );
      //console.log( angle, stepTimer, lastAngle, targetAngle );
      
      if ( stepTimer >= stepTime ) {
        console.log( 'orbit -> idle' );
        this.reset();
      }
      
      break;
    }
    
    var transitionProgress = THREE.Math.clamp( stepTimer/transitionTime, 0, 1);
    transitionProgress = tween( THREE.Math.clamp(transitionProgress,0,1) );
    this.object.position.lerpVectors( lastPosition, targetPosition, transitionProgress );
    
    anchor.rotation.set(0,0,angle);
    
    
    // Engine sound level - reduce to 0 when all the way behind listener.
    this.ufoSound.update( delta );
    var engineLevel = idleZ - this.object.position.z;
    engineLevel = THREE.Math.clamp( engineLevel, 0, 1 );
    this.ufoSound.volume = engineLevel;
    //
    
    laserChargeGroup.tick(delta);
    smokeGroup.tick(delta);
    
    /*
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
    }*/
    
  }
  
  this.leave = function() {
    state = 'out';
    stepTimer = 0;
    stepTime = 4;
    transitionTime = 4;
    this.isHittable = false;
    lastPosition = this.object.position.clone();
    targetPosition = idlePosition;
    
    // Abort firing 
    createjs.Tween.removeTweens(laserBeam);
    
    var shortAngle = ((angle) + Math.PI) % PI_2 - Math.PI;
    angle = shortAngle;
    lastAngle = angle;
    
    targetAngle = (Math.floor(angle / Math.PI) + 1 ) * Math.PI;
    /*
    if ( Math.abs( shortAngle ) < Math.PI/2 ) {
      targetAngle = 0;
    } else {
      if ( shortAngle < 0 ) {
        targetAngle = -Math.PI;
      } else {
        targetAngle = Math.PI;
      }
    }*/
    
    // Tip to show bubble
    createjs.Tween.removeTweens( this.model.rotation );
    createjs.Tween.get(this.model.rotation).to({y: Math.PI/3}, 2000, createjs.Ease.quadIn );
    
    console.log( 'orbit -> out' );
  }
  
  this.hit = function() {
    hitCounter++;
    if ( hitCounter >= HITS ) {
      this.leave();
      
      // score is scaled by how far away you hit the ufo.
      showCombo( this.points * (3-step), this.object );
    }
    
    smokeEmitter.alive = 1.0;
        
    // play sound
    new PositionedSound( getSound('ufohit'), rootPosition(this.object), 1, false );
    //playSound( getSound('fpo',false), rootPosition(this.object), 1 );
    
  }
  
  // put object at step 0 and idle it for a random time
  this.reset = function() {
    state = 'idle';
    stepTimer = 0;
    
    hitCounter = 0;
    smokeEmitter.alive = 0.0;

    
    if ( isGameOver ) {
      this.deactivate();
      return;
    } else {
      //stepTime = 0; // for testing
      stepTime = Math.random() * 15 + 10; // 10 to 25 second interval
    }
    
    this.isHittable = false;
    
    lastPosition = idlePosition;
    targetPosition = idlePosition;
    this.object.position.copy( idlePosition );
    
    // silence it!
    this.ufoSound.volume = 0;
    
    /*
    step = 0;
    transitionAngle = angle + Math.random() * 3 * Math.PI;
    stepAngle = transitionAngle;
    this.alive = true;
    lastPosition = targetPositions[0];
    this.object.position.copy( targetPositions[0] );
    */
  }
  
  this.activate = function() {
    this.reset();
    
    rootObject.add( anchor );
    
  }
  this.deactivate = function() {
    state = 'inactive';
    
    this.isHittable = false;
    lastPosition = idlePosition;
    targetPosition = idlePosition;
    this.object.position.copy( idlePosition );
    this.ufoSound.volume=0;
    
    rootObject.remove( anchor );
  }
  
  
  this.deactivate();
  
}
