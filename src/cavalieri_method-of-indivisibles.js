import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let segmentsSlider, offsetSlider;
let segments = 5;
let offset = 0;
let h = 200;
let objects = [];
let currentShape = 'cuboid';

const cuboidButton = document.getElementById('cuboidButton');
const cylinderButton = document.getElementById('cylinderButton');
const coneButton = document.getElementById('coneButton');

function init() {
    // Scene, Camera, Renderer 설정
    const sceneContainer = document.getElementById('scene-container');
    const containerWidth = sceneContainer.clientWidth;
    const containerHeight = sceneContainer.clientHeight;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(containerWidth, containerHeight);
    sceneContainer.appendChild(renderer.domElement);

    // OrbitControls 설정
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI;
    controls.minPolarAngle = -Math.PI / 2;
    controls.minAzimuthAngle = 0;
    controls.maxAzimuthAngle = 0;
    controls.enablePan = false;

    // 슬라이더 설정
    segmentsSlider = document.getElementById('segments');
    offsetSlider = document.getElementById('offset');

    segmentsSlider.addEventListener('input', updateValues);
    offsetSlider.addEventListener('input', updateValues);

    // 조명 설정
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 0, 500).normalize();
    scene.add(light);

    // 조명 설정
    const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
    scene.add(hemisphereLight);

    // 카메라 위치 설정
    camera.position.z = 400;

    // 초기 버튼 활성화
    cuboidButton.classList.add('active');

    updateValues();
    animate();
}

function clearScene() {
    objects.forEach(obj => scene.remove(obj));
    objects = [];
}

function createCuboids() {
    const baseWidth = 100;
    const depth = 50;
    const baseHeight = h / segments;

    // 첫 번째 사각기둥
    objects.push(createCuboid(150, -100, baseWidth, h, depth, 0xcc6666));

    // 두 번째 이동된 사각기둥 더미
    for (let i = 0; i < segments; i++) {
        let y = -h / 2 + i * baseHeight;
        let color = new THREE.Color(`hsl(${(i / segments) * 360}, 100%, 50%)`);
        objects.push(createCuboid(-150 + i * (offset / segments), y, baseWidth, baseHeight, depth, color));
    }
}

function createCuboid(x, y, w, h, d, color) {
    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = new THREE.MeshPhongMaterial({ color });
    const cuboid = new THREE.Mesh(geometry, material);

    cuboid.position.set(x + w / 2, y + h / 2, -d / 2);
    scene.add(cuboid);
    return cuboid;
}

function createCylinders() {
    const baseRadius = 50;
    const depth = 50;
    const baseHeight = h / segments;

    // 첫 번째 원기둥
    objects.push(createCylinder(180, -100, baseRadius, h, depth, 0xcc6666));

    // 두 번째 이동된 원기둥 더미
    for (let i = 0; i < segments; i++) {
        let y = -h / 2 + i * baseHeight;
        let color = new THREE.Color(`hsl(${(i / segments) * 360}, 100%, 50%)`);
        objects.push(createCylinder(-120 + i * (offset / segments), y, baseRadius, baseHeight, depth, color));
    }
}

function createCylinder(x, y, radius, height, d, color) {
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
    const material = new THREE.MeshPhongMaterial({ color });
    const cylinder = new THREE.Mesh(geometry, material);

    cylinder.position.set(x + radius / 2, y + height / 2, -d / 2);
    scene.add(cylinder);
    return cylinder;
}

function createCones() {
    const baseRadius = 50;
    const depth = 50;
    const baseHeight = h / segments;

    // 오른쪽 원뿔(변하지 않는 원뿔)
    objects.push(createCone(200, -h / 2, baseRadius, h, depth, 0xcc6666));

    if (segments === 1) {
        // 왼쪽 원뿔(세그먼트가 1일 때)
        objects.push(createCone(-100, -h / 2, baseRadius, h, depth, 0xcc6666));
    } else {
        let lastTopRadius = baseRadius;
        let lastY = -h / 2 - baseHeight / 2;
        for (let i = 1; i < segments; i++) {
            let topRadius = baseRadius * (1 - i / segments);
            let color = new THREE.Color(`hsl(${(i / segments) * 360}, 100%, 50%)`);
            let xOffset = i * (offset / segments);
            objects.push(createTruncatedCone(-100 + xOffset, lastY + baseHeight / 2, topRadius, lastTopRadius, baseHeight, depth, color));
            lastTopRadius = topRadius;
            lastY += baseHeight;
        }

        // 마지막 원뿔을 맨 위에 생성
        objects.push(createCone(-100 + offset * 0.995, lastY + baseHeight / 2, lastTopRadius, baseHeight, depth, 0xcc6666));
    }
}

function createCone(x, y, radius, height, d, color) {
    const geometry = new THREE.ConeGeometry(radius, height, 32);
    const material = new THREE.MeshPhongMaterial({ color });
    const cone = new THREE.Mesh(geometry, material);

    cone.position.set(x, y + height / 2, -d / 2);
    scene.add(cone);
    return cone;
}

function createTruncatedCone(x, y, topRadius, bottomRadius, height, d, color) {
    const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, 32);
    const material = new THREE.MeshPhongMaterial({ color });
    const truncatedCone = new THREE.Mesh(geometry, material);

    truncatedCone.position.set(x, y + height / 2, -d / 2);
    scene.add(truncatedCone);
    return truncatedCone;
}

function updateValues() {
    segments = parseInt(segmentsSlider.value);
    offset = parseInt(offsetSlider.value);
    clearScene();
    if (currentShape === 'cuboid') {
        createCuboids();
    } else if (currentShape === 'cylinder') {
        createCylinders();
    } else if (currentShape === 'cone') {
        createCones();
    }
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

function setActiveButton(activeButton) {
    [cuboidButton, cylinderButton, coneButton].forEach(btn => {
        btn.classList.remove('active');
    });
    activeButton.classList.add('active');
}

cuboidButton.addEventListener('click', () => {
    currentShape = 'cuboid';
    setActiveButton(cuboidButton);
    updateValues();
});

cylinderButton.addEventListener('click', () => {
    currentShape = 'cylinder';
    setActiveButton(cylinderButton);
    updateValues();
});

coneButton.addEventListener('click', () => {
    currentShape = 'cone';
    setActiveButton(coneButton);
    updateValues();
});

init();

