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

galaxies.engine.driftSpeed = 0.01;

galaxies.engine.isPaused = false;
galaxies.engine.isGameOver = false;

galaxies.engine.START_LEVEL_NUMBER = 1;

galaxies.engine.levelTimer = 0;
galaxies.engine.LEVEL_TIME = 15;
galaxies.engine.levelComplete = false;
galaxies.engine.levelRunning = false;

galaxies.engine.obstacleTypes = ['asteroid',
                                 'asteroidice',
                                 'asteroidrad',
                                 'asteroidradchild',
                                 'comet'];//['asteroid', 'satellite', 'comet'];

// View, play parameters
galaxies.engine.speedScale = 1;

// "constants"
// Some of these are fixed, some are dependent on window size and are recalculated in 
// the window resize function.
galaxies.engine.CONE_ANGLE = 15 * Math.PI/360;//11.4 * Math.PI/360; // Half-angle of the interior of the cone

galaxies.engine.CAMERA_DISTANCES = [30, 40, 50];
galaxies.engine.CAMERA_Z = galaxies.engine.CAMERA_DISTANCES[0]; // 40 is original value

galaxies.engine.CAMERA_VIEW_ANGLE = 45; // Will be applied to smallest screen dimension, horizontal or vertical. TODO
galaxies.engine.ROUNDS_PER_PLANET = 3; // 3

galaxies.engine.PLANET_DISTANCE = 1.25;

galaxies.engine.OBSTACLE_GRAVITY = -0.5;

galaxies.engine.SHOOT_TIME = 0.5; // 0.4 in original

galaxies.engine.POWERUP_DURATION = 40; // time in seconds
galaxies.engine.POWERUP_CHARGED = 100;//3300; // powerup spawns when this many points are earned, set low for easier testing of powerups
galaxies.engine.powerups = ['clone', 'spread', 'golden'];
galaxies.engine.powerupMessagesShown = [];

galaxies.engine.PLANET_RADIUS = 1;
galaxies.engine.CHARACTER_HEIGHT = 4.5;
galaxies.engine.CHARACTER_POSITION = galaxies.engine.PLANET_RADIUS + (0.65 * galaxies.engine.CHARACTER_HEIGHT/2 );
galaxies.engine.PROJ_START_Y = galaxies.engine.PLANET_RADIUS + (galaxies.engine.CHARACTER_HEIGHT * 0.08);//2;

galaxies.engine.CONE_SLOPE = Math.tan( galaxies.engine.CONE_ANGLE );
galaxies.engine.CAMERA_SLOPE = Math.tan( galaxies.engine.CAMERA_VIEW_ANGLE*Math.PI/360 );
galaxies.engine.VISIBLE_RADIUS = galaxies.engine.CAMERA_Z * galaxies.engine.CONE_SLOPE * galaxies.engine.CAMERA_SLOPE/ (galaxies.engine.CONE_SLOPE + galaxies.engine.CAMERA_SLOPE);

galaxies.engine.MAX_PLAYER_LIFE = 3;


// Level number also updates roundNumber and planetNumber.
// NOTE: LEVEL, ROUND, AND PLANET NUMBERS ARE ALL 1-INDEXED, they are "number" not "index"
Object.defineProperty( galaxies.engine, 'levelNumber', {
  get: function() { return galaxies.engine._levelNumber; },
  set: function( value ) {
    galaxies.engine._levelNumber = value;
    galaxies.engine.roundNumber = ((galaxies.engine.levelNumber-1) % galaxies.engine.ROUNDS_PER_PLANET ) + 1;
    galaxies.engine.planetNumber = Math.floor((galaxies.engine.levelNumber-1)/galaxies.engine.ROUNDS_PER_PLANET) + 1;
  }
});
galaxies.engine.levelNumber = galaxies.engine.START_LEVEL_NUMBER;


// Scene/game objects
galaxies.engine.targetAngle = 0;
galaxies.engine.angle = 0;

// Active obstacles.
galaxies.engine.obstacles = [];
galaxies.engine.inactiveObstacles = [];

// Pool obstacles separately to avoid having to create new meshes.
galaxies.engine.obstaclePool = {};
for(var i=0, len = galaxies.engine.obstacleTypes.length; i<len; i++ ) {
  galaxies.engine.obstaclePool[ galaxies.engine.obstacleTypes[i] ] = [];
}

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
  galaxies.engine.updateView();
  
}

