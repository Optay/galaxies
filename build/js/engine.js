'use strict'

var audioCtx;

// TODO - set up detection and/or hook to menu control
// use surround when true, fallback to stereo mix when false
var surroundMix = true;

var AUDIBLE_RANGE = 10;
var DISTANCE_ATTENUATION = 0.1;//0.05;
var DISTANCE_REF = 2;
var DISTANCE_ROLL = 1;
var DIRECTION_FOCUS = 1; // How much sounds spread to neighboring speakers: higher values produces sharper spatialization, lower values spread sound more evenly
var DOPPLER_FACTOR = 70; // Higher numbers result in less doppler shift.

var listener;
var listenerObject;

var soundField;


// collection of AudioBuffer objects
var loadedSounds = {};

// Create a new AudioBufferSource node for a given sound.
function getSound( id, loop ) {
  if ( typeof(loop) ==='undefined' ) { loop = true; }
  
  if ( typeof( loadedSounds[id]) === 'undefined' ) {
    console.log("Requested sound not loaded.", id)
    return;
  }
  var source = audioCtx.createBufferSource();
  source.buffer = loadedSounds[id].next();
  source.loop = loop;
  
  return source;
}

/*
var sounds = {
  'shoot': ['shuttlecock_release_01.ogg', 'shuttlecock_release_02.ogg', 'shuttlecock_release_03.ogg', 'shuttlecock_release_04.ogg', 'shuttlecock_release_05.ogg'],
  'asteroidexplode': ['asteroid_explode_01.ogg', 'asteroid_explode_02.ogg', 'asteroid_explode_03.ogg'],
  'cometexplode': ['comet_explode_01.ogg'],
  'cometloop': ['comet_fire_loop.ogg'],
  'fpo': ['Beep Ping-SoundBible.com-217088958.mp3', 'Robot_blip-Marianne_Gagnon-120342607.mp3', 'Robot_blip_2-Marianne_Gagnon-299056732.mp3'],
  'ufo': ['ufo_engine_loop_01.ogg'],
  'music': ['5.1 Test_music.ogg'],
  'ufohit': ['ufo_hit_01.ogg', 'ufo_hit_02.ogg'],
  'ufoshoot': ['UFO_laser_fire.ogg']
};*/

// This structure combines groups of sounds together for constructing exhaustive arrays.
var sounds = {
  'shoot': ['shoot1', 'shoot2', 'shoot3', 'shoot4', 'shoot5'],
  'asteroidexplode': ['asteroidexplode1', 'asteroidexplode2', 'asteroidexplode3'],
  'cometexplode': ['cometexplode'],
  'cometloop': ['cometloop'],
  'fpo': ['fpo1', 'fpo2', 'fpo3'],
  'ufo': ['ufo'],
  'music': ['music'],
  'ufohit': ['ufohit1', 'ufohit2'],
  'ufoshoot': ['ufoshoot'],
  'planetsplode': ['planetsplode']
}

// Decode and package loaded audio data into exhaustive array objects.
function initAudio( complete ) {
  canPlayEC3 = galaxies.utils.supportsEC3();
  
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();
  listener = audioCtx.listener;
  //audioCtx.destination.maxChannelCount = 6;
  console.log( "Output channels?", audioCtx.destination.channelCountMode, audioCtx.destination.channelCount, audioCtx.destination.maxChannelCount );
  console.log( 0 !== null );

  var onComplete = complete;

  var soundIds = Object.keys(sounds);
  
  var remaining = 0;
  for( var i=0; i<soundIds.length; i++ ) {
    remaining += sounds[ soundIds[i] ].length;
  }
  

  for( var i=0; i<soundIds.length; i++ ) {
    loadedSounds[ soundIds[i] ] = new ExhaustiveArray();
    for ( var j=0; j<sounds[ soundIds[i] ].length; j++ ) {
      //console.log( sounds[soundIds[i]][j] );
      //console.log( queue.getResult( sounds[soundIds[i]][j]) );
      decodeFile( soundIds[i], sounds[soundIds[i]][j] );
    }
  }
  
  function decodeFile( soundId, fileId ) {
    var loadedId = soundId;
    audioCtx.decodeAudioData( queue.getResult( fileId, true ),
      function(buffer) {
        //console.log("decoded", loadedId );
        loadedSounds[ loadedId ].add( buffer );  
        fileComplete();
      },
      function() {
        console.log( "Error decoding audio file.", loadedId );
        fileComplete();
      } );
  }

  function fileComplete() {
    remaining --;
    if ( remaining <= 0 ) {
      loadComplete();
    }
  }
  
  function loadComplete() {
    // perform initial shuffle on exhaustive arrays
    var soundIds = Object.keys(loadedSounds);
    for( var i=0; i<soundIds.length; i++ ) {
      loadedSounds[ soundIds[i] ].init();
    }
    
    // fire callback
    onComplete();
  }
  
  
}


function SoundLoader( complete ) {
  var onComplete = complete;
  
  var audioPath = 'audio/';
  var soundIds = Object.keys(sounds);
  
  var remaining = 0;
  for( var i=0; i<soundIds.length; i++ ) {
    remaining += sounds[ soundIds[i] ].length;
  }
  
  for( var i=0; i<soundIds.length; i++ ) {
    loadedSounds[ soundIds[i] ] = new ExhaustiveArray();
    for ( var j=0; j<sounds[ soundIds[i] ].length; j++ ) {
      loadSound( soundIds[i], sounds[ soundIds[i] ][j] );
    }
  }
  
  // use XHR to load an audio track, and
  // decodeAudioData to decode it and stick it in a buffer.
  function loadSound( id, uri ) {
    var request = new XMLHttpRequest();
    var loadedId = id;
    
    uri = audioPath + uri;
    
    //request.open('GET', 'Test-intro_01.ogg', true);
    request.open('GET', uri, true);
  
    request.responseType = 'arraybuffer';
    request.onload = function() {
      var audioData = request.response;
  
      audioCtx.decodeAudioData(audioData,
        function(buffer) {
          loadedSounds[ loadedId ].add( buffer );
          fileComplete();
        },
  
        function() {
          console.log( "Error decoding audio file.", loadedId );
          fileComplete();
        } );
    }
  
    request.send();
  }
  
  function fileComplete() {
    remaining --;
    if ( remaining <= 0 ) {
      loadComplete();
    }
  }
  
  function loadComplete() {
    // perform initial shuffle on exhaustive arrays
    var soundIds = Object.keys(loadedSounds);
    for( var i=0; i<soundIds.length; i++ ) {
      loadedSounds[ soundIds[i] ].init();
    }
    
    // fire callback
    onComplete();
  }
}

/// Takes an array and returns its contents in a randomized order.
function ExhaustiveArray() {
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






var channelAngles = [
  Math.PI/4,    // L
  -Math.PI/4,     // R
  0,             // C
  null,          // LFE
  3*Math.PI/4,  // SL
  -3*Math.PI/4    // SR
];

var directionalSources = [];

/*
/// Start a mono source mixed for a fixed location. No reference will be kept,
/// sound will play once and expire. Provided position should be relative to root object.
function playSound( source, position, volume ) {
  source.loop = false; // force sound to not loop
  var combiner = audioCtx.createChannelMerger();
  
  for ( var iOutput=0; iOutput<6; iOutput++ ) {
    
    var toSource = new THREE.Vector3();
    toSource.subVectors( position, listenerObject.position );
    
    // TODO - Evaluate this against the listener object direction for a more versatile system.
    //        Transform the vector into the listener local space.
    var bearing = Math.atan2( -toSource.x, -toSource.z );
    var distance = toSource.length();
    var inPlaneWeight = 0;
    if (distance > 0) { inPlaneWeight = Math.sqrt( Math.pow(toSource.x,2) + Math.pow(toSource.z,2) ) / distance; }
    
    // base level based on distance
    var gain = volume * 1 / Math.exp(distance * DISTANCE_ATTENUATION);
    if ( channelAngles[iOutput] !== null ) {
      // exponential falloff function
      // calculate short distance between the angles
      var angleDifference = ((channelAngles[iOutput] - bearing) + PI_2 + Math.PI) % PI_2 - Math.PI;
      var directionAttenuation = Math.exp( -angleDifference * angleDifference * DIRECTION_FOCUS );
      
      gain = (gain/2) * (1-inPlaneWeight) + 
             gain * (directionAttenuation) * inPlaneWeight;
    }
    
    var newGainNode = audioCtx.createGain();
    newGainNode.gain.value = gain;   // start silent to avoid loud playback before initial mix call
    source.connect( newGainNode );
    newGainNode.connect( combiner, 0, iOutput );
  }
  
  combiner.connect(audioCtx.destination);
  source.start(0);
}
*/

/// Creates a sound that is mixed based on its position in 3D space.
function PositionedSound( source, position, baseVolume ) {
  this.source = source;
  this.toSource = new THREE.Vector3(); // vector from listener to source
  
  this.muteVolume = audioCtx.createGain();
  this.source.connect( this.muteVolume );
  
  this.preAmp = audioCtx.createGain();
  this.muteVolume.connect( this.preAmp );
  Object.defineProperty(this, "volume", { set:
    function (value) {
      this._volume = value;
      this.preAmp.gain.value = this._volume;
    }
  });
  if ( typeof( baseVolume ) ==='undefined' ) { baseVolume = 1; }
  this.volume = baseVolume;
  
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
      this.combiner.disconnect( audioCtx.destination );
      this.combiner = null;
    }
    if ( this.panner!=null ) {
      this.preAmp.disconnect( this.panner );
      this.panner.disconnect( audioCtx.destination );
      this.panner = null;
    }
    //
    
    if ( surroundMix ) {
      // initialize 6-channel mix
      this.combiner = audioCtx.createChannelMerger();
      for ( var i=0; i<6; i++ ) {
        var newGainNode = audioCtx.createGain();
        newGainNode.gain.value = 0;   // start silent to avoid loud playback before initial mix call
        this.preAmp.connect( newGainNode );
        newGainNode.connect( this.combiner, 0, i );
        this.channels[i] = newGainNode;
      }
      this.combiner.connect(audioCtx.destination);
    } else { 
      // initialize stereo mix
      this.panner = audioCtx.createPanner();
      this.panner.panningModel = 'HRTF';
      this.panner.distanceModel = 'inverse';
      this.panner.refDistance = 2;
      this.panner.maxDistance = 10000;
      this.panner.rolloffFactor = 1;
      this.panner.coneInnerAngle = 360;
      this.panner.coneOuterAngle = 0;
      this.panner.coneOuterGain = 0;
      this.preAmp.connect( this.panner );
      this.panner.connect( audioCtx.destination );
    }
  }
  
  this.updatePosition = function( newPosition ) {
    // TODO - Evaluate this against the listener object direction for a more versatile system.
    //        Transform the vector into the listener local space.
    this.toSource.subVectors( newPosition, listenerObject.position );
    this.distance = this.toSource.length();
    
    if ( surroundMix ) {
      this.bearing = Math.atan2( -this.toSource.x, -this.toSource.z );
      this.inPlaneWeight = 0;
      if (this.distance > 0) { this.inPlaneWeight = Math.sqrt( Math.pow(this.toSource.x,2) + Math.pow(this.toSource.z,2) ) / this.distance; }
      for(var iOutput = 0; iOutput<6; iOutput++ ) {
        
        // base level based on distance
        var gain = DISTANCE_REF / (DISTANCE_REF + DISTANCE_ROLL * (this.distance - DISTANCE_REF)); // linear, to match panner algorithm in stereo mix
        //var gain = 1 / Math.exp(this.distance * DISTANCE_ATTENUATION); // exponential
        if ( channelAngles[iOutput] !== null ) {
          // cosine falloff function
          //var directionAttenuation = (Math.cos( channelAngles[iOutput] - source.bearing ) + 1)/2;
          
          // exponential falloff function
          // calculate short distance between the angles
          var angleDifference = ((channelAngles[iOutput] - this.bearing) + PI_2 + Math.PI) % PI_2 - Math.PI;
          var directionAttenuation = Math.exp( -angleDifference * angleDifference * DIRECTION_FOCUS );
          
          gain =  (gain/2) * (1-this.inPlaneWeight) + 
                  gain * (directionAttenuation) * this.inPlaneWeight;
        }
        this.channels[iOutput].gain.value = gain; //  apply resulting gain to channel
      }          
    } else {
      // exagerrate the horizontal position of the object in order to get better stereo separation
      this.panner.setPosition( newPosition.x, newPosition.y, newPosition.z );
    }
  }
  
  this.init();
  this.updatePosition( position ); // set initial mix
  
  this.source.start(0);
}

