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

  var heartSprite = null;
  
  // Simple array for pooling proj hit effect. We cannot use the particle
  // engine's pooling system because that works at the emitter level. We need
  // to set the orientation of each emitter, so we must work at the group level.
  var projHitPool = [];
  var projHitIndex = 0;
  var projHitPoolSize = 6;
  var explosionPoofPool = [];
  var explosionPoofIndex = 0;

  var gradients = {};

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

  var fireExplosionPool = [];
  var fireExplosionIndex = 0;
  var fireExplosionPoolSize = 4;
  
  var planetRubbleHolder;
  var planetParticleGroups = [];
  var planetExplosion = null;
  
  // Firework particle group for exploding comets
  var FIREWORKS_DECELERATION = 15;
  var fireworksGroup;
  var sparkleGroup;

  var cometGroup;

  var explosionGroup;
  var blueExplosionGroup;
  
  var stariclesGroup;
  var staricles = {}; // emitters
  var collectEffectPool = [];
  var collectEffectPoolSize = 3;
  var collectEffectIndex = 0;

  var rainbowJetGroup;
  var purpleTrailGroup;
  var smokeGroup;

  // Bubble shield
  var bubbleShieldGroup;
  var bubblePopGroup;
  var bubbleInGroup;

  // Laser hit
  var laserHitGroup;

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

  var createGradatedSprite = function (texName, spritePhysicalSize, frames) {
    var tex = new THREE.Texture(galaxies.queue.getResult(texName)),
        remapToGradient = galaxies.shaders.materials.remapToGradient,
        sheet = new galaxies.SpriteSheet(tex, frames, 30),
        mat = new THREE.ShaderMaterial({
          uniforms: remapToGradient.getUniforms(),
          vertexShader: remapToGradient.vertexShader,
          fragmentShader: remapToGradient.fragmentShader,
          shading: THREE.FlatShading,
          depthWrite: false,
          depthTest: false,
          transparent: true,
          blending: THREE.AdditiveBlending
        }),
        sprite;

    tex.needsUpdate = true;

    mat.uniforms.tDiffuse.value = tex;

    sprite = new THREE.Mesh(new THREE.PlaneGeometry(spritePhysicalSize.x, spritePhysicalSize.y), mat);
    sprite.up.set(0, 0, 1);

    galaxies.engine.rootObject.add(sprite);

    return {
      texture: tex,
      spriteSheet: sheet,
      material: mat,
      sprite: sprite,
      rotation: 0
    };
  };
  
  var init = function() {
    var heartTex = new THREE.Texture(galaxies.queue.getResult('flatheart'));

    heartTex.needsUpdate = true;

    var heartMat = new THREE.SpriteMaterial({
          map: heartTex,
          color: 0xffffff
        });

    heartSprite = new THREE.Sprite(heartMat);
    
    // Projectile hit particles
    var texture = new THREE.Texture( galaxies.queue.getResult('sparkle') );
    texture.needsUpdate = true;

    var frames = galaxies.utils.generateSpriteFrames(new THREE.Vector2(0, 0), new THREE.Vector2(256, 256),
            new THREE.Vector2(256, 8192), 20);

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

      explosionPoofPool.push(createGradatedSprite('explosionpoof', new THREE.Vector2(2.5, 2.5), frames));
    }

    var gradientNames = ["spread", "clone", "golden", "heart", "star", "shield", "fire", "blueFire", "blood", "white",
      "green", "brown", "icy", "ufoFire"];

    gradientNames.forEach(function (name) {
      gradients[name] = new THREE.Texture(galaxies.queue.getResult(name.toLowerCase() + "gradient"));
      gradients[name].needsUpdate = true;
    });
