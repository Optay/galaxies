"use strict";

this.galaxies = this.galaxies || {};

this.galaxies.Player = function() {
  
  var characters = {};
  
  var rootObject = new THREE.Object3D();
  rootObject.position.z = 1;
  var characterRotator = new THREE.Object3D();

  rootObject.add(characterRotator);

  var characterMap = new THREE.Texture( galaxies.queue.getResult('lux') );
  var baseAnimator = new galaxies.SpriteSheet(
    characterMap,
    [
      [0,0,232,339,0,23,143],
      [232,0,232,339,0,23,143],
      [464,0,232,339,0,23,143],
      [696,0,232,339,0,23,143],
      [0,339,232,339,0,23,143],
      [232,339,232,339,0,23,143],
      [464,339,232,339,0,23,143],
      [696,339,232,339,0,23,143],
      [0,678,232,339,0,23,143],
      [232,678,232,339,0,23,143],
      [464,678,232,339,0,23,143],
      [696,678,232,339,0,23,143],
      [0,1017,232,339,0,23,143],
      [232,1017,232,339,0,23,143],
      [464,1017,232,339,0,23,143],
      [696,1017,232,339,0,23,143],
      
      ], 
    30
    );
  characterMap.needsUpdate = true;
  var baseAspectRatio = 232/339;
  var baseTeleportMap = new THREE.Texture( galaxies.queue.getResult('lux') );
  baseTeleportMap.needsUpdate = true;
  var baseTeleport = new galaxies.SpriteSheet(
    baseTeleportMap,
    [
      [0,1356,232,339,0,23,143],
      [232,1356,232,339,0,23,143],
      [464,1356,232,339,0,23,143],
      [696,1356,232,339,0,23,143]
     ], 
    30
    );
  
  
  var goldenMap = new THREE.Texture( galaxies.queue.getResult('luxgolden') );
  var goldenAnimator = new galaxies.SpriteSheet(
    goldenMap,
    [
     [0,0,232,338,0,23,143],
     [232,0,232,338,0,23,143],
     [464,0,232,338,0,23,143],
     [696,0,232,338,0,23,143],
     [0,338,232,338,0,23,143],
     [232,338,232,338,0,23,143],
     [464,338,232,338,0,23,143],
     [696,338,232,338,0,23,143],
     [0,676,232,338,0,23,143],
     [232,676,232,338,0,23,143],
     [464,676,232,338,0,23,143],
     [696,676,232,338,0,23,143],
     [0,1014,232,338,0,23,143],
     [232,1014,232,338,0,23,143],
     [464,1014,232,338,0,23,143],
     [696,1014,232,338,0,23,143],

    ],
    30
    );
  goldenMap.needsUpdate = true;
  var goldenAspectRatio = 232/338;
  var goldenTeleportMap = new THREE.Texture( galaxies.queue.getResult('luxgolden') );
  goldenTeleportMap.needsUpdate = true;
  var goldenTeleport = new galaxies.SpriteSheet(
    goldenTeleportMap,
    [ // NOTE: these values are not the same as in the supplied sprite script, they are offset by four pixels
      [0,1352,232,338,0,23,143],
      [232,1352,232,338,0,23,143],
      [464,1352,232,338,0,23,143],
      [696,1352,232,338,0,23,143]
    ], 
    30
    );
  
  var spreadMap = new THREE.Texture( galaxies.queue.getResult('luxspread') );
  var spreadAnimator = new galaxies.SpriteSheet(
    spreadMap,
    [
      [0,0,233,339,0,23,143],
      [233,0,233,339,0,23,143],
      [466,0,233,339,0,23,143],
      [699,0,233,339,0,23,143],
      [0,339,233,339,0,23,143],
      [233,339,233,339,0,23,143],
      [466,339,233,339,0,23,143],
      [699,339,233,339,0,23,143],
      [0,678,233,339,0,23,143],
      [233,678,233,339,0,23,143],
      [466,678,233,339,0,23,143],
      [699,678,233,339,0,23,143],
      [0,1017,233,339,0,23,143],
      [233,1017,233,339,0,23,143],
      [466,1017,233,339,0,23,143],
      [699,1017,233,339,0,23,143],
      [0,1356,233,339,0,23,143],
      [233,1356,233,339,0,23,143],
      [466,1356,233,339,0,23,143],
      [699,1356,233,339,0,23,143],
  
    ],
    30
    );
  spreadMap.needsUpdate = true;
  var spreadAspectRatio = 233/339;
  var spreadTeleportMap = new THREE.Texture( galaxies.queue.getResult('luxspread') );
  spreadTeleportMap.needsUpdate = true;
  var spreadTeleport = new galaxies.SpriteSheet(
    spreadTeleportMap,
    [
      [0,1695,233,339,0,23,143],
      [233,1695,233,339,0,23,143],
      [466,1695,233,339,0,23,143],
      [699,1695,233,339,0,23,143],
     ], 
    30
    );
  
  
  var cloneMap = new THREE.Texture( galaxies.queue.getResult('luxclone') );
  var cloneAnimator = new galaxies.SpriteSheet(
    cloneMap,
    [
     [0,0,232,339,0,23,127],
     [232,0,232,339,0,23,127],
     [464,0,232,339,0,23,127],
     [696,0,232,339,0,23,127],
     [0,339,232,339,0,23,127],
     [232,339,232,339,0,23,127],
     [464,339,232,339,0,23,127],
     [696,339,232,339,0,23,127],
     [0,678,232,339,0,23,127],
     [232,678,232,339,0,23,127],
     [464,678,232,339,0,23,127],
     [696,678,232,339,0,23,127],
     [0,1017,232,339,0,23,127],
     [232,1017,232,339,0,23,127],
     [464,1017,232,339,0,23,127],
     [696,1017,232,339,0,23,127],

    ], 
    30
    );
  cloneMap.needsUpdate = true;
  var cloneAspectRatio = 164/229;
  var cloneTeleportMap = new THREE.Texture( galaxies.queue.getResult('luxclone') );
  var cloneTeleportAnimator = new galaxies.SpriteSheet(
    cloneTeleportMap,
    [
      [0,1356,232,339,0,23,127],
      [232,1356,232,339,0,23,127],
      [464,1356,232,339,0,23,127],
      [696,1356,232,339,0,23,127]
     ], 
    30
    );
  cloneTeleportMap.needsUpdate = true;
  
  // teleport
  var teleportSprite;
  var teleportAnimator;
  var TELEPORT_TIME_MS = 1500;
  var TELEPORT_TIME_HALF_MS = TELEPORT_TIME_MS/2;
  var teleporting = false;
  var teleportingClone = false;
  var spinningOutClone = false;
  
  var teleportMaterial = new THREE.SpriteMaterial({
    map: baseTeleportMap,
    color: 0xffffff,
    transparent: true,
    opacity: 0.0
  } );
  teleportSprite = new THREE.Sprite( teleportMaterial );
  teleportSprite.position.z = 0.1; // must appear in front of base character sprite
  
  
  
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
  var characterMaterial = new THREE.SpriteMaterial({
    map: characterMap,
    color: 0xffffff,
    transparent: true,
    opacity: 1.0
  } );
  //var characterMaterial = new THREE.SpriteMaterial( { color: 0xffffff } );
  var character = new THREE.Sprite( characterMaterial );
  characterRotator.add( character );

  var characterShadowMap = new THREE.Texture(galaxies.queue.getResult("charactershadow"));
  characterShadowMap.needsUpdate = true;

  var characterShadowMaterial = new THREE.SpriteMaterial({
      map: characterShadowMap,
      color: 0xffffff,
      transparent: true,
      opacity: 0
  });
  var characterShadow = new THREE.Sprite(characterShadowMaterial);
  characterShadow.scale.set(2.22, 2.22);
  characterShadow.position.setZ(-0.01);

  characterRotator.add(characterShadow);

  
  // CLONE SPRITE
  var cloneMaterial = new THREE.SpriteMaterial({
    map: cloneMap,
    color: 0xffffff,
    transparent: true,
    opacity: 0
  } );
  var clone = new THREE.Sprite( cloneMaterial );
  var cloneRotator = new THREE.Object3D();
  var cloneScale = cloneAspectRatio * galaxies.engine.CHARACTER_HEIGHT;
  clone.position.set( cloneScale * 0.15, galaxies.engine.CHARACTER_POSITION, 0 );
  clone.scale.set(cloneScale, galaxies.engine.CHARACTER_HEIGHT, cloneScale);

  cloneRotator.add(clone);

  var cloneShadowMaterial = new THREE.SpriteMaterial({
      map: characterShadowMap,
      color: 0xffffff,
      transparent: true,
      opacity: 0
  });
  var cloneShadow = new THREE.Sprite(cloneShadowMaterial);
  cloneShadow.scale.set(2.22, 2.22);
  cloneShadow.position.setZ(-0.01);

  cloneRotator.add(cloneShadow);
  
  var cloneTeleportMaterial = new THREE.SpriteMaterial({
    map: cloneTeleportMap,
    color: 0xffffff,
    transparent: true,
    opacity: 0.0
  } );
  var cloneTeleportSprite = new THREE.Sprite( cloneTeleportMaterial );
  cloneTeleportSprite.position.z = 0.1; // must appear in front of base character sprite      
  
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
  }
  var animateHit = function() {
    removeClone(true);

    if ( !createjs.Tween.hasActiveTweens( character.position ) ) {
      createjs.Tween.get( character.position )
        .to({y:galaxies.engine.PLANET_RADIUS + galaxies.engine.CHARACTER_HEIGHT}, 250, createjs.Ease.quadOut)
        .to({y:galaxies.engine.CHARACTER_POSITION}, 250, createjs.Ease.quadOut);
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

    var proj = new galaxies.Projectile(projMesh, cloneAIData.angle, 0, false, galaxies.fx.getPurpleTrailEmitter());
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
      var visRadiusSq = Math.pow(galaxies.engine.OBSTACLE_VISIBLE_RADIUS, 2),
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
          asteroidsInRange = validAsteroids.filter(function (asteroid) {
              return (Math.abs(galaxies.utils.flatAngleTo(asteroid.object.position, defaultLookVector)) < cloneAIData.maxWanderAngle) &&
                  galaxies.utils.flatLengthSqr(asteroid.object.position) < checkRadiusSq;
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

            angleDiff = Math.abs(cloneAIData.targetAngle - cloneAIData.angle);

            if (angleDiff < 0.02) {
                var projectile = fireCloneProjectile();

                cloneAIData.shotTracking.push([projectile, cloneAIData.targetObject]);

                cloneAIData.targetObject = null;
            }
        }
    } else {
        cloneAIData.targetObject = targetUFO(defaultAngle, defaultLookVector, delta) ||
            targetBonus(defaultAngle, defaultLookVector) ||
            targetAsteroid(defaultAngle, defaultLookVector);
    }
  };
  
  var update = function( delta, angle ) {
    characterRotator.rotation.set( 0, 0, angle );
    character.material.rotation = angle;
    characterShadow.material.rotation = angle - Math.PI/60;
    activeAnimator.update( delta );
    
    if ( cloneRotator.parent !== null && !teleportingClone && !spinningOutClone ) {
      var cloneDefaultAngle = angle + Math.PI;

      cloneAnimator.update(delta);
      cloneAIData.shotCooldown -= delta;

      if (cloneAIData.shotCooldown <= 0 && !teleportingClone) {
        cloneAIUpdate(delta, cloneDefaultAngle);
      }

      if (cloneAIData.targetObject) {
        var cloneAngleDelta = cloneAIData.targetAngle - cloneAIData.angle;
        cloneAIData.angle += cloneAngleDelta * delta * 10;
      }

      cloneAIData.angle = Math.min(Math.max(cloneAIData.angle, cloneDefaultAngle - cloneAIData.maxWanderAngle), cloneDefaultAngle + cloneAIData.maxWanderAngle);
      cloneRotator.rotation.set(0, 0, cloneAIData.angle);
      clone.material.rotation = cloneAIData.angle;
      cloneShadow.material.rotation = cloneAIData.angle - Math.PI/60;
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

      galaxies.fx.spinOutClone(delta);

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
    teleporting = true;
    
    character.add( teleportSprite );
    teleportSprite.material.rotation = character.material.rotation;
    teleportSprite.material.opacity = 0;
    teleportAnimator.play(-1); // negative loop count will loop indefinitely
    
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
    if ( cloneRotator.parent !== null ) {
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
          .to({opacity: 1}, TELEPORT_TIME_HALF_MS);
      
    teleporting = true;
    
    if ( cloneRotator.parent !== null ) {
      teleportInClone();
    }
    
  }
  
  var teleportInClone = function() {
    teleportingClone = true;

    clone.add( cloneTeleportSprite );
    cloneTeleportSprite.material.rotation = clone.material.rotation;
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
    if ( powerup === '' ) { powerup = 'base'; }
    
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
    
    character.position.set( characters[powerup].scale * 0.15, galaxies.engine.CHARACTER_POSITION, 0 ); // note that character is offset horizontally because sprites are not centered
    character.scale.set( characters[powerup].scale, galaxies.engine.CHARACTER_HEIGHT, characters[powerup].scale);
    
  }
  
  var die = function() {
    characterShadow.material.opacity = 0;
    cloneShadow.material.opacity = 0;

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