"use strict";

this.galaxies = this.galaxies || {};

galaxies.fx = (function() {
  var CHARACTER_FLY_SPEED = 5;
  var CHARACTER_TUMBLE_SPEED = 3;
  

  var rubbleMaterial = new THREE.MeshLambertMaterial( {
    color: 0x847360,
    opacity: 1.0,
    transparent: true } );
  
  var Rubble = function( geometry, material, scale ) {
    
    this.object = new THREE.Mesh( geometry, material.clone());
    this.baseScale = scale * ( Math.random() + 0.5 );
    this.object.scale.set( this.baseScale, this.baseScale, this.baseScale );
    this.object.rotation.set( THREE.Math.randFloatSpread(galaxies.utils.PI_2), THREE.Math.randFloatSpread(galaxies.utils.PI_2), THREE.Math.randFloatSpread(galaxies.utils.PI_2) );
    this.velocity = new THREE.Vector3(0,0,0);
    this.rotationAxis = new THREE.Vector3( Math.random()-0.5, Math.random()-0.5, Math.random()-0.5 );
    this.rotationAxis.normalize();
    this.rotationSpeed = (Math.random() - 0.5) * 10;
    
    this.reset();
  }
  Rubble.prototype.update = function(delta) {
    if ( !this.active) { return; }
    this.object.rotateOnAxis( this.rotationAxis, this.rotationSpeed * delta );
    this.object.position.set( this.object.position.x + this.velocity.x*delta,
                              this.object.position.y + this.velocity.y*delta,
                              this.object.position.z + this.velocity.z*delta );
    
    //this.object.material.opacity = (this.lifetime - this.lifeTimer)/this.lifetime;
    var scale = this.baseScale * (this.lifetime - this.lifeTimer)/this.lifetime;
    this.object.scale.set( scale, scale, scale );
    
    this.lifeTimer += delta;
    if ( this.lifeTimer >= this.lifetime ) {
      this.active = false;
      galaxies.engine.rootObject.remove( this.object );
    }
  }
  Rubble.prototype.reset = function() {
    this.lifeTimer = 0;
    this.active = true;
    this.lifetime = 1;
    galaxies.engine.rootObject.add( this.object );
  }
  
  // Simple array for pooling proj hit effect. We cannot use the particle
  // engine's pooling system because that works at the emitter level. We need
  // to set the orientation of each emitter, so we must work at the group level.
  var projHitPool = [];
  var projHitIndex = 0;
  var projHitPoolSize = 3;
  
  // Rubble objects for asteroid destruction
  var rubblePool = {};
  var rubbleIndex = {};
  var rubbleSetSize = 8; // How many pieces to use for each exploding roid
  var rubblePoolSize = 24;
  
  // Debris objects for satellite destruction
  var debrisPool = [];
  var debrisIndex = 0;
  var debrisSetSize = 8;
  var debrisPoolSize = 16;
  
  var planetRubbleHolder;
  var planetParticleGroups = [];
  
  // Firework particle group for exploding comets
  var FIREWORKS_DECELERATION = 15;
  var fireworksGroup;
  
  var hearticlesGroup;
  var stariclesGroup;
  
  var teleportEmitter, teleportGroup;
  var teleportSprite, teleportAnimator;
  var TELEPORT_TIME_MS = 1500;
  var TELEPORT_TIME_HALF_MS = TELEPORT_TIME_MS/2;
  var teleporting = false;
  
  // projectile hit particles
  var emitterSettings = {
    type: SPE.distributions.BOX,
    position: { spread: new THREE.Vector3(0.1, 0.1, 0.1) },
    //radius: 0.1,
    velocity: { value: new THREE.Vector3(0, 0, 4),
                spread: new THREE.Vector3(3, 3, 6) },
    //speed: 1,
    size: { value: [ 0.4, 0.3 ],
            spread: [0.1] },
    opacity: { value:[ 1, 0 ] },
    color: { value: [ new THREE.Color("hsl(0, 0%, 70%)"),
                      new THREE.Color("hsl(0, 0%, 70%)") ] },
    particleCount: 40,
    alive: false,
    maxAge: { value: 0.25, spread: 0 },
    duration: 0.05
  };
  
  var init = function() {
    
    // Projectile hit particles
    var texture = new THREE.Texture( galaxies.queue.getResult('projhitparticle') );
    texture.needsUpdate = true;
    for (var i=0; i<projHitPoolSize; i++ ) {
      var particleGroup = new SPE.Group({
        texture: { value: texture },
        blending: THREE.AdditiveBlending,
        transparent: true/*,
        depthTest: true,
        depthWrite: true*/
      });
      projHitPool[i] = particleGroup;
      galaxies.engine.rootObject.add( particleGroup.mesh );
      
      particleGroup.addPool( 1, emitterSettings, false );
    }
    
    // Rubble objects
    // plain
    rubblePool['plain'] = [];
    rubbleIndex['plain'] = 0;
    for (var i=0; i<rubblePoolSize; i++ ) {
      var rubbleObject = new Rubble( galaxies.resources.geometries['asteroid'],
                                     rubbleMaterial,
                                     0.1 );
      rubblePool['plain'][i] = rubbleObject;
    }
    // ice
    rubblePool['ice'] = [];
    rubbleIndex['ice'] = 0;
    for (var i=0; i<rubblePoolSize; i++ ) {
      var rubbleObject = new Rubble( new THREE.BoxGeometry(0.2, 0.2, 0.2),
                                     galaxies.resources.materials['asteroidice'],
                                     1.0 );
      rubblePool['ice'][i] = rubbleObject;
    }
    // rad
    var radmat = new THREE.MeshLambertMaterial( {
      color: 0x60a173 } );
    
    rubblePool['rad'] = [];
    rubbleIndex['rad'] = 0;
    for (var i=0; i<rubblePoolSize; i++ ) {
      var rubbleObject = new Rubble( galaxies.resources.geometries['asteroid'],
                                     radmat,
                                     0.1 );
      rubblePool['rad'][i] = rubbleObject;
    }
    
    // Debris objects
    for (var i=0; i<debrisPoolSize; i++ ) {
      var debrisObject = new Rubble( galaxies.resources.geometries['debris'], galaxies.resources.materials['debris'], 0.2 );
      debrisPool[i] = debrisObject;
    }
    
    // Comet explode particles
    var cometParticleSettings = {
      type: SPE.distributions.SPHERE,
      particleCount: 200,
      duration: 0.1,
  //      particlesPerSecond: 1000,
  //      activeMultiplier: 1, // Tweak this to match the effect of the now-deprecated pps value
      maxAge: { value: 0.7,
                spread: 0.5 },
      position: { radius: 0.6 },
  //      speed: 5,
  //      speedSpread: 3,
      velocity: { value: new THREE.Vector3(20) },
                  //spread: new THREE.Vector3(2) }, // like this?
      acceleration: { value: new THREE.Vector3(-14) },
      //drag: { value: 1 },
      color: { value: [new THREE.Color("rgb(255, 255, 255)"), new THREE.Color("rgb(255, 150, 100)") ],//, new THREE.Color("rgb(0, 0, 0)"), ],
               spread: [new THREE.Vector3(), new THREE.Vector3(0.5, 0.7, 1)] },//new THREE.Vector3(0.5, 0.7, 1)] },
      opacity: { value: [1, 1, 1, 0.1] },
      size: { value: [10, 3, 1, 0.1 ] },
              //spread: [1, 0] }
    };
  
    var starTexture = new THREE.Texture( galaxies.queue.getResult('starparticle') );
    starTexture.needsUpdate = true;
    fireworksGroup = new SPE.Group({
      texture: { value: starTexture },
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    fireworksGroup.addPool( 10, cometParticleSettings, true ); // 3
    
    //fireworksGroup.mesh.rotation.x = Math.PI/2;
    galaxies.engine.rootObject.add ( fireworksGroup.mesh );
  
    // Planet splode
    planetRubbleHolder = new THREE.Object3D();
    planetRubbleHolder.scale.set(3,3,3);
    galaxies.engine.rootObject.add( planetRubbleHolder );
    
    // Planet particle systems
    var partsDust = {
      type: SPE.distributions.SPHERE,
      particleCount: 1000,
      duration: 0.1,
      activeMultiplier: 1,
      maxAge: { value: 2 },
      position: { radius: 0.1 },
      velocity: {
        value: new THREE.Vector3( 12, 0, 0),
        spread: new THREE.Vector3( 10, 0, 0),
      },
      drag: { value: 0.5 },
      color: {
        value: new THREE.Color(0.500, 0.500, 0.500),
        spread: new THREE.Vector3(0.4, 0.4, 0.4),
      },
      opacity: {
        value: [ 0.5, 0],
        spread: 0.8,
      },
      size: {
        value: 0.6,
        spread: 0.2,
      },
    };
    
    var groupDust = new SPE.Group({
      texture: { value: texture },
      blending: THREE.NormalBlending,
      transparent: true
    });
    
    groupDust.addEmitter( new SPE.Emitter( partsDust ) );
    groupDust.mesh.position.set( 0,0,1 );
    planetParticleGroups.push(groupDust);
    
    var partsFire = {
      type: SPE.distributions.SPHERE,
      particleCount: 200,
      duration: 0.1,
      activeMultiplier: 1,      //particlesPerSecond: 2000,
      maxAge: { value: 1.5 },
      position: { radius: 0.1 },
      velocity: { value: new THREE.Vector3(10,0,0),
                  spread: new THREE.Vector3(6,0,0) },
      acceleration: { value: new THREE.Vector3(0,0,-40) },
      color: { value: [new THREE.Color(0.800, 0.400, 0.100), new THREE.Color(0.5, 0.000, 0.000) ],
                spread: [new THREE.Vector3(0.1, 0.2, 0.4)] },
      opacity: { value: [0.5, 0],
                 spread: [0.8] },
      size: { value: [8, 6],
              spread: [6] }
    };
    
    var groupFire = new SPE.Group({
      texture: { value: texture },
      blending: THREE.AdditiveBlending
    });
    
    groupFire.addEmitter( new SPE.Emitter( partsFire ) );
    groupFire.mesh.position.set( 0,0,0.1 );
    planetParticleGroups.push(groupFire);

    // POWERUP and STAR particles
    var sparkleTexture = new THREE.Texture( galaxies.queue.getResult('sparkle') );
    sparkleTexture.needsUpdate = true;
    
    var partHearts = {
      type: SPE.distributions.SPHERE,
      particleCount: 10,
      duration: 0.1,
      activeMultiplier: 1,
      maxAge: { value: 0.8,
                spread: 0.3 },
      position: { radius: 0.1 },
      velocity: { value: new THREE.Vector3(2,0,0),
                  spread: new THREE.Vector3(1,0,0) },
      angle: { value: 0,
               spread: 360 },
      drag: { value: 0.5 },
      color: { value: new THREE.Color( 0xffcaca ) },
                //spread: new THREE.Vector3(0.0, 0.1, 0.1) },
      opacity: { value: [1,0.5] },
      size: { value: [1,0],
              spread: 0.5 }
    };
    
    hearticlesGroup = new SPE.Group({
      texture: { value: sparkleTexture },
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    hearticlesGroup.addPool( 1, partHearts, false );
    galaxies.engine.rootObject.add( hearticlesGroup.mesh );
    
    var partStar = {
      type: SPE.distributions.SPHERE,
      particleCount: 10,
      duration: 0.1,
      activeMultiplier: 1,
      maxAge: { value: 0.8,
                spread: 0.3 },
      position: { radius: 0.1 },
      velocity: { value: new THREE.Vector3(2,0,0),
                  spread: new THREE.Vector3(1,0,0) },
      angle: { value: 0,
               spread: 360 },
      drag: { value: 0.5 },
      color: { value: new THREE.Color( 0xffff00 ) },
                //spread: new THREE.Vector3(0.0, 0.1, 0.1) },
      opacity: { value: [1,0.5] },
      size: { value: [1,0],
              spread: 0.5 }
    };
    
    stariclesGroup = new SPE.Group({
      texture: { value: sparkleTexture },
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    stariclesGroup.addPool( 1, partStar, false );
    galaxies.engine.rootObject.add( stariclesGroup.mesh );
  
  
  
    
    
    
    
    
    
    // teleport
    var characterMap = new THREE.Texture( galaxies.queue.getResult('lux') );
    teleportAnimator = new galaxies.SpriteSheet(
      characterMap,
      [ [176,680,172,224,0,4,81.35],
        [350,680,172,224,0,4,81.35],
        [524,680,172,224,0,4,81.35],
        [698,680,172,224,0,4,81.35]    
        ], 
      30
      );
    characterMap.needsUpdate = true;
    
    var characterMaterial = new THREE.SpriteMaterial({
      map: characterMap,
      color: 0xffffff,
      transparent: true,
      opacity: 0.0
    } );
    teleportSprite = new THREE.Sprite( characterMaterial );
    teleportSprite.position.z = 0.1; // must appear in front of base character sprite
    
    /*
    var teleportParticles = {
      type: 'sphere',
      radius: 0.6,
      speed: 1,
      sizeStart: 1,
      sizeStartSpread: 0,
      sizeEnd: 1,
      opacityStart: 1,
      opacityEnd: 0,
      colorStart: new THREE.Color(1.000, 0.800, 0.300),
      colorStartSpread: new THREE.Vector3(0.1, 0.1, 0.1),
      colorEnd: new THREE.Color(0.500, 0.500, 0.800),
      particlesPerSecond: 100,
      particleCount: 100,
      alive: 0.0,
      duration: 0.25
    };
    teleportGroup = new SPE.Group({
      texture: starTexture,
      maxAge: 0.5,
      blending: THREE.AdditiveBlending
    });
    teleportEmitter = new SPE.Emitter( teleportParticles );
    teleportGroup.addEmitter( teleportEmitter );
    */
  } // init
  
  var showFireworks = function( position ) {
    // New rev of SPE does not require fancy workaround as we no longer have to fake particle drag.
    fireworksGroup.triggerPoolEmitter( 1, position );

    /*
    // Reproduces functionality of ShaderParticleGroup triggerPoolEmitter method.
    // This is necessary to access properties of the emitter that is being activated.
    var emitter = fireworksGroup.getFromPool();

    if ( emitter === null ) {
        console.log( 'SPE.Group pool ran out.' );
        return;
    }

    if ( position instanceof THREE.Vector3 ) {
        emitter._position.copy( position );
    }

    // Update emitter properties to fake drag
    var away = new THREE.Vector3();
    away.subVectors( position, galaxies.engine.camera.position);
    away.normalize();
    away.multiplyScalar( FIREWORKS_DECELERATION );
    emitter.acceleration = away;
    //
    
    emitter.enable();

    setTimeout( function() {
        emitter.disable();
        fireworksGroup.releaseIntoPool( emitter );
    }, fireworksGroup.maxAgeMilliseconds );
    */
  }
  
  var showHearticles = function( position ) {
    console.log( 'showHearticles' );
    //hearticlesGroup.mesh.position.copy( position );
    hearticlesGroup.triggerPoolEmitter( 1, position );
  }
  var showStaricles = function( position ) {
    stariclesGroup.triggerPoolEmitter( 1, position );
  }
  
  var showHit = function( position ) {
    //console.log("fx show hit at position", position );
    
    var particleGroup = projHitPool[ projHitIndex ];
    projHitIndex ++;
    if ( projHitIndex >= projHitPoolSize ) { projHitIndex = 0; }
    
    particleGroup.mesh.position.copy( position );
    particleGroup.mesh.lookAt( galaxies.engine.rootObject.position );
    particleGroup.triggerPoolEmitter(1);

  }
  
  var showRubble = function( type, position, velocity ) {
    if ( rubblePool[type] === undefined ) {
      return;
    }
    
    rubbleIndex[type] = showObjects( rubblePool[type], rubbleSetSize, rubbleIndex[type], position, velocity );
    
  }
  
  var showDebris = function( position, velocity ) {
    debrisIndex = showObjects( debrisPool, debrisSetSize, debrisIndex, position, velocity );
  }
  var showObjects = function( set, setSize, index, position, velocity ) {
    var poolSize = set.length;
    for ( var i=0; i<setSize; i++ ) {
      var rObject = set[index];
      rObject.object.position.copy( position );
      rObject.object.position.add( new THREE.Vector3( THREE.Math.randFloatSpread(0.5), THREE.Math.randFloatSpread(0.5), THREE.Math.randFloatSpread(0.5) ) );
      galaxies.engine.rootObject.add( rObject.object );
      
      //console.log( rObject.velocity, rObject.object.position, position );
      rObject.velocity.subVectors( rObject.object.position, position );
      rObject.velocity.normalize();
      rObject.velocity.add( velocity );
      
      rObject.reset();
      
      index++;
      if ( index >= poolSize ) { index = 0; }
    }
    return index;
  }
  
  var showPlanetSplode = function() {
    console.log("planet splode");
    // hide planet
    galaxies.engine.rootObject.remove( galaxies.engine.planet );
    
    // rubble
    for ( var i=0; i<rubblePoolSize; i++ ) {
      var rObject = rubblePool['plain'][i];
      rObject.object.position.set( THREE.Math.randFloatSpread(0.5), THREE.Math.randFloatSpread(0.5), THREE.Math.randFloatSpread(0.5) );
      
      rObject.velocity.copy( rObject.object.position );
      rObject.velocity.normalize();
      rObject.velocity.multiplyScalar(2);
      
      rObject.reset();
      rObject.lifetime = 6; // increase life for this effect
      planetRubbleHolder.add( rObject.object ); // move object to special holder that scales up the rubble
      
    }
    
    // particles
    for ( var i=0; i<planetParticleGroups.length; i++ ) {
      var group = planetParticleGroups[i];
      galaxies.engine.rootObject.add( group.mesh );
      
      var emitter = planetParticleGroups[i].emitters[0]; // Only one per group.
      emitter.enable();
      
      /*
      // closure to hold references to the groups and emitters
      (function() {
        var emitterRef = emitter;
        var groupRef = group;
        setTimeout( function() {
          emitterRef.disable();
          galaxies.engine.rootObject.remove( groupRef.mesh );
        }, (emitterRef.options.maxAge.value + emitterRef.options.maxAge.spread)*1000 );
      })();
      */
    }
    
    // pose lux
    galaxies.engine.characterAnimator.updateFrame(10);
    
    // play the sound
    new galaxies.audio.PositionedSound({
      source: galaxies.audio.getSound('planetsplode'),
      position: galaxies.engine.rootObject.position,
      baseVolume: 16,
      loop: false
    });
    
  }
  
  var showTeleportOut = function() {
    galaxies.engine.character.add( teleportSprite );
    teleportSprite.material.rotation = galaxies.engine.character.material.rotation;
    teleportSprite.material.opacity = 0;
    teleportAnimator.play(-1); // negative loop count will loop indefinitely
    
    // fade in and out
    createjs.Tween.removeTweens( teleportSprite.material );
    createjs.Tween.get( teleportSprite.material )
      .to( { opacity: 1 }, TELEPORT_TIME_HALF_MS )
      .set( { opacity: 0 }, galaxies.engine.character.material )
      .to( { opacity: 0 }, TELEPORT_TIME_HALF_MS )
      .call( teleportEffectComplete, this );
    
    teleporting = true;

  }
  var teleportEffectComplete = function() {
    teleportAnimator.stop();
    teleportSprite.parent.remove(teleportSprite);
    teleporting = false;
    
  }
  var showTeleportIn = function( callback ) {
    // Set character to vertical position (this will work because user cannot move during transition).
    galaxies.engine.angle = 0;
    galaxies.engine.targetAngle = 0;
    
    galaxies.engine.character.add( teleportSprite );
    teleportSprite.material.rotation = galaxies.engine.character.material.rotation;
    teleportSprite.material.opacity = 0;
    teleportAnimator.play(-1); // negative loop count will loop indefinitely
    galaxies.engine.character.material.opacity = 0;
    
    // fade in and out
    createjs.Tween.removeTweens( teleportSprite.material );
    createjs.Tween.get( teleportSprite.material )
      .to( { opacity: 1 }, TELEPORT_TIME_HALF_MS )
      .set( { opacity: 1 }, galaxies.engine.character.material )
      .to( { opacity: 0 }, TELEPORT_TIME_HALF_MS )
      .call( teleportEffectComplete, this )
      .call( callback, this );
      
    teleporting = true;
      
  }
  
  var distortionPool = [];
  var showDistortionCircle = function( position, radius ) {
    return; // TEST - no distortion sphere
  
    // Transform position to equivalent screen space behind planet distance
    var pos = position.clone();
    pos.sub(galaxies.engine.camera.position);
    var baseDistance = pos.length();
    pos.setLength( 2*galaxies.engine.CAMERA_Z );
    radius = radius * pos.length()/baseDistance;
    pos.add(galaxies.engine.camera.position);
    //
    
    var material = new THREE.MeshBasicMaterial( {
      color: 0xffffff,
      envMap: galaxies.resources.skyRefract,
      refractionRatio: 0.9,
      transparent: true,
      opacity: 1
      } );
    var geometry = new THREE.SphereGeometry(radius, 24, 24);
    var mesh = new THREE.Mesh( geometry, material );
    mesh.position.copy( pos );
    galaxies.engine.rootObject.add( mesh );
    
    // Add to collection pool
    distortionPool.push( mesh );
  }
  
  
  
  
  var update = function( delta ) {
    for ( var i=0; i<projHitPoolSize; i++ ) {
      projHitPool[i].tick( delta );
    }
    for ( var type in rubblePool ) {
      for ( var i=0; i<rubblePoolSize; i++ ) {
        rubblePool[type][i].update(delta);
      }
    }
    for ( var i=0; i<debrisPoolSize; i++ ) {
      debrisPool[i].update(delta);
    }
    fireworksGroup.tick(delta);
    hearticlesGroup.tick(delta);
    stariclesGroup.tick(delta);
    
    for ( var i=0; i<planetParticleGroups.length; i++ ) {
      planetParticleGroups[i].tick(delta);
    }
    
    // lux flying away
    // planet.parent is used to test if planet exploded to prevent Lux from flying away from a won game.
    if (galaxies.engine.isGameOver && (galaxies.engine.planet.parent == null) ) {
      galaxies.engine.character.position.y = galaxies.engine.character.position.y + CHARACTER_FLY_SPEED * delta;
      galaxies.engine.character.rotation.z = galaxies.engine.character.rotation.z + CHARACTER_TUMBLE_SPEED * delta;
      galaxies.engine.character.material.rotation = galaxies.engine.character.rotation.z;
    }
    
    if ( teleporting ) {
      teleportAnimator.update( delta );
      teleportSprite.material.rotation = galaxies.engine.character.material.rotation;
    }
    // teleport particles
    // TODO only update these when active
    // teleportGroup.tick(delta );
    
    
    // step through distortion collection
    // change radius and refractive index
    // remove objects when refractive index is 0
    for ( var i=0, len=distortionPool.length; i<len; i++ ) {
      var distortion = distortionPool[i];
      
      if (distortion.material.refractionRatio>=1) {
        continue;
      }
      distortion.material.refractionRatio = distortion.material.refractionRatio + delta * 0.1;
      distortion.material.opacity = (1 - distortion.material.refractionRatio)/ 0.1;
      var scale = 1 - 0.3 * distortion.material.opacity;
      distortion.scale.set( scale, scale, scale);
      if (distortion.material.refractionRatio>=1) {
        galaxies.engine.rootObject.remove( distortion );
      }
    }
    
      // GLOW VIEW VECTORS
      for (var i=0, len = glowbjects.length; i<len; i++ ) {
      var toCamera = glowbjects[i].worldToLocal( galaxies.engine.camera.localToWorld( new THREE.Vector3() ) );
      //toCamera = glowbjects[i].worldToLocal( toCamera );
      glowbjects[i].material.uniforms.viewVector.value = toCamera;
    }
  }
  
  var shakeCamera = function( magnitude, duration ) {
    // Make sure camera is reset before applying shake tween
    galaxies.engine.camera.rotation.x = 0; 
    galaxies.engine.camera.rotation.y = 0;
    
    if ( typeof(duration)!=='number' ) {
      duration = 500;
    } else {
      duration = duration*1000;
    }
    
    magnitude = 0.01 * magnitude;
    
    // Frequency is dependent on duration because easing function uses a normalized 0-1 value, not
    // an elapsed time value. This keeps shake the same no matter the duration.
    var freqX = duration/17;
    var freqY = duration/18;
    
    createjs.Tween.get(galaxies.engine.camera.rotation)
      .to({x:magnitude, override:true }, duration, galaxies.utils.getShakeEase(freqX) )
      .to( {x:0}, 0); // reset position
    createjs.Tween.get(galaxies.engine.camera.rotation)
      .to({y:magnitude, override:true }, duration, galaxies.utils.getShakeEase(freqY) )
      .to( {y:0}, 0); // reset position
    //createjs.Tween.get(camera.rotation).to({x:0}, 1000, createjs.Ease.quadOut );
  }
  
  // GLOW
  // awkward shader include
  var glowVertexShader = [
  'uniform vec3 viewVector;',
  'uniform float c;',
  'uniform float p;',
  'varying float intensity;',
  'void main() ',
  '{',
  '  vec3 vNormal = normalize( normalMatrix * normal );',
  '	 vec3 vNormel = normalize( normalMatrix * viewVector );',
  '  intensity = pow( c - dot(vNormal, vNormel), p );',
  '  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
  '}'
  ].join("\n");
  
  var glowFragmentShader = [
  'uniform vec3 glowColor;',
  'varying float intensity;',
  'void main() ',
  '{',
  '	vec3 glow = glowColor * intensity;',
  '    gl_FragColor = vec4( glow, 1.0 );',
  '}'
  ].join("\n");
  
  var baseGlowMaterial = new THREE.ShaderMaterial( 
  {
      uniforms: 
      { 
          "c":   { type: "f", value: 0.1 },
          "p":   { type: "f", value: 2.5 },
          glowColor: { type: "c", value: new THREE.Color(0x00ff00) },
          viewVector: { type: "v3", value: new THREE.Vector3() }
      },
      vertexShader:   glowVertexShader,
      fragmentShader: glowFragmentShader,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
  } );
		
  var glowbjects = [];
  
  // baseObject must use BufferGeometry.
  var addGlowbject = function( baseObject, hexColor ) {
    var material = baseGlowMaterial.clone();
    material.uniforms.glowColor.value = new THREE.Color( hexColor );
    
    var glowbject = new THREE.Mesh( baseObject.geometry,
                                    material );
    glowbject.position.set(0,0,0);
    glowbject.scale.set(1.3, 1.3, 1.3); // Scale it up to be visible. This would be better as an inflation function or a custom piece of geometry.
    baseObject.add( glowbject );
      
    glowbjects.push( glowbject );
  }
  var removeGlowbject = function( baseObject ) {
    // iterate through children
    for( var i=0, len = baseObject.children.length; i<len; i++ ) {
      var child = baseObject.children[i];
      var index = glowbjects.indexOf(child);
      if ( index >=0 ) { 
        glowbjects.splice( index, 1 );
      }
    }
  }
  
  
  
            
  return {
    init: init,
    update: update,
    showHit: showHit,
    showFireworks: showFireworks,
    showRubble: showRubble,
    showPlanetSplode: showPlanetSplode,
    showTeleportOut: showTeleportOut,
    showTeleportIn: showTeleportIn,
    shakeCamera: shakeCamera,
    showDebris: showDebris,
    showDistortionCircle: showDistortionCircle,
    addGlowbject: addGlowbject,
    showHearticles: showHearticles,
    showStaricles: showStaricles,
  };
})();