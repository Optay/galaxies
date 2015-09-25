"use strict";
this.galaxies = this.galaxies || {};

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

var score;
var level;
var startLevel = 1;
var playerLife;

var levelTimer = 0;
var levelTime;
var levelComplete = false;
var PI_2 = Math.PI * 2;


// View, play parameters
var coneAngle = 11.4;
var cameraZ = 40;
var cameraViewAngle = 45; // Will be applied to smallest screen dimension, horizontal or vertical. TODO
var projectileSpeed = 3.0;
var speedScale = 1;

var LEVELS_PER_PLANET = 3;

var SHOOT_TIME = 0.4;
var PROJ_HIT_THRESHOLD = 0.7;
var RICOCHET_HIT_THRESHOLD = 1.1;
var CHARACTER_Y = 1.75;
var PROJ_START_Y = 1.25;

// Derived values
var CONE_SLOPE = Math.tan( coneAngle*Math.PI/360 );
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

var textureURLs = [  // URLs of the six faces of the cube map 
        "images/spacesky_right1.jpg",   // Note:  The order in which
        "images/spacesky_left2.jpg",   //   the images are listed is
        "images/spacesky_top3.jpg",   //   important!
        "images/spacesky_bottom4.jpg",  
        "images/spacesky_front5.jpg",   
        "images/spacesky_back6.jpg"
   ];

var camera, scene, renderer, clock;


var isUserInteracting = false,
  onMouseDownMouseX = 0, onMouseDownMouseY = 0,
  lon = 0, onMouseDownLon = 0,
  lat = 0, onMouseDownLat = 0,
  phi = 0, theta = 0;

var onPointerDownPointerX, onPointerDownPointerY, onPointerDownLon, onPointerDownLat;

var skyCube;
var planet, character, characterRotator, targetAngle = 0, angle = 0;

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
  
  var container, mesh;

  container = document.getElementById( 'container' );

  scene = new THREE.Scene();
  
  rootObject = new THREE.Object3D();
  scene.add( rootObject );
  
  // camera FOV should be 45
  camera = new THREE.PerspectiveCamera( cameraViewAngle, window.innerWidth / window.innerHeight, 1, 1100 );
  camera.position.set(0,0,cameraZ);
  rootObject.add(camera);
  
  var light = new THREE.PointLight( 0xffffff, 1, 0 );
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
  
  var planetGeometry = new THREE.SphereGeometry(1, 32, 32);
  var planetMaterial = new THREE.MeshPhongMaterial( {
      color: 0xff0000,
      specular: 0xffcc55,
      shininess: 5} );

  planet = new THREE.Mesh( planetGeometry, planetMaterial );
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
  
  
  var characterMap = new THREE.Texture( queue.getResult('lux'), THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter );
  characterMap.needsUpdate = true;
  
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
  
  console.log( queue.getResult('lux') );
  console.log( characterMap.image );
  
  var characterMaterial = new THREE.SpriteMaterial( { map: characterMap, color: 0xffffff, fog: true } );
  character = new THREE.Sprite( characterMaterial );
  character.position.set( 0, CHARACTER_Y, 0 );
  character.scale.set(1.5, 1.5, 1.5);
  characterRotator.add( character );
  
  
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  //renderer.setSize( 640, 480 );
  container.appendChild( renderer.domElement );
  
  // Capture events on document to prevent ui from blocking clicks
  document.addEventListener( 'mousedown', onDocumentMouseDown, false );
  document.addEventListener( 'mouseup', onDocumentMouseUp, false );
  document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  
  document.addEventListener( 'touchstart', onDocumentTouchStart, false );
  document.addEventListener( 'touchend', onDocumentMouseUp, false );
  document.addEventListener( 'touchleave', onDocumentMouseUp, false );
  document.addEventListener( 'touchmove', onDocumentTouchMove, false );

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
  
  initAudio( startGame );
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
  //
  
  ufo = new Ufo();
  
  resetGame();
  initLevel();

  window.addEventListener( 'resize', onWindowResize, false );
  onWindowResize();

  gameInitialized = true;
  
  animate();

  
}

function restartGame() {
  resetGame();
  
  //planetTransition(); // for testing purposes
  initLevel();
  
  animate();
}

