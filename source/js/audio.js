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




  















