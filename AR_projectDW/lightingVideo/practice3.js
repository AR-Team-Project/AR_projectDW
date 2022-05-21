let videoElement = document.getElementsByClassName("input_video")[0];
const canvasElement = document.getElementsByClassName("output_canvas")[0];
canvasElement.style.display = "none";
const canvasCtx = canvasElement.getContext("2d");

//import { FACEMESH_FACE_OVAL } from "@mediapipe/face_mesh";
import * as THREE from '../node_modules/three/build/three.module.js';
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
import { Lensflare,
  LensflareElement,
} from "../node_modules/three/examples/jsm/objects/Lensflare.js";

import { TRIANGULATION } from "./triangulation.js";

import { Line2 } from "../node_modules/three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "../node_modules/three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "../node_modules/three/examples/jsm/lines/LineGeometry.js";

import Stats from "../node_modules/three/examples/jsm/libs/stats.module.js";

import { GLTFLoader } from "../node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "../node_modules/three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "../node_modules/three/examples/jsm/libs/meshopt_decoder.module.js";

import { RoomEnvironment } from "../node_modules/three/examples/jsm/environments/RoomEnvironment.js";

import { GUI } from "../node_modules/three/examples/jsm/libs/lil-gui.module.min.js";

// https://www.digitalocean.com/community/tutorials/front-and-rear-camera-access-with-javascripts-getusermedia
//let stream = await navigator.mediaDevices.getUserMedia({video: true});
//let {width, height} = stream.getTracks()[0].getSettings();
//console.log(`${width}x${height}`); // 640x480
if ("mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices) {
  console.log("Let's get this party started");
}
//navigator.mediaDevices.getUserMedia({video: true});
//const constraints = {
//  video: {
//    width: {
//      min: 640,
//      ideal: 640,
//      max: 640,
//    },
//    height: {
//      min: 480,
//      ideal: 480,
//      max: 480
//    },
//  }
//};
const devices = await navigator.mediaDevices.enumerateDevices();
const videoDevices = devices.filter((device) => device.kind === "videoinput");
let rgb_video = videoDevices[0];
for (let vd of videoDevices) {
  console.log(vd.label);
  if (vd.label.includes("Module RGB")) {
    rgb_video = vd;
    break;
  }
}
console.log(rgb_video);
//navigator.mediaDevices.getUserMedia({video: {deviceId: {exact: rgb_video}}});
//videoElement.play();
//const cameraOptions = document.querySelector('.video-options>select');
//const getCameraSelection = async () => {
//  const devices = await navigator.mediaDevices.enumerateDevices();
//  const videoDevices = devices.filter(device => device.kind === 'videoinput');
//  const options = videoDevices.map(videoDevice => {
//    return `<option value="${videoDevice.deviceId}">${videoDevice.label}</option>`;
//  });
//  cameraOptions.innerHTML = options.join('');
//};
//getCameraSelection();

let is_camera_mode = true; // videoDevices.length > 0;

if (!is_camera_mode) {
  videoElement = document.getElementsByClassName("input_recorded_video")[0];
}

console.log(videoElement.videoWidth + ", " + videoElement.videoHeight);
console.log(videoElement.width + ", " + videoElement.height);

const aspect_ratio = is_camera_mode
  ? 640 / 480.0
  : videoElement.videoWidth / videoElement.videoHeight;

const render_w_ar = is_camera_mode
  ? Math.min(640, document.documentElement.clientWidth)
  : Math.min(
      Math.min(videoElement.videoWidth, document.documentElement.clientWidth),
      640
    );
const render_h_ar = render_w_ar / aspect_ratio;
//videoElement.setAttribute('width', (render_w_ar/10).toString() + "px");
//videoElement.setAttribute('height', render_h_ar.toString() + "px");
//console.log(videoElement.videoWidth + ", " + videoElement.videoHeight);
videoElement.width = render_w_ar;
videoElement.height = render_h_ar;

