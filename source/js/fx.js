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
  var sparkleGroup;
  
  var stariclesGroup;
  var staricles = {}; // emitters
  var rainbowJetGroup;
  var purpleTrailGroup;
  var smokeGroup;
  
  // projectile hit particles
  var emitterSettings = {
    type: SPE.distributions.BOX,
    position: { spread: new THREE.Vector3(0.1, 0.1, 0.1) },
    velocity: { value: new THREE.Vector3(0, 0, 0),
                spread: new THREE.Vector3(3, 3, 3) },
    size: { value: [ 0.8, 0.0 ],
            spread: [0.1] },
    color: { value: [ new THREE.Color("hsl(0, 0%, 70%)"),
                      new THREE.Color("hsl(0, 0%, 70%)") ] },
    particleCount: 20,
    alive: false,
    maxAge: { value: 0.25, spread: 0 },
    duration: 0.05
  };
  
  var init = function() {
    
    // Projectile hit particles
    var texture = new THREE.Texture( galaxies.queue.getResult('sparkle') );
    texture.needsUpdate = true;
    for (var i=0; i<projHitPoolSize; i++ ) {
      var particleGroup = new SPE.Group({
        texture: { value: texture },
        blending: THREE.AdditiveBlending,
        transparent: true,
        maxParticleCount: 20
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
    var fireworkSettings = {
      type: SPE.distributions.SPHERE,
      particleCount: 150,
      duration: 0.1,
      maxAge: { value: 0.6,
                spread: 0.2 },
      position: { radius: 0.6 },
      velocity: { value: new THREE.Vector3(12) },
      acceleration: { value: new THREE.Vector3(-7) },
      color: { value: [new THREE.Color(1.4, 0.6, 0.6), new THREE.Color(1.4, 1.4, 0.6), new THREE.Color(0.6, 1.4, 0.6), new THREE.Color(0.6, 1.4, 1.4), new THREE.Color(0.6, 0.6, 1.4), new THREE.Color(1.4, 0.6, 1.4)] },
      wiggle: { spread: 5 },
      opacity: { value: [1, 1, 1, 0.1] },
      size: { value: [1.3, 0.4] }
    };
  
    var starTexture = new THREE.Texture( galaxies.queue.getResult('starparticle') );
    starTexture.needsUpdate = true;
    fireworksGroup = new SPE.Group({
      texture: { value: starTexture },
      maxParticleCount: 500
    });
    fireworksGroup.addPool( 3, fireworkSettings, true ); // 3
    
    galaxies.engine.rootObject.add ( fireworksGroup.mesh );

    var sparkleSettings = {
      type: SPE.distributions.SPHERE,
      particleCount: 300,
      duration: 0.8,
      maxAge: { value: 0.1, spread: 0.1 },
      position: { radius: 2, spread: new THREE.Vector3(2, 0, 0) },
      color: { value: new THREE.Color('white') },
      opacity: { value: [1, 0] },
      size: { value: 0.8 }
    };

    sparkleGroup = new SPE.Group({
      texture: { value: starTexture },
      maxParticleCount: 1000
    });
    sparkleGroup.addPool(3, sparkleSettings, true);

    galaxies.engine.rootObject.add ( sparkleGroup.mesh );
  
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
    
    var roughTexture = new THREE.Texture( galaxies.queue.getResult('projhitparticle') );
    var groupDust = new SPE.Group({
      texture: { value: roughTexture },
      blending: THREE.NormalBlending,
      transparent: true,
      maxParticleCount: 1000
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
      texture: { value: starTexture },
      blending: THREE.AdditiveBlending,
      maxParticleCount: 200
    });
    
    groupFire.addEmitter( new SPE.Emitter( partsFire ) );
    groupFire.mesh.position.set( 0,0,0.1 );
    planetParticleGroups.push(groupFire);

    // POWERUP and STAR particles
    var baseSettings = {
      type: SPE.distributions.SPHERE,
      particleCount: 100,
      duration: 0.1,
      activeMultiplier: 1,
      maxAge: { value: 0.8,
                spread: 0.3 },
      position: { radius: 0.1 },
      velocity: { value: new THREE.Vector3(2,0,0),
                  spread: new THREE.Vector3(1,0,0) },
      rotation: { axisSpread: new THREE.Vector3(2, 2, 2), angleSpread: 2*Math.PI },
      drag: { value: 0.5 },
      opacity: { value: [1,0.5] },
      size: { value: 0.3, spread: 0.1 }
    };
    
    stariclesGroup = new SPE.Group({
      texture: { value: starTexture },
      maxParticleCount: 500
    });
    galaxies.engine.rootObject.add( stariclesGroup.mesh );

    baseSettings.color = { value: new THREE.Color( 0xffcaca ) };
    staricles['heart'] = new SPE.Emitter( baseSettings );
    staricles['heart'].disable();
    stariclesGroup.addEmitter( staricles['heart'] );

    baseSettings.color = { value: [new THREE.Color('white'), new THREE.Color(1, 1, 0.8), new THREE.Color(1, 0.8, 0.5), new THREE.Color(1, 0.5, 0.5)], spread: new THREE.Vector3(0.5, 0.2, 0.1) };
    staricles['spread'] = new SPE.Emitter( baseSettings );
    staricles['spread'].disable();
    stariclesGroup.addEmitter( staricles['spread'] );

    baseSettings.color = { value: [new THREE.Color('white'), new THREE.Color(1, 0.8, 1), new THREE.Color('fuchsia')], spread: new THREE.Vector3(0.1, 0.1, 0.1) };
    staricles['clone'] = new SPE.Emitter( baseSettings );
    staricles['clone'].disable();
    stariclesGroup.addEmitter( staricles['clone'] );

    baseSettings.color = { value: [new THREE.Color('white'), new THREE.Color('gold')], spread: new THREE.Vector3(0.2, 0.2, 2) };
    staricles['golden'] = new SPE.Emitter( baseSettings );
    staricles['golden'].disable();
    stariclesGroup.addEmitter( staricles['golden'] );

    baseSettings.color = { value: new THREE.Color('white') };
    staricles['star'] = new SPE.Emitter( baseSettings );
    staricles['star'].disable();
    stariclesGroup.addEmitter( staricles['star'] );

    var sparkleTexture = new THREE.Texture( galaxies.queue.getResult('sparkle') );
    sparkleTexture.needsUpdate = true;

    var rainbowJetSettings = {
          type: SPE.distributions.SPHERE,
          particleCount: 800,
          maxAge: { value: 0.3, spread: 0.15 },
          position: { radius: 0.1, spread: new THREE.Vector3(0.1, 0, 0) },
          velocity: { distribution: SPE.distributions.BOX, value: new THREE.Vector3(0, 0, -5), spread: new THREE.Vector3(0, 0, 2) },
          color: { value: [new THREE.Color('red'), new THREE.Color('yellow'), new THREE.Color('green'), new THREE.Color('turquoise'), new THREE.Color('blue'), new THREE.Color('indigo')] },
          angle: { spread: Math.PI },
          opacity: { value: [1, 1, 0.5] },
          size: { value: [1, 0.6], spread: 0.25 }
        };

    rainbowJetGroup = new SPE.Group({
      texture: { value: sparkleTexture },
      maxParticleCount: 3600
    });

    rainbowJetGroup.addPool(4, rainbowJetSettings, true);

    galaxies.engine.rootObject.add( rainbowJetGroup.mesh );

    var smokeTexture = new THREE.Texture(galaxies.queue.getResult('smoke'));
    smokeTexture.needsUpdate = true;

    var purpleTrailSettings = {
      type: SPE.distributions.SPHERE,
      particleCount: 800,
      maxAge: { value: 0.3, spread: 0.15 },
      position: { radius: 0.1, spread: new THREE.Vector3(0.1, 0, 0) },
      velocity: { distribution: SPE.distributions.BOX, value: new THREE.Vector3(0, 0, -5), spread: new THREE.Vector3(0, 0, 2) },
      color: { value: [new THREE.Color('fuchsia'), new THREE.Color('purple')] },
      angle: { spread: Math.PI },
      opacity: { value: [1, 1, 0.5] },
      size: { value: [1, 0.6], spread: 0.25 }
    };

    purpleTrailGroup = new SPE.Group({
      texture: { value: sparkleTexture },
      maxParticleCount: 6400
    });

    purpleTrailGroup.addPool(8, purpleTrailSettings, true);

    galaxies.engine.rootObject.add( purpleTrailGroup.mesh );

    var smokeSettings = {
      type: SPE.distributions.SPHERE,
      particleCount: 400,
      maxAge: { value: 0.3, spread: 0.2 },
      position: { radius: 0.01, spread: new THREE.Vector3(0.02, 0, 0) },
      velocity: { distribution: SPE.distributions.BOX, value: new THREE.Vector3(0, 0, -4), spread: new THREE.Vector3(3, 3, 4) },
      drag: { value: 0.5, spread: 0.2 },
      color: { value: new THREE.Color('white') },
      angle: { spread: Math.PI },
      opacity: { value: [1, 0], spread: [0, 0.5, 0] },
      size: { value: [1, 8], spread: [1, 3] }
    };

    smokeGroup = new SPE.Group({
      texture: { value: smokeTexture },
      maxParticleCount: 4800,
      blending: THREE.NormalBlending
    });

    smokeGroup.addPool(12, smokeSettings, true);

    galaxies.engine.rootObject.add(smokeGroup.mesh);
  } // init
  
  var showFireworks = function( position ) {
    // New rev of SPE does not require fancy workaround as we no longer have to fake particle drag.
    fireworksGroup.triggerPoolEmitter( 1, position );
    setTimeout(function() {
      sparkleGroup.triggerPoolEmitter(1, position);
    }, 700);
  }
  
  var showStaricles = function( position, type ) {
    
    var emitter = staricles[type];
    if ( !emitter ) { emitter = staricles['star']; }

    emitter.position.value = emitter.position.value.copy( position );
    emitter.rotation.center = emitter.rotation.center.copy( position );
    emitter.updateFlags.rotationCenter = true;

    emitter.enable();
  }
  
  var showHit = function( position ) {
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
      
    }
    
    // pose lux
    galaxies.engine.player.die();
    
    // play the sound
    new galaxies.audio.PositionedSound({
      source: galaxies.audio.getSound('planetsplode'),
      position: galaxies.engine.rootObject.position,
      baseVolume: 16,
      loop: false
    });
    
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
    sparkleGroup.tick(delta);
    stariclesGroup.tick(delta);
    rainbowJetGroup.tick(delta);
    purpleTrailGroup.tick(delta);
    smokeGroup.tick(delta);

    for ( var i=0; i<planetParticleGroups.length; i++ ) {
      planetParticleGroups[i].tick(delta);
    }
    
    // lux flying away
    // planet.parent is used to test if planet exploded to prevent Lux from flying away from a won game.
    if (galaxies.engine.isGameOver && (galaxies.engine.planet.parent == null) ) {
      galaxies.engine.player.sprite.position.y = galaxies.engine.player.sprite.position.y + CHARACTER_FLY_SPEED * delta;
      galaxies.engine.player.sprite.rotation.z = galaxies.engine.player.sprite.rotation.z + CHARACTER_TUMBLE_SPEED * delta;
      galaxies.engine.player.sprite.material.rotation = galaxies.engine.player.sprite.rotation.z;
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

  var getRainbowEmitter = function () {
    return rainbowJetGroup.getFromPool();
  };

  var getPurpleTrailEmitter = function () {
    return purpleTrailGroup.getFromPool();
  };

  var getSmallFlameJet = function (longerTail) {
    var smokeTex = new THREE.Texture( galaxies.queue.getResult('smoke') ),
        smallFlameJetGroup = new SPE.Group({
          texture: { value: smokeTex },
          maxParticleCount: 400
        }),
        smallFlameEmitter = new SPE.Emitter({
          type: SPE.distributions.SPHERE,
          particleCount: 400,
          maxAge: { value: (longerTail ? 0.3 : 0.1), spread: 0.05 },
          position: { radius: 0.05, spread: new THREE.Vector3(0.1, 0, 0) },
          velocity: { distribution: SPE.distributions.BOX, value: new THREE.Vector3(0, 0, -5), spread: new THREE.Vector3(0, 0, 2) },
          acceleration: { distribution: SPE.distributions.BOX, value: new THREE.Vector3(0, 0, 0.4), spread: new THREE.Vector3(0, 0, 0.1) },
          color: { value: [new THREE.Color(1, 0.8, 0.5), new THREE.Color(1, 0.5, 0.5)] },
          angle: { spread: Math.PI },
          opacity: { value: [1, 0] },
          size: { value: [1, 0.4], spread: 0.25 }
        });

    smokeTex.needsUpdate = true;

    smallFlameJetGroup.addEmitter(smallFlameEmitter);

    return [smallFlameJetGroup, smokeGroup.getFromPool()];
  };
  
  
  
            
  return {
    init: init,
    update: update,
    showHit: showHit,
    showFireworks: showFireworks,
    showRubble: showRubble,
    showPlanetSplode: showPlanetSplode,
    shakeCamera: shakeCamera,
    showDebris: showDebris,
    addGlowbject: addGlowbject,
    showStaricles: showStaricles,
    getRainbowEmitter: getRainbowEmitter,
    getPurpleTrailEmitter: getPurpleTrailEmitter,
    getSmallFlameJet: getSmallFlameJet
  };
})();