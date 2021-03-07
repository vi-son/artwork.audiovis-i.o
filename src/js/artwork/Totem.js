// node_modules imports
import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { PositionalAudioHelper } from "three/examples/jsm/helpers/PositionalAudioHelper.js";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import md5 from "blueimp-md5";
import Stats from "three/examples/jsm/libs/stats.module.js";
import * as dat from "dat.gui";
import { ButtonDownloadRendering } from "@vi.son/components";
// Local imports
import createLineGeometry from "../utils/createLineGeometry.js";
import { remap, randomIndex } from "../utils/math.js";

import Mapper from "./Mapper.js";
import ColorMapper from "./ColorMapper.js";
import ShapeMapper from "./ShapeMapper.js";
import FeelingMapper from "./FeelingMapper.js";

// Style imports
import "../../sass/components/Totem.sass";
// SVG imports
import IconMouse from "../../../assets/svg/mouse.svg";
// GLSL imports
import tubeVertexShader from "../../glsl/tubes.vert.glsl";
import tubeFragmentShader from "../../glsl/tubes.frag.glsl";
import backgroundVertexShader from "../../glsl/background.vert.glsl";
import backgroundFragmentShader from "../../glsl/background.frag.glsl";

class Totem extends THREE.Group {
  constructor(canvas, mapping, selectionHandler) {
    super();

    this._state = null;
    this._canvas = canvas;
    this._selectionHandler = selectionHandler;

    // Mappings
    this.mapping = mapping;
    this._sounds = [];
    this._setupMappings();

    // Scene elements
    this.deltatime = 0;
    this.time = 0;
    this.clock = new THREE.Clock();
    this.clock.start();

    this._setupScene(canvas);
    this._setupBackground();
    this._setupTube();
    this._setupRaycasting();

    this._mapper = new Mapper();
    this.colorInput = new ColorMapper(this.renderer, (mapping) => {
      const [r, g, b] = mapping.mapping;
      this.backgroundMaterial.uniforms.uColor.value = new THREE.Color(
        `rgb(${r}, ${g}, ${b})`
      );
      this._selectionHandler(mapping);
    });
    this.shapeMapper = new ShapeMapper((mapping) => {
      this._selectionHandler(mapping);
    });
    this.feelingMapper = new FeelingMapper((mapping) => {
      this._selectionHandler(mapping);
    });

    // Mappings
    this._mapFeelings();
    this._mapShapes();
    this._mapColors();

    // Stats
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
  }

  pause() {
    this.renderer.setAnimationLoop(null);
    this.clock.stop();
    this._sounds.map((s) => s.pause());
  }

  continue() {
    this.renderer.setAnimationLoop(this._renderLoop.bind(this));
    this.clock.start();
    this._sounds.map((s) => s.play());
  }

  setState(state) {
    this._state = state;
    this._sounds.forEach((s) => s.pause());
    switch (this._state) {
      case "shape-input":
        this.shapeMapper.fadeIn();
        break;
      case "feeling-input":
        this.feelingMapper.fadeIn();
        break;
      case "color-input":
        this.colorInput.fadeIn();
        break;
      case "totem":
        this._loadSounds();
        break;
    }
  }

  _setupRaycasting() {
    this._raycaster = new THREE.Raycaster();
    this._raycastHit = [];
    this._mousePosition = new THREE.Vector2();
  }

  _setupBackground() {
    this.backgroundCamera = new THREE.OrthographicCamera(
      -2 / this.size.width,
      +2 / this.size.width,
      +2 / this.size.width,
      -2 / this.size.width,
      -1,
      100
    );
    this.backgroundScene = new THREE.Scene();
    this.backgroundMaterial = new THREE.ShaderMaterial({
      vertexShader: backgroundVertexShader,
      fragmentShader: backgroundFragmentShader,
      uniforms: {
        uColor: {
          // value: new THREE.Color(`rgb(105, 108, 112)`),
          value: new THREE.Color(`rgb(144, 150, 154)`),
        },
        uResolution: {
          value: new THREE.Vector2(
            this.size.width * window.devicePixelRatio,
            this.size.height * window.devicePixelRatio
          ),
        },
      },
      depthWrite: false,
    });
    var planeGeometry = new THREE.PlaneGeometry(2, 2);
    this.backgroundPlane = new THREE.Mesh(
      planeGeometry,
      this.backgroundMaterial
    );
    this.backgroundScene.add(this.backgroundPlane);
  }