const aspect_ratio_world = 640.0 / 480.0;
const render_w = Math.min(640, document.documentElement.clientWidth);
const render_h = render_w / aspect_ratio_world;
const renderer_ar = new THREE.WebGLRenderer({ antialias: true });
const renderer_world = new THREE.WebGLRenderer({ antialias: true });
renderer_ar.setSize(render_w_ar, render_h_ar);
renderer_world.setSize(render_w, render_h);

const testElement = document.getElementById("test");
testElement.textContent = devices.length;

//const dpr = window.devicePixelRatio;
//renderer_ar.setPixelRatio( dpr );
//renderer_world.setPixelRatio( dpr );

document.body.appendChild(renderer_ar.domElement);
document.body.appendChild(renderer_world.domElement);

//THREE.OrthographicCamera;
const camera_ar = new THREE.PerspectiveCamera(63, aspect_ratio, 60.0, 500);
const camera_world = new THREE.PerspectiveCamera(
  63,
  aspect_ratio_world,
  1.0,
  10000
);

camera_ar.position.set(0, 0, 100);
camera_ar.up.set(0, 1, 0);
camera_ar.lookAt(0, 0, 0);
camera_ar.updateProjectionMatrix();

camera_world.position.set(200, 0, 200);
camera_world.up.set(0, 1, 0);
camera_world.lookAt(0, 0, 0);

const controls = new OrbitControls(camera_world, renderer_world.domElement);
controls.enableDamping = true;

const scene = new THREE.Scene();

//const texture = new THREE.VideoTexture( videoElement );
//texture.center = new THREE.Vector2(0.5, 0.5);
//texture.rotation = Math.PI;
//texture.flipY = false;

const degrees_to_radians = (deg) => (deg * Math.PI) / 180.0;
let unit_h = Math.tan(degrees_to_radians(camera_ar.fov / 2.0)) * 2;
let unit_w = (unit_h / render_h) * render_w;
const plane_geometry = new THREE.PlaneGeometry(
  unit_w * camera_ar.far,
  unit_h * camera_ar.far
);
const plane_material = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  side: THREE.DoubleSide,
});
const plane_bg = new THREE.Mesh(plane_geometry, plane_material);
plane_bg.position.set(0, 0, -400);
scene.add(plane_bg);

//scene.background = texture;

let geometry_faceoval = new THREE.BufferGeometry();
let linegeometry_faceoval = new LineGeometry();
let points_faceoval = null;
let lines_faceoval = null;
let gl_lines_faceoval = null;
let face_mesh = null;

const textureLoader = new THREE.TextureLoader();
const textureFlare0 = textureLoader.load("../lensflare0.png");
const textureFlare3 = textureLoader.load("../lensflare3.png");

const light_flare = new THREE.PointLight(0xffffff, 1.5, 2000);
light_flare.color.setHSL(0.995, 0.5, 0.7);
light_flare.position.set(0, 0, 0);

const light = new THREE.DirectionalLight(0xffffff, 1.0);
light.position.set(0, 0, 100);

const light_ambient = new THREE.AmbientLight(
  new THREE.Color(0.5, 0.5, 0.5),
  1.0
);

const lensflare = new Lensflare();
lensflare.addElement(new LensflareElement(textureFlare0, 200, 0, light.color));
lensflare.addElement(new LensflareElement(textureFlare3, 60, 0.6));
lensflare.addElement(new LensflareElement(textureFlare3, 70, 0.7));
lensflare.addElement(new LensflareElement(textureFlare3, 120, 0.9));
lensflare.addElement(new LensflareElement(textureFlare3, 70, 1));

light_flare.add(lensflare);
light_flare.visible = true;
scene.add(light_flare);
scene.add(light);
scene.add(light_ambient);

const axis_helper = new THREE.AxisHelper(20);
scene.add(axis_helper);

let light_helper = new THREE.DirectionalLightHelper(light, 0.3);
function update_light(pos) {
  light.position.set(pos.x, pos.y, pos.z);
  light_helper.update();
}

let camera_ar_helper = new THREE.CameraHelper(camera_ar);
scene.add(camera_ar_helper);