// Set view parameters
galaxies.engine.updateView = function() {
  // Sets active play area by diagonal window size
  var diagonal = Math.sqrt( Math.pow(galaxies.engine.camera.aspect,2) + 1 );
  var cameraSlope = diagonal * Math.tan( galaxies.engine.CAMERA_VIEW_ANGLE * Math.PI/360 );
  
  galaxies.engine.VISIBLE_RADIUS = galaxies.engine.CAMERA_Z * galaxies.engine.CONE_SLOPE * galaxies.engine.CAMERA_SLOPE/ (galaxies.engine.CONE_SLOPE + galaxies.engine.CAMERA_SLOPE);
  galaxies.engine.OBSTACLE_VISIBLE_RADIUS = galaxies.engine.CAMERA_Z * galaxies.engine.CONE_SLOPE * cameraSlope/ (galaxies.engine.CONE_SLOPE + cameraSlope);
  galaxies.Projectile.prototype.PROJECTILE_LIFE = (galaxies.engine.OBSTACLE_VISIBLE_RADIUS - galaxies.engine.PROJ_START_Y)/galaxies.Projectile.prototype.PROJECTILE_SPEED;
  
  galaxies.engine.OBSTACLE_START_DISTANCE = galaxies.engine.OBSTACLE_VISIBLE_RADIUS * 1.1;//1.2;
  
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

  galaxies.engine.stats = new Stats();
  galaxies.engine.stats.domElement.style.position = 'absolute';
  galaxies.engine.stats.domElement.style.left = '0';
  galaxies.engine.stats.domElement.style.top = '0';
  document.body.appendChild(galaxies.engine.stats.domElement);
  
  // Detect minimized/inactive window to avoid bad delta time values.
  document.addEventListener("visibilitychange", galaxies.engine.onVisibilityChange );
  
  galaxies.ui.init();
  
}

// Create 3D scene, camera, light, skybox
galaxies.engine.initScene = function() {
  
  galaxies.resources = new galaxies.Resources();
  
  
  var mesh;
  galaxies.engine.container = document.getElementById( 'container' );

  galaxies.engine.scene = new THREE.Scene();
  
  galaxies.engine.driftObject = new THREE.Object3D();
  galaxies.engine.scene.add( galaxies.engine.driftObject );
  
  galaxies.engine.rootObject = new THREE.Object3D();
  galaxies.engine.driftObject.add( galaxies.engine.rootObject );
  
  galaxies.engine.camera = new THREE.PerspectiveCamera( galaxies.engine.CAMERA_VIEW_ANGLE, window.innerWidth / window.innerHeight, 0.3, 1100 );
  galaxies.engine.camera.position.set(0,0,galaxies.engine.CAMERA_Z);
  galaxies.engine.rootObject.add(galaxies.engine.camera);
  
  galaxies.engine.light = new THREE.DirectionalLight( 0xffffff, 1 );
  galaxies.engine.rootObject.add( galaxies.engine.light );

  var sunTex = new THREE.Texture(galaxies.queue.getResult('sun'));
  sunTex.needsUpdate = true;

  var sunMat = new THREE.MeshBasicMaterial({map: sunTex, transparent: true, blending: THREE.AdditiveBlending});

  galaxies.engine.sun = new THREE.Mesh( new THREE.PlaneGeometry(100, 100, 1, 1), sunMat);
  galaxies.engine.sun.visible = false;

  var flareTex = new THREE.Texture(galaxies.queue.getResult('lensFlare'));
  flareTex.needsUpdate = true;

  galaxies.engine.sunFlares = new THREE.LensFlare(flareTex, 60, 0.2, THREE.AdditiveBlending, new THREE.Color(1.5, 1.5, 1.5));
  galaxies.engine.sunFlares.add(flareTex, 100, 0.25, THREE.AdditiveBlending, new THREE.Color(1.3, 0.8, 0.8));
  galaxies.engine.sunFlares.add(flareTex, 150, 0.4, THREE.AdditiveBlending, new THREE.Color(1.2, 1.2, 1.8));
  galaxies.engine.sunFlares.add(flareTex, 60, 0.41, THREE.AdditiveBlending, new THREE.Color(1.3, 2, 1.3));
  galaxies.engine.sunFlares.add(flareTex, 230, 0.6, THREE.AdditiveBlending, new THREE.Color(0.6, 1, 1));

  galaxies.engine.rootObject.add(galaxies.engine.sun);
  galaxies.engine.sun.add(galaxies.engine.sunFlares);

  galaxies.engine.setLightPosition([0,0]);
  
  /* Set up a material that uses a cubemap texture.  This material uses
     custom vertex and fragment shaders that are defined in three.js as
     part of its shader library.  This code is copied from examples in
     the three.js download. */
  var shader = THREE.ShaderLib[ "cube" ];
  shader.uniforms[ "tCube" ].value = galaxies.resources.skyTexture;
  var material = new THREE.ShaderMaterial( { // A ShaderMaterial uses custom vertex and fragment shaders.
      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
      uniforms: shader.uniforms,
      depthWrite: false,
      side: THREE.BackSide
  } );

  galaxies.engine.skyCube = new THREE.Mesh( new THREE.BoxGeometry( 200, 200, 200 ), material );
  galaxies.engine.scene.add(galaxies.engine.skyCube);
  
  
  galaxies.engine.renderer = new THREE.WebGLRenderer({alpha: true});
  galaxies.engine.renderer.setPixelRatio( window.devicePixelRatio );
  galaxies.engine.renderer.setSize( window.innerWidth, window.innerHeight );
  galaxies.engine.container.appendChild( galaxies.engine.renderer.domElement );
  
  galaxies.engine.renderer.context.canvas.addEventListener( "webglcontextlost", galaxies.engine.handleContextLost, false);
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
  
  galaxies.engine.planet = new THREE.Mesh( galaxies.resources.geometries['moon'], galaxies.resources.materials['moon'] );
  galaxies.engine.rootObject.add( galaxies.engine.planet );
  
  // Create background planet
  var bgMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    map: galaxies.resources.bgPlanetTextures[0].texture,
    transparent: true
  } );
  galaxies.engine.bgPlanet = new THREE.Mesh( new THREE.PlaneGeometry(200, 200, 1, 1),
                                             bgMaterial );
  
  galaxies.engine.player = new galaxies.Player();
  galaxies.engine.rootObject.add( galaxies.engine.player.root );
  
  galaxies.engine.setPowerup();
  
  galaxies.engine.addInputListeners();

  galaxies.fx.init( galaxies.engine.scene );

  galaxies.engine.startGame();
  
} // initGame


