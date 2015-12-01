"use strict";
this.galaxies = this.galaxies || {};


// init debug controls
window.addEventListener("load", function(event) {
  var datgui = new dat.GUI();
  
  console.log("debug init");
  
  var userValues = {
    fireMode: '',
    gotoLevel10: function() { setLevel(10); },
    gotoLevel1: function() { setLevel(1); },
    invulnerable: true
  };
  
  var fireModeController = datgui.add( userValues, 'fireMode', ['plain', 'golden', 'spread', 'clone'] );
  fireModeController.onChange( galaxies.engine.setFireMode );
  
  datgui.add(userValues, 'gotoLevel1' );
  datgui.add(userValues, 'gotoLevel10' );
  
  var invulnerableController = datgui.add( userValues, 'invulnerable' );
  invulnerableController.onChange( setInvulnerable );
  
  function setInvulnerable( newValue ) {
    galaxies.engine.invulnerable = newValue;
  }
  
  function setLevel( newLevel ) {
    galaxies.engine.levelNumber = 10;
    galaxies.engine.clearLevel();
    galaxies.engine.initLevel();
  }
  
});




