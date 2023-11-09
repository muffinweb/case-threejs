import { Box } from "cannon-es";
import {
	AnimationAction,
	AnimationMixer,
	BoxGeometry,
	DoubleSide,
	LoopOnce,
	LoopRepeat,
	Mesh,
	MeshBasicMaterial,
	Object3D,
	PlaneGeometry,
	Vector2,
	Vector3,
} from "three";
import { Game } from "../../game";
import { Character, CharacterState, CharactersTypes } from "../Character";
import { convertToLambert, libAnim, rotateTo } from "../../GameHelpers";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";

export class Player extends Character {
	speed: number = 4;
	targetRotation?: number;
	rotationSpeed: number = 6;
	angleY: number = 0;
	isMoving: boolean = false;
	moveDirection = new Vector2();
	keyMap: { [key: string]: boolean } = {};
	onDocumentKey = (e: KeyboardEvent) => {
		this.keyMap[e.code] = e.type === "keydown";
	};
	constructor(gltf: GLTF) {
		super(gltf);
		this.model.rotateY(-Math.PI / 2);
		this.initializeAnimations();
		this.type = CharactersTypes.PLAYER;
		this.collider = this.CreateCollider();
		Game.game.cannonWorld.addBody(this.collider);
		document.addEventListener("keydown", this.onDocumentKey, false);
		document.addEventListener("keyup", this.onDocumentKey, false);

		const mesh = this.model.getObjectByName("thug") as Mesh;
		mesh.castShadow = true;
		mesh.frustumCulled = false;

		convertToLambert(this.model);
	}

	update(delta: number): void {
		super.update(delta);
		this.buttonListener(delta);
		this.moveModel(delta);
		this.stateUpdate();
	}

	stateUpdate() {
		if (this.isMoving === false && this.currentState != CharacterState.IDLE) {
			this.setState(CharacterState.IDLE);
		} else if (this.isMoving === true && this.currentState != CharacterState.MOVE) {
			this.setState(CharacterState.MOVE);
		}
	}

	moveModel(delta: number) {
		if (!this.collider) return;

		let directionSpeed = new Vector2(0, 0);
		if (this.currentState == CharacterState.MOVE) {
			directionSpeed.x = -this.moveDirection.x;
			directionSpeed.y = -this.moveDirection.y;
		}

		this.collider.velocity.set(directionSpeed.x * this.speed, 0, directionSpeed.y * this.speed);
		this.collider.position.y = 1;

		const colliderPos = this.collider.position.clone();
		this.model.position.z = colliderPos.z;
		this.model.position.x = colliderPos.x;
		
		if (Game.game.cameraControl) Game.game.cameraControl.cameraMove(delta, colliderPos);
		if (Game.game.lightControl) Game.game.lightControl.update();

		this.targetRotation = -directionSpeed.angle() + Math.PI * 0.5;

		if (directionSpeed.length() > 0)
			this.model.rotation.set(
				0,
				rotateTo(this.model.rotation.y, this.targetRotation, this.rotationSpeed * delta),
				0
			);
	}

	buttonListener(delta: number) {
		let pressed = false;
		const startMultiplier = 2;
		if (this.keyMap["KeyW"] || this.keyMap["ArrowUp"]) {
			if (this.moveDirection.x < 1) this.moveDirection.x += delta * startMultiplier;
			this.isMoving = true;
			pressed = true;
		}
		if (this.keyMap["KeyS"] || this.keyMap["ArrowDown"]) {
			if (this.moveDirection.x > -1) this.moveDirection.x -= delta * startMultiplier;
			this.isMoving = true;
			pressed = true;
		}
		if (this.keyMap["KeyA"] || this.keyMap["ArrowLeft"]) {
			if (this.moveDirection.y > -1.0) this.moveDirection.y -= delta * startMultiplier;
			this.isMoving = true;
			pressed = true;
		}
		if (this.keyMap["KeyD"] || this.keyMap["ArrowRight"]) {
			if (this.moveDirection.y < 1.0) this.moveDirection.y += delta * startMultiplier;
			this.isMoving = true;
			pressed = true;
		}

		if (!pressed) {
			const stopMultiplier = 5;
			if (this.moveDirection.x > 0) {
				this.moveDirection.x -= delta * stopMultiplier;
			}
			if (this.moveDirection.x < 0) {
				this.moveDirection.x += delta * stopMultiplier;
			}
			if (this.moveDirection.y > 0) {
				this.moveDirection.y -= delta * stopMultiplier;
			}
			if (this.moveDirection.y < 0) {
				this.moveDirection.y += delta * stopMultiplier;
			}
			this.isMoving = false;
		}
	}

	rotatingPlayer(direction: Vector3) {
		let rotDir = direction.clone();
		if (rotDir.length() == 0) {
			return;
		}
		rotDir;
		rotDir.normalize();
		const angleY = Math.atan2(rotDir.z, rotDir.x);
		this.angleY = angleY;
	}

	initializeAnimations() {
		if (!this.mixer) return;

		// IDLE
		this.idleAnim = this.mixer.clipAction(libAnim("IDLE", this.gltf));
		this.idleAnim.setLoop(LoopRepeat, Infinity);
		this.idleAnim.play();
		this.currentAnimation = this.idleAnim;
		// MOVE
		this.moveAnim = this.mixer.clipAction(libAnim("RUN", this.gltf));
		this.moveAnim.setLoop(LoopRepeat, Infinity);
	}
}
