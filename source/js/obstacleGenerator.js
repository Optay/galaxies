"use strict";
/**
 * ObstacleGenerator
 *
 * Objects for spawning waves of obstacles in set patterns.
 *
 */

this.galaxies = this.galaxies || {};

galaxies.generator = (function() {
  var levelTimer = 0;
  var currentLevel = [];
  
  
  var initLevel = function( levelIndex ) {
    levelTimer = 0;
    currentLevel = parsePatterns( levelIndex );
  }
  
  var levelComplete = function() {
    currentLevel = [];
  }
  
  var tick = function( delta ) {
    levelTimer += delta;

    galaxies.ui.updateTimer( levelTimer );
    
    while ( (currentLevel.length > 0) && (currentLevel[0].time < levelTimer ) ) {

      switch ( currentLevel[0].type ) {
      case 'star':
        galaxies.engine.addStar( currentLevel[0].angle );
        break;
      case 'ufo':
        galaxies.engine.addUfo();
        break;
      case 'powerup':
        galaxies.engine.addPowerup(currentLevel[0].powerup);
        break;
      case 'boss':
        galaxies.engine.addBoss(currentLevel[0].bossType);
        break;
      default:
        var obs = galaxies.engine.addObstacle( currentLevel[0].type );
        obs.setAngle(currentLevel[0].angle);
      }
      
      currentLevel.shift();
    }
    
  }
  
  var isLevelComplete = function() {
    return (currentLevel.length === 0);
  }
  
  var parsePatterns = function(levelIndex) {
    var parsed = [],
        rawPatterns = galaxies.generator.rawPatterns;

    var raw;

    if (galaxies.engine.inTutorial) {
      raw = [
        { time: 0, duration: 0, startAngle: 45, endAngle: 45, quantity: 1, type: 'asteroid' },
        { time: 4, duration: 0, startAngle: 180, endAngle: 180, quantity: 1, type: 'asteroid' }
      ];
    } else {
      // loop through the patterns
      levelIndex = levelIndex%rawPatterns.length;

      raw = rawPatterns[levelIndex];
    }
    
    for(var i=0, len=raw.length; i<len; i++ ) {
      var wave = raw[i];
      
      // Defaults to facilitate shorthand in the raw pattern notation.
      if ( wave.startAngle == null ) { wave.startAngle = 0; }
      if ( wave.endAngle == null ) {
        if ( wave.random) { wave.endAngle = 360; }
        else { wave.endAngle = wave.startAngle; }
      }
      if ( wave.duration == null ) { wave.duration = 0; }
      if ( wave.quantity == null ) { wave.quantity = 1; }
      
      var timeStep = wave.duration/Math.max(1, wave.quantity-1);
      var angleStep = (wave.endAngle - wave.startAngle)/Math.max(1, wave.quantity-1);
      
      // Array of types to draw from for the wave.
      var types = [];
      if ( typeof(wave.type) === 'string' ) { wave.type = [ wave.type + ' 100' ]; }
      // In order to prevent weird rounding edge cases, we decrement our obstacle total
      // each time we add a type.
      // Edge case looks like this: quantity 3, types: ['a 50', 'b 50']
      // A naive implementation would produce 1.5 of 'a' and 1.5 of 'b' which would round to 2 of each.
      var quantityRemaining = wave.quantity;
      var proportionRemaining = 100;
      for (var iType=0, lenWave = wave.type.length; iType<lenWave; iType++ ) {
        var decoded = wave.type[iType].split(' ');
        var type = decoded[0];
        var numberOfType = Math.round( quantityRemaining * decoded[1] / proportionRemaining );
        quantityRemaining -= numberOfType;
        proportionRemaining -= decoded[1];
        for ( var j=0; j<numberOfType; j++ ) {
          types.push( type );
        }
      }
      galaxies.utils.shuffleArray(types);
      console.log(types);
      
      for (var obsI = 0; obsI<wave.quantity; obsI++ ) {
        var entry = {
          time: wave.time + timeStep * obsI,
          type: types[obsI],
          powerup: wave.powerup,
          bossType: wave.bossType
        };
        if ( wave.random ) {
          entry.angle = THREE.Math.randFloat(wave.startAngle, wave.endAngle) * Math.PI/180;
        } else {
          entry.angle = (wave.startAngle + angleStep * obsI) * Math.PI/180;
        }
        parsed.push( entry );
      }
    }
    
    parsed.sort( function( a, b ) {
      return (a.time - b.time);
    });
   
   /*
    for ( var i=0; i<parsed.length; i++ ) {
      console.log( parsed[i] );
    }
    */
    
    return parsed;
  }

  return {
    rawPatterns: [],
    initLevel :initLevel,
    levelComplete: levelComplete,
    tick: tick,
    isLevelComplete: isLevelComplete
  }

})();





// basic structure
// time, angle, type

// repeaters
// start time, end time
// start angle, angle increment, quantity, type

// oscillators?

// other forms?


