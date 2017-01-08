/// <reference path="Rubble.ts"/>

namespace galaxies {
    export class AsteroidRubble extends Rubble {
        constructor(pool: Pool<AsteroidRubble>) {
            super(pool, 0.1);

            this.object = new THREE.Mesh(galaxies.resources.geometries["asteroid"], new THREE.MeshLambertMaterial({
                color: 0x847360,
                opacity: 1,
                transparent: true
            }));
        }
    }
}
