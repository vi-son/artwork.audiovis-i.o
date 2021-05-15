// node_modules imports
import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
import md5 from "blueimp-md5";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { PositionalAudioHelper } from "three/examples/jsm/helpers/PositionalAudioHelper.js";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import * as dat from "dat.gui";
import { utils } from "@vi.son/components";
const { mobileCheck } = utils;
// Local imports
import totemLogic, { TOTEM_STATES } from "./logic.totem.js";
import createLineGeometry from "../utils/createLineGeometry.js";
import { remap, randomIndex } from "../utils/math.js";
import Mapper from "./Mapper.js";
import ColorMapper from "./color/ColorMapper.js";
import ShapeMapper from "./shape/ShapeMapper.js";
import FeelingMapper from "./feeling/FeelingMapper.js";
// SVG imports
import IconMouse from "../../../assets/svg/mouse.svg";
// GLSL imports
import basicVertexShader from "../../glsl/basic.vert.glsl";
import audioDataFragmentShader from "../../glsl/audiodata.frag.glsl";
import tubeVertexShader from "../../glsl/tubes.vert.glsl";
import tubeFragmentShader from "../../glsl/tubes.frag.glsl";
import backgroundVertexShader from "../../glsl/background.vert.glsl";
import backgroundFragmentShader from "../../glsl/background.frag.glsl";

