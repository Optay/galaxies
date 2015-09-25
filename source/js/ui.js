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