let mixer, blendshapeMesh;
const ktx2Loader = new KTX2Loader()
  .setTranscoderPath("./node_modules/three/examples/js/libs/basis/")
  .detectSupport(renderer_ar);
new GLTFLoader()
  .setKTX2Loader(ktx2Loader)
  .setMeshoptDecoder(MeshoptDecoder)
  .load("models/gltf/facecap.glb", (gltf) => {
    blendshapeMesh = gltf.scene.children[0];
    blendshapeMesh.scale.set(750, 750, 750);
    scene.add(blendshapeMesh);

    mixer = new THREE.AnimationMixer(blendshapeMesh);

    //mixer.clipAction(gltf.animations[0]).play();
    console.log(gltf.animations);
    // GUI
    const head = blendshapeMesh.getObjectByName("mesh_2");
    const influences = head.morphTargetInfluences;
    console.log(head.morphTargetDictionary);

    const gui = new GUI();
    gui.close();
    for (const [key, value] of Object.entries(head.morphTargetDictionary)) {
      console.log(key, value);
      gui
        .add(influences, value, 0, 1, 0.01)
        .name(key.replace("blendShape1.", ""))
        .listen(influences);
    }
  });

// https://beautifier.io/
renderer_ar.domElement.style = "touch-action:none";
renderer_ar.domElement.onpointerdown = mouseDownHandler;
renderer_ar.domElement.onpointermove = mouseMoveHandler;
renderer_ar.domElement.onpointerup = mouseUpHandler;
renderer_ar.domElement.onpointercancel = mouseUpHandler;
renderer_ar.domElement.onpointerout = mouseUpHandler;
renderer_ar.domElement.onpointerleave = mouseUpHandler;

renderer_ar.domElement.onwheel = mouseWheelHandler;
//renderer_ar.domElement.addEventListener("pointerdown", mouseDownHandler, false);
//renderer_ar.domElement.addEventListener("pointermove", mouseMoveHandler, false);
//renderer_ar.domElement.addEventListener("pointerup", mouseUpHandler, false);
//renderer_ar.domElement.addEventListener("wheel", mouseWheelHandler, { passive: false });

function compute_pos_ps2ws(x_ss, y_ss) {
  //console.log(x_ss / window.innerWidth * 2 - 1)
  return new THREE.Vector3(
    (x_ss / render_w) * 2 - 1,
    (-y_ss / render_h) * 2 + 1,
    -1
  ).unproject(camera_ar);
  //return new THREE.Vector3( x_ss / window.innerWidth, -y_ss / window.innerHeight, -1 ).unproject( controls.object );
}

let light_plane_dist = camera_ar.near;
let mouse_btn_flag = false;
function mouseDownHandler(e) {
  // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
  if (e.pointerType == "mouse") {
    mouse_btn_flag = true;
    mouseMoveHandler(e);
  } else if (e.pointerType == "touch") {
    evCache.push(e);
    console.log("pointerDown", e);
  }
}

function ProjScale(p_ms, cam_pos, src_d, dst_d) {
  let vec_cam2p = new THREE.Vector3().subVectors(p_ms, cam_pos);
  return new THREE.Vector3().addVectors(
    cam_pos,
    vec_cam2p.multiplyScalar(dst_d / src_d)
  );
}

var evCache = new Array();
var prevDiff = -1;
function remove_event(ev) {
  // Remove this event from the target's cache
  for (var i = 0; i < evCache.length; i++) {
    if (evCache[i].pointerId == ev.pointerId) {
      evCache.splice(i, 1);
      break;
    }
  }
}
function mouseUpHandler(e) {
  mouse_btn_flag = false;
  console.log("GGGGL");
  console.log(e);
  if (e.pointerType != "touch") return;
  // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttonlog(ev.type, ev);
  // Remove this pointer from the cache and reset the target's
  // background and border
  remove_event(e);
  // If the number of pointers down is less than two then reset diff tracker
  if (evCache.length < 2) {
    prevDiff = -1;
  }
}