  _setupMappings() {
    this.colorMappings = this.mapping
      .filter((m) => m.type === "Farbe")
      .map((m, i) => {
        return {
          index: i,
          color: m.mapping,
          sample: m.sample,
        };
      });

    this.shapeMappings = this.mapping
      .filter((m) => m.type === "Form")
      .map((m, i) => {
        return {
          index: i,
          shape: m.mapping,
        };
      });

    this.feelingMappings = this.mapping
      .filter((m) => m.type === "Gefühl")
      .map((m, i) => {
        return {
          index: i,
          feeling: m.mapping,
          sample: m.sample,
        };
      });

    if (process.env.NODE_ENV === "development") {
      console.log(`# Color Mappings: ${this.colorMappings.length}`);
      console.log(`# Shape Mappings: ${this.shapeMappings.length}`);
      console.log(`# Feeling Mappings: ${this.feelingMappings.length}`);
    }
  }

  _setupTube() {
    this.colors = this.colorMappings.map(
      (cm) =>
        new THREE.Vector3(
          cm.color[0] / 255.0,
          cm.color[1] / 255.0,
          cm.color[2] / 255.0
        )
    );
    const colorToUniformsArray = new Array(this.mapping.length)
      .fill(0)
      .map((_, i) => {
        if (this.colors[i]) {
          return this.colors[i];
        } else {
          return new THREE.Vector3();
        }
      });
    const numSides = 4;
    const subdivisions = 50;
    this.tubeMaterial = new THREE.RawShaderMaterial({
      vertexShader: tubeVertexShader,
      fragmentShader: tubeFragmentShader,
      side: THREE.FrontSide,
      extensions: {
        deriviatives: true,
      },
      defines: {
        lengthSegments: subdivisions.toFixed(1),
        FLAT_SHADED: false,
      },
      uniforms: {
        uResolution: {
          type: "vec2",
          value: new THREE.Vector2(this.size.width, this.size.height),
        },
        uThickness: { type: "f", value: 0.02 },
        uTime: { type: "f", value: 2.5 },
        uColors: {
          type: "a",
          value: colorToUniformsArray,
        },
        uAnalysers: {
          type: "a",
          value: new Array(this.mapping.length).fill(0),
        },
        uAnalyserOffset: {
          type: "i",
          value: 0,
        },
        uRadialSegments: { type: "f", value: numSides },
        uStopCount: { type: "i", value: this.colorMappings.length },
        uPoints: {
          type: "a",
          value: [
            new THREE.Vector3(0, -3, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 3, 0),
          ],
        },
      },
    });
  }

  _setupScene(canvas) {
    this.size = document
      .querySelector(".canvas-wrapper")
      .getBoundingClientRect();

    // Scene & totem group
    this.scene = new THREE.Scene();
    this.totem = new THREE.Group();
    this.scene.add(this.totem);
    this.totem.position.set(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: 1,
      alpha: true,
      // preserveDrawingBuffer: true,
      // toneMapping: THREE.ACESFilmicToneMapping,
    });
    this.renderer.setSize(this.size.width, this.size.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.autoClear = false;
    this.renderer.setAnimationLoop(this._renderLoop.bind(this));

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.size.width / this.size.height,
      0.01,
      1000
    );
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.camera.position.set(0, 0.0, 4.0);
    this.controls.update();
    this.controls.enableZoom = true;
    this.controls.enablePan = false;
    this.controls.enableDamping = false;
    this.controls.dampingFactor = 0.1;

