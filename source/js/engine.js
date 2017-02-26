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

galaxies.engine.invulnerable = false;

galaxies.engine.gameInitialized = false;
galaxies.engine.inTutorial = false;

galaxies.engine.tutorialData = {
  previousCapsuleOpacity: 0,
  exitIn: 0
};

galaxies.engine.playerData = {};

galaxies.engine.canvasWidth = 0;
galaxies.engine.canvasHeight = 0;
galaxies.engine.canvasHalfWidth = 0;
galaxies.engine.canvasHalfHeight = 0;
galaxies.engine.planetScreenPoint = new THREE.Vector2(0.5, 0.5);

galaxies.engine.driftObject = null; // outer world container that rotates slowly to provide skybox motion
galaxies.engine.rootObject = null; // inner object container that contains all game objects

galaxies.engine.driftSpeed = 0.01;

galaxies.engine.SHIELD_RADIUS = 2.5;

galaxies.engine.isPaused = false;
galaxies.engine.isGameOver = false;
galaxies.engine.shielded = false;
galaxies.engine.shieldStrength = 5;
galaxies.engine._timeDilation = 1.0;
galaxies.engine._soundDilation = 1.0;
galaxies.engine.slomoDuration = 0;

Object.defineProperty(galaxies.engine, "soundDilation", {
  get: function() {
    return galaxies.engine._soundDilation;
  },
  set: function(value) {
    galaxies.engine._soundDilation = value;
  }
});

Object.defineProperty(galaxies.engine, "timeDilation", {
  get: function() {
    return galaxies.engine._timeDilation;
  },
  set: function(value) {
    var soundValue = 1 - (1 - value) * 0.4;

    galaxies.engine._timeDilation = value;

    if (!galaxies.engine.inTutorial) {
      galaxies.engine.soundDilation = soundValue;

      galaxies.audio.positionedSounds.forEach(function (sound) {
        if (sound.source) {
          sound.source.playbackRate.value = soundValue;
        }
      });

      galaxies.engine.obstacles.forEach(function (obstacle) {
        if (obstacle.passSound) {
          obstacle.passSound.source.playbackRate.value = soundValue;
        }
      });

      galaxies.audio.soundField.source.playbackRate.value = soundValue;
    }
  }
});

galaxies.engine.boss = null;

Object.defineProperty(galaxies.engine, "bossMode", {
  get: function () {
    return galaxies.engine._bossMode;
  },
  set: function (value) {
    if (value === galaxies.engine._bossMode) {
      return;
    }

    galaxies.engine._bossMode = value;

    if (value) {
      galaxies.engine.CONE_ANGLE = 20 * Math.PI / 360;
    } else {
      galaxies.engine.CONE_ANGLE = 15 * Math.PI / 360;

      if (galaxies.engine.boss && galaxies.engine.boss.state !== "inactive") {
        galaxies.engine.boss.disable();

        galaxies.engine.rootObject.remove(galaxies.engine.boss.object);
      }
    }
  }
});

galaxies.engine.START_LEVEL_NUMBER = 1;
galaxies.engine.TOTAL_PLANETS = 7; // TODO: this should not be a constant

galaxies.engine.levelTimer = 0;
galaxies.engine.LEVEL_TIME = 15;
galaxies.engine.levelComplete = false;
galaxies.engine.levelRunning = false;

galaxies.engine.obstacleTypes = ['asteroid',
                                 'asteroidice',
                                 'asteroidrad',
                                 'asteroidradchild',
                                 'asteroidmetal',
                                 'comet',
                                 'miniUFO'];//['asteroid', 'satellite', 'comet'];

// View, play parameters
galaxies.engine.speedScale = 1;

// "constants"
// Some of these are fixed, some are dependent on window size and are recalculated in 
// the window resize function.
Object.defineProperty(galaxies.engine, 'CONE_ANGLE', {
  get: function () {
    return galaxies.engine._coneAngle;
  },
  set: function (value) {
    galaxies.engine._coneAngle = value;

    galaxies.engine.CONE_SLOPE = Math.tan(value);

    galaxies.engine.INV_CONE_ANGLE = Math.PI / 2 - value;

    galaxies.engine.PROJ_START_Y = galaxies.engine.PLANET_RADIUS +
        (galaxies.engine.CHARACTER_HEIGHT * (0.08 + galaxies.engine.INV_CONE_ANGLE * 0.09));

    if (galaxies.engine.camera) {
      galaxies.engine.updateView();
    }
  }
});

galaxies.engine.CONE_ANGLE = 15 * Math.PI/360;//11.4 * Math.PI/360; // Half-angle of the interior of the cone

galaxies.engine.CAMERA_DISTANCES = [30, 40, 50, 50];
galaxies.engine.CAMERA_Z = galaxies.engine.CAMERA_DISTANCES[0]; // 40 is original value

galaxies.engine.CAMERA_VIEW_ANGLE = 45; // Will be applied to smallest screen dimension, horizontal or vertical. TODO
galaxies.engine.ROUNDS_PER_PLANET = 4; // 3

galaxies.engine.PLANET_DISTANCE = 1.25;

galaxies.engine.OBSTACLE_GRAVITY = -0.5;

galaxies.engine.SHOOT_TIME = 0.5; // 0.4 in original

galaxies.engine.HOLD_THRESHOLD = 0.18;

galaxies.engine.POWERUP_DURATION = 40; // time in seconds
galaxies.engine.POWERUP_CHARGED = 3300;//3300; // powerup spawns when this many points are earned, set low for easier testing of powerups
galaxies.engine.powerups = ['clone', 'spread', 'golden', 'seeker', 'timeWarp', 'shield'];
galaxies.engine.shownPowerups = [];
galaxies.engine.powerupCapsules = [];
galaxies.engine.currentPowerup = 'boottime';
galaxies.engine.shotCounter = 0;
galaxies.engine.powerupMessagesShown = {};

galaxies.engine.PLANET_RADIUS = 1;
galaxies.engine.CHARACTER_HEIGHT = 4.5;
galaxies.engine.CHARACTER_POSITION = galaxies.engine.PLANET_RADIUS + (0.85 * galaxies.engine.CHARACTER_HEIGHT/2 );

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

// Interaction tracking
galaxies.engine.bIsDown = false;
galaxies.engine.downPoint = new THREE.Vector2();
galaxies.engine.downTime = 0;
galaxies.engine.bIsAiming = false;

// Active obstacles.
galaxies.engine.obstacles = [];
galaxies.engine.inactiveObstacles = [];

// Pool obstacles separately to avoid having to create new meshes.
galaxies.engine.obstaclePool = {};
for(var i=0, len = galaxies.engine.obstacleTypes.length; i<len; i++ ) {
  galaxies.engine.obstaclePool[ galaxies.engine.obstacleTypes[i] ] = [];
}

// Projectiles
galaxies.engine.projectilePool = [];
galaxies.engine.shotTimer = galaxies.engine.SHOOT_TIME;
galaxies.engine.projectiles = [];

// Laser Bullets
galaxies.engine.laserBulletPool = [];
galaxies.engine.laserBullets = [];

// Neutral targets
galaxies.engine.neutrals = [];
galaxies.engine.inactiveNeutrals = [];


// Background stars
galaxies.engine.bgStars = [];


galaxies.engine.ensureCanvasSize = function() {
  var canvas = galaxies.engine.renderer.domElement,
      size = galaxies.engine.renderer.getSize(),
      width = canvas.clientWidth,
      height = canvas.clientHeight;

  if (size.width === width && size.height === height && width !== 0 && height !== 0) {
    return;
  }

  galaxies.engine.canvasWidth = width;
  galaxies.engine.canvasHeight = height;
  galaxies.engine.canvasHalfWidth = width / 2;
  galaxies.engine.canvasHalfHeight = height / 2;

  galaxies.engine.camera.aspect = width / height;
  galaxies.engine.camera.updateProjectionMatrix();

  galaxies.engine.renderer.setSize( width, height );
  galaxies.engine.composer.setSize( width, height );

  // Recalculate "constants"
  galaxies.engine.updateView();

  if (galaxies.passes.warpBubble) {
    galaxies.FX.UpdateWarpBubble();
  }

  if (galaxies.passes.focus) {
    galaxies.FX.UpdateFocus();
  }

  canvas.style.width = "100%";
  canvas.style.height = "100%";

  if (galaxies.engine.bossMode) {
    galaxies.engine.boss.updateCoordinates();
  }
}

