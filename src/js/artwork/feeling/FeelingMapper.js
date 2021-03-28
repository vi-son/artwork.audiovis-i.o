import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
// Local imports
import totemLogic, { MAPPINGS } from "../logic.totem.js";

class FeelingMapper {
  constructor() {
    this._scene = new THREE.Scene();
    this._root = new THREE.Object3D();

    this._highlightColor = new THREE.Color(0x060609);
    this._defaultColor = new THREE.Color(0x7a7a7a);

    this._onSelect = (type, mapping) => {
      totemLogic.actions.mapCurrentSampleTo(type, mapping);
    };
    this._onHover = (feeling) => totemLogic.actions.setHint(feeling);

    // Light
    var light = new THREE.HemisphereLight(0xffffff, 0x666666, 1.0);
    light.position.set(10, 10, 0);
    this._scene.add(light);

    this._feelingMap = new Map();
    this._feelings = [
      [
        { text: "klar", color: 0xff7c14 },
        { text: "aufkmersam", color: 0xffac6a },
        { text: "neugierig", color: 0xf6c299 },
      ],
      [
        { text: "begeistert", color: 0xffd013 },
        { text: "froh", color: 0xffdd57 },
        { text: "gelassen", color: 0xffebaa },
      ],
      [
        { text: "bewundernd", color: 0x1a621f },
        { text: "vertrauend", color: 0x4a9a50 },
        { text: "akzeptierend", color: 0x97cb9b },
      ],
      [
        { text: "erschrocken", color: 0x196b64 },
        { text: "ängstlich", color: 0x47a49d },
        { text: "besorgt", color: 0x90d7d1 },
      ],
      [
        { text: "erstaunt", color: 0x205489 },
        { text: "überrascht", color: 0x5989ba },
        { text: "verwirrt", color: 0x9db7d1 },
      ],
      [
        { text: "betrübt", color: 0x2c2a8d },
        { text: "traurig", color: 0x5862d6 },
        { text: "nachdenklich", color: 0xa09fd7 },
      ],
      [
        { text: "angewidert", color: 0x612fa7 },
        { text: "ablehnend", color: 0x9e61d3 },
        { text: "gelangweilt", color: 0xcc90e1 },
      ],
      [
        { text: "wütend", color: 0xd92800 },
        { text: "verärgert", color: 0xd94d2d },
        { text: "gereizt", color: 0xd97d68 },
      ],
    ];
    this._selectedId = -1;

    // Raycasting
    this._raycastHit = [];

    this._create();
  }

  _create() {
    const material = new THREE.MeshBasicMaterial({
      color: 0x7a7a7a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });

    this._feelings.map((row, i) => {
      const n = this._feelings.length;
      var geometry = new THREE.BufferGeometry();
      const vert = [];
      let radius = 0.5;
      const a = (i / n) * 2 * Math.PI;
      const b = ((i + 1) / n) * 2 * Math.PI;
      const x = radius * Math.sin(a);
      const z = radius * Math.cos(a);
      const x1 = radius * Math.sin(b);
      const z1 = radius * Math.cos(b);
      const y = 0;
      let prevX = x;
      let prevZ = z;
      let prevX1 = x1;
      let prevZ1 = z1;
      let prevY = y;
      vert.push(0, 0.5, 0);
      vert.push(x, y, z);
      vert.push(x1, y, z1);
      var vertices = new Float32Array(vert);
      geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
      geometry.computeVertexNormals();
      geometry.computeFaceNormals();
      const faceMaterial = material.clone();
      faceMaterial.color.set(row[0].color);
      const mesh = new THREE.Mesh(geometry, faceMaterial);
      mesh._defaultColor = row[0].color;
      this._root.add(mesh);
      this._feelingMap.set(mesh.id, row[0].text);
      row.slice(1).map((f, j) => {
        geometry = new THREE.BufferGeometry();
        var vert = [];
        radius = (this._feelings[0].length - (j + 2)) / 3.3;
        let step = 0.33 / (this._feelings[0].length - 1);
        const inset = 0.0; //Math.min(1.0, step * (j + 1));
        let o = ((i + inset) / n) * 2 * Math.PI;
        let p = ((i + 1 - inset) / n) * 2 * Math.PI;
        const u = radius * Math.sin(o);
        const w = radius * Math.cos(o);
        const u1 = radius * Math.sin(p);
        const w1 = radius * Math.cos(p);
        const v = -(j + 1) * 0.5;
        vert.push(prevX, prevY, prevZ);
        vert.push(u, v, w);
        vert.push(prevX1, prevY, prevZ1);
        vert.push(prevX1, prevY, prevZ1);
        vert.push(u1, v, w1);
        vert.push(u, v, w);
        vertices = new Float32Array(vert);
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(vertices, 3)
        );
        geometry.computeVertexNormals();
        geometry.computeFaceNormals();
        const faceMaterial = material.clone();
        faceMaterial.color.set(f.color);
        const mesh = new THREE.Mesh(geometry, faceMaterial);
        mesh._defaultColor = f.color;
        this._root.add(mesh);
        this._feelingMap.set(mesh.id, f.text);
        prevY = v;
        prevX = u;
        prevX1 = u1;
        prevZ = w;
        prevZ1 = w1;
      });
    });
    this._root.position.y = 0.15;
    this._scene.add(this._root);
    let from = { opacity: 0 };
    this._rootTween = new TWEEN.Tween(from)
      .to({ opacity: 1 }, 800)
      .onUpdate(() => {
        this._root.children.forEach((c) => {
          c.material.opacity = from.opacity;
        });
      });
  }

  get scene() {
    return this._scene;
  }

  get raycastables() {
    return this._root.children;
  }

  fadeIn() {
    this._rootTween.start();
  }

  update(deltaTime) {
    if (this._raycastHit.length > 0) {
      const { object } = this._raycastHit[0];
      this._onHover(this._feelingMap.get(object.id));
      object.material.color.set(this._highlightColor);
      this._root.children.forEach((obj) => {
        if (obj.id !== this._raycastHit[0].object.id) {
          obj.material.color.set(obj._defaultColor);
        }
      });
    }
  }

  handlePointerMove(e) {}

  handlePointerDown(e) {
    this._clientX = e.clientX;
    this._clientY = e.clientY;
  }

  handlePointerUp(e, { camera, controls }) {
    var x = e.clientX;
    var y = e.clientY;
    // If the mouse moved since the mousedown then
    // don't consider this a selection
    if (x != this._clientX || y != this._clientY) return;
    if (this._raycastHit.length > 0) {
      const normal = this._raycastHit[0].point
        .clone()
        .sub(new THREE.Vector3(0, 0, 0))
        .normalize()
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
      const cameraTween = new TWEEN.Tween(from).to(to, 200);
      cameraTween.onUpdate(function () {
        camera.position.set(from.x, from.y, from.z);
        controls.update();
      });
      cameraTween.start();
      controls.update();
      const { id } = this._raycastHit[0].object;
      this._selectedId = id;
      this._onSelect(MAPPINGS.FEELING, {
        feeling: this._feelingMap.get(this._selectedId),
        point: this._raycastHit[0].point,
      });
    }
  }

  handleRaycast(hit) {
    this._raycastHit = hit;
  }
}

export default FeelingMapper;
