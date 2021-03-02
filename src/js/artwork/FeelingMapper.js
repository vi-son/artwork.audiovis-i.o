import * as THREE from "three";

class FeelingMapper {
  constructor() {
    this._scene = new THREE.Scene();
    this._root = new THREE.Object3D();

    // Light
    var light = new THREE.HemisphereLight(0xffffff, 0x666666, 2.0);
    light.position.set(10, 10, 0);
    this._scene.add(light);

    this._feelingMap = new Map();
    this._feelings = [
      ["klar", "aufkmersam", "neugierig"],
      ["begeistert", "froh", "gelassen"],
      ["bewundernd", "vertrauend", "akzeptierend"],
      ["erschrocken", "ängstlich", "besorgt"],
      ["erstaunt", "überrascht", "verwirrt"],
      ["betrübt", "traurig", "nachdenklich"],
      ["angewidert", "ablehnend", "gelangweilt"],
      ["wütend", "verärgert", "gereizt"],
    ];

    this._create();
  }

  _create() {
    const material = new THREE.MeshLambertMaterial({
      color: 0x7a7a7a,
      side: THREE.DoubleSide,
      flatShading: true,
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
      const mesh = new THREE.Mesh(geometry, material.clone());
      this._root.add(mesh);
      this._feelingMap.set(mesh.id, row[0]);
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
        const mesh = new THREE.Mesh(geometry, material.clone());
        this._root.add(mesh);
        this._feelingMap.set(mesh.id, f);
        prevY = v;
        prevX = u;
        prevX1 = u1;
        prevZ = w;
        prevZ1 = w1;
      });
    });
    this._scene.add(this._root);
  }

  get scene() {
    return this._scene;
  }
}

export default FeelingMapper;
