// node_modules imports
import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { PositionalAudioHelper } from "three/examples/jsm/helpers/PositionalAudioHelper.js";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import md5 from "blueimp-md5";
import Stats from "three/examples/jsm/libs/stats.module.js";
import * as dat from "dat.gui";
// Local imports
import createLineGeometry from "../utils/createLineGeometry.js";
// Style imports
import "../../sass/components/Totem.sass";
// SVG imports
import IconMouse from "../../../assets/svg/mouse.svg";
// GLSL imports
import tubeVertexShader from "../../glsl/tubes.vert.glsl";
import tubeFragmentShader from "../../glsl/tubes.frag.glsl";
import backgroundVertexShader from "../../glsl/background.vert.glsl";
import backgroundFragmentShader from "../../glsl/background.frag.glsl";

const remap = (v, a, b, c, d) => {
  const newval = ((v - a) / (b - a)) * (d - c) + c;
  return newval;
};

export default ({ mapping, onResize }) => {
  const canvasRef = useRef();
  const canvasWrapperRef = useRef();
  const [sounds, setSounds] = useState([]);
  const [playingStates, setPlayingStates] = useState([]);

  const getRandomIdx = count => {
    return Math.floor(Math.random(), count);
  };

  const prepareDownload = imageData => {
    const downloadLink = document.createElement("a");
    const dataStr = imageData;
    downloadLink.href = dataStr;
    downloadLink.download = `${md5(Date.now())}.png`;
    document.body.append(downloadLink);
    downloadLink.click();
  };

  const colorMappings = mapping
    .filter(m => m.type === "Farbe")
    .map((m, i) => {
      return {
        index: i,
        color: m.mapping,
        sample: m.sample
      };
    });

  const shapeMappings = mapping
    .filter(m => m.type === "Form")
    .map((m, i) => {
      return {
        index: i,
        shape: m.mapping
      };
    });

  const feelingMappings = mapping
    .filter(m => m.type === "Gefühl")
    .map((m, i) => {
      return {
        index: i,
        feeling: m.mapping,
        sample: m.sample
      };
    });

  let stats;
  if (process.env.NODE_ENV === "development") {
    console.log(`# Color Mappings: ${colorMappings.length}`);
    console.log(`# Shape Mappings: ${shapeMappings.length}`);
    console.log(`# Feeling Mappings: ${feelingMappings.length}`);
    // Stats
    stats = new Stats();
    document.body.appendChild(stats.dom);
    // Gui
    const gui = new dat.GUI();
  }

  useEffect(() => {
    // Size
    const size = canvasWrapperRef.current.getBoundingClientRect();

    // Scene
    const scene = new THREE.Scene();
    const totem = new THREE.Group();
    scene.add(totem);
    totem.position.set(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: 1,
      // alpha: true,
      preserveDrawingBuffer: true,
      toneMapping: THREE.ACESFilmicToneMapping
    });
    renderer.setSize(size.width + 300, size.height);

    // Camera
    var camera = new THREE.PerspectiveCamera(
      45,
      (size.width + 300) / size.height,
      0.01,
      1000
    );
    var controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 3.0, 0);
    controls.update();
    console.log(controls);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.2;
    // Audio listener
    const analysers = [];
    const listener = new THREE.AudioListener();
    camera.add(listener);
    const samplesFolder = `/assets/audio/audiovisio/`;

    // Light
    var light = new THREE.HemisphereLight(0xffffff, 0x666666, 3.75);
    light.position.set(0, 10, 0);

    scene.add(light);

    const geometry = new THREE.SphereGeometry(0.05, 32, 32);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x424242,
      roughness: 0.6,
      metalness: 0.7
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    let exrCubeRenderTarget;
    pmremGenerator.compileEquirectangularShader();

    new EXRLoader()
      .setDataType(THREE.UnsignedByteType)
      .load("/assets/textures/abandoned_factory_canteen_01_1k.exr", function(
        texture
      ) {
        exrCubeRenderTarget = pmremGenerator.fromEquirectangular(texture);
        // scene.background = exrCubeRenderTarget.texture;
        sphere.material.envMap = exrCubeRenderTarget.texture;
        texture.dispose();
      });

    // Tube material
    const colors = colorMappings.map(
      cm =>
        new THREE.Vector3(
          cm.color[0] / 255.0,
          cm.color[1] / 255.0,
          cm.color[2] / 255.0
        )
    );
    const colorToUniformsArray = new Array(mapping.length)
      .fill(0)
      .map((_, i) => {
        if (colors[i]) {
          return colors[i];
        } else {
          return new THREE.Vector3();
        }
      });
    const numSides = 4;
    const subdivisions = 50;
    const tubeMaterial = new THREE.RawShaderMaterial({
      vertexShader: tubeVertexShader,
      fragmentShader: tubeFragmentShader,
      side: THREE.FrontSide,
      extensions: {
        deriviatives: true
      },
      defines: {
        lengthSegments: subdivisions.toFixed(1),
        FLAT_SHADED: false
      },
      uniforms: {
        uResolution: {
          type: "vec2",
          value: new THREE.Vector2(size.width, size.height)
        },
        uThickness: { type: "f", value: 0.02 },
        uTime: { type: "f", value: 2.5 },
        uColors: {
          type: "a",
          value: colorToUniformsArray
        },
        uAnalysers: {
          type: "a",
          value: new Array(mapping.length).fill(0)
        },
        uAnalyserOffset: {
          type: "i",
          value: 0
        },
        uRadialSegments: { type: "f", value: numSides },
        uStopCount: { type: "i", value: colorMappings.length },
        uPoints: {
          type: "a",
          value: [
            new THREE.Vector3(0, -3, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 3, 0)
          ]
        }
      }
    });

    // Audio
    const audioLoader = new THREE.AudioLoader();
    // Show audio sources
    const audioVisualizerCubes = [];
    let allLoaded = false;
    const threeSounds = [];
    mapping.map((c, i) => {
      const sampleFilepath = `${samplesFolder}${c.sample}`;
      const positionalAudio = new THREE.PositionalAudio(listener);
      const analyser = new THREE.AudioAnalyser(positionalAudio, 32);
      audioLoader.load(sampleFilepath, function(buffer) {
        positionalAudio.setBuffer(buffer);
        positionalAudio.setLoop(true);
        positionalAudio.setVolume(0.7);
        positionalAudio.play();
        setSounds(sounds => [...sounds, positionalAudio]);
        threeSounds.push(positionalAudio);
        setPlayingStates(sounds.map(s => s.isPlaying));
        analyser.smoothingTimeConstant = 0.9;
        analysers.push(analyser);
        if (i === mapping.length - 1) {
          allLoaded = true;
          console.log("all loaded");
        }
      });
      // var geometry = new THREE.BoxBufferGeometry(0.5, 0.5, 0.5);
      // var material = new THREE.MeshBasicMaterial({
      //   color: 0xffffff,
      //   opacity: 0,
      //   transparent: true
      // });
      // var cube = new THREE.Mesh(geometry, material);
      // cube.position.set(0, i / (colorMappings.length - 1) - 0.5, 0);
      // audioVisualizerCubes.push(cube);
      // var helper = new PositionalAudioHelper(positionalAudio);
      // positionalAudio.add(helper);
      // cube.add(positionalAudio);
    });

    //// FEELING MAPPING TOTEM
    let feelingColor = 0x2b13ff;
    if (colors.length > 0) {
      const randomColorVec = colors[getRandomIdx(colors.length)];
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
      flatShading: false
    });

    let shapeOffset = 0;
    feelingMappings.map((f, i) => {
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

    //// SHAPE MAPPING TOTEM
    let colorOffset = 0;
    var shapeMaterial = new THREE.MeshLambertMaterial({ color: 0xcfddec });
    const shapeGroup = new THREE.Group();
    const radius = 0.5;
    shapeMappings.map((s, i) => {
      colorOffset++;
      const yStep = i / shapeMappings.length - 0.5;
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

    //// COLOR MAPPING TOTEM
    colorMappings.map((c, i) => {});

    const tubeGeometry = createLineGeometry(numSides, subdivisions);
    const instTubeMaterial = tubeMaterial.clone();
    instTubeMaterial.uniforms.uPoints.value = [
      new THREE.Vector3(0, -0.5, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, +0.5, 0)
    ];
    const tubeMesh = new THREE.Mesh(tubeGeometry, instTubeMaterial);
    tubeMesh.frustumCulled = false;
    totem.add(tubeMesh);

    // Clock + timings
    var clock = new THREE.Clock();
    clock.start();
    let time = 0.0;

    // Background
    var backgroundCamera = new THREE.OrthographicCamera(
      -2 / size.width,
      +2 / size.width,
      +2 / size.width,
      -2 / size.width,
      -1,
      100
    );
    const backgroundScene = new THREE.Scene();
    const backgroundMaterial = new THREE.ShaderMaterial({
      vertexShader: backgroundVertexShader,
      fragmentShader: backgroundFragmentShader,
      uniforms: {
        uResolution: { value: new THREE.Vector2(size.width, size.height) }
      },
      depthWrite: false
    });
    var planeGeometry = new THREE.PlaneGeometry(2, 2);
    var backgroundPlane = new THREE.Mesh(planeGeometry, backgroundMaterial);
    backgroundScene.add(backgroundPlane);
    renderer.autoClear = false;

    function onWindowResize() {
      if (canvasWrapperRef.current) {
        let newSize = canvasWrapperRef.current.getBoundingClientRect();
        camera.aspect = (newSize.width + 300) / newSize.height;
        camera.updateProjectionMatrix();
        backgroundCamera.aspect = newSize.width / newSize.height;
        backgroundCamera.updateProjectionMatrix();
        renderer.setSize(newSize.width, newSize.height);
      }
    }
    const resizeHandler = window.addEventListener(
      "resize",
      onWindowResize,
      false
    );

    function onPointerUp() {
      // if (allLoaded) {
      //   for (let i = 0; i < sounds.length; i++) {
      //     sounds[i].play();
      //   }
      //   allLoaded = false;
      // }
    }
    const pointerUpHandler = window.addEventListener(
      "pointerup",
      onPointerUp,
      false
    );

    // Render loop
    let frameCount = 0;
    let $dt = 0;
    var render = function() {
      requestAnimationFrame(render);

      if (!allLoaded) return;
      time = clock.getElapsedTime();
      $dt = clock.getDelta();

      renderer.clear();
      renderer.render(backgroundPlane, backgroundCamera);
      renderer.render(scene, camera);
      stats.update();

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
      tubeMesh.material.uniforms.uTime.value = time;
      frameCount++;
    };
    render();

    return () => {
      threeSounds.forEach(s => {
        s.stop();
      });
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }
      renderer.dispose();
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  return (
    <div className="totem">
      {process.env.NODE_ENV === "development" ? (
        <div className="sounds-ui">
          {sounds.map((s, i) => {
            return (
              <span
                key={i}
                className={[
                  "sound-ui",
                  playingStates[i] ? "active" : "inactive"
                ].join(" ")}
                onClick={() => {
                  s.isPlaying ? s.stop() : s.play();
                  setPlayingStates(sounds.map(s => s.isPlaying));
                }}
              >
                Sound {i}
              </span>
            );
          })}
        </div>
      ) : (
        <></>
      )}

      <div className="canvas-wrapper" ref={canvasWrapperRef}>
        <canvas ref={canvasRef}></canvas>
      </div>
      <button
        className="download-rendering"
        onClick={() => {
          var rendering = canvasRef.current.toDataURL();
          prepareDownload(rendering);
        }}
      >
        <span className="text">Schnappschuss</span>
        <span className="emoji">📷</span>
      </button>
      <div className="interaction-explanation">
        <IconMouse />
        <article className="text">
          Klick und ziehen zum Drehen Mausrad für Zoom
        </article>
      </div>
    </div>
  );
};
