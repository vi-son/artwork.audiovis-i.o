import * as THREE from "three";

function createLineGeometry(
  numSides = 8,
  subdivisions = 50,
  openEnded = false
) {
  // create a base CylinderGeometry which handles UVs, end caps and faces
  const radius = 1;
  const length = 1;
  const baseGeometry = new THREE.CylinderGeometry(
    radius,
    radius,
    length,
    numSides,
    subdivisions,
    openEnded
  );

  // fix the orientation so X can act as arc length
  baseGeometry.rotateZ(Math.PI / 2);

  const faces = baseGeometry.getIndex();
  const positions = baseGeometry.getAttribute("position");
  const uvs = baseGeometry.getAttribute("uv");

  // New attributes data
  const xPositions = [];
  const angles = [];
  const newUvs = [];

  const vertex = new THREE.Vector3();
  let tempVector = new THREE.Vector2();

  for (let f = 0; f < faces.count; f++) {
    const vertexIndex = faces.array[f];
    vertex.fromBufferAttribute(positions, vertexIndex);
    xPositions.push(vertex.x);

    tempVector.set(vertex.y, vertex.z).normalize();
    const angle = Math.atan2(tempVector.y, tempVector.x);
    angles.push(angle);
  }

  // Build typed arrays for our attributes
  const posArray = new Float32Array(xPositions);
  const angleArray = new Float32Array(angles);

  const geometry = new THREE.BufferGeometry();
  geometry.addAttribute("position", new THREE.BufferAttribute(posArray, 1));
  geometry.addAttribute("angle", new THREE.BufferAttribute(angleArray, 1));

  // dispose old geometry since we no longer need it
  baseGeometry.dispose();
  return geometry;
}

export default createLineGeometry;