let x_prev = render_w / 2;
let y_prev = render_h / 2;
function mouseMoveHandler(e) {
  if (e.pointerType == "mouse") {
    if (mouse_btn_flag) {
      let pos_light_np = compute_pos_ps2ws(e.clientX, e.clientY);
      //let pos_light = ProjScale(pos_light_np, camera_ar.position, camera_ar.near, light_plane_dist);
      update_light(pos_light_np);
      x_prev = e.clientX;
      y_prev = e.clientY;
    }
  } else if (e.pointerType == "touch") {
    console.log("pointerMove", e);
    //e.target.style.border = "dashed";

    // Find this event in the cache and update its record with this event
    for (var i = 0; i < evCache.length; i++) {
      if (e.pointerId == evCache[i].pointerId) {
        evCache[i] = e;
        break;
      }
    }

    if (evCache.length == 1) {
      let pos_light_np = compute_pos_ps2ws(e.clientX, e.clientY);
      //let pos_light = ProjScale(pos_light_np, camera_ar.position, camera_ar.near, light_plane_dist);
      update_light(pos_light_np);
      x_prev = e.clientX;
      y_prev = e.clientY;
    }
    // If two pointers are down, check for pinch gestures
    else if (evCache.length == 2) {
      console.log("Pinch moving");
      // Calculate the distance between the two pointers
      var curDiff = Math.abs(evCache[0].clientX - evCache[1].clientX);

      if (prevDiff > 0) {
        if (curDiff > prevDiff) {
          // The distance between the two pointers has increased
          console.log("Pinch moving OUT -> Zoom in", e);
          camera_ar.near += 2.0;
          camera_ar.near = Math.min(camera_ar.near, camera_ar.far);
          camera_ar.updateProjectionMatrix();
        }
        if (curDiff < prevDiff) {
          // The distance between the two pointers has decreased
          console.log("Pinch moving IN -> Zoom out", e);
          camera_ar.near -= 2.0;
          camera_ar.near = Math.max(camera_ar.near, 1.0);
          camera_ar.updateProjectionMatrix();
        }
        let pos_light_np = compute_pos_ps2ws(x_prev, y_prev);
        update_light(pos_light_np);
      }

      // Cache the distance for the next move event
      prevDiff = curDiff;
    }
    e.preventDefault();
  }
}

function mouseWheelHandler(e) {
  //e.preventDefault();
  //light_plane_dist += e.deltaY * -0.01;
  camera_ar.near += e.deltaY * -0.01;
  camera_ar.updateProjectionMatrix();
  //camera_ar_helper.update();
  let pos_light_np = compute_pos_ps2ws(x_prev, y_prev);
  //let pos_light = ProjScale(pos_light_np, camera_ar.position, camera_ar.near, light_plane_dist);
  update_light(pos_light_np);
}