    // Audio listener
    this.analysers = [];
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);

    // Light
    var light = new THREE.HemisphereLight(0xffffff, 0x666666, 3.75);
    light.position.set(0, 10, 0);
    this.scene.add(light);
  }

  handlePointerMove(e) {
    this._mapper.handlePointerMove(e, { size: this.size });
    this._mousePosition.x =
      ((e.clientX - this.size.x) / this.size.width) * 2 - 1;
    this._mousePosition.y =
      -((e.clientY - this.size.y) / this.size.height) * 2 + 1;
    switch (this._state) {
      case "shape-input":
        this.shapeMapper.handlePointerMove(e, { size: this.size });
        break;
      case "color-input":
        this.colorInput.handlePointerMove(e, { size: this.size });
        break;
      case "feeling-input":
        this.feelingMapper.handlePointerMove(e, { size: this.size });
        break;
    }
  }

  handlePointerDown(e) {
    this._mapper.handlePointerDown(e);
    switch (this._state) {
      case "shape-input":
        this.shapeMapper.handlePointerDown(e);
        break;
      case "color-input":
        this.colorInput.handlePointerDown(e);
        break;
      case "feeling-input":
        this.feelingMapper.handlePointerDown(e);
        break;
    }
  }

  handlePointerUp(e) {
    this._mapper.handlePointerUp(e);
    switch (this._state) {
      case "shape-input":
        this.shapeMapper.handlePointerUp(e);
        break;
      case "color-input":
        this.colorInput.handlePointerUp(e, {
          camera: this.camera,
          controls: this.controls,
        });
        break;
      case "feeling-input":
        this.feelingMapper.handlePointerUp(e, {
          camera: this.camera,
          controls: this.controls,
        });
        break;
    }
  }

  handleResize(e) {
    const canvasWrapper = document.querySelector(".canvas-wrapper");
    if (canvasWrapper) {
      let newSize = canvasWrapper.getBoundingClientRect();
      // Update camera
      this.camera.aspect = newSize.width / newSize.height;
      this.camera.updateProjectionMatrix();
      this.controls.update();
      // Update background
      this.backgroundCamera.aspect = newSize.width / newSize.height;
      this.backgroundCamera.updateProjectionMatrix();
      this.backgroundMaterial.uniforms.uResolution.value = new THREE.Vector2(
        newSize.width * window.devicePixelRatio,
        newSize.height * window.devicePixelRatio
      );
      // Update renderer
      this.renderer.setSize(newSize.width, newSize.height);

      this._mapper.handleResize(this.camera.aspect);
    }
  }

  _loadSounds() {
    // Audio
    this.samplesFolder = `/assets/audio/audiovisio/`;
    this.audioLoader = new THREE.AudioLoader();
    // Show audio sources
    const audioVisualizerCubes = [];
    let allLoaded = false;
    this.mapping.map((c, i) => {
      const sampleFilepath = `${this.samplesFolder}${c.sample}`;
      const positionalAudio = new THREE.PositionalAudio(this.listener);
      const analyser = new THREE.AudioAnalyser(positionalAudio, 32);
      this.audioLoader.load(sampleFilepath, (buffer) => {
        positionalAudio.setBuffer(buffer);
        positionalAudio.setLoop(true);
        positionalAudio.setVolume(0.7);
        positionalAudio.play();
        this._sounds.push(positionalAudio);
        analyser.smoothingTimeConstant = 0.9;
        this.analysers.push(analyser);
        if (i === this.mapping.length - 1) {
          allLoaded = true;
          console.log("all loaded");
        }
      });
    });
  }

  _setupMaterialSphere() {
    const geometry = new THREE.SphereGeometry(0.05, 32, 32);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x424242,
      roughness: 0.6,
      metalness: 0.7,
    });
    const sphere = new THREE.Mesh(geometry, material);
    this.scene.add(sphere);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    let exrCubeRenderTarget;
    pmremGenerator.compileEquirectangularShader();

    new EXRLoader()
      .setDataType(THREE.UnsignedByteType)
      .load(
        "/assets/textures/abandoned_factory_canteen_01_1k.exr",
        function (texture) {
          exrCubeRenderTarget = pmremGenerator.fromEquirectangular(texture);
          sphere.material.envMap = exrCubeRenderTarget.texture;
          texture.dispose();
        }
      );
  }

  _mapFeelings() {
    let feelingColor = 0x2b13ff;
    if (this.colors.length > 0) {
      const randomColorVec = this.colors[randomIndex(this.colors.length)];
      const randomColor = new THREE.Color(
        randomColorVec.x / 3.0,
        randomColorVec.y / 3.0,
        randomColorVec.z / 3.0
      );
      feelingColor = randomColor;
    }
    const feelingCurves = [];
    const feelingsGroup = new THREE.Group();
    const feelingSpheres = [];
    var bezierMaterial = new THREE.LineBasicMaterial({ color: feelingColor });
    var feelingMaterial = new THREE.MeshPhysicalMaterial({
      color: feelingColor,
      side: THREE.DoubleSide,
      flatShading: false,
    });

    let shapeOffset = 0;
    this.feelingMappings.map((f, i) => {
      const point = f.feeling.point ? f.feeling.point : { x: 0, y: 0, z: 0 };
      const position = new THREE.Vector3(point.x, point.y, point.z);
      const sphereGeometry = new THREE.SphereBufferGeometry(0.26, 32, 32);
      const feelingSphere = new THREE.Mesh(sphereGeometry, feelingMaterial);
      feelingSphere.scale.set(0.15, 0.15, 0.15);
      feelingSphere.position.copy(position);
      // totem.add(feelingSphere);
      feelingSpheres.push(feelingSphere);
      var curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, -1, 0),
        position,
        new THREE.Vector3(0, 1, 0)
      );
      feelingCurves.push(curve);
      var points = curve.getPoints(40);
      var bezierGeometry = new THREE.BufferGeometry().setFromPoints(points);
      // Create the final object to add to the scene
      var bezierObject = new THREE.Line(bezierGeometry, bezierMaterial);
      feelingsGroup.add(bezierObject);
      shapeOffset++;
    });
    // totem.add(feelingsGroup);
    console.log("Shape Offset", shapeOffset);
  }

  _mapShapes() {
    let colorOffset = 0;
    var shapeMaterial = new THREE.MeshLambertMaterial({ color: 0xcfddec });
    const shapeGroup = new THREE.Group();
    const radius = 0.5;
    this.shapeMappings.map((s, i) => {
      colorOffset++;
      const yStep = i / this.shapeMappings.length - 0.5;
      const position = new THREE.Vector3(
        radius * Math.sin(Math.random() * 3.1415 * 2.0),
        yStep,
        radius * Math.cos(Math.random() * 3.1415 * 2.0)
      );
      switch (s.shape) {
        case "Zylinder":
          var cylinderGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 32);
          var cylinder = new THREE.Mesh(
            cylinderGeometry,
            shapeMaterial.clone()
          );
          cylinder.scale.set(0.2, 0.2, 0.2);
          cylinder.position.copy(position);
          cylinder.lookAt(new THREE.Vector3(0, 0, 0));
          cylinder.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2.0);
          shapeGroup.add(cylinder);
          break;

        case "Würfel":
          const cubeGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
          const cube = new THREE.Mesh(cubeGeometry, shapeMaterial.clone());
          cube.scale.set(0.2, 0.2, 0.2);
          cube.position.copy(position);
          cube.lookAt(new THREE.Vector3(0, 0, 0));
          cube.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2.0);
          shapeGroup.add(cube);
          break;

        case "Kugel":
          const sphereGeometry = new THREE.SphereBufferGeometry(0.26, 32, 32);
          const sphere = new THREE.Mesh(sphereGeometry, shapeMaterial.clone());
          sphere.scale.set(0.15, 0.15, 0.15);
          sphere.position.copy(position);
          shapeGroup.add(sphere);
          break;

        case "Kegel":
          const coneGeometry = new THREE.ConeGeometry(0.2, 0.5, 30);
          const cone = new THREE.Mesh(coneGeometry, shapeMaterial.clone());
          cone.scale.set(0.2, 0.2, 0.2);
          cone.position.copy(position);
          cone.lookAt(new THREE.Vector3(0, 0, 0));
          cone.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2.0);
          shapeGroup.add(cone);
          break;

        case "Ikosaeder":
          var icosahedronGeometry = new THREE.IcosahedronGeometry(0.25, 0);
          var icosahedron = new THREE.Mesh(
            icosahedronGeometry,
            shapeMaterial.clone()
          );
          icosahedron.scale.set(0.2, 0.2, 0.2);
          icosahedron.position.copy(position);
          icosahedron.lookAt(new THREE.Vector3(0, 0, 0));
          icosahedron.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2.0);
          shapeGroup.add(icosahedron);
          break;

        case "Oktaeder":
          var octahedronGeometry = new THREE.OctahedronGeometry(0.25, 0);
          var octahedron = new THREE.Mesh(
            octahedronGeometry,
            shapeMaterial.clone()
          );
          octahedron.position.copy(position);
          octahedron.scale.set(0.2, 0.2, 0.2);
          octahedron.lookAt(new THREE.Vector3(0, 0, 0));
          octahedron.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2.0);
          shapeGroup.add(octahedron);
          break;
      }
      // Line
      const points = [];
      const dirVector = new THREE.Vector3().sub(position);
      dirVector.normalize();
      points.push(dirVector.multiplyScalar(-0.15));
      points.push(position.clone().multiplyScalar(0.9));
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      //totem.add(line);
    });
    // totem.add(shapeGroup);
    console.log("Color Offset", colorOffset);
  }

  _mapColors() {
    this.colorMappings.map((c, i) => {});
    const numSides = 4;
    const subdivisions = 50;
    const tubeGeometry = createLineGeometry(numSides, subdivisions);
    const instTubeMaterial = this.tubeMaterial.clone();
    instTubeMaterial.uniforms.uPoints.value = [
      new THREE.Vector3(0, -0.5, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, +0.5, 0),
    ];
    this.tubeMesh = new THREE.Mesh(tubeGeometry, instTubeMaterial);
    this.tubeMesh.frustumCulled = false;
    this.totem.add(this.tubeMesh);
  }

  _raycastLoop() {
    this._raycaster.setFromCamera(this._mousePosition, this.camera);
    if (this._state === "shape-input") {
      this._hit = this._raycaster.intersectObjects(
        this.shapeMapper.raycastables
      );
      this.shapeMapper.handleRaycast(this._hit);
    }
    if (this._state === "color-input") {
      this._hit = this._raycaster.intersectObjects(
        this.colorInput.raycastables
      );
      this.colorInput.handleRaycast(this._hit, this.camera.position);
    }
    if (this._state === "feeling-input") {
      this._hit = this._raycaster.intersectObjects(
        this.feelingMapper.raycastables
      );
      this.feelingMapper.handleRaycast(this._hit, this.camera.position);
    }
  }

  _renderLoop() {
    TWEEN.update();
    this.deltaTime = this.clock.getDelta();
    this.time += this.deltaTime;

    this.renderer.clear();
    this.renderer.render(this.backgroundPlane, this.backgroundCamera);

    this._raycastLoop();

    if (this._state === "color-input") {
      this.colorInput.update(this.deltaTime, {
        cameraPosition: this.camera.position,
      });
      this.renderer.render(this.colorInput.scene, this.camera);
    }
    if (this._state === "shape-input") {
      this.shapeMapper.update(this.deltaTime);
      this.renderer.render(this.shapeMapper.scene, this.camera);
    }
    if (this._state === "feeling-input") {
      this.feelingMapper.update(this.deltaTime);
      this.renderer.render(this.feelingMapper.scene, this.camera);
    }

    if (this._state === "totem") {
      this.renderer.render(this.scene, this.camera);
    }

    // Analyzers
    /*
      let analyzerValues = analysers.map((analyser, i) => {
        var data = analyser.getAverageFrequency();
        const val = remap(data, 0.0, 127.0, 0.1, 0.5);
        const valNorm = remap(data, 0.0, 127.0, 0.0, 1.0);
        return valNorm;
      });
      if (analyzerValues.length > 0) {
        tubeMesh.material.uniforms.uAnalysers.value = analyzerValues;
        tubeMesh.material.uniforms.uAnalyserOffset.value =
          shapeOffset + colorOffset;
      }

      shapeGroup.children.forEach((obj, i) => {
        if (analysers[shapeOffset + i]) {
          var data = analysers[shapeOffset + i].getAverageFrequency();
          const val = remap(data, 0.0, 127.0, 0.1, 0.5);
          obj.scale.set(val, val, val);
          obj.material.color = shapeMaterial.color
            .clone()
            .multiplyScalar(val * 1.0);
        }
      });

      feelingsGroup.children.forEach((curveObj, i) => {
        if (analysers[i]) {
          var data = analysers[i].getAverageFrequency();
          const val = remap(data, 0.0, 127.0, 0.1, 0.5);
          var curve = feelingCurves[i];
          var newCenter = curve.getPointAt(0.5).multiplyScalar(val * 10);
          var newCurve = new THREE.QuadraticBezierCurve3(
            curve.getPointAt(0.3),
            newCenter,
            curve.getPointAt(0.7)
          );
          feelingSpheres[i].position.copy(newCenter);
          // Update vertices
          var points = newCurve.getPoints(40);
          curveObj.geometry = new THREE.BufferGeometry().setFromPoints(points);
          curveObj.geometry.verticesNeedUpdate = true;
          curveObj.geometry.attributes.position.needsUpdate = true;
        }
      });
      */
    this.tubeMesh.material.uniforms.uTime.value = this.time;

    if (this.stats) {
      this.stats.update();
    }
  }
}

