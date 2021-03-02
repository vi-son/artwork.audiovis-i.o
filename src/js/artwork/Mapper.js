import * as THREE from "three";

class Mapper {
  constructor() {
    this._scene = new THREE.Scene();

    const geometry = new THREE.ConeGeometry(5, 20, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const cone = new THREE.Mesh(geometry, material);
    this._scene.add(cone);
  }

  get scene() {
    return this._scene;
  }

  handlePointerMove(e, size) {
    // console.log("Pointer move", e, size);
  }

  handlePointerDown(e) {
    // console.log("Pointer down", e);
  }

  handlePointerUp(e) {
    // console.log("Pointer up", e);
  }

  handleResize() {
    // console.log("Resize");
  }

  handleRaycast() {
    // console.log("Raycast");
  }
}

export default Mapper;