/// Object sound wraps a positioned sound, attaching the sound's position to an object.
function ObjectSound( source, object, baseVolume ) {
  this.object = object;
  this.sound = new PositionedSound( source, rootPosition( object ), baseVolume );
 
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
    this.sound.updatePosition( rootPosition( this.object ) );
    
    var deltaDistance = (this.lastDistance - this.sound.distance)/delta;
    this.sound.source.playbackRate.value = 1 + (deltaDistance/DOPPLER_FACTOR);
    this.lastDistance = this.sound.distance;
  }
/*
  if ( !source.loop ) {
    //console.log( "start", this.source, directionalSources.length );
    var selfReference = this; // self reference
    source.onended = function() { removeSource(selfReference); };
  }*/
}

/*
/// A mono source that is mixed based on its position in space relative to the
/// listener object.
function DirectionalSource( source, object, baseVolume ) {
  this.object = object;
  this.source = source;
  
  this.lastDistance = 0;
  this.velocity = 0;
  
  this.preAmp = audioCtx.createGain();
  this.source.connect( this.preAmp );
  if ( typeof( baseVolume ) ==='undefined' ) { baseVolume = 1; }
  this.preAmp.gain.value = baseVolume;
  
  
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
      this.combiner.disconnect( audioCtx.destination );
      this.combiner = null;
    }
    if ( this.panner!=null ) {
      this.preAmp.disconnect( this.panner );
      this.panner.disconnect( audioCtx.destination );
      this.panner = null;
    }
    //
    
    if ( surroundMix ) {
      // initialize 6-channel mix
      this.combiner = audioCtx.createChannelMerger();
      for ( var i=0; i<6; i++ ) {
        var newGainNode = audioCtx.createGain();
        newGainNode.gain.value = 0;   // start silent to avoid loud playback before initial mix call
        this.preAmp.connect( newGainNode );
        newGainNode.connect( this.combiner, 0, i );
        this.channels[i] = newGainNode;
      }
      this.combiner.connect(audioCtx.destination);
    } else { 
      // initialize stereo mix
      this.panner = audioCtx.createPanner();
      this.panner.panningModel = 'HRTF';
      this.panner.refDistance = 10;
      this.panner.maxDistance = 10000;
      this.panner.rolloffFactor = 1;
      this.panner.coneInnerAngle = 360;
      this.panner.coneOuterAngle = 0;
      this.panner.coneOuterGain = 0;
      this.preAmp.connect( this.panner );
      this.panner.connect( audioCtx.destination );
    }
  }
  
  this.update = function( delta ) {
    // update listener position
    if ( (this.object != null) && (this.object.parent != null) ) {
      // TODO - Evaluate this against the listener object direction for a more versatile system.
      //        Transform the vector into the listener local space.
      var toSource = new THREE.Vector3();
      var objectRootPosition = rootPosition( this.object );
      toSource.subVectors( objectRootPosition, listenerObject.position );
      
      this.distance = toSource.length();
      var deltaDistance = (this.lastDistance - this.distance)/delta;
      this.source.playbackRate.value = 1 + (deltaDistance/DOPPLER_FACTOR);
      this.lastDistance = this.distance;
      
      if ( surroundMix ) {
        this.bearing = Math.atan2( -toSource.x, -toSource.z );
        this.inPlaneWeight = 0;
        if (this.distance > 0) { this.inPlaneWeight = Math.sqrt( Math.pow(toSource.x,2) + Math.pow(toSource.z,2) ) / this.distance; }
        for(var iOutput = 0; iOutput<6; iOutput++ ) {
          
          // base level based on distance
          var gain = 1 / Math.exp(this.distance * DISTANCE_ATTENUATION);
          if ( channelAngles[iOutput] !== null ) {
            // cosine falloff function
            //var directionAttenuation = (Math.cos( channelAngles[iOutput] - source.bearing ) + 1)/2;
            
            // exponential falloff function
            // calculate short distance between the angles
            var angleDifference = ((channelAngles[iOutput] - this.bearing) + PI_2 + Math.PI) % PI_2 - Math.PI;
            var directionAttenuation = Math.exp( -angleDifference * angleDifference * DIRECTION_FOCUS );
            
            gain =  (gain/2) * (1-this.inPlaneWeight) + 
                    gain * (directionAttenuation) * this.inPlaneWeight;
          }
          this.channels[iOutput].gain.value = gain; //  apply resulting gain to channel
        }          
      } else {
        // exagerrate the horizontal position of the object in order to get better stereo separation
        this.panner.setPosition( objectRootPosition.x * 20, objectRootPosition.y, objectRootPosition.z );
      }
    }
  }
  
  this.init();
  
  
  this.source.start(0);
  if ( !this.source.loop ) {
    //console.log( "start", this.source, directionalSources.length );
    var ds = this; // self reference
    this.source.onended = function() { removeSource(ds); };
  }
  
}
*/

/// Update the mix for directional sources.
function mixChannels( delta ) {
  
  for( var i=0; i<directionalSources.length; i++ ) {
    directionalSources[i].update( delta );
    
    /*
    var source = directionalSources[i];
    
    // update listener position
    if ( (source.object != null) && (source.object.parent != null) ) {
      var toSource = new THREE.Vector3();
      toSource.subVectors( rootPosition( source.object ), listenerObject.position );
      
      // TODO - Evaluate this against the listener object direction for a more versatile system.
      //        Transform the vector into the listener local space.
      source.bearing = Math.atan2( -toSource.x, -toSource.z );
      source.distance = toSource.length();
      source.inPlaneWeight = 0;
      if (source.distance > 0) { source.inPlaneWeight = Math.sqrt( Math.pow(toSource.x,2) + Math.pow(toSource.z,2) ) / source.distance; }
      
      var deltaDistance = (source.lastDistance - source.distance)/delta;
      
      source.source.playbackRate.value = 1 + (deltaDistance/DOPPLER_FACTOR);
      source.lastDistance = source.distance;
    }
    
    for(var iOutput = 0; iOutput<6; iOutput++ ) {
      
      // base level based on distance
      var gain = 1 / Math.exp(source.distance * DISTANCE_ATTENUATION);
      if ( channelAngles[iOutput] !== null ) {
        // cosine falloff function
        //var directionAttenuation = (Math.cos( channelAngles[iOutput] - source.bearing ) + 1)/2;
        
        // exponential falloff function
        // calculate short distance between the angles
        var angleDifference = ((channelAngles[iOutput] - source.bearing) + PI_2 + Math.PI) % PI_2 - Math.PI;
        var directionAttenuation = Math.exp( -angleDifference * angleDifference * DIRECTION_FOCUS );
        
        gain =  (gain/2) * (1-source.inPlaneWeight) + 
                gain * (directionAttenuation) * source.inPlaneWeight;
      }
      //console.log( toSource, bearing, gain );
      //gain *= 0.5; // global gain adjustment
      //console.log( iOutput, iSource, gain );
      source.channels[iOutput].gain.value = gain; //  apply resulting gain to channel
    }*/
  }
  
  //visualizeSource( directionalSources[0] );
  
}


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
}

/*
function removeSource( source ) {
  directionalSources.splice( directionalSources.indexOf( source ), 1 );
}*/







// List of the channel indices used by SoundField.
// Only L, R, SL, and SR channels are rotated, so we list the corresponding indices here.
var channelMap = [0, 1, 4, 5];
var playThrough = [2, 3];

