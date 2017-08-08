(function () {
    // 1. Current system (default min filter, PNG textures)
    // 2. Simpler min filter
    // 3. PVR/DXT textures
    // 4. Custom shader to offload polar calculations
    // 5. Instancing
    // 6. Things together?

    var texLoader = new THREE.TextureLoader();
    var regularTexture = texLoader.load("../images/textures/asteroid_color.jpg");
    var halfTexture = texLoader.load("../images/textures/asteroid_color_half.jpg");
    var quarterTexture = texLoader.load("../images/textures/asteroid_color_quarter.jpg");
    var eighthTexture = texLoader.load("../images/textures/asteroid_color_eighth.jpg");
    var tinyTexture = texLoader.load("../images/textures/asteroid_color_tiny.jpg");
    var textures = [regularTexture, halfTexture, quarterTexture, eighthTexture, tinyTexture];

    var options = {
        instanced: false,
        texture: 0,
        mipMapping: THREE.LinearMipMapLinearFilter,
        cameraDistance: 0
    };
    var controls = new dat.GUI();

    var instancedMeshes, regularMeshes;
    var instancedOrientations;
    var instancedMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            map: { value: regularTexture }
        },
        vertexShader: document.getElementById("vertexShader").textContent,
        fragmentShader: document.getElementById("fragmentShader").textContent
    });
    var regularMaterial = new THREE.MeshBasicMaterial({
        map: regularTexture
    });

    controls.add(options, "instanced").onChange(function (value) {
        instancedMeshes.visible = value;
        regularMeshes.visible = !value;
    });

    controls.add(options, "texture", {"Full Size": 0, "Half Size": 1, "Quarter Size": 2, "Eighth Size": 3, "Tiny Size": 4}).onChange(function(value) {
        instancedMaterial.map = textures[value];
        instancedMaterial.needsUpdate = true;
        regularMaterial.map = textures[value];
        regularMaterial.needsUpdate = true;
    });

    controls.add(options, "mipMapping", {
        "Linear - Linear": THREE.LinearMipMapLinearFilter,
        "Linear - Nearest": THREE.LinearMipMapNearestFilter,
        "Nearest - Linear": THREE.NearestMipMapLinearFilter,
        "Nearest - Nearest": THREE.NearestMipMapNearestFilter,
        "Linear": THREE.LinearFilter,
        "Nearest": THREE.NearestFilter
    }).onChange(function (value) {
        textures.forEach(function (tex) {
            tex.minFilter = value;
            tex.needsUpdate = true;
        });

        instancedMaterial.needsUpdate = true;
        regularMaterial.needsUpdate = true;
    });

    controls.add(options, "cameraDistance", {"Center": 0, "Near": 50, "Far": 120});

    var instances = 5000;
    var renderer, camera, scene;
    var stats;
    var objLoader = new THREE.OBJLoader();

    function initScene() {
        var container = document.getElementById("container");

        camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x101010);

        renderer = new THREE.WebGLRenderer();

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        stats = new Stats();
        container.appendChild(stats.domElement);

        window.addEventListener("resize", onWindowResize, false);
    }

    function initObjects(sourceGeometry) {
        regularMeshes = new THREE.Group();
        var instancedGeometry = new THREE.InstancedBufferGeometry();
        var offsets = new THREE.InstancedBufferAttribute(new Float32Array(instances * 3), 3, 1);
        var orientation = new THREE.Vector4();
        var position = new THREE.Vector3();
        var randomAxis = new THREE.Vector3();

        instancedGeometry.copy(sourceGeometry);
        instancedOrientations = new THREE.InstancedBufferAttribute(new Float32Array(instances * 4), 4, 1).setDynamic(true);

        for (var i = 0; i < instances; ++i) {
            var mesh = new THREE.Mesh(sourceGeometry.clone(), regularMaterial);

            position.set(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50);
            randomAxis.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
            orientation.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();

            position = position.add(position.clone().normalize().multiplyScalar(5));
            offsets.setXYZ(i, position.x, position.y, position.z);
            instancedOrientations.setXYZW(i, orientation.x, orientation.y, orientation.z, orientation.w);

            mesh.position.copy(position);
            mesh.rotateOnAxis(randomAxis, Math.random() * Math.PI * 2);

            regularMeshes.add(mesh);
        }

        instancedGeometry.addAttribute("offset", offsets);
        instancedGeometry.addAttribute("orientation", instancedOrientations);

        instancedMeshes = new THREE.Mesh(instancedGeometry, instancedMaterial);
        instancedMeshes.visible = false;

        scene.add(instancedMeshes);
        scene.add(regularMeshes);
    }

    function onWindowResize(event) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);

        render();
        stats.update();
    }

    var regularAxis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    var lastTime = performance.now();
    var moveQ = ( new THREE.Quaternion( .5, .5, .5, 0.0 ) ).normalize();
    var tmpQ = new THREE.Quaternion();
    var currentQ = new THREE.Quaternion();

    function render() {
        var time = performance.now();
        var i, index;
        var angle = time * 0.00005;
        var angleVector = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));

        camera.position.copy(angleVector).multiplyScalar(options.cameraDistance);
        camera.lookAt(angleVector.clone().multiplyScalar(-1));

        renderer.render(scene, camera);

        var delta = (time - lastTime) / 5000;

        if (regularMeshes.visible) {
            regularMeshes.children.forEach(function (child, idx) {
                child.rotateOnAxis(regularAxis, delta);
            });
        } else {
            tmpQ.set(moveQ.x * delta, moveQ.y * delta, moveQ.z * delta, 1).normalize();

            for (i = 0; i < instances; ++i) {
				index = i * 4;
				currentQ.set(instancedOrientations.array[index], instancedOrientations.array[index + 1], instancedOrientations.array[index + 2], instancedOrientations.array[index + 3]);
				currentQ.multiply(tmpQ);

				instancedOrientations.setXYZW(i, currentQ.x, currentQ.y, currentQ.z, currentQ.w);
            }

            instancedOrientations.needsUpdate = true;
        }

        lastTime = time;
    }

    objLoader.load("../models/asteroid01.obj", function (object) {
        initObjects(object.children[0].geometry);

        animate();
    });

    initScene();
})();
