"use strict";
this.galaxies = this.galaxies || {};

var canPlayEC3;


var invulnerable = false;

var animationFrameRequest;
var gameInitialized = false;

var windowHalfX = 0;
var windowHalfY = 0;
var mouseX = 0;
var mouseY = 0;

var rootObject;
var rootAxis;
var rootRotationSpeed = 0.05;

var geometries = {};
var materials = {};

var isGameOver = false;

var score;
var level;
var startLevel = 1;
var playerLife;

var levelTimer = 0;
var levelTime;
var levelComplete = false;
var PI_2 = Math.PI * 2;


// View, play parameters
var coneAngle = 11.4 * Math.PI/360;
var cameraZ = 40;
var cameraViewAngle = 45; // Will be applied to smallest screen dimension, horizontal or vertical. TODO
var projectileSpeed = 3.0;
var speedScale = 1;

var LEVELS_PER_PLANET = 3;

var SHOOT_TIME = 0.4;
var PROJ_HIT_THRESHOLD = 0.7;
var RICOCHET_HIT_THRESHOLD = 1.1;
var PLANET_RADIUS = 1;
var CHARACTER_HEIGHT = 3;
var CHARACTER_POSITION = PLANET_RADIUS + (0.95 * CHARACTER_HEIGHT/2 );
var PROJ_START_Y = PLANET_RADIUS + (CHARACTER_HEIGHT * 0.08);//2;

// Derived values
var CONE_SLOPE = Math.tan( coneAngle );
var CAMERA_SLOPE = Math.tan( cameraViewAngle*Math.PI/360 );
var OBSTACLE_VISIBLE_RADIUS = cameraZ * CONE_SLOPE * CAMERA_SLOPE/ (CONE_SLOPE + CAMERA_SLOPE);
var OBSTACLE_START_RADIUS = OBSTACLE_VISIBLE_RADIUS * 2;//OBSTACLE_VISIBLE_RADIUS * 1.2;

var PROJECTILE_LIFE = (OBSTACLE_VISIBLE_RADIUS - PROJ_START_Y)/projectileSpeed;

//

function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseMove(event) {
    mouseX = ( event.clientX - windowHalfX );
    mouseY = ( event.clientY - windowHalfY );
    
    targetAngle = -(Math.atan2(mouseY, mouseX) + Math.PI/2); // sprite is offset
    
}
function onDocumentTouchMove( event ) {
    event.preventDefault();
    
    var touches = event.changedTouches;
    for ( var i=0; i<touches.length; i++ ) {
        mouseX = touches[i].clientX - windowHalfX;
        mouseY = touches[i].clientY - windowHalfY;
        
        targetAngle = -(Math.atan2(mouseY, mouseX) + Math.PI/2); // sprite is offset
        
        document.getElementById('message').innerHTML = mouseX.toFixed(2) + ", " + mouseY.toFixed(2);
    }
        
}


/*
var textureURLs = [  // URLs of the six faces of the cube map 
        "images/spacesky_right1.jpg",   // Note:  The order in which
        "images/spacesky_left2.jpg",   //   the images are listed is
        "images/spacesky_top3.jpg",   //   important!
        "images/spacesky_bottom4.jpg",  
        "images/spacesky_front5.jpg",   
        "images/spacesky_back6.jpg"
   ];*/

var camera, scene, renderer, clock;


var isUserInteracting = false,
  onMouseDownMouseX = 0, onMouseDownMouseY = 0,
  lon = 0, onMouseDownLon = 0,
  lat = 0, onMouseDownLat = 0,
  phi = 0, theta = 0;

var onPointerDownPointerX, onPointerDownPointerY, onPointerDownLon, onPointerDownLat;

var skyCube;
var planet, character, characterRotator, characterAnimator, targetAngle = 0, angle = 0;

var ufo;