console.log(gradients);
    frames = galaxies.utils.generateSpriteFrames(new THREE.Vector2(0, 0), new THREE.Vector2(512, 512),
        new THREE.Vector2(4096, 4096), 57);

    for (i = 0; i < collectEffectPoolSize; ++i) {
      collectEffectPool.push(createGradatedSprite('powerupcollecteffect', new THREE.Vector2(2.5, 2.5), frames));
    }

    frames = galaxies.utils.generateSpriteFrames(new THREE.Vector2(0, 0), new THREE.Vector2(512, 512),
        new THREE.Vector2(4096, 4096), 53);

    for (i = 0; i < fireExplosionPoolSize; ++i) {
      fireExplosionPool.push(createGradatedSprite('toonexplosion', new THREE.Vector2(4, 4), frames));
    }

    frames = galaxies.utils.generateSpriteFrames(new THREE.Vector2(0, 0), new THREE.Vector2(512, 512),
        new THREE.Vector2(2048, 4096), 25);

    var planetExplodeTex = new THREE.Texture(galaxies.queue.getResult('planetexplosion')),
        planetExplodeSheet = new galaxies.SpriteSheet(planetExplodeTex, frames, 30),
        planetExplodeMat = new THREE.SpriteMaterial({
          map: planetExplodeTex,
          rotation: 0,
          shading: THREE.FlatShading,
          depthTest: false,
          depthWrite: false,
          transparent: true,
          blending: THREE.AdditiveBlending
        }),
        planetExplodeSprite = new THREE.Sprite(planetExplodeMat);

    planetExplodeTex.needsUpdate = true;

    galaxies.engine.rootObject.add(planetExplodeSprite);

    planetExplodeSprite.scale.set(16, 16, 16);
    planetExplodeSprite.position.set(0, 0, galaxies.engine.PLANET_RADIUS + 5);

    planetExplosion = {
      texture: planetExplodeTex,
      spriteSheet: planetExplodeSheet,
      material: planetExplodeMat,
      sprite: planetExplodeSprite
    };

    galaxies.engine.render();

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
      color: { value: [new THREE.Color(1.6, 0.8, 0.8), new THREE.Color(1.6, 1.6, 0.8), new THREE.Color(0.8, 1.6, 0.8), new THREE.Color(0.8, 1.6, 1.6), new THREE.Color(0.8, 0.8, 1.6), new THREE.Color(1.6, 0.8, 1.6)] },
      wiggle: { spread: 5 },
      opacity: { value: [1, 1, 1, 0.1] },
      size: { value: [2.5, 1.4] }
    };
  
    var starTexture = new THREE.Texture( galaxies.queue.getResult('starparticle') );
    starTexture.needsUpdate = true;
    fireworksGroup = new SPE.Group({
      texture: { value: starTexture },
      maxParticleCount: 500
    });
    fireworksGroup.addPool( 3, fireworkSettings, true ); // 3
    
    galaxies.engine.rootObject.add ( fireworksGroup.mesh );

    var cometSettings = {
      type: SPE.distributions.BOX,
      particleCount: 160,
      duration: null,
      maxAge: { value: 1.5 },
      position: { spread: new THREE.Vector3(0.6, 0.6, 0.6) },
      velocity: { value: new THREE.Vector3(0, 0, -5),
        spread: new THREE.Vector3(0.2, 0.2, 2) },
      color: { value: [new THREE.Color("rgb(6, 6, 20)"), new THREE.Color("rgb(255, 77, 0)") ] },
      opacity: { value: [0.8, 0.1] },
      size: { value: [6, 2],
        spread: [4] }
    };

    cometGroup = new SPE.Group({
      texture: { value: starTexture },
      blending: THREE.AdditiveBlending,
      transparent: true,
      alphaTest: 0,
      depthWrite: false,
      maxParticleCount: 1000
    });

    cometGroup.addPool(2, cometSettings, true);

    galaxies.engine.rootObject.add(cometGroup.mesh);

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
      maxParticleCount: 700
    });
    galaxies.engine.rootObject.add( stariclesGroup.mesh );

    baseSettings.color = { value: new THREE.Color( 1, 0.3, 0.3 ) };
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

    baseSettings.color = { value: new THREE.Color('yellow') };
    staricles['star'] = new SPE.Emitter( baseSettings );
    staricles['star'].disable();
    stariclesGroup.addEmitter( staricles['star'] );

    baseSettings.color = { value: new THREE.Color('white') };
    staricles['timeWarp'] = new SPE.Emitter( baseSettings );
    staricles['timeWarp'].disable();
    stariclesGroup.addEmitter( staricles['timeWarp'] );

    baseSettings.color = { value: new THREE.Color(0x0099FF) };
    staricles['shield'] = new SPE.Emitter( baseSettings );
    staricles['shield'].disable();
    stariclesGroup.addEmitter( staricles['shield'] );

    bubbleShieldGroup = new SPE.Group({
      texture: { value: starTexture },
      maxParticleCount: 3000
    });

    var bubbleShieldSettings = {
      type: SPE.distributions.SPHERE,
      particleCount: 1500,
      maxAge: {value: 0.8, spread: 0.4},
      position: {radius: galaxies.engine.SHIELD_RADIUS, spread: new THREE.Vector3(0.3, 0.3, 0.3)},
      color: { value: new THREE.Color(0x0099FF) },
      opacity: { value: [0, 1, 1, 1, 0] },
      size: { value: 1.5, spread: 0.1 }
    };

    bubbleShieldGroup.addPool(1, bubbleShieldSettings, true);

    galaxies.engine.planet.add(bubbleShieldGroup.mesh);

    bubblePopGroup = new SPE.Group({
      texture: { value: starTexture },
      maxParticleCount: 3000
    });

    var bubblePopSettings = {
      type: SPE.distributions.SPHERE,
      particleCount: 1000,
      duration: 0.1,
      maxAge: { value: 0.8, spread: 0.3 },
      position: { radius: galaxies.engine.SHIELD_RADIUS - 0.1 },
      velocity: { value: new THREE.Vector3(2, 0, 0), spread: new THREE.Vector3(1, 0, 0) },
      rotation: { axisSpread: new THREE.Vector3(2, 2, 2), angleSpread: 2*Math.PI },
      color: { value: new THREE.Color(0x0099FF) },
      opacity: { value: [1, 0] },
      size: { value: 1.5, spread: 0.1 }
    };

    bubblePopGroup.addPool(2, bubblePopSettings, true);

    galaxies.engine.rootObject.add ( bubblePopGroup.mesh );

    bubbleInGroup = new SPE.Group({
      texture: { value: starTexture },
      maxParticleCount: 3000
    });

    bubblePopSettings.direction = -1;

    bubbleInGroup.addPool(2, bubblePopSettings, true);

    galaxies.engine.rootObject.add( bubbleInGroup.mesh );

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
      velocity: { distribution: SPE.distributions.BOX, value: new THREE.Vector3(0, 0, -4), spread: new THREE.Vector3(1, 1, 4) },
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

    smokeGroup.mesh.position.z = 1;

    var explosionSettings = {
      type: SPE.distributions.SPHERE,
      particleCount: 200,
      duration: 0.1,
      maxAge: {value: 0.6, spread: 0.4},
      position: {radius: 0.6, spread: 0.4},
      velocity: {value: new THREE.Vector3(3), spread: new THREE.Vector3(1)},
      color: {value: [new THREE.Color(1, 1, 1), new THREE.Color(1, 1, 0), new THREE.Color(1, 0, 0), new THREE.Color(0.2, 0.2, 0.2), new THREE.Color(0.2, 0.2, 0.2), new THREE.Color(0.2, 0.2, 0.2)]},
      opacity: {value: [0, 1, 1, 0.2], spread: 0.4},
      size: {value: [0, 3], spread: 0.6},
      angle: {spread: 2 * Math.PI}
    };

    explosionGroup = new SPE.Group({
      texture: { value: smokeTexture },
      maxParticleCount: 1000
    });

    explosionGroup.addPool(3, explosionSettings, true);

    galaxies.engine.rootObject.add(explosionGroup.mesh);

    explosionSettings.color.value = [new THREE.Color(0, 0, 1), new THREE.Color(0, 1, 1), new THREE.Color(1, 1, 1)];

    blueExplosionGroup = new SPE.Group({
      texture: {value: smokeTexture},
      maxParticleCount: 1000
    });

    blueExplosionGroup.addPool(3, explosionSettings, true);

    galaxies.engine.rootObject.add(blueExplosionGroup.mesh);

    var laserHitSettings = {
      type: SPE.distributions.SPHERE,
      particleCount: 80,
      duration: 0.1,
      maxAge: {value: 0.2, spread: 0.1},
      position: {radius: 0.1},
      velocity: {value: new THREE.Vector3(6, 0, 0)},
      color: {value: [new THREE.Color(0.8, 1, 0.8), new THREE.Color(0.3, 0.7, 0.3)]},
      opacity: {value: [1, 0]},
      size: {value: [2, 0.5]}
    };

    laserHitGroup = new SPE.Group({
      texture: {value: starTexture},
      maxParticleCount: 1200,
      blending: THREE.AdditiveBlending
    });

    laserHitGroup.addPool(8, laserHitSettings, true);

    galaxies.engine.rootObject.add(laserHitGroup.mesh);

    galaxies.passes.warpInfo = {
      worldSpaceOrigin: new THREE.Vector3(),
      worldSpaceEdge: new THREE.Vector3()
    };

    galaxies.engine.shadersPool.addShader("WarpBubblePass");
    galaxies.engine.shadersPool.addShader("ZoomBlurPass");
    galaxies.engine.shadersPool.addShader("VignettePass");
    galaxies.engine.shadersPool.addShader("ColorAddPass");

    galaxies.passes.indexes.warpBubble = galaxies.engine.composerStack.addPass("WarpBubblePass", false, {progression: 0});

    galaxies.passes.indexes.focus = galaxies.engine.composerStack.addPass("ZoomBlurPass", false, {strength: 0});

    galaxies.passes.indexes.vignette = galaxies.engine.composerStack.addPass("VignettePass", false, {amount: 0});

    galaxies.passes.indexes.colorAdd = galaxies.engine.composerStack.addPass("ColorAddPass", false, {amount: 0});
  } // init
  
  var showFireworks = function( position ) {
    // New rev of SPE does not require fancy workaround as we no longer have to fake particle drag.
    fireworksGroup.triggerPoolEmitter( 1, position );
    setTimeout(function() {
      sparkleGroup.triggerPoolEmitter(1, position);
    }, 700);
  }

  var showWarpBubble = function ( worldPosition, worldBubbleEdge ) {
    var passes = galaxies.passes,
        warpInfo = passes.warpInfo;

    galaxies.engine.composerStack.enablePass(passes.indexes.warpBubble);

    passes.warpBubble = galaxies.engine.composerStack.passItems[passes.indexes.warpBubble].pass;

    passes.warpBubble.params.progression = 0.0;

    warpInfo.worldSpaceOrigin = worldPosition;
    warpInfo.worldSpaceEdge = worldBubbleEdge;

    updateWarpBubble();
  };

  var updateFocus = function () {
    galaxies.passes.focus.params.center.set(galaxies.engine.canvasHalfWidth, galaxies.engine.canvasHalfHeight);
  };

  var updateWarpBubble = function () {
    var passes = galaxies.passes,
        warpBubble = passes.warpBubble,
        warpInfo = passes.warpInfo,
        screenSpaceCenter = galaxies.utils.getNormalizedScreenPosition(warpInfo.worldSpaceOrigin),
        screenSpaceEdge = galaxies.utils.getNormalizedScreenPosition(warpInfo.worldSpaceEdge),
        screenAdjust = new THREE.Vector2(galaxies.engine.canvasHalfHeight, galaxies.engine.canvasHalfWidth).normalize();

    warpBubble.params.center = screenSpaceCenter;
    warpBubble.params.maxRadius = screenAdjust.multiplyScalar(screenSpaceEdge.sub(screenSpaceCenter).divide(screenAdjust).length());
  };

  var hideWarpBubble = function () {
    galaxies.engine.composerStack.disablePass(galaxies.passes.indexes.warpBubble);
    galaxies.passes.warpBubble = null;
  };

  var showTimeDilation = function () {
    galaxies.engine.composerStack.enablePass(galaxies.passes.indexes.focus);
    galaxies.passes.focus = galaxies.engine.composerStack.passItems[galaxies.passes.indexes.focus].pass;

    galaxies.engine.composerStack.enablePass(galaxies.passes.indexes.vignette);
    galaxies.passes.vignette = galaxies.engine.composerStack.passItems[galaxies.passes.indexes.vignette].pass;

    galaxies.fx.updateFocus();

    createjs.Tween.get(galaxies.passes.focus.params)
        .set({strength: 0})
        .to({strength: 0.05}, 1000);

    createjs.Tween.get(galaxies.passes.vignette.params)
        .set({amount: 0})
        .to({amount: 0.75}, 1000);
  };

  var hideTimeDilation = function () {
    createjs.Tween.get(galaxies.passes.focus.params)
        .to({strength: 0}, 1000)
        .call(function () {
          galaxies.engine.composerStack.disablePass(galaxies.passes.indexes.focus);
          galaxies.passes.focus = null;
        });

    createjs.Tween.get(galaxies.passes.vignette.params)
        .to({amount: 0}, 1000)
        .call(function () {
          galaxies.engine.composerStack.disablePass(galaxies.passes.indexes.vignette);
          galaxies.passes.vignette = null;
        });
  };

  var showStaricles = function( position, type ) {
    var emitter = staricles[type],
        grad = gradients[type],
        effect = collectEffectPool[collectEffectIndex];

    if (++collectEffectIndex >= collectEffectPoolSize) {
      collectEffectIndex = 0;
    }

    if ( !emitter ) { emitter = staricles['star']; }
    if ( !grad ) { grad = gradients['star']; }

    emitter.position.value = emitter.position.value.copy( position );
    emitter.rotation.center = emitter.rotation.center.copy( position );
    emitter.updateFlags.rotationCenter = true;

    emitter.enable();

    effect.spriteSheet.play();
    effect.material.uniforms.tGradient.value = grad;
    effect.sprite.visible = true;
    effect.sprite.position.copy(position);
    effect.rotation = galaxies.utils.flatAngle(position);
  };
  
  var showHit = function( position, type, scale) {
    if (!gradients[type]) {
      type = "white";
      scale = scale || 0.5;
    } else {
      scale = scale || 1;
    }

    var poof = explosionPoofPool[explosionPoofIndex];

    if (++explosionPoofIndex >= projHitPoolSize) {
      explosionPoofIndex = 0;
    }

    poof.spriteSheet.play();
    poof.material.uniforms.tGradient.value = gradients[type];
    poof.sprite.visible = true;
    poof.sprite.position.copy(position);
    poof.sprite.scale.set(scale, scale, scale);
    poof.rotation = galaxies.utils.flatAngle(position) + Math.PI;
  };
  
  var showRubble = function( type, position, velocity ) {
    if (type === "debris") {
      showDebris(position, velocity);

      return;
    }

    if ( rubblePool[type] === undefined ) {
      return;
    }
    
    rubbleIndex[type] = showObjects( rubblePool[type], rubbleSetSize, rubbleIndex[type], position, velocity );
    
  }
  
  var showDebris = function( position, velocity ) {
    //explosionGroup.triggerPoolEmitter(1, position);
    //explode(position);

    debrisIndex = showObjects( debrisPool, debrisSetSize, debrisIndex, position, velocity, 2 );
  }
  var showObjects = function( pool, setSize, index, position, velocity, velocityScalar ) {
    var poolSize = pool.length;

    if (typeof velocityScalar !== "number") {
      velocityScalar = 1;
    }

    for ( var i=0; i<setSize; i++ ) {
      var rObject = pool[index];
      rObject.object.position.copy( position );
      rObject.object.position.add( new THREE.Vector3( THREE.Math.randFloatSpread(0.5), THREE.Math.randFloatSpread(0.5), THREE.Math.randFloatSpread(0.5) ) );
      galaxies.engine.rootObject.add( rObject.object );
      
      //console.log( rObject.velocity, rObject.object.position, position );
      rObject.velocity.subVectors( rObject.object.position, position );
      rObject.velocity.normalize().multiplyScalar(velocityScalar);
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

    planetExplosion.sprite.visible = true;
    planetExplosion.spriteSheet.play();

    tintScreenOrange(0.4, 250, 750);
    
    // pose lux
    galaxies.engine.player.die();
    
    // play the sound
    new galaxies.audio.PositionedSound({
      source: galaxies.audio.getSound('planetsplode'),
      position: galaxies.engine.rootObject.position,
      baseVolume: 12,
      loop: false
    });
    
  }

  var tintScreenOrange = function (amount, transition1, transition2) {
      var passes = galaxies.passes;

      if (!passes.colorAdd) {
          galaxies.engine.composerStack.enablePass(passes.indexes.colorAdd);

          passes.colorAdd = galaxies.engine.composerStack.passItems[passes.indexes.colorAdd].pass;
      }

      passes.colorAdd.params.amount = 0.0;

      createjs.Tween.get(passes.colorAdd.params)
          .to({amount: amount}, transition1)
          .to({amount: 0.0}, transition2)
          .call(function () {
              galaxies.engine.composerStack.disablePass(passes.indexes.colorAdd);

              passes.colorAdd = null;
          });
  };
  
  var updateSprite = function (spriteData, cameraRootPos, delta) {
    var tex = spriteData.texture;
    
    if (!spriteData.sprite.visible) {
      return;
    }

    spriteData.spriteSheet.update(delta);
    spriteData.sprite.lookAt(cameraRootPos);
    spriteData.sprite.rotation.z = spriteData.rotation;
    spriteData.material.uniforms.offsetRepeat.value.set(tex.offset.x, tex.offset.y, tex.repeat.x, tex.repeat.y);

    if (!spriteData.spriteSheet.isPlaying()) {
      spriteData.sprite.visible = false;
    }
  };
  
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
    bubblePopGroup.tick(delta);
    bubbleInGroup.tick(delta);
    laserHitGroup.tick(delta);
    explosionGroup.tick(delta);
    blueExplosionGroup.tick(delta);
    cometGroup.tick(delta);
    bubbleShieldGroup.tick(delta);

    for ( var i=0; i<planetParticleGroups.length; i++ ) {
      planetParticleGroups[i].tick(delta);
    }

    if (galaxies.passes.warpBubble) {
      galaxies.passes.warpBubble.params.progression += delta * 2;

      if (galaxies.passes.warpBubble.params.progression >= 1) {
        hideWarpBubble();
      }
    }

    var cameraRootPos = galaxies.engine.rootObject.worldToLocal(galaxies.engine.camera.localToWorld(new THREE.Vector3()));

    explosionPoofPool.forEach(function (poof) {
      updateSprite(poof, cameraRootPos, delta);
    });
    
    collectEffectPool.forEach(function (effect) {
      updateSprite(effect, cameraRootPos, delta);
    });

    fireExplosionPool.forEach(function (toonExplosion) {
      updateSprite(toonExplosion, cameraRootPos, delta);
    });

    if (planetExplosion.sprite.visible) {
      planetExplosion.spriteSheet.update(delta);

      if (!planetExplosion.spriteSheet.isPlaying()) {
        planetExplosion.sprite.visible = false;
      }
    }
    
    // lux flying away
    // planet.parent is used to test if planet exploded to prevent Lux from flying away from a won game.
    if (galaxies.engine.isGameOver && (galaxies.engine.planet.parent == null) ) {
      var playerSprite = galaxies.engine.player.sprite;

      playerSprite.position.y = playerSprite.position.y + CHARACTER_FLY_SPEED * delta;
      playerSprite.rotation.z = playerSprite.rotation.z + CHARACTER_TUMBLE_SPEED * delta;
      playerSprite.material.rotation = playerSprite.rotation.z;

      spinOutClone(delta);
    }
    
    
    
      // GLOW VIEW VECTORS
      for (var i=0, len = glowbjects.length; i<len; i++ ) {
      var toCamera = glowbjects[i].worldToLocal( galaxies.engine.camera.localToWorld( new THREE.Vector3() ) );
      //toCamera = glowbjects[i].worldToLocal( toCamera );
      glowbjects[i].material.uniforms.viewVector.value = toCamera;
    }
  }

  var spinOutClone = function (delta) {
    var cloneSprite = galaxies.engine.player.cloneSprite;

    cloneSprite.position.y = cloneSprite.position.y + CHARACTER_FLY_SPEED * delta;
    cloneSprite.rotation.z = cloneSprite.rotation.z + CHARACTER_TUMBLE_SPEED * delta;
    cloneSprite.material.rotation = cloneSprite.rotation.z;
  };
  
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
          color: { value: [new THREE.Color(1, 0.8, 0.2), new THREE.Color(0.7, 0.35, 0.1), new THREE.Color(0.5, 0, 0)] },
          angle: { spread: Math.PI },
          opacity: { value: [1, 0] },
          size: { value: [1, 0.4], spread: 0.25 }
        });

    smokeTex.needsUpdate = true;

    smallFlameJetGroup.addEmitter(smallFlameEmitter);

    return [smallFlameJetGroup, smokeGroup.getFromPool()];
  };

  var getComet = function () {
    return cometGroup.getFromPool();
  };

  var popBubble = function () {
    bubblePopGroup.triggerPoolEmitter(1, new THREE.Vector3());
  };
  
  var bringBubbleIn = function () {
    bubbleInGroup.triggerPoolEmitter(1, new THREE.Vector3());
  };

  var showLaserHit = function (position) {
    //laserHitGroup.triggerPoolEmitter(1, position);
    showHit(position, "green");
  };

  var loseHeart = function (angle) {
    var startLen = galaxies.engine.PLANET_RADIUS + galaxies.engine.CHARACTER_HEIGHT * 0.6,
        startPoint = new THREE.Vector3(-Math.sin(angle), Math.cos(angle), 0)
            .multiplyScalar(startLen);

    galaxies.engine.rootObject.add(heartSprite);

    heartSprite.material.opacity = 1;
    heartSprite.material.rotation = angle;
    heartSprite.scale.set(0.8, 0.8, 0.8);
    heartSprite.position.copy(startPoint);

    startPoint.multiplyScalar((startLen + 2) / startLen);

    createjs.Tween.get(heartSprite.position)
        .to({x: startPoint.x, y: startPoint.y, z: startPoint.z}, 750);

    createjs.Tween.get(heartSprite.material)
        .to({opacity: 0}, 750)
        .call(function () {
          galaxies.engine.rootObject.remove(heartSprite);
        });
  };

  var getShield = function () {
    return bubbleShieldGroup.getFromPool();
  };

  var showBlueExplosion = function (position) {
    //blueExplosionGroup.triggerPoolEmitter(1, position);
    explode(position, "blueFire");
  };

  var explode = function (position, style, scale) {
    var toonExplosion = fireExplosionPool[fireExplosionIndex],
        grad = gradients[style];

    scale = scale || 1;

    if (++fireExplosionIndex >= fireExplosionPoolSize) {
      fireExplosionIndex = 0;
    }

    if (!grad) {
      console.log("no grad");
      grad = gradients.fire;
    }

    toonExplosion.spriteSheet.play();
    toonExplosion.material.uniforms.tGradient.value = grad;
    toonExplosion.sprite.visible = true;
    toonExplosion.sprite.position.copy(position);
    toonExplosion.sprite.scale.set(scale, scale, scale);
    toonExplosion.rotation = galaxies.utils.flatAngle(position) + Math.PI;
  };

  return {
    gradients: gradients,
    init: init,
    update: update,
    showHit: showHit,
    showFireworks: showFireworks,
    showWarpBubble: showWarpBubble,
    updateWarpBubble: updateWarpBubble,
    updateFocus: updateFocus,
    hideWarpBubble: hideWarpBubble,
    showTimeDilation: showTimeDilation,
    hideTimeDilation: hideTimeDilation,
    showRubble: showRubble,
    showPlanetSplode: showPlanetSplode,
    shakeCamera: shakeCamera,
    showDebris: showDebris,
    addGlowbject: addGlowbject,
    showStaricles: showStaricles,
    getRainbowEmitter: getRainbowEmitter,
    getPurpleTrailEmitter: getPurpleTrailEmitter,
    getSmallFlameJet: getSmallFlameJet,
    popBubble: popBubble,
    bringBubbleIn: bringBubbleIn,
    spinOutClone: spinOutClone,
    showLaserHit: showLaserHit,
    loseHeart: loseHeart,
    getComet: getComet,
    getShield: getShield,
    showBlueExplosion: showBlueExplosion,
    explode: explode,
    createGradatedSprite: createGradatedSprite,
    updateSprite: updateSprite,
    tintScreenOrange: tintScreenOrange
  };
})();