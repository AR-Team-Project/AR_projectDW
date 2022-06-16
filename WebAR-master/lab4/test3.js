const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

import * as THREE from 'three';
import * as Kalidokit from '../node_modules/kalidokit/dist/kalidokit.es.js'
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import { TRIANGULATION } from '../triangulation.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import '../node_modules/@mediapipe/holistic/holistic.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
const render_w = 640;
const render_h = 480;
renderer.setSize( render_w, render_h );
renderer.setViewport(0, 0, render_w, render_h);
renderer.shadowMap.enabled = true;
document.body.appendChild( renderer.domElement );

const camera_ar = new THREE.PerspectiveCamera( 45, render_w/render_h, 1, 500 );
camera_ar.position.set( -1, 2, 3 );
camera_ar.up.set(0, 1, 0);
camera_ar.lookAt( 0, 1, 0 );

const controls = new OrbitControls( camera_ar, renderer.domElement );
controls.enablePan = false;
controls.enableZoom = false;
controls.target.set( 0, 1, 0 );
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
dirLight.shadow.camera.top = 2;
dirLight.shadow.camera.bottom = - 2;
dirLight.shadow.camera.left = - 2;
dirLight.shadow.camera.right = 2;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 40;
scene.add( dirLight );

const ground_mesh = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
ground_mesh.rotation.x = - Math.PI / 2;
ground_mesh.receiveShadow = true;
scene.add( ground_mesh );

