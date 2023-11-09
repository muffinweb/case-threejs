import * as THREE from "three";
import CannonDebugRenderer from "./utils/cannonDebugRenderer";
import * as CANNON from "cannon-es";
import { Player } from "./characters/Player/Player";
import { Enemy } from "./characters/Enemies/Enemy";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { CameraController } from "./CameraController";
import { Walls } from "./Walls";
import { LightController } from "./LightController";
import Stats from "three/examples/jsm/libs/stats.module";
import { convertToLambert } from "./GameHelpers";

export class Game {
	static game: Game;
	scene: THREE.Scene;
	camera?: THREE.PerspectiveCamera;
	cameraControl?: CameraController;
	directionalLight?: THREE.DirectionalLight;
	lightControl?: LightController;
	player?: Player;
	walls?: Walls;
	cannonWorld: CANNON.World;
	enemiesArray: Enemy[] = [];
	renderer: THREE.WebGLRenderer;

	// Woah! Setting this true will be helpful!
	debugMode: boolean = true;
	
	stats?: Stats;
	cannonDebugRenderer?: CannonDebugRenderer;

	constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
		Game.game = this;
		this.renderer = renderer;
		this.scene = scene;
		this.cannonWorld = new CANNON.World();
		this.cannonWorld.gravity.set(0, 0, 0);

		if (this.debugMode) {
			this.cannonDebugRenderer = new CannonDebugRenderer(this.scene, this.cannonWorld);
			this.stats = Stats();
			document.body.appendChild(this.stats.dom);
		}

		this.loadScene();
	}

	loadScene(): void {
		const gltfLoader = new GLTFLoader();

		gltfLoader.load(
			"models/scene.glb",
			(gltf) => {
				console.log(gltf);
				this.scene.add(gltf.scene);

				convertToLambert(this.scene);

				this.walls = new Walls();
				// Setup camera
				this.camera = this.scene.getObjectByName("Camera") as THREE.PerspectiveCamera;
				this.camera.aspect = window.innerWidth / window.innerHeight;
				this.camera.updateProjectionMatrix();

				// Add ambient light
				const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
				this.scene.add(ambientLight);
				this.directionalLight = this.scene.getObjectByName(
					"DirectionalLight"
				) as THREE.DirectionalLight;
				
				//It seems like Enemies are scoped as enemiesArray
				//So if i need to create a new player or enemy just need to instantiate new one and append new enemy's object to enemiesArray 
				
				// Load player
				gltfLoader.load("models/player.glb", (gltf) => {
					console.log(gltf);
					this.player = new Player(gltf);
					this.cameraControl = new CameraController(this.camera!, this.player);
					this.lightControl = new LightController(this.player);
				});
				// Load enemies
				gltfLoader.load("models/enemy.glb", (gltf) => {
					console.log(gltf);

					const enemyPos = new THREE.Vector3(-5, 0, 0);

					//create enemy and attached his target player
					let enemyFirst = new Enemy(gltf, enemyPos);
					
					this.enemiesArray.push(enemyFirst);
				});

				// adding cameraController
			},
			(xhr) => {
				// console.log(xhr.loaded)
			},
			(error) => {
				console.log(error);
			}
		);
	}

	update(delta: number): void {
		this.cameraControl?.update();

		if (this.renderer && this.camera) this.renderer.render(this.scene, this.camera);

		this.cannonDebugRenderer?.update();
		this.cannonWorld.step(delta);

		if (this.player) this.player.update(delta);

		this.enemiesArray.forEach((value) => {
			value.update(delta);
		});

		this.stats?.update();
	}
}
