"use strict";
/** Utilities
 * A collection of miscellaneous functions and definitions. This includes
 * things like ExhaustiveArray, feature detection, and custom easing functions.
 * 
 */

this.galaxies = this.galaxies || {};

galaxies.utils = this.galaxies.utils || {};

galaxies.utils.PI_2 = Math.PI * 2;

galaxies.utils.shotGroups = [];

galaxies.utils.addShotGroup = function(shots) {
    if (!(shots instanceof Array)) {
        shots = [shots];
    }

    galaxies.utils.shotGroups.push(shots);
};

galaxies.utils.getConnectedShotGroup = function(shot) {
    var shotGroups = galaxies.utils.shotGroups,
        numShotGroups = shotGroups.length;

    for (var i = 0; i < numShotGroups; ++i) {
        if (shotGroups[i].some(function (item) {return item === shot;})) {
            return i;
        }
    }

    return -1;
};

galaxies.utils.inShotGroup = function(shot) {
    return galaxies.utils.getConnectedShotGroup(shot) > -1;
};

galaxies.utils.removeConnectedShotGroup = function(shot) {
    var shotGroup = galaxies.utils.getConnectedShotGroup(shot);

    if (shotGroup > -1) {
        galaxies.utils.shotGroups.splice(shotGroup, 1);
    }
};

// A linear tapered sinusoidal easing function.
// Used for shaking camera.
galaxies.utils.getShakeEase = function ( frequency ) {
  return function( t ) {
    var val = Math.cos( t * frequency ) * (1-t);
    //console.log(t, val);
    return val;
  };
};

// Identify desktop platforms to recommend correct browser with EC-3.
galaxies.utils.isOSX = function() {
  var agt = navigator.userAgent;
  return ( /Mac OS X/.test(agt) && !/iphone/i.test(agt) && !/ipad/i.test(agt) && !/ipod/i.test(agt) );
}
galaxies.utils.isWindows = function() {
  var agt = navigator.userAgent;
  return ( /Windows/.test(agt) && !/phone/i.test(agt) );
}

galaxies.utils._isMobile = true;

galaxies.utils.isMobile = function() {
  if (galaxies.utils._isMobile === null) {
    galaxies.utils._isMobile = /iPhone|iPad|iPod|Android|windows phone|iemobile|\bsilk\b/i.test(navigator.userAgent);
  }

  return galaxies.utils._isMobile;
};

// Identify which audio format to use.
galaxies.utils.testAudioSupport = function( callback ) {
  // Has test been run?
  if ( typeof( galaxies.utils.supportsOGG ) !== 'undefined' ) {
    callback();
    return;
  }
  
  // Test OGG
  var oggTester = document.createElement("audio"); // Construct new Audio object
  var codecString = 'audio/ogg;codecs="vorbis"';
  galaxies.utils.supportsOGG = (oggTester.canPlayType(codecString)==='probably'); // cast to boolean
  console.log( "Supports OGG?", galaxies.utils.supportsOGG );
  //
  
  // Test EC-3
  // Note: Feature detection with MediaSource returns incorrect result in Safari 8. 
  // This code was created by Dolby.
  // https://github.com/DolbyDev/Browser_Feature_Detection
  var video = document.createElement('video');

  if (video.canPlayType('audio/mp4;codecs="ec-3"') === '' || video.canPlayType('audio/mp4;codecs="ac-3"') === '') {
      galaxies.utils.supportsEC3 = false;
      callback();
  } else {
      var audio = new Audio();
      audio.muted = true;
      audio.addEventListener('error', function () {
          galaxies.utils.supportsEC3 = false;
          callback();
      }, false);
      audio.addEventListener('seeked', function () {
          galaxies.utils.supportsEC3 = true;
          callback();
      }, false);

      audio.addEventListener('canplaythrough', function () {
          try {
              audio.currentTime = 2;
          } catch (e) {
            callback();
          }
      }, false);
      audio.src = 'audio/silence.mp4';
      audio.play();
  }  
}

