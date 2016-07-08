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

  var isMobile = galaxies.utils.isMobile();
  // Don't use EC3 in the mobile version
  //if ( galaxies.utils.supportsEC3 ) { ext = '.mp4'; }
  if ( false ) { ext = '.mp4'; }
  else if ( galaxies.utils.supportsOGG ) { ext='.ogg'; }
  else { ext = '.m4a'; }
  
  //ext = '.foo'; // TEST, prevents any audio files from loading
  
  console.log("Audio extension selected:", ext );
  
  // Add audio files
  // Note that audio files are added as binary data because they will need to be decoded by the web audio context object.
  // The context object will not be created until after preload is complete, so the binary data will simply be cached
  // by the preloader as binary data and handled later in the initialization.
  var audioItems = [
    { id: 'shoot1', src: 'fx/weapon/shuttlecock_release_01', type: createjs.AbstractLoader.BINARY },
    { id: 'shoot2', src: 'fx/weapon/shuttlecock_release_02', type: createjs.AbstractLoader.BINARY },
    { id: 'shoot3', src: 'fx/weapon/shuttlecock_release_03', type: createjs.AbstractLoader.BINARY },
    { id: 'shoot4', src: 'fx/weapon/shuttlecock_release_04', type: createjs.AbstractLoader.BINARY },
    { id: 'shoot5', src: 'fx/weapon/shuttlecock_release_05', type: createjs.AbstractLoader.BINARY },
    { id: 'asteroidsplode1', src: 'fx/impact/asteroid_explode_01', type: createjs.AbstractLoader.BINARY },
    { id: 'asteroidsplode2', src: 'fx/impact/asteroid_explode_02', type: createjs.AbstractLoader.BINARY },
    { id: 'asteroidsplode3', src: 'fx/impact/asteroid_explode_03', type: createjs.AbstractLoader.BINARY },
    { id: 'cometexplode', src: 'fx/impact/comet_explode_01', type: createjs.AbstractLoader.BINARY },
    { id: 'cometloop', src: 'fx/environment/comet_fire_loop', type: createjs.AbstractLoader.BINARY },
    { id: 'fpo1', src: 'fx/UFO_laser_fire', type: createjs.AbstractLoader.BINARY },
    { id: 'ufo', src: 'fx/environment/ufo_engine_loop', type: createjs.AbstractLoader.BINARY },
    { id: 'music', src: 'music/music_5_1_loop', type: createjs.AbstractLoader.BINARY },
    { id: 'ufohit1', src: 'fx/impact/ufo_hit_01', type: createjs.AbstractLoader.BINARY },
    { id: 'ufohit2', src: 'fx/impact/ufo_hit_02', type: createjs.AbstractLoader.BINARY },
    { id: 'ufoshoot', src: 'fx/UFO_laser_fire', type: createjs.AbstractLoader.BINARY },
    { id: 'planetsplode', src: 'fx/planet_explode', type: createjs.AbstractLoader.BINARY },
    { id: 'teleportin', src: 'fx/teleport_gliss_up_effect', type: createjs.AbstractLoader.BINARY },
    { id: 'teleportout', src: 'fx/teleport_gliss_down_effect', type: createjs.AbstractLoader.BINARY },
    { id: 'metalhit1', src: 'fx/impact/metal_hit1', type: createjs.AbstractLoader.BINARY },
    { id: 'metalhit2', src: 'fx/impact/metal_hit2', type: createjs.AbstractLoader.BINARY },
    { id: 'metalhit3', src: 'fx/impact/metal_hit3', type: createjs.AbstractLoader.BINARY },
    { id: 'titlewoosh', src:'fx/whoosh', type: createjs.AbstractLoader.BINARY },
    { id: 'satellitesplode', src:'fx/pod_explode', type: createjs.AbstractLoader.BINARY },
    { id: 'asteroidhit1', src:'fx/environment/asteroid_debris_01', type: createjs.AbstractLoader.BINARY },
    { id: 'asteroidhit2', src:'fx/environment/asteroid_debris_02', type: createjs.AbstractLoader.BINARY },
    { id: 'asteroidhit3', src:'fx/environment/asteroid_debris_03', type: createjs.AbstractLoader.BINARY },
    { id: 'asteroidhit4', src:'fx/environment/asteroid_debris_04', type: createjs.AbstractLoader.BINARY },
    { id: 'trunkfordlaugh1', src:'characters/trunkford_laugh_01', type: createjs.AbstractLoader.BINARY },
    { id: 'trunkfordlaugh2', src:'characters/trunkford_laugh_02', type: createjs.AbstractLoader.BINARY },
    { id: 'trunkfordlaugh3', src:'characters/trunkford_laugh_03', type: createjs.AbstractLoader.BINARY },
    { id: 'trunkfordlaugh4', src:'characters/trunkford_laugh_04', type: createjs.AbstractLoader.BINARY },
    { id: 'buttonover', src:'interface/button_rollover', type: createjs.AbstractLoader.BINARY },
    { id: 'starcollect', src:'fx/collectible/star', type: createjs.AbstractLoader.BINARY },
    { id: 'heartcollect', src:'fx/collectible/heart', type: createjs.AbstractLoader.BINARY },
    { id: 'powerupcollect', src: 'fx/collectible/powerup', type: createjs.AbstractLoader.BINARY },
    { id: 'round3music', src: 'music/music_round3', type: createjs.AbstractLoader.BINARY },
    { id: 'aliengrowl', src: 'characters/alien_growl', type: createjs.AbstractLoader.BINARY },
    { id: 'tripleraquet', src: 'fx/weapon/triple_raquet_fire', type: createjs.AbstractLoader.BINARY }

    
    
  ];
  for (var i=0; i< audioItems.length; i++ ) {
    audioItems[i].src = 'audio/' + audioItems[i].src + ext;
  }
  assetManifest = assetManifest.concat(audioItems);
  
  // add texture images
  var imageItems = [
    { id: 'skyboxright1', src: 'environment/' + (isMobile ? '1x' : '2x') + '/spacesky_right1.jpg' },
    { id: 'skyboxleft2', src: 'environment/' + (isMobile ? '1x' : '2x') + '/spacesky_left2.jpg' },
    { id: 'skyboxtop3', src: 'environment/' + (isMobile ? '1x' : '2x') + '/spacesky_top3.jpg' },
    { id: 'skyboxbottom4', src: 'environment/' + (isMobile ? '1x' : '2x') + '/spacesky_bottom4.jpg' },
    { id: 'skyboxfront5', src: 'environment/' + (isMobile ? '1x' : '2x') + '/spacesky_front5.jpg' },
    { id: 'skyboxback6', src: 'environment/' + (isMobile ? '1x' : '2x') + '/spacesky_back6.jpg' },
    { id: 'lux', src: 'sprites/lux.png' },
    { id: 'luxclone', src: 'sprites/lux_clone.png' },
    { id: 'luxgolden', src: 'sprites/lux_golden.png' },
    { id: 'luxspread', src: 'sprites/lux_triple.png' },
    { id: 'trunkford', src: 'sprites/trunkford.png' },
    { id: 'projhitparticle', src: 'effects/hit_sprite.png' },
    { id: 'asteroidcolor', src:'textures/asteroid_color.jpg' },
    { id: 'asteroidnormal', src:'textures/asteroid_normal.jpg' },
    { id: 'spikycolor', src:'textures/asteroid_spiky_v2_color.jpg' },
    { id: 'spikynormal', src:'textures/asteroid_spiky_v2_normal.jpg' },
    { id: 'spikyspecular', src:'textures/asteroid_spiky_v2_specular.jpg' },
    { id: 'spikyemissive', src:'textures/asteroid_spiky_v2_emissive.jpg' },
    { id: 'satellitecolor', src:'textures/mercury_pod_color.jpg' },
    { id: 'starparticle', src: 'effects/star.png' },
    { id: 'moonocclusion', src: 'textures/moon_lores_occlusion.jpg' },
    { id: 'moonnormal', src: 'textures/moon_lores_normal.jpg' },
    { id: 'laserbeam', src: 'effects/laser_rippled_128x512.png' },
    { id: 'ufocolor', src: 'textures/ufo_col.jpg' },
    { id: 'projcolor', src: 'textures/shuttlecock_col.jpg' },
    { id: 'title5', src: 'interface/logo_feisty_galaxies.png' },
    { id: 'title1', src: 'interface/title_01_luxurious_animals.png' },
    { id: 'title2', src: 'interface/title_02_luxamillion.png' },
    { id: 'title3', src: 'interface/title_03_dolby.png' },
    { id: 'title4', src: 'interface/title_04_trunkford.png' },
    { id: 'titleExtraLux', src: 'interface/title_luxamillion_planet.png' },
    { id: 'titleExtraTrunkford', src: 'interface/title_trunkford_in_ufo.png' },
    { id: 'heart', src: 'sprites/heart_life.png' },
    { id: 'flatheart', src: 'sprites/flat_heart.png' },
    { id: 'star', src: 'sprites/star_collect.png' },
    { id: 'slomo', src: 'sprites/clock.png'},
    { id: 'shield', src: 'sprites/shield.png'},
    { id: 'alienproicon', src: 'sprites/alien_pro_icon.png' },
    { id: 'rainbowicon', src: 'sprites/rainbow_of_death_icon.png' },
    { id: 'tripleicon', src: 'sprites/triple_racquet_icon.png' },
    { id: 'planetjupiter', src: 'environment/planet_jupiter.png' },
    { id: 'planetmars', src: 'environment/planet_mars.png' },
    { id: 'planetpluto', src: 'environment/planet_1.png' },
    { id: 'planetneptune', src: 'environment/planet_2.png' },
    { id: 'planeturanus', src: 'environment/planet_3.png' },
    { id: 'planetsaturn', src: 'environment/planet_4.png' },
    { id: 'planetjupiter', src: 'environment/planet_5.png' },
    { id: 'planetmars', src: 'environment/planet_6.png' },
    { id: 'planetearth', src: 'environment/planet_7.png' },
    { id: 'sparkle', src: 'effects/sparticle.png' },
    { id: 'smoke', src: 'effects/smokeparticle.png' },
    { id: 'lensFlare', src: 'effects/lensflare3.png' },
    { id: 'sun', src: 'environment/sun_on_black.jpg' },
    { id: 'charactershadow', src: 'sprites/character_shadow.png' },
    { id: 'explosionpoof', src: 'sprites/powerup_explosion_bw.png' },
    { id: 'powerupcollecteffect', src: 'sprites/powerup_collection.png' },
    { id: 'clonegradient', src: 'gradients/clone.png' },
    { id: 'goldengradient', src: 'gradients/golden.png' },
    { id: 'heartgradient', src: 'gradients/heart.png' },
    { id: 'shieldgradient', src: 'gradients/shield.png' },
    { id: 'spreadgradient', src: 'gradients/spread.png' },
    { id: 'stargradient', src: 'gradients/star.png' },
    { id: 'firegradient', src: 'gradients/fire.png' },
    { id: 'bluefiregradient', src: 'gradients/blueFire.png' },
    { id: 'toonexplosion', src: 'sprites/game_fire_explosion.png' },
    { id: 'planetexplosion', src: 'sprites/game_over_explosion.png' },
    { id: 'bosstop', src: 'sprites/boss_1_top_no_eyes.png' },
    { id: 'bossbottom', src: 'sprites/boss_2_bottom.png' },
    { id: 'bossmiddle', src: 'sprites/boss_3_middle.png' },
    { id: 'bosseye1', src: 'sprites/boss_eye_1.png' },
    { id: 'bosseye2', src: 'sprites/boss_eye_2.png' },
    { id: 'bosseye3', src: 'sprites/boss_eye_3.png' },
    { id: 'bosseye4', src: 'sprites/boss_eye_4.png' },
    { id: 'bosseyeball', src: 'sprites/boss_eyeball.png' },
    { id: 'bosseyelid1', src: 'sprites/boss_eyelid_1.png' },
    { id: 'bosseyelid2', src: 'sprites/boss_eyelid_2.png' },
    { id: 'bosseyelid3', src: 'sprites/boss_eyelid_3.png' },
    { id: 'bosseyelid4', src: 'sprites/boss_eyelid_4.png' }
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
    { id: 'satellitedebrismodel', src: 'models/pod_chunk.obj', type: createjs.AbstractLoader.TEXT },
    { id: 'spikyasteroidmodel', src: 'models/asteroid_spiky_v2.obj', type: createjs.AbstractLoader.TEXT }

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
