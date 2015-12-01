"use strict";
this.galaxies = this.galaxies || {};
/**
 * Engine
 *
 * WebGL/Three scene setup, game loop, timers/pause, user input capture,
 * everything that makes the game go.
 *
 * This is a bit of a god class, galaxies.engine should be divided up, but
 * the first priority was just to eliminate all the globals.
 * 
 *
 **/

galaxies.engine = galaxies.engine || {};

galaxies.engine.invulnerable = true;//false;

galaxies.engine.gameInitialized = false;

galaxies.engine.windowHalfX = 0;
galaxies.engine.windowHalfY = 0;

galaxies.engine.driftObject; // outer world container that rotates slowly to provide skybox motion
galaxies.engine.rootObject; // inner object container that contains all game objects

galaxies.engine.driftSpeed = 0.05;

galaxies.engine.isPaused = false;
galaxies.engine.isGameOver = false;

galaxies.engine.START_LEVEL_NUMBER = 1;

// Level number also updates roundNumber and planetNumber.
// NOTE: LEVEL, ROUND, AND PLANET NUMBERS ARE ALL 1-INDEXED, they are "number" not "index"
galaxies.engine._levelNumber = 1;
Object.defineProperty( galaxies.engine, 'levelNumber', {
  get: function() { return galaxies.engine._levelNumber; },
  set: function( value ) {
    galaxies.engine._levelNumber = value;
    galaxies.engine.roundNumber = ((galaxies.engine.levelNumber-1) % galaxies.engine.ROUNDS_PER_PLANET ) + 1;
    galaxies.engine.planetNumber = Math.floor((galaxies.engine.levelNumber-1)/galaxies.engine.ROUNDS_PER_PLANET) + 1;
  }
});

galaxies.engine.levelTimer = 0;
galaxies.engine.LEVEL_TIME = 15;
galaxies.engine.levelComplete = false;

galaxies.engine.spawnTimers = {};
galaxies.engine.spawnTimes = {};
galaxies.engine.obstacleTypes = ['asteroid', 'asteroidmetal', 'asteroidrad', 'comet'];//['asteroid', 'satellite', 'comet'];

// View, play parameters
galaxies.engine.speedScale = 1;

// "constants"
// Some of these are fixed, some are dependent on window size and are recalculated in 
// the window resize function.
galaxies.engine.CONE_ANGLE = 11.4 * Math.PI/360; // Half-angle of the interior of the cone
galaxies.engine.CAMERA_Z = 40;
galaxies.engine.CAMERA_VIEW_ANGLE = 45; // Will be applied to smallest screen dimension, horizontal or vertical. TODO
galaxies.engine.ROUNDS_PER_PLANET = 3; // 3

galaxies.engine.SHOOT_TIME = 0.6; // 0.4 in original

galaxies.engine.POWERUP_DURATION = 10;
galaxies.engine.POWERUP_CHARGED = 100;
galaxies.engine.powerups = ['clone', 'spread', 'golden'];

galaxies.engine.PLANET_RADIUS = 1;
galaxies.engine.CHARACTER_HEIGHT = 3;
galaxies.engine.CHARACTER_POSITION = galaxies.engine.PLANET_RADIUS + (0.95 * galaxies.engine.CHARACTER_HEIGHT/2 );
galaxies.engine.PROJ_START_Y = galaxies.engine.PLANET_RADIUS + (galaxies.engine.CHARACTER_HEIGHT * 0.08);//2;

galaxies.engine.CONE_SLOPE = Math.tan( galaxies.engine.CONE_ANGLE );
galaxies.engine.CAMERA_SLOPE = Math.tan( galaxies.engine.CAMERA_VIEW_ANGLE*Math.PI/360 );
galaxies.engine.VISIBLE_RADIUS = galaxies.engine.CAMERA_Z * galaxies.engine.CONE_SLOPE * galaxies.engine.CAMERA_SLOPE/ (galaxies.engine.CONE_SLOPE + galaxies.engine.CAMERA_SLOPE);

// Scene/game objects
galaxies.engine.targetAngle = 0;
galaxies.engine.angle = 0;

// Active obstacles.
galaxies.engine.obstacles = [];
galaxies.engine.inactiveObstacles = [];

// Pool obstacles separately to avoid having to create new meshes.
// TODO - initialize obstacle-type-keyed objects more intelligently (too much repitition).
galaxies.engine.obstaclePool = {};
galaxies.engine.obstaclePool['asteroid'] = [];
galaxies.engine.obstaclePool['asteroidmetal'] = [];
galaxies.engine.obstaclePool['asteroidrad'] = [];
galaxies.engine.obstaclePool['satellite'] = [];
galaxies.engine.obstaclePool['comet'] = [];

// Projectiles
galaxies.engine.shotTimer = galaxies.engine.SHOOT_TIME;
galaxies.engine.projectiles = [];

// Neutral targets
galaxies.engine.neutrals = [];
galaxies.engine.inactiveNeutrals = [];





galaxies.engine.onWindowResize = function() {

  galaxies.engine.windowHalfX = window.innerWidth / 2;
  galaxies.engine.windowHalfY = window.innerHeight / 2;

  galaxies.engine.camera.aspect = window.innerWidth / window.innerHeight;
  galaxies.engine.camera.updateProjectionMatrix();

  galaxies.engine.renderer.setSize( window.innerWidth, window.innerHeight );

  // Recalculate "constants"
  
  // Averages height/width circles to make active play area.
  //var aspectAdjust = (galaxies.engine.camera.aspect + 1) /2;
  //var cameraSlope = aspectAdjust * Math.tan( galaxies.engine.CAMERA_VIEW_ANGLE * Math.PI/360 );
  
  // Sets active play area by diagonal window size
  var diagonal = Math.sqrt( Math.pow(galaxies.engine.camera.aspect,2) + 1 );
  var cameraSlope = diagonal * Math.tan( galaxies.engine.CAMERA_VIEW_ANGLE * Math.PI/360 );
  
  galaxies.engine.OBSTACLE_VISIBLE_RADIUS = galaxies.engine.CAMERA_Z * galaxies.engine.CONE_SLOPE * cameraSlope/ (galaxies.engine.CONE_SLOPE + cameraSlope);
  //galaxies.engine.OBSTACLE_START_RADIUS = galaxies.engine.OBSTACLE_VISIBLE_RADIUS * 1.1;//OBSTACLE_VISIBLE_RADIUS * 1.2;
  galaxies.Projectile.prototype.PROJECTILE_LIFE = 0.95 * (galaxies.engine.OBSTACLE_VISIBLE_RADIUS - galaxies.engine.PROJ_START_Y)/galaxies.Projectile.prototype.PROJECTILE_SPEED;
  
  //console.log( OBSTACLE_VISIBLE_RADIUS );
}


// Force pause state when window is minimized to prevent large deltas when resuming.
galaxies.engine.onVisibilityChange = function( event ) {
  console.log( "document.hidden:", document.hidden );
  if ( document.hidden ) {
    galaxies.engine.stopTimers();
  } else {
    if ( !galaxies.engine.isPaused ) {
      galaxies.engine.startTimers();
    }
  }
}






/// REAL ENTRY POINT
galaxies.engine.init = function() {
  // It would be nice not to be using both of these.
  // create.js ticker for tweens
  createjs.Ticker.framerate = 60;
    
  // three.js clock for delta time
  galaxies.engine.clock = new THREE.Clock();
  
  // Detect minimized/inactive window to avoid bad delta time values.
  document.addEventListener("visibilitychange", galaxies.engine.onVisibilityChange );
  
  galaxies.ui.init();
  
}