function init() {
  // It would be nice not to be using both of these.
  // create.js ticker for tweens
  createjs.Ticker.framerate = 60;
    
  // three.js clock for delta time
  clock = new THREE.Clock();
  
  galaxies.ui.init();
}
function initGame() {
  
  // Parse and cache loaded geometry.
  var objLoader = new THREE.OBJLoader();
  var parsed = objLoader.parse( queue.getResult('asteroidmodel') );
  geometries['asteroid'] = parsed.children[0].geometry;
  var projmodel = objLoader.parse( queue.getResult('projmodel') );
  geometries['proj'] = projmodel.children[0].geometry;
  var satmodel = objLoader.parse( queue.getResult('satellitemodel') );
  geometries['satellite'] = satmodel.children[0].geometry;
  var moonmodel = objLoader.parse( queue.getResult('moonmodel') );
  geometries['moon'] = moonmodel.children[0].geometry;
  var ufomodel = objLoader.parse( queue.getResult('ufomodel') );
  geometries['ufo'] = ufomodel.children[0].geometry;
  
  
  
  // define materials
  var asteroidColor = new THREE.Texture( queue.getResult('asteroidcolor'), THREE.UVMapping );
  asteroidColor.needsUpdate = true;
  var asteroidNormal = new THREE.Texture( queue.getResult('asteroidnormal'), THREE.UVMapping );
  asteroidNormal.needsUpdate = true;
  
  materials['asteroid'] = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      specular: 0x000000,
      opacity: 0.4,
      transparent: false,
      map: asteroidColor,
      normalMap: asteroidNormal,
      shading: THREE.SmoothShading
  } );
  
  var satColor = new THREE.Texture( queue.getResult('satellitecolor'), THREE.UVMapping );
  satColor.needsUpdate = true;
  
  materials['satellite'] = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      specular: 0x000000,
      opacity: 0.4,
      transparent: false,
      map: satColor,
      shading: THREE.SmoothShading
  } );
  
  
  var moonOcclusion = new THREE.Texture( queue.getResult('moonocclusion'), THREE.UVMapping );
  moonOcclusion.needsUpdate = true;
  var moonNormal = new THREE.Texture( queue.getResult('moonnormal'), THREE.UVMapping );
  moonNormal.needsUpdate = true;
  
  materials['moon'] = new THREE.MeshPhongMaterial( {
      color: 0xaaaaaa,
      specular: 0x000000,
      map: moonOcclusion,
      normalMap: moonNormal,
      shading: THREE.SmoothShading
  } );
  
  var ufoColor = new THREE.Texture( queue.getResult('ufocolor') );
  ufoColor.needsUpdate = true;
  materials['ufo'] = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      specular: 0xffaaaa,
      shininess: 80,
      transparent: false,
      map: ufoColor,
      shading: THREE.SmoothShading,
      depthTest: false
  } );  

  var projColor = new THREE.Texture( queue.getResult('projcolor'), THREE.UVMapping );
  projColor.needsUpdate = true;
  
  materials['proj'] = new THREE.MeshBasicMaterial( {
      color: 0xcccccc,
      
      map: projColor,
      shading: THREE.SmoothShading
  } );
  
  
  
  
  
  
  var container, mesh;

  container = document.getElementById( 'container' );

  scene = new THREE.Scene();
  
  rootObject = new THREE.Object3D();
  scene.add( rootObject );
  
  // camera FOV should be 45
  camera = new THREE.PerspectiveCamera( cameraViewAngle, window.innerWidth / window.innerHeight, 1, 1100 );
  camera.position.set(0,0,cameraZ);
  rootObject.add(camera);
  
  /*
  var light = new THREE.PointLight( 0xffffff, 1, 0 );
  light.position.set( 30, 20, 50 );
  rootObject.add( light );
  */
  var light = new THREE.DirectionalLight( 0xffffff, 1 );
  light.position.set( 30, 20, 50 );
  rootObject.add( light );
  
  /*
  // TEST OBJECT
  var geometry = new THREE.SphereGeometry( 0.1, 12, 6 );
  var material = new THREE.MeshBasicMaterial( {
    color: 0xff0000
  } );
  var test = new THREE.Mesh( geometry, material );
  var testPosition = new THREE.Vector3( 0, OBSTACLE_VISIBLE_RADIUS, 0);
  testPosition.z = getConifiedDepth( testPosition );
  test.position.copy( testPosition );
  
  rootObject.add( test );
  */

  //var texture = THREE.ImageUtils.loadTextureCube( textureURLs );
  var texture = new THREE.CubeTexture([
                    queue.getResult('skyboxright1'),
                    queue.getResult('skyboxleft2'),
                    queue.getResult('skyboxtop3'),
                    queue.getResult('skyboxbottom4'),
                    queue.getResult('skyboxfront5'),
                    queue.getResult('skyboxback6') ] );
  texture.needsUpdate = true;
  
  /* Set up a material that uses a cubemap texture.  This material uses
     custom vertex and fragment shaders that are defined in three.js as
     part of its shader library.  This code is copied from examples in
     the three.js download. */
  var shader = THREE.ShaderLib[ "cube" ];
  shader.uniforms[ "tCube" ].value = texture;
  var material = new THREE.ShaderMaterial( { // A ShaderMaterial uses custom vertex and fragment shaders.
      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
      uniforms: shader.uniforms,
      depthWrite: false,
      side: THREE.BackSide
  } );

  skyCube = new THREE.Mesh( new THREE.BoxGeometry( 200, 200, 200 ), material );
  rootObject.add(skyCube);
  
  /*
  var planetGeometry = new THREE.SphereGeometry(1, 32, 32);
  var planetMaterial = new THREE.MeshPhongMaterial( {
      color: 0xff0000,
      specular: 0xffcc55,
      shininess: 5} );
*/
  planet = new THREE.Mesh( geometries['moon'], materials['moon'] );
  rootObject.add( planet );
  
  characterRotator = new THREE.Object3D();
  rootObject.add( characterRotator );
  
  //var characterMap = THREE.ImageUtils.loadTexture( "images/lux.png" );
  //characterMap.minFilter = THREE.LinearFilter;
  
  /*
  var test = document.createElement( 'img' );
  //test.src = 'images/lux.png';
  test.src = queue.getResult('lux').src;
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
  //var characterMap = new THREE.Texture( queue.getResult('lux'), THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter );
  var characterMap = new THREE.Texture( queue.getResult('lux') );
  characterAnimator = new galaxies.SpriteSheet(
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
      [2,680,172,224,0,4,81.35] ],
    30
    );
  characterMap.needsUpdate = true;
  
  var characterMaterial = new THREE.SpriteMaterial( { map: characterMap, color: 0xffffff } );
  //var characterMaterial = new THREE.SpriteMaterial( { color: 0xffffff } );
  character = new THREE.Sprite( characterMaterial );
  character.position.set( CHARACTER_HEIGHT * 0.77 * 0.15, CHARACTER_POSITION, 0 ); // note that character is offset horizontally because sprites are not centered
  character.scale.set(CHARACTER_HEIGHT*0.77, CHARACTER_HEIGHT, CHARACTER_HEIGHT * 0.77); // 0.77 is the aspect ratio width/height of the sprites
  //character.scale.set(5, 5, 5);
  characterRotator.add( character );
  

  
  
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  //renderer.setSize( 640, 480 );
  container.appendChild( renderer.domElement );
  
  addInputListeners();

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

  var debugFormElement = document.getElementById("debugForm");
  var audioToggle = debugFormElement.querySelector("input[name='audio']");
  audioToggle.addEventListener('click', function(event) { toggleAudio( audioToggle.checked ); } );
  var soundFieldToggle = debugFormElement.querySelector("input[name='soundField']");
  soundFieldToggle.addEventListener('click', function(event) { toggleSoundField( soundFieldToggle.checked ); } );
  var surroundToggle = debugFormElement.querySelector("input[name='surround']");
  surroundToggle.addEventListener('click', function(event) { toggleTargetMix( surroundToggle.checked ); } );
  debugFormElement.querySelector("button[name='restart']").addEventListener('click', manualRestart );
  
  galaxies.fx.init( scene );
  
  startGame();
  
  // TEST
  //addTestObject();
  
  /*
  window.setInterval( function() {
    randomizePlanet();
    //galaxies.fx.shakeCamera();
  }, 3000 );
  */
  
  //
}

