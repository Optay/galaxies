/// <reference path="Rubble.ts"/>

namespace galaxies {
    export class IceCubeRubble extends Rubble {
        constructor(pool: Pool<IceCubeRubble>) {
            super(pool, 1);

            this.object = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2),
                galaxies.resources.materials["asteroidice"].clone());
        }
    }
}