// Create 3D scene, camera, light, skybox
galaxies.engine.initScene = function() {
  var mesh;
  galaxies.engine.container = document.getElementById( 'container' );

  galaxies.engine.scene = new THREE.Scene();
  
  galaxies.engine.driftObject = new THREE.Object3D();
  galaxies.engine.scene.add( galaxies.engine.driftObject );
  
  galaxies.engine.rootObject = new THREE.Object3D();
  galaxies.engine.driftObject.add( galaxies.engine.rootObject );
  
  galaxies.engine.camera = new THREE.PerspectiveCamera( galaxies.engine.CAMERA_VIEW_ANGLE, window.innerWidth / window.innerHeight, 1, 1100 );
  galaxies.engine.camera.position.set(0,0,galaxies.engine.CAMERA_Z);
  galaxies.engine.rootObject.add(galaxies.engine.camera);
  
  var light = new THREE.DirectionalLight( 0xffffff, 1 );
  light.position.set( 30, 20, 50 );
  galaxies.engine.rootObject.add( light );
  
  var skyTexture = new THREE.CubeTexture([
    galaxies.queue.getResult('skyboxright1'),
    galaxies.queue.getResult('skyboxleft2'),
    galaxies.queue.getResult('skyboxtop3'),
    galaxies.queue.getResult('skyboxbottom4'),
    galaxies.queue.getResult('skyboxfront5'),
    galaxies.queue.getResult('skyboxback6') ]);
  skyTexture.generateMipMaps = false;
  skyTexture.magFilter = THREE.LinearFilter,
  skyTexture.minFilter = THREE.LinearFilter
  skyTexture.needsUpdate = true;
  
  /* Set up a material that uses a cubemap texture.  This material uses
     custom vertex and fragment shaders that are defined in three.js as
     part of its shader library.  This code is copied from examples in
     the three.js download. */
  var shader = THREE.ShaderLib[ "cube" ];
  shader.uniforms[ "tCube" ].value = skyTexture;
  var material = new THREE.ShaderMaterial( { // A ShaderMaterial uses custom vertex and fragment shaders.
      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
      uniforms: shader.uniforms,
      depthWrite: false,
      side: THREE.BackSide
  } );

  galaxies.engine.skyCube = new THREE.Mesh( new THREE.BoxGeometry( 200, 200, 200 ), material );
  galaxies.engine.scene.add(galaxies.engine.skyCube);
  
  
  galaxies.engine.renderer = new THREE.WebGLRenderer();
  galaxies.engine.renderer.setPixelRatio( window.devicePixelRatio );
  galaxies.engine.renderer.setSize( window.innerWidth, window.innerHeight );
  //renderer.setSize( 640, 480 );
  galaxies.engine.container.appendChild( galaxies.engine.renderer.domElement );
  
  //console.log( galaxies.engine.renderer.domElement );
  //renderer.domElement.addEventListener( "webglcontextlost", handleContextLost, false);
  galaxies.engine.renderer.context.canvas.addEventListener( "webglcontextlost", galaxies.engine.handleContextLost, false);
  //renderer.domElement.addEventListener( "webglcontextrestored", handleContextRestored, false);  
  galaxies.engine.renderer.context.canvas.addEventListener( "webglcontextrestored", galaxies.engine.handleContextRestored, false);  
  
  window.addEventListener( 'resize', galaxies.engine.onWindowResize, false );
  galaxies.engine.onWindowResize();

  // Perhaps should be part of audio init...
  // configure listener (necessary for correct panner behavior when mixing for stereo)
  galaxies.audio.listenerObject = galaxies.engine.camera;
  galaxies.audio.listener.setOrientation(0,0,-1,0,1,0);
  galaxies.audio.listener.setPosition( galaxies.audio.listenerObject.position.x, galaxies.audio.listenerObject.position.y, galaxies.audio.listenerObject.position.z );

  
  // Mask object to simulate fade in of skybox
  var blackBox = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100, 1),
    new THREE.MeshBasicMaterial( {
      color:0x000000,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide} )
  );
  blackBox.position.set(0,0,galaxies.engine.CAMERA_Z - 5);
  galaxies.engine.rootObject.add(blackBox);
  createjs.Tween.get(blackBox.material)
    .to( { opacity: 0 }, 1000 )
    .call( function() {
        galaxies.engine.rootObject.remove(blackBox);
    }, this );
  //
}

galaxies.engine.initGame = function() {
  
  galaxies.resources = new galaxies.Resources();
  
  galaxies.engine.planet = new THREE.Mesh( galaxies.resources.geometries['moon'], galaxies.resources.materials['moon'] );
  galaxies.engine.rootObject.add( galaxies.engine.planet );
  
  galaxies.engine.characterRotator = new THREE.Object3D();
  galaxies.engine.rootObject.add( galaxies.engine.characterRotator );
  
  //var characterMap = THREE.ImageUtils.loadTexture( "images/lux.png" );
  //characterMap.minFilter = THREE.LinearFilter;
  
  /*
  var test = document.createElement( 'img' );
  //test.src = 'images/lux.png';
  test.src = galaxies.queue.getResult('lux').src;
  document.getElementById('menuHolder').appendChild(test);
  */
  
  
  
  /*
  var loader = new THREE.ImageLoader();
  //loader.crossOrigin = this.crossOrigin;
  loader.load( 'images/lux.png', function ( image ) {
    console.log(image);

    document.getElementById('menuHolder').appendChild(image);
    //characterMap.image = image;
    //characterMap.needsUpdate = true;
    //if ( onLoad ) onLoad( texture );
  }, undefined, function ( event ) {

      if ( onError ) onError( event );

  } );
  */
  //var characterMap = new THREE.Texture( galaxies.queue.getResult('lux'), THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter );
  var characterMap = new THREE.Texture( galaxies.queue.getResult('lux') );
  galaxies.engine.characterAnimator = new galaxies.SpriteSheet(
    characterMap,
    [ [2,2,172,224,0,4,81.35],
      [176,2,172,224,0,4,81.35],
      [350,2,172,224,0,4,81.35],
      [524,2,172,224,0,4,81.35],
      [698,2,172,224,0,4,81.35],
      [2,228,172,224,0,4,81.35],
      [176,228,172,224,0,4,81.35],
      [350,228,172,224,0,4,81.35],
      [524,228,172,224,0,4,81.35],
      [698,228,172,224,0,4,81.35],
      [2,454,172,224,0,4,81.35],
      [176,454,172,224,0,4,81.35],
      [350,454,172,224,0,4,81.35],
      [524,454,172,224,0,4,81.35],
      [698,454,172,224,0,4,81.35],
      [2,680,172,224,0,4,81.35]
      
      ], 
    30
    );
  characterMap.needsUpdate = true;
  
  var characterMaterial = new THREE.SpriteMaterial({
    map: characterMap,
    color: 0xffffff,
    transparent: true,
    opacity: 1.0
  } );
  //var characterMaterial = new THREE.SpriteMaterial( { color: 0xffffff } );
  galaxies.engine.character = new THREE.Sprite( characterMaterial );
  galaxies.engine.character.position.set( galaxies.engine.CHARACTER_HEIGHT * 0.77 * 0.15, galaxies.engine.CHARACTER_POSITION, 0 ); // note that character is offset horizontally because sprites are not centered
  galaxies.engine.character.scale.set(galaxies.engine.CHARACTER_HEIGHT*0.77, galaxies.engine.CHARACTER_HEIGHT, galaxies.engine.CHARACTER_HEIGHT * 0.77); // 0.77 is the aspect ratio width/height of the sprites
  galaxies.engine.characterRotator.add( galaxies.engine.character );

  var cloneMaterial = new THREE.SpriteMaterial({
    map: characterMap,
    color: 0xaaffaa,
    transparent: true,
    opacity: 1.0
  } );
  galaxies.engine.clone = new THREE.Sprite( cloneMaterial );
  galaxies.engine.clone.position.set( -galaxies.engine.CHARACTER_HEIGHT * 0.77 * 0.15, -galaxies.engine.CHARACTER_POSITION, 0 );
  galaxies.engine.clone.scale.set(galaxies.engine.CHARACTER_HEIGHT*0.77, galaxies.engine.CHARACTER_HEIGHT, galaxies.engine.CHARACTER_HEIGHT * 0.77);
  
  
  
  galaxies.engine.setPowerup();
  
  galaxies.engine.addInputListeners();

  //

  /*
  document.addEventListener( 'dragover', function ( event ) {

      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';

  }, false );

  document.addEventListener( 'dragenter', function ( event ) {

      document.body.style.opacity = 0.5;

  }, false );

  document.addEventListener( 'dragleave', function ( event ) {

      document.body.style.opacity = 1;

  }, false );

  document.addEventListener( 'drop', function ( event ) {

      event.preventDefault();

      var reader = new FileReader();
      reader.addEventListener( 'load', function ( event ) {

          material.map.image.src = event.target.result;
          material.map.needsUpdate = true;

      }, false );
      reader.readAsDataURL( event.dataTransfer.files[ 0 ] );

      document.body.style.opacity = 1;

  }, false );*/

  /*
  // Debug controls
  var debugFormElement = document.getElementById("debugForm");
  var audioToggle = debugFormElement.querySelector("input[name='audio']");
  audioToggle.addEventListener('click', function(event) { toggleAudio( audioToggle.checked ); } );
  var soundFieldToggle = debugFormElement.querySelector("input[name='soundField']");
  soundFieldToggle.addEventListener('click', function(event) { toggleSoundField( soundFieldToggle.checked ); } );
  var surroundToggle = debugFormElement.querySelector("input[name='surround']");
  surroundToggle.addEventListener('click', function(event) { toggleTargetMix( surroundToggle.checked ); } );
  debugFormElement.querySelector("button[name='restart']").addEventListener('click', manualRestart );
  */
  
  galaxies.fx.init( galaxies.engine.scene );


  // TEST
  //addTestObject();

  
  galaxies.engine.startGame();
  
  /*
  window.setInterval( function() {
    randomizePlanet();
    //galaxies.fx.shakeCamera();
  }, 3000 );
  */
  
  //
} // initGame

