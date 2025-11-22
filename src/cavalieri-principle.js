import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let mixer, action;

function init() {
    // Scene, Camera, Renderer 설정
    const sceneContainer = document.getElementById('scene-container');
    const containerWidth = sceneContainer.clientWidth;
    const containerHeight = sceneContainer.clientHeight;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setClearColor(0xf5f5f5, 1); // 밝은 회색 배경
    renderer.setSize(containerWidth, containerHeight);
    sceneContainer.appendChild(renderer.domElement);

    // OrbitControls 설정
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minPolarAngle = -Math.PI / 2;
    controls.minAzimuthAngle = 0;
    controls.maxAzimuthAngle = 0;
    controls.enablePan = true;
    controls.panSpeed = 0.3;
    controls.screenSpacePanning = false;
    
    // pan 범위 제한
    const maxPanDistance = 150;
    const initialCameraX = camera.position.x;
    
    controls.addEventListener('change', () => {
        const currentX = camera.position.x;
        if (Math.abs(currentX - initialCameraX) > maxPanDistance) {
            camera.position.x = initialCameraX + Math.sign(currentX - initialCameraX) * maxPanDistance;
        }
    });

    // 조명 추가
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    hemisphereLight.position.set(0, 200, 0);
    scene.add(hemisphereLight);

    // 카메라 위치 설정 (초기 polar angle 30도)
    const initialDistance = 5;
    const initialPolarAngle = Math.PI / 3; // 0도
    camera.position.x = initialDistance * Math.sin(initialPolarAngle);
    camera.position.y = initialDistance * Math.cos(initialPolarAngle);
    camera.position.z = 0;

    // GLTF 모델 로드
    const loader = new GLTFLoader();
    loader.load(
        '/3dmodels/cavalieri_new.gltf',
        function (gltf) {
            const model = gltf.scene;
            model.scale.set(0.8, 0.8, 0.8);
            model.position.set(0, 0, 0);
            model.rotation.set(0, -Math.PI / 2, 0);
            scene.add(model);

            // 애니메이션이 있는 경우
            if (gltf.animations && gltf.animations.length) {
                mixer = new THREE.AnimationMixer(gltf.scene);
                action = mixer.clipAction(gltf.animations[0]);
                const targetTime = gltf.animations[0].duration;

                const sliderController = document.querySelector('#slider-panel');
                sliderController.min = 0.02;
                sliderController.max = targetTime * 0.99;
                
                sliderController.addEventListener('input', () => {
                    const sliderValue = parseFloat(sliderController.value);
                    if (mixer) {
                        mixer.setTime(sliderValue);
                        mixer.update(0);
                    }
                    if (action) {
                        action.play();
                    }
                });
            }
        },
        undefined,
        function (error) {
            console.error('An error happened', error);
        }
    );

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    const sceneContainer = document.getElementById('scene-container');
    const containerWidth = sceneContainer.clientWidth;
    const containerHeight = sceneContainer.clientHeight;
    
    camera.aspect = containerWidth / containerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(containerWidth, containerHeight);
}

window.addEventListener('resize', onWindowResize, false);

init();

