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
  
  var geometry = new THREE.CylinderGeometry( 0.4, 0.4, 0.25, 8, 1, false);
  var objectColor = new THREE.Color( 1,1,1 );
  var material = new THREE.MeshLambertMaterial( {
      color: objectColor.getHex(),
      emissive: 0x333333,
      shading: THREE.SmoothShading } );
  
  this.object = new THREE.Mesh( geometry, material );
  this.object.rotation.set(0,0,Math.PI/2);
                     
  var anchor = new THREE.Object3D();
  anchor.add( this.object );
  rootObject.add( anchor );
  
  var angle = Math.random() * PI_2; // random start angle
  var angularSpeed = 0.7 * speedScale;
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
  var targetPositions = [
    new THREE.Vector3(1,0,cameraZ + 10),
    new THREE.Vector3(OBSTACLE_VISIBLE_RADIUS,0,0),
    new THREE.Vector3(OBSTACLE_VISIBLE_RADIUS * 0.9,0,0),
    new THREE.Vector3(OBSTACLE_VISIBLE_RADIUS * 0.75,0,0),
    new THREE.Vector3(1,0,cameraZ + 10)
  ];
  targetPositions[1].z = getConifiedDepth( targetPositions[1] );
  targetPositions[2].z = getConifiedDepth( targetPositions[2] );
  targetPositions[3].z = getConifiedDepth( targetPositions[3] );
  
  var tween = createjs.Ease.quadInOut;
  
  var stepAngle = 0;
  var transitionAngle = 0;
  var step = 1;
  this.object.position.copy( targetPositions[0] );
  var lastPosition = targetPositions[0];
  
  this.isHittable = false;
  this.alive = true;
  
  this.update = function( delta ) {
    angle += angularSpeed * delta;
    anchor.rotation.set(0,0,angle);
    
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
    }
    
  }
  
  this.hit = function() {
    if ( !this.isHittable || !this.alive ) { return; }
    this.alive = false;
    this.isHittable = false;
    
    // score is scaled by how far away you hit the ufo.
    showCombo( this.points * (4-step), this.object );
    
    step = (targetPositions.length -1);
    lastPosition = this.object.position.clone();
    stepAngle = angle + PI_2;
    transitionAngle = angle + (Math.PI/2);
    
    // play sound
    playSound( getSound('shoot',false), rootPosition(this.object), 1 );
    
  }
  
  // put object at step 0 and idle it for a random time
  this.reset = function() {
    step = 0;
    transitionAngle = angle + Math.random() * 3 * Math.PI;
    stepAngle = transitionAngle;
    this.alive = true;
    lastPosition = targetPositions[0];
    this.object.position.copy( targetPositions[0] );
  }
  
  this.reset();

}

function Asteroid( _speed, _spiral, _geometry, _tumble, _points ) {
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
      shading: THREE.FlatShading } );
  
  this.object = new THREE.Mesh( geometry, material );
  
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
  
  this.hit = function( hitPosition, ricochet ) {
    //if ( this.ricochet ) {
    
    // play sound
    playSound( getSound('shoot',false), rootPosition(this.object), 1 );
    
    if ( this.state === 'ricocheting' ) {
      showCombo( (this.ricochetCount * this.points), this.object );
      this.destroy();
      return;
    }
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
    this.state = 'inactive';
    this.remove();
    //this.resetPosition();
  }
  this.remove = function() {
    if ( this.object.parent!=null) {
      this.object.parent.remove(this.object);
    }
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

var windowHalfX = 0;
var windowHalfY = 0;
var mouseX = 0;
var mouseY = 0;

var rootObject;
var rootAxis;
var rootRotationSpeed = 0.05;

var score;
var level;
var playerLife;

var levelTimer = 0;
var levelTime = 30;
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
var OBSTACLE_START_RADIUS = OBSTACLE_VISIBLE_RADIUS * 1.2;

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
        "images/spacesky_right1.png",   // Note:  The order in which
        "images/spacesky_left2.png",   //   the images are listed is
        "images/spacesky_top3.png",   //   important!
        "images/spacesky_bottom4.png",  
        "images/spacesky_front5.png",   
        "images/spacesky_back6.png"
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

  var texture = THREE.ImageUtils.loadTextureCube( textureURLs );
  
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
  planet.add( characterRotator );
  
  var characterMap = THREE.ImageUtils.loadTexture( "images/lux.png" );
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
  
  
  document.addEventListener( 'mousedown', onDocumentMouseDown, false );
  document.addEventListener( 'mouseup', onDocumentMouseUp, false );
  document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  
  document.addEventListener( 'touchstart', onDocumentTouchStart, false );
  document.addEventListener( 'touchend', onDocumentMouseUp, false );
  document.addEventListener( 'touchleave', onDocumentMouseUp, false );
  document.addEventListener( 'touchmove', onDocumentTouchMove, false );

  //

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

  }, false );

  var debugFormElement = document.getElementById("debugForm");
  var audioToggle = debugFormElement.querySelector("input[name='audio']");
  audioToggle.addEventListener('click', function(event) { toggleAudio( audioToggle.checked ); } );
  var soundFieldToggle = debugFormElement.querySelector("input[name='soundField']");
  soundFieldToggle.addEventListener('click', function(event) { toggleSoundField( soundFieldToggle.checked ); } );
  
  
  var soundLoader = new SoundLoader( startGame );
}
function startGame() {
  
  ufo = new Ufo();
  
  // audio
  listenerObject = camera;
  var testSource = new DirectionalSource( getSound('ufo'), ufo.object );
  directionalSources.push( testSource );
  
  soundField = new SoundField( getSound('music') );
  //
  
  resetGame();
  initLevel();

  window.addEventListener( 'resize', onWindowResize, false );
  onWindowResize();
  
  animate();
}