/*
var testObjects = [];*/
var testObject;

function addTestObject() {
  testObject = new galaxies.Capsule();
}
  
  /*
  //var colorMap = new THREE.Texture( galaxies.queue.getResult('asteriodColor'), THREE.UVMapping );
  var colorMap = new THREE.Texture( galaxies.queue.getResult('asteroidcolor'), THREE.UVMapping );
  colorMap.needsUpdate = true;
  var normalMap = new THREE.Texture( galaxies.queue.getResult('asteroidnormal'), THREE.UVMapping );
  normalMap.needsUpdate = true;
  
  var material = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      //opacity: 0.4,
      //transparent: false,
      map: colorMap,//THREE.ImageUtils.loadTexture( "images/asteroid_color.jpg" ),
      normalMap: normalMap,//THREE.ImageUtils.loadTexture( "images/asteroid_normal.jpg" ),
      //normalScale: new THREE.Vector2( 1, 1 )
      shading: THREE.SmoothShading //THREE.FlatShading
      } );
  
  testObject = new THREE.Mesh( galaxies.resources.geometries['debris'], galaxies.resources.materials['debris'] );
  testObject.position.set( 0, 0, 10 );
  galaxies.engine.rootObject.add( testObject );
  var scale = 10;
  testObject.scale.set( scale, scale, scale );
  
  console.log( "Test Object", testObject);
  
  /*
  var emitterSettings = {
        type: 'sphere',
        //positionSpread: new THREE.Vector3(0.2, 0.2, 0.2),
        radius: 0.1,
        //velocity: new THREE.Vector3(0, 0, 0),
        //velocitySpread: new THREE.Vector3(30, 30, 30),
        //acceleration: new THREE.Vector3(0,0,-20),
        speed: 12,
        speedSpread: 10,
        sizeStart: 0.6,
        sizeStartSpread: 0.2,
        sizeEnd: 0.6,
        //sizeEndSpread: 10,
        opacityStart: 0.5,
        opacityStartSpread: 0.8,
        opacityEnd: 0,
        //opacityEndSpread: 0.8,
        colorStart: new THREE.Color(0.500, 0.500, 0.500),
        colorStartSpread: new THREE.Vector3(0.4, 0.4, 0.4),
        //colorEnd: new THREE.Color(0.01, 0.000, 0.000),
        //colorEndSpread: new THREE.Vector3(0.4, 0.6, 0.9),
        particlesPerSecond: 10000,
        particleCount: 1000,
        alive: 0.0,
        duration: 0.1
      };
      
      var texture =  THREE.ImageUtils.loadTexture( 'images/hit_sprite.png' );
//new THREE.Texture( galaxies.queue.getResult('projhitparticle') );
      texture.needsUpdate = true;
      var particleGroup1 = new SPE.Group({
        texture: texture,
        maxAge: 2,
        blending: THREE.NormalBlending//THREE.AdditiveBlending
      });
      
      particleGroup1.addPool( 1, emitterSettings );
      rootObject.add ( particleGroup1.mesh );
      particleGroup1.mesh.position.set( 0,0, 1 );
      
      
      testObjects.push( particleGroup1 );
      
      var emitterSettings2 = {
        type: 'sphere',
        //positionSpread: new THREE.Vector3(0.2, 0.2, 0.2),
        radius: 0.1,
        //velocity: new THREE.Vector3(0, 0, 0),
        //velocitySpread: new THREE.Vector3(30, 30, 30),
        acceleration: new THREE.Vector3(0,0,-40),
        speed: 10,
        speedSpread: 6,
        sizeStart: 8,
        sizeStartSpread: 6,
        sizeEnd: 6,
        //sizeEndSpread: 10,
        opacityStart: 0.5,
        opacityStartSpread: 0.8,
        opacityEnd: 0,
        //opacityEndSpread: 0.8,
        colorStart: new THREE.Color(0.800, 0.400, 0.100),
        colorStartSpread: new THREE.Vector3(0.1, 0.2, 0.4),
        colorEnd: new THREE.Color(0.5, 0.000, 0.000),
        //colorEndSpread: new THREE.Vector3(0.4, 0.6, 0.9),
        particlesPerSecond: 2000,
        particleCount: 200,
        alive: 0.0,
        duration: 0.1
      };
      
      var particleGroup2 = new SPE.Group({
        texture: texture,
        maxAge: 1.5,
        blending: THREE.AdditiveBlending
      });
      
      particleGroup2.addPool( 1, emitterSettings2 );
      rootObject.add ( particleGroup2.mesh );
      particleGroup2.mesh.position.set( 0,0, 0 );
      
      testObjects.push(particleGroup2);
      */
      
      /*
      window.setInterval( function() {
        gameOver();
        
        
      }, 3000 );
      */
      
      
      
      
      
      
      //var ref = new THREE.Mesh( new THREE.TetrahedronGeometry(0.6), new THREE.MeshLambertMaterial() );
      //particleGroup.mesh.add( ref );
  
//} // test objects


function testUpdate( delta ) {
  testObject.update(delta);
}
  /*
   *for (var i=0, len = testObjects.length; i<len; i++ ) {
    testObjects[i].tick(delta); // particle system
  }*/
  /*
  testObject.rotation.y = testObject.rotation.y + 1*delta;
}
*/



galaxies.engine.startGame = function() {
  
  
  // There can be only one!
  galaxies.engine.ufo = new galaxies.Ufo();
  
  galaxies.engine.resetGame();
  galaxies.engine.removeInputListeners();
  galaxies.engine.planetTransition();
  //initLevel();


  galaxies.engine.gameInitialized = true;
  
  if ( galaxies.engine.animationFrameRequest == null ) {
    galaxies.engine.animate();
  }
  
}