var testObjects = [];
function addTestObject() {
  /*
  //var colorMap = new THREE.Texture( queue.getResult('asteriodColor'), THREE.UVMapping );
  var colorMap = new THREE.Texture( queue.getResult('asteroidcolor'), THREE.UVMapping );
  colorMap.needsUpdate = true;
  var normalMap = new THREE.Texture( queue.getResult('asteroidnormal'), THREE.UVMapping );
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
  
  testObject = new THREE.Mesh( geometries['asteroid'], material );
  testObject.position.set( 0, 0, 10 );
  rootObject.add( testObject );
  var scale = 10;
  testObject.scale.set( scale, scale, scale );
  */
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
//new THREE.Texture( queue.getResult('projhitparticle') );
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
      
      
      window.setInterval( function() {
        gameOver();
        
        /*
        particleGroup1.triggerPoolEmitter(1);
        particleGroup2.triggerPoolEmitter(1);
        galaxies.fx.showPlanetRubble();
        */
        
      }, 3000 );
      

      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      //var ref = new THREE.Mesh( new THREE.TetrahedronGeometry(0.6), new THREE.MeshLambertMaterial() );
      //particleGroup.mesh.add( ref );
  
}

function startGame() {
  
  // audio
  // Set initial mix to 6-channel surround.
  // TODO - detect this automagically
  toggleTargetMix( true );
  
  // configure listener (necessary for correct panner behavior when mixing for stereo)
  listenerObject = camera;
  listener.setOrientation(0,0,-1,0,1,0);
  listener.setPosition( listenerObject.position.x, listenerObject.position.y, listenerObject.position.z );
  
  soundField = new SoundField( getSound('music') );
  soundField.setVolume(0.24); // 0.24
  //
  
  ufo = new galaxies.Ufo();
  
  resetGame();
  initLevel();

  window.addEventListener( 'resize', onWindowResize, false );
  onWindowResize();

  gameInitialized = true;
  
  if ( animationFrameRequest == null ) {
    animate();
  }
  
}

function restartGame() {
  resetGame();

  galaxies.ui.showPauseButton(); // is hidden by game over menu  
  
  //planetTransition(); // for testing purposes
  initLevel();
  
  createjs.Ticker.paused = false;
  clock.start();
  
  if ( animationFrameRequest == null ) {
    animate();
  }
}

