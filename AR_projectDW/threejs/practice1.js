import * as THREE from '../node_modules/three/build/three.module.js';

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );  
renderer.setViewport(0,0,window.innerWidth, window.innerHeight); // 나머지 파라미터 기억안남
document.body.appendChild( renderer.domElement );

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 500 ); // projection transform
camera.position.set( 0, 0, 100 );
camera.lookAt( 0, 0, 0 );
camera.up.set(0,1,0)

const points = [];
points.push( new THREE.Vector3( - 10, 0, 0 ) );
points.push( new THREE.Vector3( 0, 10, 0 ) );
points.push( new THREE.Vector3( 10, 0, 0 ) );

const geometry = new THREE.BufferGeometry().setFromPoints( points ); 
const material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
const line = new THREE.Line( geometry, material );


const geo_box = new THREE.BoxGeometry(25,25,25);
const material_box = new THREE.MeshPhongMaterial({color: 0xffffff, emissive : 0x131300, specular:0xFF0000, shininess : 1000});
//basic 이 아니라 light 필요!  map : texture , color : diffuse
//ao means ambient occlution
const boxObj = new THREE.Mesh(geo_box,material_box);

//defalut setting (identity matrix)
line.position.set(0,0,0);
line.up.set(0,1,0);
line.lookAt(0,0,-1); //obj에 시점에서 보는것


//light setting
const light = new THREE.DirectionalLight(0xffffff, 0.5); 

/*
line.matrixAutoUpdate = false; //false로 해주어야 직접 matrix 설정이 가능하다
let mat_r = new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(-50))
line.matrix = new THREE.Matrix4().makeTranslation(0,10,0).multiply(mat_r); //기하학적으로는 rotation이후 translation한꼴 opengl
*/
//const line2 = line.copy(); //call by reference 이기때문에 
boxObj.matrixAutoUpdate = false;
let mat_r2 = new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(50))
boxObj.matrix = new THREE.Matrix4().makeTranslation(0,10,0).multiply(mat_r2); //기하학적으로는 rotation이후 translation한꼴 opengl

scene.add(light)
scene.add(boxObj);
//scene.add( line );
renderer.render( scene, camera );

// document.addEventListener("click",modifyText,fasle);

// function modifyText(e){
//     const t2 = document.getElementById("mytest");
//     t2.textContent = "> <"
// }

// //cube에 skin 주기
// function animate(){ 
//     requestAnimationFrame(animate);
//     renderer.render(scene,camera);
// }