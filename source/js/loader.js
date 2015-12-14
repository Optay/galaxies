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
    { id: 'titleExtraTrunkford', src: 'title_trunkford_in_ufo.png' },
    { id: 'heart', src: 'heart_life.png' },
    { id: 'star', src: 'star_collect.png' }
    
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