galaxies.engine.restartGame = function() {
  galaxies.ui.showPauseButton(); // is hidden by game over menu
  
  // Add character holder.
  // Character will be removed by planet transition.
  galaxies.engine.rootObject.add( galaxies.engine.characterRotator );
  
  galaxies.engine.resetGame();
  galaxies.engine.removeInputListeners();
  galaxies.engine.planetTransition();
  //initLevel();
  
  createjs.Ticker.paused = false;
  galaxies.engine.clock.start();
  
  if ( galaxies.engine.animationFrameRequest == null ) {
    galaxies.engine.animate();
  }
}

galaxies.engine.initLevel = function() {
  
  galaxies.engine.levelTimer = 0;
  galaxies.engine.levelComplete = false;
  
  // Each planet gets a set number of levels, starting slow and speeding up.
  // Sigmoid functions set bounds of speedScale based on planet number (absolute level number).
  
  var planetFirstSpeed = 1 + 1/(1+Math.exp(4-galaxies.engine.planetNumber));    // Speed on first level for this planet
  var planetLastSpeed = 1 + 1.5/(1+Math.exp(1-galaxies.engine.planetNumber/2)); // Speed on last level for this planet
  
  galaxies.engine.speedScale = THREE.Math.mapLinear(galaxies.engine.roundNumber, 1, 3, planetFirstSpeed, planetLastSpeed );
  //console.log( planetFirstSpeed, planetLastSpeed, galaxies.engine.speedScale );
  /*
  for ( var i=1; i<20; i++ ) {
    var planetLevel = ((i-1) % galaxies.engine.ROUNDS_PER_PLANET); // level progress on planet
    var planet = Math.floor( i/galaxies.engine.ROUNDS_PER_PLANET ); // Planet number
    var planetFirstSpeed = 1 + 1/(1+Math.exp(4-planet));
    var planetLastSpeed = 1 + 1.5/(1+Math.exp(1-planet*2));
    
    console.log( i, THREE.Math.mapLinear(planetLevel, 0, 2, planetFirstSpeed, planetLastSpeed ) );
  }*/
  
  
  // Obstacle spawns/second
  // Rates for obstacles start low and asymptote to a max value.
  // Max values are first integer in formula. Initial value is first integer minus second integer.
  //var asteroidCount = Math.floor( 20 - (15 * (1/(1 + (level-1) * 0.1)) ) );
  var asteroidRate = 3 - (2.30 * (1/(1 + (galaxies.engine.levelNumber-1) * 0.1)) );
  var satelliteRate = 0.6 - (0.40 * (1/(1 + (galaxies.engine.levelNumber-1) * 0.1)) );
  var cometRate = 0.6 - (0.45 * (1/(1 + (galaxies.engine.levelNumber-1) * 0.1)) );

  asteroidRate /= 3; // TEST - Tone it down while we're testing roid types.
  galaxies.engine.spawnTimes['asteroid'] = 1/asteroidRate;
  galaxies.engine.spawnTimes['asteroidmetal'] = 1/asteroidRate;
  galaxies.engine.spawnTimes['asteroidrad'] = 1/asteroidRate;
  //galaxies.engine.spawnTimes['satellite'] = 1/satelliteRate;
  galaxies.engine.spawnTimes['comet'] = 1/cometRate;
  
  // Initialize timers, so first wave spawns immediately
  for(var i=0, len = galaxies.engine.obstacleTypes.length; i<len; i++ ) {
    galaxies.engine.spawnTimers[ galaxies.engine.obstacleTypes[i] ] =
      galaxies.engine.spawnTimes[ galaxies.engine.obstacleTypes[i] ];
    /*galaxies.engine.spawnTimers[ galaxies.engine.obstacleTypes[i] ] =
      (0.5 + Math.random() * 0.5) * galaxies.engine.spawnTimes[ galaxies.engine.obstacleTypes[i] ];*/
  }
  
  console.log("Spawn timers initialized");
  
  //console.log( level, asteroidRate.toFixed(2), satelliteRate.toFixed(2), cometRate.toFixed(2) );
  
  /*
  for (var i=1; i<20; i++ ) {
    var asteroidCount = Math.floor( 20 - (15 * (1/(1 + (i-1) * 0.5)) ) );
    var satelliteCount = Math.floor( 12 - (12 * (1/(1 + (i-1) * 0.5)) ) );
    var cometCount = Math.floor( 10 - (10 * (1/(1 + (i-1) * 0.1)) ) );
    console.log(i, asteroidCount, satelliteCount, cometCount);
  }*/
  
  
  if ( galaxies.engine.levelNumber >= 3 ) {
  //if ( true ) { // UFO test
    //galaxies.engine.ufo.activate();
  }
  
  galaxies.ui.updateLevel( galaxies.engine.planetNumber, galaxies.engine.roundNumber );
  
  galaxies.ui.showTitle("ROUND " + galaxies.engine.roundNumber, 1.5 );
  

}
galaxies.engine.nextLevel = function() {
  galaxies.engine.levelNumber++;
  
  galaxies.engine.clearLevel();
  
  if ( galaxies.engine.roundNumber == 1 ) {
    galaxies.engine.initRootRotation();
    galaxies.engine.planetTransition();
  } else {
    galaxies.engine.initLevel();
  }
  
}


galaxies.engine.planetTransition = function() {
  // Reset the level timer, so we don't trigger nextLevel again.
  galaxies.engine.levelComplete = false;
  galaxies.engine.levelTimer = 0;
  
  // Set the spawnTimes high to prevent any obstacles from spawning until
  // initLevel is called.
  for(var i=0, len = galaxies.engine.obstacleTypes.length; i<len; i++ ) {
    galaxies.engine.spawnTimes[ galaxies.engine.obstacleTypes[i] ] = Infinity;
  }
  
  
  // disable input
  galaxies.engine.removeInputListeners();
  galaxies.engine.isFiring = false;
  
  console.log("begin planet transition");
  
  // If planet is in the scene, then we must do the out-transition first.
  // If planet is not in the scene, then we skip this step (happens on the first level of new games).
  if ( galaxies.engine.planet.parent != null ) {
    galaxies.fx.showTeleportOut();
    new galaxies.audio.PositionedSound({
      source: galaxies.audio.getSound('teleportout'),
      position: galaxies.utils.rootPosition(galaxies.engine.character),
      baseVolume: 10,
      loop: false
    });
    
    // 1500 is the teleport time as defined in FX and foolishly inaccessible.
    createjs.Tween.removeTweens(galaxies.engine.character);
    createjs.Tween.get(galaxies.engine.character)
      .wait(1500)
      .call( galaxies.engine.startPlanetMove, null, this );
  } else {
    galaxies.engine.startPlanetMove();
  }
  
  // These should be constants available everywhere.
  //var totalTransitionTime = 1500 + 6500 + 1500;
  createjs.Tween.get( galaxies.engine.camera.position )
    .to({z:galaxies.engine.CAMERA_Z/2}, 1500, createjs.Ease.quadInOut)
    .wait(6500)
    .to({z:galaxies.engine.CAMERA_Z}, 1500, createjs.Ease.quadInOut);
  
}

