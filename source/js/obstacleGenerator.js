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
    var parsed = [];
    
    // loop through the patterns
    levelIndex = levelIndex%rawPatterns.length;
    var raw = rawPatterns[levelIndex];
    
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
          type: types[obsI]
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

  var rawPatterns = [
    // test level
    /*
    [
      { time: 0, random: true, type: 'star' },
      { time: 8, duration: 0, random: true, quantity: 5, type: 'asteroidice' },
      
    ],
*/
    
    
    [ // Pluto 1-1
      //{ time: 0, type: 'ufo' }, // TEST
      
      { time: 0, duration: 15, startAngle: 0, endAngle: 360, quantity: 12, type: 'asteroid', random: true },
      { time: 18, duration: 0, startAngle: 45, endAngle: 135, quantity: 5, type: 'asteroid' },
      { time: 20, startAngle: 0, endAngle: 360, type: 'star', random: true },
      { time: 24, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: 'asteroid', random: true },
      { time: 31, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
    ],
    [ // Pluto 1-2
      //{ time: 0, type: 'ufo' }, //TEST
      
      { time: 0, duration: 15, startAngle: 0, endAngle: 360, quantity: 8, type: 'asteroid', random: true },
      { time: 3, duration: 0, startAngle: 0, endAngle: 360, quantity: 1, type: 'asteroidice', random: true },
      { time: 5, duration: 3, startAngle: 0, endAngle: 360, quantity: 2, type: 'asteroidice', random: true },
      { time: 9, duration: 6, startAngle: 0, endAngle: 360, quantity: 3, type: 'asteroidice', random: true },
      { time: 21, duration: 0, startAngle: 0, endAngle: -90, quantity: 5, type: 'asteroid' },
      { time: 24, startAngle: 0, endAngle: 360, type: 'star', random: true },
      { time: 26, duration: 6, startAngle: 0, endAngle: 360, quantity: 2, type: 'asteroid', random: true },
      { time: 26, duration: 6, startAngle: 0, endAngle: 360, quantity: 3, type: 'asteroidice', random: true },
      { time: 32, startAngle: 45, quantity: 1, type: 'comet' },
      { time: 34, duration: 0, startAngle: 90, endAngle: 180, quantity: 5, type: 'asteroid' },
      { time: 30, type: 'ufo' },
    ],
    [ // Pluto 1-3
      //{ time: 0, type: 'ufo' }, // TEST
     
     
      { time: 0, duration: 12, startAngle: 0, endAngle: 360, quantity: 4, type: 'asteroid', random: true },
      { time: 0, duration: 12, startAngle: 0, endAngle: 360, quantity: 8, type: 'asteroidice', random: true },
      { time: 6, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
      { time: 16, duration: 0, startAngle: 0, endAngle: 90, quantity: 5, type: 'asteroid' },
      { time: 18, type: 'ufo' },
      { time: 20, duration: 6, startAngle: 0, endAngle: 360, quantity: 3, type: 'asteroid', random: true },
      { time: 20, duration: 6, startAngle: 0, endAngle: 360, quantity: 4, type: 'asteroidice', random: true },
      { time: 28, startAngle: 45, quantity: 1, type: 'comet' },
      { time: 30, duration: 0, startAngle: 180, endAngle: 270, quantity: 5, type: 'asteroid' },
      { time: 32, startAngle: 0, endAngle: 360, type: 'star', random: true },
      { time: 32, duration: 8, startAngle: 90, endAngle: 450, quantity: 8, type: 'asteroid' },
    ],
    [ // Neptune 2-1
      { time: 0, duration: 6, startAngle: 0, endAngle: 360, quantity: 4, type: 'asteroidice', random: true },
      { time: 6, duration: 6, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroidice 90', 'asteroid 10'], random: true },
      { time: 18, duration: 5, startAngle: 90, endAngle: 90, quantity: 5, type: 'asteroid' },
      { time: 21, duration: 5, startAngle: -90, endAngle: -90, quantity: 5, type: 'asteroid' }, // line
      { time: 23, startAngle: 0, endAngle: 360, type: 'star', random: true },
      { time: 28, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroidice 50', 'asteroid 50'], random: true },
      { time: 36, startAngle: 60, quantity: 1, type: 'comet' },
      { time: 38, duration: 0, startAngle: 135, endAngle: 225, quantity: 5, type: 'asteroid' },
      { time: 42, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroidice 75', 'asteroid 25'], random: true },
    ],
    [ // Neptune 2-2
      { time: 0, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroid 80', 'asteroidrad 20'], random: true },
      { time: 12, duration: 5, startAngle: 180, endAngle: 180, quantity: 5, type: 'asteroid' }, // line
      { time: 17, duration: 5, startAngle: 0, endAngle: 0, quantity: 5, type: 'asteroid' }, // line
      { time: 20, startAngle: 0, endAngle: 360, type: 'star', random: true },
      { time: 20, type: 'ufo' },
      { time: 23, duration: 0, startAngle: 180, endAngle: 270, quantity: 5, type: 'asteroid' }, // arc
      { time: 29, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroid 75', 'asteroidrad 25'], random: true },
      { time: 41, duration: 0, startAngle: 90, endAngle: 180, quantity: 5, type: 'asteroid' }, // arc
    ],
    [ // Neptune 2-3
      { time: 0, duration: 6, startAngle: 0, endAngle: 360, quantity: 5, type: ['asteroid 40', 'asteroidice 20', 'asteroidrad 40'], random: true },
      { time: 6, duration: 6, startAngle: 0, endAngle: 360, quantity: 5, type: ['asteroid 40', 'asteroidice 10', 'asteroidrad 50'], random: true },
      { time: 6, type: 'ufo' },
      { time: 18, duration: 0, startAngle: 0, endAngle: 90, quantity: 5, type: 'asteroid' }, // arc
      { time: 21, startAngle: 0, endAngle: 360, type: 'star', random: true },
      { time: 21, type: 'ufo' },
      { time: 24, duration: 6, startAngle: 0, endAngle: 360, quantity: 5, type: ['asteroidice 60', 'asteroidrad 40'], random: true },
      { time: 36, duration: 0, startAngle: 180, endAngle: 270, quantity: 5, type: 'asteroid' }, // arc
      { time: 41, duration: 8, startAngle: 90, endAngle: -270, quantity: 8, type: 'asteroid' }, // spiral
      { time: 42, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
    ],
    [ // Uranus 3-1
      { time: 0, duration: 8, startAngle: 0, endAngle: 360, quantity: 4, type: 'asteroidrad', random: true },
      { time: 8, duration: 8, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroidrad 90', 'asteroid 10'], random: true },
      { time: 12, startAngle: 0, endAngle: 360, type: 'star', random: true },
      { time: 12, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
      { time: 24, duration: 5, startAngle: 180, endAngle: 180, quantity: 5, type: 'asteroid' }, // line
      { time: 29, duration: 5, startAngle: 0, endAngle: 0, quantity: 5, type: 'asteroid' }, // line
      { time: 34, duration: 8, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroidrad 50', 'asteroid 50'], random: true },
      { time: 47, duration: 0, startAngle: 45, endAngle: -45, quantity: 5, type: 'asteroid' }, // arc
      { time: 52, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroidrad 33', 'asteroidice 33', 'asteroid 34'], random: true },
    ],
    [ // Uranus 3-2
      { time: 0, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroidrad 20', 'asteroidice 50', 'asteroid 30'], random: true },
      { time: 3, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
      { time: 11, startAngle: 90, quantity: 1, type: 'comet' },
      { time: 11, duration: 5, startAngle: 180, endAngle: 180, quantity: 5, type: 'asteroid' }, // line
      { time: 11, type: 'ufo' },
      { time: 16, startAngle: -80, quantity: 1, type: 'comet' },
      { time: 16, duration: 5, startAngle: 0, endAngle: 0, quantity: 5, type: 'asteroid' }, // line
      { time: 21, duration: 0, startAngle: -45, endAngle: -135, quantity: 5, type: 'asteroid' }, // arc
      { time: 26, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroidrad 20', 'asteroidice 50', 'asteroid 30'], random: true },
      { time: 29, startAngle: 0, endAngle: 360, type: 'star', random: true },
      { time: 37, duration: 0, startAngle: 45, endAngle: 135, quantity: 5, type: 'asteroid' }, // arc
      { time: 42, duration: 0, startAngle: -45, endAngle: -135, quantity: 5, type: 'asteroid' }, // arc
    ],
    [ // Uranus 3-3
      { time: 0, duration: 8, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroidrad 90', 'asteroidice 5', 'asteroid 5'], random: true },
      { time: 4, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
      { time: 8, duration: 8, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroidrad 80', 'asteroidice 15', 'asteroid 5'], random: true },
      { time: 12, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
      { time: 12, type: 'ufo' },
      { time: 21, duration: 0, startAngle: -45, endAngle: 45, quantity: 5, type: 'asteroid' }, // arc
      { time: 26, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroidrad 40', 'asteroidice 60'], random: true },
      { time: 29, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
      { time: 37, duration: 0, startAngle: 135, endAngle: 225, quantity: 5, type: 'asteroid' }, // arc
      { time: 42, duration: 0, startAngle: -45, endAngle: 45, quantity: 5, type: 'asteroid' }, // arc
      { time: 47, duration: 12, startAngle: -90, endAngle: 270, quantity: 12, type: 'asteroid' }, // spiral
      { time: 50, startAngle: 0, endAngle: 360, type: 'star', random: true },
      { time: 60, duration: 12, startAngle: 270, endAngle: -90, quantity: 12, type: 'asteroid' }, // spiral
      { time: 77, duration: 8, startAngle: 0, endAngle: 360, quantity: 4, type: 'asteroidrad', random: true },
      { time: 79, startAngle: 0, endAngle: 360, quantity: 2, type: 'comet', random: true },
      { time: 75, type: 'ufo' },
    ],
    [ // Saturn 4-1
      { time: 0, duration: 8, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroidrad 50', 'asteroidice 50'], random: true },
      { time: 8, duration: 8, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroidrad 80', 'asteroidice 30'], random: true },
      { time: 12, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
      { time: 16, duration: 8, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroidrad 50', 'asteroid 50'], random: true },
      { time: 29, duration: 0, startAngle: 135, endAngle: 225, quantity: 5, type: 'asteroid' }, // arc
      { time: 34, duration: 8, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroidrad 80', 'asteroid 20'], random: true },
      { time: 38, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
      { time: 50, duration: 5, startAngle: 90, endAngle: 90, quantity: 5, type: 'asteroid' }, // line
      { time: 53, startAngle: 0, endAngle: 360, type: 'star', random: true },
      { time: 60, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroidrad 33', 'asteroidice 33', 'asteroid 34'], random: true },
    ],
    [ // Saturn 4-2
      { time: 0, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroidrad 20', 'asteroidice 50', 'asteroid 30'], random: true },
      { time: 3, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
      { time: 3, type: 'ufo' },
      { time: 11, duration: 12, startAngle: 90, endAngle: -270, quantity: 12, type: 'asteroid' }, // sweep
      { time: 17, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
      { time: 28, duration: 5, startAngle: 0, endAngle: 0, quantity: 5, type: 'asteroid' }, // line
      { time: 28, startAngle: -75, quantity: 1, type: 'comet' },
      { time: 30, type: 'ufo' },
      { time: 38, duration: 0, startAngle: 0, endAngle: -90, quantity: 5, type: 'asteroid' }, // arc
      { time: 43, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroid 20', 'asteroidice 50', 'asteroidrad 30'], random: true },
      { time: 46, startAngle: 0, endAngle: 360, type: 'star', random: true },
      { time: 54, duration: 0, startAngle: 45, endAngle: 135, quantity: 5, type: 'asteroid' }, // arc
      { time: 59, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroid 20', 'asteroidice 50', 'asteroidrad 30'], random: true },
    ],
    [ // Saturn 4-3
      { time: 0, duration: 8, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroid 5', 'asteroidice 5', 'asteroidrad 90'], random: true },
      { time: 4, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
      { time: 8, duration: 8, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroid 5', 'asteroidice 15', 'asteroidrad 80'], random: true },
      { time: 12, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
      { time: 21, duration: 0, startAngle: -45, endAngle: 45, quantity: 5, type: 'asteroid' }, // arc
      { time: 21, type: 'ufo' },
      { time: 26, duration: 6, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroid 0', 'asteroidice 60', 'asteroidrad 40'], random: true },
      { time: 29, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
      { time: 37, duration: 0, startAngle: 135, endAngle: 255, quantity: 5, type: 'asteroid' }, // arc
      { time: 40, type: 'ufo' },
      { time: 42, duration: 12, startAngle: 90, endAngle: 450, quantity: 12, type: 'asteroid' }, // sweep
      { time: 45, startAngle: 0, endAngle: 360, type: 'star', random: true },
      { time: 59, duration: 0, startAngle: 45, endAngle: 135, quantity: 5, type: 'asteroid' }, // arc
      { time: 64, duration: 0, startAngle: -45, endAngle: -135, quantity: 5, type: 'asteroid' }, // arc
      { time: 69, duration: 6, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroid 50', 'asteroidice 0', 'asteroidrad 50'], random: true },
      { time: 72, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
      { time: 74, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroid 0', 'asteroidice 70', 'asteroidrad 30'], random: true },
    ],    
    [
    // test 1

      { time: 0, duration: 4, startAngle: 0, endAngle: 270, quantity: 4, type: 'asteroid' },
      
      { time: 6, duration: 0, startAngle: 0, endAngle: 270, quantity: 4, type:'asteroid' },
      { time: 9, duration: 0, startAngle: 45, endAngle: 315, quantity: 4, type:'asteroid' },
      { time: 12, duration: 0, startAngle: 0, endAngle: 270, quantity: 4, type:'asteroid' },

      { time: 15, duration: 0, startAngle: 20, endAngle: 60, quantity: 3, type: 'asteroid' },
      { time: 14, duration: 0, startAngle: -45, endAngle: 0, quantity: 1, type: 'comet' },
      
      { time: 17, duration: 0, startAngle: -135, endAngle: -135, quantity: 1, type: 'asteroidrad' },
      
      { time: 24, startAngle: 45, type: 'star' }
    ]
    ,
    // test 2
    [
      { time: 0, duration: 6, startAngle: 0, endAngle: 120, quantity: 6, type:'asteroid' },
      { time: 3, duration: 0, startAngle: -90, endAngle: -180, quantity: 4, type:'asteroid' },
      { time: 5, duration: 0, startAngle: -135, endAngle: 0, quantity: 1, type:'asteroidrad' },
      
      { time: 2, duration: 0, startAngle: 150, endAngle: 0, quantity: 1, type:'comet' },
      
      { time: 10, duration: 10, startAngle: 180, endAngle: 360, quantity: 10, type: 'asteroid' },
      { time: 10, duration: 5, startAngle: 0, endAngle: 180, quantity: 10, random: true, type: 'asteroid' },
      
      { time: 15, startAngle: 135, type: 'star' }
      
    ],
    [ // test 3
    { time: 0, duration: 2, startAngle: 90, endAngle: 90, quantity: 4, type: 'asteroid' },
    { time: 1.5, duration: 2, startAngle: -90, endAngle: -90, quantity: 4, type:'asteroid' },
    { time: 3, duration: 2, startAngle: 180, endAngle: 180, quantity: 4, type:'asteroid' },
    { time: 4.5, duration: 2, startAngle: 0, endAngle: 0, quantity: 4, type:'asteroid' },
    { time: 8, duration: 1.5, startAngle: 90, endAngle: 180, quantity: 3, type:'asteroidice' },
    { time: 9, duration: 2.5, startAngle: -90, endAngle: -45, quantity: 5, type:'asteroid' },
    { time: 14, duration: 1.5, startAngle: -90, endAngle: 0, quantity: 3, type:'asteroidice' },
    { time: 15, duration: 2.5, startAngle: 90, endAngle: 180, quantity: 5, type:'asteroid' },
    
    
    
    { time: 9, startAngle: -135, type: 'star' }
    ],
    /*
    [
      { time: 0, duration: 0, startAngle: 45, endAngle: 315, quantity: 4, type:'asteroid' },
      { time: 5, duration: 0, startAngle: 180, endAngle: 90, quantity: 4, type:'asteroid' },
      { time: 10, duration: 0, startAngle: 0, endAngle: -90, quantity: 4, type:'asteroid' },
      { time: 15, duration: 0, startAngle: 180, endAngle: 270, quantity: 4, type:'asteroid' },
      { time: 20, duration: 0, startAngle: 0, endAngle: 90, quantity: 4, type:'asteroid' },
      { time: 25, duration: 12, startAngle: 0, endAngle: 360, quantity: 12, type:'asteroid' },
      { time: 38, duration: 12, startAngle: 0, endAngle: -360, quantity: 12, type:'asteroid' }
    ]*/
  ];
  
  return {
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


