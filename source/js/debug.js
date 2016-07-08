"use strict";
this.galaxies = this.galaxies || {};
galaxies.debug = {};

// init debug controls
window.addEventListener("load", function(event) {
  var datgui = new dat.GUI(),
      isDev = location.search.search(/[\?&]dev\b/g) !== -1;
  
  console.log("debug init");

  datgui.close();

  galaxies.debug.datgui = datgui;

  galaxies.debug.stats = new Stats();
  galaxies.debug.stats.domElement.style.position = 'absolute';
  galaxies.debug.stats.domElement.style.left = '0';
  galaxies.debug.stats.domElement.style.top = '0';
  document.body.appendChild(galaxies.debug.stats.domElement);

  var userValues = {
    pluto: function() { setLevel(1); },
    neptune: function() { setLevel(4); },
    uranus: function() { setLevel(7); },
    saturn: function() { setLevel(10); },
    jupiter: function() { setLevel(13); },
    mars: function() { setLevel(16); },
    earth: function() { setLevel(19); },
    round2: function () {
      galaxies.engine.levelNumber += 2 - galaxies.engine.roundNumber;
      galaxies.engine.clearLevel();
      galaxies.engine.initLevel();
    },
    round3: function() {
      galaxies.engine.levelNumber += 3 - galaxies.engine.roundNumber;
      galaxies.engine.clearLevel();
      galaxies.engine.initLevel();
    },
    miniUFO: function () {galaxies.engine.addObstacle("miniUFO")},
    clone: function() { galaxies.engine.setPowerup('clone'); },
    spread: function() { galaxies.engine.setPowerup('spread'); },
    golden: function() { galaxies.engine.setPowerup('golden'); },
    shield: function() { galaxies.engine.setPowerup('shield'); },
    timeWarp: function() { galaxies.engine.setPowerup('timeWarp'); },
    addUFO: galaxies.engine.addUfo,
    invulnerable: false,
    bossMode: false
  };

  datgui.add(userValues, 'pluto' );
  datgui.add(userValues, 'neptune' );
  datgui.add(userValues, 'uranus' );
  datgui.add(userValues, 'saturn' );
  datgui.add(userValues, 'jupiter' );
  datgui.add(userValues, 'mars' );
  datgui.add(userValues, 'earth' );
  datgui.add(userValues, 'round2' );
  datgui.add(userValues, 'round3' );
  datgui.add(userValues, 'miniUFO' );
  datgui.add(userValues, 'clone' );
  datgui.add(userValues, 'spread' );
  datgui.add(userValues, 'golden' );
  datgui.add(userValues, 'shield' );
  datgui.add(userValues, 'timeWarp' );
  datgui.add(userValues, 'addUFO' );

  var invulnerableController = datgui.add( userValues, 'invulnerable' );
  invulnerableController.onChange( setInvulnerable );

  var bossModeController = datgui.add(userValues, 'bossMode');
  bossModeController.onChange( setBossMode );
  
  function setInvulnerable( newValue ) {
    galaxies.engine.invulnerable = newValue;
  }

  function setBossMode( newValue ) {
    galaxies.engine.bossMode = newValue;
  }

  function setLevel( newLevel ) {
    galaxies.engine.levelNumber = newLevel;
    
    galaxies.engine.clearLevel();
    galaxies.engine.initRootRotation();
    galaxies.engine.planetTransition();
  }

  if (isDev) {
    //galaxies.engine.invulnerable = true;
    //galaxies.engine.POWERUP_CHARGED = 100;
  } else {
    galaxies.debug.stats.domElement.classList.add("hidden");
    galaxies.debug.datgui.domElement.classList.add("hidden");
  }
});




