"use strict";

this.galaxies = this.galaxies || {};

this.galaxies.Ufo = function() {
  this.points = 2000;
  this.hitThreshold = 0.7;
  
  this.object = new THREE.Object3D();
  this.rootPosition = galaxies.utils.rootPosition(this.object);
  this.model = galaxies.resources.geometries['ufo'].clone();
  this.model.children[0].material = galaxies.resources.materials['ufo'].clone();
  this.model.children[1].material = galaxies.resources.materials['ufocanopy'].clone();
  
  
  this.model.scale.set(0.6, 0.6, 0.6);
  this.model.rotation.set(Math.PI,0,-Math.PI/2);
  
  this.waggler = new THREE.Object3D();
  this.waggler.add( this.model );
  this.object.add( this.waggler );
  
  var trunkMap = new THREE.Texture( galaxies.queue.getResult('trunkford') );
  trunkMap.needsUpdate = true;
  var trunkMat = new THREE.MeshBasicMaterial({
    map: trunkMap,
    color: 0xffffff,
    transparent: true,
    side: THREE.DoubleSide
  } );
  var trunkford = new THREE.Mesh( new THREE.PlaneGeometry(1.23,1), trunkMat ); // 1.23 is aspect ratio of texture
  trunkford.position.set( 0, 0.35, 0 );
  trunkford.scale.set(1.4, 1.4, 1.4);
  trunkford.rotation.set( 0, Math.PI, 0 );
  this.model.add( trunkford );
  
  var anchor = new THREE.Object3D();
  anchor.add( this.object );
  
  this.state = 'inactive'; // values for state: idle, in, orbit, out, inactive
  var stepTimer = 0;
  var prevStepTimer = 0;
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
    maxParticleCount: 100
  });
  var laserChargeEmitter = new SPE.Emitter( laserChargeParticles );
  laserChargeGroup.addEmitter( laserChargeEmitter );
  laserChargeGroup.mesh.position.x = -0.5;
  
  
  var smokeParticles = {
    type: SPE.distributions.BOX,
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
    }
  };
  var smokeTexture = new THREE.Texture( galaxies.queue.getResult('smoke') );
  smokeTexture.needsUpdate = true;
  var smokeGroup = new SPE.Group({
    texture: { value: smokeTexture },
    blending: THREE.NormalBlending,
    transparent: true,
    maxParticleCount: 100
  });
  var smokeEmitter = new SPE.Emitter( smokeParticles );
  smokeGroup.addEmitter( smokeEmitter );
  smokeEmitter.disable();
  this.object.add( smokeGroup.mesh );
  
  
  
  this.object.add( laserChargeGroup.mesh );

  var laserOrient = new THREE.Object3D();
  laserOrient.position.set(-0.5, 0, 0);
  laserOrient.rotation.set(0,2.03,0); // This angle set so beam of given length intersects with planet.

  var laserGeometry = new THREE.PlaneGeometry( 1, 0.3 ); // beam is scaled on reset to match orbital distance
  var laserTexture = new THREE.Texture(
    galaxies.queue.getResult('laserbeam') );
  laserTexture.needsUpdate = true;
  var laserMaterial = new THREE.MeshBasicMaterial( {
    map: laserTexture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending
  } );
  var laserBeam = new THREE.Mesh( laserGeometry, laserMaterial );
  laserBeam.position.set(0.5, 0, 0);
  laserOrient.add( laserBeam );
  
  // Sound!
  this.ufoSound = new galaxies.audio.ObjectSound( galaxies.audio.getSound('ufo'), this.object, 0 );
  //directionalSources.push( ufoSound );
  
  var idleZ = galaxies.engine.CAMERA_Z + 10;
  var idlePosition = new THREE.Vector3(galaxies.engine.VISIBLE_RADIUS * 1.8,0,idleZ);

  var orbitPositions = [
    new THREE.Vector3(galaxies.engine.VISIBLE_RADIUS,0,0),
    new THREE.Vector3(galaxies.engine.VISIBLE_RADIUS * 0.9,0,0),
    new THREE.Vector3(galaxies.engine.VISIBLE_RADIUS * 0.75,0,0)
  ];
  orbitPositions[0].z = galaxies.utils.getConifiedDepth( orbitPositions[0] );
  orbitPositions[1].z = galaxies.utils.getConifiedDepth( orbitPositions[1] );
  orbitPositions[2].z = galaxies.utils.getConifiedDepth( orbitPositions[2] );
  var orbitPosition = orbitPositions[1];
  
  
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
  this.spinOut = false;
  
  this.update = function( delta ) {
    if (this.state === "inactive") {
      return;
    }

    prevStepTimer = stepTimer;
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
        createjs.Tween.get(this.model.rotation).wait(2000).to({y: Math.PI/6}, 2000, createjs.Ease.quadOut );
        
        new galaxies.audio.PositionedSound({
          source: galaxies.audio.getSound('trunkfordlaugh'),
          position: new THREE.Vector3(0,0,galaxies.engine.CAMERA_Z + 0.5),
          baseVolume: 3,
          loop: false
        });
        

      }
      break;
    case 'in':
      angle = inTween( stepTimer );

      if (stepTimer >= 1.5 && prevStepTimer < 1.5) {
        galaxies.fx.shakeCamera(1, 1.5);
      }
      
      if ( stepTimer >= stepTime ) {
        this.state = 'orbit';
        stepTime = 1;//(Math.PI*2/3)/angularSpeed; // time between shots
        transitionTime = stepTime/4;
        stepTimer = 0;
        step = 0;
        lastPosition = this.object.position.clone();
        targetPosition = orbitPosition;
      }
      break;
    case 'orbit':
      angle += angularSpeed * delta;
      
      if ( stepTimer >= stepTime ) {
        // Fire
        laserChargeEmitter.enable();
        createjs.Tween.get(laserBeam).wait(1000).call( function() {
          new galaxies.audio.PositionedSound({
            source: galaxies.audio.getSound('ufoshoot'),
            position: this.rootPosition,
            baseVolume: 1.5,
            loop: false
          });
          
          this.object.add(laserOrient);
          laserBeam.material.opacity = 1;
  
          createjs.Tween.get(laserBeam.material).to({opacity:0}, 300, createjs.Ease.quadOut).call( function() {
            this.object.remove(laserOrient);
          }, null, this );
          
          laserOrient.rotation.z = (Math.round( Math.random() )* 2 - 1) * Math.PI/16;
          
          if ( step > 2 ) {
            laserOrient.rotation.z = 0;

            galaxies.engine.hitPlayer();

            galaxies.fx.showHit(new THREE.Vector3(Math.cos(anchor.rotation.z), Math.sin(anchor.rotation.z), 0).multiplyScalar(galaxies.engine.PLANET_DISTANCE), "green");

            new galaxies.audio.PositionedSound({
              source: galaxies.audio.getSound('trunkfordlaugh'),
              position: new THREE.Vector3(0,0,galaxies.engine.CAMERA_Z + 0.5),
              baseVolume: 3,
              loop: false
            });

            this.leave();
            laserOrient.rotation.z = 0;
          }

        }, null, this );
        step++;
        stepTimer = 0;
        stepTime = 2.5;
      }
      
      break;
    case 'out':
      angle = THREE.Math.mapLinear( stepTimer, 0, transitionTime/2, lastAngle, targetAngle );
        
      if (this.spinOut) {
        this.waggler.rotation.z -= delta * 3 * Math.PI; // 90 RPM
      } else {
        if (stepTimer >= 1 && prevStepTimer < 1) {
          galaxies.fx.shakeCamera(1, 1.5);
        }
      }
      
      if ( stepTimer >= stepTime ) {
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
    engineLevel = THREE.Math.clamp( engineLevel, 0.5, 5 );
    this.ufoSound.volume = engineLevel;
    //
    
    laserChargeGroup.tick(delta);
    smokeGroup.tick(delta);

    this.rootPosition = galaxies.utils.rootPosition(this.object);
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
    
    // Tip to show bubble
    createjs.Tween.removeTweens( this.model.rotation );
    createjs.Tween.get(this.model.rotation).to({y: Math.PI/3}, 2000, createjs.Ease.quadIn );
    
    //console.log( 'orbit -> out' );
  }
  
  this.hit = function( damage, forceDestroy ) {
    if (typeof damage !== "number") {
      damage = 1;
    }

    if ( forceDestroy ) {
      hitCounter = HITS;
    } else {
      hitCounter += damage;
    }

    var self = this;

    createjs.Tween.removeTweens( this.waggler.rotation );
    
    if ( hitCounter >= HITS ) {
      this.spinOut = true;
      this.isHittable = false;
      this.leave();

      galaxies.engine.showCombo( this.points, 1, this.object );
      galaxies.fx.explode(this.rootPosition);
    } else {
      // waggle
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
    }
    
    smokeEmitter.enable();
        
    // play sound
    new galaxies.audio.PositionedSound({
      source: galaxies.audio.getSound('ufohit'),
      position: this.rootPosition,
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

    this.waggler.rotation.z = 0;
    this.spinOut = false;
    
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
    idlePosition = new THREE.Vector3( galaxies.engine.VISIBLE_RADIUS * 1.8, 0, idleZ );//new THREE.Vector3( orbitPosition.x, 0, idleZ );
    //
    
    laserOrient.scale.set( galaxies.engine.VISIBLE_RADIUS * 1.7, 1, 1);
    
    lastPosition = idlePosition;
    targetPosition = idlePosition;
    this.object.position.copy( idlePosition );
    
    
    // silence it!
    this.ufoSound.volume = 0;
    
  }
  
  this.activate = function() {
    this.reset();
    
    galaxies.engine.rootObject.add( anchor );
    galaxies.engine.planeSweep.add(this);
    
  }
  this.deactivate = function() {
    this.state = 'inactive';

    galaxies.engine.planeSweep.remove(this);
    
    this.isHittable = false;
    lastPosition = idlePosition;
    targetPosition = idlePosition;
    this.object.position.copy( idlePosition );
    this.ufoSound.volume=0;
    
    galaxies.engine.rootObject.remove( anchor );
  }

  this.introduceBoss = function () {
    var model = this.model,
        objectPosition = this.object.position;

    anchor.rotation.set(0, 0, 0);

    model.rotation.set(Math.PI / 8, Math.PI, 0);
    this.waggler.rotation.set(0, 0, 0);
    if (smokeEmitter.age) {
      smokeEmitter.reset(true);
    }

    objectPosition.set(12, -1, galaxies.engine.CAMERA_Z - 8);

    galaxies.engine.rootObject.add(anchor);

    galaxies.engine.removeInputListeners();
    galaxies.ui.hideReticle();
    galaxies.engine.targetAngle = 0;

    createjs.Tween.get(objectPosition)
        .to({x: 2, y: -1}, 2000, createjs.Ease.cubicOut)
        .call(function () {
          new galaxies.audio.SimpleSound({
            source: galaxies.audio.getSound('unleashthebeast'),
            loop: false
          });
        })
        .to({x: 1.9, y: -1.1}, 1000, createjs.Ease.sineInOut)
        .to({x: 2.1, y: -1}, 1000, createjs.Ease.sineInOut)
        .to({x: 2, y: -0.9}, 1000, createjs.Ease.sineInOut)
        .to({y: -1}, 1000, createjs.Ease.sineInOut)
        .to({x: 1.9}, 1000, createjs.Ease.sineInOut)
        .to({y: -0.9}, 1500, createjs.Ease.sineInOut)
        .call(function() {
          galaxies.engine.boss.enter();
          galaxies.engine.addInputListeners();
          galaxies.ui.showReticle();
        })
        .to({x: -12}, 2000, createjs.Ease.cubicIn)
        .call(function () {
          galaxies.engine.rootObject.remove(anchor);
          model.rotation.set(Math.PI,0,-Math.PI/2);
          objectPosition.set(0, 0, 0);
        });
  };
  
  
  this.deactivate();
  
}
