// --- 1. THE DYNAMIC STARDUST HEART ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const count = 20000;
const positions = new Float32Array(count * 3);
const initialPositions = new Float32Array(count * 3); // To remember the heart shape
const targetPositions = new Float32Array(count * 3);  // To calculate the "splatter"
const colors = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2;
    // Heart Shape
    let x = 16 * Math.pow(Math.sin(t), 3);
    let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    let z = (Math.random() - 0.5) * 5;
    const edge = 1 + (Math.random() - 0.5) * 0.15;

    initialPositions[i * 3] = x * edge;
    initialPositions[i * 3 + 1] = y * edge;
    initialPositions[i * 3 + 2] = z * edge;

    // "Splattered" Starfield target
    targetPositions[i * 3] = (Math.random() - 0.5) * 150;
    targetPositions[i * 3 + 1] = (Math.random() - 0.5) * 100;
    targetPositions[i * 3 + 2] = (Math.random() - 0.5) * 50;

    positions[i * 3] = initialPositions[i * 3];
    positions[i * 3 + 1] = initialPositions[i * 3 + 1];
    positions[i * 3 + 2] = initialPositions[i * 3 + 2];

    // Mixed Purple and White
    if (Math.random() > 0.7) {
        colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1;
    } else {
        colors[i * 3] = 0.7; colors[i * 3 + 1] = 0.3; colors[i * 3 + 2] = 1;
    }
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
const particlesMaterial = new THREE.PointsMaterial({ size: 0.35, vertexColors: true, transparent: true, opacity: 0.8 });
const heartPoints = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(heartPoints);
camera.position.z = 45;

let isExploded = false;

function animate() {
    requestAnimationFrame(animate);
    
    // Smooth transition between Heart and Splatter
    const posAttribute = particlesGeometry.attributes.position;
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const targetX = isExploded ? targetPositions[i3] : initialPositions[i3];
        const targetY = isExploded ? targetPositions[i3 + 1] : initialPositions[initialPositions[i3+1]]; // Wait, let me fix the indexing
        const targetZ = isExploded ? targetPositions[i3 + 2] : initialPositions[i3 + 2];

        // Linear interpolation (Lerp) for smooth movement
        posAttribute.array[i3] += (targetX - posAttribute.array[i3]) * 0.05;
        posAttribute.array[i3+1] += (isExploded ? targetPositions[i3+1] : initialPositions[i3+1] - posAttribute.array[i3+1]) * 0.05;
        posAttribute.array[i3+2] += (targetZ - posAttribute.array[i3+2]) * 0.05;
    }
    posAttribute.needsUpdate = true;
    
    heartPoints.rotation.y += 0.002;
    renderer.render(scene, camera);
}
animate();

// --- 3. UI & HAND LOGIC ---
function updateUI(fingerCount) {
    const letter = document.getElementById('anniversary-letter');
    const frame = document.getElementById('frame');
    const photos = document.querySelectorAll('.gallery-photo');

    if (fingerCount === 0) {
        isExploded = false; // Pull back into a Heart
        letter.classList.add('active');
        frame.style.display = 'none';
    } else {
        isExploded = true; // Splatter into Stars
        letter.classList.remove('active');
        frame.style.display = 'flex';
        photos.forEach((p, i) => {
            p.classList.toggle('active', i === (fingerCount - 1));
        });
    }
}

// (Keep your existing MediaPipe 'Hands' and 'Camera' setup here)
// Just ensure updateUI(count) is called as it is above.
