import * as THREE from '../node_modules/three/build/three.module.js';
import {OrbitControls} from '../node_modules/three/examples/jsm/controls/OrbitControls.js'; //import map 사용해야 사용이 가능하다


const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );  
renderer.setViewport(0,0,window.innerWidth, window.innerHeight); 
document.body.appendChild( renderer.domElement );

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 500 ); // projection transform
camera.position.set( 0, 0, 5);
camera.lookAt( 0, 0, 0 );
camera.up.set(0,1,0);

const texture = new THREE.TextureLoader().load('./coverist_icon.jpg');
const geo_box = new THREE.BoxGeometry(1,1,1);
const material_box = new THREE.MeshPhongMaterial({map : texture , color: 0xffffff, emissive : 0x131313, specular: 0x010101, shininess : 500});
const boxObj = new THREE.Mesh(geo_box,material_box);

//creating orbit control
const controls = new OrbitControls( camera, renderer.domElement ); // 이제부터 카메라는 안건드림 control 이 관리하게 된다
controls.update()


//defalut setting(obj) 
boxObj.position.set(0,0,0);
boxObj.up.set(0,1,0);
boxObj.lookAt(0,0,-1); 

//light setting
const light = new THREE.DirectionalLight(0xffffff, 0.1);
const light2 = new THREE.AmbientLight(0x303030);
const light3 = new THREE.PointLight( 0xf2f2f2, 1, 100 );
light3.position.set( 30, 30, 30 );
light.position.set(0,30,0);

let rotation_angle = [0,0,0];
let translation_distance = [0,0];

scene.add(light);
scene.add(light2);
scene.add(light3);
scene.add(boxObj);

manageEvent();
animate();

renderer.render( scene, camera );

function manageEvent(){
    document.addEventListener("keypress",manageAngle1,false);
    document.addEventListener("keypress",manageAngle2,false);
};

function manageAngle1(e){

    //SS 에서의 두점 구해 
    let SS1 = new THREE.Vector3();
    let SS2 = new THREE.Vector3();
    let pix2OS = SS1.set(( 10 / window.innerWidth ) * 2 - 1,- ( 0 / window.innerHeight ) * 2 + 1,-1).unproject(camera) 
    let pix2OS2 = SS2.set(( 0 / window.innerWidth ) * 2 - 1,- ( 0 / window.innerHeight ) * 2 + 1,-1).unproject(camera) 
    let aa = pix2OS.distanceTo(pix2OS2)
    //비례식을 이용하여 아래 연산으로 pix2WS를 업데이트 해준다
    pix2OS =(camera.localToWorld(new THREE.Vector3()).distanceTo(boxObj.localToWorld(new THREE.Vector3())))*aa;
    console.log(pix2OS)
    switch (e.key){
        case "r" : rotation_angle[0] += 3;break
        case "t" : rotation_angle[1] += 3;break
        case "y" : rotation_angle[2] += 3;break
        case "f" : rotation_angle[0] -= 3;break
        case "g" : rotation_angle[1] -= 3;break
        case "h" : rotation_angle[2] -= 3;break
        
        case "a" : translation_distance[0] -= pix2OS;break
        case "d" : translation_distance[0] += pix2OS;break
        case "w" : translation_distance[1] += pix2OS;break
        case "s" : translation_distance[1] -= pix2OS;break
    }; 
    boxObj.matrixAutoUpdate = false;

    let mat_rX = new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(rotation_angle[0])); //행렬식 연산도 가능
    let mat_rY = new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(rotation_angle[1]));
    let mat_rZ = new THREE.Matrix4().makeRotationZ(THREE.MathUtils.degToRad(rotation_angle[2]));
    let mat_t = new THREE.Matrix4().makeTranslation(translation_distance[0],translation_distance[1],0);
    
    let mat_tranformation = new THREE.Matrix4();
    mat_tranformation = mat_rX.multiply(mat_rY).multiply(mat_rZ);
    mat_tranformation = new THREE.Matrix4().multiplyMatrices(mat_t,mat_tranformation); //순서 유의
    boxObj.matrix = mat_tranformation; //boxObj matrix update

    let a = boxObj.localToWorld(new THREE.Vector3()).project(camera);  
    console.log((a.x+1)/2*window.innerWidth ,(a.y-1)/2*window.innerHeight );//console에 10이 찍히는지 확인
};