galaxies.engine.startGame = function() {
  // There can be only one!
  galaxies.engine.ufo = new galaxies.Ufo();
  
  galaxies.engine.resetGame();
  galaxies.engine.removeInputListeners();
  galaxies.engine.planetTransition();

  galaxies.engine.gameInitialized = true;
  
  if ( galaxies.engine.animationFrameRequest == null ) {
    galaxies.engine.animate();
  }
  
}

galaxies.engine.restartGame = function() {
  galaxies.ui.showPauseButton(); // is hidden by game over menu
  
  // Add character holder.
  // Character will be removed by planet transition.
  galaxies.engine.rootObject.add( galaxies.engine.player.root );
  
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
  galaxies.engine.levelRunning = true;
  
  // Each planet gets a set number of levels, starting slow and speeding up.
  // Sigmoid functions set bounds of speedScale based on planet number (absolute level number).
  
  var planetFirstSpeed = 1 + 1/(1+Math.exp(4-galaxies.engine.planetNumber));    // Speed on first level for this planet
  var planetLastSpeed = 1 + 1.5/(1+Math.exp(1-galaxies.engine.planetNumber/2)); // Speed on last level for this planet
  
  galaxies.engine.speedScale = THREE.Math.mapLinear(galaxies.engine.roundNumber, 1, 3, planetFirstSpeed, planetLastSpeed );
  
  galaxies.generator.initLevel( galaxies.engine.levelNumber-1 );
  
  galaxies.ui.updateLevel( galaxies.engine.planetNumber, galaxies.engine.roundNumber );
  
  galaxies.ui.showTitle("ROUND " + galaxies.engine.roundNumber, 1.5 );
  
  galaxies.engine.updateCameraZ( galaxies.engine.roundNumber );
  
  if ( galaxies.engine.roundNumber === 1 ) {
    // Reset star counter
    galaxies.engine.starsCollectedRound = 0;
    galaxies.ui.updateStars( galaxies.engine.starsCollectedRound );

    // Update score tracking
    galaxies.engine.previousTotal = galaxies.engine.score;
    galaxies.engine.roundScore = 0;
    galaxies.engine.projectilesLaunchedRound = 0;
    galaxies.engine.projectilesHitRound = 0;

    if (galaxies.engine.levelNumber !== 1) {
      galaxies.audio.soundField.changeSource(galaxies.audio.getSound('music'));
    }
  } else if (galaxies.engine.roundNumber === 3) {
    galaxies.audio.soundField.changeSource(galaxies.audio.getSound('round3music'));
  }
  

}

galaxies.engine.updateCameraZ = function( roundNumber ) {
  galaxies.engine.CAMERA_Z = galaxies.engine.CAMERA_DISTANCES[ roundNumber-1 ];
  galaxies.engine.updateView();
  
  createjs.Tween.removeTweens( galaxies.engine.camera.position );
  createjs.Tween.get( galaxies.engine.camera.position )
    .to({z:galaxies.engine.CAMERA_Z}, 1500, createjs.Ease.quadInOut);
}

galaxies.engine.nextLevel = function() {
  galaxies.engine.levelNumber++;
  
  galaxies.engine.clearLevel();

  if ( galaxies.engine.roundNumber == 1 ) {
    var accuracy = galaxies.engine.projectilesHitRound / galaxies.engine.projectilesLaunchedRound;

    galaxies.engine.roundScore = Math.round(galaxies.engine.roundScore * (1 + accuracy) * Math.pow(2, galaxies.engine.starsCollectedRound));

    galaxies.ui.showLevelResults(galaxies.engine.roundScore, accuracy);
  }

  setTimeout(function () {
    // game ends after earth
    if ( galaxies.engine.planetNumber > 7 ) {
      galaxies.engine.gameOver( true );
      return;
    }


    if ( galaxies.engine.roundNumber == 1 ) {
      galaxies.engine.score = galaxies.engine.previousTotal + galaxies.engine.roundScore;

      galaxies.ui.updateScore(galaxies.engine.score);

      galaxies.engine.initRootRotation();
      galaxies.engine.planetTransition();
      galaxies.ui.clearLevelResults();
    } else {
      galaxies.engine.initLevel();
    }
  }, galaxies.engine.roundNumber == 1 ? 6000 : 0);
};

