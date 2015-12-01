'use strict'
/**
 * audio
 *
 * Audio functions and definitions.
 *
 */

this.galaxies = this.galaxies || {};
galaxies.audio = galaxies.audio || {};

// Use surround when true, fallback to stereo mix when false, auto-detect value is set in initAudio
galaxies.audio.surroundMix = false;

galaxies.audio.globalGain = 1; // used to boost volume in OS X 10.11, Safari 9, which has a problem in the EC-3 decoder.

// spatialization parameters
galaxies.audio.DISTANCE_ATTENUATION = 0.1;//0.05;
galaxies.audio.DISTANCE_REF = 2;
galaxies.audio.DISTANCE_ROLL = 1;
galaxies.audio.DIRECTION_FOCUS = 1; // How much sounds spread to neighboring speakers: higher values produces sharper spatialization, lower values spread sound more evenly
galaxies.audio.DOPPLER_FACTOR = 70; // Higher numbers result in less doppler shift.

galaxies.audio.muteState = 'none'; // Designates which audio is muted: none, music, all

// active ObjectSound instances
galaxies.audio.positionedSounds = [];

// Create a new AudioBufferSource node for a given sound.
galaxies.audio.getSound = function( id ) {
  var buffer = galaxies.audio.loadedSounds[id].next();
  //console.log( "getSound", id, buffer, typeof(buffer) );
  if ( typeof( buffer ) === 'undefined' ) {
    console.log("Requested sound not loaded.", id)
    return null;
  }
  return buffer;
}

// This structure combines groups of sounds together for constructing exhaustive arrays.
galaxies.audio.sounds = {
  'shoot': ['shoot1', 'shoot2', 'shoot3', 'shoot4', 'shoot5'],
  'asteroidsplode': ['asteroidsplode1', 'asteroidsplode2', 'asteroidsplode3'],
  'cometexplode': ['cometexplode'],
  'cometloop': ['cometloop'],
  'fpo': ['fpo1'],
  'ufo': ['ufo'],
  'music': ['music'],
  'ufohit': ['ufohit1', 'ufohit2'],
  'ufoshoot': ['ufoshoot'],
  'planetsplode': ['planetsplode'],
  'teleportin': ['teleportin'],
  'teleportout': ['teleportout'],
  'metalhit': ['metalhit1', 'metalhit2', 'metalhit3' ],
  'titlewoosh': ['titlewoosh'],
  'satellitesplode': ['satellitesplode'],
  'asteroidhit': ['asteroidhit1', 'asteroidhit2', 'asteroidhit3', 'asteroidhit4'],
  'trunkfordlaugh': ['trunkfordlaugh1', 'trunkfordlaugh2', 'trunkfordlaugh3', 'trunkfordlaugh4' ],
  'buttonover': ['buttonover']
}

// Decode and package loaded audio data into exhaustive array objects.
galaxies.audio.initAudio = function( complete ) {
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  galaxies.audio.audioCtx = galaxies.audio.audioCtx || new AudioContext(); // audio context will already have been defined in mobile touch-to-start event.
  galaxies.audio.listener = galaxies.audio.audioCtx.listener;
  //audioCtx.destination.maxChannelCount = 6;
  console.log("initAudio");
  //console.log( "Output channels:", galaxies.audio.audioCtx.destination.channelCountMode, galaxies.audio.audioCtx.destination.channelCount, galaxies.audio.audioCtx.destination.maxChannelCount );
  
  // Global mute
  galaxies.audio.outNode = galaxies.audio.audioCtx.createGain();
  galaxies.audio.outNode.connect( galaxies.audio.audioCtx.destination );

  // Boost volume for EC-3 playback in Safari 9.0, OSX.
  // There is a problem in that EC-3 decoder which results in muted playback.
  // In order not to blast people in future versions of Safari
  if ( galaxies.utils.supportsEC3 &&
       galaxies.utils.isOSX() &&
       /Version\/9.0 Safari/.test(navigator.userAgent) )
  { galaxies.audio.globalGain = 5; }
  galaxies.audio.outNode.gain.value = galaxies.audio.globalGain;

  var onComplete = complete;
  
  var soundIds = Object.keys(galaxies.audio.sounds);
  
  var remaining = 0;
  for( var i=0; i<soundIds.length; i++ ) {
    remaining += galaxies.audio.sounds[ soundIds[i] ].length;
  }
  
  // collection of AudioBuffer objects
  galaxies.audio.loadedSounds = {};

  for( var i=0; i<soundIds.length; i++ ) {
    galaxies.audio.loadedSounds[ soundIds[i] ] = new galaxies.ExhaustiveArray();
    for ( var j=0; j<galaxies.audio.sounds[ soundIds[i] ].length; j++ ) {
      //console.log( sounds[soundIds[i]][j] );
      //console.log( galaxies.queue.getResult( sounds[soundIds[i]][j]) );
      decodeFile( soundIds[i], galaxies.audio.sounds[soundIds[i]][j] );
    }
  }
  
  function decodeFile( soundId, fileId ) {
    var loadedId = soundId;
    var result = galaxies.queue.getResult( fileId, true );
    //console.log( result );
    if ( result != null ) {
      galaxies.audio.audioCtx.decodeAudioData( result,
        function(buffer) {
          //console.log("decoded", loadedId );
          galaxies.audio.loadedSounds[ loadedId ].add( buffer );  
          fileComplete();
        },
        function() {
          console.log( "Error decoding audio file.", loadedId );
          
          // Add an empty buffer to the cache to prevent errors when trying to play this sound.
          galaxies.audio.loadedSounds[ loadedId ].add( galaxies.audio.audioCtx.createBuffer(2, 22050, 44100) );
          //loadedSounds[loadedId].add( null );
          fileComplete();
        } );
    } else {
      // Add an empty buffer
      galaxies.audio.loadedSounds[ loadedId ].add( galaxies.audio.audioCtx.createBuffer(2, 22050, 44100) );
      //loadedSounds[loadedId].add( null );
      fileComplete();
    }
  }

  function fileComplete() {
    remaining --;
    if ( remaining <= 0 ) {
      loadComplete();
    }
  }
  
  function loadComplete() {
    // perform initial shuffle on exhaustive arrays
    var soundIds = Object.keys(galaxies.audio.loadedSounds);
    for( var i=0; i<soundIds.length; i++ ) {
      galaxies.audio.loadedSounds[ soundIds[i] ].init();
    }
    
    // audio
    // Set initial mix to 6-channel surround.
    // NOTE:Mobile platforms always get the surround mix. The stereo mix was crashing
    // iPhone 6s, so this is the quick workaround.
    var useSurround = (( galaxies.audio.audioCtx.destination.maxChannelCount === 6 ) || galaxies.utils.isMobile());
    galaxies.audio.toggleTargetMix( useSurround );
    
    // fire callback
    onComplete();
  }
  
  
}








galaxies.audio.channelAngles = [
  Math.PI/4,     // L
  -Math.PI/4,    // R
  0,             // C
  null,          // LFE
  3*Math.PI/4,   // SL
  -3*Math.PI/4   // SR
];

/** Creates a sound that is mixed based on its position in 3D space.
 * 
 * properties:
 * buffer, loop, start, dispose, baseVolume, position
 **/
galaxies.audio.PositionedSound = function( props ) {
  
  if ( typeof(props.dispose) !=='boolean' ) { props.dispose = true; }
  var dispose = props.dispose;
  
  if ( typeof(props.loop) !=='boolean' ) { props.loop = true; }
  this.loop = props.loop;

  if ( typeof(props.start) !=='boolean' ) { props.start = true; }
  
  var buffer = props.source; // hold on to the buffer, so we can replay non-looping sounds
  
  this.toSource = new THREE.Vector3(); // vector from listener to source
  
  this.muteVolume = galaxies.audio.audioCtx.createGain();
  
  this.preAmp = galaxies.audio.audioCtx.createGain();
  this.muteVolume.connect( this.preAmp );
  Object.defineProperty(this, "volume", { set:
    function (value) {
      this._volume = value;
      this.preAmp.gain.value = this._volume;
    }
  });
  if ( typeof( props.baseVolume ) !=='number' ) { props.baseVolume = 1; }
  this.volume = props.baseVolume;
  
  // 6-channel mix
  this.bearing = 0;
  this.distance = 0;
  this.inPlaneWeight = 0;
  var combiner;
  this.channels = [];
  
  // stereo mix
  var panner;
  
  this.init = function() {
    // init can be called more than once to change mix scheme, so first we must
    // clear any channels or panners if they are already set.
    for (var i=0; i<this.channels.length; i++ ) {
      this.preAmp.disconnect( this.channels[i] );
      this.channels[i].disconnect(this.combiner);
    }
    this.channels = [];
    if ( this.combiner != null ) {
      this.combiner.disconnect( galaxies.audio.outNode );
      this.combiner = null;
    }
    if ( this.panner!=null ) {
      this.preAmp.disconnect( this.panner );
      this.panner.disconnect( galaxies.audio.outNode );
      this.panner = null;
    }
    //
    
    if ( galaxies.audio.surroundMix ) {
      // initialize 6-channel mix
      this.combiner = galaxies.audio.audioCtx.createChannelMerger();
      for ( var i=0; i<6; i++ ) {
        var newGainNode = galaxies.audio.audioCtx.createGain();
        newGainNode.gain.value = 0;   // start silent to avoid loud playback before initial mix call
        this.preAmp.connect( newGainNode );
        newGainNode.connect( this.combiner, 0, i );
        this.channels[i] = newGainNode;
      }
      this.combiner.connect(galaxies.audio.outNode);
    } else { 
      // initialize stereo mix
      this.panner = galaxies.audio.audioCtx.createPanner();
      this.panner.panningModel = 'HRTF';
      this.panner.distanceModel = 'inverse';
      this.panner.refDistance = 2;
      this.panner.maxDistance = 10000;
      this.panner.rolloffFactor = 1;
      this.panner.coneInnerAngle = 360;
      this.panner.coneOuterAngle = 0;
      this.panner.coneOuterGain = 0;
      this.preAmp.connect( this.panner );
      this.panner.connect( galaxies.audio.outNode );
    }
  }
  
  this.updatePosition = function( newPosition ) {
    // TODO - Evaluate this against the listener object direction for a more versatile system.
    //        Transform the vector into the listener local space.
    this.toSource.subVectors( newPosition, galaxies.audio.listenerObject.position );
    this.distance = this.toSource.length();
    
    if ( galaxies.audio.surroundMix ) {
      this.bearing = Math.atan2( -this.toSource.x, -this.toSource.z );
      this.inPlaneWeight = 0;
      if (this.distance > 0) { this.inPlaneWeight = Math.sqrt( Math.pow(this.toSource.x,2) + Math.pow(this.toSource.z,2) ) / this.distance; }
      for(var iOutput = 0; iOutput<6; iOutput++ ) {
        
        // base level based on distance
        var gain = galaxies.audio.DISTANCE_REF / (galaxies.audio.DISTANCE_REF + galaxies.audio.DISTANCE_ROLL * (this.distance - galaxies.audio.DISTANCE_REF)); // linear, to match panner algorithm in stereo mix
        //var gain = 1 / Math.exp(this.distance * DISTANCE_ATTENUATION); // exponential
        if ( galaxies.audio.channelAngles[iOutput] !== null ) {
          // cosine falloff function
          //var directionAttenuation = (Math.cos( galaxies.audio.channelAngles[iOutput] - source.bearing ) + 1)/2;
          
          // exponential falloff function
          // calculate short distance between the angles
          var angleDifference = ((galaxies.audio.channelAngles[iOutput] - this.bearing) + galaxies.utils.PI_2 + Math.PI) % galaxies.utils.PI_2 - Math.PI;
          var directionAttenuation = Math.exp( -angleDifference * angleDifference * galaxies.audio.DIRECTION_FOCUS );
          
          gain =  (gain/2) * (1-this.inPlaneWeight) + 
                  gain * (directionAttenuation) * this.inPlaneWeight;
        }
        this.channels[iOutput].gain.value = gain; //  apply resulting gain to channel
      }          
    } else {
      // exaggerate the horizontal position of the object in order to get better stereo separation
      this.panner.setPosition( newPosition.x, newPosition.y, newPosition.z );
    }
  }
  
  this.startSound = function() {
    if ( this.source != null ) {
      this.source.stop(0);
    }
    try{
      this.source = galaxies.audio.audioCtx.createBufferSource();
      this.source.loop = this.loop;
      this.source.buffer = buffer;
      this.source.connect( this.muteVolume );
      this.source.start(0);
      
      if ( dispose ) {
        var ref = this;
        this.source.onended = function() { galaxies.audio.unregisterPositionedSound( ref ); };
      }
    } catch(e) {
      console.log("Unable to start sound", e );
    }
  }
  
  this.init();
  this.updatePosition( props.position ); // set initial mix
  
  galaxies.audio.registerPositionedSound( this );
  
  if ( props.start ) {
    this.startSound();
  }
}

/// Object sound wraps a positioned sound, attaching the sound's position to an object.
galaxies.audio.ObjectSound = function( source, object, baseVolume, loop, start ) {
  this.object = object;
  this.sound = new galaxies.audio.PositionedSound( {
    source: source,
    position: galaxies.utils.rootPosition( object ),
    baseVolume: baseVolume,
    loop: loop,
    start: start,
    dispose: false
  });
 
  // Doppler
  this.lastDistance = 0;
  this.velocity = 0;
  
  Object.defineProperty(this, "volume", { set:
    function (value) {
      //console.log("volume", value );
      this._volume = value;
      this.sound.preAmp.gain.value = this._volume;
    }
  });
 
  this.update = function( delta ) {
    if ( this.sound.source == null ) { return; }
    this.sound.updatePosition( galaxies.utils.rootPosition( this.object ) );
    
    var deltaDistance = (this.lastDistance - this.sound.distance)/delta;
    this.sound.source.playbackRate.value = 1 + (deltaDistance/galaxies.audio.DOPPLER_FACTOR);
    this.lastDistance = this.sound.distance;
  }
}


// Plays a non-positioned sound. So vanilla.
galaxies.audio.playSound = function ( buffer ) {
  var source = galaxies.audio.audioCtx.createBufferSource();
  source.loop = false;
  source.buffer = buffer;
  source.connect( galaxies.audio.outNode );
  source.start(0);
}




// Debug tool to display surround mix gains.
/*
function visualizeSource( directionalSource ) {
  var visDivs = []; // L, R, C, LFE, SL, SR
  visDivs[0] = document.getElementById('fl');
  visDivs[1] = document.getElementById('fr');
  visDivs[2] = document.getElementById('c');
  visDivs[4] = document.getElementById('sl');
  visDivs[5] = document.getElementById('sr');
  
  for( var i=0; i< visDivs.length; i++ ) {
    if ( typeof( visDivs[i] ) !== 'undefined' ) {
      visDivs[i].innerHTML = directionalSource.channels[i].gain.value.toFixed(2);
    }
  }
  
  //console.log( directionalSource.distance );
  document.getElementById('bearing').innerHTML = directionalSource.bearing.toFixed(2);
}*/





/// A multi-channel source that is mixed based on an arbitrary angle which
/// rotates the soundfield.
galaxies.audio.SoundField = function ( buffer ) {
  // List of the channel indices used by SoundField.
  // Only L, R, SL, and SR channels are rotated, so we list the corresponding indices here.
  var channelMap = [0, 1, 4, 5];
  var playThrough = [2, 3];
  
  this.source = galaxies.audio.audioCtx.createBufferSource();
  this.source.loop = true;
  this.source.buffer = buffer;

  this.angle = 0;
  this.angularVelocity = 1;
  
  // Add input
  var volumeNode = galaxies.audio.audioCtx.createGain();
  this.source.connect( volumeNode );
  var splitter = galaxies.audio.audioCtx.createChannelSplitter(6);
  volumeNode.connect( splitter );
  var combiner = galaxies.audio.audioCtx.createChannelMerger(6);
  combiner.connect(galaxies.audio.outNode);
  
  this.gains = [];
  
  // hook up channels that will not be remixed directly
  for (var i=0; i<playThrough.length; i++ ) {
    splitter.connect(combiner, playThrough[i], playThrough[i] );
  }
  
  // Add gain nodes for mixing moving channels
  for ( var iOutput = 0; iOutput<channelMap.length; iOutput ++ ) {   // into each output channel
    this.gains[iOutput] = [];
    for (var iSource=0; iSource<channelMap.length; iSource++ ) {     // mix the source channels
      var newGainNode = galaxies.audio.audioCtx.createGain();
      splitter.connect( newGainNode, channelMap[iSource], 0 );
      newGainNode.connect( combiner, 0, channelMap[iOutput] );
      this.gains[iOutput][iSource] = newGainNode;
    }
  }

  this.setVolume = function( value ) {
    volumeNode.gain.value = value;
  }
  
  this.setVolume(0.24);
  this.source.start(0);
  
  this.update = function(delta) {
    this.angle += this.angularVelocity * delta;
    
    for( var iOutput = 0; iOutput<channelMap.length; iOutput++ ) {
      for(var iSource = 0; iSource<channelMap.length; iSource++ ) {
        var gain;
        if ( galaxies.audio.channelAngles[channelMap[iSource]] !== null ) {
          //gain = soundField.volume * Math.pow( (Math.cos( galaxies.audio.channelAngles[iOutput] - (galaxies.audio.channelAngles[iSource] + soundField.angle) ) + 1)/2, 1);
          gain = (Math.cos( galaxies.audio.channelAngles[channelMap[iOutput]] - (galaxies.audio.channelAngles[channelMap[iSource]] + this.angle) ) + 1)/2;
        }
        this.gains[iOutput][iSource].gain.value = gain; //  apply resulting gain to channel
      }
    }
  }
}

galaxies.audio.registerPositionedSound = function( ps ) {
  galaxies.audio.positionedSounds.push( ps );
  //console.log("register sound", positionedSounds.length );
}
galaxies.audio.unregisterPositionedSound = function( ps ) {
  var index = galaxies.audio.positionedSounds.indexOf(ps);
  if ( index >= 0 ) {
    galaxies.audio.positionedSounds.splice( index, 1 );
    //console.log("unregister sound", positionedSounds.length );
  }
}

galaxies.audio.toggleTargetMix = function( value ) {
  galaxies.audio.surroundMix = value;
  galaxies.ui.setMixButtons( galaxies.audio.surroundMix );
  
  // Re-initialize active sources, this will use the new surroundMix value
  for( var i=0, len=galaxies.audio.positionedSounds.length; i<len; i++ ) {
    galaxies.audio.positionedSounds[i].init();
  }
  
  // Set destination channel count to match
  if ( ( galaxies.audio.surroundMix )  ) {
    if ( galaxies.audio.audioCtx.destination.maxChannelCount >= 6 )  { galaxies.audio.audioCtx.destination.channelCount = 6; }
  } else {
    if ( galaxies.audio.audioCtx.destination.maxChannelCount >= 2 ) { galaxies.audio.audioCtx.destination.channelCount = 2; }
  }

}


galaxies.audio.toggleMuteState = function() {
  switch(galaxies.audio.muteState) {
  case ('none'):
    galaxies.audio.muteState = 'music';
    galaxies.audio.setAllMute( false );
    galaxies.audio.setMusicMute( true );
    break;
  case ('music'):
    galaxies.audio.muteState = 'all';
    galaxies.audio.setAllMute( true );
    break;
  case ('none'):
  default:
    galaxies.audio.muteState = 'none'
    galaxies.audio.setAllMute( false );
    break;
  }
}

// could be private
galaxies.audio.setAllMute = function( mute ) {
  galaxies.audio.setMusicMute( false );
  if ( mute ) {
    galaxies.audio.outNode.gain.value = 0;
  } else {
    galaxies.audio.outNode.gain.value = galaxies.audio.globalGain;
  }
}

// could be private
galaxies.audio.setMusicMute = function( mute ) {
  if ( mute ) {
    galaxies.audio.soundField.setVolume(0);
  } else {
    galaxies.audio.soundField.setVolume(0.24);
  }
}





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

galaxies.engine.driftSpeed = 0.05;

galaxies.engine.isPaused = false;
galaxies.engine.isGameOver = false;

galaxies.engine.START_LEVEL_NUMBER = 1;

// Level number also updates roundNumber and planetNumber.
// NOTE: LEVEL, ROUND, AND PLANET NUMBERS ARE ALL 1-INDEXED, they are "number" not "index"
galaxies.engine._levelNumber = 1;
Object.defineProperty( galaxies.engine, 'levelNumber', {
  get: function() { return galaxies.engine._levelNumber; },
  set: function( value ) {
    galaxies.engine._levelNumber = value;
    galaxies.engine.roundNumber = ((galaxies.engine.levelNumber-1) % galaxies.engine.ROUNDS_PER_PLANET ) + 1;
    galaxies.engine.planetNumber = Math.floor((galaxies.engine.levelNumber-1)/galaxies.engine.ROUNDS_PER_PLANET) + 1;
  }
});

galaxies.engine.levelTimer = 0;
galaxies.engine.LEVEL_TIME = 15;
galaxies.engine.levelComplete = false;

galaxies.engine.spawnTimers = {};
galaxies.engine.spawnTimes = {};
galaxies.engine.obstacleTypes = ['asteroid', 'asteroidmetal', 'asteroidrad', 'comet'];//['asteroid', 'satellite', 'comet'];

// View, play parameters
galaxies.engine.speedScale = 1;

