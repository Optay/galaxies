/// <reference path="Rubble.ts"/>

namespace galaxies {
    export class IcyRubble extends Rubble {
        constructor(pool: Pool<IcyRubble>) {
            super(pool, 0.1);

            this.object = new THREE.Mesh(galaxies.resources.geometries["asteroid"],
                galaxies.resources.materials["rubbleice"].clone());
        }
    }
}