// Set view parameters
galaxies.engine.updateView = function() {
  // Sets active play area by diagonal window size
  var diagonal = Math.sqrt( Math.pow(galaxies.engine.camera.aspect,2) + 1 );
  var cameraSlope = diagonal * Math.tan( galaxies.engine.CAMERA_VIEW_ANGLE * Math.PI/360 );

  galaxies.engine.updatePlanetScreenPoint();

  galaxies.engine.VISIBLE_RADIUS = galaxies.engine.CAMERA_Z * galaxies.engine.CONE_SLOPE * galaxies.engine.CAMERA_SLOPE/ (galaxies.engine.CONE_SLOPE + galaxies.engine.CAMERA_SLOPE);
  galaxies.engine.OBSTACLE_VISIBLE_RADIUS = galaxies.engine.CAMERA_Z * galaxies.engine.CONE_SLOPE * cameraSlope/ (galaxies.engine.CONE_SLOPE + cameraSlope);

  galaxies.Projectile.prototype.PROJECTILE_SPEED = galaxies.engine.CONE_SLOPE * 23; // 3.0 in original
  galaxies.Projectile.prototype.PROJECTILE_LIFE = (galaxies.engine.OBSTACLE_VISIBLE_RADIUS - galaxies.engine.PROJ_START_Y)/galaxies.Projectile.prototype.PROJECTILE_SPEED + 0.1;

  galaxies.engine.OBSTACLE_START_DISTANCE = galaxies.engine.OBSTACLE_VISIBLE_RADIUS * 1.1;//1.2;
}

galaxies.engine.updatePlanetScreenPoint = function () {
  var point = new THREE.Vector3().project(galaxies.engine.camera);

  point = new THREE.Vector2(point.x, -point.y);

  galaxies.engine.planetScreenPoint = point.multiplyScalar(0.5).add(new THREE.Vector2(0.5, 0.5));
};


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

  galaxies.engine.initPlayerData();

  if (galaxies.utils.isLocalStorageAvailable()) {
      //galaxies.engine.completedTutorial = localStorage.completedTutorial || false;
  }
    
  // three.js clock for delta time
  galaxies.engine.clock = new THREE.Clock();
  
  // Detect minimized/inactive window to avoid bad delta time values.
  document.addEventListener("visibilitychange", galaxies.engine.onVisibilityChange );
  
  galaxies.ui.init();
  
};

galaxies.engine.initPlayerData= function() {
  var playerData = {},
      storageAvailable = galaxies.utils.isLocalStorageAvailable();

  galaxies.engine.initTutorialData(playerData, storageAvailable);
  galaxies.engine.initAllPlanetsData(playerData, storageAvailable);

  galaxies.engine.playerData = playerData;
};

galaxies.engine.initTutorialData = function (playerData, storageAvailable) {
  var key = "playerData.completedTutorial";

  playerData._completedTutorial = storageAvailable ? (localStorage.getItem(key) || false) : false;

  Object.defineProperty(playerData, "completedTutorial", {
    get: function() {
      return playerData._completedTutorial;
    },
    set: function(value) {
        playerData._completedTutorial = value;

      if (storageAvailable) {
        localStorage.setItem(key, value);
      }
    }
  });
};

galaxies.engine.initAllPlanetsData = function (playerData, storageAvailable) {
  playerData.planets = [];

  for (var i = 0; i < galaxies.engine.TOTAL_PLANETS; ++i) {
    galaxies.engine.initPlanetData(playerData, i, storageAvailable);
  }
};

galaxies.engine.initPlanetData = function (playerData, planet, storageAvailable) {
  var storageKeyBase = "playerData.planets." + planet+ '.',
      data = {
        _completed: false,
        _accuracy: 0,
        _score: 0,
        _starsCollected: 0
      };

  Object.defineProperties(data, {
    completed: {
        get: function () {
          return data._completed;
        },
        set: function (value) {
          data._completed = value;

          if (storageAvailable) {
            localStorage.setItem(storageKeyBase + "completed", value);
          }
        }
    },
    accuracy: {
      get: function () {
        return data._score;
      },
      set: function (value) {
        data._score = value;

        if (storageAvailable) {
          localStorage.setItem(storageKeyBase + "accuracy", value);
        }
      }
    },
    score: {
      get: function () {
        return data._score;
      },
      set: function (value) {
        data._score = value;

        if (storageAvailable) {
          localStorage.setItem(storageKeyBase + "score", value);
        }
      }
    },
    starsCollected: {
      get: function () {
        return data._starsCollected;
      },
      set: function (value) {
        data._starsCollected = value;

        if (storageAvailable) {
          localStorage.setItem(storageKeyBase + "starsCollected", value);
        }
      }
    }
  });

  if (storageAvailable)
  {
    data._completed = localStorage.getItem(storageKeyBase + "completed") || false;

    if (data._completed) {
      data._accuracy = localStorage.getItem(storageKeyBase + "accuracy") || 0;
      data._score = localStorage.getItem(storageKeyBase + "score") || 0;
      data._starsCollected = localStorage.getItem(storageKeyBase + "starsCollected") || 0;
    }
  }

  playerData.planets[planet] = data;
};

galaxies.engine.loadPlayerData = function() {
  //
};