// "constants"
// Some of these are fixed, some are dependent on window size and are recalculated in 
// the window resize function.
galaxies.engine.CONE_ANGLE = 11.4 * Math.PI/360; // Half-angle of the interior of the cone
galaxies.engine.CAMERA_Z = 40;
galaxies.engine.CAMERA_VIEW_ANGLE = 45; // Will be applied to smallest screen dimension, horizontal or vertical. TODO
galaxies.engine.ROUNDS_PER_PLANET = 3; // 3

galaxies.engine.SHOOT_TIME = 0.6; // 0.4 in original

galaxies.engine.POWERUP_DURATION = 10;
galaxies.engine.POWERUP_CHARGED = 100;
galaxies.engine.powerups = ['clone', 'spread', 'golden'];

galaxies.engine.PLANET_RADIUS = 1;
galaxies.engine.CHARACTER_HEIGHT = 3;
galaxies.engine.CHARACTER_POSITION = galaxies.engine.PLANET_RADIUS + (0.95 * galaxies.engine.CHARACTER_HEIGHT/2 );
galaxies.engine.PROJ_START_Y = galaxies.engine.PLANET_RADIUS + (galaxies.engine.CHARACTER_HEIGHT * 0.08);//2;

galaxies.engine.CONE_SLOPE = Math.tan( galaxies.engine.CONE_ANGLE );
galaxies.engine.CAMERA_SLOPE = Math.tan( galaxies.engine.CAMERA_VIEW_ANGLE*Math.PI/360 );
galaxies.engine.VISIBLE_RADIUS = galaxies.engine.CAMERA_Z * galaxies.engine.CONE_SLOPE * galaxies.engine.CAMERA_SLOPE/ (galaxies.engine.CONE_SLOPE + galaxies.engine.CAMERA_SLOPE);

// Scene/game objects
galaxies.engine.targetAngle = 0;
galaxies.engine.angle = 0;

// Active obstacles.
galaxies.engine.obstacles = [];
galaxies.engine.inactiveObstacles = [];

// Pool obstacles separately to avoid having to create new meshes.
// TODO - initialize obstacle-type-keyed objects more intelligently (too much repitition).
galaxies.engine.obstaclePool = {};
galaxies.engine.obstaclePool['asteroid'] = [];
galaxies.engine.obstaclePool['asteroidmetal'] = [];
galaxies.engine.obstaclePool['asteroidrad'] = [];
galaxies.engine.obstaclePool['satellite'] = [];
galaxies.engine.obstaclePool['comet'] = [];

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
  
  // Averages height/width circles to make active play area.
  //var aspectAdjust = (galaxies.engine.camera.aspect + 1) /2;
  //var cameraSlope = aspectAdjust * Math.tan( galaxies.engine.CAMERA_VIEW_ANGLE * Math.PI/360 );
  
  // Sets active play area by diagonal window size
  var diagonal = Math.sqrt( Math.pow(galaxies.engine.camera.aspect,2) + 1 );
  var cameraSlope = diagonal * Math.tan( galaxies.engine.CAMERA_VIEW_ANGLE * Math.PI/360 );
  
  galaxies.engine.OBSTACLE_VISIBLE_RADIUS = galaxies.engine.CAMERA_Z * galaxies.engine.CONE_SLOPE * cameraSlope/ (galaxies.engine.CONE_SLOPE + cameraSlope);
  //galaxies.engine.OBSTACLE_START_RADIUS = galaxies.engine.OBSTACLE_VISIBLE_RADIUS * 1.1;//OBSTACLE_VISIBLE_RADIUS * 1.2;
  galaxies.Projectile.prototype.PROJECTILE_LIFE = 0.95 * (galaxies.engine.OBSTACLE_VISIBLE_RADIUS - galaxies.engine.PROJ_START_Y)/galaxies.Projectile.prototype.PROJECTILE_SPEED;
  
  //console.log( OBSTACLE_VISIBLE_RADIUS );
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
  
  // Detect minimized/inactive window to avoid bad delta time values.
  document.addEventListener("visibilitychange", galaxies.engine.onVisibilityChange );
  
  galaxies.ui.init();
  
}

// Create 3D scene, camera, light, skybox
galaxies.engine.initScene = function() {
  var mesh;
  galaxies.engine.container = document.getElementById( 'container' );

  galaxies.engine.scene = new THREE.Scene();
  
  galaxies.engine.driftObject = new THREE.Object3D();
  galaxies.engine.scene.add( galaxies.engine.driftObject );
  
  galaxies.engine.rootObject = new THREE.Object3D();
  galaxies.engine.driftObject.add( galaxies.engine.rootObject );
  
  galaxies.engine.camera = new THREE.PerspectiveCamera( galaxies.engine.CAMERA_VIEW_ANGLE, window.innerWidth / window.innerHeight, 1, 1100 );
  galaxies.engine.camera.position.set(0,0,galaxies.engine.CAMERA_Z);
  galaxies.engine.rootObject.add(galaxies.engine.camera);
  
  var light = new THREE.DirectionalLight( 0xffffff, 1 );
  light.position.set( 30, 20, 50 );
  galaxies.engine.rootObject.add( light );
  
  var skyTexture = new THREE.CubeTexture([
    galaxies.queue.getResult('skyboxright1'),
    galaxies.queue.getResult('skyboxleft2'),
    galaxies.queue.getResult('skyboxtop3'),
    galaxies.queue.getResult('skyboxbottom4'),
    galaxies.queue.getResult('skyboxfront5'),
    galaxies.queue.getResult('skyboxback6') ]);
  skyTexture.generateMipMaps = false;
  skyTexture.magFilter = THREE.LinearFilter,
  skyTexture.minFilter = THREE.LinearFilter
  skyTexture.needsUpdate = true;
  
  /* Set up a material that uses a cubemap texture.  This material uses
     custom vertex and fragment shaders that are defined in three.js as
     part of its shader library.  This code is copied from examples in
     the three.js download. */
  var shader = THREE.ShaderLib[ "cube" ];
  shader.uniforms[ "tCube" ].value = skyTexture;
  var material = new THREE.ShaderMaterial( { // A ShaderMaterial uses custom vertex and fragment shaders.
      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
      uniforms: shader.uniforms,
      depthWrite: false,
      side: THREE.BackSide
  } );

  galaxies.engine.skyCube = new THREE.Mesh( new THREE.BoxGeometry( 200, 200, 200 ), material );
  galaxies.engine.scene.add(galaxies.engine.skyCube);
  
  
  galaxies.engine.renderer = new THREE.WebGLRenderer();
  galaxies.engine.renderer.setPixelRatio( window.devicePixelRatio );
  galaxies.engine.renderer.setSize( window.innerWidth, window.innerHeight );
  //renderer.setSize( 640, 480 );
  galaxies.engine.container.appendChild( galaxies.engine.renderer.domElement );
  
  //console.log( galaxies.engine.renderer.domElement );
  //renderer.domElement.addEventListener( "webglcontextlost", handleContextLost, false);
  galaxies.engine.renderer.context.canvas.addEventListener( "webglcontextlost", galaxies.engine.handleContextLost, false);
  //renderer.domElement.addEventListener( "webglcontextrestored", handleContextRestored, false);  
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
  
  galaxies.resources = new galaxies.Resources();
  
  galaxies.engine.planet = new THREE.Mesh( galaxies.resources.geometries['moon'], galaxies.resources.materials['moon'] );
  galaxies.engine.rootObject.add( galaxies.engine.planet );
  
  galaxies.engine.characterRotator = new THREE.Object3D();
  galaxies.engine.rootObject.add( galaxies.engine.characterRotator );
  
  //var characterMap = THREE.ImageUtils.loadTexture( "images/lux.png" );
  //characterMap.minFilter = THREE.LinearFilter;
  
  /*
  var test = document.createElement( 'img' );
  //test.src = 'images/lux.png';
  test.src = galaxies.queue.getResult('lux').src;
  document.getElementById('menuHolder').appendChild(test);
  */
  
  
  
  /*
  var loader = new THREE.ImageLoader();
  //loader.crossOrigin = this.crossOrigin;
  loader.load( 'images/lux.png', function ( image ) {
    console.log(image);

    document.getElementById('menuHolder').appendChild(image);
    //characterMap.image = image;
    //characterMap.needsUpdate = true;
    //if ( onLoad ) onLoad( texture );
  }, undefined, function ( event ) {

      if ( onError ) onError( event );

  } );
  */
  //var characterMap = new THREE.Texture( galaxies.queue.getResult('lux'), THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter );
  var characterMap = new THREE.Texture( galaxies.queue.getResult('lux') );
  galaxies.engine.characterAnimator = new galaxies.SpriteSheet(
    characterMap,
    [ [2,2,172,224,0,4,81.35],
      [176,2,172,224,0,4,81.35],
      [350,2,172,224,0,4,81.35],
      [524,2,172,224,0,4,81.35],
      [698,2,172,224,0,4,81.35],
      [2,228,172,224,0,4,81.35],
      [176,228,172,224,0,4,81.35],
      [350,228,172,224,0,4,81.35],
      [524,228,172,224,0,4,81.35],
      [698,228,172,224,0,4,81.35],
      [2,454,172,224,0,4,81.35],
      [176,454,172,224,0,4,81.35],
      [350,454,172,224,0,4,81.35],
      [524,454,172,224,0,4,81.35],
      [698,454,172,224,0,4,81.35],
      [2,680,172,224,0,4,81.35]
      
      ], 
    30
    );
  characterMap.needsUpdate = true;
  
  var characterMaterial = new THREE.SpriteMaterial({
    map: characterMap,
    color: 0xffffff,
    transparent: true,
    opacity: 1.0
  } );
  //var characterMaterial = new THREE.SpriteMaterial( { color: 0xffffff } );
  galaxies.engine.character = new THREE.Sprite( characterMaterial );
  galaxies.engine.character.position.set( galaxies.engine.CHARACTER_HEIGHT * 0.77 * 0.15, galaxies.engine.CHARACTER_POSITION, 0 ); // note that character is offset horizontally because sprites are not centered
  galaxies.engine.character.scale.set(galaxies.engine.CHARACTER_HEIGHT*0.77, galaxies.engine.CHARACTER_HEIGHT, galaxies.engine.CHARACTER_HEIGHT * 0.77); // 0.77 is the aspect ratio width/height of the sprites
  galaxies.engine.characterRotator.add( galaxies.engine.character );

  var cloneMaterial = new THREE.SpriteMaterial({
    map: characterMap,
    color: 0xaaffaa,
    transparent: true,
    opacity: 1.0
  } );
  galaxies.engine.clone = new THREE.Sprite( cloneMaterial );
  galaxies.engine.clone.position.set( -galaxies.engine.CHARACTER_HEIGHT * 0.77 * 0.15, -galaxies.engine.CHARACTER_POSITION, 0 );
  galaxies.engine.clone.scale.set(galaxies.engine.CHARACTER_HEIGHT*0.77, galaxies.engine.CHARACTER_HEIGHT, galaxies.engine.CHARACTER_HEIGHT * 0.77);
  
  
  
  galaxies.engine.setPowerup();
  
  galaxies.engine.addInputListeners();

  //

  /*
  document.addEventListener( 'dragover', function ( event ) {

      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';

  }, false );

  document.addEventListener( 'dragenter', function ( event ) {

      document.body.style.opacity = 0.5;

  }, false );

  document.addEventListener( 'dragleave', function ( event ) {

      document.body.style.opacity = 1;

  }, false );

  document.addEventListener( 'drop', function ( event ) {

      event.preventDefault();

      var reader = new FileReader();
      reader.addEventListener( 'load', function ( event ) {

          material.map.image.src = event.target.result;
          material.map.needsUpdate = true;

      }, false );
      reader.readAsDataURL( event.dataTransfer.files[ 0 ] );

      document.body.style.opacity = 1;

  }, false );*/

  /*
  // Debug controls
  var debugFormElement = document.getElementById("debugForm");
  var audioToggle = debugFormElement.querySelector("input[name='audio']");
  audioToggle.addEventListener('click', function(event) { toggleAudio( audioToggle.checked ); } );
  var soundFieldToggle = debugFormElement.querySelector("input[name='soundField']");
  soundFieldToggle.addEventListener('click', function(event) { toggleSoundField( soundFieldToggle.checked ); } );
  var surroundToggle = debugFormElement.querySelector("input[name='surround']");
  surroundToggle.addEventListener('click', function(event) { toggleTargetMix( surroundToggle.checked ); } );
  debugFormElement.querySelector("button[name='restart']").addEventListener('click', manualRestart );
  */
  
  galaxies.fx.init( galaxies.engine.scene );


  // TEST
  //addTestObject();

  
  galaxies.engine.startGame();
  
  /*
  window.setInterval( function() {
    randomizePlanet();
    //galaxies.fx.shakeCamera();
  }, 3000 );
  */
  
  //
} // initGame

/*
var testObjects = [];*/
var testObject;

function addTestObject() {
  testObject = new galaxies.Capsule();
}
  
  /*
  //var colorMap = new THREE.Texture( galaxies.queue.getResult('asteriodColor'), THREE.UVMapping );
  var colorMap = new THREE.Texture( galaxies.queue.getResult('asteroidcolor'), THREE.UVMapping );
  colorMap.needsUpdate = true;
  var normalMap = new THREE.Texture( galaxies.queue.getResult('asteroidnormal'), THREE.UVMapping );
  normalMap.needsUpdate = true;
  
  var material = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      //opacity: 0.4,
      //transparent: false,
      map: colorMap,//THREE.ImageUtils.loadTexture( "images/asteroid_color.jpg" ),
      normalMap: normalMap,//THREE.ImageUtils.loadTexture( "images/asteroid_normal.jpg" ),
      //normalScale: new THREE.Vector2( 1, 1 )
      shading: THREE.SmoothShading //THREE.FlatShading
      } );
  
  testObject = new THREE.Mesh( galaxies.resources.geometries['debris'], galaxies.resources.materials['debris'] );
  testObject.position.set( 0, 0, 10 );
  galaxies.engine.rootObject.add( testObject );
  var scale = 10;
  testObject.scale.set( scale, scale, scale );
  
  console.log( "Test Object", testObject);
  
  /*
  var emitterSettings = {
        type: 'sphere',
        //positionSpread: new THREE.Vector3(0.2, 0.2, 0.2),
        radius: 0.1,
        //velocity: new THREE.Vector3(0, 0, 0),
        //velocitySpread: new THREE.Vector3(30, 30, 30),
        //acceleration: new THREE.Vector3(0,0,-20),
        speed: 12,
        speedSpread: 10,
        sizeStart: 0.6,
        sizeStartSpread: 0.2,
        sizeEnd: 0.6,
        //sizeEndSpread: 10,
        opacityStart: 0.5,
        opacityStartSpread: 0.8,
        opacityEnd: 0,
        //opacityEndSpread: 0.8,
        colorStart: new THREE.Color(0.500, 0.500, 0.500),
        colorStartSpread: new THREE.Vector3(0.4, 0.4, 0.4),
        //colorEnd: new THREE.Color(0.01, 0.000, 0.000),
        //colorEndSpread: new THREE.Vector3(0.4, 0.6, 0.9),
        particlesPerSecond: 10000,
        particleCount: 1000,
        alive: 0.0,
        duration: 0.1
      };
      
      var texture =  THREE.ImageUtils.loadTexture( 'images/hit_sprite.png' );
//new THREE.Texture( galaxies.queue.getResult('projhitparticle') );
      texture.needsUpdate = true;
      var particleGroup1 = new SPE.Group({
        texture: texture,
        maxAge: 2,
        blending: THREE.NormalBlending//THREE.AdditiveBlending
      });
      
      particleGroup1.addPool( 1, emitterSettings );
      rootObject.add ( particleGroup1.mesh );
      particleGroup1.mesh.position.set( 0,0, 1 );
      
      
      testObjects.push( particleGroup1 );
      
      var emitterSettings2 = {
        type: 'sphere',
        //positionSpread: new THREE.Vector3(0.2, 0.2, 0.2),
        radius: 0.1,
        //velocity: new THREE.Vector3(0, 0, 0),
        //velocitySpread: new THREE.Vector3(30, 30, 30),
        acceleration: new THREE.Vector3(0,0,-40),
        speed: 10,
        speedSpread: 6,
        sizeStart: 8,
        sizeStartSpread: 6,
        sizeEnd: 6,
        //sizeEndSpread: 10,
        opacityStart: 0.5,
        opacityStartSpread: 0.8,
        opacityEnd: 0,
        //opacityEndSpread: 0.8,
        colorStart: new THREE.Color(0.800, 0.400, 0.100),
        colorStartSpread: new THREE.Vector3(0.1, 0.2, 0.4),
        colorEnd: new THREE.Color(0.5, 0.000, 0.000),
        //colorEndSpread: new THREE.Vector3(0.4, 0.6, 0.9),
        particlesPerSecond: 2000,
        particleCount: 200,
        alive: 0.0,
        duration: 0.1
      };
      
      var particleGroup2 = new SPE.Group({
        texture: texture,
        maxAge: 1.5,
        blending: THREE.AdditiveBlending
      });
      
      particleGroup2.addPool( 1, emitterSettings2 );
      rootObject.add ( particleGroup2.mesh );
      particleGroup2.mesh.position.set( 0,0, 0 );
      
      testObjects.push(particleGroup2);
      */
      
      /*
      window.setInterval( function() {
        gameOver();
        
        
      }, 3000 );
      */
      
      
      
      
      
      
      //var ref = new THREE.Mesh( new THREE.TetrahedronGeometry(0.6), new THREE.MeshLambertMaterial() );
      //particleGroup.mesh.add( ref );
  
//} // test objects


function testUpdate( delta ) {
  testObject.update(delta);
}
  /*
   *for (var i=0, len = testObjects.length; i<len; i++ ) {
    testObjects[i].tick(delta); // particle system
  }*/
  /*
  testObject.rotation.y = testObject.rotation.y + 1*delta;
}
*/



galaxies.engine.startGame = function() {
  
  
  // There can be only one!
  galaxies.engine.ufo = new galaxies.Ufo();
  
  galaxies.engine.resetGame();
  galaxies.engine.removeInputListeners();
  galaxies.engine.planetTransition();
  //initLevel();


  galaxies.engine.gameInitialized = true;
  
  if ( galaxies.engine.animationFrameRequest == null ) {
    galaxies.engine.animate();
  }
  
}

galaxies.engine.restartGame = function() {
  galaxies.ui.showPauseButton(); // is hidden by game over menu
  
  // Add character holder.
  // Character will be removed by planet transition.
  galaxies.engine.rootObject.add( galaxies.engine.characterRotator );
  
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
  
  // Each planet gets a set number of levels, starting slow and speeding up.
  // Sigmoid functions set bounds of speedScale based on planet number (absolute level number).
  
  var planetFirstSpeed = 1 + 1/(1+Math.exp(4-galaxies.engine.planetNumber));    // Speed on first level for this planet
  var planetLastSpeed = 1 + 1.5/(1+Math.exp(1-galaxies.engine.planetNumber/2)); // Speed on last level for this planet
  
  galaxies.engine.speedScale = THREE.Math.mapLinear(galaxies.engine.roundNumber, 1, 3, planetFirstSpeed, planetLastSpeed );
  //console.log( planetFirstSpeed, planetLastSpeed, galaxies.engine.speedScale );
  /*
  for ( var i=1; i<20; i++ ) {
    var planetLevel = ((i-1) % galaxies.engine.ROUNDS_PER_PLANET); // level progress on planet
    var planet = Math.floor( i/galaxies.engine.ROUNDS_PER_PLANET ); // Planet number
    var planetFirstSpeed = 1 + 1/(1+Math.exp(4-planet));
    var planetLastSpeed = 1 + 1.5/(1+Math.exp(1-planet*2));
    
    console.log( i, THREE.Math.mapLinear(planetLevel, 0, 2, planetFirstSpeed, planetLastSpeed ) );
  }*/
  
  
  // Obstacle spawns/second
  // Rates for obstacles start low and asymptote to a max value.
  // Max values are first integer in formula. Initial value is first integer minus second integer.
  //var asteroidCount = Math.floor( 20 - (15 * (1/(1 + (level-1) * 0.1)) ) );
  var asteroidRate = 3 - (2.30 * (1/(1 + (galaxies.engine.levelNumber-1) * 0.1)) );
  var satelliteRate = 0.6 - (0.40 * (1/(1 + (galaxies.engine.levelNumber-1) * 0.1)) );
  var cometRate = 0.6 - (0.45 * (1/(1 + (galaxies.engine.levelNumber-1) * 0.1)) );

  asteroidRate /= 3; // TEST - Tone it down while we're testing roid types.
  galaxies.engine.spawnTimes['asteroid'] = 1/asteroidRate;
  galaxies.engine.spawnTimes['asteroidmetal'] = 1/asteroidRate;
  galaxies.engine.spawnTimes['asteroidrad'] = 1/asteroidRate;
  //galaxies.engine.spawnTimes['satellite'] = 1/satelliteRate;
  galaxies.engine.spawnTimes['comet'] = 1/cometRate;
  
  // Initialize timers, so first wave spawns immediately
  for(var i=0, len = galaxies.engine.obstacleTypes.length; i<len; i++ ) {
    galaxies.engine.spawnTimers[ galaxies.engine.obstacleTypes[i] ] =
      galaxies.engine.spawnTimes[ galaxies.engine.obstacleTypes[i] ];
    /*galaxies.engine.spawnTimers[ galaxies.engine.obstacleTypes[i] ] =
      (0.5 + Math.random() * 0.5) * galaxies.engine.spawnTimes[ galaxies.engine.obstacleTypes[i] ];*/
  }
  
  console.log("Spawn timers initialized");
  
  //console.log( level, asteroidRate.toFixed(2), satelliteRate.toFixed(2), cometRate.toFixed(2) );
  
  /*
  for (var i=1; i<20; i++ ) {
    var asteroidCount = Math.floor( 20 - (15 * (1/(1 + (i-1) * 0.5)) ) );
    var satelliteCount = Math.floor( 12 - (12 * (1/(1 + (i-1) * 0.5)) ) );
    var cometCount = Math.floor( 10 - (10 * (1/(1 + (i-1) * 0.1)) ) );
    console.log(i, asteroidCount, satelliteCount, cometCount);
  }*/
  
  
  if ( galaxies.engine.levelNumber >= 3 ) {
  //if ( true ) { // UFO test
    //galaxies.engine.ufo.activate();
  }
  
  galaxies.ui.updateLevel( galaxies.engine.planetNumber, galaxies.engine.roundNumber );
  
  galaxies.ui.showTitle("ROUND " + galaxies.engine.roundNumber, 1.5 );
  

}
galaxies.engine.nextLevel = function() {
  galaxies.engine.levelNumber++;
  
  galaxies.engine.clearLevel();
  
  if ( galaxies.engine.roundNumber == 1 ) {
    galaxies.engine.initRootRotation();
    galaxies.engine.planetTransition();
  } else {
    galaxies.engine.initLevel();
  }
  
}