function initLevel() {
  updateLevelNumber();
  
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
  
  for ( var i=1; i<20; i++ ) {
    var planetLevel = ((i-1) % LEVELS_PER_PLANET); // level progress on planet
    var planet = Math.floor( i/LEVELS_PER_PLANET ); // Planet number
    var planetFirstSpeed = 1 + 1/(1+Math.exp(4-planet));
    var planetLastSpeed = 1 + 1.5/(1+Math.exp(1-planet*2));
    
    console.log( i, THREE.Math.mapLinear(planetLevel, 0, 2, planetFirstSpeed, planetLastSpeed ) );
  }
  
  
  
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
  switch(type) {
    case "asteroid":
      speed = 0.2;
      geometry = new THREE.BoxGeometry(radius, radius, radius);
      tumble = true;
      points = 100;
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
      break;
      
  }
  
  var obstacle = new Asteroid( speed, spiral, geometry, tumble, points );
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
    playSound( getSound('shoot',false), rootPosition(character), 2 );
    
}


function animate() {

	requestAnimationFrame( animate );
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
  if (playerLife<=0) {
    gameOver();
    return;
  }
  updateLife();
  
  if ( !createjs.Tween.hasActiveTweens(character.position) ) {
    createjs.Tween.get(character.position).to({y:2.5}, 250, createjs.Ease.quadOut).to({y:1.75}, 250, createjs.Ease.quadOut);
  }
}

function gameOver() {
  resetGame();
  initLevel();
}
function resetGame() {
  // reset game
  level = 1;
  score = 0;
  playerLife = 3;
  
  updateLevelNumber();
  updateLife();
  updateScore();
  
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
  updateScore();
    
}

function removeCombo( element ) {
  element.remove();
}

function updateScore() {
  document.getElementById("score").innerHTML = score.toString();
}

function updateLevelNumber() {
  var levelElement = document.getElementById("level");
  levelElement.innerHTML = level.toString();
}
function updateLife() {
  var element = document.getElementById("life");
  element.innerHTML = playerLife.toString();
}



function flatLength( vector ) {
  return Math.sqrt( Math.pow(vector.x, 2) + Math.pow(vector.y,2) );
}
function flatLengthSqr(vector ) {
  return (Math.pow(vector.x, 2) + Math.pow(vector.y,2));
}

function rootPosition( object ) {
  var foo = object.position.clone();
   
  return rootObject.worldToLocal( object.parent.localToWorld( foo ) );

}



// DEBUG
function toggleAudio( value ) {
  console.log("toggleAudio", value);
  if ( value ) {
    directionalSources[0].volume = 1;
  } else {
    directionalSources[0].volume = 0;
  }
}
function toggleSoundField( value ) {
  if ( value ) {
    soundField.volume = 0.5;
  } else {
    soundField.volume = 0;
  }
}

