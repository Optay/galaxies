"use strict";

this.galaxies = this.galaxies || {};

galaxies.fx = (function() {
  var CHARACTER_FLY_SPEED = 5;
  var CHARACTER_TUMBLE_SPEED = 3;
  
  
  var Rubble = function() {
    var rubbleMaterial = new THREE.MeshLambertMaterial( {
      color: 0x847360,
      opacity: 1.0,
      transparent: true } );
    
    this.object = new THREE.Mesh( geometries['asteroid'], rubbleMaterial );
    var scale = Math.random() * 0.1 + 0.05;
    this.object.scale.set( scale, scale, scale );
    this.velocity = new THREE.Vector3(0,0,0);
    this.rotationAxis = new THREE.Vector3( Math.random()-0.5, Math.random()-0.5, Math.random()-0.5 );
    this.rotationAxis.normalize();
    this.rotationSpeed = (Math.random() - 0.5) * 10;
    this.active = false;
    
    this.lifetime = 2;
    this.lifeTimer = 0;
  }
  Rubble.prototype.update = function(delta) {
    if ( !this.active) { return; }
    this.object.rotateOnAxis( this.rotationAxis, this.rotationSpeed * delta );
    this.object.position.set( this.object.position.x + this.velocity.x*delta,
                              this.object.position.y + this.velocity.y*delta,
                              this.object.position.z + this.velocity.z*delta );
    
    this.object.material.opacity = (this.lifetime - this.lifeTimer)/this.lifetime;
    this.lifeTimer += delta;
    if ( this.lifeTimer >= this.lifetime ) {
      this.active = false;
      rootObject.remove( this.object );
    }
  }
  Rubble.prototype.reset = function() {
    this.lifeTimer = 0;
    this.active = true;
    this.lifetime = 2;
    rootObject.add( this.object );
  }
  
  // projectile hit particles
  var emitterSettings = {
    type: 'cube',
    positionSpread: new THREE.Vector3(0.1, 0.1, 0.1),
    //radius: 0.1,
    velocity: new THREE.Vector3(0, 0, 7),
    velocitySpread: new THREE.Vector3(3, 3, 10),
    //speed: 1,
    sizeStart: 0.2,
    sizeStartSpread: 0.1,
    sizeEnd: 0.15,
    opacityStart: 1,
    opacityEnd: 0,
    colorStart: new THREE.Color("hsl(0, 0%, 70%)"),
    //colorStartSpread: new THREE.Vector3(255, 0, 0),
    colorEnd: new THREE.Color("hsl(0, 0%, 70%)"),
    particleCount: 40,
    alive: 0,
    duration: 0.05
  };
  
  // Simple array for pooling proj hit effect. We cannot use the particle
  // engine's pooling system because that works at the emitter level. We need
  // to set the orientation of each emitter, so we must work at the group level.
  var projHitPool = [];
  var projHitIndex = 0;
  var projHitPoolSize = 3;
  
  // Rubble objects for asteroid destruction
  var rubblePool = [];
  var rubbleIndex = 0;
  var rubbleSetSize = 8; // How many pieces to use for each exploding roid
  var rubblePoolSize = 24;
  
  var planetRubbleHolder;
  var planetParticleGroups = [];
  
  // Firework particle group for exploding comets
  var fireworksGroup;
  
  var teleportEmitter, teleportGroup;
  
  var init = function() {
    
    // Projectile hit particles
    var texture = new THREE.Texture( galaxies.queue.getResult('projhitparticle') );
    texture.needsUpdate = true;
    for (var i=0; i<projHitPoolSize; i++ ) {
      var particleGroup = new SPE.Group({
        texture: texture,
        maxAge: 0.5,
        blending: THREE.NormalBlending//THREE.AdditiveBlending
      });
      projHitPool[i] = particleGroup;
      rootObject.add( particleGroup.mesh );
      
      particleGroup.addPool( 1, emitterSettings, false );
    }
    
    // Rubble objects
    for (var i=0; i<rubblePoolSize; i++ ) {
      var rubbleObject = new Rubble();
      rubblePool[i] = rubbleObject;
    }
    
    // Comet explode particles
    var cometParticleSettings = {
        type: 'sphere',
        radius: 0.6,
        acceleration: new THREE.Vector3(0,0,-40),//THREE.Vector3(0,-40,0),
        speed: 10,
        speedSpread: 5,
        sizeStart: 2,
        sizeStartSpread: 1,
        sizeEnd: 1,
        opacityStart: 1,
        opacityEnd: 0.5,
        colorStart: new THREE.Color("rgb(255, 150, 100)"),
        colorStartSpread: new THREE.Vector3(0.5, 0.7, 1),
        colorEnd: new THREE.Color("rgb(0, 0, 0)"),
        particlesPerSecond: 1000,
        particleCount: 200,
        alive: 1.0,
        duration: 0.1
    };
      
    var starTexture = new THREE.Texture( galaxies.queue.getResult('starparticle') );
    starTexture.needsUpdate = true;
    fireworksGroup = new SPE.Group({
      texture: starTexture,
      maxAge: 1,
      blending: THREE.AdditiveBlending
    });
    fireworksGroup.addPool( 3, cometParticleSettings, true );
    
    //fireworksGroup.mesh.rotation.x = Math.PI/2;
    rootObject.add ( fireworksGroup.mesh );
  
    // Planet splode
    planetRubbleHolder = new THREE.Object3D();
    planetRubbleHolder.scale.set(3,3,3);
    rootObject.add( planetRubbleHolder );
    
    // Planet particle systems
    var partsDust = {
      type: 'sphere',
      radius: 0.1,
      speed: 12,
      speedSpread: 10,
      sizeStart: 0.6,
      sizeStartSpread: 0.2,
      sizeEnd: 0.6,
      opacityStart: 0.5,
      opacityStartSpread: 0.8,
      opacityEnd: 0,
      colorStart: new THREE.Color(0.500, 0.500, 0.500),
      colorStartSpread: new THREE.Vector3(0.4, 0.4, 0.4),
      particlesPerSecond: 10000,
      particleCount: 1000,
      alive: 0,
      duration: 0.1
    };
    
    var groupDust = new SPE.Group({
      texture: texture,
      maxAge: 2,
      blending: THREE.NormalBlending
    });
    
    groupDust.addEmitter( new SPE.Emitter( partsDust ) );
    groupDust.mesh.position.set( 0,0,1 );
    planetParticleGroups.push(groupDust);
    
    var partsFire = {
      type: 'sphere',
      radius: 0.1,
      acceleration: new THREE.Vector3(0,0,-40),
      speed: 10,
      speedSpread: 6,
      sizeStart: 8,
      sizeStartSpread: 6,
      sizeEnd: 6,
      opacityStart: 0.5,
      opacityStartSpread: 0.8,
      opacityEnd: 0,
      colorStart: new THREE.Color(0.800, 0.400, 0.100),
      colorStartSpread: new THREE.Vector3(0.1, 0.2, 0.4),
      colorEnd: new THREE.Color(0.5, 0.000, 0.000),
      particlesPerSecond: 2000,
      particleCount: 200,
      alive: 0,
      duration: 0.1
    };
    
    var groupFire = new SPE.Group({
      texture: texture,
      maxAge: 1.5,
      blending: THREE.AdditiveBlending
    });
    
    groupFire.addEmitter( new SPE.Emitter( partsFire ) );
    groupFire.mesh.position.set( 0,0,0.1 );
    planetParticleGroups.push(groupFire);

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
    
  } // init
  
  var showFireworks = function( position ) {
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
    away.subVectors( position, camera.position);
    away.normalize();
    away.multiplyScalar( 40 );
    emitter.acceleration = away;
    //
    
    emitter.enable();

    setTimeout( function() {
        emitter.disable();
        fireworksGroup.releaseIntoPool( emitter );
    }, fireworksGroup.maxAgeMilliseconds );

  }
  
  var showHit = function( position ) {
    //console.log("fx show hit at position", position );
    
    var particleGroup = projHitPool[ projHitIndex ];
    projHitIndex ++;
    if ( projHitIndex >= projHitPoolSize ) { projHitIndex = 0; }
    
    particleGroup.mesh.position.copy( position );
    particleGroup.mesh.lookAt( rootObject.position );
    particleGroup.triggerPoolEmitter(1);

  }
  
  var showRubble = function( position, velocity ) {
    for ( var i=0; i<rubbleSetSize; i++ ) {
      var rObject = rubblePool[rubbleIndex];
      rObject.object.position.copy( position );
      rObject.object.position.add( new THREE.Vector3( THREE.Math.randFloatSpread(0.5), THREE.Math.randFloatSpread(0.5), THREE.Math.randFloatSpread(0.5) ) );
      rootObject.add( rObject.object );
      
      //console.log( rObject.velocity, rObject.object.position, position );
      rObject.velocity.subVectors( rObject.object.position, position );
      rObject.velocity.normalize();
      rObject.velocity.add( velocity );
      
      rObject.reset();
      
      rubbleIndex ++;
      if ( rubbleIndex >= rubblePoolSize ) { rubbleIndex = 0; }
    }
  }
  
  var showPlanetSplode = function() {
    // hide planet
    rootObject.remove( planet );
    
    // rubble
    for ( var i=0; i<rubblePoolSize; i++ ) {
      var rObject = rubblePool[i];
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
      rootObject.add( group.mesh );
      
      var emitter = planetParticleGroups[i].emitters[0]; // Only one per group.
      emitter.alive = 1;
      emitter.enable();
      
      // closure to hold references to the groups and emitters
      (function() {
        var emitterRef = emitter;
        var groupRef = group;
        setTimeout( function() {
          emitterRef.disable();
          rootObject.remove( groupRef.mesh );
        }, groupRef.maxAgeMilliseconds );
      })();
    }
    
    // pose lux
    characterAnimator.updateFrame(10);
    
    // play the sound
    new PositionedSound( getSound('planetsplode', false), rootObject.position, 16);
    
  }
  
  var showTeleportOut = function() {
    character.parent.add( teleportGroup.mesh );
    
    //character.material.blending = THREE.AdditiveBlending;
    character.material.emissive = 0xffffff;
    createjs.Tween.get( character.material )
      .to({opacity: 0}, 1000);
    
    teleportGroup.mesh.position.copy( character.position );
    teleportGroup.mesh.position.z += 1;
    teleportGroup.mesh.position.y -= 0.5;
    teleportEmitter.active = 1.0;
    teleportEmitter.enable();
  }
  var showTeleportIn = function() {
    createjs.Tween.get( character.material )
      .to({opacity: 1}, 1000);
  }
  
  
  
  var update = function( delta ) {
    for ( var i=0; i<projHitPoolSize; i++ ) {
      projHitPool[i].tick( delta );
    }
    for ( var i=0; i<rubblePoolSize; i++ ) {
      rubblePool[i].update(delta);
    }
    fireworksGroup.tick(delta);
    
    for ( var i=0; i<planetParticleGroups.length; i++ ) {
      planetParticleGroups[i].tick(delta);
    }
    
    // lux flying away
    if (isGameOver) {
      character.position.y = character.position.y + CHARACTER_FLY_SPEED * delta;
      character.rotation.z = character.rotation.z + CHARACTER_TUMBLE_SPEED * delta;
      character.material.rotation = character.rotation.z;
    }
    
    // teleport particles
    // TODO only update these when active
    teleportGroup.tick(delta );
  }
  
  var shakeCamera = function( magnitude, duration ) {
    // Make sure camera is reset before applying shake tween
    camera.rotation.x = 0; 
    camera.rotation.y = 0;
    
    if ( typeof(duration)==='undefined' ) {
      duration = 500;
    } else {
      duration = duration*1000;
    }
    
    magnitude = 0.01 * magnitude;
    
    // Frequency is dependent on duration because easing function uses a normalized 0-1 value, not
    // an elapsed time value. This keeps shake the same no matter the duration.
    var freqX = duration/17;
    var freqY = duration/18;
    
    createjs.Tween.get(camera.rotation).to({x:magnitude, override:true }, duration, galaxies.utils.getShakeEase(freqX) ).
      to( {x:0}, 0); // reset position
    createjs.Tween.get(camera.rotation).to({y:magnitude, override:true }, duration, galaxies.utils.getShakeEase(freqY) ).
      to( {y:0}, 0); // reset position
    //createjs.Tween.get(camera.rotation).to({x:0}, 1000, createjs.Ease.quadOut );
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
    shakeCamera: shakeCamera
  };
})();