'use strict';

this.galaxies = this.galaxies || {};


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
  
  // recommend buttons
  var recommendSafari = loadingHolder.querySelector(".recommend-safari");
  var recommendEdge = loadingHolder.querySelector(".recommend-edge");
  
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
  
  // title sequence
  var titleSequence;

  var progressRing = (function() {
    var elementA = playHolder.querySelector('.progress-fill-a');
    var elementB = playHolder.querySelector('.progress-fill-b');
    var secondHalf = false;
    
    var update = function(value) {
      var angle = 360 * value - 180;
      if (!secondHalf) {
        var styleObject = elementA.style;
        styleObject['-webkit-transform'] = "rotate(" + angle.toFixed(2) + "deg)";
        styleObject['transform'] = "rotate(" + angle.toFixed(2) + "deg)";
        //console.log( angle, styleObject.left, styleObject.transform);
        if (value>=0.5) {
          secondHalf = true;
          styleObject['-webkit-transform'] = "rotate(0deg)";
          styleObject['transform'] = "rotate(0deg)";
          elementB.classList.remove('hidden');
        }
      } else {
        var styleObject = elementB.style;
        styleObject['-webkit-transform'] = "rotate(" + angle + "deg)";
        styleObject['transform'] = "rotate(" + angle + "deg)";
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
    function logoAppear() {
      loadingLogo.classList.add('logo-loading-layout');
/*      logo.style.width = 0;
      logo.style.height = 0;
      createjs.Tween.get(logo).to({width: 141, height:93 }, 500);*/
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
    

  
    logoAppear();
    
    galaxies.utils.testAudioSupport( startLoad );
    
    // set background animation keyframe based on window size
    // update this when window is resized
  }
  
  var startLoad = function() {
    
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
    
    galaxies.loadAssets( handleProgress, handleComplete );
    
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
    
    // Start the music
    soundField = new SoundField( getSound('music') );
    soundField.setVolume(0.24); // 0.24
    
    /*
    var test = document.createElement( 'img' );
    test.src = galaxies.queue.getResult('lux').src;
    document.getElementById('menuHolder').appendChild(test);
    */
    
    // Turn on the appropriate recommend link
    if ( !galaxies.utils.supportsEC3 ) {
      if ( galaxies.utils.isOSX() ) {
        recommendSafari.classList.remove('hidden');
      } else if ( galaxies.utils.isWindows() ) {
        recommendEdge.classList.remove('hidden');
      }
    }
    
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
    loadingLogo.classList.add('hidden');
    /*
    loadingLogo.classList.remove('logo-loading-layout');
    loadingLogo.classList.add("logo-final-layout");
    */
    playHolder.classList.add("play-final-layout");
    
    
    // Initialize the 3D scene
    initScene();
    // start title sequence
    titleSequence = new galaxies.TitleSequence();
    titleSequence.activate();
    
  }
  var showPlayButton = function() {
    loadRing.classList.add("hidden");
    
    playButton.classList.remove("hidden");
  }
  
  var showMenu = function() {
    //gameContainer.classList.add('hidden');
    inGameHolder.classList.add('hidden');
    pauseHolder.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    gameOverHolder.classList.add('hidden');
    clearTitle();
    
    titleSequence.activate();
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
    titleSequence.deactivate();
    
    //gameContainer.classList.remove('hidden');
    inGameHolder.classList.remove('hidden');
    showPauseButton();
    
    if ( gameInitialized ) {
      restartGame();
    } else {
      initGame();
    }
  }
  
  var onClickMute = function(e) {
    // Change the mute state
    toggleMuteState();
    
    // Update the button class
    if ( muteState === 'music' ) {
      
    } else if ( muteState === 'all' ) {
      
    } else {
      
    }
    
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








