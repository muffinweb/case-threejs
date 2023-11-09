import { BoxGeometry, Mesh, MeshBasicMaterial, Object3D, Vector3 } from "three";
import * as THREE from "three";
import * as CANNON from "cannon-es";

import { Game } from "./game";
import { BODY_TYPES, Quaternion } from "cannon-es";

export class Walls {
	models: Object3D[] = [];
	canonColider?: CANNON.Body;
	constructor() {
		Game.game.scene.traverse((child) => {
			if (child.name.startsWith("COLLIDER")) {
				child.visible = false;
				this.models.push(child);
			}
		});
		this.init();
	}

	init() {
		this.models.forEach((model) => {
			let wallCollider = model;
			const colliderPos = new THREE.Vector3();
			const colliderRotation = new THREE.Quaternion();
			const coliderScale = new THREE.Vector3();

			if (wallCollider) {
				(<Mesh>wallCollider).getWorldPosition(colliderPos);
				(<Mesh>wallCollider).getWorldQuaternion(colliderRotation);
				(<Mesh>wallCollider).getWorldScale(coliderScale);
			}
			const shape = new CANNON.Box(
				new CANNON.Vec3(coliderScale.x, coliderScale.y * 2, coliderScale.z)
			);
			this.canonColider = new CANNON.Body({
				mass: 0,
				type: BODY_TYPES.STATIC,
				position: new CANNON.Vec3(colliderPos.x, colliderPos.y, colliderPos.z),
				quaternion: new CANNON.Quaternion(
					colliderRotation.x,
					colliderRotation.y,
					colliderRotation.z,
					colliderRotation.w
				),
				shape: shape,
			});
			Game.game.cannonWorld.addBody(this.canonColider);
		});
	}
}
