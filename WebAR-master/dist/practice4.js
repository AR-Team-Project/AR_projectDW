const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

import * as THREE from 'three';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { GUI } from './node_modules/three/examples/jsm/libs/lil-gui.module.min.js';
import { ThreeMpPose } from './calculate_joint_angles.js';
//import '../node_modules/@mediapipe/holistic/holistic.js';
import './node_modules/@mediapipe/camera_utils/camera_utils.js';
import './node_modules/@mediapipe/control_utils/control_utils.js';
import './node_modules/@mediapipe/drawing_utils/drawing_utils.js';
import './node_modules/@mediapipe/pose/pose.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
const render_w = 820;
const render_h = 462;
renderer.setSize( render_w, render_h );
renderer.setViewport(0, 0, render_w, render_h);
renderer.shadowMap.enabled = true;
document.body.appendChild( renderer.domElement );

const camera_ar = new THREE.PerspectiveCamera( 45, render_w/render_h, 0.1, 1000 );
camera_ar.position.set( -1, 2, 3 );
camera_ar.up.set(0, 1, 0);
camera_ar.lookAt( 0, 1, 0 );

const camera_world = new THREE.PerspectiveCamera( 45, render_w/render_h, 1, 1000 );
camera_world.position.set( 0, 1, 3 );
camera_world.up.set(0, 1, 0);
camera_world.lookAt( 0, 1, 0 );
camera_world.updateProjectionMatrix();

const controls = new OrbitControls( camera_ar, renderer.domElement );
controls.enablePan = true;
controls.enableZoom = true;
controls.target.set( 0, 1, -1 );
controls.update();

const scene = new THREE.Scene();

scene.background = new THREE.Color( 0xa0a0a0 );
scene.fog = new THREE.Fog( 0xa0a0a0, 10, 50 );

const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
hemiLight.position.set( 0, 20, 0 );
scene.add( hemiLight );

const dirLight = new THREE.DirectionalLight( 0xffffff );
dirLight.position.set( 3, 10, 10 );
dirLight.castShadow = true;
dirLight.shadow.camera.top = 5;
dirLight.shadow.camera.bottom = -5;
dirLight.shadow.camera.left = -5;
dirLight.shadow.camera.right = 5;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 500;
scene.add( dirLight );

const ground_mesh = new THREE.Mesh( new THREE.PlaneGeometry( 1000, 1000 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
ground_mesh.rotation.x = - Math.PI / 2;
ground_mesh.receiveShadow = true;
scene.add( ground_mesh );

const grid_helper = new THREE.GridHelper( 1000, 1000 );
grid_helper.rotation.x = Math.PI / 2;
ground_mesh.add( grid_helper );

//helper.rotation.x = Math.PI / 2;
//group.add( helper );

let axis_helper_root = new THREE.AxesHelper(1);
axis_helper_root.position.set(0, 0.001, 0);
scene.add( axis_helper_root );

let model, skeleton, skeleton_helper, mixer, numAnimations;
let axis_helpers = [];
const loader = new GLTFLoader();
//loader.load( '../models/gltf/Xbot.glb', function ( gltf ) {
loader.load( './Xbot.glb', function ( gltf ) {

    model = gltf.scene;
    //model.position.set(0, 1, 1);
    scene.add( model );

    console.log(model);
    
    let bones = [];
    model.traverse( function ( object ) {

        if ( object.isMesh ) object.castShadow = true;

        //console.log(object.isBone);
        if ( object.isBone ) {
          // https://stackoverflow.com/questions/13309289/three-js-geometry-on-top-of-another
          bones.push(object);
          //console.log(object);
          //if(object.name == "mixamorigLeftToeBase") {
            //let axis_helper = new THREE.AxesHelper(20);
            //axis_helper.material.depthTest = false;
            //object.add(new THREE.AxesHelper(20));
          //} 
          //let axis_helper = new THREE.AxesHelper(20);
          //axis_helper.material.depthTest = false;
          //object.add(axis_helper);
          //axis_helpers.push(axis_helper);
        }
    } );

    bones.forEach(function(bone){
        console.log(bone.name);
    });

    skeleton = new THREE.Skeleton(bones);

    skeleton_helper = new THREE.SkeletonHelper( model );
    skeleton_helper.visible = false;
    
    scene.add( skeleton_helper );

    const animations = gltf.animations;
    mixer = new THREE.AnimationMixer( model );

    numAnimations = animations.length;

    for ( let i = 0; i !== numAnimations; ++ i ) {

        let clip = animations[ i ];
        const name = clip.name;

        //console.log("action: " + name);
    }
    console.log(model.position);
    console.log(model.scale);
} );

const threeMpPose = new ThreeMpPose();

const test_points = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: 0xFF0000, size: 0.1, sizeAttenuation: true }));
test_points.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(threeMpPose.numSrcLandmarks() * 3), 3));
scene.add(test_points);
const test_new_points = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: 0x0000FF, size: 0.1, sizeAttenuation: true }));
test_new_points.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 8), 3));
scene.add(test_new_points);