galaxies.engine.planetTransition = function() {
  // Reset the level timer, so we don't trigger nextLevel again.
  galaxies.engine.levelComplete = false;
  galaxies.engine.levelTimer = 0;
  
  // Set the spawnTimes high to prevent any obstacles from spawning until
  // initLevel is called.
  for(var i=0, len = galaxies.engine.obstacleTypes.length; i<len; i++ ) {
    galaxies.engine.spawnTimes[ galaxies.engine.obstacleTypes[i] ] = Infinity;
  }
  
  
  // disable input
  galaxies.engine.removeInputListeners();
  galaxies.engine.isFiring = false;
  
  console.log("begin planet transition");
  
  // If planet is in the scene, then we must do the out-transition first.
  // If planet is not in the scene, then we skip this step (happens on the first level of new games).
  if ( galaxies.engine.planet.parent != null ) {
    galaxies.fx.showTeleportOut();
    new galaxies.audio.PositionedSound({
      source: galaxies.audio.getSound('teleportout'),
      position: galaxies.utils.rootPosition(galaxies.engine.character),
      baseVolume: 10,
      loop: false
    });
    
    // 1500 is the teleport time as defined in FX and foolishly inaccessible.
    createjs.Tween.removeTweens(galaxies.engine.character);
    createjs.Tween.get(galaxies.engine.character)
      .wait(1500)
      .call( galaxies.engine.startPlanetMove, null, this );
  } else {
    galaxies.engine.startPlanetMove();
  }
  
  // These should be constants available everywhere.
  //var totalTransitionTime = 1500 + 6500 + 1500;
  createjs.Tween.get( galaxies.engine.camera.position )
    .to({z:galaxies.engine.CAMERA_Z/2}, 1500, createjs.Ease.quadInOut)
    .wait(6500)
    .to({z:galaxies.engine.CAMERA_Z}, 1500, createjs.Ease.quadInOut);
  
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
  var outPosition = galaxies.engine.rootObject.localToWorld( new THREE.Vector3(0,0,-100) );
  //var outPosition = new THREE.Vector3(0,0,-100);
  var inPosition = galaxies.engine.rootObject.localToWorld( new THREE.Vector3(0,100,0) );
  
  var transitionTimeMilliseconds = 6500;
  // Tween!
  createjs.Tween.removeTweens( galaxies.engine.planet.position );
  createjs.Tween.get( galaxies.engine.planet.position )
    .to({x:outPosition.x, y:outPosition.y, z:outPosition.z}, transitionTimeMilliseconds/2, createjs.Ease.quadInOut)
    .to({x:inPosition.x, y:inPosition.y, z:inPosition.z}, 0)
    .call( function() {
      galaxies.engine.scene.add( galaxies.engine.planet ); // First level planet must be added here
      galaxies.engine.randomizePlanet();
      
      galaxies.ui.showTitle( galaxies.utils.generatePlanetName( galaxies.engine.planetNumber ), 4 );
    }, null, this)
    .to({x:0, y:0, z:0}, transitionTimeMilliseconds/2, createjs.Ease.quadInOut);
  
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
  galaxies.engine.characterRotator.add( galaxies.engine.character );
  galaxies.fx.showTeleportIn(galaxies.engine.planetTransitionComplete);
  new galaxies.audio.PositionedSound({
    source: galaxies.audio.getSound('teleportin'),
    position: galaxies.utils.rootPosition( galaxies.engine.character ),
    baseVolume: 10,
    loop: false
  });
}
galaxies.engine.planetTransitionComplete = function() {
  galaxies.engine.addInputListeners();
  
  galaxies.engine.initLevel();
}

galaxies.engine.randomizePlanet = function() {
  galaxies.engine.planet.rotation.set( Math.random()*galaxies.utils.PI_2, Math.random()*galaxies.utils.PI_2, Math.random()*galaxies.utils.PI_2, 'ZXY' );
  galaxies.engine.planet.material.color.setHSL( Math.random(), THREE.Math.randFloat(0.1, 0.4), THREE.Math.randFloat(0.5, 0.7) );
  galaxies.engine.planetAngle = galaxies.engine.planet.rotation.z;   // planetAngle is the zero value for rotation the planet when lux moves

}



galaxies.engine.onDocumentMouseDown = function( event ) {
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
      
      //document.getElementById('message').innerHTML = mouseX.toFixed(2) + ", " + mouseY.toFixed(2);
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
  var obstacle = new galaxies.Obstacle.create( type );
  galaxies.engine.obstacles.push( obstacle );
  return obstacle;
}

galaxies.engine.shoot = function( indestructible ) {
  if ( typeof(indestructible) !== 'boolean' ) {
    indestructible = false;
  }
  
  if ( galaxies.engine.shotTimer>0 ) { return; }
  galaxies.engine.shotTimer = galaxies.engine.SHOOT_TIME;
  
  //console.log("shoot");
    
  // Instantiate shot object
  var projMesh = new THREE.Mesh( galaxies.resources.geometries['proj'], galaxies.resources.materials['proj'] );
  var projScale = 0.1;
  projMesh.scale.set(projScale, projScale, projScale );
  
  //var proj = new galaxies.Projectile( projMesh, galaxies.engine.angle );
  var proj = new galaxies.Projectile( projMesh, galaxies.engine.angle, 0, 0, indestructible );
  galaxies.engine.projectiles.push( proj );
    
  // play animation
  galaxies.engine.characterAnimator.play();
  
  // delay adding the projectile and the sound to synchronize with the animation
  createjs.Tween.get( galaxies.engine.character ).wait(250)
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
    
    var proj = new galaxies.Projectile( projMesh, galaxies.engine.angle, (Math.PI * i) );
    galaxies.engine.projectiles.push( proj );
      
    // delay adding the projectile and the sound to synchronize with the animation
    createjs.Tween.get( galaxies.engine.character ).wait(250)
    .call( galaxies.engine.shootSync, [proj], this );
  }
  // play animation
  galaxies.engine.characterAnimator.play();
  createjs.Tween.get( galaxies.engine.character ).wait(250)
  .call( galaxies.engine.shootSound );

}


// When the correct point in the character animation is reached,
// realign the projectile with the current angle and let it fly.
galaxies.engine.shootSync = function( proj ) {
  
  proj.updatePosition( galaxies.engine.angle );
  proj.addToScene();
}
galaxies.engine.shootSound = function() {
  // play sound
  new galaxies.audio.PositionedSound({
    source: galaxies.audio.getSound('shoot'),
    position: galaxies.utils.rootPosition( galaxies.engine.character ),
    baseVolume: 10,
    loop: false
  });
}


galaxies.engine.shoot3 = function() {
  if ( galaxies.engine.shotTimer>0 ) { return; }
  galaxies.engine.shotTimer = galaxies.engine.SHOOT_TIME;

  
  for ( var i=-1; i<=1; i++ ) {
    // Instantiate shot object
    var projMesh = new THREE.Mesh( galaxies.resources.geometries['proj'], galaxies.resources.materials['proj'] );
    var projScale = 0.1;
    projMesh.scale.set(projScale, projScale, projScale );
    
    var proj = new galaxies.Projectile( projMesh, galaxies.engine.angle, 0, i );
    galaxies.engine.projectiles.push( proj );
      
    // delay adding the projectile and the sound to synchronize with the animation
    createjs.Tween.get( galaxies.engine.character ).wait(250).call( galaxies.engine.shootSync, [proj], this );
  }
  // play animation
  galaxies.engine.characterAnimator.play();
  createjs.Tween.get( galaxies.engine.character ).wait(250)
  .call( galaxies.engine.shootSound );
  
}




galaxies.engine.animate = function() {

  galaxies.engine.animationFrameRequest = requestAnimationFrame( galaxies.engine.animate );
  galaxies.engine.update();

}


// Game Loop
galaxies.engine.update = function() {
  var delta = galaxies.engine.clock.getDelta();
  if ( delta === 0 ) { return; } // paused!
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
      //if ( !obstacles[jObs].falling ) { continue; }
      var obstacleJ = galaxies.engine.obstacles[jObs];
      if ( (obstacleJ.state === 'inactive') || ( obstacleJ.state === 'waiting' )) { continue; }
      
      var dist = obstacleI.object.position.distanceTo( obstacleJ.object.position );
      if ( dist < (obstacleI.hitThreshold + obstacleJ.hitThreshold) ) {
        if ( (obstacleI.state!=='ricocheting') && (obstacleJ.state!=='ricocheting') ) {
          // push overlapping obstacles apart
          var overlap = (obstacleI.hitThreshold + obstacleJ.hitThreshold) - dist;
          
          var shift = obstacleJ.object.position.clone();
          shift.sub( obstacleI.object.position );
          shift.z = 0;
          shift.setLength( overlap/2 );
          // In case of perfectly overlapping objects (as when child obstacles are spawned).
          // We apply CONE_SLOPE here to keep objects cozy with eachother as hit detection is done
          // on the cone, but offset is applied in-plane (where small distances go further).
          if ( shift.length() === 0 ) {
            shift.set( THREE.Math.randFloatSpread(1), THREE.Math.randFloatSpread(1), 0 );
            shift.setLength( galaxies.engine.CONE_SLOPE * overlap/2 );
          }
          
          obstacleI.object.position.sub( shift );
          obstacleJ.object.position.add( shift );
          
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
        obstacleI.hit( proj.object.position, 0, proj.indestructible );
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
        galaxies.engine.ufo.hit( proj.indestructible );
        proj.hit();
      }
    }
  }
  // Neutral objects
  for (var i=0, iLen = galaxies.engine.neutrals.length; i<iLen; i++ ){
    var neutral = galaxies.engine.neutrals[i];
    for (var iProj=0, projLen = galaxies.engine.projectiles.length; iProj<projLen; iProj++ ) {
      var proj = galaxies.engine.projectiles[iProj];
      if ( proj.object.position.distanceTo( neutral.object.position ) < neutral.hitThreshold) {
        neutral.hit();
      //if ( object.isActive && (proj.object.position.distanceTo( obstacleI.object.position ) < galaxies.engine.PROJ_HIT_THRESHOLD ) ) {
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
    galaxies.engine.neutrals.splice( galaxies.engine.inactiveNeutrals[i], 1 );
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
    //galaxies.engine.shoot( true );
    //galaxies.engine.shoot3();
  }
  //
  
  if ( galaxies.engine.powerupTimer > 0 ) {
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
    
    galaxies.engine.characterRotator.rotation.set(0,0,galaxies.engine.angle);
    galaxies.engine.character.material.rotation = galaxies.engine.angle;
    galaxies.engine.characterAnimator.update( delta );
    
    galaxies.engine.clone.material.rotation = Math.PI + galaxies.engine.angle;
    
    
    if ( galaxies.engine.planet.parent === galaxies.engine.rootObject ) {
      galaxies.engine.planet.rotation.z = galaxies.engine.planetAngle-(galaxies.engine.angle/4);
    }
  }
  
  // TIME
  if ( !galaxies.engine.levelComplete ) {
    for(var i=0, len = galaxies.engine.obstacleTypes.length; i<len; i++ ) {
      var type = galaxies.engine.obstacleTypes[i];
      galaxies.engine.spawnTimers[ type ] += delta;
      if ( galaxies.engine.spawnTimers[ type ] >= galaxies.engine.spawnTimes[type] ) {
        galaxies.engine.spawnTimers[ type ] -= galaxies.engine.spawnTimes[type];
        galaxies.engine.addObstacle( type );
        console.log("spawn obstacle");
      }
    }
  }
  galaxies.engine.levelTimer += delta;
  if ( galaxies.engine.levelTimer > galaxies.engine.LEVEL_TIME ) {
    galaxies.engine.levelComplete = true;
  }
  if ( galaxies.engine.levelComplete &&
      (activeObstacleCount === 0) &&
      ((galaxies.engine.ufo.state === 'idle') ||
      (galaxies.engine.ufo.state === 'inactive')) ) {
    galaxies.engine.nextLevel();
  }
  
  
  // AUDIO
  galaxies.audio.soundField.update(delta);
  
  
  galaxies.engine.renderer.render( galaxies.engine.scene, galaxies.engine.camera );
  
  // TEST
  //testUpdate( delta );
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
    createjs.Tween.removeTweens( galaxies.engine.character.position );
    galaxies.engine.gameOver();
    return;
  }
  
  // Hop player sprite to show its been hit
  if ( !createjs.Tween.hasActiveTweens( galaxies.engine.character.position ) ) {
    createjs.Tween.get( galaxies.engine.character.position )
      .to({y:galaxies.engine.PLANET_RADIUS + galaxies.engine.CHARACTER_HEIGHT}, 250, createjs.Ease.quadOut)
      .to({y:galaxies.engine.CHARACTER_POSITION}, 250, createjs.Ease.quadOut);
  }
  
  galaxies.engine.isGracePeriod = true;
  galaxies.engine.character.material.opacity = 0.5;
  createjs.Tween.get( galaxies.engine.character ).wait(2000).call( galaxies.engine.endGracePeriod );
}