function initLevel() {
  galaxies.ui.updateLevel( level );
  
  levelTime = 25;// + (5*level);
  levelTimer = 0;
  levelComplete = false;
  
  clearLevel();
  
  // Each planet gets a set number of levels, starting slow and speeding up.
  // Sigmoid functions set bounds of speedScale based on planet number (absolute level number).
  var planetLevel = ((level-1) % LEVELS_PER_PLANET);      // Level number for this planet
  var planet = Math.floor( level/LEVELS_PER_PLANET );     // Planet number
  var planetFirstSpeed = 1 + 1/(1+Math.exp(4-planet));    // Speed on first level for this planet
  var planetLastSpeed = 1 + 1.5/(1+Math.exp(1-planet*2)); // Speed on last level for this planet
  
  speedScale = THREE.Math.mapLinear(planetLevel, 0, 2, planetFirstSpeed, planetLastSpeed );
  //console.log( planetFirstSpeed, planetLastSpeed, speedScale );
  /*
  for ( var i=1; i<20; i++ ) {
    var planetLevel = ((i-1) % LEVELS_PER_PLANET); // level progress on planet
    var planet = Math.floor( i/LEVELS_PER_PLANET ); // Planet number
    var planetFirstSpeed = 1 + 1/(1+Math.exp(4-planet));
    var planetLastSpeed = 1 + 1.5/(1+Math.exp(1-planet*2));
    
    console.log( i, THREE.Math.mapLinear(planetLevel, 0, 2, planetFirstSpeed, planetLastSpeed ) );
  }*/
  
  
  
  var asteroidCount = Math.floor( 20 - (15 * (1/(1 + (level-1) * 0.5)) ) );
  var satelliteCount = Math.floor( 12 - (12 * (1/(1 + (level-1) * 0.5)) ) );
  var cometCount = Math.floor( 10 - (10 * (1/(1 + (level-1) * 0.1)) ) );
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
  
  initRootRotation();
  

}
function nextLevel() {
  level++;
  
  if (( (level-1) % LEVELS_PER_PLANET ) == 0) {
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
  THREE.SceneUtils.attach( planet, rootObject, scene );
  
  // put the character back
  characterRotator.add(character);
  
  initLevel();
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
  var speed;
  var geometry;
  var radius = 0.6;
  var tumble = false;
  var spiral = 0;
  var points;
  var explodeSound = 'fpo';
  var passSound = null;
  switch(type) {
    case "asteroid":
      speed = 0.2;
      geometry = new THREE.BoxGeometry(radius, radius, radius);
      tumble = true;
      points = 100;
      explodeSound = 'asteroidexplode';
      break;
    case "satellite":
      speed = 0.5;
      spiral = 0.3;
      geometry = new THREE.TetrahedronGeometry(radius);
      points = 250;
      break;
    case "comet":
      speed = 1.2;
      spiral = 1;
      geometry = new THREE.DodecahedronGeometry(radius);
      points = 500;
      explodeSound = 'cometexplode';
      passSound = 'cometloop';
      break;
      
  }
  
  var obstacle = new Asteroid( speed, spiral, geometry, tumble, points, explodeSound, passSound );
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
    var geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
    var material = new THREE.MeshPhongMaterial( {
        color: 0x999999,
        specular: 0xffffff,
        emissive: 0x999999,
        shininess: 50} );
    
    var cube = new THREE.Mesh( geometry, material );
    var pos = new THREE.Vector3(0, PROJ_START_Y, 0);
    characterRotator.localToWorld(pos);
    rootObject.worldToLocal(pos);
    cube.position.copy(pos);
    conify(cube);
    rootObject.add( cube );
    
    var direction = new THREE.Vector3( -Math.sin(angle), Math.cos(angle), 0 );
    var proj = new Projectile( cube, direction );
    projectiles.push( proj );
    
    
    // play sound
    new PositionedSound( getSound('shoot',false), rootPosition(character), 10 );
    //playSound( getSound('shoot',false), rootPosition(character), 10 );
    
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

function update() {
  var delta = clock.getDelta();
  
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
  
  ufo.update(delta);
  
  rootObject.rotateOnAxis(rootAxis, rootRotationSpeed * delta );
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
  
  
}

function initRootRotation() {
  rootAxis = new THREE.Vector3( Math.random()*2-1, Math.random()*2-1, Math.random()*2-1);
  rootAxis.normalize;
  
}

function hitPlayer() {
  
  playerLife--;
  if ((!invulnerable) && (playerLife<=0)) {
    gameOver();
    return;
  }
  galaxies.ui.updateLife( playerLife );
  
  if ( !createjs.Tween.hasActiveTweens(character.position) ) {
    createjs.Tween.get(character.position).to({y:2.5}, 250, createjs.Ease.quadOut).to({y:1.75}, 250, createjs.Ease.quadOut);
  }
}

function pauseGame() {
  if ( animationFrameRequest != null ) {
    clock.stop();
    window.cancelAnimationFrame(animationFrameRequest);
  }
}
function resumeGame() {
  clock.start();
  animate();
}


function gameOver() {
  if ( animationFrameRequest != null ) {
    window.cancelAnimationFrame(animationFrameRequest);
  }
  
  galaxies.ui.showMenu();
  
  resetGame();
  clearLevel();
  
}

function resetGame() {
  // reset game
  level = startLevel;
  score = 0;
  playerLife = 3;
  
  galaxies.ui.updateLevel( level );
  galaxies.ui.updateLife( playerLife );
  galaxies.ui.updateScore( score );
}
function clearLevel() {
  // clear all actors
  for( var i=0; i<obstacles.length; i++ ) {
    obstacles[i].remove();
  }
  obstacles = [];
  
  ufo.reset();
}


function showCombo( value, obj ) {
  var vector = new THREE.Vector3();
  
  //obj.updateMatrixWorld();
  vector.setFromMatrixPosition(obj.matrixWorld);
  vector.project(camera);
  
  var screenX = ( vector.x * windowHalfX ) + windowHalfX;
  var screenY = - ( vector.y * windowHalfY ) + windowHalfY;
  
  
  var divElem = document.createElement('div');
  divElem.className = "combo";
  var newContent = document.createTextNode( value.toString() ); 
  divElem.appendChild(newContent); //add the text node to the newly created div.
  divElem.style.left = screenX + 'px';
  divElem.style.top = screenY + 'px';
  
  
  document.getElementById("container").appendChild(divElem);
  
  window.setTimeout( removeCombo, 1000, divElem );
  
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