// Will it run?
// Exclude browsers that do not support WebGL and WebAudio.
galaxies.utils.isSupportedBrowser = function() {
  // Test for WebGL support
  var canvas;
  var ctx;
  var exts;
  
  try {
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  }
  catch (e) {
    return false;
  }
  if (ctx === undefined) { return false; }
  canvas = undefined;
  //
  
  // Test for WebAudio support
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  if ( AudioContext == null ) { return false; }
  //
  
  return true;
}


/// Takes an array and returns its contents in a randomized order.
galaxies.ExhaustiveArray = function() {
  var objects = [];
  var index = 0;
  
  this.add = function( item ) {
    objects.push(item);
  }
  
  this.init = function() {
    index = 0;
    galaxies.utils.shuffleArray(objects);
  }
  
  this.next = function() {
    var nextObject = objects[index];
    
    if ( objects.length > 1 ) {
      index++;
      if ( index >= objects.length ) {
        index = 0;
        galaxies.utils.shuffleArray(objects);
      }
    }
    
    return nextObject;
  }
  
  galaxies.utils.shuffleArray(objects);
  
}

// Fisher-Yates shuffle
galaxies.utils.shuffleArray = function( array ) {
  for (var i=0, len = array.length; i<len; i++ ) {
    var randomIndex = Math.floor( Math.random() * (i+1) );
    var temp = array[randomIndex];
    array[randomIndex] = array[i];
    array[i] = temp;
  }  
}


// modulo without keeping dividend sign.
galaxies.utils.mod = function( a, n ) {
  return (a - Math.floor( a/n ) * n);
}

galaxies.utils.flatLength = function( vector ) {
  return Math.sqrt( Math.pow(vector.x, 2) + Math.pow(vector.y,2) );
}
galaxies.utils.flatLengthSqr = function(vector ) {
  return (Math.pow(vector.x, 2) + Math.pow(vector.y,2));
}

galaxies.utils.rootPosition = function( object ) {
  var foo = object.position.clone();
  if ((object.parent == null) || (galaxies.engine.rootObject==null) ) {
    return foo;
  } else {
    return galaxies.engine.rootObject.worldToLocal( object.parent.localToWorld( foo ) );
  }

}

/// Set z-position for objects to map x-y plane to a cone.
galaxies.utils.conify = function( object ) {
  object.position.setZ(galaxies.utils.getConifiedDepth(object.position));
}
galaxies.utils.getConifiedDepth = function( position ) {
  // linear
  return ( (galaxies.utils.flatLength(position)/galaxies.engine.CONE_SLOPE) );
  // parabolic
}

galaxies.utils.projectToCone = function (rootPosition) {
    var camPos = galaxies.engine.camera.position,
        dV = rootPosition.clone().sub(camPos),
        tan2Theta = galaxies.engine.CONE_SLOPE * galaxies.engine.CONE_SLOPE,
        a = dV.x * dV.x + dV.y * dV.y - dV.z * dV.z * tan2Theta,
        b = 2 * (camPos.x * dV.x + camPos.y * dV.y - camPos.z * dV.z * tan2Theta),
        c = camPos.x * camPos.x + camPos.y * camPos.y - camPos.z * camPos.z * tan2Theta,
        underRoot = b * b - 4 * a * c,
        pmPart, scalar;

    if (underRoot < 0) {
        return new THREE.Vector3();
    }

    pmPart = Math.sqrt(underRoot);

    scalar = (-b + pmPart) / (2 * a);

    if (scalar < 0) {
        scalar = (-b - pmPart) / (2 * a);
    }

    return camPos.clone().add(dV.multiplyScalar(scalar));
};

galaxies.utils.calculateRoundScore = function (roundScore, accuracy, numStars) {
    return Math.round(roundScore * (1 + accuracy) * Math.pow(2, numStars));
};

