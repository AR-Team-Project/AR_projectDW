import * as THREE from '../node_modules/three/build/three.module.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
document.body.appendChild( renderer.domElement );

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 500 );
camera.position.set( 0, 0, 100 );
camera.up.set(0, 1, 0);
camera.lookAt( 0, 0, 0 );

const controls = new OrbitControls( camera, renderer.domElement );
controls.update();

const scene = new THREE.Scene();

const points = [];
points.push( new THREE.Vector3( - 10, 0, 0 ) );
points.push( new THREE.Vector3( 0, 10, 0 ) );
points.push( new THREE.Vector3( 10, 0, 0 ) );

const geometry = new THREE.BufferGeometry().setFromPoints( points );
const material = new THREE.LineBasicMaterial( { color: 0xFFFFff } );
const line = new THREE.Line( geometry, material );

const geometry_box = new THREE.BoxGeometry( 5, 5, 5 );
const texture = new THREE.TextureLoader().load( '../teximg.jpg' );
const material_box = new THREE.MeshBasicMaterial( { color:0xFFFFFF, map:texture } );
const box_mesh = new THREE.Mesh(geometry_box, material_box);
box_mesh.matrixAutoUpdate = false;

scene.add( line );
scene.add( box_mesh );

//document.addEventListener("click", modifyText, false);

function modifyText(e) {
    const t2 = document.getElementById("mytest");
    //box_mesh.position.set( 0, 0, 80 );
    //box_mesh.up.set(0, -1, 0);
    //box_mesh.lookAt( 0, 100, 100 );

    console.log("deg : " + THREE.MathUtils.degToRad(180))

    let mat_rot = new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(45))
    box_mesh.matrix = new THREE.Matrix4().makeTranslation(0, 0, 80).multiply(mat_rot);
  }


animate();
function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}
