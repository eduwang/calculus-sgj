import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'lil-gui';

let scene, camera, renderer, controls;
let currentStep = 0;
const r = 1.5; // 반지름
let animationClock; // 애니메이션용 Clock
let animationObjects = []; // 애니메이션 대상 객체들

// 1단계: 원
let circle2D, circleLine, gridHelper, labelR, label2r, labelMinus2r;

// 2단계: 3D 도형
let cylinder, topCone, bottomCone, sphere, sphereWireframe;
let partialCircle, partialCircleLine; // 원의 일부
let partialSphere, partialSphereWireframe; // 구의 일부
let partialCone, partialConeWireframe; // 원뿔의 일부
let coneEndCircle, coneEndCircleLine; // 원뿔 끝단 원 (x=t 위치)
let partialCylinder, partialCylinderWireframe; // 원기둥의 일부
let gui; // lil-gui

// 3단계: 이동된 도형
let movedSphere, movedSphereWireframe, movedTopCone, movedBottomCone;
let animatedSphere, animatedSphereWireframe, animatedCone; // 애니메이션 대상
let animationProgress = 0; // 애니메이션 진행도 (0~1)
let isAnimating = false; // 애니메이션 중인지
let animationParams; // GUI 파라미터 객체

// UI 요소
let step1Btn, step2Btn, step3Btn, formulaPanel;

function init() {
    // Scene, Camera, Renderer 설정
    const sceneContainer = document.getElementById('scene-container');
    const containerWidth = sceneContainer.clientWidth;
    const containerHeight = sceneContainer.clientHeight;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, containerWidth / containerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setClearColor(0xf5f5f5, 1);
    renderer.setSize(containerWidth, containerHeight);
    sceneContainer.appendChild(renderer.domElement);

    // OrbitControls 설정
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.panSpeed = 0.3;
    controls.screenSpacePanning = false;

    // 조명 설정
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    hemisphereLight.position.set(0, 200, 0);
    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // 카메라 위치 설정 (기본값, showStep에서 단계별로 조정)
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, 0);

    // UI 요소 가져오기
    step1Btn = document.getElementById('step1-btn');
    step2Btn = document.getElementById('step2-btn');
    step3Btn = document.getElementById('step3-btn');
    formulaPanel = document.getElementById('formula-panel');

    // 버튼 이벤트
    step1Btn.addEventListener('click', () => showStep(1));
    step2Btn.addEventListener('click', () => showStep(2));
    step3Btn.addEventListener('click', () => showStep(3));

    // MathJax 로드 대기 후 초기 상태 표시
    waitForMathJax(() => {
        showStep(1);
    });

    animate();
}

function waitForMathJax(callback) {
    if (window.MathJax && (window.MathJax.typesetPromise || window.MathJax.Hub)) {
        callback();
    } else {
        // MathJax가 로드될 때까지 대기
        const checkInterval = setInterval(() => {
            if (window.MathJax && (window.MathJax.typesetPromise || window.MathJax.Hub)) {
                clearInterval(checkInterval);
                callback();
            }
        }, 100);
        
        // 최대 5초 대기
        setTimeout(() => {
            clearInterval(checkInterval);
            callback(); // 타임아웃 후에도 실행
        }, 5000);
    }
}

function showStep(step) {
    currentStep = step;
    
    // 모든 객체 제거
    clearScene();

    // 버튼 활성화 상태 업데이트
    [step1Btn, step2Btn, step3Btn].forEach(btn => btn.classList.remove('active'));
    if (step === 1) step1Btn.classList.add('active');
    if (step === 2) step2Btn.classList.add('active');
    if (step === 3) step3Btn.classList.add('active');

    // 단계별 카메라 위치 설정
    if (step === 1) {
        // 1단계: xy 평면을 수직으로 내려다보기 (데카르트 평면)
        if (gui) {
            gui.destroy();
            gui = null;
        }
        camera.position.set(0, 0, 8);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.update();
        showStep1();
    } else if (step === 2) {
        // 2단계: 1단계 그림 유지 + x 슬라이더로 원의 일부만 표시
        camera.position.set(0, 0, 8);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.update();
        showStep1(); // 1단계 그림 그리기
        showStep2(); // x 슬라이더 추가 및 부분 원 표시
    } else if (step === 3) {
        // 3단계: 3D 뷰 유지
        if (gui) {
            gui.destroy();
            gui = null;
        }
        camera.position.set(0, 0, 8);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.update();
        showStep1();
        showStep2();
        showStep3();
    }
}