// Create 3D scene, camera, light, skybox
galaxies.engine.initScene = function() {
  
  galaxies.resources = new galaxies.Resources();
  
  
  galaxies.engine.container = document.getElementById( 'container' );

  galaxies.engine.scene = new THREE.Scene();
  
  galaxies.engine.driftObject = new THREE.Object3D();
  galaxies.engine.scene.add( galaxies.engine.driftObject );
  
  galaxies.engine.rootObject = new THREE.Object3D();
  galaxies.engine.driftObject.add( galaxies.engine.rootObject );
  
  galaxies.engine.camera = new THREE.PerspectiveCamera( galaxies.engine.CAMERA_VIEW_ANGLE, galaxies.engine.canvasWidth / galaxies.engine.canvasHeight, 0.3, 1100 );
  galaxies.engine.camera.position.set(0,0,galaxies.engine.CAMERA_Z);
  galaxies.engine.rootObject.add(galaxies.engine.camera);
  
  galaxies.engine.light = new THREE.DirectionalLight( 0xffffff, 1 );
  galaxies.engine.ambientLight = new THREE.AmbientLight( 0x303030 );
  galaxies.engine.rootObject.add( galaxies.engine.light );
  galaxies.engine.rootObject.add( galaxies.engine.ambientLight );

  var sunTex = new THREE.Texture(galaxies.queue.getResult('sun'));
  sunTex.needsUpdate = true;

  var sunMat = new THREE.MeshBasicMaterial({map: sunTex, transparent: true, blending: THREE.AdditiveBlending});

  galaxies.engine.sun = new THREE.Mesh( new THREE.PlaneGeometry(100, 100, 1, 1), sunMat);
  galaxies.engine.sun.position.set(75, 24, -100);
  galaxies.engine.sun.scale.set(2, 2, 2);

  var flareTex = new THREE.Texture(galaxies.queue.getResult('lensFlare'));
  flareTex.needsUpdate = true;

  galaxies.engine.sunFlares = new THREE.LensFlare(flareTex, 60, 0.2, THREE.AdditiveBlending, new THREE.Color(1.5, 1.5, 1.5));
  galaxies.engine.sunFlares.add(flareTex, 100, 0.25, THREE.AdditiveBlending, new THREE.Color(1.3, 0.8, 0.8));
  galaxies.engine.sunFlares.add(flareTex, 150, 0.4, THREE.AdditiveBlending, new THREE.Color(1.2, 1.2, 1.8));
  galaxies.engine.sunFlares.add(flareTex, 60, 0.41, THREE.AdditiveBlending, new THREE.Color(1.3, 2, 1.3));
  galaxies.engine.sunFlares.add(flareTex, 230, 0.6, THREE.AdditiveBlending, new THREE.Color(0.6, 1, 1));

  galaxies.engine.scene.add(galaxies.engine.sun);
  galaxies.engine.scene.add(galaxies.engine.sunFlares);

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

  var bgStarSprite, scale, point;

  for (var i = 0; i < 60; ++i) {
    bgStarSprite = galaxies.utils.makeSprite('bgstar');

    point = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
        .multiplyScalar(180 + Math.random() * 15);

    scale = 3 + Math.random() * 2;

    bgStarSprite.position.copy(point);
    bgStarSprite.scale.set(scale, scale, scale);

    galaxies.engine.scene.add(bgStarSprite);

    galaxies.engine.bgStars.push({
      sprite: bgStarSprite,
      frequency: 0.5 + Math.random() * 4.5,
      age: Math.random() * 10
    });
  }
  
  galaxies.engine.renderer = new THREE.WebGLRenderer({alpha: true, preserveDrawingBuffer: true});
  galaxies.engine.renderer.setPixelRatio( window.devicePixelRatio );
  galaxies.engine.renderer.setSize( galaxies.engine.canvasWidth, galaxies.engine.canvasHeight );
  galaxies.engine.container.appendChild( galaxies.engine.renderer.domElement );
  
  galaxies.engine.renderer.context.canvas.addEventListener( "webglcontextlost", galaxies.engine.handleContextLost, false);
  galaxies.engine.renderer.context.canvas.addEventListener( "webglcontextrestored", galaxies.engine.handleContextRestored, false);

  galaxies.engine.composer = new WAGNER.Composer(galaxies.engine.renderer, {useRGBA: true});
  galaxies.engine.shadersPool = new WAGNER.ShadersPool();
  galaxies.engine.composerStack = new WAGNER.Stack(galaxies.engine.shadersPool);

  galaxies.passes = galaxies.passes || {};
  galaxies.passes.indexes = galaxies.passes.indexes || {};

  galaxies.engine.bosses = {
    monster: new galaxies.BossMonster(),
    elephatron: new galaxies.Elephatron(),
    insecticlyde: new galaxies.Insecticlyde()
  };

  //galaxies.passes.indexes.bloom = galaxies.engine.composerStack.addPass("BloomPass", false, {});

  galaxies.engine.ensureCanvasSize();

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

  galaxies.engine.planeSweep = new galaxies.PlaneSweep();

  // Create background planet
  var bgMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    map: galaxies.resources.planetData[0].texture,
    transparent: true,
    depthWrite: false
  });
  galaxies.engine.bgPlanet = new THREE.Mesh( new THREE.PlaneGeometry(200, 200, 1, 1),
                                             bgMaterial );
  
  galaxies.engine.player = new galaxies.Player();
  galaxies.engine.rootObject.add( galaxies.engine.player.root );

  galaxies.engine.rootObject.add( galaxies.engine.bgPlanet );

  // Cycle all the planet textures in reverse order to cache them
  for (var i = galaxies.resources.planetData.length - 1; i > -1; --i) {
    galaxies.engine.bgPlanet.material.map = galaxies.resources.planetData[i].texture;

    //galaxies.engine.renderer.render(galaxies.engine.scene, galaxies.engine.camera);
    galaxies.engine.render();
  }

  galaxies.engine.rootObject.remove(galaxies.engine.bgPlanet);
  
  galaxies.engine.setPowerup();
  
  galaxies.engine.addInputListeners();

  galaxies.FX.Init();

  galaxies.engine.shieldBubble = galaxies.FX.GetShield();

  galaxies.engine.fillPools();

  galaxies.engine.startGame();
} // initGame

galaxies.engine.fillPools = function () {
  var i;

  for (i = 0; i < 6; ++i) {
    galaxies.engine.projectilePool.push(galaxies.engine.createDefaultProjectile());
  }

  for (i = 0; i < 10; ++i) {
    galaxies.engine.laserBulletPool.push(new galaxies.LaserBullet());
  }
};


galaxies.engine.startGame = function() {
  // There can be only one!
  galaxies.engine.ufo = new galaxies.Ufo();

  var urlParams = galaxies.debug.urlParams,
      hasStartPoint = urlParams.hasOwnProperty("startAt");

  if (!galaxies.engine.playerData.completedTutorial && !hasStartPoint && !urlParams.hasOwnProperty("noTutorial")) {
    galaxies.engine.inTutorial = true;
  }

  galaxies.engine.resetGame();
  galaxies.engine.removeInputListeners();
  galaxies.engine.planetTransition();

  galaxies.engine.gameInitialized = true;
  
  if ( galaxies.engine.animationFrameRequest == null ) {
    galaxies.engine.animate();
  }

  if (hasStartPoint) {
    galaxies.debug.changeLocation(urlParams.startAt);
  }
}

galaxies.engine.restartGame = function() {
  galaxies.ui.showPauseButton(); // is hidden by game over menu
  
  // Add character holder.
  // Character will be removed by planet transition.
  galaxies.engine.rootObject.add( galaxies.engine.player.root );

  if (galaxies.engine.roundNumber === 4) {
    createjs.Tween.get(galaxies.audio.soundField)
        .to({volume: 0}, 1500)
        .call(function() {
          galaxies.audio.soundField.changeSource(galaxies.audio.getSound('music'));
          galaxies.audio.soundField.volume = galaxies.audio.muteState === 'none' ? 0.1 : 0;
        });
  }
  
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

  if (!galaxies.engine.inTutorial && galaxies.engine.roundNumber !== 4) {
    galaxies.ui.showTitle("ROUND " + galaxies.engine.roundNumber, 1.5);
  }
  
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
  } else if (galaxies.engine.roundNumber === 4) {
    galaxies.audio.soundField.changeSource(galaxies.audio.getSound('bossmusic'));
    galaxies.audio.soundField.volume = galaxies.audio.muteState === 'none' ? 0.1 : 0;
  }
  

}

galaxies.engine.updateCameraZ = function( roundNumber ) {
  if (galaxies.engine.inTutorial) {
    galaxies.engine.CAMERA_Z = galaxies.engine.CAMERA_DISTANCES[0];
  } else {
    galaxies.engine.CAMERA_Z = galaxies.engine.CAMERA_DISTANCES[roundNumber - 1];
  }

  galaxies.engine.updateView();
  
  createjs.Tween.removeTweens( galaxies.engine.camera.position );
  createjs.Tween.get( galaxies.engine.camera.position )
      .to({
        z: galaxies.engine.CAMERA_Z
      }, 1500, createjs.Ease.quadInOut)
      .call(function () {
        galaxies.engine.updatePlanetScreenPoint();
      });
};

