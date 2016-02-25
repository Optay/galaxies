"use strict";

this.galaxies = this.galaxies || {};

this.galaxies.Ufo = function() {
  this.points = 2000;
  this.hitThreshold = 0.7;
  /*
  var geometry = new THREE.CylinderGeometry( 0.4, 0.4, 0.25, 8, 1, false);
  
  var objectColor = new THREE.Color( 1,1,1 );
  var material = new THREE.MeshLambertMaterial( {
      color: objectColor.getHex(),
      emissive: 0x333333,
      shading: THREE.SmoothShading } );
  
  this.object = new THREE.Mesh( geometry, material );*/
  
  this.object = new THREE.Object3D();
  this.model = galaxies.resources.geometries['ufo'];
  /*new THREE.Mesh(
    geometries['ufo'],
    new THREE.MeshFaceMaterial( [ materials['ufo2'], materials['ufo'], materials['ufo3'] ] )
  );
  */
  this.model.children[0].material = galaxies.resources.materials['ufo'];
  this.model.children[1].material = galaxies.resources.materials['ufocanopy'];
  
  
  this.model.scale.set(0.6, 0.6, 0.6);
  this.model.rotation.set(Math.PI,0,-Math.PI/2);
  
  this.waggler = new THREE.Object3D();
  this.waggler.add( this.model );
  this.object.add( this.waggler );
  
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
  
  this.state = 'inactive'; // values for state: idle, in, orbit, out, inactive
  var stepTimer = 0;
  var stepTime = 0;
  var transitionTime = 0;
  
  var hitCounter = 0;
  var HITS = 3;
  
  var angle = Math.random() * galaxies.utils.PI_2; // random start angle
  var angularSpeed = 0.7;
  var rotationAxis = new THREE.Vector3(0,1,0);
  
  // laser
  var laserChargeParticles = {
    type: SPE.distributions.SPHERE,
    particleCount: 50,
    activeMultiplier: 1,
    duration: 0.4,//0.1
    maxAge: { value: 0.6 },
    position: {
      radius: 0.6
    },
    velocity: {
      value: new THREE.Vector3(-1,0,0)
    },
    //acceleration: new THREE.Vector3(0,0,-40),//THREE.Vector3(0,-40,0),
    color: {
      value: [ new THREE.Color(0.300, 1.000, 0.300),
               new THREE.Color(0.500, 1.000, 0.800) ],
      spread: new THREE.Vector3(0.1, 0.1, 0.1)
    },
    opacity: {
      value: [ 0, 1 ]
    },
    size: {
      value: [1, 2],
      spread: 1
    }
    
  };
  var texture = new THREE.Texture( galaxies.queue.getResult('starparticle') );
  texture.needsUpdate = true;
  var laserChargeGroup = new SPE.Group({
    texture: { value: texture },
    blending: THREE.AdditiveBlending,
    transparent: true,
    
  });
  var laserChargeEmitter = new SPE.Emitter( laserChargeParticles );
  laserChargeGroup.addEmitter( laserChargeEmitter );
  laserChargeGroup.mesh.position.x = -0.5;
  
  
  var smokeParticles = {
    type: SPE.distributions.CUBE,
    particleCount: 50,
    duration: null,
    activeMultiplier: 0.5,
    maxAge: { value: 2 },
    velocity: {
      value: new THREE.Vector3(0, -2, 0),
      spread: new THREE.Vector3(1, 1, 1)
    },
    acceleration: {
      value: new THREE.Vector3(0,0,-3)
    },
    color: {
      value: [ new THREE.Color(0.600, 0.600, 0.600),
               new THREE.Color(0.200, 0.200, 0.200) ],
      spread: new THREE.Vector3(0.1, 0.1, 0.1)
    },
    opacity: {
      value: [1,0]
    },
    size: {
      value: 3,
      spread: 1
    },
    
  };
  var smokeTexture = new THREE.Texture( galaxies.queue.getResult('projhitparticle') );
  smokeTexture.needsUpdate = true;
  var smokeGroup = new SPE.Group({
    texture: { value: smokeTexture },
    blending: THREE.NormalBlending,
    transparent: true
  });
  var smokeEmitter = new SPE.Emitter( smokeParticles );
  smokeGroup.addEmitter( smokeEmitter );
  smokeEmitter.disable();
  this.object.add( smokeGroup.mesh );
  
  
  
  this.object.add( laserChargeGroup.mesh );

  var laserOrient = new THREE.Object3D();
  laserOrient.position.set(-0.5, 0, 0);
  laserOrient.rotation.set(0,2.03,0); // This angle set so beam of given length intersects with planet.
  //this.object.add( laserOrient ); // For testing

  var laserGeometry = new THREE.PlaneGeometry( 1, 0.3 ); // beam is scaled on reset to match orbital distance
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
  laserBeam.position.set(0.5, 0, 0);
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
  this.ufoSound = new galaxies.audio.ObjectSound( galaxies.audio.getSound('ufo'), this.object, 0 );
  //directionalSources.push( ufoSound );
  
  var idleZ = galaxies.engine.CAMERA_Z + 10;
  var idlePosition = new THREE.Vector3(1,0,idleZ);

  var orbitPositions = [
    new THREE.Vector3(galaxies.engine.VISIBLE_RADIUS,0,0),
    new THREE.Vector3(galaxies.engine.VISIBLE_RADIUS * 0.9,0,0),
    new THREE.Vector3(galaxies.engine.VISIBLE_RADIUS * 0.75,0,0)
  ];
  orbitPositions[0].z = galaxies.utils.getConifiedDepth( orbitPositions[0] );
  orbitPositions[1].z = galaxies.utils.getConifiedDepth( orbitPositions[1] );
  orbitPositions[2].z = galaxies.utils.getConifiedDepth( orbitPositions[2] );
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
    
    switch ( this.state ) {
    case 'idle':
      if ( stepTimer >= stepTime ) {
        this.state = 'in';
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
        
        new galaxies.audio.PositionedSound({
          source: galaxies.audio.getSound('trunkfordlaugh'),
          position: new THREE.Vector3(0,0,galaxies.engine.CAMERA_Z*1.5),
          baseVolume: 4,
          loop: false
        });
        
        /*
        console.log( angle );
        for (var i=0; i<transitionTime; i+=0.1 ) {
          console.log( i, inTween(i).toFixed(2) );
        }*/
        
        //console.log( 'idle -> in' );
      }
      break;
    case 'in':
      angle = inTween( stepTimer );
      
      if ( stepTimer >= stepTime ) {
        this.state = 'orbit';
        stepTime = 1;//(Math.PI*2/3)/angularSpeed; // time between shots
        transitionTime = stepTime/4;
        stepTimer = 0;
        step = 0;
        lastPosition = this.object.position.clone();
        //targetPosition = orbitPositions[step];
        targetPosition = orbitPosition;
        //console.log( 'in -> orbit' );
      }
      break;
    case 'orbit':
      angle += angularSpeed * delta;
      
      if ( stepTimer >= stepTime ) {
        //console.log( 'orbit step' );
        
        // Fire
        laserChargeEmitter.enable();
        createjs.Tween.get(laserBeam).wait(1000).call( function() {
          new galaxies.audio.PositionedSound({
            source: galaxies.audio.getSound('ufoshoot'),
            position: galaxies.utils.rootPosition(this.object),
            baseVolume: 1.5,
            loop: false
          });
          
          this.object.add(laserOrient);
          laserBeam.material.opacity = 1;
  
          createjs.Tween.get(laserBeam.material).to({opacity:0}, 300, createjs.Ease.quadOut).call( function() {
            this.object.remove(laserOrient);
            //laserBeam.material.opacity = 1; // for testing
          }, null, this );
          
          laserOrient.rotation.z = (Math.round( Math.random() )* 2 - 1) * Math.PI/16;
          
          if ( step > 2 ) {
            galaxies.engine.hitPlayer();
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
        //console.log( 'orbit -> idle' );
        this.deactivate();
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
        stepAngle = angle + galaxies.utils.PI_2;
        transitionAngle = angle + galaxies.utils.PI_2;
      } else if ( step >= targetPositions.length ) {
        this.reset();
      } else {
        // step down
        stepAngle = angle + (galaxies.utils.PI_2);
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
    this.state = 'out';
    stepTimer = 0;
    stepTime = 4;
    transitionTime = 4;
    this.isHittable = false;
    lastPosition = this.object.position.clone();
    targetPosition = idlePosition;
    
    // Abort firing 
    createjs.Tween.removeTweens(laserBeam);
    
    var shortAngle = ((angle) + Math.PI) % galaxies.utils.PI_2 - Math.PI;
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
    
    //console.log( 'orbit -> out' );
  }
  
  this.hit = function( forceDestroy ) {
    if ( forceDestroy ) {
      hitCounter = HITS;
    } else {
      hitCounter++;
    }
    
    this.isHittable = false;
    var self = this;
    
    // waggle
    createjs.Tween.removeTweens( this.waggler.rotation );
    this.waggler.rotation.z = Math.PI/4;
    createjs.Tween.get( this.waggler.rotation )
      .to( {z: 0}, 1500, createjs.Ease.elasticOut );
    
    createjs.Tween.removeTweens( this.waggler.position );
    createjs.Tween.get( this.waggler.position )
      .to( {x: 0.5}, 500, createjs.Ease.quadOut )
      .call( function() {
        if ( self.state === 'orbit' ) { self.isHittable = true; }
      })
      .to( {x: 0}, 750, createjs.Ease.quadInOut );
    //
    
    
    if ( hitCounter >= HITS ) {
      this.leave();
      
      galaxies.engine.showCombo( this.points, 1, this.object );
    }
    
    smokeEmitter.enable();
        
    // play sound
    new galaxies.audio.PositionedSound({
      source: galaxies.audio.getSound('ufohit'),
      position: galaxies.utils.rootPosition(this.object),
      baseVolume: 1.4,
      loop: false
    });
    
  }
  
  // bring it in
  this.reset = function() {
    this.state = 'idle';
    stepTimer = 0;
    
    hitCounter = 0;
    smokeEmitter.disable();
    
    if ( galaxies.engine.isGameOver ) {
      this.deactivate();
      return;
    } else {
      stepTime = 0; // comes in immediately
    }
    
    this.isHittable = false;
    
    // Update positions to work with variable camera position
    orbitPosition = new THREE.Vector3(galaxies.engine.VISIBLE_RADIUS * 0.9,0,0),
    orbitPosition.z = galaxies.utils.getConifiedDepth( orbitPosition );
    var idleZ = galaxies.engine.CAMERA_Z + 10;
    idlePosition = new THREE.Vector3( 1, 0, idleZ );//new THREE.Vector3( orbitPosition.x, 0, idleZ );
    //
    
    console.log( galaxies.engine.VISIBLE_RADIUS );
    laserOrient.scale.set( galaxies.engine.VISIBLE_RADIUS * 1.7, 1, 1);
    
    console.log( galaxies.engine.VISIBLE_RADIUS, orbitPosition, idleZ );
    
    lastPosition = idlePosition;
    targetPosition = idlePosition;
    this.object.position.copy( idlePosition );
    
    
    // silence it!
    this.ufoSound.volume = 0;
    
  }
  
  this.activate = function() {
    this.reset();
    
    galaxies.engine.rootObject.add( anchor );
    
  }
  this.deactivate = function() {
    this.state = 'inactive';
    
    this.isHittable = false;
    lastPosition = idlePosition;
    targetPosition = idlePosition;
    this.object.position.copy( idlePosition );
    this.ufoSound.volume=0;
    
    galaxies.engine.rootObject.remove( anchor );
  }
  
  
  this.deactivate();
  
}