function manageAngle2(e){ //메소드 이용 최소화 행렬연산 사용 ver

    //SS 에서의 두점 구해 
    let SS1 = new THREE.Vector3();
    let SS2 = new THREE.Vector3();
    let pix2OS = SS1.set(( 10 / window.innerWidth ) * 2 - 1,- ( 0 / window.innerHeight ) * 2 + 1,-1).unproject(camera) 
    let pix2OS2 = SS2.set(( 0 / window.innerWidth ) * 2 - 1,- ( 0 / window.innerHeight ) * 2 + 1,-1).unproject(camera) 
    let aa = pix2OS.distanceTo(pix2OS2)
    //비례식을 이용하여 아래 연산으로 pix2WS를 업데이트 해준다
    pix2OS =(camera.localToWorld(new THREE.Vector3()).distanceTo(boxObj.localToWorld(new THREE.Vector3())))*aa;
    
    switch (e.key){
        case "R" : rotation_angle[0] += 3;break
        case "T" : rotation_angle[1] += 3;break
        case "Y" : rotation_angle[2] += 3;break
        case "F" : rotation_angle[0] -= 3;break
        case "G" : rotation_angle[1] -= 3;break
        case "H" : rotation_angle[2] -= 3;break
        
        case "A" : translation_distance[0] -= pix2OS;break
        case "D" : translation_distance[0] += pix2OS;break
        case "W" : translation_distance[1] += pix2OS;break
        case "S" : translation_distance[1] -= pix2OS;break
    }; 
    boxObj.matrixAutoUpdate = false;

    let x1 = Math.sin(THREE.MathUtils.degToRad(rotation_angle[0]));
    let x2 = Math.cos(THREE.MathUtils.degToRad(rotation_angle[0]));
    let y1 = Math.sin(THREE.MathUtils.degToRad(rotation_angle[1]));
    let y2 = Math.cos(THREE.MathUtils.degToRad(rotation_angle[1]));
    let z1 = Math.sin(THREE.MathUtils.degToRad(rotation_angle[2]));
    let z2 = Math.cos(THREE.MathUtils.degToRad(rotation_angle[2]));

    let mat_xr = new THREE.Matrix4().set(
        1,0,0,0,
        0,x2,-x1,0,
        0,x1,x2,0,
        0,0,0,1
    )
    let mat_yr = new THREE.Matrix4().set(
        y2,0,y1,0,
        0,1,0,0,
        -y1,0,y2,0,
        0,0,0,1
    )
    let mat_zr = new THREE.Matrix4().set(
        z2,-z1,0,0,
        z1,z2,-0,0,
        0,0,1,0,
        0,0,0,1
    )
    let mat_t  = new THREE.Matrix4().set(
        1,0,0,translation_distance[0],
        0,1,0,translation_distance[1],
        0,0,1,0,
        0,0,0,1
    )

    let mat_tranformation = new THREE.Matrix4();
    mat_tranformation = mat_xr.multiply(mat_yr).multiply(mat_zr);
    mat_tranformation = new THREE.Matrix4().multiplyMatrices(mat_t,mat_tranformation); //순서 유의
    boxObj.matrix = mat_tranformation; //boxObj matrix update

    let a = boxObj.localToWorld(new THREE.Vector3()).project(camera);  
    console.log((a.x+1)/2*window.innerWidth ,(a.y-1)/2*window.innerHeight );//console에 10이 찍히는지 확인
};
function animate(){ 
    requestAnimationFrame(animate);
    renderer.render(scene,camera);
};