"use strict";

this.galaxies = this.galaxies || {};
galaxies.utils = galaxies.utils|| {};

galaxies.words = {};
galaxies.words['verb'] = [
'Defend',
'Save',
'Protect',
'Secure',
'Safeguard',
'Preserve',
'Guard'
];
galaxies.words['adjective'] = [
'UnInhabitable',
'Mysterious',
'Forbidden',
'Foreboding',
'Cosmic',
'Planetary',
'Barren',
'Galactic',
'Volatile',
'Wonderous',
'Interstellar',
'Celestial',
'Secretive',
'Secluded',
'Extraterrestrial',
'Rogue',
'Gaseous',
'Orbitable',
'Alien',
'Lonely',
'Radioactive'
];
galaxies.words['size'] = [
'Dwarf',
'Miniature',
'Diminutive',
'Compact',
'Petite',
'Small',
'Itty-Bitty',
'Lil\'',
'Tiny'
];
galaxies.words['noun'] = [
'Planetoid',
'Moon',
'Exoplanet',
'Pulsar',
'World',
'Orb',
'Sphere',
'Moon Base',
'Space Outpost',
'Battlestar',
'Lunar',
'Planet'
];
galaxies.words['greek'] = [
'Alpha',
'Beta',
'Gamma',
'Delta',
'Epsilon',
'Zeta',
'Theta',
'Sigma',
'Omega',
'Kappa',
'Zeta',
'Centurion',
'Echo'
];

galaxies.utils.generatePlanetName = function( planetNumber ) {
  var name = 
    galaxies.utils.selectRandomElement( galaxies.words['verb'] ) +
    " the " +
    //galaxies.utils.selectRandomElement( galaxies.words['adjective'] ) +
    //"<br>" +
    galaxies.utils.selectRandomElement( galaxies.words['size'] ) +
    "<br>" +
    galaxies.utils.selectRandomElement( galaxies.words['noun'] ) +
    " " +
    galaxies.utils.selectRandomElement( galaxies.words['greek'] ) +
    " " +
    galaxies.utils.selectRandomElement( galaxies.words['greek'] ) +
    " " +
    planetNumber;
    
  // TEST
  // longest name!
  //name = "Safeguard the Itty-Bitty<br>Space Outpost Centurion Centurion 10";
  
  name = name.toUpperCase();
    
  return name;
}

galaxies.utils.selectRandomElement = function( items ) {
  
  return items[ Math.floor( Math.random() * items.length ) ];
}