function initLevel() {
  
  levelTime = 25;// + (5*level);
  levelTimer = 0;
  levelComplete = false;
  
  // Each planet gets a set number of levels, starting slow and speeding up.
  // NOTE: LEVEL, ROUND, AND PLANET NUMBERS ARE ALL 1-INDEXED
  // Sigmoid functions set bounds of speedScale based on planet number (absolute level number).
  var planetRound = ((level-1) % LEVELS_PER_PLANET) + 1;      // Round number for this planet
  var planet = Math.floor((level-1)/LEVELS_PER_PLANET) + 1;     // Planet number
  
  var planetFirstSpeed = 1 + 1/(1+Math.exp(4-planet));    // Speed on first level for this planet
  var planetLastSpeed = 1 + 1.5/(1+Math.exp(1-planet/2)); // Speed on last level for this planet
  
  speedScale = THREE.Math.mapLinear(planetRound, 1, 3, planetFirstSpeed, planetLastSpeed );
  //console.log( planetFirstSpeed, planetLastSpeed, speedScale );
  /*
  for ( var i=1; i<20; i++ ) {
    var planetLevel = ((i-1) % LEVELS_PER_PLANET); // level progress on planet
    var planet = Math.floor( i/LEVELS_PER_PLANET ); // Planet number
    var planetFirstSpeed = 1 + 1/(1+Math.exp(4-planet));
    var planetLastSpeed = 1 + 1.5/(1+Math.exp(1-planet*2));
    
    console.log( i, THREE.Math.mapLinear(planetLevel, 0, 2, planetFirstSpeed, planetLastSpeed ) );
  }*/
  
  
  // Counts for obstacles start low and asymptote to a max value.
  // Max values are first integer in formula. Initial value is first integer minus second integer.
  var asteroidCount = Math.floor( 20 - (15 * (1/(1 + (level-1) * 0.3)) ) );
  var satelliteCount = Math.floor( 8 - (6 * (1/(1 + (level-1) * 0.2)) ) );
  var cometCount = Math.floor( 8 - (7 * (1/(1 + (level-1) * 0.1)) ) );
  for ( var i=0; i<asteroidCount; i++ ) {
    addObstacle( 'asteroid' );
  }
  
  for ( var i=0; i<satelliteCount; i++ ) {
    addObstacle( 'satellite' );
  }
  
  for ( var i=0; i<cometCount; i++ ) {
    addObstacle( 'comet' );
  }
  
  /*
  for (var i=1; i<20; i++ ) {
    var asteroidCount = Math.floor( 20 - (15 * (1/(1 + (i-1) * 0.5)) ) );
    var satelliteCount = Math.floor( 12 - (12 * (1/(1 + (i-1) * 0.5)) ) );
    var cometCount = Math.floor( 10 - (10 * (1/(1 + (i-1) * 0.1)) ) );
    console.log(i, asteroidCount, satelliteCount, cometCount);
  }*/
  
  
  if ( level >= 3 ) {
  //if (true ) { // UFO test
    ufo.activate();
  }
  
  initRootRotation();
  
  galaxies.ui.updateLevel( planet, planetRound );
  
  if ( planetRound === 1 ) {
    galaxies.ui.showTitle( galaxies.utils.generatePlanetName(planet), 5 );
  }
  galaxies.ui.showTitle("ROUND " + planetRound, 3 );
  

}
function nextLevel() {
  level++;
  
  clearLevel();
  
  var roundNumber = ((level-1) % LEVELS_PER_PLANET ) + 1;
  if ( roundNumber == 1 ) {
    planetTransition();
  } else {
    initLevel();
  }
  
}


function planetTransition() {
  // Reset the level timer, so the game state doesn't look like we've finished a level during the transition
  levelComplete = false;
  levelTimer = 0;
  
  // hide the character
  characterRotator.remove(character);
  
  // Move planet to scene level, so it will not be affected by rootObject rotation while it flies off.
  THREE.SceneUtils.detach (planet, rootObject, scene);
  // Set outbound end position and inbound starting position for planet
  var outPosition = rootObject.localToWorld(new THREE.Vector3(0,0,-100) );
  var inPosition = rootObject.localToWorld(new THREE.Vector3(0,-100,0) );
  
  // Tween!
  createjs.Tween.get( planet.position ).to({x:outPosition.x, y:outPosition.y, z:outPosition.z}, 4000, createjs.Ease.quadInOut).
    to({x:inPosition.x, y:inPosition.y, z:inPosition.z}, 0).
    call(randomizePlanet, null, this).
    to({x:0, y:0, z:0}, 4000, createjs.Ease.quadInOut);
  
  // Swing the world around
  //createjs.Tween.get( camera.rotation ).to({x:PI_2, y:PI_2}, 8000, createjs.Ease.quadInOut ).call(planetTransitionComplete);
  var targetX = rootObject.rotation.x + Math.PI/2;
  createjs.Tween.get( rootObject.rotation ).to({x:targetX}, 8000, createjs.Ease.quadInOut ).call(planetTransitionComplete);
  
  // Stop drifting in the x-axis to prevent drift rotation from countering transition.
  // This ensures planet will move off-screen during transition.
  rootAxis.x = 0;
  rootAxis.normalize();
  //rootAxis.set(0,0,0);
}
function planetTransitionComplete() {
  // reattach the planet to the rootObject
  THREE.SceneUtils.attach( planet, scene, rootObject );
  
  // put the character back
  characterRotator.add(character);
  
  initLevel();
}

