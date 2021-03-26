// node_modules imports
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
// Local imports
import totemLogic, { MAPPINGS } from "../logic.totem.js";
// GLSL imports
import vertexShader from "../../../glsl/colorcube.vert.glsl";
import fragmentShader from "../../../glsl/colorcube.frag.glsl";

class ColorMapper {
  constructor() {
    this._scene = new THREE.Scene();
    this._onSelect = (type, mapping) => {
      totemLogic.actions.mapCurrentSampleTo(type, mapping);
    };

    // Geometry
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: 0.0 },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
    });
    this._colorCube = new THREE.Mesh(geometry, material);
    this._colorCube.rotation.y = Math.PI / 4.0;
    this._colorCube.rotation.x = Math.PI / 4.0;
    this._scene.add(this._colorCube);
    this._cubeTween = new TWEEN.Tween(
      this._colorCube.material.uniforms.uOpacity
    ).to({ value: 1 }, 800);

    // Cursor and color selection indicator
    this._mouseDown = false;
    this._raycastHit = [];

    var sphereGeometry = new THREE.SphereBufferGeometry(0.03, 32, 32);
    var sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this._sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this._sphere.position.set(0, 0, 1.5);
    this._scene.add(this._sphere);

    const radius = 0.1;
    const points = new Array(30).fill(0).map((_, i) => {
      return new THREE.Vector3(
        radius * Math.sin((i / 29) * Math.PI * 2.0),
        radius * Math.cos((i / 29) * Math.PI * 2.0),
        0
      );
    });
    const cursorGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const cursorMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      depthTest: false,
    });
    this._cursor = new THREE.Line(cursorGeometry, cursorMaterial);
    const cursorLineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      this._sphere.position.clone(),
    ]);
    this._cursorLine = new THREE.Line(
      cursorLineGeometry,
      cursorMaterial.clone()
    );
    this._cursorLine.material.depthTest = true;
    this._cursor.position.set(0, 0, 0);
    this._scene.add(this._cursorLine);
    this._scene.add(this._cursor);
  }

  get scene() {
    return this._scene;
  }

  get raycastables() {
    return [this._colorCube];
  }

  handlePointerMove(e, { size }) {
    if (this._raycastHit.length > 0) {
      const newPosition = new THREE.Vector3(
        this._raycastHit[0].point.x,
        this._raycastHit[0].point.y,
        this._raycastHit[0].point.z
      );
      newPosition.setLength(1.1);
      this._sphere.position.copy(newPosition);
      const red = this._raycastHit[0].point.x + 0.5;
      const green = this._raycastHit[0].point.y + 0.5;
      const blue = this._raycastHit[0].point.z + 0.5;
      this._sphere.material.color.fromArray([red, green, blue]);
      // Update the cursor line
      this._cursorLine.geometry.attributes.position.array[3] = newPosition.x;
      this._cursorLine.geometry.attributes.position.array[4] = newPosition.y;
      this._cursorLine.geometry.attributes.position.array[5] = newPosition.z;
      this._cursorLine.geometry.attributes.position.needsUpdate = true;
    }
  }

  handlePointerDown(e) {
    this._clientX = e.clientX;
    this._clientY = e.clientY;
  }

  handlePointerUp(e, { camera, controls }) {
    var x = e.clientX;
    var y = e.clientY;
    // If the mouse moved since the mousedown then don't
    // consider this a selection
    if (x != this._clientX || y != this._clientY) return;
    // No raycast hit
    if (this._raycastHit.length === 0) return;

    const newPosition = new THREE.Vector3(
      this._raycastHit[0].point.x,
      this._raycastHit[0].point.y,
      this._raycastHit[0].point.z
    );
    // Update the cursor
    this._cursor.position.copy(newPosition);
    const red = Math.round((this._raycastHit[0].point.x + 1) * 128);
    const green = Math.round((this._raycastHit[0].point.y + 1) * 128);
    const blue = Math.round((this._raycastHit[0].point.z + 1) * 128);
    this._cursor.material.color.fromArray([red, green, blue]);
    this._onSelect(MAPPINGS.COLOR, [red, green, blue]);
    // Tween the camera
    const normal = this._raycastHit[0].point
      .clone()
      .sub(new THREE.Vector3(0, 0, 0))
      .setLength(4.0);
    const from = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    };
    const to = {
      x: normal.x,
      y: normal.y,
      z: normal.z,
    };
    const cameraTween = new TWEEN.Tween(from).to(to, 800);
    cameraTween
      .onUpdate(function () {
        camera.position.set(from.x, from.y, from.z);
        controls.update();
      })
      .easing(TWEEN.Easing.Quadratic.InOut);
    cameraTween.start();
    controls.update();
  }

  update(deltaTime, { cameraPosition }) {
    this._cursor.lookAt(cameraPosition);
  }

  fadeIn() {
    this._cubeTween.start();
  }

  handleRaycast(hit) {
    this._raycastHit = hit;
  }
}

export default ColorMapper;
