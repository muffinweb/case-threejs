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
	BoxGeometry,
	Triangle,
	MeshBasicMaterial,
	BufferGeometry,
	SphereGeometry,
	MeshPhongMaterial
} from "three";
import { Game } from "../../game";
import { randFloat } from "three/src/math/MathUtils";
// I expected CharactersTypes are able to define which character mesh skin to attach. But it seems like it just a definition
// When I search under /src folder 'CharacterTypes' string i didn't see any defination that makes mesh according to defined character Type variable

import { Character, CharacterState, CharactersTypes } from "../Character";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { convertToLambert, libAnim } from "../../GameHelpers";
import { Player } from "../Player/Player";
import { Sphere } from "cannon-es";
/**
 * Self Todo notes to learn-apply processes
 * 
 * @todo Get Collide data when player/enemy collide each other
 * @todo Make enemy rotate left/right (euler,LookAt like) [ undone ]
 * @todo Make enemy move to his forward - [ undone ]
 * @todo Get Player position as a target and rotate enemy against player and move towards player [ undone ]
 * 
 */

export class Enemy extends Character {
	
	direction: Vector3 = new Vector3();
	speed: number = 3;
	angleY: number = 0;
	playerDetectingRadius: number = 4;
	initialrot: Vector3 = new Vector3();

	// we need to collided player's data to catch or rotate against him first
	targetPlayer?: Player
	
	constructor(gltf: GLTF, enemyPos: Vector3 = new Vector3()) {
		super(gltf);

		this.initializeAnimations();
		this.model.position.copy(enemyPos);
		
		this.collider = this.CreateCollider();
		Game.game.cannonWorld.addBody(this.collider);

		const ball = new SphereGeometry();
		const mat = new MeshPhongMaterial({color: "#ff0000"})
		const triangleMesh = new Mesh(ball, mat);

		this.model.attach(triangleMesh);
		Game.game.scene.add(triangleMesh);

		this.model.getWorldDirection(this.initialrot);

		const mesh = this.model.getObjectByName("dummy_stong") as Mesh;
		mesh.castShadow = true;
		mesh.frustumCulled = false;

		convertToLambert(this.model);

		//Enemy animation behaviors seems like linked to his CharacterState's state
		// I set it to CharacterState.IDLE. Because Enemy must be stop at first according to case
		
		//this.setState(CharacterState.MOVE);
		this.setState(CharacterState.IDLE);

		this.collider?.addEventListener('collide', function(event: any){
			//This block will be fired when this Cannon.Body collides
			console.log(event.target.initPosition);
		})
	}

	update(delta: number): void {
		super.update(delta);
		this.modelPosUpdate();
		this.stateUpdate();
	}

	rotateToTarget(directionToTarget: Vector3){
		// I use rotatePlayer method source code here to manage rotating with small differences

		//I think this line is for to break up with reference to actual one
		let rotDir = directionToTarget.clone();
		
		if (rotDir.length() == 0) {
			return;
		}

		rotDir;
		rotDir.normalize();
		const angleY = Math.atan2(rotDir.z, rotDir.x);
		this.angleY = angleY;
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

	setTargetPlayer(player: Player){
		this.targetPlayer = player;
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