galaxies.utils.addCommas = function (number) {
    var numStr = number.toString(),
        i;

    for (i = numStr.length - 3; i > 0; i -= 3) {
        numStr = numStr.slice(0, i) + ',' + numStr.slice(i);
    }

    return numStr;
};


galaxies.utils.normalizeAngle = function (angle) {
    var tau = 2 * Math.PI;

    angle = angle % tau;

    if (angle > Math.PI) {
        angle -= tau;
    } else if (angle < -Math.PI) {
        angle += tau;
    }

    return angle;
};

galaxies.utils.flatAngle = function(v3) {
    return Math.atan2(-v3.x, v3.y);
};

galaxies.utils.flatAngleTo = function (a, b) {
    return galaxies.utils.normalizeAngle(galaxies.utils.flatAngle(a) - galaxies.utils.flatAngle(b));
};

galaxies.utils.getObjScreenPosition = function (obj, margin) {
    var v3 = new THREE.Vector3();

    v3.setFromMatrixPosition(obj.matrixWorld);

    return galaxies.utils.getScreenPosition(v3, margin);
};

galaxies.utils.getScreenPosition = function (v3, margin) {
    var screenX, screenY;

    v3.project(galaxies.engine.camera);

    screenX = ( v3.x * galaxies.engine.canvasHalfWidth ) + galaxies.engine.canvasHalfWidth;
    screenY = - ( v3.y * galaxies.engine.canvasHalfHeight ) + galaxies.engine.canvasHalfHeight;

    if (typeof margin === "number") {
        screenX = Math.max( screenX, margin );
        screenX = Math.min( screenX, galaxies.engine.canvasWidth - margin );
        screenY = Math.max( screenY, margin );
        screenY = Math.min( screenY, galaxies.engine.canvasHeight - margin );
    }

    return new THREE.Vector2(screenX, screenY);
};

galaxies.utils.getNormalizedScreenPosition = function (v3) {
    v3.project(galaxies.engine.camera);

    return new THREE.Vector2(0.5 + v3.x * 0.5, 0.5 + v3.y * 0.5);
};

galaxies.utils.generateSpriteFrames = function (startPoint, frameSize, texSize, numFrames, frameGap, mobileScale) {
    var frames = [],
        xPos = startPoint.x,
        yPos = startPoint.y,
        xJump = frameSize.x,
        yJump = frameSize.y,
        width = frameSize.x,
        height = frameSize.y,
        scaledTex = new THREE.Vector2(texSize.x, texSize.y);

    if (typeof mobileScale !== "number") {
        mobileScale = mobileScale || 1;
    }

    if (!!frameGap) {
        xJump += frameGap.x;
        yJump += frameGap.y;
    }

    if (galaxies.utils.isMobile() && mobileScale !== 1) {
        xPos *= mobileScale;
        yPos *= mobileScale;
        xJump *= mobileScale;
        yJump *= mobileScale;
        width *= mobileScale;
        height *= mobileScale;

        scaledTex.multiplyScalar(mobileScale);
    }

    for (var i = 0; i < numFrames; ++i) {
        frames.push([xPos, yPos, width, height]);

        xPos += xJump;

        if (xPos >= scaledTex.x) {
            xPos = 0;
            yPos += yJump;
        }
    }

    return frames;
};

galaxies.utils.makeSprite = function (texName, transparent, depthTest, depthWrite) {
    var tex = new THREE.Texture(galaxies.queue.getResult(texName)),
        mat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: typeof transparent === "boolean" ? transparent  : false,
            depthTest: typeof depthTest === "boolean" ? depthTest  : true,
            depthWrite: typeof depthWrite === "boolean" ? depthWrite  : true
        }),
        geo = new THREE.PlaneGeometry(1, 1);

    tex.needsUpdate = true;

    return new THREE.Mesh(geo, mat);
};

