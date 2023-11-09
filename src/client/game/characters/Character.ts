import { AnimationAction, AnimationMixer, LoopRepeat, Object3D, Vector3 } from "three";
import * as CANNON from "cannon-es";
import { BODY_TYPES } from "cannon-es";
import { clone as deepClone } from "../js/SkeletonUtils";
import { randFloat } from "three/src/math/MathUtils";
import { Game } from "../game";
import { Enemy } from "./Enemies/Enemy";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
export enum CharacterState {
	IDLE,
	MOVE,
}

export enum CharactersTypes {
	PLAYER,
	ENEMY,
}

//This class seems extendible for child classes so it initialize quickly some basic stuffs.

export class Character {
	type: CharactersTypes = CharactersTypes.ENEMY;
	model: Object3D;
	collider?: CANNON.Body;
	currentAnimation?: AnimationAction;
	currentState: CharacterState = CharacterState.IDLE;
	mixer: AnimationMixer;
	idleAnim?: AnimationAction;
	moveAnim?: AnimationAction;
	direction: Vector3 = new Vector3();
	speed: number = 2;
	changingState: boolean = false;
	gltf: GLTF;

	constructor(gltf: GLTF) {
		this.gltf = gltf;
		this.model = deepClone(gltf.scene);
		Game.game.scene.add(this.model);
		this.mixer = new AnimationMixer(this.model);
	}

	update(delta: number): void {
		this.mixer.update(delta);
	}

	stateUpdate() {}

	// This method is being called every frame i guess and 
	// at the time AnimationAction is not null|undefined, animation fadeout , animation set and play calls made here as well.
	setState(state: CharacterState) {
		if (state == this.currentState || !this.currentAnimation) return;
		if (this.currentAnimation.getEffectiveWeight() < 1) return;
		if (this.changingState) return;
		console.log(state);
		this.changingState = true;
		let anim: AnimationAction | undefined;
		let timeScale = 1;
		switch (state) {
			case CharacterState.IDLE:
				if (!this.idleAnim) return;
				anim = this.idleAnim;
				break;
			case CharacterState.MOVE:
				if (!this.moveAnim) return;
				anim = this.moveAnim;
				timeScale = 1.2;
				break;
			default:
				console.error("Player state not found");
				anim = undefined;
				break;
		}
		if (anim) {
			


			const fadeTime = 0.2;
			this.currentAnimation.fadeOut(fadeTime);
			
			anim.reset()
				.setEffectiveTimeScale(timeScale)
				.setEffectiveWeight(1)
				.fadeIn(fadeTime)
				.play();

			setTimeout(() => {
				if (anim) {
					this.currentAnimation = anim;
					this.changingState = false;
				}
			}, fadeTime * 1000);
		}

		this.currentState = state;
	}

	// This method seems it creates collider for instantiated model and attached to it with it's shape,
	CreateCollider(): CANNON.Body {
		const shape = new CANNON.Sphere(0.5);
		let position = new Vector3();
		this.model?.getWorldPosition(position);
		let collider;
		position.y += 1;
		collider = new CANNON.Body({
			mass: 1,
			type: BODY_TYPES.DYNAMIC,
			position: new CANNON.Vec3(position?.x, position!.y, position?.z),
		});
		collider.addShape(shape);

		return collider;
	}

	initializeAnimations() {}
}