galaxies.engine.endGracePeriod = function() {
  galaxies.engine.isGracePeriod = false;
  galaxies.engine.character.material.opacity = 1;
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


galaxies.engine.gameOver = function() {
  galaxies.engine.isGameOver = true;
  galaxies.fx.showPlanetSplode();
  galaxies.fx.shakeCamera(1.5, 2);
  
  
  galaxies.engine.removeInputListeners();
  galaxies.engine.isFiring = false;
  
  for( var i=0, len=galaxies.engine.obstacles.length; i<len; i++ ) {
    galaxies.engine.obstacles[i].retreat();
  }
  
  /*
  for( var i=0, len=obstacles.length; i<len; i++ ) {
    console.log( obstacles[i].state );
  }*/
  
  
  galaxies.engine.ufo.leave();
  
  galaxies.ui.hidePauseButton();
  createjs.Tween.get(null).wait(2000).call( galaxies.ui.showGameOver );
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
  galaxies.engine.rootObject.remove( galaxies.engine.characterRotator );
  
  galaxies.ui.showMenu();
}

galaxies.engine.resetGame = function() {
  galaxies.engine.isGameOver = false;
  
  galaxies.engine.clearLevel();
  
  galaxies.engine.levelNumber = galaxies.engine.START_LEVEL_NUMBER;
  galaxies.engine.score = 0;
  galaxies.engine.powerupCharge = 0;
  galaxies.engine.powerupCount = 0;
  galaxies.engine.playerLife = 3;
  
  galaxies.engine.addInputListeners();
  
  // remove character
  galaxies.engine.characterRotator.remove( galaxies.engine.character );
  // remove planet
  if ( galaxies.engine.planet.parent != null ) {
    galaxies.engine.planet.parent.remove(galaxies.engine.planet);
  }
  galaxies.engine.randomizePlanet();
  
  galaxies.engine.characterAnimator.updateFrame(0);
  
  galaxies.engine.character.rotation.set(0,0,0);
  galaxies.engine.character.material.rotation = galaxies.engine.angle;
  galaxies.engine.character.position.y = galaxies.engine.CHARACTER_POSITION;

  galaxies.engine.camera.position.setZ( galaxies.engine.CAMERA_Z );
  
  galaxies.ui.updateLevel( 1, 1 );
  galaxies.ui.updateLife( galaxies.engine.playerLife );
  galaxies.ui.updateScore( galaxies.engine.score );
  galaxies.ui.updatePowerupCharge( galaxies.engine.powerupCharge );
  galaxies.ui.clearTitle();
  
  
  // Clear transition tweens (mostly used in the planet transition)
  createjs.Tween.removeTweens( galaxies.engine.character );
  createjs.Tween.removeTweens( galaxies.engine.rootObject.rotation );
  createjs.Tween.removeTweens( galaxies.engine.planet.position );
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








galaxies.engine.showCombo = function( value, multiplier, obj ) {
  var vector = new THREE.Vector3();
  
  //obj.updateMatrixWorld();
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
  galaxies.ui.updateScore( galaxies.engine.score );
  
  galaxies.engine.powerupCharge += Math.pow( value/100, 2 ) / galaxies.engine.POWERUP_CHARGED; // The 100 is to reduce scores from 100, 250, 500 to 1, 2.5, 5
  if ( galaxies.engine.powerupCharge >= 1 ) {
    console.log("powerup charged", galaxies.engine.powerupCapsule );
    galaxies.engine.powerupCharge = 0;
    if (galaxies.engine.powerupCapsule == null ) {
      console.log("spawn capsule");
      
      var range = Math.min( galaxies.engine.powerupCount, galaxies.engine.powerups.length-1 );
      var type = galaxies.engine.powerups[ Math.round(Math.random()*range) ];
      
      galaxies.engine.powerupCapsule = new galaxies.Capsule( type );
      
      
      
    }
  }
  galaxies.ui.updatePowerupCharge( galaxies.engine.powerupCharge );
  
  
  // Check if powerup is fully charged
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
  galaxies.engine.characterRotator.remove( galaxies.engine.clone );
  galaxies.engine.powerupTimer = galaxies.engine.POWERUP_DURATION;
  
  switch(newPowerup) {
    case 'spread':
      galaxies.engine.shootFunction = galaxies.engine.shoot3;
      break;
    case 'clone':
      galaxies.engine.characterRotator.add( galaxies.engine.clone );
      galaxies.engine.shootFunction = galaxies.engine.shoot2;
      break;
    case 'golden':
      galaxies.engine.shootFunction = function() { galaxies.engine.shoot(true); };
      break;
    default:
      galaxies.engine.shootFunction = galaxies.engine.shoot;
      break;
  }
  
}



/*
// Debug function to start game at an arbitrary level
function manualRestart() {
  var debugFormElement = document.getElementById("debugForm");
  var newLevelNumber = parseInt( debugFormElement.querySelector("input[name='startLevel']").value );
  if ( isNaN(newLevelNumber) ) {
    newLevelNumber = 1;
  }
  
  galaxies.engine.START_LEVEL_NUMBER = newLevelNumber;
  
  gameOver();
}

*/

"use strict";

this.galaxies = this.galaxies || {};

galaxies.fx = (function() {
  var CHARACTER_FLY_SPEED = 5;
  var CHARACTER_TUMBLE_SPEED = 3;
  

  var rubbleMaterial = new THREE.MeshLambertMaterial( {
    color: 0x847360,
    opacity: 1.0,
    transparent: true } );
  
  var Rubble = function( geometry, material, scale ) {
    
    this.object = new THREE.Mesh( geometry, material.clone());
    scale = scale * ( Math.random() + 0.5 );
    this.object.scale.set( scale, scale, scale );
    this.object.rotation.set( THREE.Math.randFloatSpread(galaxies.utils.PI_2), THREE.Math.randFloatSpread(galaxies.utils.PI_2), THREE.Math.randFloatSpread(galaxies.utils.PI_2) );
    this.velocity = new THREE.Vector3(0,0,0);
    this.rotationAxis = new THREE.Vector3( Math.random()-0.5, Math.random()-0.5, Math.random()-0.5 );
    this.rotationAxis.normalize();
    this.rotationSpeed = (Math.random() - 0.5) * 10;
    this.active = false;
    
    this.lifetime = 2;
    this.lifeTimer = 0;
  }
  Rubble.prototype.update = function(delta) {
    if ( !this.active) { return; }
    this.object.rotateOnAxis( this.rotationAxis, this.rotationSpeed * delta );
    this.object.position.set( this.object.position.x + this.velocity.x*delta,
                              this.object.position.y + this.velocity.y*delta,
                              this.object.position.z + this.velocity.z*delta );
    
    this.object.material.opacity = (this.lifetime - this.lifeTimer)/this.lifetime;
    this.lifeTimer += delta;
    if ( this.lifeTimer >= this.lifetime ) {
      this.active = false;
      galaxies.engine.rootObject.remove( this.object );
    }
  }
  Rubble.prototype.reset = function() {
    this.lifeTimer = 0;
    this.active = true;
    this.lifetime = 2;
    galaxies.engine.rootObject.add( this.object );
  }
  
  // projectile hit particles
  var emitterSettings = {
    type: 'cube',
    positionSpread: new THREE.Vector3(0.1, 0.1, 0.1),
    //radius: 0.1,
    velocity: new THREE.Vector3(0, 0, 7),
    velocitySpread: new THREE.Vector3(3, 3, 10),
    //speed: 1,
    sizeStart: 0.2,
    sizeStartSpread: 0.1,
    sizeEnd: 0.15,
    opacityStart: 1,
    opacityEnd: 0,
    colorStart: new THREE.Color("hsl(0, 0%, 70%)"),
    //colorStartSpread: new THREE.Vector3(255, 0, 0),
    colorEnd: new THREE.Color("hsl(0, 0%, 70%)"),
    particleCount: 40,
    alive: 0,
    duration: 0.05
  };
  
  // Simple array for pooling proj hit effect. We cannot use the particle
  // engine's pooling system because that works at the emitter level. We need
  // to set the orientation of each emitter, so we must work at the group level.
  var projHitPool = [];
  var projHitIndex = 0;
  var projHitPoolSize = 3;
  
  // Rubble objects for asteroid destruction
  var rubblePool = [];
  var rubbleIndex = 0;
  var rubbleSetSize = 8; // How many pieces to use for each exploding roid
  var rubblePoolSize = 24;
  
  // Debris objects for satellite destruction
  var debrisPool = [];
  var debrisIndex = 0;
  var debrisSetSize = 8;
  var debrisPoolSize = 16;
  
  var planetRubbleHolder;
  var planetParticleGroups = [];
  
  // Firework particle group for exploding comets
  var FIREWORKS_DECELERATION = 15;
  var fireworksGroup;
  
  var teleportEmitter, teleportGroup;
  var teleportSprite, teleportAnimator;
  var TELEPORT_TIME_MS = 1500;
  var TELEPORT_TIME_HALF_MS = TELEPORT_TIME_MS/2;
  var teleporting = false;
  
  var init = function() {
    
    // Projectile hit particles
    var texture = new THREE.Texture( galaxies.queue.getResult('projhitparticle') );
    texture.needsUpdate = true;
    for (var i=0; i<projHitPoolSize; i++ ) {
      var particleGroup = new SPE.Group({
        texture: texture,
        maxAge: 0.5,
        blending: THREE.NormalBlending//THREE.AdditiveBlending
      });
      projHitPool[i] = particleGroup;
      galaxies.engine.rootObject.add( particleGroup.mesh );
      
      particleGroup.addPool( 1, emitterSettings, false );
    }
    
    // Rubble objects
    for (var i=0; i<rubblePoolSize; i++ ) {
      var rubbleObject = new Rubble( galaxies.resources.geometries['asteroid'], rubbleMaterial, 0.1 );
      rubblePool[i] = rubbleObject;
    }
    
    // Debris objects
    for (var i=0; i<debrisPoolSize; i++ ) {
      var debrisObject = new Rubble( galaxies.resources.geometries['debris'], galaxies.resources.materials['debris'], 0.2 );
      debrisPool[i] = debrisObject;
    }
    
    // Comet explode particles
    var cometParticleSettings = {
        type: 'sphere',
        radius: 0.6,
        acceleration: new THREE.Vector3(0,0,-FIREWORKS_DECELERATION),//THREE.Vector3(0,-40,0),
        speed: 5,
        speedSpread: 3,
        sizeStart: 2,
        sizeStartSpread: 1,
        sizeEnd: 1,
        opacityStart: 1,
        opacityEnd: 0.5,
        colorStart: new THREE.Color("rgb(255, 150, 100)"),
        colorStartSpread: new THREE.Vector3(0.5, 0.7, 1),
        colorEnd: new THREE.Color("rgb(0, 0, 0)"),
        particlesPerSecond: 1000,
        particleCount: 200,
        alive: 1.0,
        duration: 0.1
    };
      
    var starTexture = new THREE.Texture( galaxies.queue.getResult('starparticle') );
    starTexture.needsUpdate = true;
    fireworksGroup = new SPE.Group({
      texture: starTexture,
      maxAge: 1.5,
      blending: THREE.AdditiveBlending
    });
    fireworksGroup.addPool( 3, cometParticleSettings, true );
    
    //fireworksGroup.mesh.rotation.x = Math.PI/2;
    galaxies.engine.rootObject.add ( fireworksGroup.mesh );
  
    // Planet splode
    planetRubbleHolder = new THREE.Object3D();
    planetRubbleHolder.scale.set(3,3,3);
    galaxies.engine.rootObject.add( planetRubbleHolder );
    
    // Planet particle systems
    var partsDust = {
      type: 'sphere',
      radius: 0.1,
      speed: 12,
      speedSpread: 10,
      sizeStart: 0.6,
      sizeStartSpread: 0.2,
      sizeEnd: 0.6,
      opacityStart: 0.5,
      opacityStartSpread: 0.8,
      opacityEnd: 0,
      colorStart: new THREE.Color(0.500, 0.500, 0.500),
      colorStartSpread: new THREE.Vector3(0.4, 0.4, 0.4),
      particlesPerSecond: 10000,
      particleCount: 1000,
      alive: 0,
      duration: 0.1
    };
    
    var groupDust = new SPE.Group({
      texture: texture,
      maxAge: 2,
      blending: THREE.NormalBlending
    });
    
    groupDust.addEmitter( new SPE.Emitter( partsDust ) );
    groupDust.mesh.position.set( 0,0,1 );
    planetParticleGroups.push(groupDust);
    
    var partsFire = {
      type: 'sphere',
      radius: 0.1,
      acceleration: new THREE.Vector3(0,0,-40),
      speed: 10,
      speedSpread: 6,
      sizeStart: 8,
      sizeStartSpread: 6,
      sizeEnd: 6,
      opacityStart: 0.5,
      opacityStartSpread: 0.8,
      opacityEnd: 0,
      colorStart: new THREE.Color(0.800, 0.400, 0.100),
      colorStartSpread: new THREE.Vector3(0.1, 0.2, 0.4),
      colorEnd: new THREE.Color(0.5, 0.000, 0.000),
      particlesPerSecond: 2000,
      particleCount: 200,
      alive: 0,
      duration: 0.1
    };
    
    var groupFire = new SPE.Group({
      texture: texture,
      maxAge: 1.5,
      blending: THREE.AdditiveBlending
    });
    
    groupFire.addEmitter( new SPE.Emitter( partsFire ) );
    groupFire.mesh.position.set( 0,0,0.1 );
    planetParticleGroups.push(groupFire);

    
    // teleport
    var characterMap = new THREE.Texture( galaxies.queue.getResult('lux') );
    teleportAnimator = new galaxies.SpriteSheet(
      characterMap,
      [ [176,680,172,224,0,4,81.35],
        [350,680,172,224,0,4,81.35],
        [524,680,172,224,0,4,81.35],
        [698,680,172,224,0,4,81.35]    
        ], 
      30
      );
    characterMap.needsUpdate = true;
    
    var characterMaterial = new THREE.SpriteMaterial({
      map: characterMap,
      color: 0xffffff,
      transparent: true,
      opacity: 0.0
    } );
    teleportSprite = new THREE.Sprite( characterMaterial );
    teleportSprite.position.z = 0.1; // must appear in front of base character sprite
    
    /*
    var teleportParticles = {
      type: 'sphere',
      radius: 0.6,
      speed: 1,
      sizeStart: 1,
      sizeStartSpread: 0,
      sizeEnd: 1,
      opacityStart: 1,
      opacityEnd: 0,
      colorStart: new THREE.Color(1.000, 0.800, 0.300),
      colorStartSpread: new THREE.Vector3(0.1, 0.1, 0.1),
      colorEnd: new THREE.Color(0.500, 0.500, 0.800),
      particlesPerSecond: 100,
      particleCount: 100,
      alive: 0.0,
      duration: 0.25
    };
    teleportGroup = new SPE.Group({
      texture: starTexture,
      maxAge: 0.5,
      blending: THREE.AdditiveBlending
    });
    teleportEmitter = new SPE.Emitter( teleportParticles );
    teleportGroup.addEmitter( teleportEmitter );
    */
  } // init
  
  var showFireworks = function( position ) {
    // Reproduces functionality of ShaderParticleGroup triggerPoolEmitter method.
    // This is necessary to access properties of the emitter that is being activated.
    var emitter = fireworksGroup.getFromPool();

    if ( emitter === null ) {
        console.log( 'SPE.Group pool ran out.' );
        return;
    }

    if ( position instanceof THREE.Vector3 ) {
        emitter._position.copy( position );
    }

    // Update emitter properties to fake drag
    var away = new THREE.Vector3();
    away.subVectors( position, galaxies.engine.camera.position);
    away.normalize();
    away.multiplyScalar( FIREWORKS_DECELERATION );
    emitter.acceleration = away;
    //
    
    emitter.enable();

    setTimeout( function() {
        emitter.disable();
        fireworksGroup.releaseIntoPool( emitter );
    }, fireworksGroup.maxAgeMilliseconds );

  }
  
  var showHit = function( position ) {
    //console.log("fx show hit at position", position );
    
    var particleGroup = projHitPool[ projHitIndex ];
    projHitIndex ++;
    if ( projHitIndex >= projHitPoolSize ) { projHitIndex = 0; }
    
    particleGroup.mesh.position.copy( position );
    particleGroup.mesh.lookAt( galaxies.engine.rootObject.position );
    particleGroup.triggerPoolEmitter(1);

  }
  
  var showRubble = function( position, velocity ) {
    rubbleIndex = showObjects( rubblePool, rubbleSetSize, rubbleIndex, position, velocity );
  }
  
  var showDebris = function( position, velocity ) {
    debrisIndex = showObjects( debrisPool, debrisSetSize, debrisIndex, position, velocity );
  }
  var showObjects = function( set, setSize, index, position, velocity ) {
    var poolSize = set.length;
    for ( var i=0; i<setSize; i++ ) {
      var rObject = set[index];
      rObject.object.position.copy( position );
      rObject.object.position.add( new THREE.Vector3( THREE.Math.randFloatSpread(0.5), THREE.Math.randFloatSpread(0.5), THREE.Math.randFloatSpread(0.5) ) );
      galaxies.engine.rootObject.add( rObject.object );
      
      //console.log( rObject.velocity, rObject.object.position, position );
      rObject.velocity.subVectors( rObject.object.position, position );
      rObject.velocity.normalize();
      rObject.velocity.add( velocity );
      
      rObject.reset();
      
      index++;
      if ( index >= poolSize ) { index = 0; }
    }
    return index;
  }
  
  var showPlanetSplode = function() {
    // hide planet
    galaxies.engine.rootObject.remove( galaxies.engine.planet );
    
    // rubble
    for ( var i=0; i<rubblePoolSize; i++ ) {
      var rObject = rubblePool[i];
      rObject.object.position.set( THREE.Math.randFloatSpread(0.5), THREE.Math.randFloatSpread(0.5), THREE.Math.randFloatSpread(0.5) );
      
      rObject.velocity.copy( rObject.object.position );
      rObject.velocity.normalize();
      rObject.velocity.multiplyScalar(2);
      
      rObject.reset();
      rObject.lifetime = 6; // increase life for this effect
      planetRubbleHolder.add( rObject.object ); // move object to special holder that scales up the rubble
      
    }
    
    // particles
    for ( var i=0; i<planetParticleGroups.length; i++ ) {
      var group = planetParticleGroups[i];
      galaxies.engine.rootObject.add( group.mesh );
      
      var emitter = planetParticleGroups[i].emitters[0]; // Only one per group.
      emitter.alive = 1;
      emitter.enable();
      
      // closure to hold references to the groups and emitters
      (function() {
        var emitterRef = emitter;
        var groupRef = group;
        setTimeout( function() {
          emitterRef.disable();
          galaxies.engine.rootObject.remove( groupRef.mesh );
        }, groupRef.maxAgeMilliseconds );
      })();
    }
    
    // pose lux
    galaxies.engine.characterAnimator.updateFrame(10);
    
    // play the sound
    new galaxies.audio.PositionedSound({
      source: galaxies.audio.getSound('planetsplode'),
      position: galaxies.engine.rootObject.position,
      baseVolume: 16,
      loop: false
    });
    
  }
  
  var showTeleportOut = function() {
    galaxies.engine.character.add( teleportSprite );
    teleportSprite.material.rotation = galaxies.engine.character.material.rotation;
    teleportSprite.material.opacity = 0;
    teleportAnimator.play(-1); // negative loop count will loop indefinitely
    
    // fade in and out
    createjs.Tween.removeTweens( teleportSprite.material );
    createjs.Tween.get( teleportSprite.material )
      .to( { opacity: 1 }, TELEPORT_TIME_HALF_MS )
      .set( { opacity: 0 }, galaxies.engine.character.material )
      .to( { opacity: 0 }, TELEPORT_TIME_HALF_MS )
      .call( teleportEffectComplete, this );
    
    teleporting = true;

  }
  var teleportEffectComplete = function() {
    teleportAnimator.stop();
    teleportSprite.parent.remove(teleportSprite);
    teleporting = false;
    
  }
  var showTeleportIn = function( callback ) {
    // Set character to vertical position (this will work because user cannot move during transition).
    galaxies.engine.angle = 0;
    galaxies.engine.targetAngle = 0;
    
    galaxies.engine.character.add( teleportSprite );
    teleportSprite.material.rotation = galaxies.engine.character.material.rotation;
    teleportSprite.material.opacity = 0;
    teleportAnimator.play(-1); // negative loop count will loop indefinitely
    galaxies.engine.character.material.opacity = 0;
    
    // fade in and out
    createjs.Tween.removeTweens( teleportSprite.material );
    createjs.Tween.get( teleportSprite.material )
      .to( { opacity: 1 }, TELEPORT_TIME_HALF_MS )
      .set( { opacity: 1 }, galaxies.engine.character.material )
      .to( { opacity: 0 }, TELEPORT_TIME_HALF_MS )
      .call( teleportEffectComplete, this )
      .call( callback, this );
      
    teleporting = true;
      
  }
  
  
  
  var update = function( delta ) {
    for ( var i=0; i<projHitPoolSize; i++ ) {
      projHitPool[i].tick( delta );
    }
    for ( var i=0; i<rubblePoolSize; i++ ) {
      rubblePool[i].update(delta);
    }
    for ( var i=0; i<debrisPoolSize; i++ ) {
      debrisPool[i].update(delta);
    }
    fireworksGroup.tick(delta);
    
    for ( var i=0; i<planetParticleGroups.length; i++ ) {
      planetParticleGroups[i].tick(delta);
    }
    
    // lux flying away
    if (galaxies.engine.isGameOver) {
      galaxies.engine.character.position.y = galaxies.engine.character.position.y + CHARACTER_FLY_SPEED * delta;
      galaxies.engine.character.rotation.z = galaxies.engine.character.rotation.z + CHARACTER_TUMBLE_SPEED * delta;
      galaxies.engine.character.material.rotation = galaxies.engine.character.rotation.z;
    }
    
    if ( teleporting ) {
      teleportAnimator.update( delta );
      teleportSprite.material.rotation = galaxies.engine.character.material.rotation;
    }
    // teleport particles
    // TODO only update these when active
    // teleportGroup.tick(delta );
  }
  
  var shakeCamera = function( magnitude, duration ) {
    // Make sure camera is reset before applying shake tween
    galaxies.engine.camera.rotation.x = 0; 
    galaxies.engine.camera.rotation.y = 0;
    
    if ( typeof(duration)==='undefined' ) {
      duration = 500;
    } else {
      duration = duration*1000;
    }
    
    magnitude = 0.01 * magnitude;
    
    // Frequency is dependent on duration because easing function uses a normalized 0-1 value, not
    // an elapsed time value. This keeps shake the same no matter the duration.
    var freqX = duration/17;
    var freqY = duration/18;
    
    createjs.Tween.get(galaxies.engine.camera.rotation)
      .to({x:magnitude, override:true }, duration, galaxies.utils.getShakeEase(freqX) )
      .to( {x:0}, 0); // reset position
    createjs.Tween.get(galaxies.engine.camera.rotation)
      .to({y:magnitude, override:true }, duration, galaxies.utils.getShakeEase(freqY) )
      .to( {y:0}, 0); // reset position
    //createjs.Tween.get(camera.rotation).to({x:0}, 1000, createjs.Ease.quadOut );
  }
            
  return {
    init: init,
    update: update,
    showHit: showHit,
    showFireworks: showFireworks,
    showRubble: showRubble,
    showPlanetSplode: showPlanetSplode,
    showTeleportOut: showTeleportOut,
    showTeleportIn: showTeleportIn,
    shakeCamera: shakeCamera,
    showDebris: showDebris
  };
})();
'use strict';
/**
 * Asset load and cache system.
 *
 * Uses Preload.js to load image, audio, and obj assets. Chooses audio extension based on
 * browser sniff.
 * 
 */

this.galaxies = this.galaxies || {};

this.galaxies.loadAssets = function( progressCallback, completeCallback, errorCallback ) {
  var assetManifest = [];
  
  // Set audio extension
  var ext;
  if ( galaxies.utils.supportsEC3 ) { ext = '.mp4'; }
  else if ( galaxies.utils.supportsOGG ) { ext='.ogg'; }
  else { ext = '.m4a'; }
  
  //ext = '.foo'; // TEST, prevents any audio files from loading
  
  console.log("Audio extension selected:", ext );
  
  // Add audio files
  // Note that audio files are added as binary data because they will need to be decoded by the web audio context object.
  // The context object will not be created until after preload is complete, so the binary data will simply be cached
  // by the preloader as binary data and handled later in the initialization.
  var audioItems = [
    { id: 'shoot1', src: 'shuttlecock_release_01', type: createjs.AbstractLoader.BINARY },
    { id: 'shoot2', src: 'shuttlecock_release_02', type: createjs.AbstractLoader.BINARY },
    { id: 'shoot3', src: 'shuttlecock_release_03', type: createjs.AbstractLoader.BINARY },
    { id: 'shoot4', src: 'shuttlecock_release_04', type: createjs.AbstractLoader.BINARY },
    { id: 'shoot5', src: 'shuttlecock_release_05', type: createjs.AbstractLoader.BINARY },
    { id: 'asteroidsplode1', src: 'asteroid_explode_01', type: createjs.AbstractLoader.BINARY },
    { id: 'asteroidsplode2', src: 'asteroid_explode_02', type: createjs.AbstractLoader.BINARY },
    { id: 'asteroidsplode3', src: 'asteroid_explode_03', type: createjs.AbstractLoader.BINARY },
    { id: 'cometexplode', src: 'comet_explode_01', type: createjs.AbstractLoader.BINARY },
    { id: 'cometloop', src: 'comet_fire_loop', type: createjs.AbstractLoader.BINARY },
    { id: 'fpo1', src: 'UFO_laser_fire', type: createjs.AbstractLoader.BINARY },
    { id: 'ufo', src: 'ufo_engine_loop', type: createjs.AbstractLoader.BINARY },
    { id: 'music', src: 'music_5_1_loop', type: createjs.AbstractLoader.BINARY },
    { id: 'ufohit1', src: 'ufo_hit_01', type: createjs.AbstractLoader.BINARY },
    { id: 'ufohit2', src: 'ufo_hit_02', type: createjs.AbstractLoader.BINARY },
    { id: 'ufoshoot', src: 'UFO_laser_fire', type: createjs.AbstractLoader.BINARY },
    { id: 'planetsplode', src: 'planet_explode', type: createjs.AbstractLoader.BINARY },
    { id: 'teleportin', src: 'teleport_gliss_up_effect', type: createjs.AbstractLoader.BINARY },
    { id: 'teleportout', src: 'teleport_gliss_down_effect', type: createjs.AbstractLoader.BINARY },
    { id: 'metalhit1', src: 'metal_hit1', type: createjs.AbstractLoader.BINARY },
    { id: 'metalhit2', src: 'metal_hit2', type: createjs.AbstractLoader.BINARY },
    { id: 'metalhit3', src: 'metal_hit3', type: createjs.AbstractLoader.BINARY },
    { id: 'titlewoosh', src:'whoosh', type: createjs.AbstractLoader.BINARY },
    { id: 'satellitesplode', src:'pod_explode', type: createjs.AbstractLoader.BINARY },
    { id: 'asteroidhit1', src:'asteroid_debris_01', type: createjs.AbstractLoader.BINARY },
    { id: 'asteroidhit2', src:'asteroid_debris_02', type: createjs.AbstractLoader.BINARY },
    { id: 'asteroidhit3', src:'asteroid_debris_03', type: createjs.AbstractLoader.BINARY },
    { id: 'asteroidhit4', src:'asteroid_debris_04', type: createjs.AbstractLoader.BINARY },
    { id: 'trunkfordlaugh1', src:'trunkford_laugh_01', type: createjs.AbstractLoader.BINARY },
    { id: 'trunkfordlaugh2', src:'trunkford_laugh_02', type: createjs.AbstractLoader.BINARY },
    { id: 'trunkfordlaugh3', src:'trunkford_laugh_03', type: createjs.AbstractLoader.BINARY },
    { id: 'trunkfordlaugh4', src:'trunkford_laugh_04', type: createjs.AbstractLoader.BINARY },
    { id: 'buttonover', src:'button_rollover', type: createjs.AbstractLoader.BINARY }
    
    
    
    
  ];
  for (var i=0; i< audioItems.length; i++ ) {
    audioItems[i].src = 'audio/' + audioItems[i].src + ext;
  }
  assetManifest = assetManifest.concat(audioItems);
  
  // add texture images
  var imageItems = [
    { id: 'skyboxright1', src: 'spacesky_right1.jpg' },
    { id: 'skyboxleft2', src: 'spacesky_left2.jpg' },
    { id: 'skyboxtop3', src: 'spacesky_top3.jpg' },
    { id: 'skyboxbottom4', src: 'spacesky_bottom4.jpg' },
    { id: 'skyboxfront5', src: 'spacesky_front5.jpg' },
    { id: 'skyboxback6', src: 'spacesky_back6.jpg' },
    { id: 'lux', src: 'lux.png' },
    { id: 'trunkford', src: 'trunkford.png' },
    { id: 'projhitparticle', src: 'hit_sprite.png' },
    { id: 'asteroidcolor', src:'asteroid_color.jpg' },
    { id: 'asteroidnormal', src:'asteroid_normal.jpg' },
    { id: 'satellitecolor', src:'mercury_pod_color.jpg' },
    { id: 'starparticle', src: 'star.png' },
    { id: 'moonocclusion', src: 'moon_lores_occlusion.jpg' },
    { id: 'moonnormal', src: 'moon_lores_normal.jpg' },
    { id: 'laserbeam', src: 'laser_rippled_128x512.png' },
    { id: 'ufocolor', src: 'ufo_col.jpg' },
    { id: 'projcolor', src: 'shuttlecock_col.jpg' },
    { id: 'title5', src: 'logo_feisty_galaxies.png' },
    { id: 'title1', src: 'title_01_luxurious_animals.png' },
    { id: 'title2', src: 'title_02_luxamillion.png' },
    { id: 'title3', src: 'title_03_dolby.png' },
    { id: 'title4', src: 'title_04_trunkford.png' },
    { id: 'titleExtraLux', src: 'title_luxamillion_planet.png' },
    { id: 'titleExtraTrunkford', src: 'title_trunkford_in_ufo.png' }
    
    
  ];
  for (var i=0; i<imageItems.length; i++ ) {
    imageItems[i].src = 'images/' + imageItems[i].src;
  }
  assetManifest = assetManifest.concat(imageItems);
  
  // add models
  assetManifest.push(
    //{ id: 'ufomodel', src: 'models/ufo.obj', type: createjs.AbstractLoader.TEXT },
    { id: 'ufomodel', src: 'models/ufo_test.obj', type: createjs.AbstractLoader.TEXT },
    { id: 'asteroidmodel', src: 'models/asteroid01.obj', type: createjs.AbstractLoader.TEXT },
    { id: 'projmodel', src: 'models/shuttlecock.obj', type: createjs.AbstractLoader.TEXT },
    { id: 'satellitemodel', src: 'models/mercury_pod.obj', type: createjs.AbstractLoader.TEXT },
    { id: 'moonmodel', src: 'models/moon_lores.obj', type: createjs.AbstractLoader.TEXT },
    { id: 'satellitedebrismodel', src: 'models/pod_chunk.obj', type: createjs.AbstractLoader.TEXT }
    
  );
  
  
  var handleComplete = function() {
    console.log( "Asset load complete.");
    if ( completeCallback ) {
      completeCallback();
    }
  }
  var handleProgress = function( e ) {
    if ( progressCallback ) {
      progressCallback( e );
    }
  }
  var handleError = function( e ) {
    console.log("Error loading asset.", e);
    if ( errorCallback ) {
      errorCallback( e );
    }
  }
      
  
  // Create and activate the loader
  galaxies.queue = new createjs.LoadQueue(true);
  galaxies.queue.on("complete", handleComplete );
  galaxies.queue.on("error", handleError );
  galaxies.queue.on("progress", handleProgress );
  galaxies.queue.loadManifest( assetManifest );
}          

"use strict";

this.galaxies = this.galaxies || {};
galaxies.utils = galaxies.utils|| {};

galaxies.words = {};
galaxies.words['verb'] = [
'Defend',
'Save',
'Protect',
'Secure',
'Safeguard',
'Preserve',
'Guard'
];
galaxies.words['adjective'] = [
'UnInhabitable',
'Mysterious',
'Forbidden',
'Foreboding',
'Cosmic',
'Planetary',
'Barren',
'Galactic',
'Volatile',
'Wonderous',
'Interstellar',
'Celestial',
'Secretive',
'Secluded',
'Extraterrestrial',
'Rogue',
'Gaseous',
'Orbitable',
'Alien',
'Lonely',
'Radioactive'
];
galaxies.words['size'] = [
'Dwarf',
'Miniature',
'Diminutive',
'Compact',
'Petite',
'Small',
'Itty-Bitty',
'Lil\'',
'Tiny'
];
galaxies.words['noun'] = [
'Planetoid',
'Moon',
'Exoplanet',
'Pulsar',
'World',
'Orb',
'Sphere',
'Moon Base',
'Space Outpost',
'Battlestar',
'Lunar',
'Planet'
];
galaxies.words['greek'] = [
'Alpha',
'Beta',
'Gamma',
'Delta',
'Epsilon',
'Zeta',
'Theta',
'Sigma',
'Omega',
'Kappa',
'Zeta',
'Centurion',
'Echo'
];

galaxies.utils.generatePlanetName = function( planetNumber ) {
  var name = 
    galaxies.utils.selectRandomElement( galaxies.words['verb'] ) +
    " the " +
    //galaxies.utils.selectRandomElement( galaxies.words['adjective'] ) +
    //"<br>" +
    galaxies.utils.selectRandomElement( galaxies.words['size'] ) +
    "<br>" +
    galaxies.utils.selectRandomElement( galaxies.words['noun'] ) +
    " " +
    galaxies.utils.selectRandomElement( galaxies.words['greek'] ) +
    " " +
    galaxies.utils.selectRandomElement( galaxies.words['greek'] ) +
    " " +
    planetNumber;
    
  // TEST
  // longest name!
  //name = "Safeguard the Itty-Bitty<br>Space Outpost Centurion Centurion 10";
  
  name = name.toUpperCase();
    
  return name;
}

galaxies.utils.selectRandomElement = function( items ) {
  
  return items[ Math.floor( Math.random() * items.length ) ];
}
"use strict";
/**
 * Obstacle: the object responsible for asteroids, satellites (pods),
 * and comets.
 *
 */

this.galaxies = this.galaxies || {};


galaxies.Obstacle = function ( props ) {

  this.type = props.type;
  
  var PLANET_DISTANCE = 1.25;
  var RICOCHET_SPEED = 0.35;
  this.hitThreshold = 0.7;
  if ( typeof(props.hitThreshold) === 'number' ) { this.hitThreshold = props.hitThreshold; }
  
  this.particleGroup = props.particleGroup;
  this.points = props.points;
  this.explodeType = props.explodeType;
  
  var angle = 0;
  
  var tumble = props.tumble;
  var tumbling = tumble;
  var tumbleAxis = new THREE.Vector3();
  var tumbleOnHit = props.tumbleOnHit;
  var baseTumbleSpeed = 1.5;
  var tumbleSpeed = baseTumbleSpeed;
  
  var baseSpeed = props.speed;
  var velocity = new THREE.Vector3();
  
  var fallSpeed = 8;
  var fallTimer = 0;
  var fallTime = 0;
  var spiralTime = props.spiral * 60 + 1;
  
  this.ricochetCount = 1;
  
  if ( typeof(props.life)!=='number' ) { props.life = 2; }
  this.baseLife = props.life;
  this.life = props.life;
  
  // state values: waiting, falling, ricocheting, inactive
  this.state = 'waiting';
  this.isActive = false; // will the object accept interactions
  
  this.object = props.anchor;
  this.object.up.set(0,0,1);
  
  this.orient = props.orient;
  this.model = props.model;
  
  // Iterate through provided model object to find the actual mesh and its material.
  // Only the first mesh/material is used.
  var material = null;
  var childrens = [];
  childrens.push(this.model);
  while ( childrens.length > 0 ) {
    var child = childrens.shift();
    if ( child==null ) { continue; }
    
    if ( child.material != null ) {
      material = child.material;
      break;
    }
    
    for ( var i=0, len = child.children.length; i<len; i++ ) {
      childrens.push( child.children[i] );
    }
  };
  //
  
  this.spawnType = props.spawnType;
  this.spawnNumber = props.spawnNumber;
  
  //var axisHelper = new THREE.AxisHelper( 2 );
  //this.object.add( axisHelper );  
  
  // Sound
  var hitSound = props.hitSound;
  var explodeSound = props.explodeSound;
  this.passSound = null;
  if ( props.passSound != null ) {
    //console.log(_passSoundId);
    this.passSound = new galaxies.audio.ObjectSound( galaxies.audio.getSound( props.passSound), this.object, 0, true );
    //directionalSources.push(passSound);
  }
  if ( typeof( props.explosionGain ) !=='number' ) { props.explosionGain = 2; }
  var explosionGain = props.explosionGain;
  
  var clearDistance = galaxies.engine.OBSTACLE_VISIBLE_RADIUS * 1.0;//1.2;
  var startDistance = galaxies.engine.OBSTACLE_VISIBLE_RADIUS * 1.1;//1.2;
/*  if (this.passSound != null ) {
    startDistance = galaxies.engine.OBSTACLE_VISIBLE_RADIUS * 2;
  }*/

  
  
  
  
  
  
  
  
  
  
  
  
  this.reset = function() {
    angle = Math.random()*Math.PI*2;
    var position = new THREE.Vector3( Math.cos(angle), Math.sin(angle), 0 );
    
    position.multiplyScalar( startDistance );
    this.object.position.copy(position);
    this.object.lookAt( new THREE.Vector3() );
    
    if ( material !== null) {
      material.transparent = false;
    }
    
    this.life = this.baseLife;
    
    this.state = 'waiting';
    this.isActive = false;
    //fallTime = Math.random() * 3; // random delay to make obstacles arrive less uniformly
    fallTime = 0;
    fallTimer = 0;
    velocity.set(0,0,0);

    this.speed = baseSpeed * galaxies.engine.speedScale;
    
    tumbleAxis.set( Math.random()*2-1, Math.random()*2 -1, Math.random()*2 -1 );
    tumbleAxis.normalize();
    tumbling = tumble;
    tumbleSpeed = baseTumbleSpeed;
    
    //this.ricochet = false;
  }
    
  this.update = function( delta ) {
    switch ( this.state ) {
    case 'retreating':
      this.object.position.add( velocity.clone().multiplyScalar(delta) );
      break;
    case 'ricocheting':
      this.object.position.add( velocity.clone().multiplyScalar(delta) );
      
      // Prevent ricochets from traveling all the way out, so
      // the player cannot score points off-screen
      var radius = galaxies.utils.flatLength( this.object.position );
      if ( radius > clearDistance ) { this.deactivate(); }
      if ( this.isActive && (radius > galaxies.engine.OBSTACLE_VISIBLE_RADIUS ) ) {
        this.isActive = false;
        if ( material!=null ) {
          material.transparent = true;
        }
      }
      break;
    case 'falling':
      // fall motion
      var targetAngle = Math.atan2( -this.object.position.y, -this.object.position.x );
      angle = targetAngle - (Math.PI/2);
      //while ( targetAngle<angle) { targetAngle += (Math.PI * 2); }
      
      // Time-based spiral
      fallTimer+=delta;
      fallTimer = THREE.Math.clamp( fallTimer, 0, spiralTime);
      var fallAngle = THREE.Math.mapLinear(fallTimer, 0, spiralTime, angle, targetAngle );
      
      /*
      // Distance-based spiral
      var distance = this.object.position.length();
      distance = THREE.Math.clamp( distance, 0, radius );
      //var fallAngle = THREE.Math.mapLinear( radius-distance, 0, radius, angle, targetAngle );
      var fallAngle = angle;
      */
      
//      angle = angle + ( targetAngle - angle )*delta;
      
      velocity.set( Math.cos(fallAngle), Math.sin(fallAngle), 0 );
      velocity.multiplyScalar( this.speed * delta );
      
      var radius = galaxies.utils.flatLength( this.object.position );
      if (( radius <= PLANET_DISTANCE ) && (velocity.length() < PLANET_DISTANCE) ) {
        // This order is very important as hitPlayer may trigger game over which
        // must override the obstacle's state.
        this.splode();
        galaxies.engine.hitPlayer();
        break;
      }
      if ( radius < galaxies.engine.OBSTACLE_VISIBLE_RADIUS ) { this.isActive = true; }
      this.object.position.add( velocity );
      
      /*
      // clamp vertical position
      if ( this.object.position.y < -OBSTACLE_START_RADIUS ) { this.object.position.setY( -OBSTACLE_START_RADIUS ); }
      if ( this.object.position.y > OBSTACLE_START_RADIUS ) { this.object.position.setY( OBSTACLE_START_RADIUS ); }
      */
      
      
      // idle sound level
      if ( this.passSound !== null ) {
        this.passSound.update( delta );
        var soundLevel = 2 - Math.abs(this.object.position.z - galaxies.engine.CAMERA_Z)/10;
        soundLevel = THREE.Math.clamp( soundLevel, 0, 2 );
        //console.log( soundLevel );
        this.passSound.volume = soundLevel;
      }
      //
      
      break;
    case 'waiting':
      /*
      // fixed orbit
      angle += delta * angularSpeed;
      
      var position = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0 );
      position.multiplyScalar( radius );
      this.object.position.copy( position );
      */
      fallTimer+=delta;
      if (fallTimer >= fallTime ) {
        //this.falling = true;
        this.state = 'falling';
        
        galaxies.engine.rootObject.add( this.object );
        
        //velocity.set( -Math.sin(angle), Math.cos(angle) * radius );
        //angle = angle + (Math.PI/2);
        
        angle = angle + (Math.PI/2);
        // Reusing timer variables for spiral, naughty!
        fallTime = 0;
        fallTimer = 0;
        break;
      } // switch
    }
    
    if ( tumbling ) {
      this.object.rotateOnAxis( tumbleAxis, tumbleSpeed * delta );
    } else if ( this.orient ) {
      this.object.lookAt( galaxies.engine.rootObject.position );
    }
    
    if ( this.particleGroup != null ) {
      this.particleGroup.tick(delta);
    }
    galaxies.utils.conify( this.object );
    
  } 
  
  this.removePassSound = function() {
    if ( this.passSound !== null ) {
      this.passSound.sound.source.stop(0); // API does not require an argument, but Safari 8 does.
      //removeSource( this.passSound );
      this.passSound = null;
    }
  }
  
  // Reverse course, no more interactions, the day is won
  this.retreat = function() {
    this.isActive = false;
    this.state = 'retreating';
    
    velocity.copy( this.object.position );
    velocity.z = 0;
    velocity.setLength( 3 * RICOCHET_SPEED * galaxies.engine.speedScale );
    
    if (tumbleOnHit) { tumbling = true; }
    
    // silence!
    this.removePassSound();
    
  }
  
  this.hit = function( hitPosition, ricochet, forceDestroy ) {
    this.life--;
    
    if ( forceDestroy || (this.life <=0 ) ) {
      galaxies.engine.showCombo( this.points, this.ricochetCount, this.object );
      this.splode();
      return;
    }
    
    new galaxies.audio.PositionedSound({
      source: galaxies.audio.getSound(hitSound),
      position: galaxies.utils.rootPosition(this.object),
      baseVolume: 2,
      loop: false
    });
    
    if ( this.life === 1 ) {
      this.state= 'ricocheting';
      
      if ( typeof(ricochet) === 'number' ) {
        this.ricochetCount = ricochet+1;
      }
      
      if ( tumbleOnHit ) {
        tumbling = true;
        tumbleSpeed = baseTumbleSpeed * this.ricochetCount * 2.5;
      }
      
      //console.log( this.ricochetCount );
      
      velocity.copy( this.object.position );
      velocity.sub( hitPosition );
      velocity.z = 0;
      velocity.setLength( RICOCHET_SPEED * galaxies.engine.speedScale );
      //console.log(velocity);
    }
  }
  
  this.splode = function() {
    new galaxies.audio.PositionedSound({
      source: galaxies.audio.getSound(explodeSound),
      position: galaxies.utils.rootPosition(this.object),
      baseVolume: explosionGain,
      loop: false
    });
    
    galaxies.fx.shakeCamera(0.5);

    switch ( this.explodeType) {
      case 'fireworks':
        galaxies.fx.showFireworks( this.object.position );
        break;
      case 'debris':
        galaxies.fx.showDebris( this.object.position, velocity );
        break;
      case 'rubble':
      default:
        galaxies.fx.showRubble( this.object.position, velocity );
    }
    
    for (var i=0; i<this.spawnNumber; i++ ) {
      var child = galaxies.engine.addObstacle( this.spawnType );
      child.object.position.copy( this.object.position );
      var offset = new THREE.Vector3(
                                     THREE.Math.randFloatSpread( 1 ),
                                     THREE.Math.randFloatSpread( 1 ),
                                     0 );
      offset.setLength( this.hitThreshold * galaxies.engine.CONE_SLOPE );
      child.object.position.add(offset);
    }
    
    
    
    this.deactivate();
  }
  
  this.deactivate = function() {
    if ( this.passSound !== null ) { this.passSound.volume = 0; }
    this.state = 'inactive';
    this.remove();
    //this.resetPosition();
  }
  
  this.remove = function() {
    if ( this.object.parent!=null) {
      this.object.parent.remove(this.object);
    }
  }
  
  // Clear this object, so it will be garbage collected.
  this.destruct = function() {
    this.removePassSound();
    this.remove();
  }
  
  this.reset();
  
}

/// Factory function for creating standard obstacles.
galaxies.Obstacle.create = function( type ) {
  var props = {};
  props.speed = 0.2;
  props.tumble = false;
  props.tumbleOnHit = true;
  props.spiral = 0;
  props.points = 100;
  props.hitSound = 'asteroidhit';
  props.explodeSound = 'asteroidsplode';
  props.passSound = null;
  props.orient = false;
  props.explodeType = 'rubble';
  props.type = type;
  props.spawnType = '';
  props.spawnNumber = 0;
  
  switch(type) {
    case 'satellite':
      props.speed = 0.5;
      props.spiral = 0.7;
      props.points = 250;
      props.orient = true;
      props.explodeType = 'debris';
      props.hitSound = 'metalhit';
      props.explodeSound = 'satellitesplode';
      
      var material = new THREE.MeshPhongMaterial();
      material.setValues( galaxies.resources.materials['satellite'] );
      var model = new THREE.Mesh( galaxies.resources.geometries['satellite'], material );
      model.position.y = -2;
      model.rotation.y = Math.random() * galaxies.utils.PI_2; // random roll to show window
      
      var modelOrient = new THREE.Object3D(); // holder positioned at center of model and rotated to orient it.
      modelOrient.add(model);
      modelOrient.rotation.x = 1.3; // Face away from camera, but not completely aligned with cone surface
      modelOrient.rotation.z = 0.5; // Face direction of motion a little
      
      props.anchor = new THREE.Object3D(); // holder at center, z-axis faces forward, we made it!
      props.anchor.add(modelOrient);
      var satScale = 0.4;
      props.anchor.scale.set(satScale, satScale, satScale);
      
      props.model = modelOrient;
      
      break;
    case 'comet':
      props.speed = 1.2;
      props.spiral = 1;
      props.points = 500;
      props.orient = true;
      props.tumbleOnHit = false;
      props.explodeType = 'fireworks';
      
      props.explodeSound = 'cometexplode';
      props.explosionGain = 7;
      
      var emitterSettings = {
        type: 'cube',
        positionSpread: new THREE.Vector3(0.6, 0.6, 0.6),
        velocity: new THREE.Vector3(0, 0, -5),
        velocitySpread: new THREE.Vector3(0.2, 0.2, 2),
        sizeStart: 6,
        sizeStartSpread: 4,
        sizeEnd: 2,
        opacityStart: 0.8,
        opacityEnd: 0.1,
        colorStart: new THREE.Color("rgb(6, 6, 20)"),
        colorEnd: new THREE.Color("rgb(255, 77, 0)"),
        particlesPerSecond: 10,
        particleCount: 200,
        alive: 1.0,
        duration: null
      };
      
      var texture = new THREE.Texture( galaxies.queue.getResult('starparticle') );
      texture.needsUpdate = true;
      var particleGroup = new SPE.Group({
        texture: texture,
        maxAge: 1.5,
        blending: THREE.AdditiveBlending//THREE.AdditiveBlending
      });
      particleGroup.addEmitter( new SPE.Emitter( emitterSettings) );
      props.particleGroup = particleGroup;
      props.anchor = particleGroup.mesh;
      
      // solid core (for when particles are thin at edge of screen )
      var mat = new THREE.SpriteMaterial( { map: texture, color: 0xffffff, fog: true, blending: THREE.AdditiveBlending } );
      var core = new THREE.Sprite( mat );
      props.anchor.add( core );
      
      break;
    
    case 'asteroidmetal':
      props.life = 3;
      props.speed = 0.1;
      props.tumble = true;
      props.points = 100;
      props.hitThreshold = 0.6;
      props.hitSound = 'asteroidhit';
      props.explodeSound = 'asteroidsplode';
      var material = new THREE.MeshPhongMaterial();
      material.setValues( galaxies.resources.materials['asteroidmetal'] );
      props.model = new THREE.Mesh( galaxies.resources.geometries['asteroid'], material );
      props.model.scale.set( 0.45, 0.45, 0.45 );
      props.anchor = props.model; // no container object in this case
      
      props.spawnType = 'asteroid';
      props.spawnNumber = 2;
      break;
    case 'asteroidrad':
      props.life = 3;
      props.speed = 0.05;
      props.tumble = true;
      props.points = 100;
      props.hitThreshold = 0.7;
      props.hitSound = 'asteroidhit';
      props.explodeSound = 'asteroidsplode';
      var material = new THREE.MeshPhongMaterial();
      material.setValues( galaxies.resources.materials['asteroidrad'] );
      props.model = new THREE.Mesh( galaxies.resources.geometries['asteroid'], material );
      props.model.scale.set( 0.5, 0.5, 0.5 );
      props.anchor = props.model; // no container object in this case
      
      props.spawnType = 'asteroid';
      props.spawnNumber = 3;
      break;
    case 'asteroid':
    default:
      props.life = 1;
      props.speed = 0.2;
      props.tumble = true;
      props.points = 100;
      props.hitThreshold = 0.4;
      props.hitSound = 'asteroidhit';
      props.explodeSound = 'asteroidsplode';
      
      var material = new THREE.MeshPhongMaterial();
      material.setValues( galaxies.resources.materials['asteroid'] );
      props.model = new THREE.Mesh( galaxies.resources.geometries['asteroid'], material );
      props.model.scale.set( 0.375, 0.375, 0.375 );
      props.anchor = props.model; // no container object in this case
      props.type = 'asteroid';
      
      break;
      
  }
  return new galaxies.Obstacle(props);
}

"use strict";
/**
 * Powerup: the object that defines the behavior when acquired by the player.
 *
 */

this.galaxies = this.galaxies || {};


"use strict";
/**
 * Projectile
 * The shuttlecock.
 *
 */

this.galaxies = this.galaxies || {};

galaxies.Projectile = function( model, angle, angleOffset, spread, indestructible ) {
  this.angularSpeed = 10;
  this.isExpired = false;
  
  this.object = new THREE.Object3D();
  this.object.up.set(0,0,1);
  
  this.indestructible = false;
  if ( typeof(indestructible) === 'boolean' ) {
    this.indestructible = indestructible;
  }
  
  var rotateAxis = new THREE.Vector3(0,1,0);
  
  this.angleOffset = 0;
  if ( typeof( angleOffset ) === 'number' ) {
    this.angleOffset = angleOffset;
  }
  angle += angleOffset;
  
  if ( typeof(spread) != 'number' ) { spread = 0; }
  this.spreadAngle = spread * 30 * Math.PI/180; // spread angle is 40 degrees
  
  // set initial direction
  var direction = new THREE.Vector3( -Math.sin(angle), Math.cos(angle), 0 );
  direction.multiplyScalar( galaxies.engine.PROJ_START_Y );
  this.object.position.copy( direction );
  direction.add( direction );
  this.object.lookAt( direction );
  
  this.model = model;
  this.object.add(this.model);
  this.model.rotation.x = galaxies.engine.CONE_ANGLE;
  
  galaxies.utils.conify(this.object);
  
  //object.rotation.x = object.rotation.z + Math.PI/2;
  //this.direction = direction.multiplyScalar( SPEED );
  //console.log( object.position, direction );
  
  this.lifeTimer = 0;
  
  this.updatePosition = function( newAngle ) {
    newAngle += this.angleOffset;
    
    var distance = galaxies.utils.flatLength( this.object.position );
    direction.set( -Math.sin(newAngle), Math.cos(newAngle), 0 );
    direction.multiplyScalar( distance );
    
    this.object.position.copy( direction );
    direction.add( direction );
    this.object.lookAt( direction );
    this.object.rotateOnAxis( new THREE.Vector3(0,1,0), this.spreadAngle );
    
    galaxies.utils.conify( this.object );
  }
  
  this.hit = function() {
    galaxies.fx.showHit( this.object.position );
   
    if ( !this.indestructible ) {
      this.destroy();
    }
  }
  
  /// Expired projectiles will be removed by engine
  this.destroy = function() {
    this.isExpired = true;
    this.lifeTimer = this.PROJECTILE_LIFE;
  }
  this.remove = function() {
    if ( this.object.parent!=null) {
      this.object.parent.remove(this.object);
    }
  }
  this.addToScene = function() {
    if (!this.isExpired) {
      galaxies.engine.rootObject.add( this.object );
    }
  }
  this.update = function( delta ) {
    this.object.translateZ( this.PROJECTILE_SPEED * delta );
    this.model.rotateOnAxis( rotateAxis, this.angularSpeed * delta );
    this.lifeTimer += delta;
    if ( this.lifeTimer >= this.PROJECTILE_LIFE ) {
      this.isExpired = true;
    }
  }
}

galaxies.Projectile.prototype.PROJECTILE_SPEED = 2.0; // 3.0 in original
galaxies.Projectile.prototype.PROJECTILE_LIFE = 0; // This will be set by initial call to window resize



"use strict";
/**
 * Resources
 *
 * Stores hashes of materials, models, and related constructs.
 * May not be instantiated before galaxies.queue is populated.
 * 
 */


this.galaxies = this.galaxies || {};


galaxies.Resources = function() {
  this.geometries = {};
  this.materials = {};
  
  // Parse and cache loaded geometry.
  var objLoader = new THREE.OBJLoader();
  var parsed = objLoader.parse( galaxies.queue.getResult('asteroidmodel') );
  this.geometries['asteroid'] = parsed.children[0].geometry;
  var projmodel = objLoader.parse( galaxies.queue.getResult('projmodel') );
  this.geometries['proj'] = projmodel.children[0].geometry;
  var satmodel = objLoader.parse( galaxies.queue.getResult('satellitemodel') );
  this.geometries['satellite'] = satmodel.children[0].geometry;
  var moonmodel = objLoader.parse( galaxies.queue.getResult('moonmodel') );
  this.geometries['moon'] = moonmodel.children[0].geometry;
  var ufomodel = objLoader.parse( galaxies.queue.getResult('ufomodel') );
  //geometries['ufo'] = ufomodel.children[0].geometry;
  this.geometries['ufo'] = ufomodel;
  var debrismodel = objLoader.parse( galaxies.queue.getResult('satellitedebrismodel') );
  this.geometries['debris'] = debrismodel.children[0].geometry;
  
  
  // define materials
  var asteroidColor = new THREE.Texture( galaxies.queue.getResult('asteroidcolor'), THREE.UVMapping );
  asteroidColor.needsUpdate = true;
  var asteroidNormal = new THREE.Texture( galaxies.queue.getResult('asteroidnormal'), THREE.UVMapping );
  asteroidNormal.needsUpdate = true;
  
  this.materials['asteroid'] = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      specular: 0x000000,
      opacity: 0.4,
      transparent: false,
      map: asteroidColor,
      normalMap: asteroidNormal,
      shading: THREE.SmoothShading
  } );
  this.materials['asteroidmetal'] = new THREE.MeshPhongMaterial( {
      color: 0xffaaaa,
      specular: 0x770000,
      shininess: 100,
      opacity: 0.4,
      transparent: false,
      map: asteroidColor,
      normalMap: asteroidNormal,
      shading: THREE.SmoothShading
  } );
  this.materials['asteroidrad'] = new THREE.MeshPhongMaterial( {
      color: 0xaaffaa,
      specular: 0x00ff00,
      opacity: 0.4,
      transparent: false,
      map: asteroidColor,
      normalMap: asteroidNormal,
      shading: THREE.SmoothShading
  } );
  
  
  var satColor = new THREE.Texture( galaxies.queue.getResult('satellitecolor'), THREE.UVMapping );
  satColor.needsUpdate = true;
  
  this.materials['satellite'] = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      specular: 0x202020,
      shininess: 50,
      opacity: 0.4,
      transparent: false,
      map: satColor,
      shading: THREE.SmoothShading
  } );
  
  
  var moonOcclusion = new THREE.Texture( galaxies.queue.getResult('moonocclusion'), THREE.UVMapping );
  moonOcclusion.needsUpdate = true;
  var moonNormal = new THREE.Texture( galaxies.queue.getResult('moonnormal'), THREE.UVMapping );
  moonNormal.needsUpdate = true;
  
  this.materials['moon'] = new THREE.MeshPhongMaterial( {
      color: 0xaaaaaa,
      specular: 0x000000,
      map: moonOcclusion,
      normalMap: moonNormal,
      shading: THREE.SmoothShading
  } );
  
  
  
  
  var ufoColor = new THREE.Texture( galaxies.queue.getResult('ufocolor') );
  ufoColor.needsUpdate = true;
  this.materials['ufo'] = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      specular: 0x661313,
      shininess: 90,
      transparent: false,
      map: ufoColor,
      shading: THREE.SmoothShading,
      depthTest: true
  } );
  this.materials['ufocanopy'] = new THREE.MeshPhongMaterial( {
    color: 0x222222,
    specular: 0x080808,
    shininess: 100,
    opacity: 0.9,
    transparent: true,
    shading: THREE.SmoothShading,
    blending: THREE.AdditiveBlending
  });

  var projColor = new THREE.Texture( galaxies.queue.getResult('projcolor'), THREE.UVMapping );
  projColor.needsUpdate = true;
  
  this.materials['proj'] = new THREE.MeshBasicMaterial( {
      color: 0xcccccc,
      
      map: projColor,
      shading: THREE.SmoothShading
  } );
  
  this.materials['debris'] = new THREE.MeshPhongMaterial( {
    color: 0x999999,
    specular: 0x202020,
    shininess: 50,
    opacity: 1,
    transparent: true,
    shading: THREE.SmoothShading
  });

  
 
    
  
};