galaxies.engine.startPlanetMove = function() {
  console.log("planet move");
  
  // Move planet to scene level, so it will not be affected by rootObject rotation while it flies off.
  // Note that for first level, there is no planet to move out, so we check if the planet is active
  // before performing the detach.
  if ( galaxies.engine.planet.parent != null ) {
    THREE.SceneUtils.detach (galaxies.engine.planet, galaxies.engine.rootObject, galaxies.engine.scene);
  }
  
  // Set outbound end position and inbound starting position for planet
  var outPosition = galaxies.engine.rootObject.localToWorld( new THREE.Vector3(0,0,-100) );
  //var outPosition = new THREE.Vector3(0,0,-100);
  var inPosition = galaxies.engine.rootObject.localToWorld( new THREE.Vector3(0,100,0) );
  
  var transitionTimeMilliseconds = 6500;
  // Tween!
  createjs.Tween.removeTweens( galaxies.engine.planet.position );
  createjs.Tween.get( galaxies.engine.planet.position )
    .to({x:outPosition.x, y:outPosition.y, z:outPosition.z}, transitionTimeMilliseconds/2, createjs.Ease.quadInOut)
    .to({x:inPosition.x, y:inPosition.y, z:inPosition.z}, 0)
    .call( function() {
      galaxies.engine.scene.add( galaxies.engine.planet ); // First level planet must be added here
      galaxies.engine.randomizePlanet();
      
      galaxies.ui.showTitle( galaxies.utils.generatePlanetName( galaxies.engine.planetNumber ), 4 );
    }, null, this)
    .to({x:0, y:0, z:0}, transitionTimeMilliseconds/2, createjs.Ease.quadInOut);
  
  // Swing the world around
  //createjs.Tween.get( camera.rotation ).to({x:galaxies.utils.PI_2, y:galaxies.utils.PI_2}, 8000, createjs.Ease.quadInOut ).call(planetTransitionComplete);
  var targetX = galaxies.engine.rootObject.rotation.x + Math.PI/2;
  createjs.Tween.removeTweens( galaxies.engine.rootObject.rotation );
  createjs.Tween.get( galaxies.engine.rootObject.rotation )
    .to({x:targetX}, transitionTimeMilliseconds, createjs.Ease.quadInOut )
    .call(galaxies.engine.planetMoveComplete);
  
  // Stop drifting in the x-axis to prevent drift rotation from countering transition.
  // This ensures planet will move off-screen during transition.
  galaxies.engine.driftAxis = galaxies.engine.driftObject.localToWorld( new THREE.Vector3(0,0,1) );
}
galaxies.engine.planetMoveComplete = function() {
  // reattach the planet to the rootObject
  THREE.SceneUtils.attach( galaxies.engine.planet, galaxies.engine.scene, galaxies.engine.rootObject );
  // planetAngle is the zero value for rotation the planet when lux moves
  galaxies.engine.planetAngle = galaxies.engine.planet.rotation.z;
  
  // put the character back
  galaxies.engine.characterRotator.add( galaxies.engine.character );
  galaxies.fx.showTeleportIn(galaxies.engine.planetTransitionComplete);
  new galaxies.audio.PositionedSound({
    source: galaxies.audio.getSound('teleportin'),
    position: galaxies.utils.rootPosition( galaxies.engine.character ),
    baseVolume: 10,
    loop: false
  });
}
galaxies.engine.planetTransitionComplete = function() {
  galaxies.engine.addInputListeners();
  
  galaxies.engine.initLevel();
}

galaxies.engine.randomizePlanet = function() {
  galaxies.engine.planet.rotation.set( Math.random()*galaxies.utils.PI_2, Math.random()*galaxies.utils.PI_2, Math.random()*galaxies.utils.PI_2, 'ZXY' );
  galaxies.engine.planet.material.color.setHSL( Math.random(), THREE.Math.randFloat(0.1, 0.4), THREE.Math.randFloat(0.5, 0.7) );
  galaxies.engine.planetAngle = galaxies.engine.planet.rotation.z;   // planetAngle is the zero value for rotation the planet when lux moves

}



galaxies.engine.onDocumentMouseDown = function( event ) {
	//event.preventDefault();

    galaxies.engine.isFiring = true;
}
galaxies.engine.onDocumentTouchStart = function( event ) {
    event.preventDefault();
    
    galaxies.engine.isFiring = true;
    galaxies.engine.onDocumentTouchMove( event );
}


galaxies.engine.onDocumentMouseUp = function( event ) {
  galaxies.engine.isFiring = false;
}

galaxies.engine.onDocumentMouseMove = function(event) {
  var mouseX = ( event.clientX - galaxies.engine.windowHalfX );
  var mouseY = ( event.clientY - galaxies.engine.windowHalfY );
  
  galaxies.engine.targetAngle = -(Math.atan2(mouseY, mouseX) + Math.PI/2); // sprite is offset
  
}
galaxies.engine.onDocumentTouchMove = function( event ) {
  event.preventDefault();
  
  var touches = event.changedTouches;
  for ( var i=0; i<touches.length; i++ ) {
      var mouseX = touches[i].clientX - galaxies.engine.windowHalfX;
      var mouseY = touches[i].clientY - galaxies.engine.windowHalfY;
      
      galaxies.engine.targetAngle = -(Math.atan2(mouseY, mouseX) + Math.PI/2); // sprite is offset
      
      //document.getElementById('message').innerHTML = mouseX.toFixed(2) + ", " + mouseY.toFixed(2);
  }
        
}



galaxies.engine.addObstacle = function( type ) {
  // Get from pool and initialize
  if ( galaxies.engine.obstaclePool[type].length > 0 ) {
    var obstacle = galaxies.engine.obstaclePool[type].pop();
    obstacle.reset();
    galaxies.engine.obstacles.push( obstacle );
    return obstacle;
  }
  
  // Nothing in pool, make a new one.
  var obstacle = new galaxies.Obstacle.create( type );
  galaxies.engine.obstacles.push( obstacle );
  return obstacle;
}

galaxies.engine.shoot = function( indestructible ) {
  if ( typeof(indestructible) !== 'boolean' ) {
    indestructible = false;
  }
  
  if ( galaxies.engine.shotTimer>0 ) { return; }
  galaxies.engine.shotTimer = galaxies.engine.SHOOT_TIME;
  
  //console.log("shoot");
    
  // Instantiate shot object
  var projMesh = new THREE.Mesh( galaxies.resources.geometries['proj'], galaxies.resources.materials['proj'] );
  var projScale = 0.1;
  projMesh.scale.set(projScale, projScale, projScale );
  
  //var proj = new galaxies.Projectile( projMesh, galaxies.engine.angle );
  var proj = new galaxies.Projectile( projMesh, galaxies.engine.angle, 0, 0, indestructible );
  galaxies.engine.projectiles.push( proj );
    
  // play animation
  galaxies.engine.characterAnimator.play();
  
  // delay adding the projectile and the sound to synchronize with the animation
  createjs.Tween.get( galaxies.engine.character ).wait(250)
  .call( galaxies.engine.shootSync, [proj], this )
  .call( galaxies.engine.shootSound );
}

// Fire two projectiles: one forwards, one backwards
galaxies.engine.shoot2 = function() {
  if ( galaxies.engine.shotTimer>0 ) { return; }
  galaxies.engine.shotTimer = galaxies.engine.SHOOT_TIME;
  
  // Instantiate shot object
  for ( var i=0; i<2; i++ ) {
    var projMesh = new THREE.Mesh( galaxies.resources.geometries['proj'], galaxies.resources.materials['proj'] );
    var projScale = 0.1;
    projMesh.scale.set(projScale, projScale, projScale );
    
    var proj = new galaxies.Projectile( projMesh, galaxies.engine.angle, (Math.PI * i) );
    galaxies.engine.projectiles.push( proj );
      
    // delay adding the projectile and the sound to synchronize with the animation
    createjs.Tween.get( galaxies.engine.character ).wait(250)
    .call( galaxies.engine.shootSync, [proj], this );
  }
  // play animation
  galaxies.engine.characterAnimator.play();
  createjs.Tween.get( galaxies.engine.character ).wait(250)
  .call( galaxies.engine.shootSound );

}


// When the correct point in the character animation is reached,
// realign the projectile with the current angle and let it fly.
galaxies.engine.shootSync = function( proj ) {
  
  proj.updatePosition( galaxies.engine.angle );
  proj.addToScene();
}
galaxies.engine.shootSound = function() {
  // play sound
  new galaxies.audio.PositionedSound({
    source: galaxies.audio.getSound('shoot'),
    position: galaxies.utils.rootPosition( galaxies.engine.character ),
    baseVolume: 10,
    loop: false
  });
}


