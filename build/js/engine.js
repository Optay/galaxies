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

var sounds = {
  'shoot': ['shoot1', 'shoot2', 'shoot3', 'shoot4', 'shoot5'],
  'asteroidexplode': ['asteroidexplode1', 'asteroidexplode2', 'asteroidexplode3'],
  'cometexplode': ['cometexplode'],
  'cometloop': ['cometloop'],
  'fpo': ['fpo1', 'fpo2', 'fpo3'],
  'ufo': ['ufo'],
  'music': ['music'],
  'ufohit': ['ufohit1', 'ufohit2'],
  'ufoshoot': ['ufoshoot']
}

// Decode and package loaded audio data into exhaustive array objects.
function initAudio( complete ) {
  
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
/*
function Orbit() {
    // Instantiate shot object
    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshPhongMaterial( {
        color: 0x555555,
        specular: 0xdddddd,
        emissive: 0x555555,
        shininess: 10} );
    
    this.object = new THREE.Mesh( geometry, material );
    
    var center = new THREE.Vector3(9, 0, 0);
    var angle = 0;
    var speed = 0.3;
    var radius = 12;
    
    this.update = function( delta ) {
        angle += delta * speed;
        var position = new THREE.Vector3( Math.cos(angle), Math.sin(angle), 0 );
        position.multiplyScalar( radius );
        position.add( center );
        
        this.object.position.copy( position );
    }
    
    /// Reverse direction
    this.destroy = function() {
        speed = -speed;
    }
    
}*/

function Ufo() {
  this.points = 1000;
  
  /*
  var geometry = new THREE.CylinderGeometry( 0.4, 0.4, 0.25, 8, 1, false);
  
  var objectColor = new THREE.Color( 1,1,1 );
  var material = new THREE.MeshLambertMaterial( {
      color: objectColor.getHex(),
      emissive: 0x333333,
      shading: THREE.SmoothShading } );
  
  this.object = new THREE.Mesh( geometry, material );*/
  
  var objLoader = new THREE.OBJLoader();
  this.object = objLoader.parse( queue.getResult('ufomodel') );
  
  this.object.scale.set(0.6, 0.6, 0.6);
  this.object.rotation.set(Math.PI,0,-Math.PI/2);
  
  var anchor = new THREE.Object3D();
  anchor.add( this.object );
  rootObject.add( anchor );
  
  var state = 'idle'; // values for state: idle, in, out, orbit
  var stepTimer = 0;
  var stepTime = 0;
  var transitionTime = 0;
  
  var angle = Math.random() * PI_2; // random start angle
  var angularSpeed = 0.7;
  var rotationAxis = new THREE.Vector3(0,1,0);
  
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
        targetPosition = orbitPositions[0];
        
        // Starting angle is set so ufo stays to right or left as it flies in.
        angle = Math.round(Math.random()) * Math.PI - Math.PI/4;
        
        var a = angularSpeed / (2*transitionTime);
        var c = angle;
        
        inTween = function( t ) {
          return a*t*t + c;
        };
        
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
        stepTime = PI_2/angularSpeed;
        transitionTime = stepTime/4;
        stepTimer = 0;
        step = 0;
        this.isHittable = true;
        lastPosition = this.object.position.clone();
        targetPosition = orbitPositions[step];
        console.log( 'in -> orbit' );
      }
      break;
    case 'orbit':
      angle += angularSpeed * delta;
      
      if ( stepTimer >= stepTime ) {
        step++;
        stepTimer = 0;
        if ( step > 2 ) {
          // fire
          new PositionedSound( getSound('ufoshoot',false), rootPosition(this.object), 1 );
          
          rootObject.add( laserHolder );
          laserHolder.rotation.set(0,0,angle);
          laser.material.rotation = angle;
          laser.material.opacity = 1;

          createjs.Tween.get(laser.material).to({opacity:0}, 250, createjs.Ease.quadOut).call( function() {
            rootObject.remove(laserHolder);
          });
          
          //

          this.leave();
          break;
        }
        lastPosition = this.object.position.clone();
        targetPosition = orbitPositions[step];
        console.log( 'orbit step' );
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
    
    
    // engine sound level
    this.ufoSound.update( delta );
    var engineLevel = idleZ - this.object.position.z;
    engineLevel = THREE.Math.clamp( engineLevel, 0, 1 );
    this.ufoSound.volume = engineLevel;
    //
    
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
    stepTime = Math.random() * 0 + 2; // 5-10 second interval
    this.isHittable = false;
    
    lastPosition = idlePosition;
    targetPosition = idlePosition;
    this.object.position.copy( idlePosition );
    
    // silence it!
    this.ufoSound.volume=0;
    
    /*
    step = 0;
    transitionAngle = angle + Math.random() * 3 * Math.PI;
    stepAngle = transitionAngle;
    this.alive = true;
    lastPosition = targetPositions[0];
    this.object.position.copy( targetPositions[0] );
    */
  }
  
  this.reset();

}