"use strict";

this.galaxies = this.galaxies || {};

galaxies.SpriteSheet = function( texture, frames, frameRate ) {
  this.framePeriod = 1/frameRate;
  this.frames = frames;
  
  var playing = false;
  
  var frameIndex = 0;
  var timer = 0;
  var loopCounter;
  
  var width = texture.image.width;
  var height = texture.image.height;
  
  this.texture = texture;
  
  //this.texture.wrapS = this.texture.wrapT = THREE.RepeatWrapping;
  
  this.updateFrame = function( index ) {
    //console.log( index );
    // update frame
    frameIndex = index;
    var frame = this.frames[frameIndex];
    //console.log( frame );
    
    this.texture.repeat.set( frame[2]/width, frame[3]/height );
    //console.log( frame[2]/width, frame[3]/height );
    
    this.texture.offset.x = (frame[0])/width;
    this.texture.offset.y = 1-((frame[1] + frame[3])/height);
    
    //console.log( 1 - (frame[1]/height), frame[3], height );
    
    //this.texture.needsUpdate = true;
  }
  
  this.update = function( delta ) {
    if ( !playing ) { return; }
    
    timer += delta;
    
    var newFrameIndex = Math.floor(timer / this.framePeriod);
    
    if ( newFrameIndex > frameIndex ) {
      if ( newFrameIndex >= this.frames.length ) {
        loopCounter--;
        newFrameIndex = 0;
        timer = 0;
      }
      if ( loopCounter === 0 ) { // animation complete
        this.stop();
        return;
      }
      this.updateFrame(newFrameIndex );
    }
  }
  
  this.play = function( loops ) {
    if ( typeof(loops) === 'undefined' ) {
      loops = 1;
    }
    loopCounter = loops;
    timer = 0;
    frameIndex = 0;
    playing = true;
    //console.log("play animation");
  }
  
  this.stop = function() {
    frameIndex = 0;
    this.updateFrame( frameIndex );
    playing = false;
  }
  
  this.updateFrame(0);
  
  
/*  
texture, tilesHoriz, tilesVert, numTiles, tileDispDuration) 
{	
	// note: texture passed by reference, will be updated by the update function.
		
	this.tilesHorizontal = tilesHoriz;
	this.tilesVertical = tilesVert;
	// how many images does this spritesheet contain?
	//  usually equals tilesHoriz * tilesVert, but not necessarily,
	//  if there at blank tiles at the bottom of the spritesheet. 
	this.numberOfTiles = numTiles;
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
	texture.repeat.set( 1 / this.tilesHorizontal, 1 / this.tilesVertical );
	// how long should each image be displayed?
	this.tileDisplayDuration = tileDispDuration;
	// how long has the current image been displayed?
	this.currentDisplayTime = 0;
	// which image is currently being displayed?
	this.currentTile = 0;
		
	this.update = function( milliSec )
	{
		this.currentDisplayTime += milliSec;
		while (this.currentDisplayTime > this.tileDisplayDuration)
		{
			this.currentDisplayTime -= this.tileDisplayDuration;
			this.currentTile++;
			if (this.currentTile == this.numberOfTiles)
				this.currentTile = 0;
			var currentColumn = this.currentTile % this.tilesHorizontal;
			texture.offset.x = currentColumn / this.tilesHorizontal;
			var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
			texture.offset.y = currentRow / this.tilesVertical;
		}
	};  
  
  
  /*
   *
   *
lux_shoot._SpriteSheet = new createjs.SpriteSheet({images: ["lux_serve.png"],

 // x, y, width, height, imageIndex*, regX*, regY*
frames: [[0,0,110,158,0,-8,16.349999999999994],
		 [110,0,129,152,0,4,14.349999999999994],
		 [239,0,129,167,0,4,29.349999999999994],
		 [368,0,129,183,0,4,45.349999999999994],
		 [0,183,141,190,0,-27,52.349999999999994],
		 [141,183,141,195,0,-27,57.349999999999994],
		 [282,183,141,200,0,-27,62.349999999999994],
		 [0,383,111,196,0,-8,81.35],
		 [111,383,111,196,0,-8,81.35],
		 [222,383,98,183,0,0,76.35],
		 [320,383,97,158,0,0,51.349999999999994],
		 [0,579,103,172,0,0,29.349999999999994],
		 [0,579,103,172,0,0,29.349999999999994],
		 [103,579,108,139,0,-4,-1.6500000000000057],
		 [103,579,108,139,0,-4,-1.6500000000000057],
		 [103,579,108,139,0,-4,-1.6500000000000057]]});
		 */
}