function onResults2(results) {
  if (!results.poseLandmarks) {
    return;
  }
  
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  
  {
    // Only overwrite existing pixels.
    // canvasCtx.globalCompositeOperation = 'source-in';
    // canvasCtx.fillStyle = '#00FF00';
    // canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    // Only overwrite missing pixels.
    canvasCtx.globalCompositeOperation = 'destination-atop';
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    //console.log(results.poseLandmarks); 

    

    canvasCtx.globalCompositeOperation = 'source-over';
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
                  {color: '#00FF00', lineWidth: 2});
    drawLandmarks(canvasCtx, results.poseLandmarks,
                  {color: '#FF0000', radius: 1});
    canvasCtx.restore();
  }
  {
    threeMpPose.updateMpLandmarks(results.poseLandmarks);
    threeMpPose.transformToWorld(camera_world, 1.5, new THREE.Vector3(0, 0, 1.5));
    threeMpPose.add3dJointsForMixamo();
    threeMpPose.rigSolverForMixamo(skeleton);

    let i = 0;
    //console.log(threeMpPose.pose3dDict);
    for (const [key, value] of Object.entries(threeMpPose.pose3dDict)) {
      //console.log(key, value);
      test_points.geometry.attributes.position.array[3 * i + 0] = value.x;
      test_points.geometry.attributes.position.array[3 * i + 1] = value.y;
      test_points.geometry.attributes.position.array[3 * i + 2] = value.z;
      i++;
    }
    test_points.geometry.attributes.position.needsUpdate = true;
    i = 0;
    for (const [key, value] of Object.entries(threeMpPose.newJoints3D)) {
      //console.log(key, value);
      test_new_points.geometry.attributes.position.array[3 * i + 0] = value.x;
      test_new_points.geometry.attributes.position.array[3 * i + 1] = value.y;
      test_new_points.geometry.attributes.position.array[3 * i + 2] = value.z;
      i++;
    }
    test_new_points.geometry.attributes.position.needsUpdate = true;

    let pos_hip = skeleton.getBoneByName("mixamorigHips").localToWorld (new THREE.Vector3(0, 0, 0));
    let pos_bottom = skeleton.getBoneByName("mixamorigRightFoot").localToWorld (new THREE.Vector3(0, 0, 0));
    //console.log(pos_bottom);
    
    let pos_hip_mp = threeMpPose.pose3dDict["hips"];
    model.position.copy(new THREE.Vector3().addVectors(pos_hip_mp, new THREE.Vector3(1, 0, -1)));
    model.position.y = pos_hip.y-pos_bottom.y;
    test_points.position.set(-1, 0, -1);
    test_new_points.position.set(-1, 0, -1);
  }

  renderer.render( scene, camera_ar );
  canvasCtx.restore();
}

const pose = new Pose({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
}});
//let holistic = new Holistic({locateFile: (file) => {
//    return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.4.1633559476/${file}`;
//}});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: true,
  smoothSegmentation: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
pose.onResults(onResults2);
//holistic.onResults(onResults2);

videoElement.play();

async function detectionFrame() {
  await pose.send({image: videoElement});
  //await holistic.send({image: videoElement});
  videoElement.requestVideoFrameCallback(detectionFrame);
}

detectionFrame();

function createPanel() {

  const panel = new GUI( { width: 310 } );

  let settings = {
    'show skeleton': false,
    //'pause/continue': pauseContinue,
    //'show local axes': false,
    'show bone axes': 'bone name <Enter>'
  };

  panel.add( settings, 'show skeleton' ).onChange( function(visibility){ skeleton_helper.visible = visibility; } );
  //panel.add( settings, 'show local axes' ).onChange( function(visibility){} );
  let gui_text = panel.add( settings, 'show bone axes' ).onFinishChange(function (boneName) {
    const _bone = skeleton.getBoneByName(boneName);
    if(_bone) {
      if(_bone.axisHelper == null) {
        let axis_helper = new THREE.AxesHelper(20);
        axis_helper.material.depthTest = false;
        _bone.add(axis_helper);
        _bone.axisHelper = axis_helper;
      }
      else {
        _bone.remove(_bone.axisHelper);
        _bone.axisHelper = null;
      }
    }
    //console.log(settings['show bone axes']);
    settings['show bone axes'] = 'bone name <Enter>';
    gui_text.updateDisplay();
  });
  panel.open();
}

createPanel();