/// A multi-channel source that is mixed based on an arbitrary angle which
/// rotates the soundfield.
function SoundField( source ) {
  this.source = source;
  this.angle = 0;
  this.angularVelocity = 1;
  
  // Add input
  var volumeNode = audioCtx.createGain();
  this.source.connect( volumeNode );
  var splitter = audioCtx.createChannelSplitter(6);
  volumeNode.connect( splitter );
  var combiner = audioCtx.createChannelMerger(6);
  combiner.connect(audioCtx.destination);
  
  this.gains = [];
  
  // hook up channels that will not be remixed directly
  for (var i=0; i<playThrough.length; i++ ) {
    splitter.connect(combiner, playThrough[i], playThrough[i] );
  }
  
  // Add gain nodes for mixing moving channels
  for ( var iOutput = 0; iOutput<channelMap.length; iOutput ++ ) {   // into each output channel
    this.gains[iOutput] = [];
    for (var iSource=0; iSource<channelMap.length; iSource++ ) {     // mix the source channels
      var newGainNode = audioCtx.createGain();
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
  
  
}

/// Update the mix of multichannel output based on the position of the source.
function updateSoundField( delta ) {
  soundField.angle += soundField.angularVelocity * delta;
  
  for( var iOutput = 0; iOutput<channelMap.length; iOutput++ ) {
    for(var iSource = 0; iSource<channelMap.length; iSource++ ) {
      var gain;
      if ( channelAngles[channelMap[iSource]] !== null ) {
        //gain = soundField.volume * Math.pow( (Math.cos( channelAngles[iOutput] - (channelAngles[iSource] + soundField.angle) ) + 1)/2, 1);
        gain = (Math.cos( channelAngles[channelMap[iOutput]] - (channelAngles[channelMap[iSource]] + soundField.angle) ) + 1)/2;
      }
      soundField.gains[iOutput][iSource].gain.value = gain; //  apply resulting gain to channel
    }
  }
}


function toggleTargetMix( value ) {
  surroundMix = value;
  
  // Re-initialize active sources using new mix
  for( var i=0; i<obstacles.length; i++ ) {
    if ( obstacles[i].passSound != null ) {
      obstacles[i].passSound.sound.init();
    }
  }
  if ( ufo!=null ) {
    ufo.ufoSound.sound.init();
  }
  
  // Set destination channel count to match
  if ( ( surroundMix )  ) {
    if ( audioCtx.destination.maxChannelCount >= 6 )  { audioCtx.destination.channelCount = 6; }
  } else {
    if ( audioCtx.destination.maxChannelCount >= 2 ) { audioCtx.destination.channelCount = 2; }
  }
}




  
















"use strict";

/// Rename this 'Obstacle'
function Asteroid( props ) {
  var PLANET_DISTANCE = 1.25;
  var RICOCHET_SPEED = 0.35;
  
  this.particleGroup = props.particleGroup;
  
  this.points = props.points;
  this.speed = props.speed * speedScale;
  this.orient = props.orient;
  
  this.explodeType = props.explodeType;
  
  var angle = 0;
  //var angularSpeed = this.speed/radius;
  
  var tumble = props.tumble;
  var tumbling = tumble;
  var tumbleAxis = new THREE.Vector3();
  var tumbleOnHit = props.tumbleOnHit;
  var baseTumbleSpeed = 1.5;
  var tumbleSpeed = baseTumbleSpeed;
  
  var velocity = new THREE.Vector3();
  
  //this.falling = false;
  var fallSpeed = 8;
  var fallTimer = 0;
  var fallTime = 0;
  var spiralTime = props.spiral * 60 + 1;
  
  //this.ricochet = false;
  this.ricochetCount = 0;
  
  // state values: waiting, falling, ricocheting, inactive
  this.state = 'waiting';
  this.isActive = false; // will the object accept interactions
  
  this.object = props.anchor;
  this.object.up.set(0,0,1);
  
  this.model = props.model;
  
  //var axisHelper = new THREE.AxisHelper( 2 );
  //this.object.add( axisHelper );  
  
  var material;
  if ( this.model != null ) {
    material = this.model.material;
  }
  
  /*
  var geometry = _geometry;
  if ( typeof(_geometry)==='undefined' ) {
    geometry = new THREE.BoxGeometry( 0.7, 0.7, 0.7 );
  }
  
  // Ghetto color difference between objects (didn't want to pass in another parameter)
  var objectColor = new THREE.Color( this.points/500, this.points/500, this.points/500 );
  var material = new THREE.MeshLambertMaterial( {
      color: objectColor.getHex(),
      opacity: 0.4,
      transparent: false,
      emissive: 0x555555,
      shading: THREE.SmoothShading } );//THREE.FlatShading
  
  this.object = new THREE.Mesh( geometry, material );
  this.object.scale.set( scale, scale, scale );
  /*
  var objLoader = new THREE.OBJLoader();
  this.object = objLoader.parse( queue.getResult('asteroidmodel') );
  this.object.material = material;
  this.object.scale.set(0.5, 0.5, 0.5);*/
  
  
  // Sound
  var explodeSound = props.explodeSound;
  this.passSound = null;
  if ( props.passSound != null ) {
    //console.log(_passSoundId);
    this.passSound = new ObjectSound( getSound( props.passSound, true), this.object, 0 );
    //directionalSources.push(passSound);
  }
  
  var clearDistance = OBSTACLE_VISIBLE_RADIUS * 1.2;
  var startDistance = OBSTACLE_VISIBLE_RADIUS * 1.2;
  if (this.passSound != null ) {
    startDistance = OBSTACLE_VISIBLE_RADIUS * 2;
  }
  
  this.resetPosition= function() {
      angle = Math.random()*Math.PI*2;
      var position = new THREE.Vector3( Math.cos(angle), Math.sin(angle), 0 );
      
      position.multiplyScalar( startDistance );
      this.object.position.copy(position);
      this.object.lookAt( new THREE.Vector3() );
      
      if ( material!=null) {
        material.transparent = false;
      }
      
      this.state = 'waiting';
      this.isActive = false;
      fallTime = Math.random() * 10 + 1;
      fallTimer = 0;
      velocity.set(0,0,0);
      
      tumbleAxis.set( Math.random()*2 -1, Math.random()*2 -1, Math.random()*2 -1 );
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
      var radius = flatLength( this.object.position );
      if ( radius > clearDistance ) { this.destroy(); }
      if ( this.isActive && (radius > OBSTACLE_VISIBLE_RADIUS ) ) {
        this.isActive = false;
        if ( material!=null) {
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
      
      var radius = flatLength( this.object.position );
      if (( radius <= PLANET_DISTANCE ) && (velocity.length() < PLANET_DISTANCE) ) {
        // This order is very important as hitPlayer may trigger game over which
        // must override the obstacle's state.
        this.destroy();
        hitPlayer();
        break;
      }
      if ( radius < OBSTACLE_VISIBLE_RADIUS ) { this.isActive = true; }
      this.object.position.add( velocity );
      
      /*
      // clamp vertical position
      if ( this.object.position.y < -OBSTACLE_START_RADIUS ) { this.object.position.setY( -OBSTACLE_START_RADIUS ); }
      if ( this.object.position.y > OBSTACLE_START_RADIUS ) { this.object.position.setY( OBSTACLE_START_RADIUS ); }
      */
      
      
      // idle sound level
      if ( this.passSound !== null ) {
        this.passSound.update( delta );
        var soundLevel = 2 - Math.abs(this.object.position.z - cameraZ)/10;
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
        
        rootObject.add( this.object );
        
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
      this.object.lookAt( rootObject.position );
    }
    
    if ( this.particleGroup != null ) {
      this.particleGroup.tick(delta);
    }
    
  } 
  
  this.removePassSound = function() {
    if ( this.passSound !== null ) {
      this.passSound.sound.source.stop();
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
    velocity.setLength( 3 * RICOCHET_SPEED * speedScale );
    
    if (tumbleOnHit) { tumbling = true; }
    
    // silence!
    this.removePassSound();
    
  }
  
  this.hit = function( hitPosition, ricochet ) {
    //if ( this.ricochet ) {
    if ( this.passSound !== null ) {
      this.passSound.volume = 0;
    }
    
    if ( this.state === 'ricocheting' ) {
      showCombo( (this.ricochetCount * this.points), this.object );
      new PositionedSound( getSound(explodeSound,false), rootPosition(this.object), 2 );
      //playSound( getSound(explodeSound,false), rootPosition(this.object), 2 );
      
      galaxies.fx.shakeCamera(0.5);

      switch ( this.explodeType) {
        case 'fireworks':
          galaxies.fx.showFireworks( this.object.position );
          break;
        case 'rubble':
        default:
          galaxies.fx.showRubble( this.object.position, velocity );
      }
      
      this.destroy();
      return;
    }
    
    new PositionedSound( getSound('fpo',false), rootPosition(this.object), 1 );
    //playSound( getSound('fpo',false), rootPosition(this.object), 1 );
    this.state= 'ricocheting';
    
    //this.ricochet = true;
    
    if ( typeof(ricochet) === 'undefined' ) {
      this.ricochetCount = 1;
    } else {
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
    velocity.setLength( RICOCHET_SPEED * speedScale );
    //console.log(velocity);
  }
  
  this.destroy = function() {
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
  
  this.destruct = function() {
    this.removePassSound();
    this.remove();
  }
  
  this.resetPosition();
  
}



function Projectile( model, angle ) {
  this.angularSpeed = 10
  this.isExpired = false;
  
  this.object = new THREE.Object3D();
  this.object.up.set(0,0,1);
  
  var rotateAxis = new THREE.Vector3(0,1,0);
  
  // set initial direction
  var direction = new THREE.Vector3( -Math.sin(angle), Math.cos(angle), 0 );
  direction.multiplyScalar( PROJ_START_Y );
  this.object.position.copy( direction );
  direction.add( direction );
  this.object.lookAt( direction );
  
  this.model = model;
  this.object.add(this.model);
  this.model.rotation.x = coneAngle;
  
  conify(this.object);
  
  //object.rotation.x = object.rotation.z + Math.PI/2;
  //this.direction = direction.multiplyScalar( SPEED );
  //console.log( object.position, direction );
  
  this.lifeTimer = 0;
  
  this.updatePosition = function( newAngle ) {
    
    var distance = flatLength( this.object.position );
    direction.set( -Math.sin(newAngle), Math.cos(newAngle), 0 );
    direction.multiplyScalar( distance );
    
    this.object.position.copy( direction );
    direction.add( direction );
    this.object.lookAt( direction );
    conify( this.object );
  }
  
  /// Expire and schedule for removal
  this.destroy = function() {
    galaxies.fx.showHit( this.object.position );
    
    this.isExpired = true;
    this.lifeTimer = PROJECTILE_LIFE;
  }
  this.remove = function() {
    if ( this.object.parent!=null) {
      this.object.parent.remove(this.object);
    }
  }
  this.addToScene = function() {
    if (!this.isExpired) {
      rootObject.add( this.object );
    }
  }
  this.update = function( delta ) {
    this.object.translateZ( projectileSpeed * delta );
    this.model.rotateOnAxis( rotateAxis, this.angularSpeed * delta );
    this.lifeTimer += delta;
    if ( this.lifeTimer >= PROJECTILE_LIFE ) {
      this.isExpired = true;
      //console.log( flatLength(this.object.position) );
    }
  }
}

"use strict";
this.galaxies = this.galaxies || {};

var canPlayEC3;


var invulnerable = false;

var animationFrameRequest;
var gameInitialized = false;

var windowHalfX = 0;
var windowHalfY = 0;
var mouseX = 0;
var mouseY = 0;

var rootObject;
var rootAxis;
var rootRotationSpeed = 0.05;

var geometries = {};
var materials = {};

var isGameOver = false;

var score;
var level;
var startLevel = 1;
var playerLife;

var levelTimer = 0;
var levelTime;
var levelComplete = false;
var PI_2 = Math.PI * 2;


// View, play parameters
var coneAngle = 11.4 * Math.PI/360;
var cameraZ = 40;
var cameraViewAngle = 45; // Will be applied to smallest screen dimension, horizontal or vertical. TODO
var projectileSpeed = 3.0;
var speedScale = 1;

var LEVELS_PER_PLANET = 3;

var SHOOT_TIME = 0.4;
var PROJ_HIT_THRESHOLD = 0.7;
var RICOCHET_HIT_THRESHOLD = 1.1;
var PLANET_RADIUS = 1;
var CHARACTER_HEIGHT = 3;
var CHARACTER_POSITION = PLANET_RADIUS + (0.95 * CHARACTER_HEIGHT/2 );
var PROJ_START_Y = PLANET_RADIUS + (CHARACTER_HEIGHT * 0.08);//2;

// Derived values
var CONE_SLOPE = Math.tan( coneAngle );
var CAMERA_SLOPE = Math.tan( cameraViewAngle*Math.PI/360 );
var OBSTACLE_VISIBLE_RADIUS = cameraZ * CONE_SLOPE * CAMERA_SLOPE/ (CONE_SLOPE + CAMERA_SLOPE);
var OBSTACLE_START_RADIUS = OBSTACLE_VISIBLE_RADIUS * 2;//OBSTACLE_VISIBLE_RADIUS * 1.2;

var PROJECTILE_LIFE = (OBSTACLE_VISIBLE_RADIUS - PROJ_START_Y)/projectileSpeed;

//

function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseMove(event) {
    mouseX = ( event.clientX - windowHalfX );
    mouseY = ( event.clientY - windowHalfY );
    
    targetAngle = -(Math.atan2(mouseY, mouseX) + Math.PI/2); // sprite is offset
    
}
function onDocumentTouchMove( event ) {
    event.preventDefault();
    
    var touches = event.changedTouches;
    for ( var i=0; i<touches.length; i++ ) {
        mouseX = touches[i].clientX - windowHalfX;
        mouseY = touches[i].clientY - windowHalfY;
        
        targetAngle = -(Math.atan2(mouseY, mouseX) + Math.PI/2); // sprite is offset
        
        document.getElementById('message').innerHTML = mouseX.toFixed(2) + ", " + mouseY.toFixed(2);
    }
        
}


/*
var textureURLs = [  // URLs of the six faces of the cube map 
        "images/spacesky_right1.jpg",   // Note:  The order in which
        "images/spacesky_left2.jpg",   //   the images are listed is
        "images/spacesky_top3.jpg",   //   important!
        "images/spacesky_bottom4.jpg",  
        "images/spacesky_front5.jpg",   
        "images/spacesky_back6.jpg"
   ];*/

var camera, scene, renderer, clock;


var isUserInteracting = false,
  onMouseDownMouseX = 0, onMouseDownMouseY = 0,
  lon = 0, onMouseDownLon = 0,
  lat = 0, onMouseDownLat = 0,
  phi = 0, theta = 0;

var onPointerDownPointerX, onPointerDownPointerY, onPointerDownLon, onPointerDownLat;

var skyCube;
var planet, character, characterRotator, characterAnimator, targetAngle = 0, angle = 0;

var ufo;

function init() {
  // It would be nice not to be using both of these.
  // create.js ticker for tweens
  createjs.Ticker.framerate = 60;
    
  // three.js clock for delta time
  clock = new THREE.Clock();
  
  galaxies.ui.init();
}
function initGame() {
  
  // Parse and cache loaded geometry.
  var objLoader = new THREE.OBJLoader();
  var parsed = objLoader.parse( queue.getResult('asteroidmodel') );
  geometries['asteroid'] = parsed.children[0].geometry;
  var projmodel = objLoader.parse( queue.getResult('projmodel') );
  geometries['proj'] = projmodel.children[0].geometry;
  var satmodel = objLoader.parse( queue.getResult('satellitemodel') );
  geometries['satellite'] = satmodel.children[0].geometry;
  var moonmodel = objLoader.parse( queue.getResult('moonmodel') );
  geometries['moon'] = moonmodel.children[0].geometry;
  var ufomodel = objLoader.parse( queue.getResult('ufomodel') );
  geometries['ufo'] = ufomodel.children[0].geometry;
  
  
  
  // define materials
  var asteroidColor = new THREE.Texture( queue.getResult('asteroidcolor'), THREE.UVMapping );
  asteroidColor.needsUpdate = true;
  var asteroidNormal = new THREE.Texture( queue.getResult('asteroidnormal'), THREE.UVMapping );
  asteroidNormal.needsUpdate = true;
  
  materials['asteroid'] = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      specular: 0x000000,
      opacity: 0.4,
      transparent: false,
      map: asteroidColor,
      normalMap: asteroidNormal,
      shading: THREE.SmoothShading
  } );
  
  var satColor = new THREE.Texture( queue.getResult('satellitecolor'), THREE.UVMapping );
  satColor.needsUpdate = true;
  
  materials['satellite'] = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      specular: 0x000000,
      opacity: 0.4,
      transparent: false,
      map: satColor,
      shading: THREE.SmoothShading
  } );
  
  
  var moonOcclusion = new THREE.Texture( queue.getResult('moonocclusion'), THREE.UVMapping );
  moonOcclusion.needsUpdate = true;
  var moonNormal = new THREE.Texture( queue.getResult('moonnormal'), THREE.UVMapping );
  moonNormal.needsUpdate = true;
  
  materials['moon'] = new THREE.MeshPhongMaterial( {
      color: 0xaaaaaa,
      specular: 0x000000,
      map: moonOcclusion,
      normalMap: moonNormal,
      shading: THREE.SmoothShading
  } );
  
  var ufoColor = new THREE.Texture( queue.getResult('ufocolor') );
  ufoColor.needsUpdate = true;
  materials['ufo'] = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      specular: 0xffaaaa,
      shininess: 80,
      transparent: false,
      map: ufoColor,
      shading: THREE.SmoothShading,
      depthTest: false
  } );  

  var projColor = new THREE.Texture( queue.getResult('projcolor'), THREE.UVMapping );
  projColor.needsUpdate = true;
  
  materials['proj'] = new THREE.MeshBasicMaterial( {
      color: 0xcccccc,
      
      map: projColor,
      shading: THREE.SmoothShading
  } );
  
  
  
  
  
  
  var container, mesh;

  container = document.getElementById( 'container' );

  scene = new THREE.Scene();
  
  rootObject = new THREE.Object3D();
  scene.add( rootObject );
  
  // camera FOV should be 45
  camera = new THREE.PerspectiveCamera( cameraViewAngle, window.innerWidth / window.innerHeight, 1, 1100 );
  camera.position.set(0,0,cameraZ);
  rootObject.add(camera);
  
  /*
  var light = new THREE.PointLight( 0xffffff, 1, 0 );
  light.position.set( 30, 20, 50 );
  rootObject.add( light );
  */
  var light = new THREE.DirectionalLight( 0xffffff, 1 );
  light.position.set( 30, 20, 50 );
  rootObject.add( light );
  
  /*
  // TEST OBJECT
  var geometry = new THREE.SphereGeometry( 0.1, 12, 6 );
  var material = new THREE.MeshBasicMaterial( {
    color: 0xff0000
  } );
  var test = new THREE.Mesh( geometry, material );
  var testPosition = new THREE.Vector3( 0, OBSTACLE_VISIBLE_RADIUS, 0);
  testPosition.z = getConifiedDepth( testPosition );
  test.position.copy( testPosition );
  
  rootObject.add( test );
  */

  //var texture = THREE.ImageUtils.loadTextureCube( textureURLs );
  var texture = new THREE.CubeTexture([
                    queue.getResult('skyboxright1'),
                    queue.getResult('skyboxleft2'),
                    queue.getResult('skyboxtop3'),
                    queue.getResult('skyboxbottom4'),
                    queue.getResult('skyboxfront5'),
                    queue.getResult('skyboxback6') ] );
  texture.needsUpdate = true;
  
  /* Set up a material that uses a cubemap texture.  This material uses
     custom vertex and fragment shaders that are defined in three.js as
     part of its shader library.  This code is copied from examples in
     the three.js download. */
  var shader = THREE.ShaderLib[ "cube" ];
  shader.uniforms[ "tCube" ].value = texture;
  var material = new THREE.ShaderMaterial( { // A ShaderMaterial uses custom vertex and fragment shaders.
      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
      uniforms: shader.uniforms,
      depthWrite: false,
      side: THREE.BackSide
  } );

  skyCube = new THREE.Mesh( new THREE.BoxGeometry( 200, 200, 200 ), material );
  rootObject.add(skyCube);
  
  /*
  var planetGeometry = new THREE.SphereGeometry(1, 32, 32);
  var planetMaterial = new THREE.MeshPhongMaterial( {
      color: 0xff0000,
      specular: 0xffcc55,
      shininess: 5} );
*/
  planet = new THREE.Mesh( geometries['moon'], materials['moon'] );
  rootObject.add( planet );
  
  characterRotator = new THREE.Object3D();
  rootObject.add( characterRotator );
  
  //var characterMap = THREE.ImageUtils.loadTexture( "images/lux.png" );
  //characterMap.minFilter = THREE.LinearFilter;
  
  /*
  var test = document.createElement( 'img' );
  //test.src = 'images/lux.png';
  test.src = queue.getResult('lux').src;
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
  //var characterMap = new THREE.Texture( queue.getResult('lux'), THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter );
  var characterMap = new THREE.Texture( queue.getResult('lux') );
  characterAnimator = new galaxies.SpriteSheet(
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
      [2,680,172,224,0,4,81.35] ],
    30
    );
  characterMap.needsUpdate = true;
  
  var characterMaterial = new THREE.SpriteMaterial( { map: characterMap, color: 0xffffff } );
  //var characterMaterial = new THREE.SpriteMaterial( { color: 0xffffff } );
  character = new THREE.Sprite( characterMaterial );
  character.position.set( CHARACTER_HEIGHT * 0.77 * 0.15, CHARACTER_POSITION, 0 ); // note that character is offset horizontally because sprites are not centered
  character.scale.set(CHARACTER_HEIGHT*0.77, CHARACTER_HEIGHT, CHARACTER_HEIGHT * 0.77); // 0.77 is the aspect ratio width/height of the sprites
  //character.scale.set(5, 5, 5);
  characterRotator.add( character );
  

  
  
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  //renderer.setSize( 640, 480 );
  container.appendChild( renderer.domElement );
  
  addInputListeners();

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

  var debugFormElement = document.getElementById("debugForm");
  var audioToggle = debugFormElement.querySelector("input[name='audio']");
  audioToggle.addEventListener('click', function(event) { toggleAudio( audioToggle.checked ); } );
  var soundFieldToggle = debugFormElement.querySelector("input[name='soundField']");
  soundFieldToggle.addEventListener('click', function(event) { toggleSoundField( soundFieldToggle.checked ); } );
  var surroundToggle = debugFormElement.querySelector("input[name='surround']");
  surroundToggle.addEventListener('click', function(event) { toggleTargetMix( surroundToggle.checked ); } );
  debugFormElement.querySelector("button[name='restart']").addEventListener('click', manualRestart );
  
  galaxies.fx.init( scene );
  
  startGame();
  
  // TEST
  //addTestObject();
  
  /*
  window.setInterval( function() {
    randomizePlanet();
    //galaxies.fx.shakeCamera();
  }, 3000 );
  */
  
  //
}

var testObjects = [];
function addTestObject() {
  /*
  //var colorMap = new THREE.Texture( queue.getResult('asteriodColor'), THREE.UVMapping );
  var colorMap = new THREE.Texture( queue.getResult('asteroidcolor'), THREE.UVMapping );
  colorMap.needsUpdate = true;
  var normalMap = new THREE.Texture( queue.getResult('asteroidnormal'), THREE.UVMapping );
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
  
  testObject = new THREE.Mesh( geometries['asteroid'], material );
  testObject.position.set( 0, 0, 10 );
  rootObject.add( testObject );
  var scale = 10;
  testObject.scale.set( scale, scale, scale );
  */
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
//new THREE.Texture( queue.getResult('projhitparticle') );
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
      
      
      window.setInterval( function() {
        gameOver();
        
        /*
        particleGroup1.triggerPoolEmitter(1);
        particleGroup2.triggerPoolEmitter(1);
        galaxies.fx.showPlanetRubble();
        */
        
      }, 3000 );
      

      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      //var ref = new THREE.Mesh( new THREE.TetrahedronGeometry(0.6), new THREE.MeshLambertMaterial() );
      //particleGroup.mesh.add( ref );
  
}

function startGame() {
  
  // audio
  // Set initial mix to 6-channel surround.
  // TODO - detect this automagically
  toggleTargetMix( true );
  
  // configure listener (necessary for correct panner behavior when mixing for stereo)
  listenerObject = camera;
  listener.setOrientation(0,0,-1,0,1,0);
  listener.setPosition( listenerObject.position.x, listenerObject.position.y, listenerObject.position.z );
  
  soundField = new SoundField( getSound('music') );
  soundField.setVolume(0.24); // 0.24
  //
  
  ufo = new galaxies.Ufo();
  
  resetGame();
  initLevel();

  window.addEventListener( 'resize', onWindowResize, false );
  onWindowResize();

  gameInitialized = true;
  
  if ( animationFrameRequest == null ) {
    animate();
  }
  
}

function restartGame() {
  resetGame();

  galaxies.ui.showPauseButton(); // is hidden by game over menu  
  
  //planetTransition(); // for testing purposes
  initLevel();
  
  createjs.Ticker.paused = false;
  clock.start();
  
  if ( animationFrameRequest == null ) {
    animate();
  }
}

function initLevel() {
  
  levelTime = 25;// + (5*level);
  levelTimer = 0;
  levelComplete = false;
  
  // Each planet gets a set number of levels, starting slow and speeding up.
  // NOTE: LEVEL, ROUND, AND PLANET NUMBERS ARE ALL 1-INDEXED
  // Sigmoid functions set bounds of speedScale based on planet number (absolute level number).
  var planetRound = ((level-1) % LEVELS_PER_PLANET) + 1;      // Round number for this planet
  var planet = Math.floor((level-1)/LEVELS_PER_PLANET) + 1;     // Planet number
  
  var planetFirstSpeed = 1 + 1/(1+Math.exp(4-planet));    // Speed on first level for this planet
  var planetLastSpeed = 1 + 1.5/(1+Math.exp(1-planet/2)); // Speed on last level for this planet
  
  speedScale = THREE.Math.mapLinear(planetRound, 1, 3, planetFirstSpeed, planetLastSpeed );
  //console.log( planetFirstSpeed, planetLastSpeed, speedScale );
  /*
  for ( var i=1; i<20; i++ ) {
    var planetLevel = ((i-1) % LEVELS_PER_PLANET); // level progress on planet
    var planet = Math.floor( i/LEVELS_PER_PLANET ); // Planet number
    var planetFirstSpeed = 1 + 1/(1+Math.exp(4-planet));
    var planetLastSpeed = 1 + 1.5/(1+Math.exp(1-planet*2));
    
    console.log( i, THREE.Math.mapLinear(planetLevel, 0, 2, planetFirstSpeed, planetLastSpeed ) );
  }*/
  
  
  // Counts for obstacles start low and asymptote to a max value.
  // Max values are first integer in formula. Initial value is first integer minus second integer.
  var asteroidCount = Math.floor( 20 - (15 * (1/(1 + (level-1) * 0.3)) ) );
  var satelliteCount = Math.floor( 8 - (6 * (1/(1 + (level-1) * 0.2)) ) );
  var cometCount = Math.floor( 8 - (7 * (1/(1 + (level-1) * 0.1)) ) );
  for ( var i=0; i<asteroidCount; i++ ) {
    addObstacle( 'asteroid' );
  }
  
  for ( var i=0; i<satelliteCount; i++ ) {
    addObstacle( 'satellite' );
  }
  
  for ( var i=0; i<cometCount; i++ ) {
    addObstacle( 'comet' );
  }
  
  /*
  for (var i=1; i<20; i++ ) {
    var asteroidCount = Math.floor( 20 - (15 * (1/(1 + (i-1) * 0.5)) ) );
    var satelliteCount = Math.floor( 12 - (12 * (1/(1 + (i-1) * 0.5)) ) );
    var cometCount = Math.floor( 10 - (10 * (1/(1 + (i-1) * 0.1)) ) );
    console.log(i, asteroidCount, satelliteCount, cometCount);
  }*/
  
  
  if ( level >= 3 ) {
  //if (true ) { // UFO test
    ufo.activate();
  }
  
  initRootRotation();
  
  galaxies.ui.updateLevel( planet, planetRound );
  
  if ( planetRound === 1 ) {
    galaxies.ui.showTitle( galaxies.utils.generatePlanetName(planet), 5 );
  }
  galaxies.ui.showTitle("ROUND " + planetRound, 3 );
  

}
function nextLevel() {
  level++;
  
  clearLevel();
  
  var roundNumber = ((level-1) % LEVELS_PER_PLANET ) + 1;
  if ( roundNumber == 1 ) {
    planetTransition();
  } else {
    initLevel();
  }
  
}


function planetTransition() {
  // Reset the level timer, so the game state doesn't look like we've finished a level during the transition
  levelComplete = false;
  levelTimer = 0;
  
  // hide the character
  characterRotator.remove(character);
  
  // Move planet to scene level, so it will not be affected by rootObject rotation while it flies off.
  THREE.SceneUtils.detach (planet, rootObject, scene);
  // Set outbound end position and inbound starting position for planet
  var outPosition = rootObject.localToWorld(new THREE.Vector3(0,0,-100) );
  var inPosition = rootObject.localToWorld(new THREE.Vector3(0,-100,0) );
  
  // Tween!
  createjs.Tween.get( planet.position ).to({x:outPosition.x, y:outPosition.y, z:outPosition.z}, 4000, createjs.Ease.quadInOut).
    to({x:inPosition.x, y:inPosition.y, z:inPosition.z}, 0).
    call(randomizePlanet, null, this).
    to({x:0, y:0, z:0}, 4000, createjs.Ease.quadInOut);
  
  // Swing the world around
  //createjs.Tween.get( camera.rotation ).to({x:PI_2, y:PI_2}, 8000, createjs.Ease.quadInOut ).call(planetTransitionComplete);
  var targetX = rootObject.rotation.x + Math.PI/2;
  createjs.Tween.get( rootObject.rotation ).to({x:targetX}, 8000, createjs.Ease.quadInOut ).call(planetTransitionComplete);
  
  // Stop drifting in the x-axis to prevent drift rotation from countering transition.
  // This ensures planet will move off-screen during transition.
  rootAxis.x = 0;
  rootAxis.normalize();
  //rootAxis.set(0,0,0);
}
function planetTransitionComplete() {
  // reattach the planet to the rootObject
  THREE.SceneUtils.attach( planet, scene, rootObject );
  
  // put the character back
  characterRotator.add(character);
  
  initLevel();
}

function randomizePlanet() {
  planet.rotation.set( Math.random()*PI_2, Math.random()*PI_2, Math.random()*PI_2 );
  planet.material.color.setHSL( Math.random(), THREE.Math.randFloat(0.1, 0.4), THREE.Math.randFloat(0.5, 0.7) );
  //planet.material.color.setRGB(1,0,0);
  

}



function onDocumentMouseDown( event ) {

	event.preventDefault();

	//isUserInteracting = true;

	onPointerDownPointerX = event.clientX;
	onPointerDownPointerY = event.clientY;

	onPointerDownLon = lon;
	onPointerDownLat = lat;
    
    isFiring = true;
}
function onDocumentTouchStart( event ) {
    event.preventDefault();
    
    isFiring = true;
    onDocumentTouchMove( event );
}


function onDocumentMouseUp( event ) {
	isUserInteracting = false;
    isFiring = false;
}


var obstacles = [];
function addObstacle( type ) {
  var props = {};
  props.speed = 0.2;
  props.tumble = false;
  props.tumbleOnHit = true;
  props.spiral = 0;
  props.points = 100;
  props.explodeSound = 'fpo';
  props.passSound = null;
  props.orient = false;
  props.explodeType = 'rubble';
  
  switch(type) {
    case 'asteroid':
    //case "never":
      props.speed = 0.2;
      props.tumble = true;
      props.points = 100;
      props.explodeSound = 'asteroidexplode';
      
      var material = new THREE.MeshPhongMaterial();
      material.setValues( materials['asteroid'] );
      props.model = new THREE.Mesh( geometries['asteroid'], material );
      props.model.scale.set( 0.5, 0.5, 0.5 );
      props.anchor = props.model; // no container object in this case
      break;
    case 'satellite':
    //default:
    //case "never":
      props.speed = 0.5;
      props.spiral = 0.7;
      props.points = 250;
      props.orient = true;
      
      var material = new THREE.MeshPhongMaterial();
      material.setValues( materials['satellite'] );
      var model = new THREE.Mesh( geometries['satellite'], material );
      model.position.y = -2;
      
      var modelOrient = new THREE.Object3D();
      modelOrient.add(model);
      modelOrient.rotation.x = 1.3; // Face away from camera, but not completely aligned with cone surface
      modelOrient.rotation.z = 0.5; // Face direction of motion a little
      
      props.anchor = new THREE.Object3D(); // holder, so we can properly center and orient the model
      props.anchor.add(modelOrient);
      var satScale = 0.4;
      props.anchor.scale.set(satScale, satScale, satScale);
      
      props.model = modelOrient;
      
      /*
      var ref = new THREE.Mesh( new THREE.CubeGeometry(1,1,1), new THREE.MeshLambertMaterial() );
      props.anchor.add( ref );
      var ref2 = new THREE.Mesh( new THREE.CubeGeometry(1,1,1), new THREE.MeshLambertMaterial() );
      modelOrient.add( ref2 );
      var ref3 = new THREE.Mesh( new THREE.CubeGeometry(1,1,1), new THREE.MeshLambertMaterial() );
      model.add( ref3 );
      */
      
      
      
      
      
      break;
    case 'comet':
    //case 'never':
    //default:
      props.speed = 1.2;
      props.spiral = 1;
      props.points = 500;
      props.orient = true;
      props.tumbleOnHit = false;
      props.explodeType = 'fireworks';
      
      props.explodeSound = 'cometexplode';
      props.passSound = 'cometloop';
      
      var emitterSettings = {
        type: 'cube',
        positionSpread: new THREE.Vector3(0.6, 0.6, 0.6),
        //radius: 0.1,
        velocity: new THREE.Vector3(0, 0, -5),
        velocitySpread: new THREE.Vector3(0.2, 0.2, 2),
        //speed: 1,
        sizeStart: 6,
        sizeStartSpread: 4,
        sizeEnd: 2,
        opacityStart: 0.8,
        opacityEnd: 0.1,
        colorStart: new THREE.Color("rgb(6, 6, 20)"),
        //colorStartSpread: new THREE.Vector3(42/255, 0, 0),
        colorEnd: new THREE.Color("rgb(255, 77, 0)"),
        particlesPerSecond: 10,
        particleCount: 200,
        alive: 1.0,
        duration: null
      };
      
      var texture = new THREE.Texture( queue.getResult('starparticle') );
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
      
  }
  
  var obstacle = new Asteroid( props );
  obstacles.push( obstacle );
  
}







var shotTimer = SHOOT_TIME;
var projectiles = [];
var isFiring;

function shoot() {
  if ( shotTimer>0 ) { return; }
  shotTimer = SHOOT_TIME;
  
  //console.log("shoot");
    
  // Instantiate shot object
  var projMesh = new THREE.Mesh( geometries['proj'], materials['proj'] );
  var projScale = 0.1;
  projMesh.scale.set(projScale, projScale, projScale );
  
  var proj = new Projectile( projMesh, angle );
  projectiles.push( proj );
    
  // play animation
  characterAnimator.play();
  
  // delay adding the projectile and the sound to synchronize with the animation
  createjs.Tween.get(character).wait(250).call( shootSync, [proj], this );
    
}
function shootSync( proj ) {
  
  // play sound
  new PositionedSound( getSound('shoot',false), rootPosition(character), 10 );
  proj.updatePosition( angle );
  proj.addToScene();
  
}


function animate() {

	animationFrameRequest = requestAnimationFrame( animate );
	update();

}


/// Set z-position for objects to map x-y plane to a cone.
//var parabolicConeSlope = coneSlope/3; // This constant here is related to the radius value used by obstacles
function conify( object ) {
  object.position.setZ( getConifiedDepth( object.position ) );
}
function getConifiedDepth( position ) {
  // linear
  return ( (flatLength(position)/CONE_SLOPE) );
  // parabolic
  //return ( flatLengthSqr(position) * parabolicConeSlope - 0 );
}


// Game Loop
function update() {
  var delta = clock.getDelta();
  if ( delta===0 ) { return; } // paused!
  
  // Test for hits, projectiles and ricochets
  var activeObstacleCount = 0;
  for (var iObs=0; iObs<obstacles.length; iObs++ ){
    //if ( obstacles[iObs].falling ) { continue; }
    if (obstacles[iObs].state === 'inactive') {
      if ( !levelComplete ) {
        obstacles[iObs].resetPosition();
      }
    } else {
      activeObstacleCount++;
    }
    
    if ( (obstacles[iObs].state === 'inactive') || ( obstacles[iObs].state === 'waiting' )) { continue; }
    for ( var jObs = (iObs+1); jObs<obstacles.length; jObs++ ) {
      //if ( !obstacles[jObs].falling ) { continue; }
      if ( (obstacles[jObs].state === 'inactive') || ( obstacles[jObs].state === 'waiting' )) { continue; }
      
      var dist = obstacles[iObs].object.position.distanceTo( obstacles[jObs].object.position );
      //var dist = flatLength( obstacles[iObs].object.position.clone().sub( obstacles[jObs].object.position ) );
      if ( dist < RICOCHET_HIT_THRESHOLD ) {
        if ( (obstacles[iObs].state!=='ricocheting') && (obstacles[jObs].state!=='ricocheting') ) {
          // push overlapping obstacles apart
          var overlap = RICOCHET_HIT_THRESHOLD - dist;
          
          var shift= obstacles[jObs].object.position.clone();
          shift.sub( obstacles[iObs].object.position );
          shift.z = 0;
          shift.setLength( overlap/2 );
          
          obstacles[iObs].object.position.sub( shift );
          obstacles[jObs].object.position.add( shift );
        } else if ( (obstacles[iObs].isActive) && (obstacles[jObs].isActive) ) {
          // Cache values for correct simultaneous behavior.
          var jRic = obstacles[jObs].ricochetCount;
          var iRic = obstacles[iObs].ricochetCount;
          var jPos = obstacles[jObs].object.position.clone();
          var iPos = obstacles[iObs].object.position.clone();
          obstacles[jObs].hit( iPos, iRic );
          obstacles[iObs].hit( jPos, jRic );
        }
      }
    }
    for (var iProj=0; iProj<projectiles.length; iProj++ ) {
      if ( obstacles[iObs].isActive && (projectiles[iProj].object.position.distanceTo( obstacles[iObs].object.position ) < PROJ_HIT_THRESHOLD ) ) {
        obstacles[iObs].hit( projectiles[iProj].object.position );
        projectiles[iProj].destroy();
      }
    }
  }
  if ( (ufo != null) && (ufo.isHittable) ) {
    for (var iProj=0; iProj<projectiles.length; iProj++ ) {
      var ufoRootPosition = ufo.object.localToWorld( new THREE.Vector3() );
      ufoRootPosition = rootObject.worldToLocal( ufoRootPosition );
      if ( projectiles[iProj].object.position.distanceTo( ufoRootPosition ) < PROJ_HIT_THRESHOLD ) {
        ufo.hit();
        projectiles[iProj].destroy();
      }
    }
  }
  //
  
  // Update obstacles
  for (var i=0; i<obstacles.length; i++ ) {
    obstacles[i].update( delta );
    conify( obstacles[i].object );
  }
  
  // Update projectiles
  var expiredProjectiles = [];
  for( var i=0; i<projectiles.length; i++ ){
    var proj = projectiles[i];
    proj.update( delta );
    if ( proj.isExpired ) {
      expiredProjectiles.push( proj );
    }
    
    conify( proj.object );
    
  }
  for ( var i=0; i<expiredProjectiles.length; i++ ) {
    projectiles.splice( projectiles.indexOf(expiredProjectiles[i]), 1);
    expiredProjectiles[i].remove();
  }
  
  if ( shotTimer>0) { shotTimer -= delta; }
  if ( isFiring ) {
    shoot();
  }
  //
  
  // update ufo
  ufo.update(delta);
  
  // update world
  rootObject.rotateOnAxis(rootAxis, rootRotationSpeed * delta );

  // update fx
  galaxies.fx.update(delta);
  
  
  
  /*
  if ( isUserInteracting === false ) {

    lon += 0.1;

  }

  lat = Math.max( - 85, Math.min( 85, lat ) );
  phi = THREE.Math.degToRad( 90 - lat );
  theta = THREE.Math.degToRad( lon );

  var target = new THREE.Vector3( 0, 0, 0 );
  target.x = 500 * Math.sin( phi ) * Math.cos( theta );
  target.y = 500 * Math.cos( phi );
  target.z = 500 * Math.sin( phi ) * Math.sin( theta );

  rootObject.lookAt( target );
  //camera.lookAt( camera.target );
*/
  /*
  // distortion
  camera.position.copy( camera.target ).negate();
  */
  
  // move objects towards target
  
  // update character
  if ( !isGameOver ) {
    var angleDelta = (targetAngle-angle);
    angleDelta = (angleDelta % (2*Math.PI) );
    if ( angleDelta > Math.PI ) {
      angleDelta = angleDelta - 2*Math.PI;
    }
    if ( angleDelta < -Math.PI ) {
      angleDelta = angleDelta + 2*Math.PI;
    }
    angle += (angleDelta * delta * 10.0);
    
    characterRotator.rotation.set(0,0,angle);
    character.material.rotation = angle;
    characterAnimator.update( delta);
  }
  
  renderer.render( scene, camera );
  
  levelTimer += delta;
  if ( levelTimer > levelTime ) {
    levelComplete = true;
  }
  if ( levelComplete && (activeObstacleCount === 0) ) {
    nextLevel();
  }
  
  
  // AUDIO
  mixChannels(delta);
  updateSoundField(delta);
  
  //testUpdate( delta );
}

function testUpdate( delta ) {
  for (var i=0, len = testObjects.length; i<len; i++ ) {
    testObjects[i].tick(delta); // particle system
  }
  //testObject.rotation.y = testObject.rotation.y + 1*delta;
}


function initRootRotation() {
  rootAxis = new THREE.Vector3( Math.random()*2-1, Math.random()*2-1, Math.random()*2-1);
  rootAxis.normalize;
  
}

function hitPlayer() {
  if ( isGameOver ) {return;} // prevent any rogue obstacles from causing double-death
  
  playerLife--;
  galaxies.ui.updateLife( playerLife );
  
  if ((!invulnerable) && (playerLife<=0)) {
    createjs.Tween.removeTweens( character.position );
    gameOver();
    return;
  }
  
  if ( !createjs.Tween.hasActiveTweens(character.position) ) {
    createjs.Tween.get(character.position).to({y:PLANET_RADIUS + CHARACTER_HEIGHT}, 250, createjs.Ease.quadOut).to({y:CHARACTER_POSITION}, 250, createjs.Ease.quadOut);
  }
}

function pauseGame() {
  if ( animationFrameRequest != null ) {
    createjs.Ticker.paused = true;
    clock.stop();
    window.cancelAnimationFrame(animationFrameRequest);
    animationFrameRequest = null;
  }
}
function resumeGame() {
  createjs.Ticker.paused = false;
  clock.start();
  if ( animationFrameRequest == null ) {
    animate();
  }
}


function gameOver() {
  isGameOver = true;
  galaxies.fx.showPlanetSplode();
  galaxies.fx.shakeCamera(1);
  
  
  removeInputListeners();
  isFiring = false;
  
  for( var i=0, len=obstacles.length; i<len; i++ ) {
    obstacles[i].retreat();
  }
  
  for( var i=0, len=obstacles.length; i<len; i++ ) {
    console.log( obstacles[i].state );
  }
  
  
  ufo.leave();
  
  galaxies.ui.hidePauseButton();
  createjs.Tween.get(null).wait(2000).call( galaxies.ui.showGameOver );
}
function endGame() {
  if ( animationFrameRequest != null ) {
    window.cancelAnimationFrame(animationFrameRequest);
    animationFrameRequest = null;
  }
  
  galaxies.ui.showMenu();
  
  resetGame();
}

function resetGame() {
  isGameOver = false;
  
  clearLevel();
  
  level = startLevel;
  score = 0;
  playerLife = 3;
  
  addInputListeners();
  
  rootObject.add(planet);
  randomizePlanet();
  
  characterAnimator.updateFrame(0);
  
  character.rotation.set(0,0,0);
  character.material.rotation = angle;
  character.position.y = CHARACTER_POSITION;
  
  galaxies.ui.updateLevel( 1, 1 );
  galaxies.ui.updateLife( playerLife );
  galaxies.ui.updateScore( score );
  galaxies.ui.clearTitle();
}
function clearLevel() {
  // clear all actors
  for( var i=0; i<obstacles.length; i++ ) {
    obstacles[i].remove();
  }
  obstacles = [];
  
  ufo.deactivate();
}

// Capture events on document to prevent ui from blocking clicks
function addInputListeners() {
  document.addEventListener( 'mousedown', onDocumentMouseDown, false );
  document.addEventListener( 'mouseup', onDocumentMouseUp, false );
  document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  
  document.addEventListener( 'touchstart', onDocumentTouchStart, false );
  document.addEventListener( 'touchend', onDocumentMouseUp, false );
  document.addEventListener( 'touchleave', onDocumentMouseUp, false );
  document.addEventListener( 'touchmove', onDocumentTouchMove, false );
}
function removeInputListeners() {
  document.removeEventListener( 'mousedown', onDocumentMouseDown, false );
  document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
  document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
  
  document.removeEventListener( 'touchstart', onDocumentTouchStart, false );
  document.removeEventListener( 'touchend', onDocumentMouseUp, false );
  document.removeEventListener( 'touchleave', onDocumentMouseUp, false );
  document.removeEventListener( 'touchmove', onDocumentTouchMove, false );
}










function showCombo( value, obj ) {
  var vector = new THREE.Vector3();
  
  //obj.updateMatrixWorld();
  vector.setFromMatrixPosition(obj.matrixWorld);
  vector.project(camera);
  
  var screenX = ( vector.x * windowHalfX ) + windowHalfX;
  var screenY = - ( vector.y * windowHalfY ) + windowHalfY;
  
  
  var divElem = document.createElement('div');
  divElem.classList.add("points");
  var newContent = document.createTextNode( value.toString() ); 
  divElem.style.left = screenX + 'px';
  divElem.style.top = screenY + 'px';
  divElem.appendChild(newContent); //add the text node to the newly created div.
  document.getElementById("container").appendChild(divElem);
  
  window.getComputedStyle(divElem).top; // reflow
  
  divElem.style.top = (screenY - 40) + 'px'; // animate
  divElem.style.opacity = 0;
  
  window.setTimeout( removeCombo, 2000, divElem );
  
  score += value;
  galaxies.ui.updateScore( score );
    
}

function removeCombo( element ) {
  element.remove();
}





function flatLength( vector ) {
  return Math.sqrt( Math.pow(vector.x, 2) + Math.pow(vector.y,2) );
}
function flatLengthSqr(vector ) {
  return (Math.pow(vector.x, 2) + Math.pow(vector.y,2));
}

function rootPosition( object ) {
  var foo = object.position.clone();
  if ( object.parent == null ) {
    return foo;
  } else {
    return rootObject.worldToLocal( object.parent.localToWorld( foo ) );
  }

}













// DEBUG
function toggleAudio( value ) {
  //console.log("toggleAudio", value);
  if ( value ) {
    ufo.ufoSound.sound.muteVolume.gain.value = 1;
  } else {
    ufo.ufoSound.sound.muteVolume.gain.value = 0;
  }
}
function toggleSoundField( value ) {
  if ( value ) {
    soundField.setVolume(0.24);
  } else {
    soundField.setVolume(0);
  }
}

function manualRestart() {
  var debugFormElement = document.getElementById("debugForm");
  var levelNumber = parseInt( debugFormElement.querySelector("input[name='startLevel']").value );
  if ( isNaN(levelNumber) ) {
    levelNumber = 1;
  }
  
  startLevel = levelNumber;
  
  gameOver();
}



"use strict";

this.galaxies = this.galaxies || {};

galaxies.fx = (function() {
  var CHARACTER_FLY_SPEED = 5;
  var CHARACTER_TUMBLE_SPEED = 3;
  
  
  var Rubble = function() {
    var rubbleMaterial = new THREE.MeshLambertMaterial( {
      color: 0x847360,
      opacity: 1.0,
      transparent: true } );
    
    this.object = new THREE.Mesh( geometries['asteroid'], rubbleMaterial );
    var scale = Math.random() * 0.1 + 0.05;
    this.object.scale.set( scale, scale, scale );
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
    
    this.object.material.opacity = (this.lifetime - this.lifeTimer);
    this.lifeTimer += delta;
    if ( this.lifeTimer >= this.lifetime ) {
      this.active = false;
      rootObject.remove( this.object );
    }
  }
  Rubble.prototype.reset = function() {
    this.lifeTimer = 0;
    this.active = true;
    rootObject.add( this.object );
  }
  
  
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
  
  var planetRubbleHolder;
  var planetParticleGroups = [];
  
  // Firework particle group for exploding comets
  var fireworksGroup;
  
  var init = function() {
    
    // Projectile hit particles
    var texture = new THREE.Texture( queue.getResult('projhitparticle') );
    texture.needsUpdate = true;
    for (var i=0; i<projHitPoolSize; i++ ) {
      var particleGroup = new SPE.Group({
        texture: texture,
        maxAge: 0.5,
        blending: THREE.NormalBlending//THREE.AdditiveBlending
      });
      projHitPool[i] = particleGroup;
      rootObject.add( particleGroup.mesh );
      
      particleGroup.addPool( 1, emitterSettings, false );
    }
    
    // Rubble objects
    for (var i=0; i<rubblePoolSize; i++ ) {
      var rubbleObject = new Rubble();
      rubblePool[i] = rubbleObject;
    }
    
    // Comet explode particles
    var cometParticleSettings = {
        type: 'sphere',
        radius: 0.6,
        acceleration: new THREE.Vector3(0,0,-40),//THREE.Vector3(0,-40,0),
        speed: 10,
        speedSpread: 5,
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
      
      var cometTexture = new THREE.Texture( queue.getResult('starparticle') );
      cometTexture.needsUpdate = true;
      fireworksGroup = new SPE.Group({
        texture: cometTexture,
        maxAge: 1,
        blending: THREE.AdditiveBlending
      });
      fireworksGroup.addPool( 3, cometParticleSettings, true );
      
      //fireworksGroup.mesh.rotation.x = Math.PI/2;
      rootObject.add ( fireworksGroup.mesh );
    
      // Planet splode
      planetRubbleHolder = new THREE.Object3D();
      planetRubbleHolder.scale.set(2,2,2);
      rootObject.add( planetRubbleHolder );
      
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
      
      
  }
  
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
    away.subVectors( position, camera.position);
    away.normalize();
    away.multiplyScalar( 40 );
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
    particleGroup.mesh.lookAt( rootObject.position );
    particleGroup.triggerPoolEmitter(1);

  }
  
  var showRubble = function( position, velocity ) {
    for ( var i=0; i<rubbleSetSize; i++ ) {
      var rObject = rubblePool[rubbleIndex];
      rObject.object.position.copy( position );
      rObject.object.position.add( new THREE.Vector3( THREE.Math.randFloatSpread(0.5), THREE.Math.randFloatSpread(0.5), THREE.Math.randFloatSpread(0.5) ) );
      rootObject.add( rObject.object );
      
      //console.log( rObject.velocity, rObject.object.position, position );
      rObject.velocity.subVectors( rObject.object.position, position );
      rObject.velocity.normalize();
      rObject.velocity.add( velocity );
      
      rObject.reset();
      
      rubbleIndex ++;
      if ( rubbleIndex >= rubblePoolSize ) { rubbleIndex = 0; }
    }
  }
  
  var showPlanetSplode = function() {
    // hide planet
    rootObject.remove( planet );
    
    // rubble
    for ( var i=0; i<rubblePoolSize; i++ ) {
      var rObject = rubblePool[i];
      rObject.object.position.set( THREE.Math.randFloatSpread(0.5), THREE.Math.randFloatSpread(0.5), THREE.Math.randFloatSpread(0.5) );
      
      rObject.velocity.copy( rObject.object.position );
      rObject.velocity.normalize();
      rObject.velocity.multiplyScalar(3);
      
      rObject.reset();
      planetRubbleHolder.add( rObject.object ); // move object to special holder that scales up the rubble
      
    }
    
    // particles
    for ( var i=0; i<planetParticleGroups.length; i++ ) {
      var group = planetParticleGroups[i];
      rootObject.add( group.mesh );
      
      var emitter = planetParticleGroups[i].emitters[0]; // Only one per group.
      emitter.alive = 1;
      emitter.enable();
      
      // closure to hold references to the groups and emitters
      (function() {
        var emitterRef = emitter;
        var groupRef = group;
        setTimeout( function() {
          emitterRef.disable();
          rootObject.remove( groupRef.mesh );
        }, groupRef.maxAgeMilliseconds );
      })();
    }
    
    // pose lux
    characterAnimator.updateFrame(10);
    
    // play the sound
    new PositionedSound( getSound('planetsplode', false), rootObject.position, 16);
    
  }
  
  
  var update = function( delta ) {
    for ( var i=0; i<projHitPoolSize; i++ ) {
      projHitPool[i].tick( delta );
    }
    for ( var i=0; i<rubblePoolSize; i++ ) {
      rubblePool[i].update(delta);
    }
    fireworksGroup.tick(delta);
    
    for ( var i=0; i<planetParticleGroups.length; i++ ) {
      planetParticleGroups[i].tick(delta);
    }
    
    // lux flying away
    if (isGameOver) {
      character.position.y = character.position.y + CHARACTER_FLY_SPEED * delta;
      character.rotation.z = character.rotation.z + CHARACTER_TUMBLE_SPEED * delta;
      character.material.rotation = character.rotation.z;
    }
    
  }
  
  var shakeCamera = function( magnitude ) {
    // Make sure camera is reset before applying shake tween
    camera.rotation.x = 0; 
    camera.rotation.y = 0;
    
    magnitude = 0.01 * magnitude;
    
    createjs.Tween.get(camera.rotation).to({x:magnitude, override:true }, 500, galaxies.utils.getShakeEase(29) ).
      to( {x:0}, 0); // reset position
    createjs.Tween.get(camera.rotation).to({y:magnitude, override:true }, 500, galaxies.utils.getShakeEase(27) ).
      to( {y:0}, 0); // reset position
    //createjs.Tween.get(camera.rotation).to({x:0}, 1000, createjs.Ease.quadOut );
  }
            
  return {
    init: init,
    update: update,
    showHit: showHit,
    showFireworks: showFireworks,
    showRubble: showRubble,
    showPlanetSplode: showPlanetSplode,
    shakeCamera: shakeCamera
  };
})();
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
    galaxies.utils.selectRandomElement( galaxies.words['adjective'] ) +
    "<br>" +
    galaxies.utils.selectRandomElement( galaxies.words['size'] ) +
    " " +
    galaxies.utils.selectRandomElement( galaxies.words['noun'] ) +
    " " +
    galaxies.utils.selectRandomElement( galaxies.words['greek'] ) +
    " " +
    galaxies.utils.selectRandomElement( galaxies.words['greek'] ) +
    " " +
    planetNumber;
    
  // longest name!
  //name = "Safeguard the Extraterrestrial<br>Itty-Bitty Space Outpost Centurion Centurion 10";
  
  name = name.toUpperCase();
    
  return name;
}