galaxies.engine.nextLevel = function() {
  if (galaxies.engine.isGameOver) {
    return;
  }

  if (galaxies.engine.slomoDuration > 0.5) {
    galaxies.engine.slomoDuration = 0.5;
  }

  galaxies.engine.levelNumber++;

  galaxies.engine.clearLevel();

  if (galaxies.engine.roundNumber === 1) {
    createjs.Tween.get(galaxies.audio.soundField)
        .to({volume: 0}, 1500)
        .call(function() {
          galaxies.audio.soundField.changeSource(galaxies.audio.getSound('music'));
          galaxies.audio.soundField.volume = galaxies.audio.muteState === 'none' ? 0.1 : 0;
        });
  }

  // game ends after earth
  if ( galaxies.engine.planetNumber > galaxies.engine.TOTAL_PLANETS ) {
    galaxies.engine.gameOver( true );
    return;
  }

  if ( galaxies.engine.roundNumber === 1 ) {
    var accuracy = galaxies.engine.projectilesHitRound / galaxies.engine.projectilesLaunchedRound,
        rawScore = galaxies.engine.roundScore,
        planetData = galaxies.engine.playerData.planets[galaxies.engine.planetNumber - 2];

    galaxies.engine.roundScore = galaxies.utils.calculateRoundScore(rawScore, accuracy, galaxies.engine.starsCollected);

    planetData.completed = true;
    planetData.accuracy = accuracy;
    planetData.score = galaxies.engine.roundScore;
    planetData.starsCollected = galaxies.engine.starsCollected;

    galaxies.ui.showLevelResults(galaxies.engine.roundScore - rawScore, accuracy);
  }

  setTimeout(function () {
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
  var bgPlanetIndex = (galaxies.engine.planetNumber - 1) % galaxies.resources.planetData.length,
      planetData = galaxies.resources.planetData[bgPlanetIndex];

  galaxies.engine.rootObject.add( galaxies.engine.bgPlanet );

  galaxies.engine.rootObject.add(galaxies.engine.sun);
  galaxies.engine.sun.add(galaxies.engine.sunFlares);
  galaxies.engine.sunFlares.position.set(0, 0, 0);
  
  galaxies.engine.bgPlanet.position.copy( planetData.position || new THREE.Vector3(-25, 80, -73) );

  if (planetData.hasOwnProperty("moonColor")) {
    galaxies.engine.planet.material.color.set(planetData.moonColor);
    galaxies.debug.moonColor.setValue('#' + galaxies.engine.planet.material.color.getHexString());
  } else {
    galaxies.engine.randomizePlanet();
  }

  var sunTargetScale = 1;

  switch (bgPlanetIndex) {
    case 1:
      galaxies.engine.sun.position.set( -135, 240, -101 );
      sunTargetScale = 0.3;
      galaxies.engine.sun.visible = true;
      break;
    case 5:
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

  console.log( "Setting background planet texture", galaxies.engine.planetNumber, galaxies.resources.planetData.length, bgPlanetIndex );
  galaxies.engine.bgPlanet.material.map = planetData.texture;

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
  var targetScale = planetData.scale;
  // Tween time should be dependent on transition time which should be a constant
  createjs.Tween.get( galaxies.engine.bgPlanet.scale )
    .to({x:targetScale, y:targetScale, z:targetScale}, 3000, createjs.Ease.quadOut);

  if (galaxies.engine.inTutorial) {
    galaxies.engine.bgPlanet.parent.remove(galaxies.engine.bgPlanet);
  }
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
  var outPosition = galaxies.engine.rootObject.localToWorld( new THREE.Vector3(0,-40,20) );
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

      if (galaxies.engine.inTutorial) {
        galaxies.ui.showTitle("TRAINING", 4);
      } else {
        galaxies.ui.showTitle(galaxies.resources.levelTitles[galaxies.engine.planetNumber - 1], 4);
        console.log(galaxies.engine.planetNumber, galaxies.resources.levelTitles[galaxies.engine.planetNumber - 1]);
      }
      
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

  setTimeout(galaxies.engine.initLevel, 750);

  if (galaxies.engine.inTutorial) {
    galaxies.ui.startTutorial();
  }
}

galaxies.engine.planetTransitionComplete = function() {
  galaxies.engine.addInputListeners();
}

// randomize moon, set and position bgplanet, set scene lighting
galaxies.engine.updateScene = function() {
  galaxies.engine.scene.add( galaxies.engine.planet ); // First level planet must be added here
  
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
  galaxies.debug.moonColor.setValue('#' + galaxies.engine.planet.material.color.getHexString());
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

galaxies.engine.updatePlayerAngle = function (event) {
  var relativeX = ( event.pageX - galaxies.engine.planetScreenPoint.x * galaxies.engine.canvasWidth ),
      relativeY = ( event.pageY - galaxies.engine.planetScreenPoint.y * galaxies.engine.canvasHeight );

  if (!galaxies.engine.ufo.commandeeredPlayer) {
    galaxies.engine.targetAngle = -(Math.atan2(relativeY, relativeX) + Math.PI / 2); // sprite is offset
  }
  galaxies.ui.updateReticlePosition(event);
};

galaxies.engine.commonInteractMove = function (event) {
  galaxies.engine.updatePlayerAngle(event);

  if (!galaxies.engine.bIsDown || galaxies.engine.isFiring || galaxies.engine.bIsAiming) {
    return;
  }

  var currentPoint = new THREE.Vector2(event.pageX, event.pageY),
      threshold = Math.max(galaxies.engine.canvasWidth, galaxies.engine.canvasHeight) * 0.01;

  threshold *= threshold;

  if (galaxies.engine.downPoint.distanceToSquared(currentPoint) > threshold) {
    galaxies.engine.bIsAiming = true;
  }
};

galaxies.engine.commonInteractEnd = function (event) {
  galaxies.engine.isFiring = !galaxies.engine.bIsAiming && galaxies.engine.downTime < galaxies.engine.HOLD_THRESHOLD;
  galaxies.engine.bIsDown = false;
  galaxies.engine.bIsAiming = false;

  galaxies.engine.updatePlayerAngle(event);
};

galaxies.engine.onDocumentMouseDown = function( event ) {
    // Commented out so datgui menu works, has side effect of making
    // FX text selectable.
	//event.preventDefault();

    galaxies.engine.bIsDown = true;
    galaxies.engine.bIsAiming = false;
    galaxies.engine.isFiring = true;

    galaxies.engine.updatePlayerAngle(event);
};

galaxies.engine.averageTouchLocation = function (event) {
  var totalX = 0,
      totalY = 0,
      touches = event.changedTouches,
      numTouches = touches.length,
      i, touch;

  for (i = 0; i < numTouches; ++i) {
    touch = touches[i];

    totalX += touch.pageX;
    totalY += touch.pageY;
  }

  return {pageX: totalX / numTouches, pageY: totalY / numTouches};
};

galaxies.engine.onDocumentTouchStart = function( event ) {
    event.preventDefault();

    if (galaxies.engine.bIsDown) {
      return;
    }

    var touchAverage = galaxies.engine.averageTouchLocation(event);

    galaxies.engine.bIsDown = true;
    galaxies.engine.bIsAiming = false;
    galaxies.engine.isFiring = false;
    galaxies.engine.downPoint.x = touchAverage.pageX;
    galaxies.engine.downPoint.y = touchAverage.pageY;
    galaxies.engine.downTime = 0;

    galaxies.engine.updatePlayerAngle(touchAverage);
};


galaxies.engine.onDocumentMouseUp = function( event ) {
  galaxies.engine.commonInteractEnd(event);
};

galaxies.engine.onDocumentTouchEnd = function (event) {
  var touchAverage = galaxies.engine.averageTouchLocation(event);

  if (event.changedTouches.length === event.touches.length || event.touches.length === 0) {
    galaxies.engine.commonInteractEnd(touchAverage);
  } else {
    galaxies.engine.commonInteractMove(touchAverage);
  }
};

galaxies.engine.onDocumentMouseMove = function(event) {
  galaxies.engine.commonInteractMove(event);
};
galaxies.engine.onDocumentTouchMove = function( event ) {
  event.preventDefault();

  var touchAverage = galaxies.engine.averageTouchLocation(event);

  galaxies.engine.commonInteractMove(touchAverage);
};

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

galaxies.engine.getLaserBullet = function () {
  var laserBullet;

  if (galaxies.engine.laserBulletPool.length > 0) {
    laserBullet = galaxies.engine.laserBulletPool.pop();
  } else {
    laserBullet = new galaxies.LaserBullet();
  }

  galaxies.engine.laserBullets.push(laserBullet);
  galaxies.engine.planeSweep.add(laserBullet);

  return laserBullet;
};

galaxies.engine.getProjectile = function (startAngle, directionOffset, indestructible, particles) {
  var projMesh = new THREE.Mesh(galaxies.resources.geometries['proj'], galaxies.resources.materials['proj']),
      proj;

  projMesh.scale.set(0.1, 0.1, 0.1);

  if (galaxies.engine.projectilePool.length > 0) {
    proj = galaxies.engine.projectilePool.pop();

    proj.initialize(galaxies.engine.currentPowerup, projMesh, startAngle, directionOffset, indestructible, particles);
  } else {
    proj = new galaxies.Projectile(galaxies.engine.currentPowerup, projMesh, startAngle, directionOffset, indestructible, particles);
  }

  galaxies.engine.projectiles.push(proj);

  return proj;
};

galaxies.engine.createDefaultProjectile = function () {
  var projMesh = new THREE.Mesh(galaxies.resources.geometries['proj'], galaxies.resources.materials['proj']);

  projMesh.scale.set(0.1, 0.1, 0.1);

  return new galaxies.Projectile(projMesh, 0, 0, false);
};

galaxies.engine.addStar = function( angle ) {
  console.log("addStar");
  var star = new galaxies.Star( angle );
  galaxies.engine.stars++;
  return star;
}
galaxies.engine.addUfo = function(ufoMode) {
  if (typeof ufoMode !== "string") {
    ufoMode = "laser"
  }

  if ( galaxies.engine.ufo.state === 'inactive' ) {
    galaxies.engine.ufo.activate(ufoMode);
  }
}

galaxies.engine.shoot = function( indestructible ) {
  if ( typeof(indestructible) !== 'boolean' ) {
    indestructible = false;
  }

  if ( galaxies.engine.shotTimer>0 ) { return; }
  galaxies.engine.shotTimer = galaxies.engine.SHOOT_TIME;

  ++galaxies.engine.projectilesLaunchedRound;

  if (galaxies.engine.shotCounter > 0) {
    --galaxies.engine.shotCounter;

    galaxies.ui.updateShotCount(galaxies.engine.shotCounter);

    if (galaxies.engine.shotCounter === 0) {
      galaxies.engine.setPowerup('');
    }
  }

  // Instantiate shot object
  var proj = galaxies.engine.getProjectile(galaxies.engine.angle, 0, indestructible, indestructible ? galaxies.FX.GetRainbowEmitter() : null);

  galaxies.utils.addShotGroup(proj);
    
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

  ++galaxies.engine.projectilesLaunchedRound;

  // Instantiate shot object
  var proj = galaxies.engine.getProjectile(galaxies.engine.angle, 0, false, galaxies.FX.GetPurpleTrailEmitter());

  galaxies.utils.addShotGroup(proj);

  // delay adding the projectile and the sound to synchronize with the animation
  createjs.Tween.get( galaxies.engine.player.sprite ).wait(250)
  .call( galaxies.engine.shootSync, [proj, 0], this );

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
galaxies.engine.shootSound = function(soundName) {
  if (typeof soundName !== "string" || !soundName) {
    soundName = "shoot";
  }
  // play sound
  galaxies.engine.testKeepReference = new galaxies.audio.SimpleSound({
    source: galaxies.audio.getSound(soundName),
    position: galaxies.utils.rootPosition( galaxies.engine.player.sprite ),
    baseVolume: 0.8,//10,
    loop: false
  });
}


// Spread fire
galaxies.engine.shoot3 = function() {
  if ( galaxies.engine.shotTimer>0 ) { return; }
  galaxies.engine.shotTimer = galaxies.engine.SHOOT_TIME;

  ++galaxies.engine.projectilesLaunchedRound;

  --galaxies.engine.shotCounter;

  galaxies.ui.updateShotCount(galaxies.engine.shotCounter);

  if (galaxies.engine.shotCounter === 0) {
    galaxies.engine.setPowerup('');
  }

  var projs = [];

  for ( var i=-1; i<=1; i++ ) {
    // Instantiate shot object
    var proj = galaxies.engine.getProjectile(galaxies.engine.angle, i * Math.PI / 6, false, galaxies.FX.GetSmallFlameJet(i === 0));

    projs.push(proj);
      
    // delay adding the projectile and the sound to synchronize with the animation
    createjs.Tween.get( galaxies.engine.player.sprite ).wait(250).call( galaxies.engine.shootSync, [proj], this );
  }

  galaxies.utils.addShotGroup(projs);

  // play animation
  galaxies.engine.player.animateShoot();
  createjs.Tween.get( galaxies.engine.player.sprite ).wait(250)
  .call( galaxies.engine.shootSound, ["tripleraquet"] );
  
}




galaxies.engine.animate = function() {
  galaxies.engine.ensureCanvasSize();

  galaxies.engine.update();

  galaxies.engine.animationFrameRequest = requestAnimationFrame( galaxies.engine.animate );
};


// Game Loop
galaxies.engine.render = function () {
  galaxies.engine.composer.reset();
  galaxies.engine.composer.render(galaxies.engine.scene, galaxies.engine.camera);

  galaxies.engine.composer.passStack(galaxies.engine.composerStack);

  galaxies.engine.composer.toScreen();
};

galaxies.engine.update = function() {
  var delta = galaxies.engine.clock.getDelta(),
      stats = galaxies.debug.stats,
      scaledDelta;

  if (stats) {
    stats.begin();
  }

  if ( delta === 0 ) { // paused!
    if (stats) {
      stats.end();
    }

    return;
  }

  if ( delta > 0.25 ) { delta = 0.25; } // Cap simulation at 4 ticks/second delta to prevent projectiles from passing through objects.

  scaledDelta = delta * galaxies.engine.timeDilation;

  var activeObstacleCount = 0;

  if (galaxies.engine.bIsDown && !galaxies.engine.bIsAiming && !galaxies.engine.isFiring) {
    galaxies.engine.downTime += delta;

    if (galaxies.engine.downTime > galaxies.engine.HOLD_THRESHOLD) {
      galaxies.engine.isFiring = true;
    }
  }

  galaxies.engine.obstacles.forEach(function (obstacle) {
    if (obstacle.state === "inactive") {
      galaxies.engine.inactiveObstacles.push(obstacle);
    } else {
      ++activeObstacleCount;
      obstacle.update(scaledDelta);
    }
  });

  galaxies.engine.neutrals.forEach(function (neutral) {
    neutral.update(scaledDelta);
  });

  var expiredProjectiles = [],
      expiredLaserBullets = [];

  galaxies.engine.projectiles.forEach(function (proj) {
    proj.update( delta );

    galaxies.utils.conify( proj.object );

    if ( proj.isExpired ) {
      expiredProjectiles.push( proj );
    }
  });

  galaxies.engine.laserBullets.forEach(function (laserBullet) {
    laserBullet.update(scaledDelta);

    if (laserBullet.state === "inactive") {
      expiredLaserBullets.push(laserBullet);
    }
  });

  galaxies.engine.inactiveObstacles.forEach(function (obstacle) {
    obstacle.remove();

    var obsIdx = galaxies.engine.obstacles.indexOf(obstacle);

    if (obsIdx !== -1) {
      galaxies.engine.obstacles.splice(obsIdx, 1);
    }

    galaxies.engine.obstaclePool[obstacle.type].push(obstacle);
  });

  galaxies.engine.inactiveNeutrals.forEach(function (neutral) {
    galaxies.engine.planeSweep.remove(neutral);

    var neutIdx = galaxies.engine.neutrals.indexOf(neutral);

    if (neutIdx !== -1) {
      galaxies.engine.neutrals.splice(neutIdx, 1);
    }
  });

  expiredProjectiles.forEach(function (proj) {
    var projIdx = galaxies.engine.projectiles.indexOf(proj);

    if (projIdx !== -1) {
      galaxies.engine.projectiles.splice(projIdx, 1);
    }

    proj.remove();

    galaxies.engine.projectilePool.push(proj);
  });

  expiredLaserBullets.forEach(function (laserBullet) {
    var idx = galaxies.engine.laserBullets.indexOf(laserBullet);
    
    if (idx !== -1) {
      galaxies.engine.laserBullets.splice(idx, 1);
    }

    laserBullet.removeFromScene();

    galaxies.engine.laserBulletPool.push(laserBullet);
  });

  galaxies.engine.inactiveObstacles = [];
  galaxies.engine.inactiveNeutrals = [];

  if (galaxies.engine.boss && galaxies.engine.boss.state !== "inactive") {
    galaxies.engine.projectiles.forEach(galaxies.utils.flattenProjectile);
  }

  galaxies.engine.planeSweep.update();

  galaxies.engine.planeSweep.potentialCollisions().forEach(function (collisionPair) {
    var projectiles = [],
        notProjectiles = [],
        numProjectiles = 0;

    collisionPair.forEach(function (item) {
      if (item instanceof galaxies.Projectile) {
        projectiles.push(item);
        ++numProjectiles;
      } else {
        notProjectiles.push(item);
      }
    });

    if (numProjectiles === 0) {
      var obsA = notProjectiles[0],
          obsB = notProjectiles[1],
          aIsObstacle = galaxies.engine.obstacles.indexOf(obsA) > -1,
          bIsObstacle = galaxies.engine.obstacles.indexOf(obsB) > -1,
          aIsLaser = galaxies.engine.laserBullets.indexOf(obsA) > -1,
          bIsLaser = galaxies.engine.laserBullets.indexOf(obsB) > -1;

      if (aIsObstacle && bIsObstacle) {
        if (obsA instanceof galaxies.ObstacleComet || obsB instanceof galaxies.ObstacleComet) {
          return;
        }

        var distSq = obsA.object.position.distanceToSquared(obsB.object.position);

        if (distSq <= Math.pow(obsA.hitThreshold + obsB.hitThreshold, 2)) {
          // Collide obstacles to update velocities
          galaxies.engine.collide( obsA, obsB );

          // Push overlapping obstacles apart
          // This is done in cartesian coordinates using object positions.
          // Angle and radial position is then set from the udpated object position.

          var overlap = (obsA.hitThreshold + obsB.hitThreshold) - Math.sqrt(distSq);

          var shift = obsB.object.position.clone();
          shift.sub( obsA.object.position );
          if ( shift.length() === 0 ) {
            shift.set( THREE.Math.randFloatSpread(1), THREE.Math.randFloatSpread(1), 0 );
            shift.setZ( galaxies.utils.getConifiedDepth( shift ) );
          }
          shift.setLength( overlap/2 );

          obsA.object.position.sub( shift );
          obsB.object.position.add( shift );

          obsA.angle = Math.atan2( obsA.object.position.y, obsA.object.position.x );
          obsA.radius = Math.sqrt( Math.pow( obsA.object.position.y, 2 ) + Math.pow( obsA.object.position.x, 2 ) );

          obsB.angle = Math.atan2( obsB.object.position.y, obsB.object.position.x );
          obsB.radius = Math.sqrt( Math.pow( obsB.object.position.y, 2 ) + Math.pow( obsB.object.position.x, 2 ) );
        }
      } else if ((aIsLaser && bIsObstacle) || (aIsObstacle && bIsLaser)) {
        var laser = aIsLaser ? obsA : obsB,
            obstacle = aIsLaser ? obsB : obsA;

        if (laser.isHittable &&
            obsA.object.position.distanceToSquared(obsB.object.position) < obstacle.hitThreshold * obstacle.hitThreshold) {
          laser.impact();
          obstacle.hit(1);
        }
      }
    } else if (numProjectiles === 1) {
      var proj = projectiles[0],
          other = notProjectiles[0],
          projLine = proj.object.position.clone().sub(proj.lastPos),
          isUFO = other === galaxies.engine.ufo,
          didHit = false,
          isRainbow = proj.indestructible,
          ufoPosition, otherLine, scalar, checkPoint;

      if (proj.alreadyCollidedWith.indexOf(other) > -1) {
        return;
      }

      if (isUFO) {
        if (!other.isHittable) {
          return;
        }

        ufoPosition = other.rootPosition;

        otherLine = ufoPosition.clone().sub(proj.lastPos);
      } else {
        otherLine = other.object.position.clone().sub(proj.lastPos)
      }

      otherLine.projectOnVector(projLine);

      scalar = otherLine.clone().divide(projLine);
      scalar = Math.min(Math.max(scalar.x || scalar.y || scalar.z, 0), 1);

      checkPoint = proj.lastPos.clone().add(projLine.multiplyScalar(scalar));

      if (isUFO) {
        if (ufoPosition.distanceToSquared(checkPoint) <= other.hitThreshold * other.hitThreshold) {
          other.hit(isRainbow ? 2 : 1);
          proj.hit();
          didHit = true;
        }
      } else if (galaxies.engine.obstacles.indexOf(other) !== -1) {
        if (other.object.position.distanceToSquared(checkPoint) <= other.hitThreshold * other.hitThreshold) {
          other.hit(proj.object.position, isRainbow ? 2 : 1);
          proj.hit();
          didHit = true;
        }
      } else if (galaxies.engine.neutrals.indexOf(other) !== -1) {
        if (other.object.position.distanceToSquared(checkPoint) <= other.hitThreshold * other.hitThreshold) {
          if (!(other instanceof galaxies.Capsule && proj.firedByClone)) {
            other.hit();
            proj.hit();
            didHit = true;
          }
        }
      }

      if (didHit) {
        proj.alreadyCollidedWith.push(other);
      }
    }
  });
  
  if ( galaxies.engine.shotTimer>0) { galaxies.engine.shotTimer -= delta; }
  if ( galaxies.engine.isFiring ) {
    if (galaxies.engine.inTutorial && galaxies.engine.timeDilation < 1) {
      galaxies.ui.hideInteractionMessage();
    }

    galaxies.engine.shootFunction();

    if (!galaxies.engine.bIsDown) {
      galaxies.engine.isFiring = false;
    }
  }
  //

  // Powerup timer
  // Only changes while the level is running.
  if ( galaxies.engine.levelRunning && (galaxies.engine.powerupTimer > 0) ) {
    galaxies.engine.powerupTimer -= scaledDelta;
    if ( galaxies.engine.powerupTimer <=0 ) {
      galaxies.engine.setPowerup('');
    }
  }
  
  // update ufo
  galaxies.engine.ufo.update(scaledDelta);

  if (galaxies.engine.bossMode) {
    galaxies.engine.boss.update(scaledDelta);
  }

  // update world
  galaxies.engine.driftObject.rotateOnAxis(galaxies.engine.driftAxis, galaxies.engine.driftSpeed * delta );

  // update fx
  galaxies.FX.Update(scaledDelta);

  if (galaxies.engine.slomoDuration > 0) {
    if (galaxies.engine.slomoDuration <= delta) {
      galaxies.engine.slomoDuration = 0;
    } else {
      galaxies.engine.slomoDuration -= delta;
    }

    if (galaxies.engine.slomoDuration > 0.5) {
      if (galaxies.engine.timeDilation > 0.1) {
        var tdChange = 1.8 * delta;

        if (galaxies.engine.timeDilation <= 0.1 + tdChange) {
          galaxies.engine.timeDilation = 0.1;
        } else {
          galaxies.engine.timeDilation -= tdChange;
        }
      }
    } else {
      galaxies.engine.timeDilation = 1.0 - 1.8 * galaxies.engine.slomoDuration;

      if (galaxies.engine.slomoDuration === 0) {
        galaxies.FX.HideTimeDilation();
      }
    }
  }
  
  // update bg and sun
  var cameraScenePos = galaxies.engine.camera.localToWorld( new THREE.Vector3() );
  galaxies.engine.bgPlanet.lookAt( cameraScenePos );

  galaxies.engine.updateBGStars(scaledDelta, cameraScenePos);

  if (galaxies.engine.sun.visible) {
    galaxies.engine.sun.lookAt(cameraScenePos);
    galaxies.engine.sunFlares.position.copy(galaxies.engine.sun.position.clone().sub(cameraScenePos).multiplyScalar(0.5).add(cameraScenePos));

    var sunScreenPos = galaxies.engine.sun.position.clone().project(galaxies.engine.camera);

    galaxies.engine.light.position.set(sunScreenPos.x, sunScreenPos.y, -1 + sunScreenPos.length() * 0.8);
  }

  // update character
  if ( !galaxies.engine.isGameOver ) {
    var angleDelta = galaxies.utils.normalizeAngle(galaxies.engine.targetAngle-galaxies.engine.angle);

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
    galaxies.generator.tick( scaledDelta );
  } else if (!galaxies.engine.inTutorial) {
    galaxies.engine.levelComplete = galaxies.engine.bossMode ? galaxies.engine.boss.state === "inactive" : true;
  }
  
  if ( galaxies.engine.levelRunning &&
      galaxies.engine.levelComplete &&
      (activeObstacleCount === 0) &&
      ((galaxies.engine.ufo.state === 'idle') ||
      (galaxies.engine.ufo.state === 'inactive')) ) {
    galaxies.engine.bossMode = false;
    galaxies.engine.nextLevel();
  }
  
  
  // AUDIO
  //galaxies.audio.soundField.update(scaledDelta);


  // TUTORIAL
  if (galaxies.engine.inTutorial) {
    galaxies.engine.updateTutorial(delta);
  }
  
  galaxies.engine.render();

  if (stats) {
    stats.end();
  }
};

galaxies.engine.updateBGStars = function (delta, cameraScenePos) {
  galaxies.engine.bgStars.forEach(function (bgStar) {
    bgStar.sprite.lookAt(cameraScenePos);
    bgStar.age += delta * bgStar.frequency;
    bgStar.sprite.material.opacity = 0.8 + Math.cos(bgStar.age) * 0.2;
    bgStar.sprite.rotation.z = bgStar.age * 0.4;
  });
};

galaxies.engine.updateTutorial = function (delta) {
  var triggerDistance = galaxies.engine.VISIBLE_RADIUS * 0.93;

  galaxies.engine.obstacles.forEach(function (obstacle) {
    if (obstacle.radius <= triggerDistance && obstacle.previousRadius > triggerDistance) {
      galaxies.ui.showInteractionMessage(obstacle, (galaxies.utils.isMobile() ? "TAP" : "CLICK") + " HERE");
    }
  });

  if (galaxies.engine.inTutorial && galaxies.engine.powerupCapsules.length > 0) {
    var capsule = galaxies.engine.powerupCapsules[0];

    if (capsule.model.material.opacity === 1 && galaxies.engine.tutorialData.previousCapsuleOpacity < 1) {
      galaxies.ui.showInteractionMessage(capsule, "COLLECT THESE");
    }

    galaxies.engine.tutorialData.previousCapsuleOpacity = capsule.model.material.opacity;
  }

  if (galaxies.engine.tutorialData.exitIn > 0) {
    galaxies.engine.tutorialData.exitIn -= delta;

    if (galaxies.engine.tutorialData.exitIn <= 0) {
      galaxies.engine.endTutorial();
    }
  }
};

galaxies.engine.skipSequence = function () {
  if (galaxies.engine.bossMode) {
    galaxies.engine.ufo.skipBossIntro();
  } else if (galaxies.engine.inTutorial) {
    galaxies.engine.endTutorial();
  }
};

galaxies.engine.endTutorial = function () {
  galaxies.engine.roundScore = 0;
  galaxies.engine.inTutorial = false;
  galaxies.engine.playerData.completedTutorial = true;
  galaxies.engine.playerLife = galaxies.engine.MAX_PLAYER_LIFE;

  galaxies.ui.updateLife(galaxies.engine.playerLife);

  ++galaxies.engine.levelNumber;

  galaxies.engine.clearLevel();
  galaxies.engine.initRootRotation();
  galaxies.engine.planetTransition();
  galaxies.ui.hideSkipButton();
};

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

  if ( galaxies.engine.shielded ) {
    galaxies.engine.hitShield(5);
    return;
  }
  
  galaxies.engine.playerLife--;
  galaxies.ui.updateLife( galaxies.engine.playerLife );
  galaxies.FX.ShowHeartLoss(galaxies.engine.angle);
  
  if ((!galaxies.engine.invulnerable) && (galaxies.engine.playerLife<=0)) {
    galaxies.engine.player.clearTweens();
    galaxies.engine.gameOver();
    return;
  }

  // Hop player sprite to show its been hit
  galaxies.engine.player.animateHit();

  galaxies.engine.setPowerup('');

  galaxies.engine.isGracePeriod = true;
  galaxies.engine.player.sprite.material.opacity = 0.5;
  createjs.Tween.get( galaxies.engine.player ).wait(2000).call( galaxies.engine.endGracePeriod );
}

galaxies.engine.hitShield = function (damage) {
  if (!galaxies.engine.shielded) {
    return;
  }

  galaxies.engine.shieldStrength -= damage;

  if (galaxies.engine.shieldStrength <= 0) {
    galaxies.engine.shielded = false;
    galaxies.engine.shieldBubble.disable();
    galaxies.FX.ShowShieldPop();
  }
};

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

  galaxies.audio.setAllMute(true);

  if ( galaxies.engine.animationFrameRequest != null ) {
    window.cancelAnimationFrame(galaxies.engine.animationFrameRequest);
    galaxies.engine.animationFrameRequest = null;
  }
}
galaxies.engine.resumeGame = function() {
  galaxies.engine.isPaused = false;
  galaxies.engine.startTimers();
  
  galaxies.audio.applyMuteState();
  
  if ( galaxies.engine.animationFrameRequest == null ) {
    galaxies.engine.animate();
  }
}


galaxies.engine.gameOver = function( isWin ) {
  if ( typeof(isWin) !== 'boolean' ) { isWin = false; }

  if (galaxies.engine.slomoDuration > 0.5) {
    galaxies.engine.slomoDuration = 0.5;
  }
  
  galaxies.engine.isGameOver = true;
  galaxies.engine.removeInputListeners();
  galaxies.engine.isFiring = false;
  galaxies.ui.hidePauseButton();

  galaxies.engine.powerupCapsules.forEach(function (capsule) {
    capsule.clear();
  });

  var accuracy = (galaxies.engine.projectilesHitRound / galaxies.engine.projectilesLaunchedRound) || 0,
      rawScore = galaxies.engine.roundScore,
      bonusScore;

  galaxies.engine.roundScore = galaxies.utils.calculateRoundScore(galaxies.engine.roundScore, accuracy, galaxies.engine.starsCollected);

  galaxies.engine.score = galaxies.engine.previousTotal + galaxies.engine.roundScore;
  bonusScore = galaxies.engine.roundScore - rawScore;

  setTimeout(function () {
    galaxies.ui.updateScore(galaxies.engine.score);
  }, 2000);
  
  if ( isWin ) {
    galaxies.ui.showGameOver( isWin, galaxies.engine.score, bonusScore, accuracy );
  } else {

    galaxies.engine.player.die();
    galaxies.FX.ShowPlanetExplosion();
    galaxies.FX.ShakeCamera(2, 2);
    
    for( var i=0, len=galaxies.engine.obstacles.length; i<len; i++ ) {
      galaxies.engine.obstacles[i].retreat();
    }
    
    galaxies.engine.ufo.leave();
    
    createjs.Tween.get(null).wait(2000).call( galaxies.ui.showGameOver, [isWin, galaxies.engine.score, bonusScore, accuracy] );
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

  galaxies.audio.applyMuteState();
  
  galaxies.engine.clearLevel();

  galaxies.engine.bossMode = false;
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
  galaxies.engine.shielded = false;
  galaxies.engine.shownPowerups = [];
  galaxies.engine.powerupMessagesShown = {};
  galaxies.engine.setPowerup();

  if (galaxies.engine.inTutorial) {
    --galaxies.engine.playerLife;

    --galaxies.engine.levelNumber;
    galaxies.engine.planetNumber = 0;
    galaxies.engine.roundNumber = 0;
  }

  galaxies.FX.Cleanup();

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
  
  galaxies.ui.updateLevel( galaxies.engine.planetNumber, galaxies.engine.roundNumber );
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
  document.addEventListener( 'touchend', galaxies.engine.onDocumentTouchEnd, false );
  document.addEventListener( 'touchleave', galaxies.engine.onDocumentTouchEnd, false );
  document.addEventListener( 'touchmove', galaxies.engine.onDocumentTouchMove, false );
}
galaxies.engine.removeInputListeners = function() {
  galaxies.engine.isFiring = false;
  galaxies.engine.bIsDown = false;
  galaxies.engine.bIsAiming = false;

  document.removeEventListener( 'mousedown', galaxies.engine.onDocumentMouseDown, false );
  document.removeEventListener( 'mouseup', galaxies.engine.onDocumentMouseUp, false );
  document.removeEventListener( 'mousemove', galaxies.engine.onDocumentMouseMove, false );
  
  document.removeEventListener( 'touchstart', galaxies.engine.onDocumentTouchStart, false );
  document.removeEventListener( 'touchend', galaxies.engine.onDocumentTouchEnd, false );
  document.removeEventListener( 'touchleave', galaxies.engine.onDocumentTouchEnd, false );
  document.removeEventListener( 'touchmove', galaxies.engine.onDocumentTouchMove, false );
}

galaxies.engine.handleContextLost = function(e) {
  console.log("WebGL Context Lost", e);
}
galaxies.engine.handleContextRestored = function() {
  console.log("WebGL Context Restored", e);
}




galaxies.engine.collectStar = function(fromObject) {
  galaxies.ui.animateCollection(galaxies.ui.createFloatingStar(), fromObject,
      galaxies.ui.getFirstEmptyStarPosition(), function () {
        galaxies.engine.starsCollected++;
        galaxies.engine.starsCollectedRound++;
        galaxies.ui.updateStars( galaxies.engine.starsCollectedRound );
      });
}



galaxies.engine.showCombo = function( value, multiplier, obj ) {
  var screenPos = galaxies.utils.getObjScreenPosition(obj, 50);

  var divElem = document.createElement('div');
  divElem.classList.add("points");
  var newContent = document.createTextNode( (value*multiplier).toString() ); 
  divElem.style.left = screenPos.x + 'px';
  divElem.style.top = screenPos.y + 'px';
  divElem.appendChild(newContent); //add the text node to the newly created div.
  galaxies.engine.container.appendChild(divElem);
  
  window.getComputedStyle(divElem).top; // reflow
  
  divElem.style.top = (screenPos.y - 40) + 'px'; // animate
  divElem.style.opacity = 0;
  
  window.setTimeout( galaxies.engine.removeCombo, 2000, divElem );

  if (galaxies.engine.inTutorial) {
    if (galaxies.engine.timeDilation < 1) {
      galaxies.ui.hideInteractionMessage();
    }

    if (galaxies.generator.isLevelComplete() && galaxies.engine.obstacles.length < 2) {
      galaxies.engine.addPowerup("heart");
    }
  } else {
    galaxies.engine.score += value * multiplier;
    galaxies.engine.roundScore += value * multiplier;
    galaxies.ui.updateScore(galaxies.engine.score);
  }
  
  // The 100 is to reduce scores from 100, 250, 500 to 1, 2.5, 5
  // The exponent scales the values, so more valuable targets have higher values.
  //galaxies.engine.powerupCharge += Math.pow( value/100, 2 ) / galaxies.engine.POWERUP_CHARGED;
  galaxies.engine.powerupCharge += value/galaxies.engine.POWERUP_CHARGED;

  //if ( true ) { // test powerups
  if ( galaxies.engine.powerupCharge >= 1 ) {
    var giveHeart = ( galaxies.engine.playerLife < galaxies.engine.MAX_PLAYER_LIFE ) && ( (galaxies.engine.powerupCount%4) === 0 );

    galaxies.engine.addPowerup(giveHeart ? "heart" : galaxies.engine.shownPowerups);
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

  document.body.addEventListener("selectstart", function () {return false;});
  document.body.addEventListener("selectionchange", function () {return false;});

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

galaxies.engine.addBoss = function (bossType) {
  if (galaxies.engine.boss) {
    galaxies.engine.boss.disable();

    galaxies.engine.rootObject.remove(galaxies.engine.boss.object);
  }

  galaxies.engine.boss = galaxies.engine.bosses[bossType];
  galaxies.engine.boss.reset();
  galaxies.engine.bossMode = true;
  galaxies.engine.rootObject.add(galaxies.engine.boss.object);

  var titleText = "ROUND 4<br>" + galaxies.engine.boss.name.toUpperCase() + " vs " +
      galaxies.engine.player.name.toUpperCase();

  galaxies.ui.showTitle(titleText, 3.5);

  galaxies.engine.ufo.introduceBoss();
};

galaxies.engine.addPowerup = function (powerupType) {
  galaxies.engine.powerupCharge = 0;

  if (!powerupType || powerupType.length === 0) {
    return;
  }

  if (powerupType instanceof Array) {
    if (galaxies.engine.shielded) {
      var shieldIndex = powerupType.indexOf("shield");

      if (shieldIndex > -1) {
        powerupType.splice(shieldIndex, 1);
      }
    }

    powerupType = powerupType[Math.floor(Math.random() * powerupType.length)];
  }

  if (!powerupType) {
    return;
  }

  if (galaxies.engine.shownPowerups.indexOf(powerupType) === -1 && powerupType !== "heart") {
    galaxies.engine.shownPowerups.push(powerupType);
  }

  galaxies.engine.powerupCount++;

  galaxies.engine.powerupCapsules.push(new galaxies.Capsule(powerupType));
};

galaxies.engine.setPowerup = function ( newPowerup, fromObject ) {
  if ( !newPowerup ) { newPowerup = ''; }
  
  // This is not a "true" powerup, just an instant effect.
  if ( newPowerup === 'heart' ) {
    if ( galaxies.engine.playerLife < galaxies.engine.MAX_PLAYER_LIFE ) {
      galaxies.ui.animateCollection(galaxies.ui.createFloatingHeart(), fromObject,
          galaxies.ui.getFirstEmptyHeartPosition(), function () {
            galaxies.engine.playerLife++;
            galaxies.ui.updateLife( galaxies.engine.playerLife );
          });
    }

    if (galaxies.engine.inTutorial) {
      galaxies.ui.showTitle("YOU ARE READY!", 2);
      galaxies.engine.tutorialData.exitIn = 1.5;
    }

    return;
  }

  switch (newPowerup) {
    case 'spread':
    case 'golden':
    case 'seeker':
      galaxies.engine.powerupTimer = 0;
      galaxies.engine.shotCounter = 20;
      break;
    case 'timeWarp':
    case 'shield':
      // Has no impact on shot counter/timer
      break;
    default:
      galaxies.engine.shotCounter = 0;
      galaxies.engine.powerupTimer = galaxies.engine.POWERUP_DURATION;
      break;
  }

  galaxies.ui.updateShotCount(galaxies.engine.shotCounter);

  if (newPowerup === galaxies.engine.currentPowerup) {
    return;
  }

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
    case 'timeWarp':
      powerupMessage = 'Time Warp';
      break;
    case 'shield':
      powerupMessage = 'Lunar Defense';
      break;
    case 'seeker':
      powerupMessage = 'Boom-a-Racquet';
      /* falls through */
    default:
      galaxies.engine.shootFunction = galaxies.engine.shoot;
      break;
  }

  if (powerupMessage && !galaxies.engine.powerupMessagesShown[newPowerup]) {
    galaxies.engine.powerupMessagesShown[newPowerup] = true;

    galaxies.ui.showTitle(powerupMessage, 1.8);
  }

  if (newPowerup === "timeWarp") {
    galaxies.engine.slomoDuration += 10;
    galaxies.FX.ShowTimeDilation();
  } else if (newPowerup === "shield") {
    if (!galaxies.engine.shielded) {
      galaxies.engine.shieldStrength = 5;

      galaxies.FX.ShowShieldAppear();

      createjs.Tween.get(galaxies.engine)
          .wait(500)
          .call(function () {
            galaxies.engine.shielded = true;
            galaxies.engine.shieldBubble.enable();
          });
    }
  } else {
    galaxies.engine.currentPowerup = newPowerup;

    galaxies.engine.player.setPowerup(newPowerup);
  }
}