"use strict";
/**
 * Targets
 * 
 * This includes powerup capsules, stars, other neutral objects that can be hit
 * but do not directly threaten the player.
 *
 */

this.galaxies = this.galaxies || {};


galaxies.BaseTarget = function() {
  this.object = new THREE.Object3D();
  
  this.timer = 0;
  this.lifetime = 10;
  
  galaxies.engine.OBSTACLE_VISIBLE_RADIUS
}
galaxies.BaseTarget.prototype.destroy = function() {
  
}




/**
 * Capsule
 * Holds a powerup.
 * 
 */
galaxies.Capsule = function( powerup ) {
  galaxies.BaseTarget.call(this);
  
  this.powerup = powerup;
  
  var color = 0xaabbcc;
  switch (this.powerup) {
    case "clone": color = 0xffcccc; break;
    case "spread": color = 0xff0000; break;
    case "golden": color = 0xffccaa; break;
  }
  
  var geometry = new THREE.SphereGeometry(0.2, 10, 10);
  var mat = new THREE.MeshPhongMaterial( {
      color: color,
      specular: 0xffffff,
      shininess: 5} );
  this.model = new THREE.Mesh( geometry, mat );
  this.object.add( this.model );
  
  galaxies.engine.rootObject.add( this.object );
  galaxies.engine.neutrals.push(this);

  this.hitThreshold = 0.3;
  
  this.lifetime = 10;
  
  this.angle = 0;
  this.distance = 3.1; // distance from origin of capsule position
  this.orbitAngle = 0;
  this.orbitRadius = 0.5; // magnitude of oscillation
  this.orbitVelocity = 0.9; // speed of oscillation
  this.position = new THREE.Vector3();
  
  this.appear();
}

galaxies.Capsule.prototype = Object.create( galaxies.BaseTarget.prototype );
galaxies.Capsule.prototype.constructor = galaxies.Capsule;
galaxies.Capsule.prototype.hit = function() {
  // release the powerup
  console.log("Capsule.hit");
  galaxies.engine.powerupCount++;
  galaxies.engine.setPowerup( this.powerup );
  
  this.clear();
}

galaxies.Capsule.prototype.clear = function() {
  galaxies.engine.inactiveNeutrals.push(this);
  galaxies.engine.rootObject.remove( this.object );
  galaxies.engine.powerupCapsule = null;
}

galaxies.Capsule.prototype.appear = function() {
  this.angle = Math.random() * galaxies.utils.PI_2;
  this.position.set( Math.cos(this.angle) * this.distance,
                     Math.sin(this.angle) * this.distance,
                     0 );
  this.orbitAngle = 0;
}

galaxies.Capsule.prototype.update = function( delta ) {
  this.timer += delta;
  if ( this.timer > this.lifetime ) { this.clear(); }
  
  this.orbitAngle = Math.sin( this.timer*this.orbitVelocity) * this.orbitRadius;
  
  this.object.position.set(
    Math.cos(this.angle + this.orbitAngle) * this.distance,
    Math.sin(this.angle + this.orbitAngle) * this.distance,
    0 );
  
  galaxies.utils.conify( this.object );
  
}







"use strict";
/**
 * Rotating title sequence
 *
 */

this.galaxies = this.galaxies || {};

galaxies.TitleSequence = function() {
  
  var titleTransition = function() {
    
    // spin wheel
    createjs.Tween.removeTweens( titleHub.rotation );
    createjs.Tween.get( titleHub.rotation )
      .to( { x: 2*Math.PI/4 }, TRANSITION_TIME_HALF_MS, createjs.Ease.quadIn )
      .to( { x: -1*Math.PI/4 }, 0 )
      .call( nextTitle )
      .to( { x: 0 }, TRANSITION_TIME_HALF_MS, createjs.Ease.quadOut )
      .call( checkTitleSequence );
    
    // tilt wheel
    createjs.Tween.removeTweens( titlePivot.rotation );
    createjs.Tween.get( titlePivot.rotation )
      .to( { z: Math.PI/4 }, TRANSITION_TIME_HALF_MS, createjs.Ease.quadIn )
      .to( { z: -Math.PI/4 }, 0)
      .to( { z: 0 }, TRANSITION_TIME_HALF_MS, createjs.Ease.quadOut );
    
    // rotate view to match wheel motion
    var start = galaxies.engine.rootObject.rotation.x;
    createjs.Tween.removeTweens( galaxies.engine.rootObject.rotation );
    createjs.Tween.get( galaxies.engine.rootObject.rotation )
      .to( { x: start - Math.PI/4 }, TRANSITION_TIME_MS, createjs.Ease.quadInOut );
  }
  // Audio start must be offset from title motion to sync hence the separate function.
  var titleTransitionAudio = function() {
    // Whoosh object goes beyond rest position, so sound doesn't stop so abruptly.
    // Whoosh tween also lasts duration of whoosh audio.
    createjs.Tween.removeTweens( whooshObject.position );
    createjs.Tween.get( whooshObject.position )
      .to( {x:0, y:10, z: galaxies.engine.CAMERA_Z+20}, 0 )
      .call( function() {
        whooshSound.sound.startSound();
        //console.log("starting whoosh sound");
      }, this)
      .to( {x:0, y:10, z:-10}, 3000, createjs.Ease.quadInOut );
  }
  var nextTitle = function() {
    currentTitleIndex ++;
    updateTitleSprite();
  }  
  var updateTitleSprite = function() {
    title.material = titles[currentTitleIndex];
    title.position.set( 0, -TITLE_OFFSET, 0 );
    
    if ( title.material.map ) {
      title.scale.set( title.material.map.image.width/titleScale, title.material.map.image.height/titleScale , 1 );
    }
    
    if ( titleExtra != null ) { titleHub.remove( titleExtra ); }
    titleExtra = titleExtras[currentTitleIndex];
    if ( titleExtra!=null ) { titleHub.add( titleExtra ); }
  }
  var checkTitleSequence = function() {
    if ( currentTitleIndex < (titles.length-1) ) {
      var waitTime = TITLE_TIME_MS;
      if ( currentTitleIndex === 0 ) {
        waitTime = waitTime/2;
      }
      createjs.Tween.removeTweens( this );
      createjs.Tween.get( this )
        .wait(waitTime)
        .call( titleTransition, this );

      createjs.Tween.get( whooshObject, {override:true} )
        .wait( waitTime - 500 )
        .call( titleTransitionAudio, this );
      
    }
  }
  
  var rotationAxis = new THREE.Vector3();
  var driftAxis = new THREE.Vector3(1,0,0);
  var driftSpeed = 0.05;
  
  var titleFrameRequest;
  var titleRoot; // the root object
  
  var TITLE_TIME_MS = 4000;
  var TRANSITION_TIME_MS = 500;
  var TRANSITION_TIME_HALF_MS = TRANSITION_TIME_MS/2;
  
  
  var TITLE_HUB_OFFSET = 100;
  var TITLE_OFFSET = TITLE_HUB_OFFSET - 5;
  
  var titlePivot = new THREE.Object3D();
  titlePivot.position.set(0,0,0);
  titleRoot = titlePivot;
  
  var titleHub = new THREE.Object3D();
  titleHub.position.set( 0, TITLE_HUB_OFFSET, 0 );
  titlePivot.add( titleHub );
  
  var titles = []; // Title sprite materials
  var titleExtras = []; // Sprite objects
  var titleExtra; // Reference to current object
  var currentTitleIndex = 0;
  
  var titleImageIds = ['', 'title5', 'title1', 'title2', 'title3', 'title4', 'title5'];
  var titleRotationAxis = new THREE.Vector3(1,0,0);
  var titleScale = 80; //100
  var titleStartAngle = 0;//galaxies.utils.PI_2/titleImageIds.length * -0.2;
  
  var whooshObject = new THREE.Object3D();
  var whooshSound = new galaxies.audio.ObjectSound( galaxies.audio.getSound('titlewoosh'), whooshObject, 5, false, false );
  
  for ( var i=0, len=titleImageIds.length; i<len; i++ ) {
    if ( titleImageIds[i] == '' ) {
      titles[i] = new THREE.SpriteMaterial({
        map: null,
        opacity: 0,
        transparent: true
      } );
      continue;
    }
    
    var image = galaxies.queue.getResult(titleImageIds[i]);
    var map = new THREE.Texture( image );
    map.magFilter = THREE.LinearFilter;
    map.minFilter = THREE.LinearMipMapLinearFilter;
    map.needsUpdate = true;
    
    var mat = new THREE.SpriteMaterial( {
      color: 0xffffff,
      map: map,
      } );
    titles[i] = mat;
  }
  
  var title = new THREE.Sprite( titles[0] );
  titleHub.add( title );
//titles[i].rotateOnAxis(titleRotationAxis, i * 0.1);//galaxies.utils.PI_2/len );
  
  var extraTextureLux = new THREE.Texture( galaxies.queue.getResult( 'titleExtraLux' ) );
  extraTextureLux.magFilter = THREE.LinearFilter;
  extraTextureLux.minFilter = THREE.LinearFilter;
  extraTextureLux.needsUpdate = true;
  titleExtras[3] = new THREE.Sprite(
    new THREE.SpriteMaterial( {
      color: 0xffffff,
      map: extraTextureLux
    } )
  );
  titleExtras[3].position.set(13,-TITLE_OFFSET,6);
  titleExtras[3].scale.set( titleExtras[3].material.map.image.width/70, titleExtras[3].material.map.image.height/70, 1 );
  
  var extraTextureTrunkford = new THREE.Texture( galaxies.queue.getResult( 'titleExtraTrunkford' ) );
  extraTextureTrunkford.magFilter = THREE.LinearFilter;
  extraTextureTrunkford.minFilter = THREE.LinearFilter;
  extraTextureTrunkford.needsUpdate = true;
  titleExtras[5] = new THREE.Sprite(
    new THREE.SpriteMaterial( {
      color: 0xffffff,
      map: extraTextureTrunkford
    } )
  );
  titleExtras[5].position.set(16,-TITLE_OFFSET,4);
  titleExtras[5].scale.set( titleExtras[5].material.map.image.width/60, titleExtras[5].material.map.image.height/60, 1 );
  
  updateTitleSprite();

  
  var activate = function() {
    galaxies.engine.rootObject.add( titleRoot );
    
    galaxies.engine.startTimers();
    
    // reset hub
    titleHub.rotation.set(0,0,0);
    titleHub.rotateOnAxis( titleRotationAxis, titleStartAngle );
    
    currentTitleIndex = 0;
    updateTitleSprite();
    checkTitleSequence.call(this); // need context in order to set tweens on the titleSequence object
   
    if ( titleFrameRequest == null ) {
      animateTitle();
    }
    
    driftAxis.set( THREE.Math.randFloatSpread(1), THREE.Math.randFloatSpread(1), THREE.Math.randFloatSpread(1) );
    driftAxis.normalize();
    
  }


  
  
  var deactivate = function() {
    galaxies.engine.rootObject.remove( titleRoot );
    
    if ( titleFrameRequest != null ) {
      window.cancelAnimationFrame(titleFrameRequest);
      titleFrameRequest = null;
    }
    
    // stop motion
    createjs.Tween.removeTweens( this );
    createjs.Tween.removeTweens( titleHub.rotation );
    createjs.Tween.removeTweens( titlePivot.rotation );
    createjs.Tween.removeTweens( galaxies.engine.rootObject.rotation );
    createjs.Tween.removeTweens( whooshObject.position );

  }

  var animateTitle = function() {
    titleFrameRequest = requestAnimationFrame( animateTitle );
    updateTitle();
  };
  
  // Tick function
  // TODO - drift functionality is repeated from game loop... should be common somehow.
  var updateTitle = function() {
    var delta = galaxies.engine.clock.getDelta();
    if ( delta===0 ) { return; } // paused!
    
    whooshSound.update(delta);
    
    galaxies.engine.driftObject.rotateOnAxis( driftAxis, driftSpeed * delta );
    title.material.rotation = titlePivot.rotation.z; // match lean angle of wheel
    
    galaxies.engine.renderer.render( galaxies.engine.scene, galaxies.engine.camera );
  }
  
  
  return {
    activate: activate,
    deactivate: deactivate
  };
  
};


