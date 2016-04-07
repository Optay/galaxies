"use strict";
this.galaxies = this.galaxies || {};
galaxies.debug = {};

galaxies.debug.onDocumentKeyUp = function(event) {
  if (event.keyCode === 0x20) {
    var stats = galaxies.debug.stats;

    if (stats) {
      if (stats.domElement.classList.contains("hidden")) {
        stats.domElement.classList.remove("hidden");
        galaxies.debug.datgui.domElement.classList.remove("hidden");
      } else {
        stats.domElement.classList.add("hidden");
        galaxies.debug.datgui.domElement.classList.add("hidden");
      }
    }
  }
};

// init debug controls
window.addEventListener("load", function(event) {
  var datgui = new dat.GUI();
  
  datgui.close();
  
  console.log("debug init");
  
  var userValues = {
    pluto: function() { setLevel(1); },
    neptune: function() { setLevel(4); },
    uranus: function() { setLevel(7); },
    saturn: function() { setLevel(10); },
    jupiter: function() { setLevel(13); },
    mars: function() { setLevel(16); },
    earth: function() { setLevel(19); },
    round3: function() {
      galaxies.engine.levelNumber += 3 - galaxies.engine.roundNumber;
      galaxies.engine.clearLevel();
      galaxies.engine.initLevel();
    },
    clone: function() { galaxies.engine.setPowerup('clone'); },
    spread: function() { galaxies.engine.setPowerup('spread'); },
    golden: function() { galaxies.engine.setPowerup('golden'); },
    invulnerable: true
  };
  
  datgui.add(userValues, 'pluto' );
  datgui.add(userValues, 'neptune' );
  datgui.add(userValues, 'uranus' );
  datgui.add(userValues, 'saturn' );
  datgui.add(userValues, 'jupiter' );
  datgui.add(userValues, 'mars' );
  datgui.add(userValues, 'earth' );
  datgui.add(userValues, 'round3' );
  datgui.add(userValues, 'clone' );
  datgui.add(userValues, 'spread' );
  datgui.add(userValues, 'golden' );

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

  galaxies.debug.datgui = datgui;

  galaxies.debug.stats = new Stats();
  galaxies.debug.stats.domElement.style.position = 'absolute';
  galaxies.debug.stats.domElement.style.left = '0';
  galaxies.debug.stats.domElement.style.top = '0';
  document.body.appendChild(galaxies.debug.stats.domElement);

  document.addEventListener("keyup", galaxies.debug.onDocumentKeyUp);
});