galaxies.engine.updateBackgroundPlanet = function() {
  var bgPlanetIndex = (galaxies.engine.planetNumber - 1) % galaxies.resources.bgPlanetTextures.length;

  galaxies.engine.rootObject.add( galaxies.engine.bgPlanet );

  galaxies.engine.rootObject.add(galaxies.engine.sun);
  galaxies.engine.sun.add(galaxies.engine.sunFlares);
  galaxies.engine.sunFlares.position.set(0, 0, 0);
  
  galaxies.engine.bgPlanet.position.set( -50, 120, -100 );

  var sunTargetScale = 1;

  switch (bgPlanetIndex) {
    case 1:
      galaxies.engine.sun.position.set( -135, 240, -101 );
      sunTargetScale = 0.3;
      galaxies.engine.sun.visible = true;
      break;
    case 5:
      galaxies.engine.bgPlanet.position.set( 50, 120, -100 );
      galaxies.engine.sun.position.set( -80, 120, -101 );
      sunTargetScale = 0.8;
      galaxies.engine.sun.visible = true;
      break;
    case 6:
      galaxies.engine.sun.position.set( 80, 90, -101 );
      sunTargetScale = 1;
      galaxies.engine.sun.visible = true;
      break;
    default:
      galaxies.engine.sun.visible = false;
  }

  galaxies.engine.bgPlanet.updateMatrixWorld(true);
  THREE.SceneUtils.detach( galaxies.engine.bgPlanet, galaxies.engine.rootObject, galaxies.engine.scene );
  
  galaxies.engine.bgPlanet.up = galaxies.engine.rootObject.localToWorld( new THREE.Vector3(0,1,0) );

  console.log( "Setting background planet texture", galaxies.engine.planetNumber, galaxies.resources.bgPlanetTextures.length, bgPlanetIndex );
  galaxies.engine.bgPlanet.material.map = galaxies.resources.bgPlanetTextures[bgPlanetIndex].texture;

  if (galaxies.engine.sun.visible) {
    galaxies.engine.sun.scale.set(0.1, 0.1, 0.1);
    galaxies.engine.sun.updateMatrixWorld(true);

    THREE.SceneUtils.detach(galaxies.engine.sun, galaxies.engine.rootObject, galaxies.engine.scene);
    THREE.SceneUtils.detach(galaxies.engine.sunFlares, galaxies.engine.sun, galaxies.engine.scene);

    createjs.Tween.removeTweens( galaxies.engine.sun.scale );
    createjs.Tween.get( galaxies.engine.sun.scale )
        .to({x:sunTargetScale, y:sunTargetScale, z:sunTargetScale}, 3000, createjs.Ease.quadOut);
  }
  
  createjs.Tween.removeTweens( galaxies.engine.bgPlanet.scale );

  galaxies.engine.bgPlanet.scale.set( 0.1, 0.1, 0.1 );
  var targetScale = galaxies.resources.bgPlanetTextures[bgPlanetIndex].scale;
  // Tween time should be dependent on transition time which should be a constant
  createjs.Tween.get( galaxies.engine.bgPlanet.scale )
    .to({x:targetScale, y:targetScale, z:targetScale}, 3000, createjs.Ease.quadOut);

}

galaxies.engine.planetTransition = function() {
  // Reset the level timer, so we don't trigger nextLevel again.
  galaxies.engine.levelComplete = false;
  galaxies.engine.levelRunning = false;
  galaxies.engine.levelTimer = 0;
  
  // disable input
  galaxies.engine.removeInputListeners();
  galaxies.engine.isFiring = false;
  
  console.log("begin planet transition");
  
  // If planet is in the scene, then we must do the teleport out transition first.
  // If planet is not in the scene, then we skip this step (happens on the first level of new games).
  if ( galaxies.engine.planet.parent != null ) {
    galaxies.engine.player.teleportOut();
    new galaxies.audio.PositionedSound({
      source: galaxies.audio.getSound('teleportout'),
      position: galaxies.utils.rootPosition( galaxies.engine.player.sprite ),
      baseVolume: 10,
      loop: false
    });
    
    // 1500 is the teleport time as defined in FX and foolishly inaccessible.
    createjs.Tween.removeTweens( galaxies.engine.player.sprite );
    createjs.Tween.get( galaxies.engine.player.sprite )
      .wait(1500)
      .call( galaxies.engine.startPlanetMove, null, this );
  } else {
    galaxies.engine.startPlanetMove();
  }
  
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
  var outPosition = galaxies.engine.rootObject.localToWorld( new THREE.Vector3(0,-30,20) );
  //var outPosition = new THREE.Vector3(0,0,-100);
  var inPosition = galaxies.engine.rootObject.localToWorld( new THREE.Vector3(0,100,0) );
  
  var transitionTimeMilliseconds = 6500;
  // Tween!
  createjs.Tween.removeTweens( galaxies.engine.planet.position );
  createjs.Tween.get( galaxies.engine.planet.position )
    .to({x:outPosition.x, y:outPosition.y, z:outPosition.z}, transitionTimeMilliseconds/2, createjs.Ease.quadInOut)
    .to({x:inPosition.x, y:inPosition.y, z:inPosition.z}, 0)
    .call( function() {
      
      galaxies.engine.updateCameraZ( 1 );
      
      galaxies.engine.updateScene();
      
      galaxies.ui.showTitle( galaxies.resources.levelTitles[ galaxies.engine.planetNumber-1 ], 4 );
      console.log(galaxies.engine.planetNumber, galaxies.resources.levelTitles[ galaxies.engine.planetNumber-1 ] );
      
    }, null, this)
    .to({x:0, y:0, z:0}, transitionTimeMilliseconds/2, createjs.Ease.quadInOut);

  // move out the bg planet (so it disappears safely)
  createjs.Tween.removeTweens( galaxies.engine.bgPlanet.scale );
  
  var targetScale = 0.2;
  // Tween time should be dependent on transition time which should be a constant
  createjs.Tween.get( galaxies.engine.bgPlanet.scale )
    .to({x:targetScale, y:targetScale, z:targetScale}, transitionTimeMilliseconds/2, createjs.Ease.quadInOut);
  
  
  
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
  galaxies.engine.angle = 0;
  galaxies.engine.targetAngle = 0;
  galaxies.engine.player.show();
  galaxies.engine.player.teleportIn( galaxies.engine.planetTransitionComplete );
  new galaxies.audio.PositionedSound({
    source: galaxies.audio.getSound('teleportin'),
    position: galaxies.utils.rootPosition( galaxies.engine.player.sprite ),
    baseVolume: 10,
    loop: false
  });
}