"use strict";

this.galaxies = this.galaxies || {};

this.galaxies.Ufo = function() {
  this.points = 2000;
  this.hitThreshold = 0.7;
  /*
  var geometry = new THREE.CylinderGeometry( 0.4, 0.4, 0.25, 8, 1, false);
  
  var objectColor = new THREE.Color( 1,1,1 );
  var material = new THREE.MeshLambertMaterial( {
      color: objectColor.getHex(),
      emissive: 0x333333,
      shading: THREE.SmoothShading } );
  
  this.object = new THREE.Mesh( geometry, material );*/
  
  this.object = new THREE.Object3D();
  this.model = galaxies.resources.geometries['ufo'];
  /*new THREE.Mesh(
    geometries['ufo'],
    new THREE.MeshFaceMaterial( [ materials['ufo2'], materials['ufo'], materials['ufo3'] ] )
  );
  */
  this.model.children[0].material = galaxies.resources.materials['ufo'];
  this.model.children[1].material = galaxies.resources.materials['ufocanopy'];
  
  
  this.model.scale.set(0.6, 0.6, 0.6);
  this.model.rotation.set(Math.PI,0,-Math.PI/2);
  
  this.object.add( this.model );
  
  var trunkMap = new THREE.Texture( galaxies.queue.getResult('trunkford') );
  trunkMap.needsUpdate = true;
  var trunkMat = new THREE.MeshLambertMaterial({
    map: trunkMap,
    color: 0xffffff,
    transparent: true,
    //depthTest: false,
    //depthWrite: false,
    side: THREE.DoubleSide
  } );
  //var characterMaterial = new THREE.SpriteMaterial( { color: 0xffffff } );
  var trunkford = new THREE.Mesh( new THREE.PlaneGeometry(1.23,1), trunkMat ); // 1.23 is aspect ratio of texture
  trunkford.position.set( 0, 0.4, 0.4 );
  trunkford.scale.set(0.6, 0.6, 1);
  trunkford.rotation.set( 0, Math.PI, 0 );
  this.model.add( trunkford );
  
  var anchor = new THREE.Object3D();
  anchor.add( this.object );
  
  this.state = 'inactive'; // values for state: idle, in, orbit, out, inactive
  var stepTimer = 0;
  var stepTime = 0;
  var transitionTime = 0;
  
  var hitCounter = 0;
  var HITS = 2;
  
  var angle = Math.random() * galaxies.utils.PI_2; // random start angle
  var angularSpeed = 0.7;
  var rotationAxis = new THREE.Vector3(0,1,0);
  
  // laser
  var laserChargeParticles = {
    type: 'sphere',
    radius: 1,
    //acceleration: new THREE.Vector3(0,0,-40),//THREE.Vector3(0,-40,0),
    speed: -1,
    //speedSpread: 5,
    sizeStart: 1,
    sizeStartSpread: 1,
    sizeEnd: 2,
    opacityStart: 0,
    opacityEnd: 1,
    colorStart: new THREE.Color(0.300, 1.000, 0.300),
    colorStartSpread: new THREE.Vector3(0.1, 0.1, 0.1),
    colorEnd: new THREE.Color(0.500, 1.000, 0.800),
    particlesPerSecond: 50,
    particleCount: 50,
    alive: 1.0,
    duration: 0.5//0.1
  };
  var texture = new THREE.Texture( galaxies.queue.getResult('starparticle') );
  texture.needsUpdate = true;
  var laserChargeGroup = new SPE.Group({
    texture: texture,
    maxAge: 1,
    blending: THREE.AdditiveBlending
  });
  var laserChargeEmitter = new SPE.Emitter( laserChargeParticles );
  laserChargeGroup.addEmitter( laserChargeEmitter );
  laserChargeGroup.mesh.position.x = -0.5;
  
  
  var smokeParticles = {
    type: 'cube',
    acceleration: new THREE.Vector3(0,0,-3),
    velocity: new THREE.Vector3(0, -2, 0),
    velocitySpread: new THREE.Vector3(1, 1, 1),
    //speedSpread: 5,
    sizeStart: 3,
    sizeStartSpread: 1,
    sizeEnd: 3,
    opacityStart: 1,
    opacityEnd: 0,
    colorStart: new THREE.Color(0.600, 0.600, 0.600),
    colorStartSpread: new THREE.Vector3(0.1, 0.1, 0.1),
    colorEnd: new THREE.Color(0.200, 0.200, 0.200),
    particlesPerSecond: 10,
    particleCount: 50,
    alive: 0.0,
    duration: null//0.1
  };
  var smokeTexture = new THREE.Texture( galaxies.queue.getResult('projhitparticle') );
  smokeTexture.needsUpdate = true;
  var smokeGroup = new SPE.Group({
    texture: smokeTexture,
    maxAge: 2,
    blending: THREE.NormalBlending
  });
  var smokeEmitter = new SPE.Emitter( smokeParticles );
  smokeGroup.addEmitter( smokeEmitter );
  this.object.add( smokeGroup.mesh );
  
  
  
  this.object.add( laserChargeGroup.mesh );

  var laserOrient = new THREE.Object3D();
  laserOrient.position.set(-0.5, 0, 0);
  laserOrient.rotation.set(0,2.03,0); // This angle set so beam of given length intersects with planet.
  //this.object.add( laserOrient ); // For testing

  var laserGeometry = new THREE.PlaneGeometry( 5, 0.3 );
  var laserTexture = new THREE.Texture(
    galaxies.queue.getResult('laserbeam') );
  laserTexture.needsUpdate = true;
  var laserMaterial = new THREE.MeshBasicMaterial( {
    map: laserTexture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1
  } );
  var laserBeam = new THREE.Mesh( laserGeometry, laserMaterial );
  laserBeam.position.set(2.5, 0, 0);
  laserOrient.add( laserBeam );

//  var axisHelper = new THREE.AxisHelper(1);
//  this.object.add( axisHelper );
  

  /*
  var targetPositions = [
    new THREE.Vector3(0.5,0,41),
    new THREE.Vector3(3.3,0,0),
    new THREE.Vector3(2.9,0,0),
    new THREE.Vector3(2.5,0,0),
    new THREE.Vector3(0.5,0,41)
  ];
  */
  
  // Sound!
  this.ufoSound = new galaxies.audio.ObjectSound( galaxies.audio.getSound('ufo'), this.object, 0 );
  //directionalSources.push( ufoSound );
  
  var idleZ = galaxies.engine.CAMERA_Z + 10;
  var idlePosition = new THREE.Vector3(1,0,idleZ);

  var orbitPositions = [
    new THREE.Vector3(galaxies.engine.VISIBLE_RADIUS,0,0),
    new THREE.Vector3(galaxies.engine.VISIBLE_RADIUS * 0.9,0,0),
    new THREE.Vector3(galaxies.engine.VISIBLE_RADIUS * 0.75,0,0)
  ];
  orbitPositions[0].z = galaxies.utils.getConifiedDepth( orbitPositions[0] );
  orbitPositions[1].z = galaxies.utils.getConifiedDepth( orbitPositions[1] );
  orbitPositions[2].z = galaxies.utils.getConifiedDepth( orbitPositions[2] );
  var orbitPosition = orbitPositions[1];
  
  /*
  var laserMaterial = new THREE.SpriteMaterial( {
    color: 0xffffff,
    fog: true,
    opacity: 1,
    transparent: true
  } );
  var laser = new THREE.Sprite( laserMaterial );
  laser.position.set( OBSTACLE_VISIBLE_RADIUS * 0.75 + 1, 0, 0 );
  laser.scale.set( OBSTACLE_VISIBLE_RADIUS * 1.5, 1, 1);
  var laserHolder = new THREE.Object3D();
  laserHolder.add( laser );
  */
  //rootObject.add( laserHolder );
  
  
  var tween = createjs.Ease.quadInOut;
  var inTween;
  
  var stepAngle = 0;
  var transitionAngle = 0;
  var step = 0;
  this.object.position.copy( idlePosition );
  var lastPosition = idlePosition;
  var targetPosition = idlePosition;
  var lastAngle = 0;
  var targetAngle = 0;
  
  this.isHittable = false;
  this.alive = true;
  
  this.update = function( delta ) {
    stepTimer += delta;
    
    switch ( this.state ) {
    case 'idle':
      if ( stepTimer >= stepTime ) {
        this.state = 'in';
        stepTime = 4;
        transitionTime = 4;
        stepTimer = 0;
        lastPosition = this.object.position.clone();
        //targetPosition = orbitPositions[0];
        targetPosition = orbitPosition;
        
        // Starting angle is set so ufo stays to right or left as it flies in.
        angle = Math.round(Math.random()) * Math.PI - Math.PI/4;
        
        var a = angularSpeed / (2*transitionTime);
        var c = angle;
        
        inTween = function( t ) {
          return a*t*t + c;
        };
        
        this.isHittable = true;
        
        // Tip to attack posture
        this.model.rotation.y = Math.PI/3;
        createjs.Tween.removeTweens( this.model.rotation );
        createjs.Tween.get(this.model.rotation).wait(2000).to({y: 0}, 2000, createjs.Ease.quadOut );
        
        new galaxies.audio.PositionedSound({
          source: galaxies.audio.getSound('trunkfordlaugh'),
          position: new THREE.Vector3(0,0,galaxies.engine.CAMERA_Z*1.5),
          baseVolume: 4,
          loop: false
        });
        
        /*
        console.log( angle );
        for (var i=0; i<transitionTime; i+=0.1 ) {
          console.log( i, inTween(i).toFixed(2) );
        }*/
        
        //console.log( 'idle -> in' );
      }
      break;
    case 'in':
      angle = inTween( stepTimer );
      
      if ( stepTimer >= stepTime ) {
        this.state = 'orbit';
        stepTime = 1;//(Math.PI*2/3)/angularSpeed; // time between shots
        transitionTime = stepTime/4;
        stepTimer = 0;
        step = 0;
        lastPosition = this.object.position.clone();
        //targetPosition = orbitPositions[step];
        targetPosition = orbitPosition;
        //console.log( 'in -> orbit' );
      }
      break;
    case 'orbit':
      angle += angularSpeed * delta;
      
      if ( stepTimer >= stepTime ) {
        //console.log( 'orbit step' );
        
        // Fire
        laserChargeEmitter.alive = 1.0;
        createjs.Tween.get(laserBeam).wait(1000).call( function() {
          new galaxies.audio.PositionedSound({
            source: galaxies.audio.getSound('ufoshoot'),
            position: galaxies.utils.rootPosition(this.object),
            baseVolume: 1.5,
            loop: false
          });
          
          this.object.add(laserOrient);
          laserBeam.material.opacity = 1;
  
          createjs.Tween.get(laserBeam.material).to({opacity:0}, 300, createjs.Ease.quadOut).call( function() {
            this.object.remove(laserOrient);
            //laserBeam.material.opacity = 1; // for testing
          }, null, this );
          
          laserOrient.rotation.z = (Math.round( Math.random() )* 2 - 1) * Math.PI/16;
          
          if ( step > 2 ) {
            galaxies.engine.hitPlayer();
            this.leave();
            laserOrient.rotation.z = 0;
          }

        }, null, this );
        
        //lastPosition = this.object.position.clone();
        //targetPosition = orbitPositions[step];
        
        step++;
        stepTimer = 0;
        stepTime = 2;
      }
      
      break;
    case 'out':
      angle = THREE.Math.mapLinear( stepTimer, 0, transitionTime/2, lastAngle, targetAngle );
      //console.log( angle, stepTimer, lastAngle, targetAngle );
      
      if ( stepTimer >= stepTime ) {
        //console.log( 'orbit -> idle' );
        this.reset();
      }
      
      break;
    }
    
    var transitionProgress = THREE.Math.clamp( stepTimer/transitionTime, 0, 1);
    transitionProgress = tween( THREE.Math.clamp(transitionProgress,0,1) );
    this.object.position.lerpVectors( lastPosition, targetPosition, transitionProgress );
    
    anchor.rotation.set(0,0,angle);
    
    
    // Engine sound level - reduce to 0 when all the way behind listener.
    this.ufoSound.update( delta );
    var engineLevel = idleZ - this.object.position.z;
    engineLevel = THREE.Math.clamp( engineLevel, 0, 1 );
    this.ufoSound.volume = engineLevel;
    //
    
    laserChargeGroup.tick(delta);
    smokeGroup.tick(delta);
    
    /*
    if ( angle > stepAngle ) {
      lastPosition = this.object.position.clone();
      step++;
      if ( step === (targetPositions.length-1) ) {
        // fire!
        hitPlayer();
        stepAngle = angle + galaxies.utils.PI_2;
        transitionAngle = angle + galaxies.utils.PI_2;
      } else if ( step >= targetPositions.length ) {
        this.reset();
      } else {
        // step down
        stepAngle = angle + (galaxies.utils.PI_2);
        transitionAngle = angle + (Math.PI/2);
      }
    }
    
    var progress = 1 - (transitionAngle - angle)/ (Math.PI/2);
    progress = tween( THREE.Math.clamp(progress,0,1) );
    this.object.position.lerpVectors( lastPosition, targetPositions[step], progress );
    
    if ( this.alive && !this.isHittable && (angle>transitionAngle) && (step==1) ) {
      this.isHittable = true;
    }*/
    
  }
  
  this.leave = function() {
    this.state = 'out';
    stepTimer = 0;
    stepTime = 4;
    transitionTime = 4;
    this.isHittable = false;
    lastPosition = this.object.position.clone();
    targetPosition = idlePosition;
    
    // Abort firing 
    createjs.Tween.removeTweens(laserBeam);
    
    var shortAngle = ((angle) + Math.PI) % galaxies.utils.PI_2 - Math.PI;
    angle = shortAngle;
    lastAngle = angle;
    
    targetAngle = (Math.floor(angle / Math.PI) + 1 ) * Math.PI;
    /*
    if ( Math.abs( shortAngle ) < Math.PI/2 ) {
      targetAngle = 0;
    } else {
      if ( shortAngle < 0 ) {
        targetAngle = -Math.PI;
      } else {
        targetAngle = Math.PI;
      }
    }*/
    
    // Tip to show bubble
    createjs.Tween.removeTweens( this.model.rotation );
    createjs.Tween.get(this.model.rotation).to({y: Math.PI/3}, 2000, createjs.Ease.quadIn );
    
    //console.log( 'orbit -> out' );
  }
  
  this.hit = function( forceDestroy ) {
    if ( forceDestroy ) {
      hitCounter = HITS;
    } else {
      hitCounter++;
    }
    
    if ( hitCounter >= HITS ) {
      this.leave();
      
      galaxies.engine.showCombo( this.points, 1, this.object );
    }
    
    smokeEmitter.alive = 1.0;
        
    // play sound
    new galaxies.audio.PositionedSound({
      source: galaxies.audio.getSound('ufohit'),
      position: galaxies.utils.rootPosition(this.object),
      baseVolume: 1,
      loop: false
    });
    
  }
  
  // put object at step 0 and idle it for a random time
  this.reset = function() {
    this.state = 'idle';
    stepTimer = 0;
    
    hitCounter = 0;
    smokeEmitter.alive = 0.0;

    
    if ( galaxies.engine.isGameOver ) {
      this.deactivate();
      return;
    } else {
      //stepTime = 0; // for testing
      stepTime = Math.random() * 5 + 5; // 5 to 10 second interval
    }
    
    this.isHittable = false;
    
    lastPosition = idlePosition;
    targetPosition = idlePosition;
    this.object.position.copy( idlePosition );
    
    // silence it!
    this.ufoSound.volume = 0;
    
    /*
    step = 0;
    transitionAngle = angle + Math.random() * 3 * Math.PI;
    stepAngle = transitionAngle;
    this.alive = true;
    lastPosition = targetPositions[0];
    this.object.position.copy( targetPositions[0] );
    */
  }
  
  this.activate = function() {
    this.reset();
    
    galaxies.engine.rootObject.add( anchor );
    
  }
  this.deactivate = function() {
    this.state = 'inactive';
    
    this.isHittable = false;
    lastPosition = idlePosition;
    targetPosition = idlePosition;
    this.object.position.copy( idlePosition );
    this.ufoSound.volume=0;
    
    galaxies.engine.rootObject.remove( anchor );
  }
  
  
  this.deactivate();
  
}

'use strict';

this.galaxies = this.galaxies || {};


