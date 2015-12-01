"use strict";
/**
 * Resources
 *
 * Stores hashes of materials, models, and related constructs.
 * May not be instantiated before galaxies.queue is populated.
 * 
 */


this.galaxies = this.galaxies || {};


galaxies.Resources = function() {
  this.geometries = {};
  this.materials = {};
  
  // Parse and cache loaded geometry.
  var objLoader = new THREE.OBJLoader();
  var parsed = objLoader.parse( galaxies.queue.getResult('asteroidmodel') );
  this.geometries['asteroid'] = parsed.children[0].geometry;
  var projmodel = objLoader.parse( galaxies.queue.getResult('projmodel') );
  this.geometries['proj'] = projmodel.children[0].geometry;
  var satmodel = objLoader.parse( galaxies.queue.getResult('satellitemodel') );
  this.geometries['satellite'] = satmodel.children[0].geometry;
  var moonmodel = objLoader.parse( galaxies.queue.getResult('moonmodel') );
  this.geometries['moon'] = moonmodel.children[0].geometry;
  var ufomodel = objLoader.parse( galaxies.queue.getResult('ufomodel') );
  //geometries['ufo'] = ufomodel.children[0].geometry;
  this.geometries['ufo'] = ufomodel;
  var debrismodel = objLoader.parse( galaxies.queue.getResult('satellitedebrismodel') );
  this.geometries['debris'] = debrismodel.children[0].geometry;
  
  
  // define materials
  var asteroidColor = new THREE.Texture( galaxies.queue.getResult('asteroidcolor'), THREE.UVMapping );
  asteroidColor.needsUpdate = true;
  var asteroidNormal = new THREE.Texture( galaxies.queue.getResult('asteroidnormal'), THREE.UVMapping );
  asteroidNormal.needsUpdate = true;
  
  this.materials['asteroid'] = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      specular: 0x000000,
      opacity: 0.4,
      transparent: false,
      map: asteroidColor,
      normalMap: asteroidNormal,
      shading: THREE.SmoothShading
  } );
  this.materials['asteroidmetal'] = new THREE.MeshPhongMaterial( {
      color: 0xffaaaa,
      specular: 0x770000,
      shininess: 100,
      opacity: 0.4,
      transparent: false,
      map: asteroidColor,
      normalMap: asteroidNormal,
      shading: THREE.SmoothShading
  } );
  this.materials['asteroidrad'] = new THREE.MeshPhongMaterial( {
      color: 0xaaffaa,
      specular: 0x00ff00,
      opacity: 0.4,
      transparent: false,
      map: asteroidColor,
      normalMap: asteroidNormal,
      shading: THREE.SmoothShading
  } );
  
  
  var satColor = new THREE.Texture( galaxies.queue.getResult('satellitecolor'), THREE.UVMapping );
  satColor.needsUpdate = true;
  
  this.materials['satellite'] = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      specular: 0x202020,
      shininess: 50,
      opacity: 0.4,
      transparent: false,
      map: satColor,
      shading: THREE.SmoothShading
  } );
  
  
  var moonOcclusion = new THREE.Texture( galaxies.queue.getResult('moonocclusion'), THREE.UVMapping );
  moonOcclusion.needsUpdate = true;
  var moonNormal = new THREE.Texture( galaxies.queue.getResult('moonnormal'), THREE.UVMapping );
  moonNormal.needsUpdate = true;
  
  this.materials['moon'] = new THREE.MeshPhongMaterial( {
      color: 0xaaaaaa,
      specular: 0x000000,
      map: moonOcclusion,
      normalMap: moonNormal,
      shading: THREE.SmoothShading
  } );
  
  
  
  
  var ufoColor = new THREE.Texture( galaxies.queue.getResult('ufocolor') );
  ufoColor.needsUpdate = true;
  this.materials['ufo'] = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      specular: 0x661313,
      shininess: 90,
      transparent: false,
      map: ufoColor,
      shading: THREE.SmoothShading,
      depthTest: true
  } );
  this.materials['ufocanopy'] = new THREE.MeshPhongMaterial( {
    color: 0x222222,
    specular: 0x080808,
    shininess: 100,
    opacity: 0.9,
    transparent: true,
    shading: THREE.SmoothShading,
    blending: THREE.AdditiveBlending
  });

  var projColor = new THREE.Texture( galaxies.queue.getResult('projcolor'), THREE.UVMapping );
  projColor.needsUpdate = true;
  
  this.materials['proj'] = new THREE.MeshBasicMaterial( {
      color: 0xcccccc,
      
      map: projColor,
      shading: THREE.SmoothShading
  } );
  
  this.materials['debris'] = new THREE.MeshPhongMaterial( {
    color: 0x999999,
    specular: 0x202020,
    shininess: 50,
    opacity: 1,
    transparent: true,
    shading: THREE.SmoothShading
  });

  
 
    
  
};
