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
import * as CANNON from "cannon-es";
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
 * @todo Get Collide data when player/enemy collide each other [done]
 * @todo Make enemy rotate left/right (euler,LookAt like) [ done ]
 * @todo Make enemy move to his forward - [ done ]
 * @todo Get Player position as a target and rotate enemy against player and move towards player [ done ]
 * 
 */

export class Enemy extends Character {
	
	direction: Vector3 = new Vector3();
	speed: number = 0.3;
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

	detectionAreaMaterial: MeshPhongMaterial | undefined;

	detectionAreaMesh: Mesh | undefined;

	//If enemy is on alert he will run towards player 
	isEnemyOnAlert: boolean = false;
	detectionAreaCurrentColor: string = "#ff0000";

	//DetectionArea Offset by Enemy
	detectionAreaOffset: Vector3 = new Vector3(0, 0, -1);
	
	detectionAreaCollider: CANNON.Body | undefined;

	//When i add collision listener constructor, listener works itself on start 2 times.
	// This is deep-caused thing and i decided to make counter to make my solution work
	detectionAreaCollisionCounter: number = 0;
	
	/**
	 * 
	 * Codes here works 2 times when project initialized. 
	 * This makes problem adding listener here
	 */
	constructor(gltf: GLTF, enemyPos: Vector3 = new Vector3()) {
		super(gltf);

		this.initializeAnimations();
		this.model.position.copy(enemyPos);
		
		this.collider = this.CreateCollider();
		Game.game.cannonWorld.addBody(this.collider);
	
		//Creating detectionArea Object w/ Geo, Mat, Mesh Combination
		const detectionAreaGeo = new SphereGeometry();
		let detectionAreaMaterial = new MeshPhongMaterial({color: this.detectionAreaCurrentColor})
		const detectionAreaMesh = new Mesh(detectionAreaGeo, detectionAreaMaterial);


		// I created a SphereGeometry and i needed to attach it to enemy player.
		// After i rotate enemy right/left, child object rotated as i hoped.  ;)
		detectionAreaMesh.position.set(
			this.model.position.x - this.detectionAreaOffset.x,
			this.model.position.y - this.detectionAreaOffset.y,
			this.model.position.z - this.detectionAreaOffset.z
		);

		this.detectionAreaCollider = this.CreateCollider(0.9);
		Game.game.cannonWorld.addBody(this.detectionAreaCollider);




		//This is important method. Because when you attach an object to object
		// Child object will follow parent's position/rotation changes and applies itself (probably?)
		this.model.attach(detectionAreaMesh);

		this.detectionAreaMesh = detectionAreaMesh;

		this.detectionAreaMaterial = detectionAreaMaterial;

		this.model.getWorldDirection(this.initialrot);

		const mesh = this.model.getObjectByName("dummy_stong") as Mesh;
		mesh.castShadow = true;
		mesh.frustumCulled = false;

		convertToLambert(this.model);

		//Enemy animation behaviors seems like linked to his CharacterState's state
		// I set it to CharacterState.IDLE. Because Enemy must be stop at first according to case
		
		//this.setState(CharacterState.MOVE);
		this.setState(CharacterState.MOVE);
		
		// Rotate test
		//this.model.rotation.y += 60;
		
		//detectionAreaMesh.material.color.set('#017f01')

		this.detectionAreaCollider.addEventListener("collide", (e: Event)=> {
			this.detectionAreaCollisionCounter++;

			if(this.detectionAreaCollisionCounter > 1){
				this.isEnemyOnAlert = true;
			}

		})
	}

	update(delta: number): void {
		super.update(delta);
		this.modelPosUpdate();
		this.moveModel(delta);
		this.buttonListener(delta);
		this.stateUpdate();

		//Update Detection Area Every-Frame
		this.detectionAreaPosUpdate();
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

	stateUpdate() {
		// If hero is visible and dummy is not following him, change it's state to move
		// this.setState(CharacterState.MOVE);
		// Otherwise, change it's state to idle

		//There is trick here. If isMoving property is true it only sets for one time CharacterState.MOVE here
		// Because setting CharacterState recursively effects animation clip badly.
		if (this.isMoving === false && this.currentState != CharacterState.IDLE) {
			this.setState(CharacterState.IDLE);
		} else if (this.isMoving === true && this.currentState != CharacterState.MOVE) {
			this.setState(CharacterState.MOVE);
		}

		// If enemy see player on deadzone, deadzone will turn to red and it will change state 
		if(this.isEnemyOnAlert){
			
			this.isMoving = true;
			this.setState(CharacterState.MOVE);
			this.detectionAreaCurrentColor = '#ff0000';
			if(Game.game.player?.model.position){
				this.model.lookAt(Game.game.player?.model.position);
				
				//If enemy's distance to player is far then 3
				// Enemy will stop to chase after player
				let distance = this.model.position.distanceTo(Game.game.player?.model.position);
				if(distance > 10){
					this.isEnemyOnAlert = false;
				}else {
				
					// when player position minus related position equals direction vector.
					// Using this values with velocity makes enemy run towards player.
					let directionToPlayer = new Vector3(
						Game.game.player.model.position.x - this.model.position.x,
						1,
						Game.game.player.model.position.z - this.model.position.z
					);

					this.collider?.velocity.set(directionToPlayer.x * this.speed, directionToPlayer.y, directionToPlayer.z * this.speed);
				}
			}

		}else{

			this.setState(CharacterState.IDLE);
			this.detectionAreaCurrentColor = '#017f01';
		}

		//Enemy is on alert, deadzone will turn into another color otherwise another color
		// This line applies what to color related cmaterial
		this.detectionAreaMaterial?.color.set(this.detectionAreaCurrentColor);
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

	// This will work for DetectionAreaCollider to be attached to position of parent Sphere 
	detectionAreaPosUpdate(){

		if(this.detectionAreaCollider?.position && this.model?.position){
			this.detectionAreaCollider.position.set(
				this.model.position.x, 
				this.model.position.y, 
				this.model.position.z +1.3);
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