galaxies.utils.updateCollider = function (collider, object) {
    var rootObj = galaxies.engine.rootObject;

    switch (collider.type) {
        case "sphere":
            collider.rootPosition = rootObj.worldToLocal(object.localToWorld(collider.position.clone()));
            collider.rootRadius = rootObj.worldToLocal(object.localToWorld(collider.position.clone()
                .add(new THREE.Vector3(collider.radius, 0, 0)))).distanceTo(collider.rootPosition);
            break;
        case "capsule":
            collider.rootPosition1 = rootObj.worldToLocal(object.localToWorld(collider.position1.clone()));
            collider.rootPosition2 = rootObj.worldToLocal(object.localToWorld(collider.position2.clone()));
            collider.rootRadius = rootObj.worldToLocal(object.localToWorld(collider.position1.clone()
                .add(new THREE.Vector3(collider.radius, 0, 0)))).distanceTo(collider.rootPosition1);
            break;
    }
};

galaxies.utils.flattenProjectile = function (proj) {
    var camPos = galaxies.engine.camera.position,
        flatPos = proj.object.position.clone(),
        flatEdge = flatPos.clone().add(flatPos.clone().normalize().multiplyScalar(proj.hitThreshold)),
        flatDiff = flatPos.clone().sub(camPos),
        flatEdgeDiff = flatEdge.clone().sub(camPos);

    flatPos.sub(flatDiff.multiplyScalar(flatPos.z / flatDiff.z));
    flatEdge.sub(flatEdgeDiff.multiplyScalar(flatEdge.z / flatEdgeDiff.z));

    proj.flatCapsule.position1.copy(proj.flatCapsule.position2);
    proj.flatCapsule.position2.copy(flatPos);
    proj.flatCapsule.rootRadius = proj.flatCapsule.radius = flatPos.distanceTo(flatEdge);
};

galaxies.utils.doSpheresOverlap = function (collider1, collider2) {
    var combinedRadius = collider1.radius + collider2.radius;

    return collider1.rootPosition.distanceToSquared(collider2.rootPosition) <= combinedRadius * combinedRadius;
};

galaxies.utils.doSphereCapsuleOverlap = function (collider1, collider2) {
    var sphere, capsule, capLine, capLineDot, sphereLine, sphereLineDot, scalarSq, distSq, combinedRadius;

    if (collider1.type === "sphere") {
        sphere = collider1;
        capsule = collider2;
    } else {
        capsule = collider1;
        sphere = collider2;
    }

    combinedRadius = sphere.rootRadius + capsule.rootRadius;

    capLine = capsule.rootPosition2.clone().sub(capsule.rootPosition1);
    sphereLine = sphere.rootPosition.clone().sub(capsule.rootPosition1);

    sphereLineDot = sphereLine.dot(sphereLine);

    scalarSq = sphereLine.dot(capLine);

    if (scalarSq <= 0) {
        distSq = sphereLineDot;
    } else {
        capLineDot = capLine.dot(capLine);

        if (scalarSq >= capLineDot) {
            distSq = sphereLineDot - 2 * scalarSq + capLineDot;
        } else {
            distSq = sphereLineDot - scalarSq * scalarSq / capLineDot;
        }
    }

    return distSq <= combinedRadius * combinedRadius;
};