galaxies.engine.planetTransitionComplete = function() {
  galaxies.engine.addInputListeners();
  
  galaxies.engine.initLevel();
}

// randomize moon, set and position bgplanet, set scene lighting
galaxies.engine.updateScene = function() {
  galaxies.engine.scene.add( galaxies.engine.planet ); // First level planet must be added here
  galaxies.engine.randomizePlanet();
  
  if ( galaxies.engine.roundNumber === 1 ) {
    // Update background planet
    galaxies.engine.updateBackgroundPlanet();
    // Update lighting
    galaxies.engine.setLightPosition( galaxies.resources.lightAngles[(galaxies.engine.planetNumber - 1)%galaxies.resources.lightAngles.length] );
  }

}

galaxies.engine.randomizePlanet = function() {
  galaxies.engine.planet.rotation.set( Math.random()*galaxies.utils.PI_2, Math.random()*galaxies.utils.PI_2, Math.random()*galaxies.utils.PI_2, 'ZXY' );
  galaxies.engine.planet.material.color.setHSL( Math.random(), THREE.Math.randFloat(0.1, 0.4), THREE.Math.randFloat(0.5, 0.7) );
  galaxies.engine.planetAngle = galaxies.engine.planet.rotation.z;   // planetAngle is the zero value for rotation the planet when lux moves

}

galaxies.engine.setLightPosition = function( angles ) {
  var azimuth = angles[0] * Math.PI/180;
  var cazi = Math.cos( azimuth );
  var sazi = Math.sin( azimuth);
  var altitude = angles[1] * Math.PI/180;
  var calt = Math.cos( altitude );
  var salt = Math.sin( altitude );
  
  galaxies.engine.light.position.set( cazi * calt, sazi * calt, salt );
}


galaxies.engine.onDocumentMouseDown = function( event ) {
    // Commented out so datgui menu works, has side effect of making
    // FX text selectable.
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
  var obstacle = galaxies.Obstacle.create( type );
  galaxies.engine.obstacles.push( obstacle );
  
  return obstacle;
}
galaxies.engine.addStar = function( angle ) {
  console.log("addStar");
  var star = new galaxies.Star( angle );
  galaxies.engine.stars++;
  return star;
}
galaxies.engine.addUfo = function() {
  if ( galaxies.engine.ufo.state === 'inactive' ) {
    galaxies.engine.ufo.activate();
  }
}

galaxies.engine.shoot = function( indestructible ) {
  if ( typeof(indestructible) !== 'boolean' ) {
    indestructible = false;
  }

  if ( galaxies.engine.shotTimer>0 ) { return; }
  galaxies.engine.shotTimer = galaxies.engine.SHOOT_TIME;

  // Instantiate shot object
  var projMesh = new THREE.Mesh( galaxies.resources.geometries['proj'], galaxies.resources.materials['proj'] );
  var projScale = 0.1;
  projMesh.scale.set(projScale, projScale, projScale );
  
  var proj = new galaxies.Projectile( projMesh, galaxies.engine.angle, 0, indestructible, indestructible ? galaxies.fx.getRainbowEmitter() : null );
  galaxies.engine.projectiles.push( proj );
    
  // play animation
  galaxies.engine.player.animateShoot();
  
  // delay adding the projectile and the sound to synchronize with the animation
  createjs.Tween.get( galaxies.engine.player.sprite ).wait(250)
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
    
    var proj = new galaxies.Projectile( projMesh, galaxies.engine.angle + (Math.PI * i), 0, false, galaxies.fx.getPurpleTrailEmitter() );
    galaxies.engine.projectiles.push( proj );
      
    // delay adding the projectile and the sound to synchronize with the animation
    createjs.Tween.get( galaxies.engine.player.sprite ).wait(250)
    .call( galaxies.engine.shootSync, [proj, Math.PI * i], this );
  }
  // play animation
  galaxies.engine.player.animateShoot();
  createjs.Tween.get( galaxies.engine.player.sprite ).wait(250)
  .call( galaxies.engine.shootSound );

}