function randomizePlanet() {
  planet.rotation.set( Math.random()*PI_2, Math.random()*PI_2, Math.random()*PI_2 );
  planet.material.color.setHSL( Math.random(), THREE.Math.randFloat(0.1, 0.4), THREE.Math.randFloat(0.5, 0.7) );
  //planet.material.color.setRGB(1,0,0);
  

}



function onDocumentMouseDown( event ) {

	event.preventDefault();

	//isUserInteracting = true;

	onPointerDownPointerX = event.clientX;
	onPointerDownPointerY = event.clientY;

	onPointerDownLon = lon;
	onPointerDownLat = lat;
    
    isFiring = true;
}
function onDocumentTouchStart( event ) {
    event.preventDefault();
    
    isFiring = true;
    onDocumentTouchMove( event );
}


function onDocumentMouseUp( event ) {
	isUserInteracting = false;
    isFiring = false;
}


var obstacles = [];
function addObstacle( type ) {
  var props = {};
  props.speed = 0.2;
  props.tumble = false;
  props.tumbleOnHit = true;
  props.spiral = 0;
  props.points = 100;
  props.explodeSound = 'fpo';
  props.passSound = null;
  props.orient = false;
  props.explodeType = 'rubble';
  
  switch(type) {
    case 'asteroid':
    //case "never":
      props.speed = 0.2;
      props.tumble = true;
      props.points = 100;
      props.explodeSound = 'asteroidexplode';
      
      var material = new THREE.MeshPhongMaterial();
      material.setValues( materials['asteroid'] );
      props.model = new THREE.Mesh( geometries['asteroid'], material );
      props.model.scale.set( 0.5, 0.5, 0.5 );
      props.anchor = props.model; // no container object in this case
      break;
    case 'satellite':
    //default:
    //case "never":
      props.speed = 0.5;
      props.spiral = 0.7;
      props.points = 250;
      props.orient = true;
      
      var material = new THREE.MeshPhongMaterial();
      material.setValues( materials['satellite'] );
      var model = new THREE.Mesh( geometries['satellite'], material );
      model.position.y = -2;
      
      var modelOrient = new THREE.Object3D();
      modelOrient.add(model);
      modelOrient.rotation.x = 1.3; // Face away from camera, but not completely aligned with cone surface
      modelOrient.rotation.z = 0.5; // Face direction of motion a little
      
      props.anchor = new THREE.Object3D(); // holder, so we can properly center and orient the model
      props.anchor.add(modelOrient);
      var satScale = 0.4;
      props.anchor.scale.set(satScale, satScale, satScale);
      
      props.model = modelOrient;
      
      /*
      var ref = new THREE.Mesh( new THREE.CubeGeometry(1,1,1), new THREE.MeshLambertMaterial() );
      props.anchor.add( ref );
      var ref2 = new THREE.Mesh( new THREE.CubeGeometry(1,1,1), new THREE.MeshLambertMaterial() );
      modelOrient.add( ref2 );
      var ref3 = new THREE.Mesh( new THREE.CubeGeometry(1,1,1), new THREE.MeshLambertMaterial() );
      model.add( ref3 );
      */
      
      
      
      
      
      break;
    case 'comet':
    //case 'never':
    //default:
      props.speed = 1.2;
      props.spiral = 1;
      props.points = 500;
      props.orient = true;
      props.tumbleOnHit = false;
      props.explodeType = 'fireworks';
      
      props.explodeSound = 'cometexplode';
      props.passSound = 'cometloop';
      
      var emitterSettings = {
        type: 'cube',
        positionSpread: new THREE.Vector3(0.6, 0.6, 0.6),
        //radius: 0.1,
        velocity: new THREE.Vector3(0, 0, -5),
        velocitySpread: new THREE.Vector3(0.2, 0.2, 2),
        //speed: 1,
        sizeStart: 6,
        sizeStartSpread: 4,
        sizeEnd: 2,
        opacityStart: 0.8,
        opacityEnd: 0.1,
        colorStart: new THREE.Color("rgb(6, 6, 20)"),
        //colorStartSpread: new THREE.Vector3(42/255, 0, 0),
        colorEnd: new THREE.Color("rgb(255, 77, 0)"),
        particlesPerSecond: 10,
        particleCount: 200,
        alive: 1.0,
        duration: null
      };
      
      var texture = new THREE.Texture( queue.getResult('starparticle') );
      texture.needsUpdate = true;
      var particleGroup = new SPE.Group({
        texture: texture,
        maxAge: 1.5,
        blending: THREE.AdditiveBlending//THREE.AdditiveBlending
      });
      particleGroup.addEmitter( new SPE.Emitter( emitterSettings) );
      props.particleGroup = particleGroup;
      props.anchor = particleGroup.mesh;
      
      // solid core (for when particles are thin at edge of screen )
      var mat = new THREE.SpriteMaterial( { map: texture, color: 0xffffff, fog: true, blending: THREE.AdditiveBlending } );
      var core = new THREE.Sprite( mat );
      props.anchor.add( core );
      
      break;
      
  }
  
  var obstacle = new Asteroid( props );
  obstacles.push( obstacle );
  
}







