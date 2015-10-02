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