galaxies.engine.shoot3 = function() {
  if ( galaxies.engine.shotTimer>0 ) { return; }
  galaxies.engine.shotTimer = galaxies.engine.SHOOT_TIME;

  
  for ( var i=-1; i<=1; i++ ) {
    // Instantiate shot object
    var projMesh = new THREE.Mesh( galaxies.resources.geometries['proj'], galaxies.resources.materials['proj'] );
    var projScale = 0.1;
    projMesh.scale.set(projScale, projScale, projScale );
    
    var proj = new galaxies.Projectile( projMesh, galaxies.engine.angle, 0, i );
    galaxies.engine.projectiles.push( proj );
      
    // delay adding the projectile and the sound to synchronize with the animation
    createjs.Tween.get( galaxies.engine.character ).wait(250).call( galaxies.engine.shootSync, [proj], this );
  }
  // play animation
  galaxies.engine.characterAnimator.play();
  createjs.Tween.get( galaxies.engine.character ).wait(250)
  .call( galaxies.engine.shootSound );
  
}




galaxies.engine.animate = function() {

  galaxies.engine.animationFrameRequest = requestAnimationFrame( galaxies.engine.animate );
  galaxies.engine.update();

}


// Game Loop
galaxies.engine.update = function() {
  var delta = galaxies.engine.clock.getDelta();
  if ( delta === 0 ) { return; } // paused!
  if ( delta > 0.25 ) { delta = 0.25; } // Cap simulation at 4 ticks/second delta to prevent projectiles from passing through objects.
  
  // Test for hits, projectiles and ricochets
  var activeObstacleCount = 0;
  for (var iObs=0, iLen = galaxies.engine.obstacles.length; iObs<iLen; iObs++ ){
    var obstacleI = galaxies.engine.obstacles[iObs];
    if (obstacleI.state === 'inactive') {
      galaxies.engine.inactiveObstacles.push( obstacleI );
    } else {
      activeObstacleCount++;
    }
    
    if ( (obstacleI.state === 'inactive') || ( obstacleI.state === 'waiting' )) { continue; }
    for ( var jObs = (iObs+1), jLen = galaxies.engine.obstacles.length; jObs<jLen; jObs++ ) {
      //if ( !obstacles[jObs].falling ) { continue; }
      var obstacleJ = galaxies.engine.obstacles[jObs];
      if ( (obstacleJ.state === 'inactive') || ( obstacleJ.state === 'waiting' )) { continue; }
      
      var dist = obstacleI.object.position.distanceTo( obstacleJ.object.position );
      if ( dist < (obstacleI.hitThreshold + obstacleJ.hitThreshold) ) {
        if ( (obstacleI.state!=='ricocheting') && (obstacleJ.state!=='ricocheting') ) {
          // push overlapping obstacles apart
          var overlap = (obstacleI.hitThreshold + obstacleJ.hitThreshold) - dist;
          
          var shift = obstacleJ.object.position.clone();
          shift.sub( obstacleI.object.position );
          shift.z = 0;
          shift.setLength( overlap/2 );
          // In case of perfectly overlapping objects (as when child obstacles are spawned).
          // We apply CONE_SLOPE here to keep objects cozy with eachother as hit detection is done
          // on the cone, but offset is applied in-plane (where small distances go further).
          if ( shift.length() === 0 ) {
            shift.set( THREE.Math.randFloatSpread(1), THREE.Math.randFloatSpread(1), 0 );
            shift.setLength( galaxies.engine.CONE_SLOPE * overlap/2 );
          }
          
          obstacleI.object.position.sub( shift );
          obstacleJ.object.position.add( shift );
          
        } else if ( (obstacleI.isActive) && (obstacleJ.isActive) ) {
          // Cache values for correct simultaneous behavior.
          var jRic = obstacleJ.ricochetCount;
          var iRic = obstacleI.ricochetCount;
          var jPos = obstacleJ.object.position.clone();
          var iPos = obstacleI.object.position.clone();
          obstacleJ.hit( iPos, iRic );
          obstacleI.hit( jPos, jRic );
        }
      }
    }
    for (var iProj=0, projLen = galaxies.engine.projectiles.length; iProj<projLen; iProj++ ) {
      var proj = galaxies.engine.projectiles[iProj];
      if ( obstacleI.isActive && (proj.object.position.distanceTo( obstacleI.object.position ) < obstacleI.hitThreshold ) ) {
        obstacleI.hit( proj.object.position, 0, proj.indestructible );
        proj.hit();
      }
    }
  }
  if ( galaxies.engine.ufo.isHittable ) {
    for (var iProj=0, projLen = galaxies.engine.projectiles.length; iProj<projLen; iProj++ ) {
      var proj = galaxies.engine.projectiles[iProj];
      var ufoRootPosition = galaxies.engine.ufo.object.localToWorld( new THREE.Vector3() );
      ufoRootPosition = galaxies.engine.rootObject.worldToLocal( ufoRootPosition );
      if ( proj.object.position.distanceTo( ufoRootPosition ) < galaxies.engine.ufo.hitThreshold ) {
        galaxies.engine.ufo.hit( proj.indestructible );
        proj.hit();
      }
    }
  }
  // Neutral objects
  for (var i=0, iLen = galaxies.engine.neutrals.length; i<iLen; i++ ){
    var neutral = galaxies.engine.neutrals[i];
    for (var iProj=0, projLen = galaxies.engine.projectiles.length; iProj<projLen; iProj++ ) {
      var proj = galaxies.engine.projectiles[iProj];
      if ( proj.object.position.distanceTo( neutral.object.position ) < neutral.hitThreshold) {
        neutral.hit();
      //if ( object.isActive && (proj.object.position.distanceTo( obstacleI.object.position ) < galaxies.engine.PROJ_HIT_THRESHOLD ) ) {
        proj.hit();
      }
    }
    
  }
  
  
  // Remove inactive obstacles
  for (var i=0; i<galaxies.engine.inactiveObstacles.length; i++ ) {
    var inactive = galaxies.engine.inactiveObstacles[i];
    galaxies.engine.obstacles.splice( galaxies.engine.obstacles.indexOf( inactive ), 1 );
    galaxies.engine.obstaclePool[inactive.type].push( inactive );
  }
  galaxies.engine.inactiveObstacles = [];
  
  // Update obstacles
  for (var i=0, len = galaxies.engine.obstacles.length; i<len; i++ ) {
    var obstacle = galaxies.engine.obstacles[i]
    obstacle.update( delta );
  }
  
  // Update neutrals
  for (var i=0, iLen = galaxies.engine.inactiveNeutrals.length; i<iLen; i++ ){
    galaxies.engine.neutrals.splice( galaxies.engine.inactiveNeutrals[i], 1 );
  }
  galaxies.engine.inactiveNeutrals = [];
  for (var i=0, iLen = galaxies.engine.neutrals.length; i<iLen; i++ ){
    var neutral = galaxies.engine.neutrals[i];
    neutral.update(delta);
  }
  
  // Update projectiles
  var expiredProjectiles = [];
  for( var i=0, len = galaxies.engine.projectiles.length; i<len; i++ ){
    var proj = galaxies.engine.projectiles[i];
    proj.update( delta );
    galaxies.utils.conify( proj.object );
    if ( proj.isExpired ) {
      expiredProjectiles.push( proj );
    }
  }
  for ( var i=0, len = expiredProjectiles.length; i<len; i++ ) {
    var proj = expiredProjectiles[i];
    galaxies.engine.projectiles.splice( galaxies.engine.projectiles.indexOf(proj), 1);
    proj.remove();
  }
  
  if ( galaxies.engine.shotTimer>0) { galaxies.engine.shotTimer -= delta; }
  if ( galaxies.engine.isFiring ) {
    galaxies.engine.shootFunction();
    //galaxies.engine.shoot( true );
    //galaxies.engine.shoot3();
  }
  //
  
  if ( galaxies.engine.powerupTimer > 0 ) {
    galaxies.engine.powerupTimer -= delta;
    if ( galaxies.engine.powerupTimer <=0 ) {
      galaxies.engine.setPowerup('');
    }
  }
  
  // update ufo
  galaxies.engine.ufo.update(delta);
  
  // update world
  galaxies.engine.driftObject.rotateOnAxis(galaxies.engine.driftAxis, galaxies.engine.driftSpeed * delta );

  // update fx
  galaxies.fx.update(delta);
  
  
  // update character
  if ( !galaxies.engine.isGameOver ) {
    var angleDelta = (galaxies.engine.targetAngle-galaxies.engine.angle);
    angleDelta = (angleDelta % (2*Math.PI) );
    if ( angleDelta > Math.PI ) {
      angleDelta = angleDelta - 2*Math.PI;
    }
    if ( angleDelta < -Math.PI ) {
      angleDelta = angleDelta + 2*Math.PI;
    }
    galaxies.engine.angle += (angleDelta * delta * 10.0);
    
    galaxies.engine.characterRotator.rotation.set(0,0,galaxies.engine.angle);
    galaxies.engine.character.material.rotation = galaxies.engine.angle;
    galaxies.engine.characterAnimator.update( delta );
    
    galaxies.engine.clone.material.rotation = Math.PI + galaxies.engine.angle;
    
    
    if ( galaxies.engine.planet.parent === galaxies.engine.rootObject ) {
      galaxies.engine.planet.rotation.z = galaxies.engine.planetAngle-(galaxies.engine.angle/4);
    }
  }
  
  // TIME
  if ( !galaxies.engine.levelComplete ) {
    for(var i=0, len = galaxies.engine.obstacleTypes.length; i<len; i++ ) {
      var type = galaxies.engine.obstacleTypes[i];
      galaxies.engine.spawnTimers[ type ] += delta;
      if ( galaxies.engine.spawnTimers[ type ] >= galaxies.engine.spawnTimes[type] ) {
        galaxies.engine.spawnTimers[ type ] -= galaxies.engine.spawnTimes[type];
        galaxies.engine.addObstacle( type );
        console.log("spawn obstacle");
      }
    }
  }
  galaxies.engine.levelTimer += delta;
  if ( galaxies.engine.levelTimer > galaxies.engine.LEVEL_TIME ) {
    galaxies.engine.levelComplete = true;
  }
  if ( galaxies.engine.levelComplete &&
      (activeObstacleCount === 0) &&
      ((galaxies.engine.ufo.state === 'idle') ||
      (galaxies.engine.ufo.state === 'inactive')) ) {
    galaxies.engine.nextLevel();
  }
  
  
  // AUDIO
  galaxies.audio.soundField.update(delta);
  
  
  galaxies.engine.renderer.render( galaxies.engine.scene, galaxies.engine.camera );
  
  // TEST
  //testUpdate( delta );
}




