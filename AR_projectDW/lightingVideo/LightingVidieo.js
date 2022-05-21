import * as THREE from '../node_modules/three/build/three.module.js';
import {OrbitControls} from '../node_modules/three/examples/jsm/controls/OrbitControls.js'; //import map 사용해야 사용이 가능하다
import {TRIANGULATION} from './triangulation.js';

import {Line2} from '../node_modules/three/examples/jsm/lines/Line2.js';
import {LineMaterial} from '../node_modules/three/examples/jsm/lines/LineMaterial.js';
import {LineGeometry} from '../node_modules/three/examples/jsm/lines/LineGeometry.js';

//make two renderer
const renderer = new THREE.WebGLRenderer();
const renderer_w = 680 
const renderer_h = 480
renderer.setSize( renderer_w, renderer_h );  
renderer.setViewport(0,0,renderer_w, renderer_h); 
document.body.appendChild( renderer.domElement );
const renderer2 = new THREE.WebGLRenderer();
const renderer2_w = 680 
const renderer2_h = 480
renderer2.setSize( renderer2_w, renderer2_h );  
renderer2.setViewport(0,0,renderer2_w, renderer2_h); 
document.body.appendChild( renderer2.domElement );


const camera_ar = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 30, 300 ); // projection transform
camera_ar.position.set( 0, 0, 100);
camera_ar.lookAt( 0, 0, 0 );
camera_ar.up.set(0,1,0);
const camera_ar2 = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1500 ); // projection transform
camera_ar2.position.set( 100, 100, 200);
camera_ar2.lookAt( 0, 0, 0 );
camera_ar2.up.set(0,1,0);


const videoElement = document.getElementsByClassName('input_video')[0];

const scene = new THREE.Scene();
const texture_bg = new THREE.VideoTexture(videoElement);
scene.background = texture_bg;

const light = new THREE.DirectionalLight(0xffffff , 1.5);
const amb_light = new THREE.AmbientLight(0xffffff , 0.5);

//set light pos at near plane
let SS_init = new THREE.Vector3();
let PS_init = SS_init.set((0/window.innerWidth)*2-1,-(0/window.innerHeight)*2+1,-1);//SS to PS
let np_init = PS_init.unproject(camera_ar)
light.position.set(np_init.x,np_init.y,np_init.z); //vec를 input으로 받지않는다
scene.add(light)
scene.add(amb_light)

//add orbitcontrol
const controls = new OrbitControls(camera_ar2 ,renderer2.domElement );
controls.target.set(0,5,0)
controls.update();

//add helpers 
const cameraHelper = new THREE.CameraHelper(camera_ar);
scene.add(cameraHelper)
const lighthelper = new THREE.DirectionalLightHelper( light );
scene.add( lighthelper );

//add mesh
let oval_point_mesh = null 
let oval_line = new Line2()
let oval_line_geo = new LineGeometry()
let face_mesh_js = null //not facemesh from midpipe
let mesh_bg = new THREE.Mesh(); // far plane back ground

function ProjScale(p_ms, cam_pos, src_d, dst_d){
  let vec_cam2p = new THREE.Vector3().subVectors(p_ms, cam_pos)
  return new THREE.Vector3().addVectors(cam_pos, vec_cam2p.multiplyScalar(dst_d/src_d))
} //nearplane scale projscale

