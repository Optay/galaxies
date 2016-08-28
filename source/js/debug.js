"use strict";
this.galaxies = this.galaxies || {};
galaxies.debug = {};

// init debug controls
window.addEventListener("load", function(event) {
  var datgui = new dat.GUI(),
      locationParams = location.search.substr(1).split('&'),
      urlParams = {},
      isDev;

  locationParams.forEach(function (param) {
    var pieces = param.split('=');

    urlParams[pieces[0]] = pieces[1];
  });
  
  console.log("debug init");

  galaxies.debug.urlParams = urlParams;

  isDev = urlParams.hasOwnProperty("dev");

  datgui.close();

  galaxies.debug.datgui = datgui;

  galaxies.debug.stats = new Stats();
  galaxies.debug.stats.domElement.style.position = 'absolute';
  galaxies.debug.stats.domElement.style.left = '0';
  galaxies.debug.stats.domElement.style.top = '0';
  document.body.appendChild(galaxies.debug.stats.domElement);

  var userValues = {
    Location: urlParams.startAt || "1-1",
    Pluto: function() { setLevel(1); },
    Neptune: function() { setLevel(1 + galaxies.engine.ROUNDS_PER_PLANET); },
    Uranus: function() { setLevel(1 + 2 * galaxies.engine.ROUNDS_PER_PLANET); },
    Saturn: function() { setLevel(1 + 3 * galaxies.engine.ROUNDS_PER_PLANET); },
    Jupiter: function() { setLevel(1 + 4 * galaxies.engine.ROUNDS_PER_PLANET); },
    Mars: function() { setLevel(1 + 5 * galaxies.engine.ROUNDS_PER_PLANET); },
    Earth: function() { setLevel(1 + 6 * galaxies.engine.ROUNDS_PER_PLANET); },
    Round2: function () {
      galaxies.engine.levelNumber += 2 - galaxies.engine.roundNumber;
      galaxies.engine.clearLevel();
      galaxies.engine.initLevel();
    },
    Round3: function() {
      galaxies.engine.levelNumber += 3 - galaxies.engine.roundNumber;
      galaxies.engine.clearLevel();
      galaxies.engine.initLevel();
    },
    BossRound: function() {
      galaxies.engine.levelNumber += 4 - galaxies.engine.roundNumber;
      galaxies.engine.clearLevel();
      galaxies.engine.initLevel();
    },
    Clone: function() { galaxies.engine.setPowerup('clone'); },
    Spread: function() { galaxies.engine.setPowerup('spread'); },
    Golden: function() { galaxies.engine.setPowerup('golden'); },
    Seeker: function() { galaxies.engine.setPowerup('seeker'); },
    Shield: function() { galaxies.engine.setPowerup('shield'); },
    TimeWarp: function() { galaxies.engine.setPowerup('timeWarp'); },
    BossMonster: function () {galaxies.engine.addBoss('monster');},
    ElephaTRON: function () {galaxies.engine.addBoss('elephatron');},
    MiniUFO: function () {galaxies.engine.addObstacle("miniUFO")},
    UFO: galaxies.engine.addUfo,
    invulnerable: false
  };

  var locationController = datgui.add(userValues, "Location"),
      validLocation = /\d+\s*-\s*\d+/;

  galaxies.debug.changeLocation = function(value) {
    if (!validLocation.test(value)) {
      return;
    }

    var parts = value.split('-').map(function (val) {
          return parseInt(val.trim());
        }),
        previousPlanet = galaxies.engine.planetNumber;

    if (parts[0] < 1 || parts[0] > galaxies.resources.bgPlanetTextures.length ||
        parts[1] < 1 || parts[1] > galaxies.engine.ROUNDS_PER_PLANET) {
      return;
    }

    galaxies.engine.levelNumber = (parts[0] - 1) * galaxies.engine.ROUNDS_PER_PLANET + parts[1];

    galaxies.engine.clearLevel();

    if (galaxies.engine.planetNumber === previousPlanet) {
      galaxies.engine.initLevel();
    } else {
      galaxies.engine.initRootRotation();
      galaxies.engine.planetTransition();
    }
  };

  locationController.onChange(galaxies.debug.changeLocation);

  var planets = datgui.addFolder("Planets");

  planets.add(userValues, 'Pluto' );
  planets.add(userValues, 'Neptune' );
  planets.add(userValues, 'Uranus' );
  planets.add(userValues, 'Saturn' );
  planets.add(userValues, 'Jupiter' );
  planets.add(userValues, 'Mars' );
  planets.add(userValues, 'Earth' );

  var round = datgui.addFolder("Round");

  round.add(userValues, 'Round2' );
  round.add(userValues, 'Round3' );
  round.add(userValues, 'BossRound' );

  var powerups = datgui.addFolder("Powerups");

  powerups.add(userValues, 'Clone' );
  powerups.add(userValues, 'Spread' );
  powerups.add(userValues, 'Golden' );
  powerups.add(userValues, 'Seeker' );
  powerups.add(userValues, 'Shield' );
  powerups.add(userValues, 'TimeWarp' );

  var bosses = datgui.addFolder("Bosses");

  bosses.add(userValues, 'BossMonster' );
  bosses.add(userValues, 'ElephaTRON' );

  var ufos = datgui.addFolder("UFOs");

  ufos.add(userValues, 'UFO' );
  ufos.add(userValues, 'MiniUFO' );

  var invulnerableController = datgui.add( userValues, 'invulnerable' );
  invulnerableController.onChange( function (newValue) {
    galaxies.engine.invulnerable = newValue;
  });

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