galaxies.utils.selectRandomElement = function( items ) {
  
  return items[ Math.floor( Math.random() * items.length ) ];
}
"use strict";

this.galaxies = this.galaxies || {};

galaxies.SpriteSheet = function( texture, frames, frameRate ) {
  this.framePeriod = 1/frameRate;
  this.frames = frames;
  
  var playing = false;
  
  var frameIndex = 0;
  var timer = 0;
  
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
        // animation complete
        //console.log("animation complete");
        frameIndex = 0;
        this.updateFrame( frameIndex );
        playing = false;
        return;
      }
      this.updateFrame(newFrameIndex );
    }
  }
  
  this.play = function() {
    timer = 0;
    frameIndex = 0;
    playing = true;
    //console.log("play animation");
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

this.galaxies = this.galaxies || {};
/*
galaxies.titleSequence = (function() {
  var rotationAxis = new THREE.Vector3();
  
  var TITLE_HUB_OFFSET = 100;
  
  var titleHub = new THREE.Object3D();
  titleHub.position.set( 0, TITLE_HUB_OFFSET, 0 );
  var titles = [];
  
  var titleImageIds = ['title1', 'title2', 'title3', 'title4', 'title5'];
  var titleRotationAxis = new THREE.Vector3(1,0,0);
  for ( var i=0, len=titleImageIds.length; i<len; i++ ) {
    var map = new THREE.Texture( queue.getResult(titleImageIds), THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter );
    map.needsUpdate = true;
    
    var mat = new THREE.SpriteMaterial( {
      map: map,
      color: 0xffffff
      } );
    titles[i] = new THREE.Sprite( mat );
    titles[i].position.set( 0, -TITLE_HUB_OFFSET, 0 );
    titles[i].rotateOnAxis(titleRotationAxis, i * PI_2/len );
    
    titleHub.add( titles[i] );
  }
  
  var activate = function() {
  }
  var update = function() {
  }
  
  
  
  
  return {
    activate: activate,
    update: update
  };
  
})();
*/
"use strict";

this.galaxies = this.galaxies || {};

this.galaxies.Ufo = function() {
  this.points = 1000;
  
  /*
  var geometry = new THREE.CylinderGeometry( 0.4, 0.4, 0.25, 8, 1, false);
  
  var objectColor = new THREE.Color( 1,1,1 );
  var material = new THREE.MeshLambertMaterial( {
      color: objectColor.getHex(),
      emissive: 0x333333,
      shading: THREE.SmoothShading } );
  
  this.object = new THREE.Mesh( geometry, material );*/
  
  this.object = new THREE.Object3D();
  this.model = new THREE.Mesh( geometries['ufo'], materials['ufo'] );
  
  this.model.scale.set(0.6, 0.6, 0.6);
  this.model.rotation.set(Math.PI,0,-Math.PI/2);
  
  this.object.add( this.model );
  
  var anchor = new THREE.Object3D();
  anchor.add( this.object );
  
  var state = 'inactive'; // values for state: idle, in, out, orbit, inactive
  var stepTimer = 0;
  var stepTime = 0;
  var transitionTime = 0;
  
  var angle = Math.random() * PI_2; // random start angle
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
  var texture = new THREE.Texture( queue.getResult('starparticle') );
  texture.needsUpdate = true;
  var laserChargeGroup = new SPE.Group({
    texture: texture,
    maxAge: 1,
    blending: THREE.AdditiveBlending
  });
  var laserChargeEmitter = new SPE.Emitter( laserChargeParticles );
  laserChargeGroup.addEmitter( laserChargeEmitter );
  laserChargeGroup.mesh.position.x = -0.5;
  
  //rootObject.add( laserChargeGroup.mesh );
  this.object.add( laserChargeGroup.mesh );

  var laserOrient = new THREE.Object3D();
  laserOrient.position.set(-0.5, 0, 0);
  laserOrient.rotation.set(0,Math.PI + coneAngle,0);
  //this.object.add( laserOrient );

  var laserGeometry = new THREE.PlaneGeometry( 5, 0.3 );
  var laserTexture = new THREE.Texture(
    queue.getResult('laserbeam') );
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
  this.ufoSound = new ObjectSound( getSound('ufo'), this.object, 0 );
  //directionalSources.push( ufoSound );
  
  var idleZ = cameraZ + 10;
  var idlePosition = new THREE.Vector3(1,0,idleZ);

  var orbitPositions = [
    new THREE.Vector3(OBSTACLE_VISIBLE_RADIUS,0,0),
    new THREE.Vector3(OBSTACLE_VISIBLE_RADIUS * 0.9,0,0),
    new THREE.Vector3(OBSTACLE_VISIBLE_RADIUS * 0.75,0,0)
  ];
  orbitPositions[0].z = getConifiedDepth( orbitPositions[0] );
  orbitPositions[1].z = getConifiedDepth( orbitPositions[1] );
  orbitPositions[2].z = getConifiedDepth( orbitPositions[2] );
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
    
    switch ( state ) {
    case 'idle':
      if ( stepTimer >= stepTime ) {
        state = 'in';
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
        
        /*
        console.log( angle );
        for (var i=0; i<transitionTime; i+=0.1 ) {
          console.log( i, inTween(i).toFixed(2) );
        }*/
        
        console.log( 'idle -> in' );
      }
      break;
    case 'in':
      angle = inTween( stepTimer );
      
      if ( stepTimer >= stepTime ) {
        state = 'orbit';
        stepTime = 1;//(Math.PI*2/3)/angularSpeed; // time between shots
        transitionTime = stepTime/4;
        stepTimer = 0;
        step = 0;
        lastPosition = this.object.position.clone();
        //targetPosition = orbitPositions[step];
        targetPosition = orbitPosition;
        console.log( 'in -> orbit' );
      }
      break;
    case 'orbit':
      angle += angularSpeed * delta;
      
      if ( stepTimer >= stepTime ) {
        console.log( 'orbit step' );
        
        // Fire
        laserChargeEmitter.alive = 1.0;
        createjs.Tween.get(laserBeam).wait(1000).call( function() {
          new PositionedSound( getSound('ufoshoot',false), rootPosition(this.object), 1 );
          
          this.object.add(laserOrient);
          laserBeam.material.opacity = 1;
  
          createjs.Tween.get(laserBeam.material).to({opacity:0}, 300, createjs.Ease.quadOut).call( function() {
            this.object.remove(laserOrient);
          }, null, this );
          
          laserOrient.rotation.z = (Math.round( Math.random() )* 2 - 1) * Math.PI/16;
          
          if ( step > 2 ) {
            hitPlayer();
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
        console.log( 'orbit -> idle' );
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
    
    /*
    if ( angle > stepAngle ) {
      lastPosition = this.object.position.clone();
      step++;
      if ( step === (targetPositions.length-1) ) {
        // fire!
        hitPlayer();
        stepAngle = angle + PI_2;
        transitionAngle = angle + PI_2;
      } else if ( step >= targetPositions.length ) {
        this.reset();
      } else {
        // step down
        stepAngle = angle + (PI_2);
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
    state = 'out';
    stepTimer = 0;
    stepTime = 4;
    transitionTime = 4;
    this.isHittable = false;
    lastPosition = this.object.position.clone();
    targetPosition = idlePosition;
    
    // Abort firing 
    createjs.Tween.removeTweens(laserBeam);
    
    var shortAngle = ((angle) + Math.PI) % PI_2 - Math.PI;
    angle = shortAngle;
    lastAngle = angle;
    if ( Math.abs( shortAngle ) < Math.PI/2 ) {
      targetAngle = 0;
    } else {
      if ( shortAngle < 0 ) {
        targetAngle = -Math.PI;
      } else {
        targetAngle = Math.PI;
      }
    }
    
    console.log( 'orbit -> out' );
  }
  
  this.hit = function() {
    this.leave();
    
    // score is scaled by how far away you hit the ufo.
    showCombo( this.points * (3-step), this.object );
    
    // play sound
    new PositionedSound( getSound('ufohit',false), rootPosition(this.object), 1 );
    //playSound( getSound('fpo',false), rootPosition(this.object), 1 );
    
  }
  
  // put object at step 0 and idle it for a random time
  this.reset = function() {
    state = 'idle';
    stepTimer = 0;
    
    if ( isGameOver ) {
      this.deactivate();
      return;
    } else {
      stepTime = Math.random() * 15 + 10; // 10 to 25 second interval
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
    
    rootObject.add( anchor );
    
  }
  this.deactivate = function() {
    state = 'inactive';
    
    this.isHittable = false;
    lastPosition = idlePosition;
    targetPosition = idlePosition;
    this.object.position.copy( idlePosition );
    this.ufoSound.volume=0;
    
    rootObject.remove( anchor );
  }
  
  
  this.deactivate();
  
}

'use strict';

this.galaxies = this.galaxies || {};

var queue; // the preload queue and cache
var assetManifest = [];

var ext = '.ogg';
if ( canPlayEC3 ) { ext = '.ec3'; }

// Add audio files
// Note that audio files are added as binary data because they will need to be decoded by the web audio context object.
// The context object will not be created until after preload is complete, so the binary data will simply be cached
// by the preloader and handled later in the initialization.
var audioItems = [
  { id: 'shoot1', src: 'shuttlecock_release_01.ogg', type: createjs.AbstractLoader.BINARY },
  { id: 'shoot2', src: 'shuttlecock_release_02.ogg', type: createjs.AbstractLoader.BINARY },
  { id: 'shoot3', src: 'shuttlecock_release_03.ogg', type: createjs.AbstractLoader.BINARY },
  { id: 'shoot4', src: 'shuttlecock_release_04.ogg', type: createjs.AbstractLoader.BINARY },
  { id: 'shoot5', src: 'shuttlecock_release_05.ogg', type: createjs.AbstractLoader.BINARY },
  { id: 'asteroidexplode1', src: 'asteroid_explode_01.ogg', type: createjs.AbstractLoader.BINARY },
  { id: 'asteroidexplode2', src: 'asteroid_explode_02.ogg', type: createjs.AbstractLoader.BINARY },
  { id: 'asteroidexplode3', src: 'asteroid_explode_03.ogg', type: createjs.AbstractLoader.BINARY },
  { id: 'cometexplode', src: 'comet_explode_01.ogg', type: createjs.AbstractLoader.BINARY },
  { id: 'cometloop', src: 'comet_fire_loop.ogg', type: createjs.AbstractLoader.BINARY },
  { id: 'fpo1', src: 'Beep Ping-SoundBible.com-217088958.mp3', type: createjs.AbstractLoader.BINARY },
  { id: 'fpo2', src: 'Robot_blip-Marianne_Gagnon-120342607.mp3', type: createjs.AbstractLoader.BINARY },
  { id: 'fpo3', src: 'Robot_blip_2-Marianne_Gagnon-299056732.mp3', type: createjs.AbstractLoader.BINARY },
  { id: 'ufo', src: 'ufo_engine_loop_01.ogg', type: createjs.AbstractLoader.BINARY },
  { id: 'music', src: 'music_5_1_loop' + ext, type: createjs.AbstractLoader.BINARY },
  { id: 'ufohit1', src: 'ufo_hit_01.ogg', type: createjs.AbstractLoader.BINARY },
  { id: 'ufohit2', src: 'ufo_hit_02.ogg', type: createjs.AbstractLoader.BINARY },
  { id: 'ufoshoot', src: 'UFO_laser_fire.ogg', type: createjs.AbstractLoader.BINARY },
  { id: 'planetsplode', src: 'planet_explode.ogg', type: createjs.AbstractLoader.BINARY }
  
];
for (var i=0; i< audioItems.length; i++ ) {
  audioItems[i].src = 'audio/' + audioItems[i].src;
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
  { id: 'projhitparticle', src: 'hit_sprite.png' },
  { id: 'asteroidcolor', src:'asteroid_color.jpg' },
  { id: 'asteroidnormal', src:'asteroid_normal.jpg' },
  { id: 'satellitecolor', src:'mercury_pod_color.jpg' },
  { id: 'starparticle', src: 'star.png' },
  { id: 'moonocclusion', src: 'moon_lores_occlusion.jpg' },
  { id: 'moonnormal', src: 'moon_lores_normal.jpg' },
  { id: 'laserbeam', src: 'laser_rippled_128x512.png' },
  { id: 'ufocolor', src: 'ufo_col.jpg' },
  { id: 'projcolor', src: 'shuttlecock_col.jpg' }
  
];
for (var i=0; i<imageItems.length; i++ ) {
  imageItems[i].src = 'images/' + imageItems[i].src;
}
assetManifest = assetManifest.concat(imageItems);

// add models
assetManifest.push(
  { id: 'ufomodel', src: 'models/ufo.obj', type: createjs.AbstractLoader.TEXT },
  { id: 'asteroidmodel', src: 'models/asteroid01.obj', type: createjs.AbstractLoader.TEXT },
  { id: 'projmodel', src: 'models/shuttlecock.obj', type: createjs.AbstractLoader.TEXT },
  { id: 'satellitemodel', src: 'models/mercury_pod.obj', type: createjs.AbstractLoader.TEXT },
  { id: 'moonmodel', src: 'models/moon_lores.obj', type: createjs.AbstractLoader.TEXT }
  
);





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
  var levelDisplay = inGameHolder.querySelector(".level-display");
  var lifeDisplay = inGameHolder.querySelector(".life-display");
  var lifeHearts = lifeDisplay.querySelectorAll(".life-heart");
  var scoreDisplay = inGameHolder.querySelector(".score-display");
  
  
  // pause menu
  var pauseOverlay = uiHolder.querySelector(".pause-overlay");
  var pauseHolder = uiHolder.querySelector(".pause-menu");
  var resumeButton = pauseHolder.querySelector(".resume-button");
  var restartButton = pauseHolder.querySelector(".restart-button");
  var quitButton = pauseHolder.querySelector(".quit-button");
  
  // game over menu
  var gameOverHolder = uiHolder.querySelector(".game-over-menu");
  var restartButton2 = gameOverHolder.querySelector(".restart-button");
  var quitButton2 = gameOverHolder.querySelector(".quit-button");
  
  // title
  var title = uiHolder.querySelector(".title");
  
  // game element
  var gameContainer = document.getElementById( 'container' );

  var progressRing = (function() {
    var elementA = playHolder.querySelector('.progress-fill-a');
    var elementB = playHolder.querySelector('.progress-fill-b');
    var secondHalf = false;
    
    var update = function(value) {
      var angle = 360 * value - 180;
      if (!secondHalf) {
        var styleObject = elementA.style;
        styleObject.transform = "rotate(" + angle.toFixed(2) + "deg)";
        //console.log( angle, styleObject.left, styleObject.transform);
        if (value>=0.5) {
          secondHalf = true;
          styleObject.transform = "rotate(0deg)";
          elementB.classList.remove('hidden');
        }
      } else {
        var styleObject = elementB.style;
        styleObject.transform = "rotate(" + angle + "deg)";
      }
    }
    return {
      update: update
    }
  })();

  var init = function() {
    createjs.CSSPlugin.install();
    
    // Loading indicator transition, setup
    // Create hidden background images and listen for them to complete loading,
    // then add fade-in class to scrolling background elements.
    var element2 = document.createElement("img");
    element2.addEventListener('load', function() { imageLoaded('.bg2'); } );
    element2.setAttribute('src', 'images/stars_tile.png');
    
    var element1 = document.createElement("img");
    element1.addEventListener('load', function() { imageLoaded('.bg1'); } );
    element1.setAttribute('src', 'images/loader_background.jpg');
    
    function imageLoaded( selector ) {
      initBgKeyframes();
      console.log("image loaded");
      var holder = document.getElementById("menuHolder").querySelector(selector).parentNode;
      holder.classList.add('fade-in');
      holder.classList.remove('invisible');
    }
    //
    
    function logoAppear() {
      loadingLogo.classList.add('logo-loading-layout');
/*      logo.style.width = 0;
      logo.style.height = 0;
      createjs.Tween.get(logo).to({width: 141, height:93 }, 500);*/
    }
    
    
    
    
    var handleComplete = function() {
      // Initialize audio context before showing audio controls
      initAudio( transitionToMenu );
      
      //transitionToMenu();
      
      //initGame();
    }
    var handleProgress = function( e ) {
      progressElement.innerHTML = Math.round(e.progress * 100).toString();
      // update ring
      progressRing.update( e.progress );
      //console.log( "Progress", e.progress );
    }
    var handleError = function( e ) {
      console.log("Error loading.", e);
    }
    
    
    
    // hook button elements
    
    playButton.addEventListener('click', onClickPlay );
    
    muteButton.addEventListener('click', onClickMute );
    
    pauseButton.addEventListener('click', onClickPause );
    resumeButton.addEventListener('click', onClickResume );
    restartButton.addEventListener('click', onClickRestart );
    restartButton2.addEventListener('click', onClickRestart );
    quitButton.addEventListener('click', onClickQuit );
    quitButton2.addEventListener('click', onClickQuit );
    
    
    stereoButton.addEventListener('click', onClickStereo);
    surroundButton.addEventListener('click', onClickSurround);
    
    
  
    queue = new createjs.LoadQueue(true);
    queue.on("complete", handleComplete );
    queue.on("error", handleError );
    queue.on("progress", handleProgress );
    queue.loadManifest( assetManifest );
    
    logoAppear();
  
    
    // set background animation keyframe based on window size
    // update this when window is resized
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
    /*
    var test = document.createElement( 'img' );
    test.src = queue.getResult('lux').src;
    document.getElementById('menuHolder').appendChild(test);
    */
    
    // transition load indicator to play button
    progressElement.style.left = 0;
    createjs.Tween.get(progressElement).to({left:52}, 500, createjs.Ease.quadInOut).call( showPlayButton );
    var start = window.getComputedStyle(playSymbol, null).getPropertyValue("left");
    playSymbol.style.left = start;
    createjs.Tween.get(playSymbol).to({left:0}, 500, createjs.Ease.quadInOut);
    
    // Show mute button
    audioControls.classList.add("fade-in");
    audioControls.classList.remove("hidden");
    

    // Show mute button
    muteButton.classList.add("fade-in");
    muteButton.classList.remove("hidden");
    
    // Show Dolby logo (TODO detect)
    dolbyLogo.classList.add("fade-in");
    dolbyLogo.classList.remove("hidden");
    
    // Resize title card and reposition
    loadingLogo.classList.remove('logo-loading-layout');
    loadingLogo.classList.add("logo-final-layout");
    playHolder.classList.add("play-final-layout");
    
  }
  var showPlayButton = function() {
    loadRing.classList.add("hidden");
    
    playButton.classList.remove("hidden");
  }
  
  var showMenu = function() {
    gameContainer.classList.add('hidden');
    inGameHolder.classList.add('hidden');
    pauseHolder.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    gameOverHolder.classList.add('hidden');
    clearTitle();
    
    loadingHolder.classList.remove('hidden');
  }
  
  var showPauseButton = function() {
    pauseButton.classList.remove('hidden');
  }
  var hidePauseButton = function() {
    pauseButton.classList.add('hidden');
  }
  
  var titleQueue = [];
  var titleActive = false;
  var showTitle = function( titleText, time ) {
    var newTitle = {
      text: titleText,
      time: time * 1000
    };
    
    titleQueue.push( newTitle );
    
    if ( !titleActive ) {
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
    
    createjs.Tween.removeTweens( title );
    createjs.Tween.get( title ).wait( nextTitle.time ).call( updateTitle );
  }
  var clearTitle = function() {
    title.classList.add('hidden');
    titleQueue = [];
    
    titleActive = false;
  }

  /// Start the game
  var onClickPlay = function(e) {
    loadingHolder.classList.add('hidden');
    
    gameContainer.classList.remove('hidden');
    inGameHolder.classList.remove('hidden');
    showPauseButton();
    
    if ( gameInitialized ) {
      restartGame();
    } else {
      initGame();
    }
  }
  
  var onClickMute = function(e) {
    console.log("Toggle mute");
  }
  
  var onClickPause = function(e) {
    pauseHolder.classList.remove('hidden');
    pauseOverlay.classList.remove('hidden');
    pauseGame();
  }
  var onClickResume = function(e) {
    pauseHolder.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    resumeGame();
  }
  var onClickRestart = function(e) {
    pauseHolder.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    
    gameOverHolder.classList.add('hidden');
    
    restartGame();
  }
  var onClickQuit = function(e) {
    endGame();
  }
  
  var onClickStereo = function(e) {
    toggleTargetMix( false );
    stereoButton.classList.add('active');
    surroundButton.classList.remove('active');
  }
  var onClickSurround = function(e) {
    toggleTargetMix( true );
    stereoButton.classList.remove('active');
    surroundButton.classList.add('active');
  }
  
  
  
  
  
  var showGameOver = function() {
    gameOverHolder.classList.remove('hidden');
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
    updateLife: updateLife
  };
  
  
}());









"use strict";

this.galaxies = this.galaxies || {};

this.galaxies.utils = this.galaxies.utils || {};

// A linear tapered sinusoidal easing function.
// Used for shaking camera.
this.galaxies.utils.getShakeEase = function ( frequency ) {
  return function( t ) {
    var val = Math.cos( t * frequency ) * (1-t);
    //console.log(t, val);
    return val;
  };
};

this.galaxies.utils.supportsEC3 = function() {
  var codecString = 'audio/mp4; codecs="ec-3"';
  
  if ( (typeof MediaSource !== 'undefined') ) {
    return MediaSource.isTypeSupported( codecString );
  } else {
    var testEl = document.createElement( "video" );
    if ( testEl.canPlayType ) {
      return ( ( 'probably' === testEl.canPlayType( codecString ) ) );
    } else {
      return false;
    }
  }  
}



// Patch SPE to allow negative speeds to make particles move inwards.
// This is used by the UFO laser charge effect.
SPE.Emitter.prototype.randomizeExistingVelocityVector3OnSphere = function( v, base, position, speed, speedSpread ) {
        v.copy( position )
            .sub( base )
            .normalize()
            .multiplyScalar( this.randomFloat( speed, speedSpread ) );
            //.multiplyScalar( Math.abs( this.randomFloat( speed, speedSpread ) ) );
};



