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
import { convertToLambert, libAnim, rotateTo} from "../../GameHelpers";
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
	moveDirection: Vector2 = new Vector2();  
	targetRotation?: number;
	rotationSpeed: number = 6;
	isMoving: boolean = false;
	keyMap: { [key: string]: boolean } = {};
	onDocumentKey = (e: KeyboardEvent) => {
		this.keyMap[e.code] = e.type === "keydown";
	};

	// we need to collided player's data to catch or rotate against him first
	targetPlayer?: Player

	//If enemy is on alert he will run towards player 
	isEnemyOnAlert: boolean = false;

	//DetectionArea Offset by Enemy
	detectionAreaOffset: Vector3 = new Vector3(-5.2, 0, 1);
	
	constructor(gltf: GLTF, enemyPos: Vector3 = new Vector3()) {
		super(gltf);

		this.initializeAnimations();
		this.model.position.copy(enemyPos);
		
		this.collider = this.CreateCollider();
		Game.game.cannonWorld.addBody(this.collider);

		const ball = new SphereGeometry();
		const mat = new MeshPhongMaterial({color: "#ff0000"})
		const triangleMesh = new Mesh(ball, mat);
		triangleMesh.position.add(this.detectionAreaOffset);

		


		//This is important method. Because when you attach an object to object
		// Child object will follow parent's position/rotation changes and applies itself (probably?)
		this.model.attach(triangleMesh);

		this.model.getWorldDirection(this.initialrot);

		const mesh = this.model.getObjectByName("dummy_stong") as Mesh;
		mesh.castShadow = true;
		mesh.frustumCulled = false;

		convertToLambert(this.model);

		//Enemy animation behaviors seems like linked to his CharacterState's state
		// I set it to CharacterState.IDLE. Because Enemy must be stop at first according to case
		
		//this.setState(CharacterState.MOVE);
		this.setState(CharacterState.MOVE);

		this.collider?.addEventListener('collide', function(event: any){
			//This block will be fired when this Cannon.Body collides
			console.log(event.target.position);
		})
	}

	update(delta: number): void {
		super.update(delta);
		this.modelPosUpdate();
		this.moveModel(delta);
		this.buttonListener(delta);
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

		if (this.isMoving === false && this.currentState != CharacterState.IDLE) {
			this.setState(CharacterState.IDLE);
		} else if (this.isMoving === true && this.currentState != CharacterState.MOVE) {
			this.setState(CharacterState.MOVE);
		}
	}

	modelPosUpdate() {
		let velX;
		let velZ;
		// If model and collider assigned
		if (this.model && this.collider) {
			//And if character current says MOVE

			if (this.currentState == CharacterState.MOVE) {
				//Velocity(probably?) will set to it's direction multiply it's speed property 
				velX = this.direction.x * this.speed;
				velZ = this.direction.z * this.speed;
			
			} else {
				//Otherwise set them 0 so they'll stop
				velX = 0;
				velZ = 0;
			
			}
			// It copies collider position value with clone method and assign to colliderPosition
			const colliderPosition = this.collider.position.clone();
			this.collider.velocity.set(velX, 0, velZ);
			this.collider.position.y = 1; //this is probably same always because no any jump feature here

			// In fact collider moves according to user inputs and model catches after collider here
			this.model.position.z = colliderPosition.z;
			this.model.position.x = colliderPosition.x;
			this.model.position.y = colliderPosition.y - 1;
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
