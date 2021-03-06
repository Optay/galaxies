"use strict";
this.galaxies = this.galaxies || {};
galaxies.debug = {};

// init debug controls
window.addEventListener("load",
    function(event) {
        var datgui = new dat.GUI(),
            locationParams = location.search.substr(1).split("&"),
            urlParams = {},
            isDev;

        locationParams.forEach(function(param) {
            var pieces = param.split("=");

            urlParams[pieces[0]] = pieces[1];
        });

        console.log("debug init");

        galaxies.debug.urlParams = urlParams;

        isDev = urlParams.hasOwnProperty("dev");

        datgui.close();

        galaxies.debug.datgui = datgui;

        galaxies.debug.stats = new Stats();
        galaxies.debug.stats.domElement.style.position = "absolute";
        galaxies.debug.stats.domElement.style.left = "0";
        galaxies.debug.stats.domElement.style.top = "0";
        document.body.appendChild(galaxies.debug.stats.domElement);

        var userValues = {
            Location: urlParams.startAt || "1-1",
            ClearStorage: function() {
                if (galaxies.utils.isLocalStorageAvailable()) {
                    localStorage.clear();
                }

                galaxies.engine.initPlayerData();
            },
            UnlockAll: function() {
                var playerData = galaxies.engine.playerData,
                    i;

                playerData.completedTutorial = true;

                for (i = 0; i < galaxies.engine.TOTAL_PLANETS; ++i) {
                    galaxies.engine.playerData.planets[i].completed = true;
                }
            },
            Pluto: function() { setPlanet(0); },
            Neptune: function() { setPlanet(1); },
            Uranus: function() { setPlanet(2); },
            Saturn: function() { setPlanet(3); },
            Jupiter: function() { setPlanet(4); },
            Mars: function() { setPlanet(5); },
            Earth: function() { setPlanet(6); },
            Round2: function() { setRound(2); },
            Round3: function() { setRound(3); },
            BossRound: function() { setRound(4); },
            Clone: function() { galaxies.engine.setPowerup("clone"); },
            Spread: function() { galaxies.engine.setPowerup("spread"); },
            Golden: function() { galaxies.engine.setPowerup("golden"); },
            Seeker: function() { galaxies.engine.setPowerup("seeker"); },
            Shield: function() { galaxies.engine.setPowerup("shield"); },
            TimeWarp: function() { galaxies.engine.setPowerup("timeWarp"); },
            BossMonster: function() { galaxies.engine.addBoss("monster"); },
            ElephaTRON: function() { galaxies.engine.addBoss("elephatron"); },
            InsectiClyde: function() { galaxies.engine.addBoss("insecticlyde"); },
            InsectiClydeSegments: 10,
            MiniUFO: function() { galaxies.engine.addObstacle("miniUFO") },
            LaserUFO: function() { galaxies.engine.addUfo("laser") },
            TractorBeamUFO: function() { galaxies.engine.addUfo("tractorBeam") },
            MoonColor: "#FFFFFF",
            invulnerable: false
        };

        var locationController = datgui.add(userValues, "Location"),
            validLocation = /\d+\s*-\s*\d+/;

        galaxies.debug.changeLocation = function(value) {
            if (!validLocation.test(value)) {
                return;
            }

            var parts = value.split("-").map(function(val) {
                    return parseInt(val.trim());
                }),
                previousPlanet = galaxies.engine.planetNumber,
                previousRound = galaxies.engine.roundNumber;

            if (parts[0] < 1 ||
                parts[0] > galaxies.resources.planetData.length ||
                parts[1] < 1 ||
                parts[1] > galaxies.engine.ROUNDS_PER_PLANET) {
                return;
            }

            galaxies.engine.levelNumber = (parts[0] - 1) * galaxies.engine.ROUNDS_PER_PLANET + parts[1];

            galaxies.engine.clearLevel();

            if (previousRound === 4 && galaxies.engine.roundNumber !== 4) {
                galaxies.engine.bossMode = false;
            }

            if (galaxies.engine.planetNumber === previousPlanet) {
                galaxies.engine.initLevel();
            } else {
                galaxies.engine.initRootRotation();
                galaxies.engine.planetTransition();
            }
        };

        locationController.onChange(galaxies.debug.changeLocation);

        var storage = datgui.addFolder("Storage");

        storage.add(userValues, "ClearStorage");
        storage.add(userValues, "UnlockAll");

        var planets = datgui.addFolder("Planets");

        planets.add(userValues, "Pluto");
        planets.add(userValues, "Neptune");
        planets.add(userValues, "Uranus");
        planets.add(userValues, "Saturn");
        planets.add(userValues, "Jupiter");
        planets.add(userValues, "Mars");
        planets.add(userValues, "Earth");

        var round = datgui.addFolder("Round");

        round.add(userValues, "Round2");
        round.add(userValues, "Round3");
        round.add(userValues, "BossRound");

        var powerups = datgui.addFolder("Powerups");

        powerups.add(userValues, "Clone");
        powerups.add(userValues, "Spread");
        powerups.add(userValues, "Golden");
        powerups.add(userValues, "Seeker");
        powerups.add(userValues, "Shield");
        powerups.add(userValues, "TimeWarp");

        var bosses = datgui.addFolder("Bosses");

        bosses.add(userValues, "BossMonster");
        bosses.add(userValues, "ElephaTRON");
        bosses.add(userValues, "InsectiClyde");
        var segmentController = bosses.add(userValues, "InsectiClydeSegments");

        segmentController.onChange(function(value) {
            galaxies.engine.bosses.insecticlyde.maxSegments = value;
        });

        var ufos = datgui.addFolder("UFOs");

        ufos.add(userValues, "LaserUFO");
        ufos.add(userValues, "TractorBeamUFO");
        ufos.add(userValues, "MiniUFO");

        var colorChanger = datgui.addColor(userValues, "MoonColor");
        colorChanger.onChange(function(newValue) {
            galaxies.engine.planet.material.color.set(newValue);
        });

        galaxies.debug.moonColor = colorChanger;

        var invulnerableController = datgui.add(userValues, "invulnerable");
        invulnerableController.onChange(function(newValue) {
            galaxies.engine.invulnerable = newValue;
        });

        function setPlanet(planetNumber) {
            galaxies.engine.levelNumber = 1 + planetNumber * galaxies.engine.ROUNDS_PER_PLANET;

            galaxies.engine.clearLevel();
            galaxies.engine.initRootRotation();
            galaxies.engine.planetTransition();
        }

        function setRound(round) {
            galaxies.engine.levelNumber += round - galaxies.engine.roundNumber;

            galaxies.engine.clearLevel();
            galaxies.engine.initLevel();
        }

        if (isDev) {
            var screenshotArea = document.getElementsByClassName("image-viewer")[0],
                altCanvas = screenshotArea.getElementsByClassName("screenshot-canvas")[0],
                altCtx = altCanvas.getContext("2d"),
                dbW = 0,
                dbH = 0,
                pixels = [],
                needsConversion = false;

            altCanvas.style.maxWidth = "50%";
            altCanvas.style.maxHeight = "50%";

            //galaxies.engine.invulnerable = true;
            //galaxies.engine.POWERUP_CHARGED = 100;
            document.addEventListener("keydown",
                function(e) {
                    switch (e.keyCode) {
                    case 32: // Spacebar
                        if (galaxies.debug.datgui.domElement.classList.contains("hidden")) {
                            galaxies.debug.stats.domElement.classList.remove("hidden");
                            galaxies.debug.datgui.domElement.classList.remove("hidden");
                        } else {
                            galaxies.debug.stats.domElement.classList.add("hidden");
                            galaxies.debug.datgui.domElement.classList.add("hidden");
                        }
                        break;
                    case 79: // O
                        if (screenshotArea.classList.contains("hidden")) {
                            screenshotArea.classList.remove("hidden");

                            if (needsConversion) {
                                var trueWidth = dbW * 4,
                                    imgData = altCtx.createImageData(dbW, dbH),
                                    data = imgData.data,
                                    row,
                                    col;

                                needsConversion = false;

                                for (row = 0; row < dbH; ++row) {
                                    for (col = 0; col < trueWidth; ++col) {
                                        data[row * trueWidth + col] = pixels[(dbH - row - 1) * trueWidth + col];
                                    }
                                }

                                altCanvas.width = dbW;
                                altCanvas.height = dbH;

                                altCtx.putImageData(imgData, 0, 0);
                            }
                        } else {
                            screenshotArea.classList.add("hidden");
                        }
                        break;
                    case 80: // P
                        var gl = galaxies.engine.renderer.context;

                        dbW = gl.drawingBufferWidth;
                        dbH = gl.drawingBufferHeight;
                        pixels = new Uint8Array(dbW * dbH * 4);

                        gl.readPixels(0, 0, dbW, dbH, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

                        needsConversion = true;
                        break;
                    }
                });
        } else {
            galaxies.debug.stats.domElement.classList.add("hidden");
            galaxies.debug.datgui.domElement.classList.add("hidden");
        }
    });