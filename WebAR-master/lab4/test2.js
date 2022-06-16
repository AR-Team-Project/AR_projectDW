// see: https://discourse.threejs.org/t/example-of-how-to-use-ccdiksolver-with-a-generic-skinnedmesh/9571/12
// https://codesandbox.io/s/romantic-rubin-n0df6?file=/src/index.js:0-6355
import "./styles.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CCDIKSolver } from "three/examples/jsm/animation/CCDIKSolver.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

import CCDIKHelper from "./CCDIKHelper";

console.clear();
window.THREE = THREE;

let gui;

let container;
let camera, scene, renderer;

let mesh, skeletonHelper;
let IKSolver;

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  gui = new GUI();

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    200
  );
  camera.position.z = 30;
  camera.position.y = 30;

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  renderer = window.renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  container.appendChild(renderer.domElement);

  const gridHelper = new THREE.GridHelper(10, 10);
  scene.add(gridHelper);

  let controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 1;
  controls.maxDistance = 10500;

  window.addEventListener("resize", onWindowResize);
  onWindowResize();

  renderer.setAnimationLoop(render);
}
init();

function onWindowResize() {
  renderer.setPixelRatio(window.devicePixelRatio);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function render(timestamp, frame) {
  IKSolver?.update();

  renderer.render(scene, camera);
}

//
// thenInit ---------
//

function thenInit() {
  const segmentHeight = 8;
  const segmentCount = 3;
  const height = segmentHeight * segmentCount;
  const halfHeight = height * 0.5;

  const sizing = {
    segmentHeight,
    segmentCount,
    height,
    halfHeight
  };

  function createGeometry() {
    const geometry = new THREE.CylinderGeometry(
      5, // radiusTop
      5, // radiusBottom
      sizing.height, // height
      8, // radiusSegments
      sizing.segmentCount * 1, // heightSegments
      true // openEnded
    );

    const position = geometry.attributes.position;

    const vertex = new THREE.Vector3();

    //
    // skin weights/indices
    //
    // see https://github.com/mrdoob/three.js/pull/7719/files
    const skinIndices = [];
    const skinWeights = [];

    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position, i);
      // console.log("v", vertex);

      const y = vertex.y + sizing.halfHeight;

      const skinIndex = Math.floor(y / sizing.segmentHeight);
      const skinWeight = (y % sizing.segmentHeight) / sizing.segmentHeight;

      skinIndices.push(skinIndex, skinIndex + 1, 0, 0);
      skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
    }

    geometry.setAttribute(
      "skinIndex",
      new THREE.Uint16BufferAttribute(skinIndices, 4)
    );
    geometry.setAttribute(
      "skinWeight",
      new THREE.Float32BufferAttribute(skinWeights, 4)
    );

    return geometry;
  }

  function createBones() {
    const bones = [];

    // "root bone"
    let rootBone = new THREE.Bone();
    rootBone.name = "root bone";
    rootBone.position.y = -sizing.halfHeight;
    bones.push(rootBone);

    //
    // "Bone0", "Bone1", "Bone2", "Bone3"
    //

    let prevBone = new THREE.Bone();
    prevBone.name = "bone0";
    prevBone.position.y = 0; // relative to parent: rootBone
    rootBone.add(prevBone);
    bones.push(prevBone);

    for (let i = 1; i <= sizing.segmentCount; i++) {
      const bone = new THREE.Bone();
      bone.position.y = sizing.segmentHeight; // relative to parent: prevBone
      bones.push(bone);
      bone.name = `bone${i}`;
      prevBone.add(bone);
      prevBone = bone;
    }

    // "target bone"
    const targetBone = new THREE.Bone();
    targetBone.name = "target bone";
    targetBone.position.y = 2.5 * sizing.halfHeight; // relative to parent: rootBone
    rootBone.add(targetBone);
    bones.push(targetBone);

    return bones;
  }

  function createMesh(geometry, bones) {
    const material = new THREE.MeshPhongMaterial({
      color: 0x156289,
      emissive: 0x072534,
      side: THREE.DoubleSide,
      flatShading: true,
      wireframe: true
    });

    const mesh = new THREE.SkinnedMesh(geometry, material);
    const skeleton = new THREE.Skeleton(bones);

    mesh.add(bones[0]);

    mesh.bind(skeleton);
    console.log(mesh);

    skeletonHelper = new THREE.SkeletonHelper(mesh);
    skeletonHelper.material.linewidth = 2;
    scene.add(skeletonHelper);

    return mesh;
  }

  const geometry = createGeometry();
  const bones = createBones();
  mesh = createMesh(geometry, bones);
  // mesh.position.y = sizing.height / 2;

  // mesh.scale.multiplyScalar(1);
  scene.add(mesh);

  console.log("bones", mesh.skeleton.bones);
  const iks = [
    {
      target: 5,
      effector: 4,
      links: [{ index: 3 }, { index: 2 }, { index: 1 }]
      // iteration: 15
      // minAngle: 0,
      // maxAngle: 1
    }
  ];
  IKSolver = new CCDIKSolver(mesh, iks);
  window.IKSolver = IKSolver;
  scene.add(new CCDIKHelper(mesh, iks));

  function setupDatGui() {
    mesh.skeleton.bones
      .filter((bone) => bone.name === "target bone")
      .forEach(function (bone) {
        const folder = gui.addFolder(bone.name);

        const delta = sizing.height;

        folder
          .add(
            bone.position,
            "x",
            -delta + bone.position.x,
            delta + bone.position.x
          )
          .name("position.x");
        folder
          .add(
            bone.position,
            "y",
            -delta + bone.position.y,
            delta + bone.position.y
          )
          .name("position.y");
        folder
          .add(
            bone.position,
            "z",
            -delta + bone.position.z,
            delta + bone.position.z
          )
          .name("position.z");
      });

    gui.add(mesh, "pose").name("mesh.pose()");
    gui.add(IKSolver, "update").name("IKSolver.update()");
  }
  setupDatGui();
}

thenInit();