galaxies.utils.doCapsulesOverlap = function (collider1, collider2) {
    var combinedRadius = collider1.rootRadius + collider2.rootRadius,
        dir1 = collider1.rootPosition2.clone().sub(collider1.rootPosition1),
        dir2 = collider2.rootPosition2.clone().sub(collider2.rootPosition1),
        w0 = collider1.rootPosition1.clone().sub(collider2.rootPosition1),
        a = dir1.dot(dir1),
        b = dir1.dot(dir2),
        c = dir2.dot(dir2),
        d = dir1.dot(w0),
        e = dir2.dot(w0),
        denom = a * c - b * b,
        sn, sd, tn, td,
        sc, tc, wc;

    if (denom === 0) {
        sd = td = c;
        sn = 0;
        tn = e;
    } else {
        sd = td = denom;
        sn = b * e - c * d;
        tn = a * e - b * d;

        if (sn < 0) {
            sn = 0;
            tn = e;
            td = c;
        } else if (sn > sd) {
            sn = sd;
            tn = e + b;
            td = c;
        }
    }

    if (tn < 0) {
        tc = 0;

        if (-d < 0) {
            sc = 0;
        } else if (-d > a) {
            sc = 1;
        } else {
            sc = -d / a;
        }
    } else if (tn > td) {
        var ndpb = -d + b;

        tc = 1;

        if (ndpb < 0) {
            sc = 0;
        } else if (ndpb > a) {
            sc = 1;
        } else {
            sc = ndpb / a;
        }
    } else {
        tc = tn / td;
        sc = sn / sd;
    }

    wc = w0.add(dir1.multiplyScalar(sc)).sub(dir2.multiplyScalar(tc));

    return wc.dot(wc) <= combinedRadius * combinedRadius;
};

galaxies.utils.doCollidersOverlap = (function () {
    var utils = galaxies.utils,
        mapping = {
            "sphere": {
                "sphere": utils.doSpheresOverlap,
                "capsule": utils.doSphereCapsuleOverlap
            },
            "capsule": {
                "sphere": utils.doSphereCapsuleOverlap,
                "capsule": utils.doCapsulesOverlap
            }
        };

    return function (collider1, collider2) {
        return mapping[collider1.type][collider2.type](collider1, collider2);
    };
})();

galaxies.utils.getBezierPoint = function (p0x, p0y, a0x, a0y, a1x, a1y, p1x, p1y, t) {
    var p0 = new THREE.Vector2(p0x, p0y),
        p1 = new THREE.Vector2(p1x, p1y);

    if (t === 0) {
        return p0;
    } else if (t === 1) {
        return p1;
    }

    var a0 = new THREE.Vector2(a0x, a0y),
        a1 = new THREE.Vector2(a1x, a1y),
        t2 = t * t,
        t3 = t2 * t,
        invT = 1 - t,
        invT2 = invT * invT,
        invT3 = invT2 * invT;

    return p0.multiplyScalar(invT3).add(a0.multiplyScalar(3 * invT2 * t)).add(a1.multiplyScalar(3 * invT * t2))
        .add(p1.multiplyScalar(t3));
};

galaxies.utils.getBezierTangent = function (p0x, p0y, a0x, a0y, a1x, a1y, p1x, p1y, t) {
    var p0 = new THREE.Vector2(a0x - p0x, a0y - p0y).multiplyScalar(3),
        p2 = new THREE.Vector2(p1x - a1x, p1y - a1y).multiplyScalar(3);

    if (t === 0) {
        return p0;
    } else if (t === 1) {
        return p2;
    }

    var p1 = new THREE.Vector2(a1x - a0x, a1y - a0y).multiplyScalar(6),
        t2 = t * t,
        invT = 1 - t,
        invT2 = invT * invT;

    return p0.multiplyScalar(invT2).add(p1.multiplyScalar(invT * t)).add(p2.multiplyScalar(t2));
};

// Patch SPE to allow negative speeds to make sphere particles move inwards.
// This is used by the UFO laser charge effect.
// May not be needed in latest version of SPE, but needs to be checked before it can be removed.
SPE.Emitter.prototype.randomizeExistingVelocityVector3OnSphere = function( v, base, position, speed, speedSpread ) {
        v.copy( position )
            .sub( base )
            .normalize()
            .multiplyScalar( this.randomFloat( speed, speedSpread ) );
            //.multiplyScalar( Math.abs( this.randomFloat( speed, speedSpread ) ) );
};