// Randomize the drift rotation
galaxies.engine.initRootRotation = function() {
  galaxies.engine.driftAxis = new THREE.Vector3( Math.random()*2-1, Math.random()*2-1, Math.random()*2-1);
  galaxies.engine.driftAxis.normalize;
  
}

galaxies.engine.hitPlayer = function() {
  if ( galaxies.engine.isGameOver ) { return; } // prevent any rogue obstacles from causing double-death
  if ( galaxies.engine.isGracePeriod ) { return; }
  
  galaxies.engine.playerLife--;
  galaxies.ui.updateLife( galaxies.engine.playerLife );
  
  if ((!galaxies.engine.invulnerable) && (galaxies.engine.playerLife<=0)) {
    createjs.Tween.removeTweens( galaxies.engine.character.position );
    galaxies.engine.gameOver();
    return;
  }
  
  // Hop player sprite to show its been hit
  if ( !createjs.Tween.hasActiveTweens( galaxies.engine.character.position ) ) {
    createjs.Tween.get( galaxies.engine.character.position )
      .to({y:galaxies.engine.PLANET_RADIUS + galaxies.engine.CHARACTER_HEIGHT}, 250, createjs.Ease.quadOut)
      .to({y:galaxies.engine.CHARACTER_POSITION}, 250, createjs.Ease.quadOut);
  }
  
  galaxies.engine.isGracePeriod = true;
  galaxies.engine.character.material.opacity = 0.5;
  createjs.Tween.get( galaxies.engine.character ).wait(2000).call( galaxies.engine.endGracePeriod );
}

galaxies.engine.endGracePeriod = function() {
  galaxies.engine.isGracePeriod = false;
  galaxies.engine.character.material.opacity = 1;
}



// Stop time objects. These are called on user pause and also
// when window is minimized.
galaxies.engine.stopTimers = function() {
  createjs.Ticker.paused = true;
  galaxies.engine.clock.stop();
}
galaxies.engine.startTimers = function() {
  createjs.Ticker.paused = false;
  galaxies.engine.clock.start();
}

galaxies.engine.pauseGame = function() {
  galaxies.engine.isPaused = true;
  galaxies.engine.stopTimers();
  if ( galaxies.engine.animationFrameRequest != null ) {
    window.cancelAnimationFrame(galaxies.engine.animationFrameRequest);
    galaxies.engine.animationFrameRequest = null;
  }
}
galaxies.engine.resumeGame = function() {
  galaxies.engine.isPaused = false;
  galaxies.engine.startTimers();
  if ( galaxies.engine.animationFrameRequest == null ) {
    galaxies.engine.animate();
  }
}


galaxies.engine.gameOver = function() {
  galaxies.engine.isGameOver = true;
  galaxies.fx.showPlanetSplode();
  galaxies.fx.shakeCamera(1.5, 2);
  
  
  galaxies.engine.removeInputListeners();
  galaxies.engine.isFiring = false;
  
  for( var i=0, len=galaxies.engine.obstacles.length; i<len; i++ ) {
    galaxies.engine.obstacles[i].retreat();
  }
  
  /*
  for( var i=0, len=obstacles.length; i<len; i++ ) {
    console.log( obstacles[i].state );
  }*/
  
  
  galaxies.engine.ufo.leave();
  
  galaxies.ui.hidePauseButton();
  createjs.Tween.get(null).wait(2000).call( galaxies.ui.showGameOver );
}

galaxies.engine.endGame = function() {
  if ( galaxies.engine.animationFrameRequest != null ) {
    window.cancelAnimationFrame(galaxies.engine.animationFrameRequest);
    galaxies.engine.animationFrameRequest = null;
  }
  
  galaxies.engine.resetGame();
  
  if ( galaxies.engine.planet.parent != null ) {
    galaxies.engine.planet.parent.remove(galaxies.engine.planet);
  }
  galaxies.engine.rootObject.remove( galaxies.engine.characterRotator );
  
  galaxies.ui.showMenu();
}

