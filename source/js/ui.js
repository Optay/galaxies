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
  var levelDisplay = inGameHolder.querySelector(".level-display-text");
  var timerDisplay = inGameHolder.querySelector(".timer-display");
  var lifeDisplay = inGameHolder.querySelector(".life-display");
  var lifeHearts = lifeDisplay.querySelectorAll(".life-heart");
  var starDisplay = inGameHolder.querySelector(".star-display");
  var collectStars = starDisplay.querySelectorAll(".collect-star");
  var scoreDisplay = inGameHolder.querySelector(".score-display-text");
  var powerupCharge = inGameHolder.querySelector(".powerup-charge-display");
  
  
  // pause menu
  var pauseOverlay = uiHolder.querySelector(".pause-overlay");
  var pauseHolder = uiHolder.querySelector(".pause-menu");
  var pauseTitle = pauseHolder.querySelector(".pause-title");
  var resumeButton = pauseHolder.querySelector(".resume-button");
  var restartButton = pauseHolder.querySelector(".restart-button");
  var quitButton = pauseHolder.querySelector(".quit-button");

  // Level completion items
  var levelResults = uiHolder.querySelector(".level-results");
  var scoreStars = [
      levelResults.querySelector('.large-star'),
      levelResults.querySelectorAll('.small-star')[0],
      levelResults.querySelectorAll('.small-star')[1]
  ];
  var resultTitle = levelResults.querySelector(".level-done-title");
  
  // game over menu
  var gameOverHolder = uiHolder.querySelector(".game-over-menu");
  var gameOverTitle = gameOverHolder.querySelector(".game-over-title");
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
    

    function logoAppear() {
      loadingLogo.classList.add('logo-loading-layout');
/*      logo.style.width = 0;
      logo.style.height = 0;
      createjs.Tween.get(logo).to({width: 141, height:93 }, 500);*/
    }    

    
    
      
    // hook button elements
    playButton.addEventListener('click', onClickPlay );
    playButton.addEventListener('mouseover', onOverButton);
    playButton.addEventListener('touchstart', onClickPlay );
    playButton.addEventListener('touchstart', blockEvent );
    
    muteButton.addEventListener('click', onClickMute );
    muteButton.addEventListener('mousedown', blockEvent );
    muteButton.addEventListener('mouseover', onOverButton);
    muteButton.addEventListener('touchstart', onClickMute );
    muteButton.addEventListener('touchstart', blockEvent );
    
    pauseButton.addEventListener('click', onClickPause );
    pauseButton.addEventListener('mousedown', blockEvent );
    pauseButton.addEventListener('mouseover', onOverButton);
    pauseButton.addEventListener('touchstart', onClickPause );
    pauseButton.addEventListener('touchstart', blockEvent );
    
    resumeButton.addEventListener('click', onClickResume );
    resumeButton.addEventListener('mouseover', onOverButton);
    resumeButton.addEventListener('touchstart', blockEvent );
    resumeButton.addEventListener('touchstart', onClickResume );
    
    restartButton.addEventListener('click', onClickRestart );
    restartButton.addEventListener('mouseover', onOverButton);
    restartButton.addEventListener('touchstart', blockEvent );
    restartButton.addEventListener('touchstart', onClickRestart );
    
    restartButton2.addEventListener('click', onClickRestart );
    restartButton2.addEventListener('mouseover', onOverButton);
    restartButton2.addEventListener('touchstart', blockEvent );
    restartButton2.addEventListener('touchstart', onClickRestart );
    
    quitButton.addEventListener('click', onClickQuit );
    quitButton.addEventListener('mouseover', onOverButton);
    quitButton.addEventListener('touchstart', blockEvent );
    quitButton.addEventListener('touchstart', onClickQuit );
    
    quitButton2.addEventListener('click', onClickQuit );
    quitButton2.addEventListener('mouseover', onOverButton);
    quitButton2.addEventListener('touchstart', blockEvent );
    quitButton2.addEventListener('touchstart', onClickQuit );
    
    stereoButton.addEventListener('click', onClickStereo);
    stereoButton.addEventListener('mouseover', onOverButton);
    surroundButton.addEventListener('click', onClickSurround);
    surroundButton.addEventListener('mouseover', onOverButton);
    
    recommendSafari.addEventListener('mouseover', onOverButton);
    recommendEdge.addEventListener('mouseover', onOverButton);

  
    logoAppear();
    
    galaxies.utils.testAudioSupport( startLoad );
    
    // set background animation keyframe based on window size
    // update this when window is resized
  }
  
  var startLoad = function() {
    
    var handleComplete = function() {
      // Initialize audio context before showing audio controls
      galaxies.audio.initAudio( transitionToMenu );
      
    }
    var handleProgress = function( e ) {
      progressElement.innerHTML = Math.round(e.progress * 100).toString();
      // update ring
      progressRing.update( e.progress );
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
    // This could be a singleton, but we're just going to instantiate one like this.
    galaxies.audio.soundField = new galaxies.audio.SoundField( galaxies.audio.getSound('music') );
    galaxies.audio.soundField.volume = 0.24; // 0.24
    
    // Hide loading logo
    loadingLogo.classList.add('fade-out');
    // Initialize the 3D scene
    galaxies.engine.initScene();
    
    // Start title sequence
    titleSequence = new galaxies.TitleSequence();
    titleSequence.activate();
    
    // Wait for skybox fade, then transform play button
    createjs.Tween.get(progressElement)
      .wait(1000)
      .call( transformLoadingIndicator, this );
  }
  
  var transformLoadingIndicator = function() {
    // transition load indicator to play button
    progressElement.style.left = 0;
    createjs.Tween.get(progressElement).to({left:52}, 500, createjs.Ease.quadInOut).call( showPlayButton );
    var start = window.getComputedStyle(playSymbol, null).getPropertyValue("left");
    playSymbol.style.left = start;
    createjs.Tween.get(playSymbol).to({left:0}, 500, createjs.Ease.quadInOut);
    
    
    // Turn on the appropriate recommend link
    if ( !galaxies.utils.supportsEC3 ) {
      if ( galaxies.utils.isOSX() ) {
        recommendSafari.classList.remove('hidden');
        window.getComputedStyle(recommendSafari).bottom; // reflow
        recommendSafari.classList.add('browser-recommend-on');
      } else if ( galaxies.utils.isWindows() ) {
        recommendEdge.classList.remove('hidden');
        window.getComputedStyle(recommendEdge).bottom; // reflow
        recommendEdge.classList.add('browser-recommend-on');
      }
    }
    
    // Show stereo/surround buttons
    if (!galaxies.utils.isMobile() ) {
      audioControls.classList.add("fade-in");
      audioControls.classList.remove("hidden");
    }
    
    // Show mute button
    muteButton.classList.remove("hidden");
    //window.getComputedStyle(muteButton).right; // reflow
    muteButton.classList.add("fade-in");
    
    // Show Dolby logo
    if ( galaxies.utils.supportsEC3 ) {
      dolbyLogo.classList.add("fade-in");
      dolbyLogo.classList.remove("hidden");
    }
    
    
  }
  var showPlayButton = function() {
    loadRing.classList.add("hidden");
    
    playButton.classList.remove("hidden");
  }
  
  var showMenu = function() {
    //gameContainer.classList.add('hidden');
    inGameHolder.classList.add('hidden');
    hidePauseMenu();
    hideGameOver();
    clearTitle();
    
    // Loading logo should be removed
    loadingLogo.classList.remove('fade-out');
    loadingLogo.classList.add('hidden');
    
    titleSequence.activate();
    loadingHolder.classList.remove('hidden');
  }
  
  var showPauseButton = function() {
    pauseButton.classList.remove('hidden');
    window.getComputedStyle(pauseButton).left; // reflow
    pauseButton.classList.add('pause-button-on');
  }
  var hidePauseButton = function() {
    pauseButton.classList.remove('pause-button-on');
    pauseButton.classList.add('hidden');
  }
  
  /**
   * Show a title as yellow text that animates up and down from the bottom
   * of the screen. A title of 0 time will not be removed until titles are
   * manually cleared.
   */
  var titleQueue = [];
  var titleActive = false;
  var currentTitle = null;
  var showTitle = function( titleText, time ) {
    var newTitle = {
      text: titleText,
      time: time * 1000
    };
    
    titleQueue.push( newTitle );
    
    if ( (!titleActive) || (currentTitle.time===0) ) {
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
    window.getComputedStyle(title).top; // reflow
    
    title.classList.add('title-on');
    
    createjs.Tween.removeTweens( title );
    if ( nextTitle.time > 0 ) {
      createjs.Tween.get( title )
        .wait( nextTitle.time )
        .call( function() { title.classList.remove('title-on'); }, this )
        .wait( 1000 ) // CSS transition time
        .call( updateTitle );
    }
    
    currentTitle = nextTitle;
  }
  var clearTitle = function() {
    title.classList.remove('title-on');
    title.classList.add('hidden');
    titleQueue = [];
    currentTitle = null;
    
    createjs.Tween.removeTweens( title );
    titleActive = false;
  }

  var showLevelResults = function (bonusScore, roundAccuracy) {
    levelResults.classList.remove("hidden");

    setTimeout(function() {
      resultTitle.classList.add("level-done-title-on");

      for (var i = 0; i < 3; ++i) {
        scaleStar(scoreStars[i], i < galaxies.engine.starsCollectedRound, 500 + i * 300);
      }
    }, 17);

    title.classList.remove("hidden");

    setTimeout(function () {showRoundScore(bonusScore, roundAccuracy);}, 1600)
  };

  var scaleStar = function (star, collected, delay) {
    var easing = createjs.Ease.getElasticOut(2, 0.3);

    star.style.transform = "scale(0)";

    if (collected) {
      star.classList.remove("empty");
    }

    setTimeout(function () {
      var tween = createjs.Tween.get(star, {override: true})
          .to({x: 10}, 1000);

      tween.addEventListener("change", function () {
        if (!tween.duration) {
          return;
        }

        var normalizedPosition = tween.position / tween.duration;
        var scaleValue = easing(normalizedPosition);

        star.style.transform = "scale(" + scaleValue + ")";
      });
    }, delay);
  };

  var showRoundScore = function (bonus, roundAccuracy) {
    roundAccuracy = Math.round(roundAccuracy * 100);

    title.innerHTML = '<div class="score-title">BONUS <span class="bonus-score">0</span></div><div class="acc-title">ACCURACY <span class="round-acc">0</span>%</div>';
    title.classList.add("title-on");

    var bonusElem = title.querySelector(".bonus-score"),
        accTitle = title.querySelector(".acc-title"),
        roundAccElem = accTitle.querySelector(".round-acc");

    var scoreTween = createjs.Tween.get(bonusElem)
        .to({innerHTML: bonus}, 2500);

    scoreTween.addEventListener("change", function () {
      if (!scoreTween.duration) {
        return;
      }

      var interimScore = Math.round(bonus * scoreTween.position / scoreTween.duration);

      bonusElem.innerHTML = galaxies.utils.addCommas(interimScore);
    });

    setTimeout(function () {
      accTitle.classList.add("acc-title-on");

      var accTween = createjs.Tween.get(roundAccElem)
          .to({innerHTML: roundAccuracy}, 1250)
          .wait(1500);

      accTween.addEventListener("change", function () {
        if (!accTween.duration) {
          return;
        }

        roundAccElem.innerHTML = Math.round(roundAccuracy * accTween.position / accTween.duration);
      });
    }, 1250);
  };

  var clearLevelResults = function () {
    levelResults.classList.add("fade");
    title.classList.remove("title-on");

    setTimeout(function () {
      clearTitle();
      levelResults.classList.add("hidden");
      levelResults.classList.remove("fade");
      resultTitle.classList.remove("level-done-title-on");

      for (var i = 0; i < 3; ++i) {
        scoreStars[i].style.transform = "scale(0)";
      }
    }, 1500);
  };

  // Stop event from reaching other listeners.
  // Used to keep ui buttons from causing fire events on underlying game element.
  var blockEvent = function(e) {
    
    e.stopPropagation();
    
  }

  /// Start the game
  var onClickPlay = function(e) {
    loadingHolder.classList.add('hidden');
    titleSequence.deactivate();
    
    inGameHolder.classList.remove('hidden');
    showPauseButton();
    
    if ( galaxies.engine.gameInitialized ) {
      galaxies.engine.restartGame();
    } else {
      galaxies.engine.initGame();
    }
  }
  
  var onClickMute = function(e) {
    e.preventDefault();
    
    // Change the mute state
    galaxies.audio.toggleMuteState();
    
    // Update the button class
    if ( galaxies.audio.muteState === 'music' ) {
      
    } else if ( galaxies.audio.muteState === 'all' ) {
      
    } else {
      
    }
    
    console.log("Toggle mute");
  }
  
  var onClickPause = function(e) {
    e.preventDefault();
    
    pauseOverlay.classList.remove('hidden');
    window.getComputedStyle(pauseOverlay).top; // reflow
    pauseOverlay.classList.add('pause-overlay-on');
    
    pauseHolder.classList.remove('hidden');
    window.getComputedStyle(pauseTitle).top; // reflow
    pauseTitle.classList.add('pause-title-on');
    
    galaxies.engine.pauseGame();
  }
  var onClickResume = function(e) {
    hidePauseMenu();
    galaxies.engine.resumeGame();
  }
  var onClickRestart = function(e) {
    hidePauseMenu();
    hideGameOver();
    
    galaxies.engine.restartGame();
  }
  var onClickQuit = function(e) {
    hidePauseMenu();
    
    galaxies.engine.endGame();
  }
  var hidePauseMenu = function() {
    pauseTitle.classList.remove('pause-title-on');
    window.getComputedStyle(pauseTitle).top; // reflow
    
    pauseHolder.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    pauseOverlay.classList.remove('pause-overlay-on');
    
  }
  
  
  var onClickStereo = function(e) {
    galaxies.audio.toggleTargetMix( false );
  }
  var onClickSurround = function(e) {
    galaxies.audio.toggleTargetMix( true );
  }
  var setMixButtons = function( isSurround ) {
    if ( isSurround ) {
      stereoButton.classList.remove('active');
      surroundButton.classList.add('active');
    } else {
      stereoButton.classList.add('active');
      surroundButton.classList.remove('active');
    }
  }
  
  function onOverButton(e) {
    galaxies.audio.playSound( galaxies.audio.getSound('buttonover') );
  }
  
  
  
  var showGameOver = function( isWin, score, bonus, accuracy ) {
    gameOverHolder.classList.remove('hidden');
    
    window.getComputedStyle(gameOverTitle).top; // reflow
    gameOverTitle.classList.add('game-over-title-on');
    
    gameOverTitle.innerText = isWin ? "GALACTIC HI-FIVE" : "GAME OVER";
    
    showTitle( "SCORE " + galaxies.utils.addCommas(score) +
               "<br>BONUS " + galaxies.utils.addCommas(bonus) +
               "<br>ACCURACY " + Math.round(accuracy * 100) + '%');
  }
  var hideGameOver = function() {
    gameOverTitle.classList.remove('game-over-title-on');
    window.getComputedStyle(gameOverTitle).top; // reflow
    
    gameOverHolder.classList.add('hidden');
  }
  
  var updateTimer = function( time ) {
    timerDisplay.innerHTML = time.toFixed(0);
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

  var getFirstEmptyHeartPosition = function () {
    var numHearts = lifeHearts.length,
        i;

    for (i = 0; i < numHearts; ++i) {
      if (lifeHearts[i].classList.contains("empty")) {
        return lifeHearts[i].getBoundingClientRect();
      }
    }

    return null
  };

  var createFloatingDiv = function (className) {
    var floatingDiv = document.createElement("div");

    floatingDiv.className = className;
    floatingDiv.style.position = "absolute";

    document.body.appendChild(floatingDiv);

    return floatingDiv;
  };

  var createFloatingHeart = function () {
    return createFloatingDiv("animated life-heart");
  };
  
  var updateStars = function( starsCollected ) {
    for ( var i=0; i<collectStars.length; i++ ) {
      if ( (i+1)<=starsCollected ) {
        collectStars[i].classList.remove('empty');
      } else {
        collectStars[i].classList.add('empty');
      }
    }
  }

  var getFirstEmptyStarPosition = function () {
    var numStars = collectStars.length,
        i;

    for (i = 0; i < numStars; ++i) {
      if (collectStars[i].classList.contains("empty")) {
        return collectStars[i].getBoundingClientRect();
      }
    }

    return null

  };

  var createFloatingStar = function () {
    return createFloatingDiv("animated collect-star");
  };

  var animateCollection = function (divElem, sourceObject, finalPosition, callback) {
    var screenPos = galaxies.utils.getScreenPosition(sourceObject, 50);

    divElem.style.left = (screenPos.x - finalPosition.width / 2) + "px";
    divElem.style.top = (screenPos.y - finalPosition.height / 2) + "px";
    divElem.style.transform = "scale(0.5)";

    createjs.Tween.get(divElem.style)
        .set({transform: "scale(2)"})
        .wait(500)
        .set({transform: "scale(1)"});

    createjs.Tween.get(divElem.style)
        .set({left: finalPosition.left + "px", top: finalPosition.top + "px"})
        .wait(1000)
        .call(function () {
          divElem.remove();

          if (typeof callback === "function") {
            callback();
          }
        });
  };
  
  var updatePowerupCharge = function( newValue ) {
    powerupCharge.innerHTML = newValue.toFixed(2);
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
    showLevelResults: showLevelResults,
    clearLevelResults: clearLevelResults,
    updateLevel: updateLevel,
    updateTimer: updateTimer,
    updateScore: updateScore,
    updateLife: updateLife,
    getFirstEmptyHeartPosition: getFirstEmptyHeartPosition,
    createFloatingHeart: createFloatingHeart,
    updateStars: updateStars,
    getFirstEmptyStarPosition: getFirstEmptyStarPosition,
    createFloatingStar: createFloatingStar,
    animateCollection: animateCollection,
    updatePowerupCharge: updatePowerupCharge,
    setMixButtons: setMixButtons
  };
  
  
}());



