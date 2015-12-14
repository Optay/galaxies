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
    
    while ( (currentLevel.length > 0) && (currentLevel[0].time < levelTimer ) ) {
      
      if ( currentLevel[0].type === 'star' ) {
        galaxies.engine.addStar( currentLevel[0].angle );
      } else {
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
      if ( wave.endAngle == null ) { wave.endAngle = wave.startAngle; }
      if ( wave.duration == null ) { wave.duration = 0; }
      if ( wave.quantity == null ) { wave.quantity = 1; }
      
      var timeStep = wave.duration/Math.max(1, wave.quantity-1);
      var angleStep = (wave.endAngle - wave.startAngle)/Math.max(1, wave.quantity-1);
      
      for (var obsI = 0; obsI<wave.quantity; obsI++ ) {
        var entry = {
          time: wave.time + timeStep * obsI,
          angle: (wave.startAngle + angleStep * obsI) * Math.PI/180,
          type: wave.type
        };
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
    [
      // TEST LEVEL
{ time: 0, startAngle: 45, type: 'star' },
{ time: 0, duration: 4, startAngle: 0, endAngle: 270, quantity: 4, type: 'asteroidmetal' },
      { time: 3, duration: 0, startAngle: 0, endAngle: 270, quantity: 4, type:'asteroid' },
    ],
    [
    // level 1-1

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
    // level 1-2
    [
      { time: 0, duration: 6, startAngle: 0, endAngle: 120, quantity: 6, type:'asteroid' },
      { time: 3, duration: 0, startAngle: -90, endAngle: -180, quantity: 4, type:'asteroid' },
      { time: 5, duration: 0, startAngle: -135, endAngle: 0, quantity: 1, type:'asteroidrad' },
      
      { time: 2, duration: 0, startAngle: 150, endAngle: 0, quantity: 1, type:'comet' },
      
      { time: 10, duration: 15, startAngle: 90, endAngle: 450, quantity: 20, type: 'asteroid' },
      { time: 15, startAngle: 135, type: 'star' }
      
    ],/*
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
  
  parsePatterns(0);
  
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


