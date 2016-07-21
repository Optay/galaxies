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
galaxies.audio.DOPPLER_FACTOR = 8; // Higher numbers result in less doppler shift.

galaxies.audio.muteState = 'none'; // Designates which audio is muted: none, music, all

// active ObjectSound instances
galaxies.audio.positionedSounds = [];

// Create a new AudioBufferSource node for a given sound.
galaxies.audio.getSound = function( id ) {
  var buffer = galaxies.audio.loadedSounds[id].next();
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
  'bossmusic': ['bossmusic'],
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
  'buttonover': ['buttonover'],
  'heartcollect': ['heartcollect'],
  'starcollect': ['starcollect'],
  'powerupcollect': ['powerupcollect'],
  'aliengrowl': ['aliengrowl'],
  'tripleraquet': ['tripleraquet'],
  'monsterouch': ['monsterouch1'],
  'monsterroar': ['monsterroar1'],
  'unleashthebeast': ['unleashthebeast']
}

// Decode and package loaded audio data into exhaustive array objects.
galaxies.audio.initAudio = function( complete ) {
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  galaxies.audio.audioCtx = galaxies.audio.audioCtx || new AudioContext(); // audio context will already have been defined in mobile touch-to-start event.
  galaxies.audio.listener = galaxies.audio.audioCtx.listener;
  console.log("initAudio");
  
  // Global mute
  galaxies.audio.outNode = galaxies.audio.audioCtx.createGain();
  galaxies.audio.outNode.connect( galaxies.audio.audioCtx.destination );
  galaxies.audio.simpleOutNode = galaxies.audio.audioCtx.createGain();
  galaxies.audio.simpleOutNode.connect( galaxies.audio.audioCtx.destination );

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
      decodeFile( soundIds[i], galaxies.audio.sounds[soundIds[i]][j] );
    }
  }
  
  function decodeFile( soundId, fileId ) {
    var loadedId = soundId;
    var result = galaxies.queue.getResult( fileId, true );
    if ( result != null ) {
      galaxies.audio.audioCtx.decodeAudioData( result,
        function(buffer) {
          galaxies.audio.loadedSounds[ loadedId ].add( buffer );  
          fileComplete();
        },
        function() {
          console.log( "Error decoding audio file.", loadedId );
          
          // Add an empty buffer to the cache to prevent errors when trying to play this sound.
          galaxies.audio.loadedSounds[ loadedId ].add( galaxies.audio.audioCtx.createBuffer(2, 22050, 44100) );
          fileComplete();
        } );
    } else {
      // Add an empty buffer
      galaxies.audio.loadedSounds[ loadedId ].add( galaxies.audio.audioCtx.createBuffer(2, 22050, 44100) );
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
    this.toSource.subVectors( newPosition, galaxies.audio.listenerObject.position );
    this.distance = this.toSource.length();
    
    if ( galaxies.audio.surroundMix ) {
      this.bearing = Math.atan2( -this.toSource.x, -this.toSource.z );
      this.inPlaneWeight = 0;
      if (this.distance > 0) { this.inPlaneWeight = Math.sqrt( Math.pow(this.toSource.x,2) + Math.pow(this.toSource.z,2) ) / this.distance; }
      for(var iOutput = 0; iOutput<6; iOutput++ ) {
        
        // base level based on distance
        var gain = galaxies.audio.DISTANCE_REF / (galaxies.audio.DISTANCE_REF + galaxies.audio.DISTANCE_ROLL * (this.distance - galaxies.audio.DISTANCE_REF)); // linear, to match panner algorithm in stereo mix
        if ( galaxies.audio.channelAngles[iOutput] !== null ) {
          
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
    try {
      this.source = galaxies.audio.audioCtx.createBufferSource();
      this.source.playbackRate.value = galaxies.engine.soundDilation;
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
      this.sound.volume = value;
    }
  });
 
  this.update = function( delta ) {
    if ( this.sound.source == null ) { return; }
    this.sound.updatePosition( galaxies.utils.rootPosition( this.object ) );
    
    var deltaDistance = (this.lastDistance - this.sound.distance)/delta;
    this.sound.source.playbackRate.value = Math.max(galaxies.engine.soundDilation +
        (deltaDistance/galaxies.audio.DOPPLER_FACTOR), galaxies.engine.soundDilation * 0.6);
    this.lastDistance = this.sound.distance;
  }
}

/** A simpler sound object that works the same way as Positioned Sound. May include
 * a stereo spatial mix, but it will be simple.
 * 
 * properties:
 * buffer, loop, start, dispose, baseVolume, position
 **/
galaxies.audio.SimpleSound = function( props ) {
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
    },
    get: function() {
      return this._volume;
    }
  });
  if ( typeof( props.baseVolume ) !=='number' ) { props.baseVolume = 1; }
  this.volume = props.baseVolume;
  
  this.startSound = function() {
    if ( this.source != null ) {
      this.source.stop(0);
    }
    try{
      this.source = galaxies.audio.audioCtx.createBufferSource();
      this.source.playbackRate.value = galaxies.engine.soundDilation;
      this.source.loop = this.loop;
      this.source.buffer = buffer;
      this.source.connect( this.muteVolume );
      this.source.start(0);
      
      //this.source.onended = function() { console.log("SimpleSound ended"); };
      
    } catch(e) {
      console.log("Unable to start sound", e );
    }
  }
  
  this.init = function() {
    this.preAmp.connect( galaxies.audio.simpleOutNode );
    
  }
  
  this.init();
  
  if ( props.start ) {
    this.startSound();
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



/// A multi-channel source that is mixed based on an arbitrary angle which
/// rotates the soundfield.
galaxies.audio.SoundField = function ( buffer ) {
  // List of the channel indices used by SoundField.
  // Only L, R, SL, and SR channels are rotated, so we list the corresponding indices here.
  var channelMap = [0, 1, 4, 5];
  var playThrough = [2, 3];

  var volumeNode = galaxies.audio.audioCtx.createGain();
  var splitter = galaxies.audio.audioCtx.createChannelSplitter(6);
  var combiner = galaxies.audio.audioCtx.createChannelMerger(6);

  this.changeSource = function (buffer) {
    if (this.source) {
      this.source.stop();
      this.source.disconnect();
      delete this.source;
    }

    this.source = galaxies.audio.audioCtx.createBufferSource();
    this.source.playbackRate.value = galaxies.engine.soundDilation;
    this.source.loop = true;
    this.source.buffer = buffer;

    this.angle = 0;
    this.angularVelocity = 1;

    this.gains = [];

    // Add input

    this.source.connect( volumeNode );

    volumeNode.disconnect();
    volumeNode.connect( splitter );

    combiner.disconnect();
    combiner.connect(galaxies.audio.outNode);

    // hook up channels that will not be remixed directly
    splitter.disconnect();
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

    this.source.start(0);
  };

  this.changeSource(buffer);

  Object.defineProperty(this, "volume", {
    set: function (value) {
      this._volume = value;
      volumeNode.gain.value = value;
    },
    get: function () {
      return this._volume
    }
  });
  
  this.volume = 0.6; // global music volume. should be a const

  
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
    case 'none':
      galaxies.audio.muteState = 'music';
      break;
    case 'music':
      galaxies.audio.muteState = 'all';
      break;
    case 'all':
    default:
      galaxies.audio.muteState = 'none';
      break;
  }

  galaxies.audio.applyMuteState();
};

galaxies.audio.applyMuteState = function() {
  switch (galaxies.audio.muteState) {
    case 'none':
      galaxies.audio.setAllMute(false);
      break;
    case 'music':
      galaxies.audio.setAllMute(false);
      galaxies.audio.setMusicMute(true);
      break;
    case 'all':
      galaxies.audio.setAllMute(true);
      break;
  }
};

// could be private
galaxies.audio.setAllMute = function( mute ) {
  galaxies.audio.setMusicMute( false );
  if ( mute ) {
    galaxies.audio.outNode.gain.value = 0;
    galaxies.audio.simpleOutNode.gain.value = 0;
  } else {
    galaxies.audio.outNode.gain.value = galaxies.audio.globalGain;
    galaxies.audio.simpleOutNode.gain.value = galaxies.audio.globalGain;
  }
}

// could be private
galaxies.audio.setMusicMute = function( mute ) {
  if ( mute ) {
    galaxies.audio.soundField.volume = 0;
  } else {
    galaxies.audio.soundField.volume = 0.6; // global music volume, should be a const
  }
}




