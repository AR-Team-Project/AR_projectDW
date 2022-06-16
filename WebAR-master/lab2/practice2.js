const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

import * as THREE from "three";
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
import { Lensflare, LensflareElement } from '../node_modules/three/examples/jsm/objects/Lensflare.js';
import { TRIANGULATION } from '../triangulation.js';

import { Line2 } from '../node_modules/three/examples/jsm/lines/Line2.js';
import { LineMaterial } from '../node_modules/three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from '../node_modules/three/examples/jsm/lines/LineGeometry.js';

const render_w = 640;
const render_h = 480;
const camera = new THREE.PerspectiveCamera(63, render_w / render_h, 1.0, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(render_w, render_h);

document.body.appendChild(renderer.domElement);

camera.position.set(0, 0, 100);
camera.up.set(0, 1, 0);
camera.lookAt(0, 0, 0);
camera.updateProjectionMatrix();

const camera_model = new THREE.PerspectiveCamera(75, render_w / render_h, 1.0, 1000);
camera_model.position.set(0, 0, 80);
camera_model.up.set(0, 1, 0);
camera_model.lookAt(0, 0, 0);

const controls = new OrbitControls(camera_model, renderer.domElement);
//controls.enableDamping = true;

const scene = new THREE.Scene();
const geometry_box = new THREE.BoxGeometry(5, 5, 5);
const material_box = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
const box_mesh = new THREE.Mesh(geometry_box, material_box);
box_mesh.matrixAutoUpdate = false;
//scene.add( box_mesh );

const scene_model = new THREE.Scene();
//scene_model.add( box_mesh );

const texture = new THREE.VideoTexture(videoElement);
texture.center = new THREE.Vector2(0.5, 0.5);
texture.rotation = Math.PI;
texture.flipY = false;
scene.background = texture;

let geometry_faceoval = new THREE.BufferGeometry();
let linegeometry_faceoval = new LineGeometry();
let points_faceoval = null;
let lines_faceoval = null;
let face_mesh = null;

const geometry_sphere = new THREE.SphereGeometry(5, 16, 16);
const material_sphere = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sphere_iris = new THREE.Mesh(geometry_sphere, material_sphere);
sphere_iris.matrixAutoUpdate = false;
sphere_iris.visible = false;
//scene.add( sphere_iris );

const textureLoader = new THREE.TextureLoader();
const textureFlare0 = textureLoader.load('../lensflare0.png');
const textureFlare3 = textureLoader.load('../lensflare3.png');

const light = new THREE.PointLight(0xffffff, 1.5, 2000);
light.color.setHSL(0.995, 0.5, 0.7);
light.position.set(0, 0, 0);

const light2 = new THREE.DirectionalLight(0xffffff, 1.0);
light2.position.set(0, 0, 100);

const light3 = new THREE.AmbientLight(new THREE.Color(0.5, 0.5, 0.5), 1.0);

const lensflare = new Lensflare();
lensflare.addElement(new LensflareElement(textureFlare0, 200, 0, light.color));
lensflare.addElement(new LensflareElement(textureFlare3, 60, 0.6));
lensflare.addElement(new LensflareElement(textureFlare3, 70, 0.7));
lensflare.addElement(new LensflareElement(textureFlare3, 120, 0.9));
lensflare.addElement(new LensflareElement(textureFlare3, 70, 1));

light.add(lensflare);
light.visible = true;
scene.add(light);
scene.add(light2);
scene.add(light3);

// https://beautifier.io/

const faceMesh = new FaceMesh({
  locateFile: (file) => {
    return `../node_modules/@mediapipe/face_mesh/${file}`;
  }
});

function onResults(results) {
  //document.body.classList.add('loaded');
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.multiFaceGeometry) {
    for (const facegeometry of results.multiFaceGeometry) {
      //if(mesh_faceoval) mesh_faceoval.geometry.attributes.position.array = facegeometry.getMesh().getVertexBufferList();
      //console.log(facegeometry.getMesh().getVertexBufferList());

      console.log("ggg");
      const mpface_mesh = facegeometry.getMesh();
      if (face_mesh == null) {
        const face_mesh_geometry = new THREE.BufferGeometry();
        console.log(mpface_mesh.getVertexType());
        //face_mesh_geometry.setAttribute(mpface_mesh.getVertexType(), new THREE.BufferAttribute(
        //    mpface_mesh.getVertexBufferList(), 3));
      }
    }
  }

  function ProjScale(p_ms, cam_pos, src_d, dst_d) {
    let vec_cam2p = new THREE.Vector3().subVectors(p_ms, cam_pos);
    return new THREE.Vector3().addVectors(cam_pos, vec_cam2p.multiplyScalar(dst_d / src_d));
  }

  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
      let count_landmarks_faceoval = FACEMESH_FACE_OVAL.length;
      if (points_faceoval == null) {
        geometry_faceoval.setAttribute('position', new THREE.BufferAttribute(
          new Float32Array(count_landmarks_faceoval * 3), 3));

        points_faceoval = new THREE.Points(geometry_faceoval,
          new THREE.PointsMaterial({ color: 0xFF0000, size: 1, sizeAttenuation: true }));
        const points_faceoval2 = new THREE.Points(geometry_faceoval,
          new THREE.PointsMaterial({ color: 0xFF0000, size: 0.5, sizeAttenuation: true }));

        const lines_faceoval2 = new THREE.Line(geometry_faceoval,
          new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 5.0 }));

        let linePoints = [];
        linePoints.push(new THREE.Vector3(0, 0, 0));
        linePoints.push(new THREE.Vector3(0, 0, 0));
        let matFatLine = new LineMaterial({

          color: 0x00ff00,
          linewidth: 5, // in world units with size attenuation, pixels otherwise
          worldUnits: false,
          //vertexColors: true,

          //resolution:  // to be set by renderer, eventually
          dashed: false,
          alphaToCoverage: true,

        });
        matFatLine.resolution.set(render_w, render_h); // resolution of the viewport
        //matFatLine.worldUnits = true;
        //matFatLine.needsUpdate = true;

        lines_faceoval = new Line2(linegeometry_faceoval, matFatLine);

        let face_geometry = new THREE.BufferGeometry();
        face_geometry.setAttribute('position', new THREE.BufferAttribute(
          new Float32Array(landmarks.length * 3), 3));
        face_geometry.setAttribute('uv', new THREE.BufferAttribute(
          new Float32Array(landmarks.length * 2), 2));
        face_geometry.setAttribute('normal', new THREE.BufferAttribute(
          new Float32Array(landmarks.length * 3), 3));
        face_geometry.setIndex(TRIANGULATION);
        let face_material1 = new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture });
        let face_material2 = new THREE.MeshPhongMaterial(
          {
            color: new THREE.Color(1.0, 1.0, 1.0), map: texture,
            specular: new THREE.Color(0, 0, 0), shininess: 1000
          });
        face_mesh = new THREE.Mesh(face_geometry, face_material2);
        console.log("# of landmarks : " + landmarks.length);

        const face_mesh2 = new THREE.Mesh(face_geometry, face_material1);


        console.log("THREE GEOMETRY SET!");
        scene.add(points_faceoval);
        scene.add(lines_faceoval);
        //scene.add(face_mesh);
        scene_model.add(points_faceoval2);
        scene_model.add(lines_faceoval2);
        scene_model.add(face_mesh2);
      }
      // now points_faceoval is NOT NULL
      let avr_z_ps = 0.0;
      //for(let i = 0; i < count_landmarks_faceoval; i++) {
      //    const index = FACEMESH_FACE_OVAL[i][0];
      //    //console.log(FACEMESH_FACE_OVAL[i]);
      //    const p = landmarks[index];
      //    avr_z_ps += p.z / count_landmarks_faceoval;
      //}
      //console.log(avr_z_ps);
      const p_avr = new THREE.Vector3(0, 0, avr_z_ps).unproject(camera);
      const vec_cam2avr = new THREE.Vector3().subVectors(p_avr, camera.position);
      const avr_dist = vec_cam2avr.length();

      let oval_positions = points_faceoval.geometry.attributes.position.array;
      let linePoints = []; linePoints.length = count_landmarks_faceoval;
      for (let i = 0; i < count_landmarks_faceoval; i++) {
        //console.log(FACEMESH_FACE_OVAL[i][0]);
        const index = FACEMESH_FACE_OVAL[i][0];
        let p = landmarks[index];
        let p_ms = new THREE.Vector3((p.x - 0.5) * 2.0, -(p.y - 0.5) * 2.0, p.z).unproject(camera);
        p_ms = ProjScale(p_ms, camera.position, avr_dist, 100.0);

        oval_positions[i * 3 + 0] = p_ms.x;
        oval_positions[i * 3 + 1] = p_ms.y;
        oval_positions[i * 3 + 2] = p_ms.z;

        linePoints[i] = p_ms;
      }
      let positions = face_mesh.geometry.attributes.position.array;
      let uvs = face_mesh.geometry.attributes.uv.array;
      let p_center = new THREE.Vector3(0, 0, 0);
      for (let i = 0; i < landmarks.length; i++) {
        let p = landmarks[i];
        let p_ms = new THREE.Vector3((p.x - 0.5) * 2.0, -(p.y - 0.5) * 2.0, p.z).unproject(camera);
        p_ms = ProjScale(p_ms, camera.position, avr_dist, 100.0);

        let pp = new THREE.Vector3().copy(p_ms);
        p_center.addVectors(p_center, pp.divideScalar(landmarks.length));

        positions[i * 3 + 0] = p_ms.x;
        positions[i * 3 + 1] = p_ms.y;
        positions[i * 3 + 2] = p_ms.z;
        uvs[i * 2 + 0] = p.x;
        uvs[i * 2 + 1] = -p.y + 1.0;
        //console.log(p.x +", "+p.y);
      }
      camera_model.lookAt(p_center.x, p_center.y, p_center.z);
      controls.target = p_center;
      //console.log(p_center.x + ", " + p_center.y + ", " + p_center.z);
      face_mesh.geometry.computeVertexNormals();

      linegeometry_faceoval.setPositions(oval_positions);
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
      let p_il_ms = new THREE.Vector3((lm_il[0] - 0.5) * 2.0, -(lm_il[1] - 0.5) * 2.0, lm_il[2]).unproject(camera);
      p_il_ms = ProjScale(p_il_ms, camera.position, avr_dist, 99.9);
      //console.log(p_il_ms.x + ", " + p_il_ms.y + ", " + p_il_ms.z);
      sphere_iris.matrix = new THREE.Matrix4().makeTranslation(p_il_ms.x, p_il_ms.y, p_il_ms.z);
      sphere_iris.updateMatrixWorld(true);
      //sphere_iris.visible = true;

      light.visible = true;
      light.position.copy(p_il_ms);
      light2.target = face_mesh;
      //console.log(count_landmarks_left_iris);



      //console.log(test.value);
      //let positions = mesh_faceoval != null ? mesh_faceoval.geometry.attributes.position.array : null;
      //for (var it = itor.next(); !it.done; it = itor.next()){
      //    var k = it.value;
      //    let p = landmarks[k[0]];
      //    let p_ms = new THREE.Vector3((p.x - 0.5) * 2.0, -(p.y - 0.5) * 2.0, p.z).unproject(camera);
      //    //let p_ms = compute_p(camera.position, ip, p.z, 200.0, camera.near);
      //
      //    if(landmark_faceoval != null) {
      //        //landmark_faceoval[count] = p_ms;
      //        positions[count * 3 + 0] = p_ms.x;
      //        positions[count * 3 + 1] = p_ms.y;
      //        positions[count * 3 + 2] = p_ms.z;
      //        //console.log(p_ms.x + ", " + p_ms.y + ", " + p_ms.z);
      //        //console.log(p_ps.x + ", " + p_ps.y + ", " + p_ps.z);
      //        //console.log(p.x + ", " + p.y + ", " + p.z);
      //    }
      //    count++;
      //}
      //if(landmark_faceoval != null) {
      //    mesh_faceoval.geometry.attributes.position.needsUpdate = true; // required 
      //}
      controls.update();

      //let face_geo = q(FACE_GEOMETRY);
      //console.log(face_geo[DEFAULT_CAMERA_PARAMS].verticalFovDegrees);

      //console.log("count : " + count);
      renderer.autoClear = true;
      renderer.setViewport(0, 0, render_w, render_h);
      renderer.render(scene, camera);
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.setViewport(0, 0, render_w / 3, render_h / 3);
      renderer.render(scene_model, camera_model);


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

//const webcamera = new Camera(videoElement, {
//  onFrame: async () => {
//    await faceMesh.send({image: videoElement});
//  },
//  width: 640,
//  height: 480,
//});
//webcamera.start();

//animate();
//function animate() {
//    requestAnimationFrame( animate );
////    renderer.render( scene, camera );
//}

function startEstimation(video, ctx_w, ctx_h) {
  let width = video.videoWidth;
  let height = video.videoHeight;

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
startEstimation(videoElement, render_w, render_h);