const faceMesh = new FaceMesh({
  locateFile: (file) => {
    return `../node_modules/@mediapipe/face_mesh/${file}`;
  },
});

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );

  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
      let count_landmarks_faceoval = FACEMESH_FACE_OVAL.length;
      if (points_faceoval == null) {
        geometry_faceoval.setAttribute(
          "position",
          new THREE.BufferAttribute(
            new Float32Array((count_landmarks_faceoval + 1) * 3),
            3
          )
        );

        points_faceoval = new THREE.Points(
          geometry_faceoval,
          new THREE.PointsMaterial({
            color: 0xff0000,
            size: 3,
            sizeAttenuation: true,
          })
        );

        let matFatLine = new LineMaterial({
          color: 0x00ff00,
          linewidth: 3, // in world units with size attenuation, pixels otherwise
          worldUnits: false,
          //vertexColors: true,
          //resolution:  // to be set by renderer, eventually
          dashed: false,
          alphaToCoverage: true,
        });
        matFatLine.resolution.set(render_w, render_h); // resolution of the viewport
        matFatLine.needsUpdate = true;
        lines_faceoval = new Line2(linegeometry_faceoval, matFatLine);

        let face_geometry = new THREE.BufferGeometry();
        face_geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(new Float32Array(landmarks.length * 3), 3)
        );
        face_geometry.setAttribute(
          "uv",
          new THREE.BufferAttribute(new Float32Array(landmarks.length * 2), 2)
        );
        face_geometry.setAttribute(
          "normal",
          new THREE.BufferAttribute(new Float32Array(landmarks.length * 3), 3)
        );
        face_geometry.setIndex(TRIANGULATION);
        //let face_material1 = new THREE.MeshBasicMaterial({ color: 0xffffff, map:texture  });
        let face_material2 = new THREE.MeshPhongMaterial({
          color: new THREE.Color(1.0, 1.0, 1.0),
          specular: new THREE.Color(0, 0, 0),
          shininess: 1000,
        });
        face_mesh = new THREE.Mesh(face_geometry, face_material2);

        let line_geo = new THREE.BufferGeometry();
        line_geo.setAttribute(
          "position",
          new THREE.BufferAttribute(
            new Float32Array(count_landmarks_faceoval * 3),
            3
          )
        );
        let line_mat = new THREE.LineBasicMaterial({ color: 0xffff00 });
        gl_lines_faceoval = new THREE.Line(line_geo, line_mat);

        console.log("# of landmarks : " + landmarks.length);
        console.log("THREE GEOMETRY SET!");
        //scene.add(gl_lines_faceoval);
        //scene.add(points_faceoval);
        //scene.add(lines_faceoval);
        scene.add(face_mesh);
      }
      // now points_faceoval is NOT NULL
      const p_c = new THREE.Vector3(0, 0, 0).unproject(camera_ar);
      const vec_cam2center = new THREE.Vector3().subVectors(
        p_c,
        camera_ar.position
      );
      const center_dist = vec_cam2center.length();

      let oval_positions = points_faceoval.geometry.attributes.position.array;

      const ip_lt = new THREE.Vector3(-1, 1, -1).unproject(camera_ar);
      const ip_rb = new THREE.Vector3(1, -1, -1).unproject(camera_ar);
      const ip_diff = new THREE.Vector3().subVectors(ip_rb, ip_lt);
      const x_scale = Math.abs(ip_diff.x);
      //let linePoints = []; linePoints.length = count_landmarks_faceoval;
      for (let i = 0; i < count_landmarks_faceoval; i++) {
        //console.log(FACEMESH_FACE_OVAL[i][0]);
        const index = FACEMESH_FACE_OVAL[i][0];
        let p = landmarks[index];
        let p_ms = new THREE.Vector3(
          (p.x - 0.5) * 2.0,
          -(p.y - 0.5) * 2.0,
          p.z
        ).unproject(camera_ar);
        // here, z should be recomputed!
        //let p_ms = new THREE.Vector3((p.x - 0.5) * 2.0, -(p.y - 0.5) * 2.0, 0).unproject(camera_ar);
        //p_ms.z = -p.z * x_scale;
        p_ms = ProjScale(p_ms, camera_ar.position, center_dist, 100.0);

        oval_positions[i * 3 + 0] = p_ms.x;
        oval_positions[i * 3 + 1] = p_ms.y;
        oval_positions[i * 3 + 2] = p_ms.z;

        //linePoints[i] = p_ms;
      }
      oval_positions[count_landmarks_faceoval * 3 + 0] = oval_positions[0];
      oval_positions[count_landmarks_faceoval * 3 + 1] = oval_positions[1];
      oval_positions[count_landmarks_faceoval * 3 + 2] = oval_positions[2];
      //linePoints[count_landmarks_faceoval] = linePoints[0];

      let positions = face_mesh.geometry.attributes.position.array;
      let uvs = face_mesh.geometry.attributes.uv.array;
      let p_center = new THREE.Vector3(0, 0, 0);
      let p_ms_average = [0, 0, 0];

      for (let i = 0; i < landmarks.length; i++) {
        let p = landmarks[i];
        //let p_ms = new THREE.Vector3((p.x - 0.5) * 2.0, -(p.y - 0.5) * 2.0, p.z).unproject(camera_ar);
        // here, z should be recomputed!
        let p_ms = new THREE.Vector3(
          (p.x - 0.5) * 2.0,
          -(p.y - 0.5) * 2.0,
          -1
        ).unproject(camera_ar);
        p_ms.z = -p.z * x_scale + camera_ar.position.z - camera_ar.near;
        //p_ms = ProjScale(p_ms, camera_ar.position, center_dist, 100.0);
        // camera_ar.near
        p_ms = ProjScale(p_ms, camera_ar.position, camera_ar.near, 300.0);
        //p_ms.z = -p.z * x_scale;

        //let vec_cam2p = new THREE.Vector3().subVectors(p_ms, cam_pos);
        //return new THREE.Vector3().addVectors(cam_pos, vec_cam2p.multiplyScalar(dst_d/src_d));
        let pp = new THREE.Vector3().copy(p_ms);
        p_center.addVectors(p_center, pp.divideScalar(landmarks.length));

        positions[i * 3 + 0] = p_ms.x;
        positions[i * 3 + 1] = p_ms.y;
        positions[i * 3 + 2] = p_ms.z;

        p_ms_average[0] += p_ms.x;
        p_ms_average[1] += p_ms.y;
        p_ms_average[2] += p_ms.z;

        uvs[i * 2 + 0] = p.x;
        uvs[i * 2 + 1] = -p.y + 1.0;
        //console.log(p.x +", "+p.y);
      }

      p_ms_average[0] /= landmarks.length;
      p_ms_average[1] /= landmarks.length;
      p_ms_average[2] /= landmarks.length;

      blendshapeMesh.position.set(
        p_ms_average[0],
        p_ms_average[1],
        p_ms_average[2]
      );

      controls.target = p_center;
      //console.log(p_center.x + ", " + p_center.y + ", " + p_center.z);
      face_mesh.geometry.computeVertexNormals();

      let normal = face_mesh.geometry.getAttribute("normal");
      let position = face_mesh.geometry.getAttribute("position");
      let normal_vec = new THREE.Vector3(
        normal.array[588],
        normal.array[589],
        normal.array[590]
      );

      let position_vec = new THREE.Vector3(
        position.array[15],
        position.array[16],
        position.array[17]
      );

      let lookat = new THREE.Vector3(0, 0, 0)
        .addVectors(normal_vec, position_vec)
        .ceil();

      lookat.y -= 10;
      blendshapeMesh.lookAt(lookat);

      function AreaOfTriangle(p1, p2, p3) {
        var v1 = new THREE.Vector3();
        var v2 = new THREE.Vector3();
        v1 = p1.clone().sub(p2);
        v2 = p1.clone().sub(p3);
        var v3 = new THREE.Vector3();
        v3.crossVectors(v1, v2);
        var s = v3.length() / 2;
        return s;
      }

      let tempVal = 0;
      for (let i = 0; i < TRIANGULATION.length / 3; i++) {
        let posVec1 = new THREE.Vector3(
          position.array[TRIANGULATION[i * 3 + 0]],
          position.array[TRIANGULATION[i * 3 + 0] + 1],
          position.array[TRIANGULATION[i * 3 + 0] + 2]
        );
        let posVec2 = new THREE.Vector3(
          position.array[TRIANGULATION[i * 3 + 1]],
          position.array[TRIANGULATION[i * 3 + 1] + 1],
          position.array[TRIANGULATION[i * 3 + 1] + 2]
        );
        let posVec3 = new THREE.Vector3(
          position.array[TRIANGULATION[i * 3 + 2]],
          position.array[TRIANGULATION[i * 3 + 2] + 1],
          position.array[TRIANGULATION[i * 3 + 2] + 2]
        );
        tempVal += AreaOfTriangle(posVec1, posVec2, posVec3);
      }

      let blendshapeScale = Math.log(tempVal / 10000) * 100;

      console.log(blendshapeScale);
      blendshapeMesh.scale.set(
        blendshapeScale,
        blendshapeScale,
        blendshapeScale
      );

      //linegeometry_faceoval.setPositions(oval_positions);
      lines_faceoval.geometry.setPositions(oval_positions);

      //gl_lines_faceoval.geometry.attributes.position.array = oval_positions;
      //gl_lines_faceoval.geometry.attributes.position.needsUpdate = true;
      //console.log(lines_faceoval.geometry.attributes.position.array = oval_positions);
      //lines_faceoval.geometry.attributes.position.needsUpdate = true;

      lines_faceoval.computeLineDistances();
      lines_faceoval.scale.set(1, 1, 1);

      points_faceoval.geometry.attributes.position.needsUpdate = true;
      face_mesh.geometry.attributes.position.needsUpdate = true;
      face_mesh.geometry.attributes.uv.needsUpdate = true;

      let count_landmarks_left_iris = FACEMESH_LEFT_IRIS.length;
      let lm_il = [0.0, 0.0, 0.0];
      for (let i = 0; i < count_landmarks_left_iris; i++) {
        const index = FACEMESH_LEFT_IRIS[i][0];
        const p = landmarks[index];
        lm_il[0] += p.x / count_landmarks_left_iris;
        lm_il[1] += p.y / count_landmarks_left_iris;
        lm_il[2] += p.z / count_landmarks_left_iris;
      }
      let p_il_ms = new THREE.Vector3(
        (lm_il[0] - 0.5) * 2.0,
        -(lm_il[1] - 0.5) * 2.0,
        lm_il[2]
      ).unproject(camera_ar);
      p_il_ms = ProjScale(p_il_ms, camera_ar.position, center_dist, 99.9);
      //sphere_iris.visible = true;
      light_flare.visible = true;
      light_flare.position.copy(p_il_ms);
      light.target = face_mesh;

      //console.log(count_landmarks_left_iris);

      //texture.update();

      //drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION,
      //               {color: '#C0C0C070', lineWidth: 1});
      //drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030'});
      //drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {color: '#FF3030'});
      //drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_IRIS, {color: '#FF3030'});
      //drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30'});
      //drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {color: '#30FF30'});
      //drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_IRIS, {color: '#30FF30'});
      //drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});
      //drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {color: '#E0E0E0'});
    }
    if (face_mesh != null) {
      controls.update(); // camera_world

      light_helper.update();
      camera_ar_helper.update();

      //console.log(results.image);
      let texture_frame = new THREE.CanvasTexture(results.image);

      plane_material.map = texture_frame;
      //plane_material.update();
      scene.background = texture_frame;
      face_mesh.material.map = texture_frame;
      scene.remove(light_helper);
      scene.remove(camera_ar_helper);
      scene.remove(plane_bg);
      renderer_ar.render(scene, camera_ar);
      scene.background = null;
      face_mesh.material.map = texture_frame;
      scene.add(light_helper);
      scene.add(camera_ar_helper);
      scene.add(plane_bg);
      renderer_world.render(scene, camera_world);
    }
  }
  canvasCtx.restore();
}

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  selfieMode: true,
  //enableFaceGeometry: false
});
faceMesh.onResults(onResults);

const webcamera = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({ image: videoElement });
  },
  width: render_w_ar,
  //height: render_h_ar,
});

//animate();
//function animate() {
//    requestAnimationFrame( animate );
////    renderer.render( scene, camera );
//}

function startEstimation(video, ctx_w, ctx_h) {
  canvasElement.width = ctx_w;
  canvasElement.height = ctx_h;

  video.play();

  async function detectionFrame(now, metadata) {
    await faceMesh.send({ image: video }); // processing
    video.requestVideoFrameCallback(detectionFrame);
  }
  video.requestVideoFrameCallback(detectionFrame);
  console.log("Processing started");
}

if (is_camera_mode) webcamera.start();
else startEstimation(videoElement, render_w_ar, render_h_ar);
//startEstimation(videoElement, render_w_ar, render_h_ar);