galaxies.ui = (function() {
  
  // UI elements
  var uiHolder = document.getElementById("menuHolder");
  
  // loading and title play button
  var loadingHolder = uiHolder.querySelector(".loading");
  var loadingLogo = uiHolder.querySelector(".progress-title");
  var playSymbol = uiHolder.querySelector(".play-symbol");
  var progressElement = uiHolder.querySelector(".progress");
  var loadRing = uiHolder.querySelector(".progress-ring");
  var playHolder = uiHolder.querySelector(".play-place");
  var playButton = uiHolder.querySelector(".play-button");
  
  // recommend buttons
  var recommendSafari = loadingHolder.querySelector(".recommend-safari");
  var recommendEdge = loadingHolder.querySelector(".recommend-edge");
  
  // audio controls
  var audioControls = loadingHolder.querySelector(".audio-controls");
  var stereoButton = audioControls.querySelector(".stereo-button");
  var surroundButton = audioControls.querySelector(".surround-button");
  
  // mute button (always active after load)
  var muteButton = uiHolder.querySelector(".mute-button");
  var dolbyLogo = uiHolder.querySelector(".dolby-logo");
  
  // in-game elements
  var inGameHolder = uiHolder.querySelector(".game-ui");
  var pauseButton = uiHolder.querySelector(".pause-button");
  var levelDisplay = inGameHolder.querySelector(".level-display-text");
  var lifeDisplay = inGameHolder.querySelector(".life-display");
  var lifeHearts = lifeDisplay.querySelectorAll(".life-heart");
  var scoreDisplay = inGameHolder.querySelector(".score-display-text");
  var powerupCharge = inGameHolder.querySelector(".powerup-charge-display");
  
  
  // pause menu
  var pauseOverlay = uiHolder.querySelector(".pause-overlay");
  var pauseHolder = uiHolder.querySelector(".pause-menu");
  var pauseTitle = pauseHolder.querySelector(".pause-title");
  var resumeButton = pauseHolder.querySelector(".resume-button");
  var restartButton = pauseHolder.querySelector(".restart-button");
  var quitButton = pauseHolder.querySelector(".quit-button");
  
  // game over menu
  var gameOverHolder = uiHolder.querySelector(".game-over-menu");
  var gameOverTitle = gameOverHolder.querySelector(".game-over-title");
  var restartButton2 = gameOverHolder.querySelector(".restart-button");
  var quitButton2 = gameOverHolder.querySelector(".quit-button");
  
  // title
  var title = uiHolder.querySelector(".title");
  
  // game element
  var gameContainer = document.getElementById( 'container' );
  
  // title sequence
  var titleSequence;

  var progressRing = (function() {
    var elementA = playHolder.querySelector('.progress-fill-a');
    var elementB = playHolder.querySelector('.progress-fill-b');
    var secondHalf = false;
    
    var update = function(value) {
      var angle = 360 * value - 180;
      if (!secondHalf) {
        var styleObject = elementA.style;
        styleObject['-webkit-transform'] = "rotate(" + angle.toFixed(2) + "deg)";
        styleObject['transform'] = "rotate(" + angle.toFixed(2) + "deg)";
        //console.log( angle, styleObject.left, styleObject.transform);
        if (value>=0.5) {
          secondHalf = true;
          styleObject['-webkit-transform'] = "rotate(0deg)";
          styleObject['transform'] = "rotate(0deg)";
          elementB.classList.remove('hidden');
        }
      } else {
        var styleObject = elementB.style;
        styleObject['-webkit-transform'] = "rotate(" + angle + "deg)";
        styleObject['transform'] = "rotate(" + angle + "deg)";
      }
    }
    return {
      update: update
    }
  })();

  var init = function() {
    createjs.CSSPlugin.install();
    

    function logoAppear() {
      loadingLogo.classList.add('logo-loading-layout');
/*      logo.style.width = 0;
      logo.style.height = 0;
      createjs.Tween.get(logo).to({width: 141, height:93 }, 500);*/
    }    

    
    
      
    // hook button elements
    playButton.addEventListener('click', onClickPlay );
    playButton.addEventListener('mouseover', onOverButton);
    playButton.addEventListener('touchstart', onClickPlay );
    playButton.addEventListener('touchstart', blockEvent );
    
    muteButton.addEventListener('click', onClickMute );
    muteButton.addEventListener('mousedown', blockEvent );
    muteButton.addEventListener('mouseover', onOverButton);
    muteButton.addEventListener('touchstart', onClickMute );
    muteButton.addEventListener('touchstart', blockEvent );
    
    pauseButton.addEventListener('click', onClickPause );
    pauseButton.addEventListener('mousedown', blockEvent );
    pauseButton.addEventListener('mouseover', onOverButton);
    pauseButton.addEventListener('touchstart', onClickPause );
    pauseButton.addEventListener('touchstart', blockEvent );
    
    resumeButton.addEventListener('click', onClickResume );
    resumeButton.addEventListener('mouseover', onOverButton);
    resumeButton.addEventListener('touchstart', blockEvent );
    resumeButton.addEventListener('touchstart', onClickResume );
    
    restartButton.addEventListener('click', onClickRestart );
    restartButton.addEventListener('mouseover', onOverButton);
    restartButton.addEventListener('touchstart', blockEvent );
    restartButton.addEventListener('touchstart', onClickRestart );
    
    restartButton2.addEventListener('click', onClickRestart );
    restartButton2.addEventListener('mouseover', onOverButton);
    restartButton2.addEventListener('touchstart', blockEvent );
    restartButton2.addEventListener('touchstart', onClickRestart );
    
    quitButton.addEventListener('click', onClickQuit );
    quitButton.addEventListener('mouseover', onOverButton);
    quitButton.addEventListener('touchstart', blockEvent );
    quitButton.addEventListener('touchstart', onClickQuit );
    
    quitButton2.addEventListener('click', onClickQuit );
    quitButton2.addEventListener('mouseover', onOverButton);
    quitButton2.addEventListener('touchstart', blockEvent );
    quitButton2.addEventListener('touchstart', onClickQuit );
    
    stereoButton.addEventListener('click', onClickStereo);
    stereoButton.addEventListener('mouseover', onOverButton);
    surroundButton.addEventListener('click', onClickSurround);
    surroundButton.addEventListener('mouseover', onOverButton);
    
    recommendSafari.addEventListener('mouseover', onOverButton);
    recommendEdge.addEventListener('mouseover', onOverButton);

  
    logoAppear();
    
    galaxies.utils.testAudioSupport( startLoad );
    
    // set background animation keyframe based on window size
    // update this when window is resized
  }
  
  var startLoad = function() {
    
    var handleComplete = function() {
      // Initialize audio context before showing audio controls
      galaxies.audio.initAudio( transitionToMenu );
      
    }
    var handleProgress = function( e ) {
      progressElement.innerHTML = Math.round(e.progress * 100).toString();
      // update ring
      progressRing.update( e.progress );
      //console.log( "Progress", e.progress );
    }
    
    galaxies.loadAssets( handleProgress, handleComplete );
    
  }
  
  var initBgKeyframes = function() {
    
    var bgWidth = 1024 * uiHolder.querySelector('.bg1').offsetHeight/512;
    
    var keyframes = findKeyframesRule("bgscroll1");
    keyframes.deleteRule("100%");
    keyframes.appendRule("100% { background-position: " + bgWidth + "px; }");
    keyframes = findKeyframesRule("bgscroll2");
    keyframes.deleteRule("100%");
    keyframes.appendRule("100% { background-position: " + bgWidth + "px; }");
    
    // assign the animation to our element (which will cause the animation to run)
    //document.getElementById('box').style.webkitAnimationName = anim;
  }
    
  // search the CSSOM for a specific -webkit-keyframe rule
  function findKeyframesRule(rule) {
    // gather all stylesheets into an array
    var ss = document.styleSheets;
    
    // loop through the stylesheets
    for (var i = 0; i < ss.length; ++i) {
      // loop through all the rules
      if ( ss[i].cssRules == null ) { continue; }
      for (var j = 0; j < ss[i].cssRules.length; ++j) {
        
        // find the rule whose name matches our passed over parameter and return that rule
        if ((ss[i].cssRules[j].type == window.CSSRule.KEYFRAMES_RULE) && (ss[i].cssRules[j].name == rule)) {
          return ss[i].cssRules[j];
        }
      }
    }
      
    // rule not found
    return null;
  }
  
  
  var transitionToMenu = function() {
    console.log("Transition loading layout to main menu.");
    
    // Start the music
    // This could be a singleton, but we're just going to instantiate one like this.
    galaxies.audio.soundField = new galaxies.audio.SoundField( galaxies.audio.getSound('music') );
    galaxies.audio.soundField.setVolume(0.24); // 0.24
    
    /*
    var test = document.createElement( 'img' );
    test.src = galaxies.queue.getResult('lux').src;
    document.getElementById('menuHolder').appendChild(test);
    */
    
    // Hide loading logo
    loadingLogo.classList.add('fade-out');
    // Initialize the 3D scene
    galaxies.engine.initScene();
    
    
    
    // Resize title card and reposition
    /*
    loadingLogo.classList.remove('logo-loading-layout');
    loadingLogo.classList.add("logo-final-layout");
    */
    
    // Start title sequence
    titleSequence = new galaxies.TitleSequence();
    titleSequence.activate();
    
    // Wait for skybox fade, then transform play button
    createjs.Tween.get(progressElement)
      .wait(1000)
      .call( transformLoadingIndicator, this );
  }
  
  var transformLoadingIndicator = function() {
    // transition load indicator to play button
    progressElement.style.left = 0;
    createjs.Tween.get(progressElement).to({left:52}, 500, createjs.Ease.quadInOut).call( showPlayButton );
    var start = window.getComputedStyle(playSymbol, null).getPropertyValue("left");
    playSymbol.style.left = start;
    createjs.Tween.get(playSymbol).to({left:0}, 500, createjs.Ease.quadInOut);
    
    
    // Turn on the appropriate recommend link
    if ( !galaxies.utils.supportsEC3 ) {
      if ( galaxies.utils.isOSX() ) {
        recommendSafari.classList.remove('hidden');
        window.getComputedStyle(recommendSafari).bottom; // reflow
        recommendSafari.classList.add('browser-recommend-on');
      } else if ( galaxies.utils.isWindows() ) {
        recommendEdge.classList.remove('hidden');
        window.getComputedStyle(recommendEdge).bottom; // reflow
        recommendEdge.classList.add('browser-recommend-on');
      }
    }
    
    // Show stereo/surround buttons
    if (!galaxies.utils.isMobile() ) {
      audioControls.classList.add("fade-in");
      audioControls.classList.remove("hidden");
    }
    
    // Show mute button
    muteButton.classList.remove("hidden");
    //window.getComputedStyle(muteButton).right; // reflow
    muteButton.classList.add("fade-in");
    
    // Show Dolby logo
    if ( galaxies.utils.supportsEC3 ) {
      dolbyLogo.classList.add("fade-in");
      dolbyLogo.classList.remove("hidden");
    }
    
    
  }
  var showPlayButton = function() {
    loadRing.classList.add("hidden");
    
    playButton.classList.remove("hidden");
  }
  
  var showMenu = function() {
    //gameContainer.classList.add('hidden');
    inGameHolder.classList.add('hidden');
    hidePauseMenu();
    hideGameOver();
    clearTitle();
    
    // Loading logo should be removed
    loadingLogo.classList.remove('fade-out');
    loadingLogo.classList.add('hidden');
    
    titleSequence.activate();
    loadingHolder.classList.remove('hidden');
  }
  
  var showPauseButton = function() {
    pauseButton.classList.remove('hidden');
    window.getComputedStyle(pauseButton).left; // reflow
    pauseButton.classList.add('pause-button-on');
  }
  var hidePauseButton = function() {
    pauseButton.classList.remove('pause-button-on');
    pauseButton.classList.add('hidden');
  }
  
  /**
   * Show a title as yellow text that animates up and down from the bottom
   * of the screen. A title of 0 time will not be removed until titles are
   * manually cleared.
   */
  var titleQueue = [];
  var titleActive = false;
  var currentTitle = null;
  var showTitle = function( titleText, time ) {
    var newTitle = {
      text: titleText,
      time: time * 1000
    };
    
    titleQueue.push( newTitle );
    
    if ( (!titleActive) || (currentTitle.time===0) ) {
      updateTitle();
    }
  }
  var updateTitle = function() {
    if ( titleQueue.length == 0 ) {
      clearTitle();
      return;
    }
    
    titleActive = true;
    var nextTitle = titleQueue.shift();
    
    title.innerHTML = nextTitle.text;
    title.classList.remove('hidden');
    window.getComputedStyle(title).top; // reflow
    
    title.classList.add('title-on');
    
    createjs.Tween.removeTweens( title );
    if ( nextTitle.time > 0 ) {
      createjs.Tween.get( title )
        .wait( nextTitle.time )
        .call( function() { title.classList.remove('title-on'); }, this )
        .wait( 1000 ) // CSS transition time
        .call( updateTitle );
    }
    
    currentTitle = nextTitle;
  }
  var clearTitle = function() {
    title.classList.remove('title-on');
    title.classList.add('hidden');
    titleQueue = [];
    currentTitle = null;
    
    createjs.Tween.removeTweens( title );
    titleActive = false;
  }
  
  // Stop event from reaching other listeners.
  // Used to keep ui buttons from causing fire events on underlying game element.
  var blockEvent = function(e) {
    
    e.stopPropagation();
    
  }

  /// Start the game
  var onClickPlay = function(e) {
    loadingHolder.classList.add('hidden');
    titleSequence.deactivate();
    
    //gameContainer.classList.remove('hidden');
    inGameHolder.classList.remove('hidden');
    showPauseButton();
    
    if ( galaxies.engine.gameInitialized ) {
      galaxies.engine.restartGame();
    } else {
      galaxies.engine.initGame();
    }
  }
  
  var onClickMute = function(e) {
    e.preventDefault();
    
    // Change the mute state
    galaxies.audio.toggleMuteState();
    
    // Update the button class
    if ( galaxies.audio.muteState === 'music' ) {
      
    } else if ( galaxies.audio.muteState === 'all' ) {
      
    } else {
      
    }
    
    console.log("Toggle mute");
  }
  
  var onClickPause = function(e) {
    e.preventDefault();
    
    pauseOverlay.classList.remove('hidden');
    window.getComputedStyle(pauseOverlay).top; // reflow
    pauseOverlay.classList.add('pause-overlay-on');
    
    pauseHolder.classList.remove('hidden');
    window.getComputedStyle(pauseTitle).top; // reflow
    pauseTitle.classList.add('pause-title-on');
    
    galaxies.engine.pauseGame();
  }
  var onClickResume = function(e) {
    hidePauseMenu();
    galaxies.engine.resumeGame();
  }
  var onClickRestart = function(e) {
    hidePauseMenu();
    hideGameOver();
    
    galaxies.engine.restartGame();
  }
  var onClickQuit = function(e) {
    hidePauseMenu();
    
    galaxies.engine.endGame();
  }
  var hidePauseMenu = function() {
    pauseTitle.classList.remove('pause-title-on');
    window.getComputedStyle(pauseTitle).top; // reflow
    
    pauseHolder.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    pauseOverlay.classList.remove('pause-overlay-on');
    
  }
  
  
  var onClickStereo = function(e) {
    galaxies.audio.toggleTargetMix( false );
  }
  var onClickSurround = function(e) {
    galaxies.audio.toggleTargetMix( true );
  }
  var setMixButtons = function( isSurround ) {
    if ( isSurround ) {
      stereoButton.classList.remove('active');
      surroundButton.classList.add('active');
    } else {
      stereoButton.classList.add('active');
      surroundButton.classList.remove('active');
    }
  }
  
  function onOverButton(e) {
    galaxies.audio.playSound( galaxies.audio.getSound('buttonover') );
  }
  
  
  
  var showGameOver = function() {
    gameOverHolder.classList.remove('hidden');
    
    window.getComputedStyle(gameOverTitle).top; // reflow
    gameOverTitle.classList.add('game-over-title-on');
    
    showTitle( "SCORE " +
               scoreDisplay.innerHTML +
               "<br>" +
               levelDisplay.innerHTML, 0);
  }
  var hideGameOver = function() {
    gameOverTitle.classList.remove('game-over-title-on');
    window.getComputedStyle(gameOverTitle).top; // reflow
    
    gameOverHolder.classList.add('hidden');
  }
  
  var updateLevel = function( newPlanetNumber, roundNumber ) {
    levelDisplay.innerHTML = "WORLD " + newPlanetNumber.toString() + "-" + roundNumber.toString();;
  }
  var updateScore = function( newScore ) {
    scoreDisplay.innerHTML = newScore.toString();
  }
  var updateLife = function( newLifeValue ) {
    for ( var i=0; i<lifeHearts.length; i++ ) {
      if ( (i+1)<=newLifeValue ) {
        lifeHearts[i].classList.remove('empty');
      } else {
        lifeHearts[i].classList.add('empty');
      }
    }
  }
  var updatePowerupCharge = function( newValue ) {
    powerupCharge.innerHTML = newValue.toFixed(2);
  }

  return {
    init: init,
    gameContainer: gameContainer,
    showMenu: showMenu,
    showGameOver: showGameOver,
    showPauseButton: showPauseButton,
    hidePauseButton: hidePauseButton,
    showTitle: showTitle,
    clearTitle: clearTitle,
    updateLevel: updateLevel,
    updateScore: updateScore,
    updateLife: updateLife,
    updatePowerupCharge: updatePowerupCharge,
    setMixButtons: setMixButtons
  };
  
  
}());




"use strict";
/** Utilities
 * A collection of miscellaneous functions and definitions. This includes
 * things like ExhaustiveArray, feature detection, and custom easing functions.
 * 
 */

this.galaxies = this.galaxies || {};

galaxies.utils = this.galaxies.utils || {};

galaxies.utils.PI_2 = Math.PI * 2;

// A linear tapered sinusoidal easing function.
// Used for shaking camera.
galaxies.utils.getShakeEase = function ( frequency ) {
  return function( t ) {
    var val = Math.cos( t * frequency ) * (1-t);
    //console.log(t, val);
    return val;
  };
};

// Identify desktop platforms to recommend correct browser with EC-3.
galaxies.utils.isOSX = function() {
  var agt = navigator.userAgent;
  return ( /Mac OS X/.test(agt) && !/iphone/i.test(agt) && !/ipad/i.test(agt) && !/ipod/i.test(agt) );
}
galaxies.utils.isWindows = function() {
  var agt = navigator.userAgent;
  return ( /Windows/.test(agt) && !/phone/i.test(agt) );
}

galaxies.utils.isMobile = function() {
  var agt = navigator.userAgent;
  return /iPhone|iPad|iPod|Android|windows phone|iemobile|\bsilk\b/i.test(agt);
}

// Identify which audio format to use.
galaxies.utils.testAudioSupport = function( callback ) {
  // Has test been run?
  if ( typeof( galaxies.utils.supportsOGG ) !== 'undefined' ) {
    callback();
    return;
  }
  
  // Test OGG
  var oggTester = document.createElement("audio"); // Construct new Audio object
  var codecString = 'audio/ogg;codecs="vorbis"';
  galaxies.utils.supportsOGG = (oggTester.canPlayType(codecString)==='probably'); // cast to boolean
  console.log( "Supports OGG?", galaxies.utils.supportsOGG );
  //
  
  // Test EC-3
  // Note: Feature detection with MediaSource returns incorrect result in Safari 8. 
  // This code was created by Dolby.
  // https://github.com/DolbyDev/Browser_Feature_Detection
  var video = document.createElement('video');

  if (video.canPlayType('audio/mp4;codecs="ec-3"') === '' || video.canPlayType('audio/mp4;codecs="ac-3"') === '') {
      galaxies.utils.supportsEC3 = false;
      callback();
  } else {
      var audio = new Audio();
      audio.muted = true;
      audio.addEventListener('error', function () {
          galaxies.utils.supportsEC3 = false;
          callback();
      }, false);
      audio.addEventListener('seeked', function () {
          galaxies.utils.supportsEC3 = true;
          callback();
      }, false);

      audio.addEventListener('canplaythrough', function () {
          try {
              audio.currentTime = 2;
          } catch (e) {
            callback();
          }
      }, false);
      audio.src = 'audio/silence.mp4';
      audio.play();
  }  
}

// Will it run?
// Exclude browsers that do not support WebGL and WebAudio.
galaxies.utils.isSupportedBrowser = function() {
  // Test for WebGL support
  var canvas;
  var ctx;
  var exts;
  
  try {
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  }
  catch (e) {
    return false;
  }
  if (ctx === undefined) { return false; }
  canvas = undefined;
  //
  
  // Test for WebAudio support
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  if ( AudioContext == null ) { return false; }
  //
  
  return true;
}


/// Takes an array and returns its contents in a randomized order.
galaxies.ExhaustiveArray = function() {
  var objects = [];
  var index = 0;
  
  var shuffle = function() {
    for (var i=0; i<objects.length; i++ ) {
      var randomIndex = Math.floor( Math.random() * (i+1) );
      var temp = objects[randomIndex];
      objects[randomIndex] = objects[i];
      objects[i] = temp;
    }
  }
  
  this.add = function( item ) {
    objects.push(item);
  }
  
  this.init = function() {
    index = 0;
    shuffle();
  }
  
  this.next = function() {
    var nextObject = objects[index];
    
    if ( objects.length > 1 ) {
      index++;
      if ( index >= objects.length ) {
        index = 0;
        shuffle();
      }
    }
    
    return nextObject;
  }
  
  shuffle();
  
}



galaxies.utils.flatLength = function( vector ) {
  return Math.sqrt( Math.pow(vector.x, 2) + Math.pow(vector.y,2) );
}
galaxies.utils.flatLengthSqr = function(vector ) {
  return (Math.pow(vector.x, 2) + Math.pow(vector.y,2));
}

galaxies.utils.rootPosition = function( object ) {
  var foo = object.position.clone();
  if ((object.parent == null) || (galaxies.engine.rootObject==null) ) {
    return foo;
  } else {
    return galaxies.engine.rootObject.worldToLocal( object.parent.localToWorld( foo ) );
  }

}

/// Set z-position for objects to map x-y plane to a cone.
//var parabolicConeSlope = coneSlope/3; // This constant here is related to the radius value used by obstacles
galaxies.utils.conify = function( object ) {
  object.position.setZ( galaxies.utils.getConifiedDepth( object.position ) );
}
galaxies.utils.getConifiedDepth = function( position ) {
  // linear
  return ( (galaxies.utils.flatLength(position)/galaxies.engine.CONE_SLOPE) );
  // parabolic
  //return ( galaxies.utils.flatLengthSqr(position) * parabolicConeSlope - 0 );
}








// Patch SPE to allow negative speeds to make sphere particles move inwards.
// This is used by the UFO laser charge effect.
SPE.Emitter.prototype.randomizeExistingVelocityVector3OnSphere = function( v, base, position, speed, speedSpread ) {
        v.copy( position )
            .sub( base )
            .normalize()
            .multiplyScalar( this.randomFloat( speed, speedSpread ) );
            //.multiplyScalar( Math.abs( this.randomFloat( speed, speedSpread ) ) );
};



