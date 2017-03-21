"use strict";

this.galaxies = this.galaxies || {};

this.galaxies.Player = function() {
  
  var characters = {};
  
  var rootObject = new THREE.Object3D();
  rootObject.position.z = 1;
  var characterRotator = new THREE.Object3D();

  rootObject.add(characterRotator);

  var characterMap = new THREE.Texture( galaxies.queue.getResult('lux') );
  characterMap.needsUpdate = true;

  var frames = galaxies.utils.generateSpriteFrames(new THREE.Vector2(0, 0), new THREE.Vector2(256, 256),
      new THREE.Vector2(8192, 256), 16, new THREE.Vector2(0, 0), 0.5);

  var baseAnimator = new galaxies.SpriteSheet(characterMap, frames, 30);
  var baseAspectRatio = 1;

  var baseTeleportMap = new THREE.Texture( galaxies.queue.getResult('lux') );
  baseTeleportMap.needsUpdate = true;

  frames = galaxies.utils.generateSpriteFrames(new THREE.Vector2(4114, 0), new THREE.Vector2(256, 256),
      new THREE.Vector2(8192, 256), 4, new THREE.Vector2(0, 0), 0.5);

  var baseTeleport = new galaxies.SpriteSheet(baseTeleportMap, frames, 30);
  
  
  var goldenMap = new THREE.Texture( galaxies.queue.getResult('luxgolden') );
  goldenMap.needsUpdate = true;

  frames = galaxies.utils.generateSpriteFrames(new THREE.Vector2(0, 0), new THREE.Vector2(256, 256),
      new THREE.Vector2(8192, 256), 16, new THREE.Vector2(0, 0), 0.5);

  var goldenAnimator = new galaxies.SpriteSheet(goldenMap, frames, 30);
  var goldenAspectRatio = 1;

  var goldenTeleportMap = new THREE.Texture( galaxies.queue.getResult('luxgolden') );
  goldenTeleportMap.needsUpdate = true;

  frames = galaxies.utils.generateSpriteFrames(new THREE.Vector2(4114, 0), new THREE.Vector2(256, 256),
      new THREE.Vector2(8192, 256), 4, new THREE.Vector2(0, 0), 0.5);

  var goldenTeleport = new galaxies.SpriteSheet(goldenTeleportMap, frames, 30);
  
  var spreadMap = new THREE.Texture( galaxies.queue.getResult('luxspread') );
  spreadMap.needsUpdate = true;

  frames = galaxies.utils.generateSpriteFrames(new THREE.Vector2(0, 0), new THREE.Vector2(256, 256),
      new THREE.Vector2(8192, 256), 22, new THREE.Vector2(3, 0), 0.5);

  var spreadAnimator = new galaxies.SpriteSheet(spreadMap, frames, 30);
  var spreadAspectRatio = 1;

  var spreadTeleportMap = new THREE.Texture( galaxies.queue.getResult('luxspread') );
  spreadTeleportMap.needsUpdate = true;

  frames = galaxies.utils.generateSpriteFrames(new THREE.Vector2(5698, 0), new THREE.Vector2(256, 256),
      new THREE.Vector2(8192, 256), 4, new THREE.Vector2(3, 0), 0.5);

  var spreadTeleport = new galaxies.SpriteSheet(spreadTeleportMap, frames, 30);

  var cloneMap = new THREE.Texture( galaxies.queue.getResult('luxclone') );
  cloneMap.needsUpdate = true;

  frames = galaxies.utils.generateSpriteFrames(new THREE.Vector2(0, 0), new THREE.Vector2(256, 256),
      new THREE.Vector2(8192, 256), 16, new THREE.Vector2(62, 0), 0.5);

  var cloneAnimator = new galaxies.SpriteSheet(cloneMap, frames, 30);
  var cloneAspectRatio = 1;

  var cloneTeleportMap = new THREE.Texture( galaxies.queue.getResult('luxclone') );
  cloneTeleportMap.needsUpdate = true;

  frames = galaxies.utils.generateSpriteFrames(new THREE.Vector2(5073, 0), new THREE.Vector2(256, 256),
      new THREE.Vector2(8192, 256), 4, new THREE.Vector2(62, 0), 0.5);

  var cloneTeleportAnimator = new galaxies.SpriteSheet(cloneTeleportMap, frames, 30);

  // teleport
  var teleportSprite;
  var teleportAnimator;
  var TELEPORT_TIME_MS = 1500;
  var TELEPORT_TIME_HALF_MS = TELEPORT_TIME_MS/2;
  var teleporting = false;
  var teleportingClone = false;
  var spinningOutClone = false;
  
  teleportSprite = galaxies.utils.makeSprite(baseTeleportMap);
  teleportSprite.position.z = 0.01; // must appear in front of base character sprite

  characters['golden'] = {
    map: goldenMap,
    animator: goldenAnimator,
    scale: goldenAspectRatio * galaxies.engine.CHARACTER_HEIGHT,
    teleportMap: goldenTeleportMap,
    teleportAnimator: goldenTeleport
  };
  characters['spread'] = {
    map: spreadMap,
    animator: spreadAnimator,
    scale: spreadAspectRatio * galaxies.engine.CHARACTER_HEIGHT,
    teleportMap: spreadTeleportMap,
    teleportAnimator: spreadTeleport
  };
  characters['base'] = {
    map: characterMap,
    animator: baseAnimator,
    scale: baseAspectRatio * galaxies.engine.CHARACTER_HEIGHT,
    teleportMap: baseTeleportMap,
    teleportAnimator: baseTeleport
  };
  characters['clone'] = characters['base'];
  
  
  // CHARACTER SPRITE
  var activeAnimator = baseAnimator;
  var character = galaxies.utils.makeSprite("lux");
  characterRotator.add( character );
  character.material.opacity = 0;

  var characterShadow = galaxies.utils.makeSprite("charactershadow");
  characterShadow.scale.set(2.22, 2.22, 2.22);
  characterShadow.position.setZ(-0.01);

  characterRotator.add(characterShadow);

  
  // CLONE SPRITE
  var clone = new galaxies.utils.makeSprite(cloneMap);
  var cloneRotator = new THREE.Object3D();
  var cloneScale = cloneAspectRatio * galaxies.engine.CHARACTER_HEIGHT;
  clone.position.set( 0, galaxies.engine.CHARACTER_POSITION, 0 );
  clone.scale.set(cloneScale, galaxies.engine.CHARACTER_HEIGHT, cloneScale);

  cloneRotator.add(clone);

  var cloneShadow = galaxies.utils.makeSprite("charactershadow");
  cloneShadow.scale.set(2.22, 2.22, 2.22);
  cloneShadow.position.setZ(-0.01);

  cloneRotator.add(cloneShadow);
  
  var cloneTeleportSprite = new galaxies.utils.makeSprite( cloneTeleportMap );
  cloneTeleportSprite.position.z = 0.01; // must appear in front of base character sprite

  // Clone AI data
  var cloneAIData = {
      shotCooldown: 0,
      angle: 0,
      targetAngle: 0,
      targetObject: null,
      maxWanderAngle: Math.PI * 0.6,
      shotTracking: [],
      ufo: {
          previousPosition: null,
          angularVelocity: 0
      },
      playedSound: false
  };

  var show = function() {
    rootObject.add(characterRotator);
  }
  var hide = function() {
    if ( characterRotator.parent === rootObject ) {
      rootObject.remove(characterRotator);
    }
  }
  var animateShoot = function() {
    activeAnimator.play();

    createjs.Tween.get(characterShadow.material).to({opacity: 0.5}, 250).to({opacity: 1}, 250);
  }
  var animateHit = function() {
    removeClone(true);

    if ( !createjs.Tween.hasActiveTweens( character.position ) ) {
      createjs.Tween.get( character.position )
        .to({y:galaxies.engine.PLANET_RADIUS + galaxies.engine.CHARACTER_HEIGHT}, 250, createjs.Ease.quadOut)
        .to({y:this.baseHeight}, 250, createjs.Ease.quadOut)
        .call(function () {
            character.position.y = this.baseHeight;
        }, null, this);
    }
  }
  var clearTweens = function() {
    createjs.Tween.removeTweens( character.position );
  }
  
  
  var addClone = function() {
    stopSpinningOutClone();
    rootObject.add( cloneRotator );
    teleportInClone();
  }
  var removeClone = function(spinOut) {
    if (spinningOutClone) {
        return;
    }

    if ( cloneRotator.parent === rootObject ) {
      if (spinOut) {
        cloneAnimator.stop();
        spinningOutClone = true;

        createjs.Tween.removeTweens(cloneShadow.material);
        createjs.Tween.get(cloneShadow.material)
            .to({opacity: 0}, 500);
      } else {
          teleportOutClone( function() { rootObject.remove(cloneRotator); } );
      }
    }
  }

  var fireCloneProjectile = function () {
    var projMesh = new THREE.Mesh(galaxies.resources.geometries['proj'], galaxies.resources.materials['proj']);
    projMesh.scale.set(0.1, 0.1, 0.1);

    var proj = new galaxies.Projectile("clone", projMesh, cloneAIData.angle, 0, false, galaxies.FX.GetPurpleTrailEmitter());
    galaxies.engine.projectiles.push(proj);

    proj.firedByClone = true;

    // delay adding the projectile and the sound to synchronize with the animation
    createjs.Tween.get(clone).wait(250)
        .call(function () {
            proj.updatePosition(cloneAIData.angle);
            proj.addToScene();
        });

    createjs.Tween.get(clone).wait(250)
        .call(galaxies.engine.shootSound);

    if (!cloneAIData.playedSound) {
        cloneAIData.playedSound = true;
        new galaxies.audio.SimpleSound({
            source: galaxies.audio.getSound("aliengrowl"),
            position: galaxies.utils.rootPosition( galaxies.engine.player.sprite ),
            baseVolume: 0.8,
            loop: false
        });
    }

    cloneAnimator.play();

    cloneAIData.shotCooldown = galaxies.engine.SHOOT_TIME;

    return proj;
  };

  var alreadyTargetedByClone = function(object) {
      return cloneAIData.shotTracking.some(function (shotPair) {
        return shotPair[1] === object;
      });
  };

  var getUFOFuturePosition = function (ufo, delta) {
      var currentPosition = ufo.rootPosition,
          predictedPosition = currentPosition.clone();
      
      if (cloneAIData.ufo.previousPosition) {
          var angularVelocity = galaxies.utils.flatAngleTo(currentPosition, cloneAIData.ufo.previousPosition) / delta,
              distance = galaxies.utils.flatLength(currentPosition),
              travelTime = (distance - galaxies.engine.PROJ_START_Y) / galaxies.Projectile.prototype.PROJECTILE_SPEED,
              ufoFutureAngle;

          if (cloneAIData.ufo.angularVelocity) {
              angularVelocity = cloneAIData.ufo.angularVelocity * 0.8 + angularVelocity * 0.2;
          }

          cloneAIData.ufo.angularVelocity = angularVelocity;

          ufoFutureAngle = angularVelocity * travelTime + galaxies.utils.flatAngle(currentPosition);

          predictedPosition = new THREE.Vector3(-Math.sin(ufoFutureAngle), Math.cos(ufoFutureAngle), 0).multiplyScalar(distance);
      }
      
      cloneAIData.ufo.previousPosition = currentPosition;
      
      return predictedPosition;
  };

  var targetUFO = function (defaultAngle, defaultLookVector, delta) {
      var ufo = galaxies.engine.ufo,
          predictedPosition, angleDiff;

      if (ufo.state === "inactive") {
          cloneAIData.ufo.previousPosition = null;
          cloneAIData.ufo.angularVelocity = 0;
      } else if (!alreadyTargetedByClone(ufo)) {
          predictedPosition = getUFOFuturePosition(ufo, delta);

          angleDiff = galaxies.utils.flatAngleTo(predictedPosition, defaultLookVector);

          if (Math.abs(angleDiff) < cloneAIData.maxWanderAngle) {
              cloneAIData.targetAngle = defaultAngle + angleDiff;
              return ufo;
          }
      }

      return null;
  };

  var targetBonus = function (defaultAngle, defaultLookVector) {
      var validNeutrals = galaxies.engine.neutrals.filter(function (neutral) {
              if (neutral instanceof galaxies.Capsule && neutral.powerup !== "heart") {
                  return false;
              }

              return neutral.isActive && !alreadyTargetedByClone(neutral);
          }),
          i, angleDiff, neutral;

      for (i = 0; i < validNeutrals.length; ++i) {
          neutral = validNeutrals[i];
          angleDiff = galaxies.utils.flatAngleTo(neutral.object.position, defaultLookVector);

          if (Math.abs(angleDiff) < cloneAIData.maxWanderAngle) {
              cloneAIData.targetAngle = defaultAngle + angleDiff;
              return neutral;
          }
      }

      return null;
  };

  var targetAsteroid = function (defaultAngle, defaultLookVector) {
      var utils = galaxies.utils,
          visRadiusSq = Math.pow(galaxies.engine.OBSTACLE_VISIBLE_RADIUS, 2),
          threatLevelSq = 0,
          validAsteroids = galaxies.engine.obstacles.filter(function (asteroid) {
              var flSqr = galaxies.utils.flatLengthSqr(asteroid.object.position);

              if (asteroid.state === "inactive" || alreadyTargetedByClone(asteroid) || flSqr > visRadiusSq) {
                  return false;
              }

              threatLevelSq += (1 - flSqr / visRadiusSq) * 0.5 * asteroid.life;

              return true;
          }),
          checkRadiusSq = visRadiusSq * (0.4 + Math.min(Math.max(threatLevelSq * 0.6, 0), 0.6)),
          asteroidsInRange, pos;

      cloneAIData.maxWanderAngle = Math.PI * Math.min(0.6 + Math.sqrt(threatLevelSq) * 0.3, 1);

      asteroidsInRange = validAsteroids.filter(function (asteroid) {
          pos = asteroid.object.position;

          return (Math.abs(utils.flatAngleTo(pos, defaultLookVector)) < cloneAIData.maxWanderAngle) &&
              utils.flatLengthSqr(pos) < checkRadiusSq;
      });

      if (asteroidsInRange.length > 0) {
          var closestAsteroid = null,
              closestDist = Number.MAX_VALUE,
              angleDiff;

          asteroidsInRange.forEach(function (asteroid) {
              var dist = asteroid.object.position.lengthManhattan();

              if (dist < closestDist) {
                  closestAsteroid = asteroid;
                  closestDist = dist;
              }
          });

          angleDiff = galaxies.utils.flatAngleTo(closestAsteroid.object.position, defaultLookVector);

          cloneAIData.targetAngle = defaultAngle + angleDiff;

          return closestAsteroid;
      }

      return null;
  };

  var cloneAIUpdate = function(delta, defaultAngle) {
    var defaultLookVector = new THREE.Vector3(-Math.sin(defaultAngle), Math.cos(defaultAngle), 0),
        ufo = galaxies.engine.ufo,
        predictedPosition, angleDiff;

    cloneAIData.shotTracking = cloneAIData.shotTracking.filter(function (shotPair) {
        return !shotPair[0].isExpired;
    });

    if (cloneAIData.targetObject) {
        if (cloneAIData.targetObject === ufo) {
            predictedPosition = getUFOFuturePosition(ufo, delta);
        } else {
            predictedPosition = cloneAIData.targetObject.object.position;
        }

        angleDiff = galaxies.utils.flatAngleTo(predictedPosition, defaultLookVector);

        if (Math.abs(angleDiff) > cloneAIData.maxWanderAngle) {
            cloneAIData.targetObject = null;
            cloneAIData.targetAngle = defaultAngle;
        } else {
            cloneAIData.targetAngle = defaultAngle + angleDiff;
        }
    } else {
        cloneAIData.targetObject = targetUFO(defaultAngle, defaultLookVector, delta) ||
            targetBonus(defaultAngle, defaultLookVector) ||
            targetAsteroid(defaultAngle, defaultLookVector);
    }
  };

  var cloneAIPostUpdate = function() {
      if (cloneAIData.targetObject && Math.abs(cloneAIData.targetAngle - cloneAIData.angle) < 0.02) {
          var projectile = fireCloneProjectile();

          cloneAIData.shotTracking.push([projectile, cloneAIData.targetObject]);

          cloneAIData.targetObject = null;
      }
  };
  
  var update = function( delta, angle ) {
    characterRotator.rotation.set( 0, 0, angle );
    character.material.rotation = angle;
    characterShadow.material.rotation = angle - Math.PI/60;
    activeAnimator.update( delta );

    if (galaxies.engine.ufo.commandeeredPlayer && !createjs.Tween.hasActiveTweens(character.position)) {
        character.position.y = this.baseHeight;
    }
    
    if ( cloneRotator.parent !== null && !teleportingClone && !spinningOutClone ) {
      var cloneDefaultAngle = angle + Math.PI;

      cloneAnimator.update(delta);
      cloneAIData.shotCooldown -= delta;

      if (cloneAIData.shotCooldown <= 0 && !teleportingClone) {
        cloneAIUpdate(delta, cloneDefaultAngle);
      }

      if (cloneAIData.targetObject) {
        var cloneAngleDelta = cloneAIData.targetAngle - cloneAIData.angle,
            rotationalVelocity = Math.PI * delta * 2;

        cloneAIData.angle += Math.min(rotationalVelocity, Math.abs(cloneAngleDelta)) * (cloneAngleDelta < 0 ? -1 : 1);
      }

      cloneAIData.angle = Math.min(Math.max(cloneAIData.angle, cloneDefaultAngle - cloneAIData.maxWanderAngle), cloneDefaultAngle + cloneAIData.maxWanderAngle);
      cloneRotator.rotation.set(0, 0, cloneAIData.angle);
      clone.material.rotation = cloneAIData.angle;
      cloneShadow.material.rotation = cloneAIData.angle - Math.PI/60;

      cloneAIPostUpdate();
    }
    if ( teleporting ) {
      teleportAnimator.update( delta );
      teleportSprite.material.rotation = character.material.rotation;
    }
    if (teleportingClone) {
      cloneTeleportAnimator.update( delta );
      cloneTeleportSprite.material.rotation = clone.material.rotation;
    }
    if (spinningOutClone) {
      var v3 = new THREE.Vector3(),
          normCloneScreenPos;

      galaxies.FX.SpinOutClone(delta);

      v3.setFromMatrixPosition(clone.matrixWorld);

      normCloneScreenPos = galaxies.utils.getNormalizedScreenPosition(v3);

      if (normCloneScreenPos.x < -0.1 || normCloneScreenPos.x > 1.1 ||
          normCloneScreenPos.y < -0.1 || normCloneScreenPos.y > 1.1) {
        stopSpinningOutClone();
      }
    }
  };

  var stopSpinningOutClone = function () {
    if (!spinningOutClone) {
        return;
    }

    spinningOutClone = false;

    clone.rotation.set(0, 0, 0);
    clone.material.rotation = cloneRotator.rotation.z;
    clone.position.y = galaxies.engine.CHARACTER_POSITION;

    rootObject.remove(cloneRotator);
  };
  
  
  var reset = function( angle ) {
    activeAnimator.stop();
    activeAnimator = baseAnimator;
    activeAnimator.updateFrame(0);

    this.baseHeight = galaxies.engine.CHARACTER_POSITION;

    character.rotation.set(0,0,0);
    character.material.rotation = angle;
    character.position.y = galaxies.engine.CHARACTER_POSITION;

    teleportCloneComplete();

    if (cloneRotator.parent === rootObject) {
      rootObject.remove(cloneRotator);
    }

    clone.rotation.set(0, 0, 0);
    cloneRotator.rotation.set(0, 0, 0);
    clone.position.y = galaxies.engine.CHARACTER_POSITION;
  }
  
  
  
  var teleportOut = function() {
    galaxies.ui.hideReticle();

    if (character.material.opacity === 0)
    {
        return;
    }

    teleporting = true;
    
    character.add( teleportSprite );
    teleportSprite.material.rotation = character.material.rotation;
    teleportSprite.material.opacity = 0;
    teleportAnimator.play(-1); // negative loop count will loop indefinitely f
    
    // fade in and out
    createjs.Tween.removeTweens( teleportSprite.material );
    createjs.Tween.get( teleportSprite.material )
      .to( { opacity: 1 }, TELEPORT_TIME_HALF_MS )
      .set( { opacity: 0 }, character.material )
      .to( { opacity: 0 }, TELEPORT_TIME_HALF_MS )
      .call( teleportEffectComplete, this );

    createjs.Tween.removeTweens(characterShadow.material);
    createjs.Tween.get(characterShadow.material)
        .to({opacity: 0}, TELEPORT_TIME_HALF_MS);

    teleportOutClone();
  }
  
  var teleportOutClone = function( callback ) {
    if ( cloneRotator.parent !== null && (clone.material.opacity > 0)) {
      teleportingClone = true;
      
      clone.add( cloneTeleportSprite );
      cloneTeleportSprite.material.rotation = clone.material.rotation;
      cloneTeleportSprite.material.opacity = 0;
      cloneTeleportAnimator.play(-1); // negative loop count will loop indefinitely

      new galaxies.audio.PositionedSound({
          source: galaxies.audio.getSound('teleportout'),
          position: galaxies.utils.rootPosition( clone ),
          baseVolume: 10,
          loop: false
      });
      
      createjs.Tween.removeTweens( cloneTeleportSprite.material );
      createjs.Tween.get( cloneTeleportSprite.material )
        .to( { opacity: 1 }, TELEPORT_TIME_HALF_MS )
        .set( { opacity: 0 }, clone.material )
        .to( { opacity: 0 }, TELEPORT_TIME_HALF_MS )
        .call( teleportCloneComplete )
        .call( callback );

        createjs.Tween.removeTweens(cloneShadow.material);
        createjs.Tween.get(cloneShadow.material)
            .to({opacity: 0}, TELEPORT_TIME_HALF_MS);
    }
  }
  
  var teleportEffectComplete = function() {
    teleportAnimator.stop();
    teleportSprite.parent.remove(teleportSprite);
    if ( cloneTeleportSprite.parent ) { cloneTeleportSprite.parent.remove( cloneTeleportSprite ); }
    teleporting = false;
  }
  var teleportCloneComplete = function() {
    cloneTeleportAnimator.stop();
    if ( cloneTeleportSprite.parent ) { cloneTeleportSprite.parent.remove( cloneTeleportSprite ); }
    teleportingClone = false;
  }
  
  var teleportIn = function( callback ) {
    if (teleporting || (character.material.opacity > 0)) {
        return;
    }

    galaxies.ui.showReticle();
    character.add( teleportSprite );
    teleportSprite.material.rotation = character.material.rotation;
    teleportSprite.material.opacity = 0;
    teleportAnimator.play(-1); // negative loop count will loop indefinitely
    character.material.opacity = 0;
    
    // fade in and out
    createjs.Tween.removeTweens( teleportSprite.material );
    createjs.Tween.get( teleportSprite.material )
      .to( { opacity: 1 }, TELEPORT_TIME_HALF_MS )
      .set( { opacity: 1 }, character.material )
      .to( { opacity: 0 }, TELEPORT_TIME_HALF_MS )
      .call( teleportEffectComplete, this )
      .call( callback, this );

    createjs.Tween.removeTweens(characterShadow.material);
    createjs.Tween.get(characterShadow.material)
        .to({opacity: 1}, TELEPORT_TIME_HALF_MS)
        .call(function () {
            console.log(characterShadow.position, characterShadow.material.opacity, cloneRotator.position);
        });
      
    teleporting = true;
    
    if ( cloneRotator.parent !== null ) {
      teleportInClone();
    }
    
  }
  
  var teleportInClone = function() {
    if (teleportingClone || (clone.material.opacity > 0))
    {
        return;
    }

    teleportingClone = true;

    clone.add( cloneTeleportSprite );
    cloneTeleportSprite.material.rotation = clone.material.rotation = cloneRotator.rotation.z;
    cloneTeleportSprite.material.opacity = 0;
    cloneTeleportAnimator.play(-1); // negative loop count will loop indefinitely

    new galaxies.audio.PositionedSound({
        source: galaxies.audio.getSound('teleportin'),
        position: galaxies.utils.rootPosition( clone ),
        baseVolume: 10,
        loop: false
    });
    
    createjs.Tween.removeTweens( cloneTeleportSprite.material );
    createjs.Tween.get( cloneTeleportSprite.material )
      .to( { opacity: 1 }, TELEPORT_TIME_HALF_MS )
      .set( { opacity: 1 }, clone.material )
      .to( { opacity: 0 }, TELEPORT_TIME_HALF_MS )
      .call( teleportCloneComplete );

    createjs.Tween.removeTweens(cloneShadow.material);
    createjs.Tween.get(cloneShadow.material)
      .to({opacity: 1}, TELEPORT_TIME_HALF_MS);
  }
  
  var setPowerup = function( powerup ) {
    if ( powerup === '' || powerup === 'seeker' ) { powerup = 'base'; }

    if ( powerup === 'clone' ) {
      cloneAIData.playedSound = false;
      addClone();
    } else {
      removeClone();
    }
    
    character.material.map = characters[powerup].map;
    activeAnimator = characters[powerup].animator;
    teleportSprite.material.map = characters[powerup].teleportMap;
    teleportAnimator = characters[powerup].teleportAnimator;
    
    character.position.set( 0, galaxies.engine.CHARACTER_POSITION, 0 ); // note that character is offset horizontally because sprites are not centered
    character.scale.set( characters[powerup].scale, galaxies.engine.CHARACTER_HEIGHT, characters[powerup].scale);
    
  }
  
  var die = function() {
    galaxies.ui.hideReticle();
    cloneShadow.material.opacity = 0;

    createjs.Tween.removeTweens(characterShadow.material);
    characterShadow.material.opacity = 0;

    if (teleportingClone) {
        createjs.Tween.removeTweens(cloneTeleportSprite.material);
        createjs.Tween.removeTweens(cloneShadow.material);

        cloneTeleportSprite.material.opacity = 0;
        clone.material.opacity = 0;

        if (cloneRotator.parent === rootObject) {
            rootObject.remove(cloneRotator);
        }

        teleportCloneComplete();
    }

    activeAnimator.updateFrame(10);
  }


  // initialize position and scale
  setPowerup('');

  
  
  
  
  
  return {
    name: "Luxamillion",
    baseHeight: galaxies.engine.CHARACTER_POSITION,
    root: rootObject,
    sprite: character,
    cloneSprite: clone,
    show: show,
    hide: hide,
    addClone: addClone,
    removeClone: removeClone,
    animateShoot: animateShoot,
    animateHit: animateHit,
    clearTweens: clearTweens,
    teleportIn: teleportIn,
    teleportOut: teleportOut,
    update: update,
    reset: reset,
    setPowerup: setPowerup,
    die: die
    
  };
};