class Totem extends THREE.Group {
  constructor(canvas) {
    super();

    this._isMobile = mobileCheck();
    this._canvas = canvas;
    this._exporter = new GLTFExporter();
    this._paused = false;
    this._allLoaded = false;

    // Render Targets
    this._audioDataRT = new THREE.WebGLRenderTarget(10, 32, {
      type: THREE.FloatType,
    });
    this._offscreenScene = new THREE.Scene();
    const planeGeometry = new THREE.PlaneGeometry(2, 2);
    this._audioDataMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uAverageFrequencies: { value: [] },
        uFrequenciesA: { value: [] },
        uFrequenciesB: { value: [] },
        uFrequenciesC: { value: [] },
        uFrequenciesD: { value: [] },
        uFrequenciesE: { value: [] },
      },
      vertexShader: basicVertexShader,
      fragmentShader: audioDataFragmentShader,
    });
    this._fullscreenQuad = new THREE.Mesh(
      planeGeometry,
      this._audioDataMaterial
    );
    this._offscreenScene.add(this._fullscreenQuad);

    // Scene elements
    this.deltatime = 0;
    this.time = 0;
    this.clock = new THREE.Clock();
    this.clock.start();

    this._setupScene(canvas);
    this._setupBackground();
    this._setupRaycasting();

    this.colorInput = new ColorMapper();
    this.shapeMapper = new ShapeMapper();
    this.feelingMapper = new FeelingMapper();

    // Event handler
    const resizeHandler = window.addEventListener(
      "resize",
      this.handleResize.bind(this),
      false
    );
    const pointerUpHandler = window.addEventListener(
      "pointerup",
      this.handlePointerUp.bind(this),
      false
    );
    const pointerDownHandler = window.addEventListener(
      "pointerdown",
      this.handlePointerDown.bind(this),
      false
    );
    const pointerMoveHandler = window.addEventListener(
      "pointermove",
      this.handlePointerMove.bind(this),
      false
    );

    // Stats
    if (process.env.NODE_ENV === "development") {
      this.stats = new Stats();
      this.stats.dom.className = "stats";
      document.body.appendChild(this.stats.dom);
    }

    // Loading infrastructure
    this._samplesFolder = `/assets/audio/samples/`;
  }

  pause() {
    this.renderer.setAnimationLoop(null);
    this.clock.stop();
    totemLogic.actions.updateSamples(
      totemLogic.values.sounds.map((s) => {
        s.setVolume(0.0);
        return s;
      })
    );
    this._paused = true;
  }

  continue() {
    this.renderer.setAnimationLoop(this._renderLoop.bind(this));
    this.clock.start();
    totemLogic.actions.updateSamples(
      totemLogic.values.sounds.map((s) => {
        s.setVolume(1.0);
        return s;
      })
    );
    this._paused = false;
  }

  _resetBackground() {
    this.backgroundMaterial.uniforms.uColor.value = new THREE.Color(
      `rgb(144, 150, 154)`
    );
  }

  dispose() {
    console.log("Dispose Totem");
    while (this.totem.children.length > 0) {
      this.totem.remove(this.totem.children.slice(-1).pop());
    }
    totemLogic.values.sounds.map((s) => {
      s.pause();
    });
    totemLogic.actions.clearSamples();
    totemLogic.actions.clearMappings();
    this.analysers = new Array();
  }

  reactOnMappings() {
    console.log("Mappings: ", Object.values(totemLogic.values.mappings));
    const mappingsArray = Object.values(totemLogic.values.mappings);
    console.log("Sounds: ", totemLogic.values.sounds);
    // Mappings
    this._loadSounds(mappingsArray);
    this._setupMappings(mappingsArray);
    this._setupTube(mappingsArray);
    this._mapFeelings(mappingsArray);
    this._mapShapes(mappingsArray);
    this._mapColors(mappingsArray);
    this._allLoaded = true;
  }

  reactOnStateChange() {
    switch (totemLogic.values.state) {
      case TOTEM_STATES.SHAPE_MAPPING:
        this.controls.reset();
        this.shapeMapper.fadeIn();
        break;

      case TOTEM_STATES.FEELING_MAPPING:
        this.controls.reset();
        this.feelingMapper.fadeIn();
        break;

      case TOTEM_STATES.COLOR_MAPPING:
        this.controls.reset();
        this.colorInput.fadeIn();
        break;

      case TOTEM_STATES.TOTEM:
        this._resetBackground();
        this.reactOnMappings();
        this.controls.reset();
        break;
    }
  }

  _setupRaycasting() {
    this._raycaster = new THREE.Raycaster();
    this._hit = [];
    this._screenPosition = new THREE.Vector3();
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

  _setupMappings(mappingsArray) {
    this.colorMappings = mappingsArray
      .filter((m) => m.type === "color")
      .map((m, i) => {
        return {
          index: i,
          color: m.mapping,
          sample: m.sample,
        };
      });

    this.colors = this.colorMappings.map(
      (cm) =>
        new THREE.Vector3(
          cm.color[0] / 255.0,
          cm.color[1] / 255.0,
          cm.color[2] / 255.0
        )
    );

    this.shapeMappings = mappingsArray
      .filter((m) => m.type === "shape")
      .map((m, i) => {
        return {
          index: i,
          shape: m.mapping,
        };
      });

    this.feelingMappings = mappingsArray
      .filter((m) => m.type === "feeling")
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

  _setupTube(mappingsArray) {
    const colorToUniformsArray = new Array(mappingsArray.length)
      .fill(0)
      .map((_, i) => {
        if (this.colors[i]) {
          return this.colors[i];
        } else {
          return new THREE.Vector3();
        }
      });
    const numSides = 3;
    const subdivisions = 30;
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
          value: new Array(mappingsArray.length).fill(0),
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
        uAudioDataTexture: {
          value: this._audioDataRT.texture,
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
      preserveDrawingBuffer: true,
      toneMapping: THREE.ACESFilmicToneMapping,
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
    this.camera.position.set(0, 0.0, 4.0);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.update();
    this.controls.target.set(0, this._isMobile ? 0.125 : 0, 0);
    this.controls.enableZoom = true;
    this.controls.enablePan = false;
    this.controls.enableDamping = false;
    this.controls.dampingFactor = 0.1;
    this.controls.saveState();
    this.controls.addEventListener("change", () => {
      if (this._paused) {
        this.update();
      }
    });

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
    this._mousePosition.x =
      ((e.clientX - this.size.x) / this.size.width) * 2 - 1;
    this._mousePosition.y =
      -((e.clientY - this.size.y) / this.size.height) * 2 + 1;
    switch (totemLogic.values.state) {
      case TOTEM_STATES.SHAPE_MAPPING:
        this.shapeMapper.handlePointerMove(e, { size: this.size });
        break;
      case TOTEM_STATES.COLOR_MAPPING:
        this.colorInput.handlePointerMove(e, { size: this.size });
        break;
      case TOTEM_STATES.FEELING_MAPPING:
        this.feelingMapper.handlePointerMove(e, { size: this.size });
        break;
    }
  }

  handlePointerDown(e) {
    switch (totemLogic.values.state) {
      case TOTEM_STATES.SHAPE_MAPPING:
        this.shapeMapper.handlePointerDown(e);
        break;
      case TOTEM_STATES.COLOR_MAPPING:
        this.colorInput.handlePointerDown(e);
        break;
      case TOTEM_STATES.FEELING_MAPPING:
        this.feelingMapper.handlePointerDown(e);
        break;
    }
  }

  export() {
    this._exporter.parse(this.scene, (gltf) => {
      console.log(gltf);
      const downloadLink = document.createElement("a");
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(gltf));
      downloadLink.href = dataStr;
      downloadLink.download = `${md5(
        JSON.stringify(totemLogic.values.mappings)
      )}.gltf`;
      document.body.append(downloadLink);
      downloadLink.click();
    });
  }

  handlePointerUp(e) {
    switch (totemLogic.values.state) {
      case TOTEM_STATES.SHAPE_MAPPING:
        this.shapeMapper.handlePointerUp(e);
        break;
      case TOTEM_STATES.COLOR_MAPPING:
        this.colorInput.handlePointerUp(e, {
          camera: this.camera,
          controls: this.controls,
        });
        break;
      case TOTEM_STATES.FEELING_MAPPING:
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
      this.size = newSize;
      // Update renderer
      this.renderer.setSize(newSize.width, newSize.height);
    }
  }

  _loadSounds(mappingsArray) {
    // Show audio sources
    this.analysers = [];
    const audioVisualizerCubes = [];

    let audioCounter = 0;

    this._loadingManager = new THREE.LoadingManager();
    const audioLoader = new THREE.AudioLoader(this._loadingManager);

    mappingsArray.map((c, i) => {
      audioLoader.setPath(this._samplesFolder).load(
        c.sample,
        (buffer) => {
          const audio = new THREE.PositionalAudio(this.listener);
          audio.setBuffer(buffer);
          audio.setLoop(true);
          audio.setVolume(1.0);
          audio.name = c.sample;
          const analyser = new THREE.AudioAnalyser(audio, 32);
          analyser.smoothingTimeConstant = 0.9;
          this.analysers.push(analyser);
          // Save audio
          totemLogic.actions.addSample(audio);
          totemLogic.actions.addVolume(1.0);
          audioCounter++;
        },
        (xhr) => {},
        (err) => console.error("Error while loading sound ", err)
      );
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
    this.feelingCurves = [];
    this.feelingsGroup = new THREE.Group();
    this.feelingSpheres = [];
    var bezierMaterial = new THREE.LineBasicMaterial({ color: feelingColor });
    var feelingMaterial = new THREE.MeshPhysicalMaterial({
      color: feelingColor,
      side: THREE.DoubleSide,
      flatShading: false,
    });

    this.shapeOffset = 0;
    this.feelingMappings.map((f, i) => {
      const point = f.feeling.point ? f.feeling.point : { x: 0, y: 0, z: 0 };
      const position = new THREE.Vector3(point.x, point.y, point.z);
      const sphereGeometry = new THREE.SphereBufferGeometry(0.26, 32, 32);
      const feelingSphere = new THREE.Mesh(sphereGeometry, feelingMaterial);
      feelingSphere.scale.set(0.15, 0.15, 0.15);
      feelingSphere.position.copy(position);
      this.totem.add(feelingSphere);
      this.feelingSpheres.push(feelingSphere);
      var curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, -1, 0),
        position,
        new THREE.Vector3(0, 1, 0)
      );
      this.feelingCurves.push(curve);
      var points = curve.getPoints(40);
      var bezierGeometry = new THREE.BufferGeometry().setFromPoints(points);
      // Create the final object to add to the scene
      var bezierObject = new THREE.Line(bezierGeometry, bezierMaterial);
      this.feelingsGroup.add(bezierObject);
      this.shapeOffset++;
    });
    this.totem.add(this.feelingsGroup);
    console.log("Shape Offset", this.shapeOffset);
  }

  _mapShapes() {
    this.colorOffset = 0;
    this.shapeMaterial = new THREE.MeshLambertMaterial({ color: 0xcfddec });
    this.shapeGroup = new THREE.Group();
    const radius = 0.5;
    this.shapeMappings.map((s, i) => {
      this.colorOffset++;
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
            this.shapeMaterial.clone()
          );
          cylinder.scale.set(0.2, 0.2, 0.2);
          cylinder.position.copy(position);
          cylinder.lookAt(new THREE.Vector3(0, 0, 0));
          cylinder.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2.0);
          this.shapeGroup.add(cylinder);
          break;

        case "Würfel":
          const cubeGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
          const cube = new THREE.Mesh(cubeGeometry, this.shapeMaterial.clone());
          cube.scale.set(0.2, 0.2, 0.2);
          cube.position.copy(position);
          cube.lookAt(new THREE.Vector3(0, 0, 0));
          cube.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2.0);
          this.shapeGroup.add(cube);
          break;

        case "Kugel":
          const sphereGeometry = new THREE.SphereBufferGeometry(0.26, 32, 32);
          const sphere = new THREE.Mesh(
            sphereGeometry,
            this.shapeMaterial.clone()
          );
          sphere.scale.set(0.15, 0.15, 0.15);
          sphere.position.copy(position);
          this.shapeGroup.add(sphere);
          break;

        case "Kegel":
          const coneGeometry = new THREE.ConeGeometry(0.2, 0.5, 30);
          const cone = new THREE.Mesh(coneGeometry, this.shapeMaterial.clone());
          cone.scale.set(0.2, 0.2, 0.2);
          cone.position.copy(position);
          cone.lookAt(new THREE.Vector3(0, 0, 0));
          cone.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2.0);
          this.shapeGroup.add(cone);
          break;

        case "Ikosaeder":
          var icosahedronGeometry = new THREE.IcosahedronGeometry(0.25, 0);
          var icosahedron = new THREE.Mesh(
            icosahedronGeometry,
            this.shapeMaterial.clone()
          );
          icosahedron.scale.set(0.2, 0.2, 0.2);
          icosahedron.position.copy(position);
          icosahedron.lookAt(new THREE.Vector3(0, 0, 0));
          icosahedron.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2.0);
          this.shapeGroup.add(icosahedron);
          break;

        case "Oktaeder":
          var octahedronGeometry = new THREE.OctahedronGeometry(0.25, 0);
          var octahedron = new THREE.Mesh(
            octahedronGeometry,
            this.shapeMaterial.clone()
          );
          octahedron.position.copy(position);
          octahedron.scale.set(0.2, 0.2, 0.2);
          octahedron.lookAt(new THREE.Vector3(0, 0, 0));
          octahedron.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2.0);
          this.shapeGroup.add(octahedron);
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
      this.totem.add(line);
    });
    this.totem.add(this.shapeGroup);
    console.log("Color Offset", this.colorOffset);
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

    switch (totemLogic.values.state) {
      case TOTEM_STATES.SHAPE_MAPPING:
        this._hit = this._raycaster.intersectObjects(
          this.shapeMapper.raycastables
        );
        this.shapeMapper.handleRaycast(this._hit);
        break;

      case TOTEM_STATES.COLOR_MAPPING:
        this._hit = this._raycaster.intersectObjects(
          this.colorInput.raycastables
        );
        this.colorInput.handleRaycast(this._hit, this.camera.position);
        break;

      case TOTEM_STATES.FEELING_MAPPING:
        this._hit = this._raycaster.intersectObjects(
          this.feelingMapper.raycastables
        );
        this.feelingMapper.handleRaycast(this._hit, this.camera.position);
        break;
    }

    if (this._hit.length > 0) {
      this._screenPosition = this._hit[0].point.clone().project(this.camera);

      this._screenPosition.x = this._screenPosition.x * this.size.width * 0.5;
      this._screenPosition.y = this._screenPosition.y * this.size.height * -0.5;
      this._screenPosition.z = 1.0;
      totemLogic.actions.updateScreenPosition(this._screenPosition);
    } else {
      this._screenPosition.z = 0.0;
      totemLogic.actions.updateScreenPosition(this._screenPosition);
    }
  }

  update() {
    this.renderer.clear();
    this.renderer.render(this.backgroundPlane, this.backgroundCamera);
    this.renderer.render(this.scene, this.camera);
  }

  _renderLoop() {
    TWEEN.update();
    this.deltaTime = this.clock.getDelta();
    this.time += this.deltaTime;

    this.renderer.clear();
    this.renderer.render(this.backgroundPlane, this.backgroundCamera);

    this._raycastLoop();

    if (totemLogic.values.state === TOTEM_STATES.COLOR_MAPPING) {
      this.colorInput.update(this.deltaTime, {
        cameraPosition: this.camera.position,
      });
      this.renderer.render(this.colorInput.scene, this.camera);
    }

    if (totemLogic.values.state === TOTEM_STATES.SHAPE_MAPPING) {
      this.shapeMapper.update(this.deltaTime);
      this.renderer.render(this.shapeMapper.scene, this.camera);
    }

    if (totemLogic.values.state === TOTEM_STATES.FEELING_MAPPING) {
      this.feelingMapper.update(this.deltaTime);
      this.renderer.render(this.feelingMapper.scene, this.camera);
    }

    if (totemLogic.values.state === TOTEM_STATES.TOTEM) {
      if (!this._allLoaded) return;
      // Analyzers
      if (this.analysers !== undefined) {
        let analyzerValues = this.analysers.map((analyser, i) => {
          var data = analyser.getAverageFrequency();
          const val = remap(data, 0.0, 127.0, 0.1, 0.5);
          const valNorm = remap(data, 0.0, 127.0, 0.0, 1.0);
          return valNorm;
        });
        if (analyzerValues.length > 0) {
          this._audioDataMaterial.uniforms.uAverageFrequencies.value = analyzerValues;
          this.tubeMesh.material.uniforms.uAnalysers.value = analyzerValues;
          this.tubeMesh.material.uniforms.uAnalyserOffset.value =
            this.shapeOffset + this.colorOffset;
        }

        if (this.shapeGroup) {
          this.shapeGroup.children.forEach((obj, i) => {
            if (this.analysers[this.shapeOffset + i]) {
              var data = this.analysers[
                this.shapeOffset + i
              ].getAverageFrequency();
              const val = remap(data, 0.0, 127.0, 0.1, 0.5);
              obj.scale.set(val, val, val);
              obj.material.color = this.shapeMaterial.color
                .clone()
                .multiplyScalar(val * 1.0);
            }
          });
        }

        if (this.feelingsGroup) {
          this.feelingsGroup.children.forEach((curveObj, i) => {
            if (this.analysers[i]) {
              const data = this.analysers[i].getAverageFrequency();
              const val = remap(data, 0.0, 127.0, 0.1, 0.5);
              const curve = this.feelingCurves[i];
              const newCenter = curve.getPointAt(0.5).multiplyScalar(val * 10);
              const newCurve = new THREE.QuadraticBezierCurve3(
                curve.getPointAt(0.3),
                newCenter,
                curve.getPointAt(0.7)
              );
              this.feelingSpheres[i].position.copy(newCenter);
              // Update vertices
              const points = newCurve.getPoints(40);
              curveObj.geometry = new THREE.BufferGeometry().setFromPoints(
                points
              );
              curveObj.geometry.verticesNeedUpdate = true;
              curveObj.geometry.attributes.position.needsUpdate = true;
            }
          });
        }

        if (this.tubeMesh) {
          this.tubeMesh.material.uniforms.uTime.value = this.time;
          this.tubeMesh.material.uniforms.uAudioDataTexture.value = this._audioDataRT.texture;
        }

        this.renderer.render(this.scene, this.camera);
      }
    }

    if (this.stats) {
      this.stats.update();
    }
  }
}

export default Totem;
