// node_modules imports
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import TWEEN from "@tweenjs/tween.js";
// GLSL imports
import vertexShader from "../../glsl/colorcube.vert.glsl";
import fragmentShader from "../../glsl/colorcube.frag.glsl";

class ColorMapper {
  constructor(renderer) {
    this._scene = new THREE.Scene();

    // camera
    this._camera = new THREE.OrthographicCamera(-1, +1, +1, -1, -10, 100);
    this._controls = new OrbitControls(this._camera, renderer.domElement);
    this._camera.position.set(1, 1, 1);
    this._controls.target.set(0, 0.25, 0);
    this._controls.update();
    this._controls.enableZoom = false;
    this._controls.enableDamping = true;
    this._controls.dampingFactor = 0.9;

    // Raycasting
    this._mousePosition = new THREE.Vector2();
    this._raycaster = new THREE.Raycaster();
    this._hit = [];
    this._mouseDown = false;
    this._clientX = 0;
    this._clientY = 0;

    // Light
    var light = new THREE.HemisphereLight(0xffffff, 0x666666, 2.75);
    light.position.set(0, 10, 0);
    this._scene.add(light);
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
    this._scene.add(this._colorCube);
    this._cubeTween = new TWEEN.Tween(
      this._colorCube.material.uniforms.uOpacity
    ).to({ value: 1 }, 800);

    // Cursor
    const radius = 0.1;
    const points = new Array(30).fill(0).map((_, i) => {
      return new THREE.Vector3(
        radius * Math.sin((i / 29) * Math.PI * 2.0),
        radius * Math.cos((i / 29) * Math.PI * 2.0),
        0
      );
    });
    var cursorGeometry = new THREE.BufferGeometry().setFromPoints(points);
    var cursorMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      depthTest: false,
    });
    this._cursor = new THREE.Line(cursorGeometry, cursorMaterial);
    this._scene.add(this._cursor);

    // Color selection indicator
    var sphereGeometry = new THREE.SphereBufferGeometry(0.03, 32, 32);
    var sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    // sphereMaterial.depthTest = false;
    this._sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this._sphere.position.set(0, 0, 0);
    this._scene.add(this._sphere);
  }

  get scene() {
    return this._scene;
  }

  get camera() {
    return this._camera;
  }

  handlePointerMove(e, size) {
    this._mousePosition.x = ((e.clientX - size.x) / size.width) * 2 - 1;
    this._mousePosition.y = -((e.clientY - size.y) / size.height) * 2 + 1;
    if (e.buttons !== 0) this._mouseDown = true;
    else this._mouseDown = false;
  }

  handlePointerDown(e) {
    this._clientX = e.clientX;
    this._clientY = e.clientY;
  }

  handlePointerUp(e) {
    var x = e.clientX;
    var y = e.clientY;
    // If the mouse moved since the mousedown then don't consider this a selection
    if (x != this._clientX || y != this._clientY) return;
    else {
      if (this._hit.length > 0) {
        const normal = this._hit[0].point
          .clone()
          .sub(new THREE.Vector3(0, 0, 0))
          .normalize();
        const from = {
          x: this._camera.position.x,
          y: this._camera.position.y,
          z: this._camera.position.z,
        };
        const to = {
          x: normal.x,
          y: normal.y,
          z: normal.z,
        };
        const cameraTween = new TWEEN.Tween(from).to(to, 500);
        cameraTween
          .onUpdate(function () {
            this._camera.position.set(from.x, from.y, from.z);
            this._controls.update();
          })
          .easing(TWEEN.Easing.Quadratic.InOut);
        cameraTween.start();
        this._controls.update();
        this._cursor.position.set(
          this._hit[0].point.x,
          this._hit[0].point.y,
          this._hit[0].point.z
        );
        const red = Math.round((this._hit[0].point.x + 0.5) * 255);
        const green = Math.round((this._hit[0].point.y + 0.5) * 255);
        const blue = Math.round((this._hit[0].point.z + 0.5) * 255);
      }
    }
  }

  fadeIn() {
    this._cubeTween.start();
  }

  handleResize(aspect) {
    // this._camera.aspect = aspect;
    // this._camera.updateProjectionMatrix();
  }

  raycast() {
    // this._raycaster.setFromCamera(this._mousePosition, this._camera);
    // this._hit = this._raycaster.intersectObject(this._colorCube);
    // this._cursor.lookAt(this._camera.position);
    // if (this._hit.length > 0) {
    //   this._sphere.position.set(
    //     this._hit[0].point.x,
    //     this._hit[0].point.y,
    //     this._hit[0].point.z
    //   );
    // }
  }
}

export default ColorMapper;