function showStep1() {
    // 수식 표시
    document.getElementById('formula-step1').style.display = 'block';
    document.getElementById('formula-step2').style.display = 'none';
    document.getElementById('formula-step3').style.display = 'none';
    typesetMath();

    // 2D 원 그리기 (xy 평면에)
    const circleGeometry = new THREE.CircleGeometry(r, 64);
    const circleMaterial = new THREE.MeshBasicMaterial({
        color: 0x4a90e2,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    circle2D = new THREE.Mesh(circleGeometry, circleMaterial);
    // rotation 제거 - xy 평면에 그리기
    circle2D.position.set(r, 0, 0);
    scene.add(circle2D);

    // 원의 외곽선
    const circleLineGeometry = new THREE.RingGeometry(r - 0.01, r + 0.01, 64);
    const circleLineMaterial = new THREE.MeshBasicMaterial({
        color: 0x1e3a8a,
        side: THREE.DoubleSide
    });
    circleLine = new THREE.Mesh(circleLineGeometry, circleLineMaterial);
    // rotation 제거 - xy 평면에 그리기
    circleLine.position.set(r, 0, 0);
    scene.add(circleLine);

    // xy 평면에 격자 표시 (GridHelper는 기본적으로 xz 평면에 있으므로 x축 중심으로 90도 회전)
    // 더 연한 색상과 더 촘촘한 격자 (크기 10, 40개 선)
    gridHelper = new THREE.GridHelper(10, 40, 0xcccccc, 0xe0e0e0);
    gridHelper.rotation.x = Math.PI / 2; // x축 중심으로 90도 회전하여 xy 평면에 배치
    gridHelper.position.set(0, 0, 0);
    gridHelper.name = 'gridHelper'; // 이름을 지정하여 나중에 찾을 수 있도록
    scene.add(gridHelper);

    // (r, 0, 0) 위치에 "r" 텍스트 표시
    const canvasR = document.createElement('canvas');
    const contextR = canvasR.getContext('2d');
    canvasR.width = 128;
    canvasR.height = 64;
    
    contextR.fillStyle = '#1a1a1a';
    contextR.font = 'Bold 32px Arial';
    contextR.textAlign = 'center';
    contextR.textBaseline = 'middle';
    contextR.fillText('r', canvasR.width / 2, canvasR.height / 2);
    
    const textureR = new THREE.CanvasTexture(canvasR);
    const spriteMaterialR = new THREE.SpriteMaterial({ map: textureR });
    labelR = new THREE.Sprite(spriteMaterialR);
    labelR.scale.set(0.5, 0.25, 1);
    labelR.position.set(r, 0, 0);
    scene.add(labelR);

    // (2r, 0, 0) 위치에 "2r" 텍스트 표시
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 64;
    
    context.fillStyle = '#1a1a1a';
    context.font = 'Bold 32px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('2r', canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    label2r = new THREE.Sprite(spriteMaterial);
    label2r.scale.set(0.5, 0.25, 1);
    label2r.position.set(2 * r, 0, 0);
    scene.add(label2r);

    // 좌표축 표시
    drawAxes();
}

function showStep2() {
    // 수식 패널 업데이트
    document.getElementById('formula-step1').style.display = 'none';
    document.getElementById('formula-step2').style.display = 'block';
    document.getElementById('formula-step3').style.display = 'none';
    typesetMath();

    // 축과 격자 다시 추가 (clearScene에서 제거되었을 수 있으므로)
    // 매번 확인하여 없으면 추가 (GUI 조작 중에도 유지되도록)
    const existingAxes = scene.getObjectByName('axesHelper');
    if (!existingAxes) {
        drawAxes();
    }
    
    // gridHelper 확인 및 추가
    let existingGrid = null;
    scene.traverse((object) => {
        if (object instanceof THREE.GridHelper && object.name === 'gridHelper') {
            existingGrid = object;
        }
    });
    
    if (!existingGrid) {
        gridHelper = new THREE.GridHelper(10, 40, 0xcccccc, 0xe0e0e0);
        gridHelper.rotation.x = Math.PI / 2;
        gridHelper.position.set(0, 0, 0);
        gridHelper.name = 'gridHelper';
        scene.add(gridHelper);
    } else {
        gridHelper = existingGrid; // 기존 격자 참조 유지
    }

    // 1단계의 원을 숨김 (일부만 표시할 것이므로)
    if (circle2D) circle2D.visible = false;
    if (circleLine) circleLine.visible = false;

    // 원의 일부를 그리기 위한 초기값 설정
    const params = {
        x: 0
    };

    // lil-gui 설정
    gui = new GUI();
    let isUpdating = false; // 업데이트 중 플래그로 중복 호출 방지
    gui.add(params, 'x', 0, 2 * r, 0.01).name('x 값').onChange((value) => {
        if (isUpdating) return; // 이미 업데이트 중이면 무시
        isUpdating = true;
        updatePartialCircle(value);
        updatePartialSphere(value);
        updatePartialCone(value);
        updatePartialCylinder(value);
        isUpdating = false;
    });

    // 초기 원의 일부 그리기
    updatePartialCircle(0);
    updatePartialSphere(0);
    updatePartialCone(0);
    updatePartialCylinder(0);
}

function updatePartialCircle(t) {
    // 기존 부분 원 제거
    if (partialCircle) scene.remove(partialCircle);
    if (partialCircleLine) scene.remove(partialCircleLine);

    // 원의 방정식: (x-r)²+y²=r²
    // 중심이 (r, 0)이고 반지름이 r인 원
    // x가 0부터 t까지일 때만 그리기
    
    const points = [];
    const numPoints = 200; // 충분히 많은 점으로 부드러운 곡선
    
    for (let i = 0; i <= numPoints; i++) {
        const x = (t / numPoints) * i; // 0부터 t까지
        const xRelative = x - r; // 중심을 기준으로 한 상대 좌표
        
        // y² = r² - (x-r)²
        const ySquared = r * r - xRelative * xRelative;
        
        if (ySquared >= 0) {
            const y = Math.sqrt(ySquared);
            points.push(new THREE.Vector3(x, y, 0));
            if (i > 0 && i < numPoints) {
                // 아래쪽 반원도 추가
                points.push(new THREE.Vector3(x, -y, 0));
            }
        }
    }
    
    if (points.length > 0) {
        // 곡선 그리기
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0x1e3a8a, linewidth: 2 });
        partialCircleLine = new THREE.Line(geometry, material);
        scene.add(partialCircleLine);
        
        // 면 채우기 (선택사항)
        if (points.length >= 3) {
            // 원점과 연결하여 면 만들기
            const fillPoints = [new THREE.Vector3(0, 0, 0), ...points];
            const fillGeometry = new THREE.BufferGeometry().setFromPoints(fillPoints);
            const fillMaterial = new THREE.MeshBasicMaterial({
                color: 0x4a90e2,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            partialCircle = new THREE.Mesh(fillGeometry, fillMaterial);
            scene.add(partialCircle);
        }
    }
}

function updatePartialSphere(t) {
    // 기존 부분 구 제거 (partialSphereWireframe에 포함된 Line들만 제거)
    if (partialSphereWireframe && Array.isArray(partialSphereWireframe)) {
        partialSphereWireframe.forEach(line => {
            if (line && line.parent) {
                scene.remove(line);
            }
        });
        partialSphereWireframe = null;
    }

    // 중심이 (r, 0, 0)이고 반지름이 r인 구
    // x가 0부터 t까지일 때만 표시
    
    // 구를 여러 개의 원형 단면으로 나누어 표시
    const numSlices = 20; // 성능을 위해 20개로 줄임
    const circlePoints = 24; // 성능을 위해 24개로 줄임
    const allLines = []; // 모든 선을 저장하여 나중에 제거할 수 있도록
    
    for (let slice = 0; slice <= numSlices; slice++) {
        const x = (t / numSlices) * slice; // 0부터 t까지
        
        if (x >= 0 && x <= t) {
            // x 위치에서의 원의 반지름 계산
            // (x-r)² + y² + z² = r²
            // y² + z² = r² - (x-r)²
            const xRelative = x - r;
            const radiusAtX = Math.sqrt(Math.max(0, r * r - xRelative * xRelative));
            
            if (radiusAtX > 0.01) { // 너무 작은 원은 제외
                // 이 x 위치에서의 원을 여러 점으로 나누어 표시
                const points = [];
                for (let i = 0; i <= circlePoints; i++) {
                    const angle = (i / circlePoints) * 2 * Math.PI;
                    const y = radiusAtX * Math.cos(angle);
                    const z = radiusAtX * Math.sin(angle);
                    points.push(new THREE.Vector3(x, y, z));
                }
                
                // 원의 외곽선 그리기
                const circleGeometry = new THREE.BufferGeometry().setFromPoints(points);
                const circleMaterial = new THREE.LineBasicMaterial({ color: 0x1e3a8a });
                const circle = new THREE.Line(circleGeometry, circleMaterial);
                scene.add(circle);
                allLines.push(circle);
            }
        }
    }
    
    // x 방향으로 연결하는 선들 (구의 표면을 따라) - 성능을 위해 일부만
    if (numSlices > 0 && t > 0) {
        const numConnectingLines = 8; // 연결선도 줄임
        for (let i = 0; i <= numConnectingLines; i++) {
            const angleIndex = Math.floor((i / numConnectingLines) * circlePoints);
            const linePoints = [];
            for (let j = 0; j <= numSlices; j++) {
                const x = (t / numSlices) * j;
                if (x >= 0 && x <= t) {
                    const xRelative = x - r;
                    const radiusAtX = Math.sqrt(Math.max(0, r * r - xRelative * xRelative));
                    
                    if (radiusAtX > 0.01) {
                        const angle = (angleIndex / circlePoints) * 2 * Math.PI;
                        const y = radiusAtX * Math.cos(angle);
                        const z = radiusAtX * Math.sin(angle);
                        linePoints.push(new THREE.Vector3(x, y, z));
                    }
                }
            }
            
            if (linePoints.length > 1) {
                const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
                const lineMaterial = new THREE.LineBasicMaterial({ color: 0x1e3a8a });
                const line = new THREE.Line(lineGeometry, lineMaterial);
                scene.add(line);
                allLines.push(line);
            }
        }
    }
    
    // 나중에 제거하기 위해 저장
    partialSphereWireframe = allLines;
}

function updatePartialCone(t) {
    // 기존 부분 원뿔 제거
    if (partialConeWireframe && Array.isArray(partialConeWireframe)) {
        partialConeWireframe.forEach(line => {
            if (line && line.parent) {
                scene.remove(line);
            }
        });
        partialConeWireframe = null;
    }
    
    // x=t 위치의 yz 평면에 원 제거
    if (coneEndCircle) {
        scene.remove(coneEndCircle);
        coneEndCircle = null;
    }
    if (coneEndCircleLine) {
        scene.remove(coneEndCircleLine);
        coneEndCircleLine = null;
    }

    // y=x를 x축 기준으로 회전한 원뿔
    // x가 0부터 t까지일 때만 표시
    // 각 x 위치에서의 반지름은 x (y=x이므로)
    
    const numSlices = 15; // 성능을 위해 15개로 더 줄임
    const circlePoints = 20; // 성능을 위해 20개로 더 줄임
    const allLines = [];
    
    for (let slice = 0; slice <= numSlices; slice++) {
        const x = (t / numSlices) * slice; // 0부터 t까지
        
        if (x >= 0 && x <= t && x > 0.01) { // x가 0이면 반지름이 0이므로 제외
            // x 위치에서의 원의 반지름은 x
            const radiusAtX = x;
            
            // 이 x 위치에서의 원을 여러 점으로 나누어 표시
            const points = [];
            for (let i = 0; i <= circlePoints; i++) {
                const angle = (i / circlePoints) * 2 * Math.PI;
                const y = radiusAtX * Math.cos(angle);
                const z = radiusAtX * Math.sin(angle);
                points.push(new THREE.Vector3(x, y, z));
            }
            
            // 원의 외곽선 그리기 (다른 색상 - 주황색)
            const circleGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const circleMaterial = new THREE.LineBasicMaterial({ color: 0xff8c00 });
            const circle = new THREE.Line(circleGeometry, circleMaterial);
            scene.add(circle);
            allLines.push(circle);
        }
    }
    
    // x 방향으로 연결하는 선들 (원뿔의 표면을 따라) - 성능을 위해 일부만
    if (numSlices > 0 && t > 0) {
        const numConnectingLines = 6; // 연결선도 더 줄임
        for (let i = 0; i <= numConnectingLines; i++) {
            const linePoints = [];
            const angleIndex = Math.floor((i / numConnectingLines) * circlePoints);
            for (let j = 0; j <= numSlices; j++) {
                const x = (t / numSlices) * j;
                if (x >= 0 && x <= t && x > 0.01) {
                    const radiusAtX = x;
                    const angle = (angleIndex / circlePoints) * 2 * Math.PI;
                    const y = radiusAtX * Math.cos(angle);
                    const z = radiusAtX * Math.sin(angle);
                    linePoints.push(new THREE.Vector3(x, y, z));
                }
            }
            
            if (linePoints.length > 1) {
                const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
                const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff8c00 });
                const line = new THREE.Line(lineGeometry, lineMaterial);
                scene.add(line);
                allLines.push(line);
            }
        }
    }
    
    // x=t 위치의 yz 평면에 원 그리기
    if (t > 0.01) {
        const radiusAtT = t;
        
        // 원형 단면 (반투명)
        const endCircleGeometry = new THREE.CircleGeometry(radiusAtT, circlePoints);
        const endCircleMaterial = new THREE.MeshBasicMaterial({
            color: 0xff8c00,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        coneEndCircle = new THREE.Mesh(endCircleGeometry, endCircleMaterial);
        coneEndCircle.rotation.y = Math.PI / 2; // yz 평면에 배치
        coneEndCircle.position.set(t, 0, 0);
        scene.add(coneEndCircle);
        
        // 원의 외곽선
        const endCircleLineGeometry = new THREE.RingGeometry(radiusAtT - 0.01, radiusAtT + 0.01, circlePoints);
        const endCircleLineMaterial = new THREE.MeshBasicMaterial({
            color: 0xff8c00,
            side: THREE.DoubleSide
        });
        coneEndCircleLine = new THREE.Mesh(endCircleLineGeometry, endCircleLineMaterial);
        coneEndCircleLine.rotation.y = Math.PI / 2; // yz 평면에 배치
        coneEndCircleLine.position.set(t, 0, 0);
        scene.add(coneEndCircleLine);
    }
    
    // 나중에 제거하기 위해 저장
    partialConeWireframe = allLines;
}

function updatePartialCylinder(t) {
    // 기존 부분 원기둥 제거
    if (partialCylinderWireframe && Array.isArray(partialCylinderWireframe)) {
        partialCylinderWireframe.forEach(line => {
            if (line && line.parent) {
                scene.remove(line);
            }
        });
        partialCylinderWireframe = null;
    }

    // x=0일 때와 x=2r일 때, y²+z²=(2r)²를 밑면으로 하는 원기둥
    // x가 0부터 t까지일 때만 표시
    // 각 x 위치에서의 원의 반지름은 항상 2r (원기둥이므로)
    
    const numSlices = 15; // 성능을 위해 15개로 더 줄임
    const circlePoints = 20; // 성능을 위해 20개로 더 줄임
    const allLines = [];
    const cylinderRadius = 2 * r; // 원기둥의 반지름은 2r
    
    for (let slice = 0; slice <= numSlices; slice++) {
        const x = (t / numSlices) * slice; // 0부터 t까지
        
        if (x >= 0 && x <= t) {
            // x 위치에서의 원의 반지름은 항상 2r
            const radiusAtX = cylinderRadius;
            
            // 이 x 위치에서의 원을 여러 점으로 나누어 표시
            const points = [];
            for (let i = 0; i <= circlePoints; i++) {
                const angle = (i / circlePoints) * 2 * Math.PI;
                const y = radiusAtX * Math.cos(angle);
                const z = radiusAtX * Math.sin(angle);
                points.push(new THREE.Vector3(x, y, z));
            }
            
            // 원의 외곽선 그리기 (다른 색상 - 녹색)
            const circleGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const circleMaterial = new THREE.LineBasicMaterial({ color: 0x32cd32 });
            const circle = new THREE.Line(circleGeometry, circleMaterial);
            scene.add(circle);
            allLines.push(circle);
        }
    }
    
    // x 방향으로 연결하는 선들 (원기둥의 표면을 따라) - 성능을 위해 일부만
    if (numSlices > 0 && t > 0) {
        const numConnectingLines = 6; // 연결선도 더 줄임
        for (let i = 0; i <= numConnectingLines; i++) {
            const linePoints = [];
            const angleIndex = Math.floor((i / numConnectingLines) * circlePoints);
            for (let j = 0; j <= numSlices; j++) {
                const x = (t / numSlices) * j;
                if (x >= 0 && x <= t) {
                    const radiusAtX = cylinderRadius;
                    const angle = (angleIndex / circlePoints) * 2 * Math.PI;
                    const y = radiusAtX * Math.cos(angle);
                    const z = radiusAtX * Math.sin(angle);
                    linePoints.push(new THREE.Vector3(x, y, z));
                }
            }
            
            if (linePoints.length > 1) {
                const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
                const lineMaterial = new THREE.LineBasicMaterial({ color: 0x32cd32 });
                const line = new THREE.Line(lineGeometry, lineMaterial);
                scene.add(line);
                allLines.push(line);
            }
        }
    }
    
    // x=t 위치의 yz 평면에 원 그리기 (원기둥 끝단)
    if (t > 0.01) {
        // 원형 단면 (반투명)
        const endCircleGeometry = new THREE.CircleGeometry(cylinderRadius, circlePoints);
        const endCircleMaterial = new THREE.MeshBasicMaterial({
            color: 0x32cd32,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const endCircle = new THREE.Mesh(endCircleGeometry, endCircleMaterial);
        endCircle.rotation.y = Math.PI / 2; // yz 평면에 배치
        endCircle.position.set(t, 0, 0);
        scene.add(endCircle);
        allLines.push(endCircle);
        
        // 원의 외곽선
        const endCircleLineGeometry = new THREE.RingGeometry(cylinderRadius - 0.01, cylinderRadius + 0.01, circlePoints);
        const endCircleLineMaterial = new THREE.MeshBasicMaterial({
            color: 0x32cd32,
            side: THREE.DoubleSide
        });
        const endCircleLine = new THREE.Mesh(endCircleLineGeometry, endCircleLineMaterial);
        endCircleLine.rotation.y = Math.PI / 2; // yz 평면에 배치
        endCircleLine.position.set(t, 0, 0);
        scene.add(endCircleLine);
        allLines.push(endCircleLine);
    }
    
    // 나중에 제거하기 위해 저장
    partialCylinderWireframe = allLines;
}

function showStep3() {
    // 수식 패널 업데이트
    document.getElementById('formula-step1').style.display = 'none';
    document.getElementById('formula-step2').style.display = 'none';
    document.getElementById('formula-step3').style.display = 'block';
    typesetMath();

    // GUI 생성 (애니메이션 진행도 조절용)
    if (gui) {
        gui.destroy();
        gui = null;
    }
    
    animationParams = {
        progress: 0, // 0~1 사이의 애니메이션 진행도
        autoPlay: false // 자동 재생 여부
    };
    
    gui = new GUI();
    gui.add(animationParams, 'progress', 0, 1, 0.01).name('애니메이션 진행도').onChange((value) => {
        animationProgress = value;
        isAnimating = false; // 슬라이더 조작 시 자동 재생 중지
        animationParams.autoPlay = false; // 자동 재생 체크박스도 해제
        updateAnimationFromProgress();
    });
    gui.add(animationParams, 'autoPlay').name('자동 재생').onChange((value) => {
        isAnimating = value;
        if (value) {
            animationClock = new THREE.Clock();
        }
    });

    // 기존 애니메이션 객체 제거
    if (animatedSphere) scene.remove(animatedSphere);
    if (animatedSphereWireframe) scene.remove(animatedSphereWireframe);
    if (animatedCone) scene.remove(animatedCone);

    // x=2r일 때의 도형 생성 (2단계의 최종 상태)
    // updatePartialSphere, updatePartialCone, updatePartialCylinder를 사용하여 x=2r 상태 생성
    updatePartialSphere(2 * r);
    updatePartialCone(2 * r);
    updatePartialCylinder(2 * r); // 원기둥도 추가 (이동 없음)
    
    // 애니메이션용 구 생성 (전체 구를 사용)
    const sphereGeometry = new THREE.SphereGeometry(r, 32, 32);
    const sphereMaterial = new THREE.MeshPhongMaterial({
        color: 0x4a90e2,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    animatedSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    animatedSphere.position.set(r, 0, 0); // 초기 위치: 중심이 (r, 0, 0)
    scene.add(animatedSphere);

    const sphereWireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x1e3a8a,
        wireframe: true
    });
    animatedSphereWireframe = new THREE.Mesh(sphereGeometry, sphereWireframeMaterial);
    animatedSphereWireframe.position.set(r, 0, 0);
    scene.add(animatedSphereWireframe);

    // 애니메이션용 원뿔 생성 (전체 원뿔을 사용)
    // 원뿔의 꼭짓점이 원점에 있고, 높이가 2r, 밑면 반지름이 2r
    const coneGeometry = new THREE.ConeGeometry(2 * r, 2 * r, 32);
    const coneMaterial = new THREE.MeshBasicMaterial({
        color: 0xff8c00,
        wireframe: true
    });
    animatedCone = new THREE.Mesh(coneGeometry, coneMaterial);
    animatedCone.rotation.z = Math.PI / 2; // x축 방향으로 회전
    animatedCone.position.set(r, 0, 0); // 초기 위치: 중심이 (r, 0, 0)
    scene.add(animatedCone);

    // (-2r, 0, 0) 위치에 "-2r" 텍스트 표시
    if (labelMinus2r) {
        scene.remove(labelMinus2r);
    }
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 64;
    
    context.fillStyle = '#1a1a1a';
    context.font = 'Bold 32px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('-2r', canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    labelMinus2r = new THREE.Sprite(spriteMaterial);
    labelMinus2r.scale.set(0.5, 0.25, 1);
    labelMinus2r.position.set(-2 * r, 0, 0);
    scene.add(labelMinus2r);

    // 카메라를 z축 기준으로 -90도 회전
    camera.position.set(0, 0, 8);
    camera.rotation.z = -Math.PI / 2; // z축 기준 -90도 회전
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();

    // 애니메이션 초기화
    animationProgress = 0;
    isAnimating = false; // 기본적으로 자동 재생 안 함
    animationClock = new THREE.Clock();
}

function updateAnimation() {
    if (currentStep !== 3) return;
    if (!animatedSphere || !animatedCone) return;

    // 자동 재생 중일 때만 진행도 업데이트
    if (isAnimating) {
        const elapsed = animationClock.getElapsedTime();
        const duration = 3; // 애니메이션 지속 시간 (초)
        
        // 0~1 사이의 진행도 계산 (반복)
        animationProgress = (elapsed % duration) / duration;
        
        // GUI의 슬라이더 값도 업데이트
        if (gui && animationParams) {
            animationParams.progress = animationProgress;
        }
    }
    
    updateAnimationFromProgress();
}

function updateAnimationFromProgress() {
    if (currentStep !== 3) return;
    if (!animatedSphere || !animatedCone) return;
    
    // 애니메이션이 진행되면 원래 위치의 부분 도형들을 숨김
    const shouldHide = animationProgress > 0;
    
    // partialSphereWireframe은 배열
    if (partialSphereWireframe && Array.isArray(partialSphereWireframe)) {
        partialSphereWireframe.forEach(line => {
            if (line) line.visible = !shouldHide;
        });
    }
    
    // partialConeWireframe은 배열
    if (partialConeWireframe && Array.isArray(partialConeWireframe)) {
        partialConeWireframe.forEach(line => {
            if (line) line.visible = !shouldHide;
        });
    }
    
    // coneEndCircle과 coneEndCircleLine은 단일 객체
    if (coneEndCircle) coneEndCircle.visible = !shouldHide;
    if (coneEndCircleLine) coneEndCircleLine.visible = !shouldHide;
    
    // 구 애니메이션: z축 기준 시계방향으로 90도 회전, (r,0,0) -> (-2r,r,0)으로 평행이동
    // 초기 위치: (r, 0, 0), 최종 위치: (-2r, r, 0)
    // 초기 회전: 0, 최종 회전: -90도 (시계방향)
    const sphereRotation = -animationProgress * Math.PI / 2; // z축 기준 시계방향 90도
    const sphereX = r + animationProgress * (-2 * r - r); // r -> -2r
    const sphereY = 0 + animationProgress * (r - 0); // 0 -> r
    const sphereZ = 0;
    
    if (animatedSphere) {
        animatedSphere.rotation.z = sphereRotation;
        animatedSphere.position.set(sphereX, sphereY, sphereZ);
    }
    if (animatedSphereWireframe) {
        animatedSphereWireframe.rotation.z = sphereRotation;
        animatedSphereWireframe.position.set(sphereX, sphereY, sphereZ);
    }
    
    // 원뿔 애니메이션: z축 기준 반시계방향으로 90도 회전, (r,0,0) -> (-2r, -r, 0)으로 이동
    // 초기 위치: (r, 0, 0), 최종 위치: (-2r, -r, 0)
    // 초기 회전: z축 기준 90도 (x축 방향), 최종 회전: z축 기준 90도 - 90도 = 0도 (반시계방향)
    const coneRotation = Math.PI / 2 - animationProgress * Math.PI / 2; // z축 기준 반시계방향 90도
    const coneX = r + animationProgress * (-2 * r - r); // r -> -2r
    const coneY = 0 + animationProgress * (-r - 0); // 0 -> -r
    const coneZ = 0;
    
    if (animatedCone) {
        animatedCone.rotation.z = coneRotation;
        animatedCone.position.set(coneX, coneY, coneZ);
    }
}

function drawAxes() {
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.name = 'axesHelper'; // 이름을 지정하여 나중에 찾을 수 있도록
    scene.add(axesHelper);
}

function clearScene() {
    const objectsToRemove = [];
    scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.AxesHelper || object instanceof THREE.GridHelper || object instanceof THREE.Sprite || object instanceof THREE.Line) {
            objectsToRemove.push(object);
        }
    });
    objectsToRemove.forEach(obj => scene.remove(obj));
    
    // 부분 원 변수 초기화
    partialCircle = null;
    partialCircleLine = null;
    partialSphere = null;
    // partialSphereWireframe은 배열이므로 각 요소를 제거
    if (partialSphereWireframe && Array.isArray(partialSphereWireframe)) {
        partialSphereWireframe.forEach(line => {
            if (line && line.parent) {
                scene.remove(line);
            }
        });
    }
    partialSphereWireframe = null;
    // partialConeWireframe도 배열이므로 각 요소를 제거
    if (partialConeWireframe && Array.isArray(partialConeWireframe)) {
        partialConeWireframe.forEach(line => {
            if (line && line.parent) {
                scene.remove(line);
            }
        });
    }
    partialConeWireframe = null;
    // 원뿔 끝단 원도 제거
    if (coneEndCircle) {
        scene.remove(coneEndCircle);
        coneEndCircle = null;
    }
    if (coneEndCircleLine) {
        scene.remove(coneEndCircleLine);
        coneEndCircleLine = null;
    }
    // 원기둥도 제거
    if (partialCylinderWireframe && Array.isArray(partialCylinderWireframe)) {
        partialCylinderWireframe.forEach(line => {
            if (line && line.parent) {
                scene.remove(line);
            }
        });
    }
    partialCylinderWireframe = null;
    // 애니메이션 객체 제거
    if (animatedSphere) {
        scene.remove(animatedSphere);
        animatedSphere = null;
    }
    if (animatedSphereWireframe) {
        scene.remove(animatedSphereWireframe);
        animatedSphereWireframe = null;
    }
    if (animatedCone) {
        scene.remove(animatedCone);
        animatedCone = null;
    }
    // -2r 라벨 제거
    if (labelMinus2r) {
        scene.remove(labelMinus2r);
        labelMinus2r = null;
    }
    isAnimating = false;
}

function typesetMath() {
    // MathJax가 로드될 때까지 기다린 후 typeset
    const tryTypeset = () => {
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([formulaPanel]).then(() => {
                console.log('MathJax typeset completed');
            }).catch((err) => {
                console.error('MathJax typeset error:', err);
                // 재시도
                setTimeout(tryTypeset, 200);
            });
        } else if (window.MathJax && window.MathJax.Hub) {
            // MathJax 2.x 호환
            window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, formulaPanel]);
        } else {
            // MathJax가 아직 로드되지 않았으면 재시도
            setTimeout(tryTypeset, 100);
        }
    };
    
    // 즉시 시도
    tryTypeset();
    
    // 추가로 여러 번 시도 (MathJax 로드 대기)
    setTimeout(tryTypeset, 200);
    setTimeout(tryTypeset, 500);
    setTimeout(tryTypeset, 1000);
    setTimeout(tryTypeset, 2000);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    
    // 3단계 애니메이션 업데이트
    if (currentStep === 3 && isAnimating) {
        updateAnimation();
    }
    
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