export default ({ mapping, onResize, paused, state, onSelect }) => {
  const canvasRef = useRef();
  const canvasWrapperRef = useRef();
  const [sounds, setSounds] = useState([]);
  const [renderer, setRenderer] = useState(null);
  const [renderLoop, setRenderLoop] = useState(null);
  const [playingStates, setPlayingStates] = useState([]);
  const [totem, setTotem] = useState(null);

  const prepareDownload = (imageData) => {
    const downloadLink = document.createElement("a");
    const dataStr = imageData;
    downloadLink.href = dataStr;
    downloadLink.download = `${md5(Date.now())}.png`;
    document.body.append(downloadLink);
    downloadLink.click();
  };

  useEffect(() => {
    if (paused && totem) {
      console.log("pause");
      totem.pause();
    }
    if (!paused && totem) {
      console.log("contiune");
      totem.continue();
    }
  }, [paused]);

  useEffect(() => {
    console.log("STATE", state);
    if (totem) {
      totem.setState(state);
    }
  }, [state]);

  useEffect(() => {
    if (canvasRef.current) {
      const totem = new Totem(canvasRef.current, mapping, onSelect);
      const resizeHandler = window.addEventListener(
        "resize",
        totem.handleResize.bind(totem),
        false
      );
      const pointerUpHandler = window.addEventListener(
        "pointerup",
        totem.handlePointerUp.bind(totem),
        false
      );
      const pointerDownHandler = window.addEventListener(
        "pointerdown",
        totem.handlePointerDown.bind(totem),
        false
      );
      const pointerMoveHandler = window.addEventListener(
        "pointermove",
        totem.handlePointerMove.bind(totem),
        false
      );
      setTotem(totem);
    }

    return () => {
      // @TODO dispose totem
    };
  }, []);

  return (
    <div className="totem">
      {process.env.NODE_ENV === "development" ? (
        <div className="sounds-ui">
          {/* {sounds.map((s, i) => { */}
          {/*   return ( */}
          {/*     <span */}
          {/*       key={i} */}
          {/*       className={[ */}
          {/*         "sound-ui", */}
          {/*         playingStates[i] ? "active" : "inactive", */}
          {/*       ].join(" ")} */}
          {/*       onClick={() => { */}
          {/*         s.isPlaying ? s.stop() : s.play(); */}
          {/*         setPlayingStates(sounds.map((s) => s.isPlaying)); */}
          {/*       }} */}
          {/*     > */}
          {/*       Sound {i} */}
          {/*     </span> */}
          {/*   ); */}
          {/* })} */}
        </div>
      ) : (
        <></>
      )}

      <div className="canvas-wrapper" ref={canvasWrapperRef}>
        <canvas ref={canvasRef}></canvas>
      </div>

      {/* <ButtonDownloadRendering */}
      {/*   prepareDownload={prepareDownload} */}
      {/*   canvasRef={canvasRef.current} */}
      {/* /> */}

      {/* <div className="interaction-explanation"> */}
      {/*   <IconMouse /> */}
      {/*   <article className="text"> */}
      {/*     Klick und ziehen zum Drehen Mausrad für Zoom */}
      {/*   </article> */}
      {/* </div> */}
    </div>
  );
};
