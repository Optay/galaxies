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
    neptune: function() { setLevel(1 + galaxies.engine.ROUNDS_PER_PLANET); },
    uranus: function() { setLevel(1 + 2 * galaxies.engine.ROUNDS_PER_PLANET); },
    saturn: function() { setLevel(1 + 3 * galaxies.engine.ROUNDS_PER_PLANET); },
    jupiter: function() { setLevel(1 + 4 * galaxies.engine.ROUNDS_PER_PLANET); },
    mars: function() { setLevel(1 + 5 * galaxies.engine.ROUNDS_PER_PLANET); },
    earth: function() { setLevel(1 + 6 * galaxies.engine.ROUNDS_PER_PLANET); },
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
    bossRound: function() {
      galaxies.engine.levelNumber += 4 - galaxies.engine.roundNumber;
      galaxies.engine.clearLevel();
      galaxies.engine.initLevel();
    },
    miniUFO: function () {galaxies.engine.addObstacle("miniUFO")},
    clone: function() { galaxies.engine.setPowerup('clone'); },
    spread: function() { galaxies.engine.setPowerup('spread'); },
    golden: function() { galaxies.engine.setPowerup('golden'); },
    shield: function() { galaxies.engine.setPowerup('shield'); },
    timeWarp: function() { galaxies.engine.setPowerup('timeWarp'); },
    addBossMonster: function () {galaxies.engine.addBoss('monster');},
    addElephaTRON: function () {galaxies.engine.addBoss('elephatron');},
    addUFO: galaxies.engine.addUfo,
    invulnerable: false
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
  datgui.add(userValues, 'bossRound' );
  datgui.add(userValues, 'miniUFO' );
  datgui.add(userValues, 'clone' );
  datgui.add(userValues, 'spread' );
  datgui.add(userValues, 'golden' );
  datgui.add(userValues, 'shield' );
  datgui.add(userValues, 'timeWarp' );
  datgui.add(userValues, 'addBossMonster' );
  datgui.add(userValues, 'addElephaTRON' );
  datgui.add(userValues, 'addUFO' );

  var invulnerableController = datgui.add( userValues, 'invulnerable' );
  invulnerableController.onChange( setInvulnerable );

  function setInvulnerable( newValue ) {
    galaxies.engine.invulnerable = newValue;
  }

  function setLevel( newLevel ) {
    galaxies.engine.levelNumber = newLevel;
    
    galaxies.engine.clearLevel();
    galaxies.engine.initRootRotation();
    galaxies.engine.planetTransition();
  }

  if (isDev) {
    var screenshotArea = document.getElementsByClassName("image-viewer")[0],
        screenshotImage = screenshotArea.getElementsByClassName("screenshot")[0];

    //galaxies.engine.invulnerable = true;
    //galaxies.engine.POWERUP_CHARGED = 100;
    document.addEventListener("keydown", function (e) {
      switch (e.keyCode) {
        case 32: // Spacebar
          if (galaxies.debug.datgui.domElement.classList.contains("hidden")) {
            galaxies.debug.stats.domElement.classList.remove("hidden");
            galaxies.debug.datgui.domElement.classList.remove("hidden");
          } else {
            galaxies.debug.stats.domElement.classList.add("hidden");
            galaxies.debug.datgui.domElement.classList.add("hidden");
          }
          break;
        case 79: // O
            if (screenshotArea.classList.contains("hidden")) {
              screenshotArea.classList.remove("hidden");
            } else {
              screenshotArea.classList.add("hidden");
            }
          break;
        case 80: // P
            screenshotImage.src = galaxies.engine.renderer.domElement.toDataURL();
          break;
      }
    });
  } else {
    galaxies.debug.stats.domElement.classList.add("hidden");
    galaxies.debug.datgui.domElement.classList.add("hidden");
  }
});