let model, skeleton, skeleton_helper, mixer, numAnimations;
const loader = new GLTFLoader();
loader.load( '../models/gltf/Xbot.glb', function ( gltf ) {

    model = gltf.scene;
    scene.add( model );

    console.log(model);
    
    let bones = [];
    model.traverse( function ( object ) {

        if ( object.isMesh ) object.castShadow = true;

        //console.log(object.isBone);
        if ( object.isBone ) {
          let axis_helper = new THREE.AxesHelper(20);
          // https://stackoverflow.com/questions/13309289/three-js-geometry-on-top-of-another
          axis_helper.material.depthTest = false;
          bones.push(object);
          //console.log(object);
          if(object.name == "mixamorigLeftLeg" || object.name == "mixamorigLeftUpLeg" || object.name == "mixamorigHips") 
            object.add(axis_helper);

          if(object.name == "mixamorigLeftUpLeg" || object.name == "mixamorigHips")
            console.log(object.position);
        }
    } );

    //let test_obj = new THREE.Object3D();
    //test_obj.position.set(0, 1, 0);
    //scene.add(test_obj);
    //let axis_helper__TEST = new THREE.AxesHelper(2);
    //let axis_helper__TEST1 = new THREE.AxesHelper(400);
    //test_obj.add(axis_helper__TEST);
    //scene.add(axis_helper__TEST1);

    bones.forEach(function(bone){
        console.log(bone.name);
        //bone.matrixAutoUpdate = false;
        //bone.setRotationFromAxisAngle ( new THREE.Vector3(1, 0, 0), 3.14/2 ) ;
        //bone.matrix = new THREE.Matrix4().makeTranslation(bone.position.x, bone.position.y, bone.position.z);
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
} );

function ProjScale(p_ms, cam_pos, src_d, dst_d) {
  let vec_cam2p = new THREE.Vector3().subVectors(p_ms, cam_pos);
  return new THREE.Vector3().addVectors(cam_pos, vec_cam2p.multiplyScalar(dst_d/src_d));
}

const rigRotation = (
  name,
  rotation = { x: 0, y: 0, z: 0 },
  dampener = 1,
  lerpAmount = 0.3
  ) => {
  const Part = skeleton.getBoneByName(name);
  if (!Part) {return}
  
  let euler = new THREE.Euler(
    -rotation.x * dampener,
    rotation.y * dampener,
    -rotation.z * dampener
  );
  let quaternion = new THREE.Quaternion().setFromEuler(euler);
  Part.quaternion.slerp(quaternion, lerpAmount); // interpolate
};

const rigPosition = (
  name,
  position = { x: 0, y: 0, z: 0 },
  dampener = 1,
  lerpAmount = 0.3
  ) => {
  const Part = skeleton.getBoneByName(name);
  if (!Part) {return}
  let vector = new THREE.Vector3(
    position.x * dampener,
    position.y * dampener,
    position.z * dampener
  );
  Part.position.lerp(vector, lerpAmount); // interpolate
};

function onResults2(results) {
  if (!results.poseLandmarks) {
    return;
  }
  
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  
  //let test = CalculateJointAngles.convert2dictionary(results.poseLandmarks);
  //console.log(test);
  //results.poseLandmarks
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

  //Kalidokit.Pose.solve(results.poseLandmarks, {
  //    runtime: "mediapipe", // `mediapipe` or `tfjs`
  //    video: videoElement,
  //    imageSize: { height: 462, width: 820 },
  //    enableLegs: true,
  //});

  //console.log("GG == ", results.poseLandmarks[19]);
  // Pose 3D Landmarks are with respect to Hip distance in meters
  // let poselm3d = [];
  results.poseLandmarks.forEach(function(landmark){
    //landmark.x = -(landmark.x - 0.5) * 2.0;
    //landmark.y = -(landmark.y - 0.5) * 2.0;
    //landmark.z = -landmark.z;
  });
  results.ea.forEach(function(landmark){
    //landmark.x = -landmark.x;
    //landmark.y = -landmark.y;
    //landmark.z = -landmark.z;
  });
  //console.log("GL == ", results.poseLandmarks[0].y);

//  let poselm3d = results.poseLandmarks;
  let poseRig = Kalidokit.Pose.solve(results.ea,results.poseLandmarks,{runtime:'mediapipe',imageSize:{width:820, height:462}});
  rigRotation("mixamorigHips", poseRig.Hips.rotation, 1.0);
  rigPosition(
    "mixamorigHips",
    {
      x: -poseRig.Hips.position.x * 100, // Reverse direction
      y: poseRig.Hips.position.y * 100 + 100, // Add a bit of height
      z: -poseRig.Hips.position.z * 100 // Reverse direction
    },
    1,
    0.9
  );
  
  // rigRotation("mixamorigSpine", poseRig.Spine, 1, .8);
  // rigRotation("mixamorigSpine1", poseRig.Spine, 1, .8);
  // rigRotation("mixamorigSpine2", poseRig.Spine, 1, .8);

  rigRotation("mixamorigLeftUpLeg", poseRig.LeftUpperLeg, 1, .8);
  rigRotation("mixamorigLeftLeg", poseRig.LeftLowerLeg, 1, .8);
  // rigRotation("mixamorigRightUpLeg", poseRig.RightUpperLeg, 1, .8);
  // rigRotation("mixamorigRightLeg", poseRig.RightLowerLeg, 1, .8);

  // rigRotation("mixamorigRightArm", poseRig.RightUpperArm, 1, .8);
  // rigRotation("mixamorigRightForeArm", poseRig.RightLowerArm, 1, .8);
  // rigRotation("mixamorigLeftArm", poseRig.LeftUpperArm, 1, .8);
  // rigRotation("mixamorigLeftForeArm", poseRig.LeftLowerArm, 1, .8);

  //console.log(poseRig.LeftUpperLeg);
  //console.log(poseRig.LeftLowerLeg);
  //console.log(poseRig);
  //let hips = skeleton.getBoneByName("mixamorigHips");
  //hips.position.set(-poseRig.Hips.position.x, poseRig.Hips.position.y + 10, -poseRig.Hips.position.z);
  //let mixamor_leftUpLeg = skeleton.getBoneByName("mixamorigLeftUpLeg");
  //let matT_leftUpLeg = new THREE.Matrix4().makeTranslation(mixamor_leftUpLeg.position.x, mixamor_leftUpLeg.position.y, mixamor_leftUpLeg.position.z);
  //console.log("1 ::: ", mixamor_leftUpLeg.position.x, mixamor_leftUpLeg.position.y, mixamor_leftUpLeg.position.z);
  //let mixamor_leftLeg = skeleton.getBoneByName("mixamorigLeftLeg");
  //let matT_leftLeg = new THREE.Matrix4().makeTranslation(mixamor_leftLeg.position.x, mixamor_leftLeg.position.y, mixamor_leftLeg.position.z);
  //console.log(mixamor_leftLeg);
  //console.log("2 ::: ", mixamor_leftLeg.position.x, mixamor_leftLeg.position.y, mixamor_leftLeg.position.z);
  // let mixamor_rightUpLeg = skeleton.getBoneByName("mixamorigRightUpLeg");
  // let matT_rightUpLeg = new THREE.Matrix4().makeTranslation(mixamor_rightUpLeg.position.x, mixamor_rightUpLeg.position.y, mixamor_rightUpLeg.position.z);
  // let mixamor_rightLeg = skeleton.getBoneByName("mixamorigRightLeg");
  // let matT_rightLeg = new THREE.Matrix4().makeTranslation(mixamor_rightLeg.position.x, mixamor_rightLeg.position.y, mixamor_rightLeg.position.z);
  //let euler_0 = new THREE.Matrix4().makeRotationX(poseRig.Hips.rotation.x)
  //new THREE.Euler( poseRig.Hips.rotation.x, poseRig.Hips.rotation.y, poseRig.Hips.rotation.z, 'XYZ' );
  let sv_euler_leftupleg = new THREE.Euler( poseRig.LeftUpperLeg.x, poseRig.LeftUpperLeg.y, poseRig.LeftUpperLeg.z, poseRig.LeftUpperLeg.rotationOrder ); // poseRig.LeftUpperLeg.rotationOrder
  let sv_euler_leftleg = new THREE.Euler( poseRig.LeftLowerLeg.x, poseRig.LeftLowerLeg.y, poseRig.LeftLowerLeg.z, poseRig.LeftLowerLeg.rotationOrder ); // poseRig.LeftLowerLeg.rotationOrder
  let sv_euler_rightupleg = new THREE.Euler( poseRig.RightUpperLeg.x, poseRig.RightUpperLeg.y, poseRig.RightUpperLeg.z, poseRig.RightUpperLeg.rotationOrder ); // poseRig.LeftUpperLeg.rotationOrder
  let sv_euler_rightleg = new THREE.Euler( poseRig.RightLowerLeg.x, poseRig.RightLowerLeg.y, poseRig.RightLowerLeg.z, poseRig.RightLowerLeg.rotationOrder ); // poseRig.LeftLowerLeg.rotationOrder
  //console.log(poseRig.LeftUpperLeg);
  //console.log(poseRig.RightLowerLeg);
  //let mat_rot_0 = new THREE.Matrix4().makeRotationFromEuler(euler_0);
  let sv_matR_leftupleg = new THREE.Matrix4().makeRotationFromEuler(sv_euler_leftupleg);
  let sv_matR_leftleg = new THREE.Matrix4().makeRotationFromEuler(sv_euler_leftleg);
  //let sv_matR_rightupleg = new THREE.Matrix4().makeRotationFromEuler(sv_euler_rightupleg);
  //let sv_matR_rightleg = new THREE.Matrix4().makeRotationFromEuler(sv_euler_rightleg);
  // let sv_matR_leftupleg = new THREE.Matrix4().makeRotationFromEuler(sv_euler_leftupleg);
  // let sv_matR_leftleg = new THREE.Matrix4().makeRotationFromEuler(sv_euler_leftleg);
  // let sv_matR_rightupleg = new THREE.Matrix4().makeRotationFromEuler(sv_euler_rightupleg);
  // let sv_matR_rightleg = new THREE.Matrix4().makeRotationFromEuler(sv_euler_rightleg);

  //let hips_yaw = new THREE.Matrix4().makeRotationZ(poseRig.Hips.rotation.z);
  //let hips_pitch = new THREE.Matrix4().makeRotationY(poseRig.Hips.rotation.y);
  //let hips_roll = new THREE.Matrix4().makeRotationX(poseRig.Hips.rotation.x);
  //console.log(poseRig.Hips);
  //let mat_rot_0 = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().multiplyMatrices(hips_roll, hips_pitch), hips_yaw);

  //hips.matrix.multiplyMatrices(mat_tln_0, mat_rot_0);
  //mixamor_leftUpLeg.matrix = matT_leftUpLeg;//.multiplyMatrices(sv_matR_leftupleg, matT_leftUpLeg);
  //mixamor_leftLeg.matrix = matT_leftLeg;//.multiplyMatrices(sv_matR_leftleg, matT_leftLeg);
  // mixamor_rightUpLeg.matrix.multiplyMatrices(sv_matR_rightupleg, matT_rightUpLeg);
  // mixamor_rightLeg.matrix.multiplyMatrices(sv_matR_rightleg, matT_rightLeg);
  //mixamor_leftUpLeg.setRotationFromEuler(sv_euler_leftupleg);
  //mixamor_leftLeg.setRotationFromEuler(sv_euler_leftleg);
    
  //console.log(bn_test.matrix);
  //bn_test.matrix = new THREE.Matrix4();

  //videoElement.pause();
  renderer.render( scene, camera_ar );
  canvasCtx.restore();
}

//const pose = new Pose({locateFile: (file) => {
//  return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
//}});
let holistic = new Holistic({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.4.1633559476/${file}`;
}});

//pose.setOptions({
//  modelComplexity: 1,
//  smoothLandmarks: true,
//  enableSegmentation: true,
//  smoothSegmentation: true,
//  minDetectionConfidence: 0.5,
//  minTrackingConfidence: 0.5
//});
//pose.onResults(onResults2);
holistic.onResults(onResults2);

videoElement.play();

async function detectionFrame() {
  //await pose.send({image: videoElement});
  await holistic.send({image: videoElement});
  videoElement.requestVideoFrameCallback(detectionFrame);
}

detectionFrame();