'use strict'

var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();
var AUDIBLE_RANGE = 10;
var DISTANCE_ATTENUATION = 0.1;//0.05;
var DIRECTION_FOCUS = 1; // How much sounds spread to neighboring speakers: higher values produces sharper spatialization, lower values spread sound more evenly
var DOPPLER_FACTOR = 70; // Higher numbers result in less doppler shift.

var listener = audioCtx.listener;
var listenerObject;

var soundField;

listener.setOrientation(0,0,-1,0,1,0);

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

var sounds = {
  'shoot': ['Beep Ping-SoundBible.com-217088958.mp3', 'Robot_blip-Marianne_Gagnon-120342607.mp3', 'Robot_blip_2-Marianne_Gagnon-299056732.mp3'],
  'ufo': ['ufo_engine_loop_01.ogg'],
  'music': ['5.1 Test_music.ogg']
};


function SoundLoader( complete ) {
  var onComplete = complete;
  
  var audioPath = 'audio/';
  var soundIds = Object.keys(sounds);
  var remaining = soundIds.length;
  
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
  
      audioCtx.decodeAudioData(audioData, function(buffer) {
          loadedSounds[ loadedId ].add( buffer );
          remaining --;
          if ( remaining <= 0 ) {
            loadComplete();
          }
        },
  
        function(e){"Error with decoding audio data" + e.err});
    }
  
    request.send();
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

/// A mono source that is mixed based on its position in space relative to the
/// listener object.
/// Object exposes a collection of gain nodes.
function DirectionalSource( source, object ) {
  this.object = object;
  this.source = source;
  this.bearing = 0;
  this.distance = 0;
  this.inPlaneWeight = 0;
  
  this.lastDistance = 0;
  this.velocity = 0;
  
  this.volume = 1;
  
  var combiner = audioCtx.createChannelMerger();
  
  this.channels = [];
  for ( var i=0; i<6; i++ ) {
    var newGainNode = audioCtx.createGain();
    newGainNode.gain.value = 0;   // start silent to avoid loud playback before initial mix call
    source.connect( newGainNode );
    newGainNode.connect( combiner, 0, i );
    this.channels[i] = newGainNode;
  }
  
  combiner.connect(audioCtx.destination);
  
  this.source.start(0);
  if ( !this.source.loop ) {
    //console.log( "start", this.source, directionalSources.length );
    var ds = this; // self reference
    this.source.onended = function() { removeSource(ds); };
  }
  
}

/// Update the mix for directional sources.
function mixChannels( delta ) {
  
  for( var i=0; i<directionalSources.length; i++ ) {
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
      var gain = source.volume * 1 / Math.exp(source.distance * DISTANCE_ATTENUATION);
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
    }
  }
  
  visualizeSource( directionalSources[0] );
  
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

function removeSource( source ) {
  directionalSources.splice( directionalSources.indexOf( source ), 1 );
}







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
  
  this.volume = 0.5;
  
  // Add input
  var splitter = audioCtx.createChannelSplitter(6);
  this.source.connect( splitter );
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

  this.source.start(0);
  
}

/// Update the mix of multichannel output based on the position of the source.
function updateSoundField( delta ) {
  soundField.angle += soundField.angularVelocity * delta;
  
  for( var iOutput = 0; iOutput<channelMap.length; iOutput++ ) {
    for(var iSource = 0; iSource<channelMap.length; iSource++ ) {
      var gain = soundField.volume;
      if ( channelAngles[channelMap[iSource]] !== null ) {
        //gain = soundField.volume * Math.pow( (Math.cos( channelAngles[iOutput] - (channelAngles[iSource] + soundField.angle) ) + 1)/2, 1);
        gain = gain * (Math.cos( channelAngles[channelMap[iOutput]] - (channelAngles[channelMap[iSource]] + soundField.angle) ) + 1)/2;
      }
      soundField.gains[iOutput][iSource].gain.value = gain; //  apply resulting gain to channel
    }
  }
}



