// When the correct point in the character animation is reached,
// realign the projectile with the current angle and let it fly.
galaxies.engine.shootSync = function( proj, angleOffset ) {
  angleOffset = angleOffset || 0;

  proj.updatePosition( galaxies.engine.angle + angleOffset );
  proj.addToScene();
}
galaxies.engine.shootSound = function() {
  // play sound
  galaxies.engine.testKeepReference = new galaxies.audio.SimpleSound({
    source: galaxies.audio.getSound('shoot'),
    position: galaxies.utils.rootPosition( galaxies.engine.player.sprite ),
    baseVolume: 0.8,//10,
    loop: false
  });
}


// Spread fire
galaxies.engine.shoot3 = function() {
  if ( galaxies.engine.shotTimer>0 ) { return; }
  galaxies.engine.shotTimer = galaxies.engine.SHOOT_TIME;

  for ( var i=-1; i<=1; i++ ) {
    // Instantiate shot object
    var projMesh = new THREE.Mesh( galaxies.resources.geometries['proj'], galaxies.resources.materials['proj'] );
    var projScale = 0.1;
    projMesh.scale.set(projScale, projScale, projScale );
    
    var proj = new galaxies.Projectile( projMesh, galaxies.engine.angle, i * Math.PI / 6, false, galaxies.fx.getSmallFlameJetGroup(i === 0) );
    galaxies.engine.projectiles.push( proj );
      
    // delay adding the projectile and the sound to synchronize with the animation
    createjs.Tween.get( galaxies.engine.player.sprite ).wait(250).call( galaxies.engine.shootSync, [proj], this );
  }
  // play animation
  galaxies.engine.player.animateShoot();
  createjs.Tween.get( galaxies.engine.player.sprite ).wait(250)
  .call( galaxies.engine.shootSound );
  
}




galaxies.engine.animate = function() {

  galaxies.engine.animationFrameRequest = requestAnimationFrame( galaxies.engine.animate );
  galaxies.engine.update();

}