function onResults2(results) {

//far plane 위치 구하기   >>  이후 mesh_bg 위치 setting 
  let farplane_c = new THREE.Vector3(0,0,camera_ar.far) //far plane 위치 구하기
  let farplane_c2 = farplane_c.unproject(camera_ar)
  let farinWorld = camera_ar.localToWorld(farplane_c2)
   
  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
      
      if(oval_point_mesh == null){
        let oval_point_geo= new THREE.BufferGeometry(); 
        let face_geo =  new THREE.BufferGeometry();
        const num_oval_points = FACEMESH_FACE_OVAL.length;
        const oval_vertices = []

        for(let i = 0 ;i< num_oval_points;i++){
          const index = FACEMESH_FACE_OVAL[i][0];
          const pos_ns = landmarks[index];
          const pos_ps = new THREE.Vector3((pos_ns.x - 0.5)*2,-(pos_ns.y - 0.5)*2,pos_ns.z);
          let pos_ws = new THREE.Vector3(pos_ps.x,pos_ps.y,pos_ps.z).unproject(camera_ar);
          oval_vertices.push(pos_ws.x,pos_ws.y,pos_ws.z);
        }
        const oval_point_mat = new THREE.PointsMaterial({color: 0xFF0000, size:3});
        oval_point_geo.setAttribute('position', new THREE.Float32BufferAttribute(oval_vertices , 3))
        oval_point_mesh = new THREE.Points(oval_point_geo,oval_point_mat);        
 
        //make fat line
        let SS1 = new THREE.Vector3();
        let SS2 = new THREE.Vector3();
        let pix2OS = SS1.set(( 10 / window.innerWidth ) * 2 - 1,- ( 0 / window.innerHeight ) * 2 + 1,-1).unproject(camera_ar2) 
        let pix2OS2 = SS2.set(( 0 / window.innerWidth ) * 2 - 1,- ( 0 / window.innerHeight ) * 2 + 1,-1).unproject(camera_ar2) 
        let a = camera_ar2.localToWorld(pix2OS)
        let b = camera_ar2.localToWorld(pix2OS2)
        let aa = a.distanceTo(b)
        let oval_line_mat =  new LineMaterial( { 
        	color: 0x00ff00,
          linewidth: 100*aa, 
          dashed: false} );   
        oval_vertices.push(oval_vertices[0] , oval_vertices[1], oval_vertices[2] )
        oval_line_geo.setPositions(oval_vertices)
        oval_line_mat.resolution.set(window.innerWidth , window.innerHeight );
        oval_line = new Line2(oval_line_geo , oval_line_mat)

        //make face mesh
        let face_mat = new THREE.MeshPhongMaterial({color : 0xFFFFFF , specular: new THREE.Color(0,0,0), shinness : 1000})
        face_mesh_js = new THREE.Mesh(face_geo , face_mat) 
        face_mesh_js.geometry.setIndex(TRIANGULATION) 

        face_geo.setAttribute('position', new THREE.Float32BufferAttribute(landmarks.length*3, 3)) 
        face_geo.setAttribute('normal', new THREE.Float32BufferAttribute(landmarks.length*3, 3))
        face_geo.setAttribute('uv', new THREE.Float32BufferAttribute(landmarks.length*2, 2))

        scene.add(oval_point_mesh);
        scene.add(oval_line);  
        scene.add(face_mesh_js);  
      }

      //000의 점을 역추산
      const p_c = new THREE.Vector3(0,0,0).unproject(camera_ar)
      const vec_cam2center = new THREE.Vector3().subVectors(p_c, camera_ar.position)
      const center_dist = vec_cam2center.length() //pdf a 값 

      //per frame
      const num_oval_points = FACEMESH_FACE_OVAL.length;
      let positions = []
      
      //update fatline(line2) position 
      for(let i = 0 ;i< num_oval_points + 1;i++){
        let index
          if(i == num_oval_points){
            index =  FACEMESH_FACE_OVAL[0][0];
     
          }else{
            index = FACEMESH_FACE_OVAL[i][0];
          } //마지막 점 이어주기

          const pos_ns = landmarks[index]; 
          const pos_ps = new THREE.Vector3((pos_ns.x - 0.5)*2,-(pos_ns.y - 0.5)*2,pos_ns.z);
          let pos_ws = new THREE.Vector3(pos_ps.x,pos_ps.y,pos_ps.z).unproject(camera_ar);
          pos_ws = ProjScale(pos_ws , camera_ar.position, center_dist , 100.0)//100 b의 위치 on pdf
          positions.push(pos_ws.x , pos_ws.y,pos_ws.z)
      }
      oval_line_geo.setPositions(positions)
      oval_line.geometry.attributes.position.needsUpdate = true;

      //update point position 
      let positions_p = oval_point_mesh.geometry.attributes.position.array 
      for(let i = 0 ;i< num_oval_points ;i++){
          let index = FACEMESH_FACE_OVAL[i][0];
          const pos_ns = landmarks[index];
          const pos_ps = new THREE.Vector3((pos_ns.x - 0.5)*2,-(pos_ns.y - 0.5)*2,pos_ns.z);
          let pos_ws = new THREE.Vector3(pos_ps.x,pos_ps.y,pos_ps.z).unproject(camera_ar);
  
          pos_ws = ProjScale(pos_ws , camera_ar.position, center_dist , 100.0)//100 b의 위치 on pdf
  
          positions_p[3*i + 0] = pos_ws.x;
          positions_p[3*i + 1] = pos_ws.y;
          positions_p[3*i + 2] = pos_ws.z;
      }
      oval_point_mesh.geometry.attributes.position.needsUpdate = true;
      const num_points = landmarks.length;
    
      //update face mesh position 
      for(let i = 0 ;i< num_points ;i++){
        const pos_ns = landmarks[i];
        const pos_ps = new THREE.Vector3((pos_ns.x - 0.5)*2,-(pos_ns.y - 0.5)*2,pos_ns.z);
        let pos_ws = new THREE.Vector3(pos_ps.x,pos_ps.y,pos_ps.z).unproject(camera_ar);

        pos_ws = ProjScale(pos_ws , camera_ar.position, center_dist , 100.0)//100 b의 위치 on pdf

        face_mesh_js.geometry.attributes.position.array[3*i + 0] = pos_ws.x;
        face_mesh_js.geometry.attributes.position.array[3*i + 1] = pos_ws.y;
        face_mesh_js.geometry.attributes.position.array[3*i + 2] = pos_ws.z;
        face_mesh_js.geometry.attributes.uv.array[2*i + 0] = pos_ns.x;
        face_mesh_js.geometry.attributes.uv.array[2*i + 1] = 1.0 - pos_ns.y

      }
      //console.log(face_mesh_js)
      face_mesh_js.geometry.attributes.position.needsUpdate = true; 
      face_mesh_js.geometry.attributes.uv.needsUpdate = true; 
      face_mesh_js.geometry.computeVertexNormals();

      
      //render2 mesh_bg setting
      let texture_frame = new THREE.CanvasTexture(results.image) //texture from canvas
      face_mesh_js.material.map = texture_frame
      const material_bg = new THREE.MeshBasicMaterial( { map: texture_frame} );
      //camera far plane face mesh 사이거리   >>   비례식으로 far plane에서의 mesh_bg의 geometry 계산
      const ratio_far = camera_ar.far/camera_ar.getFocalLength()
      const geometry = new THREE.PlaneGeometry(camera_ar.getFilmWidth()*ratio_far,camera_ar.getFilmHeight()*ratio_far);

      mesh_bg = new THREE.Mesh( geometry, material_bg );
      let a = new THREE.Vector3(0,0,camera_ar.far);
      mesh_bg.position.set(0,0, -farinWorld.z) //WS 와 CS의 Z축 방향은 반대
      scene.add(mesh_bg)
    }
  }
  
  scene.background = texture_bg
  scene.remove(mesh_bg)
  scene.remove(lighthelper)
  scene.remove(cameraHelper)
  renderer.render(scene, camera_ar)
  
  scene.background  = false
  scene.add(mesh_bg)
  scene.add(lighthelper)
  scene.add(cameraHelper)
  renderer2.render(scene, camera_ar2)
  //canvasCtx.restore();
}

