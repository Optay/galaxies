galaxies.generator.rawPatterns = [
    // test level
    /*
     [
     { time: 0, random: true, type: 'star' },
     { time: 8, duration: 0, random: true, quantity: 5, type: 'asteroidice' },

     ],
     */


    [ // Pluto 1-1
        //{ time: 0, type: 'ufo' }, // TEST
        { time: 0, duration: 15, startAngle: 0, endAngle: 360, quantity: 12, type: 'asteroid', random: true },
        { time: 0, duration: 15, startAngle: 0, endAngle: 360, quantity: 3, type: 'miniUFO', random: true },
        { time: 18, duration: 0, startAngle: 45, endAngle: 135, quantity: 5, type: 'asteroid' },
        { time: 20, startAngle: 0, endAngle: 360, type: 'star', random: true },
        { time: 24, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: 'asteroid', random: true },
        { time: 31, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
    ],
    [ // Pluto 1-2
        //{ time: 0, type: 'ufo' }, //TEST

        { time: 0, duration: 0, startAngle: 0, endAngle: -45, quantity: 3, type: 'asteroid' },
        { time: 2, duration: 0, quantity: 1, type: 'powerup', powerup: 'spread' },
        { time: 4, duration: 0, startAngle: -60, endAngle: -120, quantity: 4, type: 'asteroid' },
        { time: 4, duration: 15, startAngle: 0, endAngle: 360, quantity: 8, type: 'asteroid', random: true },
        { time: 8, duration: 0, startAngle: 0, endAngle: 360, quantity: 1, type: 'asteroidice', random: true },
        { time: 13, duration: 3, startAngle: 0, endAngle: 360, quantity: 2, type: 'asteroidice', random: true },
        { time: 17, duration: 6, startAngle: 0, endAngle: 360, quantity: 3, type: 'asteroidice', random: true },
        { time: 24, startAngle: 0, endAngle: 360, type: 'star', random: true },
        { time: 25, duration: 0, startAngle: 52.5, endAngle: 122.5, quantity: 5, type: 'asteroid' },
        { time: 28, duration: 6, startAngle: 0, endAngle: 360, quantity: 2, type: 'asteroid', random: true },
        { time: 28, duration: 6, startAngle: 0, endAngle: 360, quantity: 3, type: 'asteroidice', random: true },
        { time: 34, startAngle: 45, quantity: 1, type: 'comet' },
        { time: 36, duration: 0, startAngle: 90, endAngle: 180, quantity: 5, type: 'asteroid' },
        { time: 34, type: 'ufo' },
    ],
    [ // Pluto 1-3
        //{ time: 0, type: 'ufo' }, // TEST


        { time: 0, duration: 12, startAngle: 0, endAngle: 360, quantity: 4, type: 'asteroid', random: true },
        { time: 0, duration: 12, startAngle: 0, endAngle: 360, quantity: 8, type: 'asteroidice', random: true },
        { time: 6, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
        { time: 16, duration: 0, startAngle: 0, endAngle: 90, quantity: 5, type: 'asteroid' },
        { time: 18, type: 'ufo' },
        { time: 20, duration: 6, startAngle: 0, endAngle: 360, quantity: 3, type: 'asteroid', random: true },
        { time: 20, duration: 6, startAngle: 0, endAngle: 360, quantity: 4, type: 'asteroidice', random: true },
        { time: 28, startAngle: 45, quantity: 1, type: 'comet' },
        { time: 30, duration: 0, startAngle: 180, endAngle: 270, quantity: 5, type: 'asteroid' },
        { time: 32, startAngle: 0, endAngle: 360, type: 'star', random: true },
        { time: 32, duration: 8, startAngle: 90, endAngle: 450, quantity: 8, type: 'asteroid' },
    ],
    [ // Neptune 2-1
        { time: 0, duration: 6, startAngle: 0, endAngle: 360, quantity: 4, type: 'asteroidice', random: true },
        { time: 6, duration: 6, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroidice 90', 'asteroid 10'], random: true },
        { time: 18, duration: 5, startAngle: 90, endAngle: 90, quantity: 5, type: 'asteroid' },
        { time: 21, duration: 5, startAngle: -90, endAngle: -90, quantity: 5, type: 'asteroid' }, // line
        { time: 23, startAngle: 0, endAngle: 360, type: 'star', random: true },
        { time: 28, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroidice 50', 'asteroid 50'], random: true },
        { time: 36, startAngle: 60, quantity: 1, type: 'comet' },
        { time: 38, duration: 0, startAngle: 135, endAngle: 225, quantity: 5, type: 'asteroid' },
        { time: 42, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroidice 75', 'asteroid 25'], random: true },
    ],
    [ // Neptune 2-2
        { time: 0, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroid 80', 'asteroidrad 20'], random: true },
        { time: 4, duration: 0, quantity: 1, type: 'powerup', powerup: 'clone' },
        { time: 6, duration: 5, startAngle: 180, endAngle: 180, quantity: 5, type: 'asteroid' }, // line
        { time: 17, duration: 5, startAngle: 0, endAngle: 0, quantity: 5, type: 'asteroid' }, // line
        { time: 20, startAngle: 0, endAngle: 360, type: 'star', random: true },
        { time: 20, type: 'ufo' },
        { time: 23, duration: 0, startAngle: 180, endAngle: 270, quantity: 5, type: 'asteroid' }, // arc
        { time: 29, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroid 75', 'asteroidrad 25'], random: true },
        { time: 41, duration: 0, startAngle: 90, endAngle: 180, quantity: 5, type: 'asteroid' }, // arc
    ],
    [ // Neptune 2-3
        { time: 0, duration: 6, startAngle: 0, endAngle: 360, quantity: 5, type: ['asteroid 40', 'asteroidice 20', 'asteroidrad 40'], random: true },
        { time: 4, duration: 0, quantity: 1, type: 'powerup', powerup: ['clone', 'spread'] },
        { time: 12, duration: 6, startAngle: 0, endAngle: 360, quantity: 5, type: ['asteroid 40', 'asteroidice 10', 'asteroidrad 50'], random: true },
        { time: 12, type: 'ufo' },
        { time: 18, duration: 0, quantity: 1, type: 'powerup', powerup: 'shield' },
        { time: 22, duration: 0, startAngle: 0, endAngle: 90, quantity: 5, type: 'asteroid' }, // arc
        { time: 24, startAngle: 0, endAngle: 360, type: 'star', random: true },
        { time: 24, type: 'ufo' },
        { time: 30, duration: 6, startAngle: 0, endAngle: 360, quantity: 5, type: ['asteroidice 60', 'asteroidrad 40'], random: true },
        { time: 36, duration: 0, quantity: 1, type: 'powerup', powerup: 'spread' },
        { time: 40, duration: 0, startAngle: 180, endAngle: 270, quantity: 5, type: 'asteroid' }, // arc
        { time: 42, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
        { time: 43, duration: 8, startAngle: 90, endAngle: -270, quantity: 8, type: 'asteroid' }, // spiral
    ],
    [ // Uranus 3-1
        { time: 0, duration: 8, startAngle: 0, endAngle: 360, quantity: 4, type: 'asteroidrad', random: true },
        { time: 2, duration: 0, quantity: 1, type: 'powerup', powerup: 'shield' },
        { time: 8, duration: 8, startAngle: 0, endAngle: 360, quantity: 2, type: ['asteroidrad 90', 'asteroid 10'], random: true },
        { time: 8, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
        { time: 14, startAngle: 0, endAngle: 360, type: 'star', random: true },
        { time: 14, duration: 2, startAngle: 180, endAngle: 250, quantity: 5, type: 'asteroid' }, // spiral
        { time: 18, duration: 0, startAngle: 90, endAngle: 160, quantity: 5, type: 'asteroid' }, // arc
        { time: 22, duration: 8, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroidrad 50', 'asteroid 50'], random: true },
        { time: 30, duration: 0, startAngle: 45, endAngle: -45, quantity: 5, type: 'asteroid' }, // arc
        { time: 34, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroidrad 33', 'asteroidice 33', 'asteroid 34'], random: true },
    ],
    [ // Uranus 3-2
        { time: 0, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroidrad 20', 'asteroidice 50', 'asteroid 30'], random: true },
        { time: 0, duration: 4, startAngle: 0, endAngle: 360, quantity: 2, type: 'asteroidmetal', random: true },
        { time: 2, duration: 0, quantity: 1, type: 'powerup', powerup: 'golden' },
        { time: 4, duration: 5, startAngle: 180, endAngle: 180, quantity: 5, type: 'asteroid' }, // line
        { time: 8, duration: 5, startAngle: 0, endAngle: 0, quantity: 5, type: 'asteroid' }, // line
        { time: 8, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
        { time: 11, type: 'ufo' },
        { time: 16, startAngle: -80, quantity: 1, type: 'comet' },
        { time: 16, duration: 5, startAngle: 0, endAngle: 0, quantity: 5, type: 'asteroid' }, // line
        { time: 21, duration: 0, startAngle: -45, endAngle: -135, quantity: 5, type: 'asteroid' }, // arc
        { time: 26, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroidrad 20', 'asteroidice 50', 'asteroid 30'], random: true },
        { time: 29, startAngle: 0, endAngle: 360, type: 'star', random: true },
        { time: 37, duration: 0, startAngle: 45, endAngle: 135, quantity: 5, type: 'asteroid' }, // arc
        { time: 42, duration: 0, startAngle: -45, endAngle: -135, quantity: 5, type: 'asteroid' }, // arc
    ],
    [ // Uranus 3-3
        { time: 0, duration: 8, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroidrad 90', 'asteroidice 5', 'asteroid 5'], random: true },
        { time: 2, duration: 0, quantity: 1, type: 'powerup', powerup: 'spread' },
        { time: 4, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
        { time: 8, duration: 4, startAngle: 0, endAngle: 360, quantity: 2, type: ['asteroidrad 80', 'asteroidice 15', 'asteroid 5'], random: true },
        { time: 12, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
        { time: 12, type: 'ufo' },
        { time: 15, duration: 0, startAngle: -45, endAngle: 45, quantity: 5, type: 'asteroid' }, // arc
        { time: 20, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
        { time: 20, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroidrad 40', 'asteroidice 60'], random: true },
        { time: 32, duration: 0, startAngle: -45, endAngle: 45, quantity: 5, type: 'asteroid' }, // arc
        { time: 38, duration: 12, startAngle: -90, endAngle: 270, quantity: 12, type: 'asteroid' }, // spiral
        { time: 42, startAngle: 0, endAngle: 360, type: 'star', random: true },
        { time: 54, duration: 12, startAngle: 270, endAngle: -90, quantity: 12, type: 'asteroid' }, // spiral
        { time: 60, duration: 8, startAngle: 0, endAngle: 360, quantity: 4, type: 'asteroidrad', random: true },
        { time: 65, startAngle: 0, endAngle: 360, quantity: 2, type: 'comet', random: true },
        { time: 63, type: 'ufo' },
    ],
    [ // Saturn 4-1

        { time: 0, duration: 8, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroidrad 50', 'asteroidice 50'], random: true },
        { time: 8, duration: 8, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroidrad 80', 'asteroidice 30'], random: true },
        { time: 12, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
        { time: 16, duration: 8, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroidrad 50', 'asteroid 50'], random: true },
        { time: 29, duration: 0, startAngle: 135, endAngle: 225, quantity: 5, type: 'asteroid' }, // arc
        { time: 34, duration: 8, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroidrad 80', 'asteroid 20'], random: true },
        { time: 38, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
        { time: 50, duration: 5, startAngle: 90, endAngle: 90, quantity: 5, type: 'asteroid' }, // line
        { time: 53, startAngle: 0, endAngle: 360, type: 'star', random: true },
        { time: 60, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroidrad 33', 'asteroidice 33', 'asteroid 34'], random: true },
    ],
    [ // Saturn 4-2
        { time: 0, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroidrad 20', 'asteroidice 50', 'asteroid 30'], random: true },
        { time: 3, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
        { time: 3, type: 'ufo' },
        { time: 11, duration: 12, startAngle: 90, endAngle: -270, quantity: 12, type: 'asteroid' }, // sweep
        { time: 17, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
        { time: 28, duration: 5, startAngle: 0, endAngle: 0, quantity: 5, type: 'asteroid' }, // line
        { time: 28, startAngle: -75, quantity: 1, type: 'comet' },
        { time: 28, duration: 0, quantity: 1, type: 'powerup', powerup: 'timeWarp' },
        { time: 30, type: 'ufo' },
        { time: 38, duration: 0, startAngle: 0, endAngle: -90, quantity: 5, type: 'asteroid' }, // arc
        { time: 43, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroid 20', 'asteroidice 50', 'asteroidrad 30'], random: true },
        { time: 46, startAngle: 0, endAngle: 360, type: 'star', random: true },
        { time: 54, duration: 0, startAngle: 45, endAngle: 135, quantity: 5, type: 'asteroid' }, // arc
        { time: 59, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroid 20', 'asteroidice 50', 'asteroidrad 30'], random: true },
    ],
    [ // Saturn 4-3
        { time: 0, duration: 8, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroid 5', 'asteroidice 5', 'asteroidrad 90'], random: true },
        { time: 4, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
        { time: 8, duration: 8, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroid 5', 'asteroidice 15', 'asteroidrad 80'], random: true },
        { time: 12, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
        { time: 21, duration: 0, startAngle: -45, endAngle: 45, quantity: 5, type: 'asteroid' }, // arc
        { time: 21, type: 'ufo' },
        { time: 26, duration: 6, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroid 0', 'asteroidice 60', 'asteroidrad 40'], random: true },
        { time: 29, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
        { time: 37, duration: 0, startAngle: 135, endAngle: 255, quantity: 5, type: 'asteroid' }, // arc
        { time: 40, type: 'ufo' },
        { time: 42, duration: 12, startAngle: 90, endAngle: 450, quantity: 12, type: 'asteroid' }, // sweep
        { time: 45, startAngle: 0, endAngle: 360, type: 'star', random: true },
        { time: 59, duration: 0, startAngle: 45, endAngle: 135, quantity: 5, type: 'asteroid' }, // arc
        { time: 64, duration: 0, startAngle: -45, endAngle: -135, quantity: 5, type: 'asteroid' }, // arc
        { time: 69, duration: 6, startAngle: 0, endAngle: 360, quantity: 4, type: ['asteroid 50', 'asteroidice 0', 'asteroidrad 50'], random: true },
        { time: 72, startAngle: 0, endAngle: 360, quantity: 1, type: 'comet', random: true },
        { time: 74, duration: 6, startAngle: 0, endAngle: 360, quantity: 6, type: ['asteroid 0', 'asteroidice 70', 'asteroidrad 30'], random: true },
    ],
    [
        // test 1

        { time: 0, duration: 4, startAngle: 0, endAngle: 270, quantity: 4, type: 'asteroid' },

        { time: 6, duration: 0, startAngle: 0, endAngle: 270, quantity: 4, type:'asteroid' },
        { time: 9, duration: 0, startAngle: 45, endAngle: 315, quantity: 4, type:'asteroid' },
        { time: 12, duration: 0, startAngle: 0, endAngle: 270, quantity: 4, type:'asteroid' },

        { time: 15, duration: 0, startAngle: 20, endAngle: 60, quantity: 3, type: 'asteroid' },
        { time: 14, duration: 0, startAngle: -45, endAngle: 0, quantity: 1, type: 'comet' },

        { time: 17, duration: 0, startAngle: -135, endAngle: -135, quantity: 1, type: 'asteroidrad' },

        { time: 24, startAngle: 45, type: 'star' }
    ]
    ,
    // test 2
    [
        { time: 0, duration: 6, startAngle: 0, endAngle: 120, quantity: 6, type:'asteroid' },
        { time: 3, duration: 0, startAngle: -90, endAngle: -180, quantity: 4, type:'asteroid' },
        { time: 5, duration: 0, startAngle: -135, endAngle: 0, quantity: 1, type:'asteroidrad' },

        { time: 2, duration: 0, startAngle: 150, endAngle: 0, quantity: 1, type:'comet' },

        { time: 10, duration: 10, startAngle: 180, endAngle: 360, quantity: 10, type: 'asteroid' },
        { time: 10, duration: 5, startAngle: 0, endAngle: 180, quantity: 10, random: true, type: 'asteroid' },

        { time: 15, startAngle: 135, type: 'star' }

    ],
    [ // test 3
        { time: 0, duration: 2, startAngle: 90, endAngle: 90, quantity: 4, type: 'asteroid' },
        { time: 1.5, duration: 2, startAngle: -90, endAngle: -90, quantity: 4, type:'asteroid' },
        { time: 3, duration: 2, startAngle: 180, endAngle: 180, quantity: 4, type:'asteroid' },
        { time: 4.5, duration: 2, startAngle: 0, endAngle: 0, quantity: 4, type:'asteroid' },
        { time: 8, duration: 1.5, startAngle: 90, endAngle: 180, quantity: 3, type:'asteroidice' },
        { time: 9, duration: 2.5, startAngle: -90, endAngle: -45, quantity: 5, type:'asteroid' },
        { time: 14, duration: 1.5, startAngle: -90, endAngle: 0, quantity: 3, type:'asteroidice' },
        { time: 15, duration: 2.5, startAngle: 90, endAngle: 180, quantity: 5, type:'asteroid' },



        { time: 9, startAngle: -135, type: 'star' }
    ],
    /*
     [
     { time: 0, duration: 0, startAngle: 45, endAngle: 315, quantity: 4, type:'asteroid' },
     { time: 5, duration: 0, startAngle: 180, endAngle: 90, quantity: 4, type:'asteroid' },
     { time: 10, duration: 0, startAngle: 0, endAngle: -90, quantity: 4, type:'asteroid' },
     { time: 15, duration: 0, startAngle: 180, endAngle: 270, quantity: 4, type:'asteroid' },
     { time: 20, duration: 0, startAngle: 0, endAngle: 90, quantity: 4, type:'asteroid' },
     { time: 25, duration: 12, startAngle: 0, endAngle: 360, quantity: 12, type:'asteroid' },
     { time: 38, duration: 12, startAngle: 0, endAngle: -360, quantity: 12, type:'asteroid' }
     ]*/
];