// Game Loop
galaxies.engine.update = function() {
  var delta = galaxies.engine.clock.getDelta();

  galaxies.engine.stats.begin();

  if ( delta === 0 ) { galaxies.engine.stats.end(); return; } // paused!
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
      var obstacleJ = galaxies.engine.obstacles[jObs];
      if ( (obstacleJ.state === 'inactive') || ( obstacleJ.state === 'waiting' )) { continue; }
      
      var dist = obstacleI.object.position.distanceTo( obstacleJ.object.position );
      if ( dist < (obstacleI.hitThreshold + obstacleJ.hitThreshold) ) {
        if ( (obstacleI.state!=='ricocheting') && (obstacleJ.state!=='ricocheting') ) {
         
          // Collide obstacles to update velocities
          galaxies.engine.collide( obstacleI, obstacleJ );
          
          // Push overlapping obstacles apart
          // This is done in cartesian coordinates using object positions.
          // Angle and radial position is then set from the udpated object position.
          
          var overlap = (obstacleI.hitThreshold + obstacleJ.hitThreshold) - dist;
          
          var shift = obstacleJ.object.position.clone();
          shift.sub( obstacleI.object.position );
          if ( shift.length() === 0 ) {
            shift.set( THREE.Math.randFloatSpread(1), THREE.Math.randFloatSpread(1), 0 );
            shift.setZ( galaxies.utils.getConifiedDepth( shift ) );
          }
          shift.setLength( overlap/2 );
          
          obstacleI.object.position.sub( shift );
          obstacleJ.object.position.add( shift );
          
          obstacleI.angle = Math.atan2( obstacleI.object.position.y, obstacleI.object.position.x );
          obstacleI.radius = Math.sqrt( Math.pow( obstacleI.object.position.y, 2 ) + Math.pow( obstacleI.object.position.x, 2 ) );
          
          obstacleJ.angle = Math.atan2( obstacleJ.object.position.y, obstacleJ.object.position.x );
          obstacleJ.radius = Math.sqrt( Math.pow( obstacleJ.object.position.y, 2 ) + Math.pow( obstacleJ.object.position.x, 2 ) );
        
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
        obstacleI.hit( proj.object.position, 1, proj.indestructible );
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
        galaxies.engine.ufo.hit( false );
        proj.hit();
      }
    }
  }
  // Neutral objects
  for (var i=0, iLen = galaxies.engine.neutrals.length; i<iLen; i++ ){
    var neutral = galaxies.engine.neutrals[i];
    for (var iProj=0, projLen = galaxies.engine.projectiles.length; iProj<projLen; iProj++ ) {
      var proj = galaxies.engine.projectiles[iProj];
      if ( neutral.isActive && (proj.object.position.distanceTo( neutral.object.position ) < neutral.hitThreshold) ) {
        neutral.hit();
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
    var index = galaxies.engine.neutrals.indexOf( galaxies.engine.inactiveNeutrals[i] );
    if ( index >=0 ) {
      galaxies.engine.neutrals.splice( index, 1 );
    }
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
  }
  //

  // Powerup timer
  // Only changes while the level is running.
  if ( galaxies.engine.levelRunning && (galaxies.engine.powerupTimer > 0) ) {
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
  
  // update bg and sun
  var cameraScenePos = galaxies.engine.camera.localToWorld( new THREE.Vector3() );
  galaxies.engine.bgPlanet.lookAt( cameraScenePos );

  if (galaxies.engine.sun.visible) {
    galaxies.engine.sun.lookAt(cameraScenePos);
    galaxies.engine.sunFlares.position.copy(galaxies.engine.sun.position.clone().sub(cameraScenePos).multiplyScalar(0.5).add(cameraScenePos));

    var sunScreenPos = galaxies.engine.sun.position.clone().project(galaxies.engine.camera);

    galaxies.engine.light.position.set(sunScreenPos.x, sunScreenPos.y, -1 + sunScreenPos.length() * 0.8);
  }

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
    
    galaxies.engine.player.update( delta, galaxies.engine.angle );
    
    
    /*
    // planet counter-rotation
    if ( galaxies.engine.planet.parent === galaxies.engine.rootObject ) {
      galaxies.engine.planet.rotation.z = galaxies.engine.planetAngle-(galaxies.engine.angle/4);
    }
    */
  }
  
  // TIME
  if ( !galaxies.engine.isGameOver && !galaxies.generator.isLevelComplete() ) {
    galaxies.generator.tick( delta );
  } else {
    galaxies.engine.levelComplete = true;
  }
  
  if ( galaxies.engine.levelRunning &&
      galaxies.engine.levelComplete &&
      (activeObstacleCount === 0) &&
      ((galaxies.engine.ufo.state === 'idle') ||
      (galaxies.engine.ufo.state === 'inactive')) ) {
    galaxies.engine.nextLevel();
  }
  
  
  // AUDIO
  galaxies.audio.soundField.update(delta);
  
  
  galaxies.engine.renderer.render( galaxies.engine.scene, galaxies.engine.camera );

  galaxies.engine.stats.end();
}

// Calculate the results of an elastic collision between two obstacles.
galaxies.engine.collide = function( obsA, obsB ) {
  // Obstacles use polar coordinates. To keep things simple, we treat the objects as if they
  // were at the same angular position when they collide. This is a reasonable approximation.
  
  // Convert to reference frame of obsA.
  var velocityRadial = obsB.velocityRadial - obsA.velocityRadial;
  var velocityTangential = obsB.velocityTangential - obsA.velocityTangential;
  
  // Break velocity into normal and tangential components relative to collision axis.
  var collisionAngle = Math.atan2( obsB.object.position.y - obsA.object.position.y,
                                   obsB.object.position.x - obsA.object.position.x );
  collisionAngle = collisionAngle - obsA.angle; // Again, relative to object A.

  var c = Math.cos( collisionAngle );
  var s = Math.sin( collisionAngle );
  
  // Normal and perpendicular components relative to collision axis
  var velocityNormal = velocityRadial * c + velocityTangential * s;
  var velocityPerp = velocityTangential * c - velocityRadial * s;
  
  // Make sure objects are actually moving towards each other at this point.
  if (velocityNormal>=0) {
    return false;
  }
  
  // Apply collision to normal component.
  var velocityNormalA = 2*obsB.mass * velocityNormal / (obsA.mass + obsB.mass);
  var velocityNormalB = (obsB.mass - obsA.mass) * velocityNormal / (obsA.mass + obsB.mass);
  
  // Recombine components and convert back to global reference frame.
  
  // Obstacle B (the moving one in our reference frame)
  velocityTangential = velocityPerp * c + velocityNormalB * s;
  velocityRadial = velocityNormalB * c - velocityPerp *s;
  obsB.velocityTangential = velocityTangential + obsA.velocityTangential;
  obsB.velocityRadial = velocityRadial + obsA.velocityRadial;
  
  // Obstacle A (stationary in the initial conditions of our reference frame)
  obsA.velocityTangential += velocityNormalA * s;
  obsA.velocityRadial += velocityNormalA * c;

  return true;
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
    galaxies.engine.player.clearTweens();
    galaxies.engine.gameOver();
    return;
  }
  
  // Hop player sprite to show its been hit
  galaxies.engine.player.animateHit();
  
  galaxies.engine.isGracePeriod = true;
  galaxies.engine.player.sprite.material.opacity = 0.5;
  createjs.Tween.get( galaxies.engine.player ).wait(2000).call( galaxies.engine.endGracePeriod );
}

