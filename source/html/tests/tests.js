(function () {
    // TODO: Three.js vs TWGL. Track benefits of each option (number of asteroids at a time)
    // 1. Current system (default min filter, PNG textures)
    // 2. Simpler min filter
    // 3. PVR/DXT textures
    // 4. Custom shader to offload polar calculations
    // 5. Instancing
    // 6. Things together?

    var canvas = document.getElementById("output"),
        renderer = new THREE.WebGLRenderer({alpha: false, canvas: canvas}),
        scene = new THREE.Scene(),
        camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000),
        ambient = new THREE.AmbientLight(0xeeeeff, 0.05),
        sun = new THREE.DirectionalLight(0xffffee),
        lastTime = performance.now();

    sun.position.set(1, 1, 1);

    scene.add(ambient);
    scene.add(sun);

    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    camera.position.z = 30;

    function render(time)
    {
        requestAnimationFrame(render);

        var delta = (time - lastTime) / 1000;

        renderer.render(scene, camera);

        lastTime = time;
    }

    render(performance.now());
})();