var shotTimer = SHOOT_TIME;
var projectiles = [];
var isFiring;

function shoot() {
  if ( shotTimer>0 ) { return; }
  shotTimer = SHOOT_TIME;
  
  //console.log("shoot");
    
  // Instantiate shot object
  var projMesh = new THREE.Mesh( geometries['proj'], materials['proj'] );
  var projScale = 0.1;
  projMesh.scale.set(projScale, projScale, projScale );
  
  var proj = new Projectile( projMesh, angle );
  projectiles.push( proj );
    
  // play animation
  characterAnimator.play();
  
  // delay adding the projectile and the sound to synchronize with the animation
  createjs.Tween.get(character).wait(250).call( shootSync, [proj], this );
    
}
function shootSync( proj ) {
  
  // play sound
  new PositionedSound( getSound('shoot',false), rootPosition(character), 10 );
  proj.updatePosition( angle );
  proj.addToScene();
  
}


function animate() {

	animationFrameRequest = requestAnimationFrame( animate );
	update();

}


/// Set z-position for objects to map x-y plane to a cone.
//var parabolicConeSlope = coneSlope/3; // This constant here is related to the radius value used by obstacles
function conify( object ) {
  object.position.setZ( getConifiedDepth( object.position ) );
}
function getConifiedDepth( position ) {
  // linear
  return ( (flatLength(position)/CONE_SLOPE) );
  // parabolic
  //return ( flatLengthSqr(position) * parabolicConeSlope - 0 );
}