galaxies.engine.endGracePeriod = function() {
  galaxies.engine.isGracePeriod = false;
  galaxies.engine.player.sprite.material.opacity = 1;
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


galaxies.engine.gameOver = function( isWin ) {
  if ( typeof(isWin) !== 'boolean' ) { isWin = false; }
  
  galaxies.engine.isGameOver = true;
  galaxies.engine.removeInputListeners();
  galaxies.engine.isFiring = false;
  galaxies.ui.hidePauseButton();
  
  if ( isWin ) {
    galaxies.ui.showGameOver( isWin );
  } else {
  
    galaxies.fx.showPlanetSplode();
    galaxies.fx.shakeCamera(2, 2);
    
    for( var i=0, len=galaxies.engine.obstacles.length; i<len; i++ ) {
      galaxies.engine.obstacles[i].retreat();
    }
    
    galaxies.engine.ufo.leave();
    
    createjs.Tween.get(null).wait(2000).call( galaxies.ui.showGameOver, [isWin] );
  }
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
  galaxies.engine.rootObject.remove( galaxies.engine.player.root );
  
  galaxies.ui.showMenu();
}

galaxies.engine.resetGame = function() {
  galaxies.engine.isGameOver = false;
  
  galaxies.engine.clearLevel();
  
  galaxies.engine.levelNumber = galaxies.engine.START_LEVEL_NUMBER;
  galaxies.engine.starsCollected = 0;
  galaxies.engine.starsCollectedRound = 0;
  galaxies.engine.stars = 0;
  galaxies.engine.score = 0;
  galaxies.engine.previousTotal = 0;
  galaxies.engine.roundScore = 0;
  galaxies.engine.projectilesLaunchedRound = 0;
  galaxies.engine.projectilesHitRound = 0;
  galaxies.engine.powerupCharge = 0;
  galaxies.engine.powerupCount = 0;
  galaxies.engine.playerLife = galaxies.engine.MAX_PLAYER_LIFE;
  galaxies.engine.setPowerup();
  
  
  // Reset star counter
  galaxies.engine.starsCollectedRound = 0;
  galaxies.ui.updateStars( galaxies.engine.starsCollectedRound );
  
  
  galaxies.engine.addInputListeners();
  
  // remove character
  galaxies.engine.player.hide();
  // remove planet
  if ( galaxies.engine.planet.parent != null ) {
    galaxies.engine.planet.parent.remove(galaxies.engine.planet);
  }
  galaxies.engine.randomizePlanet();
  
  galaxies.engine.player.reset( galaxies.engine.angle );

  galaxies.engine.CAMERA_Z = galaxies.engine.CAMERA_DISTANCES[0];
  galaxies.engine.camera.position.setZ( galaxies.engine.CAMERA_Z );
  
  galaxies.ui.updateLevel( 1, 1 );
  galaxies.ui.updateLife( galaxies.engine.playerLife );
  galaxies.ui.updateScore( galaxies.engine.score );
  galaxies.ui.updatePowerupCharge( galaxies.engine.powerupCharge );
  galaxies.ui.clearTitle();
  
  
  // Clear transition tweens (mostly used in the planet transition)
  galaxies.engine.player.clearTweens();
  createjs.Tween.removeTweens( galaxies.engine.player );
  createjs.Tween.removeTweens( galaxies.engine.rootObject.rotation );
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

  galaxies.engine.levelRunning = false;
  
  galaxies.generator.levelComplete();
  
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




galaxies.engine.collectStar = function() {
  galaxies.engine.starsCollected++;
  galaxies.engine.starsCollectedRound++;
  galaxies.ui.updateStars( galaxies.engine.starsCollectedRound );
  
}



galaxies.engine.showCombo = function( value, multiplier, obj ) {
  var vector = new THREE.Vector3();
  
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
  galaxies.engine.roundScore += value * multiplier;
  galaxies.ui.updateScore( galaxies.engine.score );
  
  // The 100 is to reduce scores from 100, 250, 500 to 1, 2.5, 5
  // The exponent scales the values, so more valuable targets have higher values.
  //galaxies.engine.powerupCharge += Math.pow( value/100, 2 ) / galaxies.engine.POWERUP_CHARGED;
  galaxies.engine.powerupCharge += value/galaxies.engine.POWERUP_CHARGED;
  //if ( true ) { // test powerups
  if ( galaxies.engine.powerupCharge >= 1 ) {
    
    if (galaxies.engine.powerupCapsule == null ) {
    //if ( false ) { // disables all powerups
      
      galaxies.engine.powerupCharge = 0;
      
      galaxies.engine.powerupCount++;
      var giveHeart = ( galaxies.engine.playerLife < galaxies.engine.MAX_PLAYER_LIFE ) && ( (galaxies.engine.powerupCount%4) === 0 );
      galaxies.engine.powerupCapsule = new galaxies.Capsule( giveHeart );
      
    }
  }
  galaxies.ui.updatePowerupCharge( galaxies.engine.powerupCharge );
  
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
  if ( !newPowerup ) { newPowerup = ''; }
  
  // This is not a "true" powerup, just an instant effect.
  if ( newPowerup === 'heart' ) {
    if ( galaxies.engine.playerLife < galaxies.engine.MAX_PLAYER_LIFE ) {
      galaxies.engine.playerLife++;
      galaxies.ui.updateLife( galaxies.engine.playerLife );
    }
    return;
  }
  
  galaxies.engine.player.setPowerup( newPowerup );
  galaxies.engine.powerupTimer = galaxies.engine.POWERUP_DURATION;

  var powerupMessage = '';
  
  switch(newPowerup) {
    case 'spread':
      galaxies.engine.shootFunction = galaxies.engine.shoot3;
      powerupMessage = 'Triple Racquet';
      break;
    case 'clone':
      galaxies.engine.shootFunction = galaxies.engine.shoot2;
      powerupMessage = 'Alien Pro';
      break;
    case 'golden':
      galaxies.engine.shootFunction = function() { galaxies.engine.shoot(true); };
      powerupMessage = 'Rainbow of Death';
      break;
    default:
      galaxies.engine.shootFunction = galaxies.engine.shoot;
      break;
  }

  if (powerupMessage && !galaxies.engine.powerupMessagesShown[newPowerup]) {
    galaxies.engine.powerupMessagesShown[newPowerup] = true;

    galaxies.ui.showTitle(powerupMessage, 1.8);
  }
  
}