/// Rename this 'Obstacle'
function Asteroid( _speed, _spiral, _geometry, _tumble, _points, _explodeSound, _passSoundId ) {
  var PLANET_DISTANCE = 1.25;
  var RICOCHET_SPEED = 0.35;
  
  this.points = _points;
  
  this.speed = _speed * speedScale;
  var angle = 0;
  //var angularSpeed = this.speed/radius;
  
  var tumble = _tumble;
  var tumbling = tumble;
  var tumbleAxis = new THREE.Vector3();
  var baseTumbleSpeed = 1.5;
  var tumbleSpeed = baseTumbleSpeed;
  
  var velocity = new THREE.Vector3();
  
  //this.falling = false;
  var fallSpeed = 8;
  var fallTimer = 0;
  var fallTime = 0;
  var spiralTime = _spiral * 60 + 1;
  
  //this.ricochet = false;
  this.ricochetCount = 0;
  
  // state values: waiting, falling, ricocheting, inactive
  this.state = 'waiting';
  this.isActive = false; // will the object accept interactions
  
  /*
  var geometry = _geometry;
  if ( typeof(_geometry)==='undefined' ) {
    geometry = new THREE.BoxGeometry( 0.7, 0.7, 0.7 );
  }*/
  // Ghetto color difference between objects (didn't want to pass in another parameter)
  var objectColor = new THREE.Color( this.points/500, this.points/500, this.points/500 );
  var material = new THREE.MeshLambertMaterial( {
      color: objectColor.getHex(),
      opacity: 0.4,
      transparent: false,
      emissive: 0x555555,
      shading: THREE.FlatShading } );
  
  //this.object = new THREE.Mesh( geometry, material );
  
  var objLoader = new THREE.OBJLoader();
  this.object = objLoader.parse( queue.getResult('asteroidmodel') );
  this.object.material = material;
  this.object.scale.set(0.5, 0.5, 0.5);
  
  
  // Sound
  var explodeSound = _explodeSound;
  this.passSound = null;
  if ( _passSoundId != null ) {
    //console.log(_passSoundId);
    this.passSound = new ObjectSound( getSound( _passSoundId, true), this.object, 0 );
    //directionalSources.push(passSound);
  }
  
  
  
  this.resetPosition= function() {
      angle = Math.random()*Math.PI*2;
      var position = new THREE.Vector3( Math.cos(angle), Math.sin(angle), 0 );
      position.multiplyScalar( OBSTACLE_START_RADIUS );
      this.object.position.copy(position);
      this.object.lookAt( new THREE.Vector3() );
      
      this.object.material.transparent = false;
      
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
    case 'ricocheting':
      this.object.position.add( velocity.clone().multiplyScalar(delta) );
      
      // Prevent ricochets from traveling all the way out, so
      // the player cannot score points off-screen
      var radius = flatLength( this.object.position );
      if ( radius > OBSTACLE_START_RADIUS ) { this.destroy(); }
      if ( this.isActive && (radius > OBSTACLE_VISIBLE_RADIUS ) ) {
        this.isActive = false;
        this.object.material.transparent = true;
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
        hitPlayer();
        this.resetPosition();
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
    }
    
  } 
  
  this.removePassSound = function() {
    if ( this.passSound !== null ) {
      this.passSound.source.stop();
      //removeSource( this.passSound );
      this.passSound = null;
    }
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
    
    tumbling = true;
    tumbleSpeed = baseTumbleSpeed * this.ricochetCount * 2.5;
    
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



function Projectile( object, direction ) {
    this.angularSpeed = 10
    this.isExpired = false;
    
    this.object = object;
    direction.add( object.position );
    object.lookAt( direction );
    //this.direction = direction.multiplyScalar( SPEED );
    //console.log( object.position, direction );
    
    this.lifeTimer = 0;
    
    /// Expire and schedule for removal
    this.destroy = function() {
      this.isExpired = true;
      this.lifeTimer = PROJECTILE_LIFE;
    }
    this.remove = function() {
      this.object.parent.remove(this.object);
    }
    this.update = function( delta ) {
      this.object.translateZ( projectileSpeed * delta );
      //this.object.rotateOnAxis( new THREE.Vector3(0,0,1), this.angularSpeed * delta );
      this.lifeTimer += delta;
      if ( this.lifeTimer >= PROJECTILE_LIFE ) {
        this.isExpired = true;
        //console.log( flatLength(this.object.position) );
      }
    }
}

"use strict";
this.galaxies = this.galaxies || {};

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

var score;
var level;
var startLevel = 1;
var playerLife;

var levelTimer = 0;
var levelTime;
var levelComplete = false;
var PI_2 = Math.PI * 2;


// View, play parameters
var coneAngle = 11.4;
var cameraZ = 40;
var cameraViewAngle = 45; // Will be applied to smallest screen dimension, horizontal or vertical. TODO
var projectileSpeed = 3.0;
var speedScale = 1;

var LEVELS_PER_PLANET = 3;

var SHOOT_TIME = 0.4;
var PROJ_HIT_THRESHOLD = 0.7;
var RICOCHET_HIT_THRESHOLD = 1.1;
var CHARACTER_Y = 1.75;
var PROJ_START_Y = 1.25;

// Derived values
var CONE_SLOPE = Math.tan( coneAngle*Math.PI/360 );
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

var textureURLs = [  // URLs of the six faces of the cube map 
        "images/spacesky_right1.jpg",   // Note:  The order in which
        "images/spacesky_left2.jpg",   //   the images are listed is
        "images/spacesky_top3.jpg",   //   important!
        "images/spacesky_bottom4.jpg",  
        "images/spacesky_front5.jpg",   
        "images/spacesky_back6.jpg"
   ];

var camera, scene, renderer, clock;


var isUserInteracting = false,
  onMouseDownMouseX = 0, onMouseDownMouseY = 0,
  lon = 0, onMouseDownLon = 0,
  lat = 0, onMouseDownLat = 0,
  phi = 0, theta = 0;

var onPointerDownPointerX, onPointerDownPointerY, onPointerDownLon, onPointerDownLat;

var skyCube;
var planet, character, characterRotator, targetAngle = 0, angle = 0;

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
  
  var container, mesh;

  container = document.getElementById( 'container' );

  scene = new THREE.Scene();
  
  rootObject = new THREE.Object3D();
  scene.add( rootObject );
  
  // camera FOV should be 45
  camera = new THREE.PerspectiveCamera( cameraViewAngle, window.innerWidth / window.innerHeight, 1, 1100 );
  camera.position.set(0,0,cameraZ);
  rootObject.add(camera);
  
  var light = new THREE.PointLight( 0xffffff, 1, 0 );
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
  
  var planetGeometry = new THREE.SphereGeometry(1, 32, 32);
  var planetMaterial = new THREE.MeshPhongMaterial( {
      color: 0xff0000,
      specular: 0xffcc55,
      shininess: 5} );

  planet = new THREE.Mesh( planetGeometry, planetMaterial );
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
  
  
  var characterMap = new THREE.Texture( queue.getResult('lux'), THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter );
  characterMap.needsUpdate = true;
  
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
  
  console.log( queue.getResult('lux') );
  console.log( characterMap.image );
  
  var characterMaterial = new THREE.SpriteMaterial( { map: characterMap, color: 0xffffff, fog: true } );
  character = new THREE.Sprite( characterMaterial );
  character.position.set( 0, CHARACTER_Y, 0 );
  character.scale.set(1.5, 1.5, 1.5);
  characterRotator.add( character );
  
  
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  //renderer.setSize( 640, 480 );
  container.appendChild( renderer.domElement );
  
  // Capture events on document to prevent ui from blocking clicks
  document.addEventListener( 'mousedown', onDocumentMouseDown, false );
  document.addEventListener( 'mouseup', onDocumentMouseUp, false );
  document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  
  document.addEventListener( 'touchstart', onDocumentTouchStart, false );
  document.addEventListener( 'touchend', onDocumentMouseUp, false );
  document.addEventListener( 'touchleave', onDocumentMouseUp, false );
  document.addEventListener( 'touchmove', onDocumentTouchMove, false );

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
  
  initAudio( startGame );
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
  //
  
  ufo = new Ufo();
  
  resetGame();
  initLevel();

  window.addEventListener( 'resize', onWindowResize, false );
  onWindowResize();

  gameInitialized = true;
  
  animate();

  
}

function restartGame() {
  resetGame();
  
  //planetTransition(); // for testing purposes
  initLevel();
  
  animate();
}

function initLevel() {
  galaxies.ui.updateLevel( level );
  
  levelTime = 25;// + (5*level);
  levelTimer = 0;
  levelComplete = false;
  
  clearLevel();
  
  // Each planet gets a set number of levels, starting slow and speeding up.
  // Sigmoid functions set bounds of speedScale based on planet number (absolute level number).
  var planetLevel = ((level-1) % LEVELS_PER_PLANET);      // Level number for this planet
  var planet = Math.floor( level/LEVELS_PER_PLANET );     // Planet number
  var planetFirstSpeed = 1 + 1/(1+Math.exp(4-planet));    // Speed on first level for this planet
  var planetLastSpeed = 1 + 1.5/(1+Math.exp(1-planet*2)); // Speed on last level for this planet
  
  speedScale = THREE.Math.mapLinear(planetLevel, 0, 2, planetFirstSpeed, planetLastSpeed );
  //console.log( planetFirstSpeed, planetLastSpeed, speedScale );
  /*
  for ( var i=1; i<20; i++ ) {
    var planetLevel = ((i-1) % LEVELS_PER_PLANET); // level progress on planet
    var planet = Math.floor( i/LEVELS_PER_PLANET ); // Planet number
    var planetFirstSpeed = 1 + 1/(1+Math.exp(4-planet));
    var planetLastSpeed = 1 + 1.5/(1+Math.exp(1-planet*2));
    
    console.log( i, THREE.Math.mapLinear(planetLevel, 0, 2, planetFirstSpeed, planetLastSpeed ) );
  }*/
  
  
  
  var asteroidCount = Math.floor( 20 - (15 * (1/(1 + (level-1) * 0.5)) ) );
  var satelliteCount = Math.floor( 12 - (12 * (1/(1 + (level-1) * 0.5)) ) );
  var cometCount = Math.floor( 10 - (10 * (1/(1 + (level-1) * 0.1)) ) );
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
  
  initRootRotation();
  

}
function nextLevel() {
  level++;
  
  if (( (level-1) % LEVELS_PER_PLANET ) == 0) {
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
  THREE.SceneUtils.attach( planet, rootObject, scene );
  
  // put the character back
  characterRotator.add(character);
  
  initLevel();
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
  var speed;
  var geometry;
  var radius = 0.6;
  var tumble = false;
  var spiral = 0;
  var points;
  var explodeSound = 'fpo';
  var passSound = null;
  switch(type) {
    case "asteroid":
      speed = 0.2;
      geometry = new THREE.BoxGeometry(radius, radius, radius);
      tumble = true;
      points = 100;
      explodeSound = 'asteroidexplode';
      break;
    case "satellite":
      speed = 0.5;
      spiral = 0.3;
      geometry = new THREE.TetrahedronGeometry(radius);
      points = 250;
      break;
    case "comet":
      speed = 1.2;
      spiral = 1;
      geometry = new THREE.DodecahedronGeometry(radius);
      points = 500;
      explodeSound = 'cometexplode';
      passSound = 'cometloop';
      break;
      
  }
  
  var obstacle = new Asteroid( speed, spiral, geometry, tumble, points, explodeSound, passSound );
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
    var geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
    var material = new THREE.MeshPhongMaterial( {
        color: 0x999999,
        specular: 0xffffff,
        emissive: 0x999999,
        shininess: 50} );
    
    var cube = new THREE.Mesh( geometry, material );
    var pos = new THREE.Vector3(0, PROJ_START_Y, 0);
    characterRotator.localToWorld(pos);
    rootObject.worldToLocal(pos);
    cube.position.copy(pos);
    conify(cube);
    rootObject.add( cube );
    
    var direction = new THREE.Vector3( -Math.sin(angle), Math.cos(angle), 0 );
    var proj = new Projectile( cube, direction );
    projectiles.push( proj );
    
    
    // play sound
    new PositionedSound( getSound('shoot',false), rootPosition(character), 10 );
    //playSound( getSound('shoot',false), rootPosition(character), 10 );
    
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

function update() {
  var delta = clock.getDelta();
  
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
  
  ufo.update(delta);
  
  rootObject.rotateOnAxis(rootAxis, rootRotationSpeed * delta );
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
  
  
}

function initRootRotation() {
  rootAxis = new THREE.Vector3( Math.random()*2-1, Math.random()*2-1, Math.random()*2-1);
  rootAxis.normalize;
  
}

function hitPlayer() {
  
  playerLife--;
  if ((!invulnerable) && (playerLife<=0)) {
    gameOver();
    return;
  }
  galaxies.ui.updateLife( playerLife );
  
  if ( !createjs.Tween.hasActiveTweens(character.position) ) {
    createjs.Tween.get(character.position).to({y:2.5}, 250, createjs.Ease.quadOut).to({y:1.75}, 250, createjs.Ease.quadOut);
  }
}

function pauseGame() {
  if ( animationFrameRequest != null ) {
    clock.stop();
    window.cancelAnimationFrame(animationFrameRequest);
  }
}
function resumeGame() {
  clock.start();
  animate();
}


function gameOver() {
  if ( animationFrameRequest != null ) {
    window.cancelAnimationFrame(animationFrameRequest);
  }
  
  galaxies.ui.showMenu();
  
  resetGame();
  clearLevel();
  
}

function resetGame() {
  // reset game
  level = startLevel;
  score = 0;
  playerLife = 3;
  
  galaxies.ui.updateLevel( level );
  galaxies.ui.updateLife( playerLife );
  galaxies.ui.updateScore( score );
}
function clearLevel() {
  // clear all actors
  for( var i=0; i<obstacles.length; i++ ) {
    obstacles[i].remove();
  }
  obstacles = [];
  
  ufo.reset();
}


function showCombo( value, obj ) {
  var vector = new THREE.Vector3();
  
  //obj.updateMatrixWorld();
  vector.setFromMatrixPosition(obj.matrixWorld);
  vector.project(camera);
  
  var screenX = ( vector.x * windowHalfX ) + windowHalfX;
  var screenY = - ( vector.y * windowHalfY ) + windowHalfY;
  
  
  var divElem = document.createElement('div');
  divElem.className = "combo";
  var newContent = document.createTextNode( value.toString() ); 
  divElem.appendChild(newContent); //add the text node to the newly created div.
  divElem.style.left = screenX + 'px';
  divElem.style.top = screenY + 'px';
  
  
  document.getElementById("container").appendChild(divElem);
  
  window.setTimeout( removeCombo, 1000, divElem );
  
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



'use strict';

this.galaxies = this.galaxies || {};

var queue; // the preload queue and cache
var assetManifest = [];


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
  { id: 'music', src: 'music_5_1_loop.ogg', type: createjs.AbstractLoader.BINARY },
  { id: 'ufohit1', src: 'ufo_hit_01.ogg', type: createjs.AbstractLoader.BINARY },
  { id: 'ufohit2', src: 'ufo_hit_02.ogg', type: createjs.AbstractLoader.BINARY },
  { id: 'ufoshoot', src: 'UFO_laser_fire.ogg', type: createjs.AbstractLoader.BINARY }
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
  { id: 'lux', src: 'lux.png' }
];
for (var i=0; i<imageItems.length; i++ ) {
  imageItems[i].src = 'images/' + imageItems[i].src;
}
assetManifest = assetManifest.concat(imageItems);

// add models
assetManifest.push(
  { id: 'ufomodel', src: 'models/ufo_v2.obj', type: createjs.AbstractLoader.TEXT },
  { id: 'asteroidmodel', src: 'models/asteroid01.obj', type: createjs.AbstractLoader.TEXT }
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
  
  // mute button (always active after load)
  var muteButton = uiHolder.querySelector(".mute-button");
  
  // in-game elements
  var inGameHolder = uiHolder.querySelector(".game-ui");
  var pauseButton = uiHolder.querySelector(".pause-button");
  var levelDisplay = inGameHolder.querySelector(".level-display");
  var lifeDisplay = inGameHolder.querySelector(".life-display");
  var scoreDisplay = inGameHolder.querySelector(".score-display");
  
  
  // pause menu
  var pauseOverlay = uiHolder.querySelector(".pause-overlay");
  var pauseHolder = uiHolder.querySelector(".pause-menu");
  var resumeButton = pauseHolder.querySelector(".resume-button");
  var restartButton = pauseHolder.querySelector(".restart-button");
  var quitButton = pauseHolder.querySelector(".quit-button");
  
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
        styleObject.left = angle;
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
    
    
    
    
    // Create Loader
    var handleComplete = function() {
      transitionToMenu();
      
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
    quitButton.addEventListener('click', onClickQuit );
    
    
    
    
    
    
    
  
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
    muteButton.classList.add("fade-in");
    muteButton.classList.remove("hidden");
    
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
    
    loadingHolder.classList.remove('hidden');
    
  }
  
  
  

  /// Start the game
  var onClickPlay = function(e) {
    loadingHolder.classList.add('hidden');
    
    gameContainer.classList.remove('hidden');
    inGameHolder.classList.remove('hidden');
    
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
    restartGame();
  }
  var onClickQuit = function(e) {
    gameOver();
  }
  
  
  var updateLevel = function( newLevelNumber ) {
    levelDisplay.innerHTML = "LEVEL " + newLevelNumber.toString();
  }
  var updateScore = function( newScore ) {
    scoreDisplay.innerHTML = newScore.toString();
  }
  var updateLife = function( newLifeValue ) {
    lifeDisplay.innerHTML = newLifeValue.toString();
  }

  return {
    init: init,
    gameContainer: gameContainer,
    showMenu: showMenu,
    updateLevel: updateLevel,
    updateScore: updateScore,
    updateLife: updateLife
  };
  
  
}());