const faceMesh = new FaceMesh({locateFile: (file) => {
  return `../node_modules/@mediapipe/face_mesh/${file}`;
}});
faceMesh.setOptions({
  maxNumFaces: 1, //인식 사람수
  refineLandmarks: true, //iris(eye) tracking 
  minDetectionConfidence: 0.5, //너무 크게하면 confidence를 만족하는게 없어서 tacking을 안할수도있음
  minTrackingConfidence: 0.5
});
faceMesh.onResults(onResults2); //callbackfunc 

// const camera = new Camera(videoElement, {
//   onFrame: async () => { //work every frame
//     await faceMesh.send({image: videoElement});
//   },
//   width: 1280,
//   height: 720
// });
//camera.start(); should not work for video

videoElement.play(); 

async function detectionFrame(){ //work every frame
    await faceMesh.send({image: videoElement});
    videoElement.requestVideoFrameCallback(detectionFrame)
}

videoElement.requestVideoFrameCallback(detectionFrame)

//event handle 
let SS = new THREE.Vector3();
let ws ;  
let mouse_click = false  //눌린 상태인지 알기위해
manageEvent()

function manageEvent(){
    renderer.domElement.addEventListener("wheel",mouseWheel,false);
    renderer.domElement.addEventListener("mousedown", mouseDownHandler, false);
    renderer.domElement.addEventListener("mouseup", mouseUpHandler, false);
    renderer.domElement.addEventListener("mousemove", mouseMoveHandler, false);
};

function mouseWheel(e){
  camera_ar.near += e.deltaY* 0.01;
  camera_ar.updateProjectionMatrix();
  //2가 아닌 3~4로하면 np 전체에서 움직이지만 설명 불가 
  let PS = SS.set(e.clientX/window.innerWidth*2-1,-e.clientY/window.innerHeight*2+1,-1);//SS to PS
  let np = PS.unproject(camera_ar) //ps2np
  ws = np

  light.position.set(ws.x , ws.y , ws.z)

  //update helper 
  cameraHelper.update(); 
  lighthelper.update();
} 
function mouseDownHandler(e){
    mouse_click = true
  }
  
function mouseUpHandler(e){
    mouse_click = false
  }
function mouseMoveHandler(e){
    if(mouse_click){ //only work when mouse clicked
        //2가 아닌 3~4로하면 np 전체에서 움직이지만 설명 불가 
        let PS = SS.set(e.clientX/window.innerWidth*2-1,-e.clientY/window.innerHeight*2+1,-1);//SS to PS
        let np = PS.unproject(camera_ar)
        ws = np

        light.position.set(ws.x , ws.y , ws.z)

        cameraHelper.update();
        lighthelper.update();
    }
  }

  