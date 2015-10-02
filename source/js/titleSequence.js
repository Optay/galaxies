"use strict";

this.galaxies = this.galaxies || {};
/*
galaxies.titleSequence = (function() {
  var rotationAxis = new THREE.Vector3();
  
  var TITLE_HUB_OFFSET = 100;
  
  var titleHub = new THREE.Object3D();
  titleHub.position.set( 0, TITLE_HUB_OFFSET, 0 );
  var titles = [];
  
  var titleImageIds = ['title1', 'title2', 'title3', 'title4', 'title5'];
  var titleRotationAxis = new THREE.Vector3(1,0,0);
  for ( var i=0, len=titleImageIds.length; i<len; i++ ) {
    var map = new THREE.Texture( queue.getResult(titleImageIds), THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter );
    map.needsUpdate = true;
    
    var mat = new THREE.SpriteMaterial( {
      map: map,
      color: 0xffffff
      } );
    titles[i] = new THREE.Sprite( mat );
    titles[i].position.set( 0, -TITLE_HUB_OFFSET, 0 );
    titles[i].rotateOnAxis(titleRotationAxis, i * PI_2/len );
    
    titleHub.add( titles[i] );
  }
  
  var activate = function() {
  }
  var update = function() {
  }
  
  
  
  
  return {
    activate: activate,
    update: update
  };
  
})();
*/