// Game Loop
function update() {
  var delta = clock.getDelta();
  if ( delta===0 ) { return; } // paused!
  
  // Test for hits, projectiles and ricochets
  var activeObstacleCount = 0;
  for (var iObs=0; iObs<obstacles.length; iObs++ ){
    //if ( obstacles[iObs].falling ) { continue; }
    if (obstacles[iObs].state === 'inactive') {
      if ( !levelComplete ) {
        obstacles[iObs].resetPosition();
      }
    } else {
      activeObstacleCount++;
    }
    
    if ( (obstacles[iObs].state === 'inactive') || ( obstacles[iObs].state === 'waiting' )) { continue; }
    for ( var jObs = (iObs+1); jObs<obstacles.length; jObs++ ) {
      //if ( !obstacles[jObs].falling ) { continue; }
      if ( (obstacles[jObs].state === 'inactive') || ( obstacles[jObs].state === 'waiting' )) { continue; }
      
      var dist = obstacles[iObs].object.position.distanceTo( obstacles[jObs].object.position );
      //var dist = flatLength( obstacles[iObs].object.position.clone().sub( obstacles[jObs].object.position ) );
      if ( dist < RICOCHET_HIT_THRESHOLD ) {
        if ( (obstacles[iObs].state!=='ricocheting') && (obstacles[jObs].state!=='ricocheting') ) {
          // push overlapping obstacles apart
          var overlap = RICOCHET_HIT_THRESHOLD - dist;
          
          var shift= obstacles[jObs].object.position.clone();
          shift.sub( obstacles[iObs].object.position );
          shift.z = 0;
          shift.setLength( overlap/2 );
          
          obstacles[iObs].object.position.sub( shift );
          obstacles[jObs].object.position.add( shift );
        } else if ( (obstacles[iObs].isActive) && (obstacles[jObs].isActive) ) {
          // Cache values for correct simultaneous behavior.
          var jRic = obstacles[jObs].ricochetCount;
          var iRic = obstacles[iObs].ricochetCount;
          var jPos = obstacles[jObs].object.position.clone();
          var iPos = obstacles[iObs].object.position.clone();
          obstacles[jObs].hit( iPos, iRic );
          obstacles[iObs].hit( jPos, jRic );
        }
      }
    }
    for (var iProj=0; iProj<projectiles.length; iProj++ ) {
      if ( obstacles[iObs].isActive && (projectiles[iProj].object.position.distanceTo( obstacles[iObs].object.position ) < PROJ_HIT_THRESHOLD ) ) {
        obstacles[iObs].hit( projectiles[iProj].object.position );
        projectiles[iProj].destroy();
      }
    }
  }
  if ( (ufo != null) && (ufo.isHittable) ) {
    for (var iProj=0; iProj<projectiles.length; iProj++ ) {
      var ufoRootPosition = ufo.object.localToWorld( new THREE.Vector3() );
      ufoRootPosition = rootObject.worldToLocal( ufoRootPosition );
      if ( projectiles[iProj].object.position.distanceTo( ufoRootPosition ) < PROJ_HIT_THRESHOLD ) {
        ufo.hit();
        projectiles[iProj].destroy();
      }
    }
  }
  //
  
  // Update obstacles
  for (var i=0; i<obstacles.length; i++ ) {
    obstacles[i].update( delta );
    conify( obstacles[i].object );
  }
  
  // Update projectiles
  var expiredProjectiles = [];
  for( var i=0; i<projectiles.length; i++ ){
    var proj = projectiles[i];
    proj.update( delta );
    if ( proj.isExpired ) {
      expiredProjectiles.push( proj );
    }
    
    conify( proj.object );
    
  }
  for ( var i=0; i<expiredProjectiles.length; i++ ) {
    projectiles.splice( projectiles.indexOf(expiredProjectiles[i]), 1);
    expiredProjectiles[i].remove();
  }
  
  if ( shotTimer>0) { shotTimer -= delta; }
  if ( isFiring ) {
    shoot();
  }
  //
  
  // update ufo
  ufo.update(delta);
  
  // update world
  rootObject.rotateOnAxis(rootAxis, rootRotationSpeed * delta );

  // update fx
  galaxies.fx.update(delta);
  
  
  
  /*
  if ( isUserInteracting === false ) {

    lon += 0.1;

  }

  lat = Math.max( - 85, Math.min( 85, lat ) );
  phi = THREE.Math.degToRad( 90 - lat );
  theta = THREE.Math.degToRad( lon );

  var target = new THREE.Vector3( 0, 0, 0 );
  target.x = 500 * Math.sin( phi ) * Math.cos( theta );
  target.y = 500 * Math.cos( phi );
  target.z = 500 * Math.sin( phi ) * Math.sin( theta );

  rootObject.lookAt( target );
  //camera.lookAt( camera.target );
*/
  /*
  // distortion
  camera.position.copy( camera.target ).negate();
  */
  
  // move objects towards target
  
  // update character
  if ( !isGameOver ) {
    var angleDelta = (targetAngle-angle);
    angleDelta = (angleDelta % (2*Math.PI) );
    if ( angleDelta > Math.PI ) {
      angleDelta = angleDelta - 2*Math.PI;
    }
    if ( angleDelta < -Math.PI ) {
      angleDelta = angleDelta + 2*Math.PI;
    }
    angle += (angleDelta * delta * 10.0);
    
    characterRotator.rotation.set(0,0,angle);
    character.material.rotation = angle;
    characterAnimator.update( delta);
  }
  
  renderer.render( scene, camera );
  
  levelTimer += delta;
  if ( levelTimer > levelTime ) {
    levelComplete = true;
  }
  if ( levelComplete && (activeObstacleCount === 0) ) {
    nextLevel();
  }
  
  
  // AUDIO
  mixChannels(delta);
  updateSoundField(delta);
  
  //testUpdate( delta );
}

function testUpdate( delta ) {
  for (var i=0, len = testObjects.length; i<len; i++ ) {
    testObjects[i].tick(delta); // particle system
  }
  //testObject.rotation.y = testObject.rotation.y + 1*delta;
}


function initRootRotation() {
  rootAxis = new THREE.Vector3( Math.random()*2-1, Math.random()*2-1, Math.random()*2-1);
  rootAxis.normalize;
  
}

function hitPlayer() {
  if ( isGameOver ) {return;} // prevent any rogue obstacles from causing double-death
  
  playerLife--;
  galaxies.ui.updateLife( playerLife );
  
  if ((!invulnerable) && (playerLife<=0)) {
    createjs.Tween.removeTweens( character.position );
    gameOver();
    return;
  }
  
  if ( !createjs.Tween.hasActiveTweens(character.position) ) {
    createjs.Tween.get(character.position).to({y:PLANET_RADIUS + CHARACTER_HEIGHT}, 250, createjs.Ease.quadOut).to({y:CHARACTER_POSITION}, 250, createjs.Ease.quadOut);
  }
}

function pauseGame() {
  if ( animationFrameRequest != null ) {
    createjs.Ticker.paused = true;
    clock.stop();
    window.cancelAnimationFrame(animationFrameRequest);
    animationFrameRequest = null;
  }
}
function resumeGame() {
  createjs.Ticker.paused = false;
  clock.start();
  if ( animationFrameRequest == null ) {
    animate();
  }
}


