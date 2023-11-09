import {
	AnimationAction,
	AnimationMixer,
	LoopOnce,
	LoopRepeat,
	Mesh,
	MeshLambertMaterial,
	Object3D,
	Vector2,
	Vector3,
} from "three";
import { Game } from "../../game";
import { randFloat } from "three/src/math/MathUtils";
import { Character, CharacterState } from "../Character";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { convertToLambert, libAnim } from "../../GameHelpers";

/**
 * Self Todo notes to learn-apply processes
 * 
 * @todo Make enemy rotate left/right (euler,LookAt like) [ undone ]
 * @todo Make enemy move to his forward - [ undone ]
 * @todo Get Player position as a target and rotate enemy against player and move towards player [ undone ]
 * 
 */

export class Enemy extends Character {
	
	direction: Vector3 = new Vector3();
	speed: number = 3;
	playerDetectingRadius: number = 0;
	initialrot: Vector3 = new Vector3();

	
	constructor(gltf: GLTF, enemyPos: Vector3 = new Vector3()) {
		super(gltf);

		this.initializeAnimations();
		this.model.position.copy(enemyPos);
		this.collider = this.CreateCollider();
		Game.game.cannonWorld.addBody(this.collider);
		this.model.getWorldDirection(this.initialrot);

		const mesh = this.model.getObjectByName("dummy_stong") as Mesh;
		mesh.castShadow = true;
		mesh.frustumCulled = false;

		convertToLambert(this.model);

		//Enemy animation behaviors seems like linked to his CharacterState's state
		// I set it to CharacterState.IDLE. Because Enemy must be stop at first according to case
		
		//this.setState(CharacterState.MOVE);
		this.setState(CharacterState.IDLE);
	}

	update(delta: number): void {
		super.update(delta);
		this.modelPosUpdate();
		this.stateUpdate();
	}

	stateUpdate() {
		// If hero is visible and dummy is not following him, change it's state to move
		// this.setState(CharacterState.MOVE);
		// Otherwise, change it's state to idle
	}

	modelPosUpdate() {
		let velX;
		let velZ;
		if (this.model && this.collider) {
			if (this.currentState == CharacterState.MOVE) {
				velX = this.direction.x * this.speed;
				velZ = this.direction.z * this.speed;
			} else {
				velX = 0;
				velZ = 0;
			}

			const colliderPosition = this.collider.position.clone();
			this.collider.velocity.set(velX, 0, velZ);
			this.collider.position.y = 1;

			this.model.position.z = colliderPosition.z;
			this.model.position.x = colliderPosition.x;
			this.model.position.y = colliderPosition.y - 1;
		}
	}

	initializeAnimations() {
		if (!this.mixer) return;
		// IDLE
		this.idleAnim = this.mixer.clipAction(libAnim("idle", this.gltf));
		this.idleAnim.setLoop(LoopRepeat, Infinity);
		this.idleAnim.play();
		this.currentAnimation = this.idleAnim;
		// MOVE
		this.moveAnim = this.mixer.clipAction(libAnim("walk", this.gltf));
		this.moveAnim.setLoop(LoopRepeat, Infinity);
	}
}