galaxies.engine.resetGame = function() {
  galaxies.engine.isGameOver = false;
  
  galaxies.engine.clearLevel();
  
  galaxies.engine.levelNumber = galaxies.engine.START_LEVEL_NUMBER;
  galaxies.engine.score = 0;
  galaxies.engine.powerupCharge = 0;
  galaxies.engine.powerupCount = 0;
  galaxies.engine.playerLife = 3;
  
  galaxies.engine.addInputListeners();
  
  // remove character
  galaxies.engine.characterRotator.remove( galaxies.engine.character );
  // remove planet
  if ( galaxies.engine.planet.parent != null ) {
    galaxies.engine.planet.parent.remove(galaxies.engine.planet);
  }
  galaxies.engine.randomizePlanet();
  
  galaxies.engine.characterAnimator.updateFrame(0);
  
  galaxies.engine.character.rotation.set(0,0,0);
  galaxies.engine.character.material.rotation = galaxies.engine.angle;
  galaxies.engine.character.position.y = galaxies.engine.CHARACTER_POSITION;

  galaxies.engine.camera.position.setZ( galaxies.engine.CAMERA_Z );
  
  galaxies.ui.updateLevel( 1, 1 );
  galaxies.ui.updateLife( galaxies.engine.playerLife );
  galaxies.ui.updateScore( galaxies.engine.score );
  galaxies.ui.updatePowerupCharge( galaxies.engine.powerupCharge );
  galaxies.ui.clearTitle();
  
  
  // Clear transition tweens (mostly used in the planet transition)
  createjs.Tween.removeTweens( galaxies.engine.character );
  createjs.Tween.removeTweens( galaxies.engine.rootObject.rotation );
  createjs.Tween.removeTweens( galaxies.engine.planet.position );
  createjs.Tween.removeTweens( galaxies.engine.camera );
  
}
galaxies.engine.clearLevel = function() {
  
  // Deactivate active obstacles and put them in the pool
  for( var i=0, len = galaxies.engine.obstacles.length; i<len; i++ ) {
    var obstacle = galaxies.engine.obstacles[i];
    obstacle.deactivate();
    galaxies.engine.obstaclePool[obstacle.type].push(obstacle);
  }
  galaxies.engine.obstacles = [];
  
  galaxies.engine.ufo.deactivate();
  
  galaxies.engine.endGracePeriod();
}

// Capture events on document to prevent ui from blocking clicks
galaxies.engine.addInputListeners = function() {
  document.addEventListener( 'mousedown', galaxies.engine.onDocumentMouseDown, false );
  document.addEventListener( 'mouseup', galaxies.engine.onDocumentMouseUp, false );
  document.addEventListener( 'mousemove', galaxies.engine.onDocumentMouseMove, false );
  
  document.addEventListener( 'touchstart', galaxies.engine.onDocumentTouchStart, false );
  document.addEventListener( 'touchend', galaxies.engine.onDocumentMouseUp, false );
  document.addEventListener( 'touchleave', galaxies.engine.onDocumentMouseUp, false );
  document.addEventListener( 'touchmove', galaxies.engine.onDocumentTouchMove, false );
}
galaxies.engine.removeInputListeners = function() {
  document.removeEventListener( 'mousedown', galaxies.engine.onDocumentMouseDown, false );
  document.removeEventListener( 'mouseup', galaxies.engine.onDocumentMouseUp, false );
  document.removeEventListener( 'mousemove', galaxies.engine.onDocumentMouseMove, false );
  
  document.removeEventListener( 'touchstart', galaxies.engine.onDocumentTouchStart, false );
  document.removeEventListener( 'touchend', galaxies.engine.onDocumentMouseUp, false );
  document.removeEventListener( 'touchleave', galaxies.engine.onDocumentMouseUp, false );
  document.removeEventListener( 'touchmove', galaxies.engine.onDocumentTouchMove, false );
}

galaxies.engine.handleContextLost = function(e) {
  console.log("WebGL Context Lost", e);
}
galaxies.engine.handleContextRestored = function() {
  console.log("WebGL Context Restored", e);
}








galaxies.engine.showCombo = function( value, multiplier, obj ) {
  var vector = new THREE.Vector3();
  
  //obj.updateMatrixWorld();
  vector.setFromMatrixPosition(obj.matrixWorld);
  vector.project(galaxies.engine.camera);
  
  var screenX = ( vector.x * galaxies.engine.windowHalfX ) + galaxies.engine.windowHalfX;
  var screenY = - ( vector.y * galaxies.engine.windowHalfY ) + galaxies.engine.windowHalfY;
  
  // Bound the center point to keep the element from running off screen.
  var margin = 50;
  screenX = Math.max( screenX, margin );
  screenX = Math.min( screenX, window.innerWidth - margin );
  screenY = Math.max( screenY, margin );
  screenY = Math.min( screenY, window.innerHeight - margin );
  //
  
  var divElem = document.createElement('div');
  divElem.classList.add("points");
  var newContent = document.createTextNode( (value*multiplier).toString() ); 
  divElem.style.left = screenX + 'px';
  divElem.style.top = screenY + 'px';
  divElem.appendChild(newContent); //add the text node to the newly created div.
  galaxies.engine.container.appendChild(divElem);
  
  window.getComputedStyle(divElem).top; // reflow
  
  divElem.style.top = (screenY - 40) + 'px'; // animate
  divElem.style.opacity = 0;
  
  window.setTimeout( galaxies.engine.removeCombo, 2000, divElem );
  
  galaxies.engine.score += value * multiplier;
  galaxies.ui.updateScore( galaxies.engine.score );
  
  galaxies.engine.powerupCharge += Math.pow( value/100, 2 ) / galaxies.engine.POWERUP_CHARGED; // The 100 is to reduce scores from 100, 250, 500 to 1, 2.5, 5
  if ( galaxies.engine.powerupCharge >= 1 ) {
    console.log("powerup charged", galaxies.engine.powerupCapsule );
    galaxies.engine.powerupCharge = 0;
    if (galaxies.engine.powerupCapsule == null ) {
      console.log("spawn capsule");
      
      var range = Math.min( galaxies.engine.powerupCount, galaxies.engine.powerups.length-1 );
      var type = galaxies.engine.powerups[ Math.round(Math.random()*range) ];
      
      galaxies.engine.powerupCapsule = new galaxies.Capsule( type );
      
      
      
    }
  }
  galaxies.ui.updatePowerupCharge( galaxies.engine.powerupCharge );
  
  
  // Check if powerup is fully charged
}

galaxies.engine.removeCombo = function( element ) {
  element.remove();
}



// SORT-OF ENTRY POINT
galaxies.start = function() {
  // Supported browser?
  if ( !galaxies.utils.isSupportedBrowser() ) {
    // Generate URL for redirect
    var url = window.location.href;
    url = url.substring(0, url.lastIndexOf("/") );
    url = url + "/unsupported.html";
    window.location.assign(url);
    return;
  }
  
  if ( galaxies.utils.isMobile() ) {
    // touch to start
    var ttsElement = document.body.querySelector('.touch-to-start');
    ttsElement.classList.remove('hidden');
    ttsElement.addEventListener('click', function() {
      ttsElement.remove();
      
      // Play a dummy sound to free the beast!
      // Play a sound the user-triggered event to enable sounds on the page.
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      galaxies.audio.audioCtx = new AudioContext();
      
      var playNode = galaxies.audio.audioCtx.createOscillator();
      playNode.frequency.value = 4000;
      playNode.connect( galaxies.audio.audioCtx.destination );
      playNode.start(0);
      playNode.stop(0);
      
      galaxies.engine.init();
    });
  } else {
    // start on load
    var ttsElement = document.body.querySelector('.touch-to-start');
    ttsElement.remove();
    galaxies.engine.init();
  }
}


galaxies.engine.setPowerup = function ( newPowerup ) {
  galaxies.engine.characterRotator.remove( galaxies.engine.clone );
  galaxies.engine.powerupTimer = galaxies.engine.POWERUP_DURATION;
  
  switch(newPowerup) {
    case 'spread':
      galaxies.engine.shootFunction = galaxies.engine.shoot3;
      break;
    case 'clone':
      galaxies.engine.characterRotator.add( galaxies.engine.clone );
      galaxies.engine.shootFunction = galaxies.engine.shoot2;
      break;
    case 'golden':
      galaxies.engine.shootFunction = function() { galaxies.engine.shoot(true); };
      break;
    default:
      galaxies.engine.shootFunction = galaxies.engine.shoot;
      break;
  }
  
}



/*
// Debug function to start game at an arbitrary level
function manualRestart() {
  var debugFormElement = document.getElementById("debugForm");
  var newLevelNumber = parseInt( debugFormElement.querySelector("input[name='startLevel']").value );
  if ( isNaN(newLevelNumber) ) {
    newLevelNumber = 1;
  }
  
  galaxies.engine.START_LEVEL_NUMBER = newLevelNumber;
  
  gameOver();
}

*/