function gameOver() {
  isGameOver = true;
  galaxies.fx.showPlanetSplode();
  galaxies.fx.shakeCamera(1);
  
  
  removeInputListeners();
  isFiring = false;
  
  for( var i=0, len=obstacles.length; i<len; i++ ) {
    obstacles[i].retreat();
  }
  
  for( var i=0, len=obstacles.length; i<len; i++ ) {
    console.log( obstacles[i].state );
  }
  
  
  ufo.leave();
  
  galaxies.ui.hidePauseButton();
  createjs.Tween.get(null).wait(2000).call( galaxies.ui.showGameOver );
}
function endGame() {
  if ( animationFrameRequest != null ) {
    window.cancelAnimationFrame(animationFrameRequest);
    animationFrameRequest = null;
  }
  
  galaxies.ui.showMenu();
  
  resetGame();
}

function resetGame() {
  isGameOver = false;
  
  clearLevel();
  
  level = startLevel;
  score = 0;
  playerLife = 3;
  
  addInputListeners();
  
  rootObject.add(planet);
  randomizePlanet();
  
  characterAnimator.updateFrame(0);
  
  character.rotation.set(0,0,0);
  character.material.rotation = angle;
  character.position.y = CHARACTER_POSITION;
  
  galaxies.ui.updateLevel( 1, 1 );
  galaxies.ui.updateLife( playerLife );
  galaxies.ui.updateScore( score );
  galaxies.ui.clearTitle();
}
function clearLevel() {
  // clear all actors
  for( var i=0; i<obstacles.length; i++ ) {
    obstacles[i].remove();
  }
  obstacles = [];
  
  ufo.deactivate();
}

// Capture events on document to prevent ui from blocking clicks
function addInputListeners() {
  document.addEventListener( 'mousedown', onDocumentMouseDown, false );
  document.addEventListener( 'mouseup', onDocumentMouseUp, false );
  document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  
  document.addEventListener( 'touchstart', onDocumentTouchStart, false );
  document.addEventListener( 'touchend', onDocumentMouseUp, false );
  document.addEventListener( 'touchleave', onDocumentMouseUp, false );
  document.addEventListener( 'touchmove', onDocumentTouchMove, false );
}
function removeInputListeners() {
  document.removeEventListener( 'mousedown', onDocumentMouseDown, false );
  document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
  document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
  
  document.removeEventListener( 'touchstart', onDocumentTouchStart, false );
  document.removeEventListener( 'touchend', onDocumentMouseUp, false );
  document.removeEventListener( 'touchleave', onDocumentMouseUp, false );
  document.removeEventListener( 'touchmove', onDocumentTouchMove, false );
}










function showCombo( value, obj ) {
  var vector = new THREE.Vector3();
  
  //obj.updateMatrixWorld();
  vector.setFromMatrixPosition(obj.matrixWorld);
  vector.project(camera);
  
  var screenX = ( vector.x * windowHalfX ) + windowHalfX;
  var screenY = - ( vector.y * windowHalfY ) + windowHalfY;
  
  
  var divElem = document.createElement('div');
  divElem.classList.add("points");
  var newContent = document.createTextNode( value.toString() ); 
  divElem.style.left = screenX + 'px';
  divElem.style.top = screenY + 'px';
  divElem.appendChild(newContent); //add the text node to the newly created div.
  document.getElementById("container").appendChild(divElem);
  
  window.getComputedStyle(divElem).top; // reflow
  
  divElem.style.top = (screenY - 40) + 'px'; // animate
  divElem.style.opacity = 0;
  
  window.setTimeout( removeCombo, 2000, divElem );
  
  score += value;
  galaxies.ui.updateScore( score );
    
}

function removeCombo( element ) {
  element.remove();
}





function flatLength( vector ) {
  return Math.sqrt( Math.pow(vector.x, 2) + Math.pow(vector.y,2) );
}
function flatLengthSqr(vector ) {
  return (Math.pow(vector.x, 2) + Math.pow(vector.y,2));
}

function rootPosition( object ) {
  var foo = object.position.clone();
  if ( object.parent == null ) {
    return foo;
  } else {
    return rootObject.worldToLocal( object.parent.localToWorld( foo ) );
  }

}













// DEBUG
function toggleAudio( value ) {
  //console.log("toggleAudio", value);
  if ( value ) {
    ufo.ufoSound.sound.muteVolume.gain.value = 1;
  } else {
    ufo.ufoSound.sound.muteVolume.gain.value = 0;
  }
}
function toggleSoundField( value ) {
  if ( value ) {
    soundField.setVolume(0.24);
  } else {
    soundField.setVolume(0);
  }
}

function manualRestart() {
  var debugFormElement = document.getElementById("debugForm");
  var levelNumber = parseInt( debugFormElement.querySelector("input[name='startLevel']").value );
  if ( isNaN(levelNumber) ) {
    levelNumber = 1;
  }
  
  startLevel = levelNumber;
  
  gameOver();
}


