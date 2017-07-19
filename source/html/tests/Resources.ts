"use strict";

namespace galaxies {
    export interface Map<T> {
        [key: string]: T
    }

    export class Resources {
        static geometries: Map<THREE.Geometry> = {};
        static materials: Map<THREE.Material> = {};
    }
}
