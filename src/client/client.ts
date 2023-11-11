import * as THREE from "three";
import { Game } from "./game/game";

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.physicallyCorrectLights = false;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMappingExposure = 0.85;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const game = new Game(scene, renderer);

// this is recalculate browser width/height values and helps good rendering after changing browser window's size through mouse
window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
	if (game.camera) {
		game.camera.aspect = window.innerWidth / window.innerHeight;
		game.camera.updateProjectionMatrix();
	}

	renderer.setSize(window.innerWidth, window.innerHeight);
	render();
}

const clock = new THREE.Clock();

function animate() {
	requestAnimationFrame(animate);
	const delta = Math.min(clock.getDelta(), 0.1);

	game.update(delta);

	render();
}

function render() {
	if (game.camera) {
		renderer.render(scene, game.camera);
	}
}
animate();
