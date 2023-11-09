import { Camera, PerspectiveCamera, Vector3 } from "three";
import { Player } from "./characters/Player/Player";
import * as CANNON from "cannon-es";
import { Game } from "./game";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export class CameraController {
	initialCameraPos: Vector3 = new Vector3(0, 0, 0);
	initialCameraPortraitPos: Vector3 = new Vector3(0, 0, 0);
	initialCameraLandscapePos: Vector3 = new Vector3(0, 0, 0);
	camera: PerspectiveCamera;
	player: Player;
	portraitFov: number = 50;
	landScaleFov: number = 40;
	orbitControls?: OrbitControls;

	constructor(camera: Camera, player: Player) {
		this.camera = camera as PerspectiveCamera;
		this.player = player;
		this.camera.getWorldPosition(this.initialCameraPortraitPos);
		this.initialCameraPos.copy(this.initialCameraPortraitPos);
		this.initialCameraLandscapePos.copy(this.initialCameraPortraitPos);
		this.initialCameraLandscapePos.multiplyScalar(0.7);

		this.portraitFov = this.camera.fov;

		if (Game.game.debugMode) {
			this.orbitControls = new OrbitControls(this.camera, Game.game.renderer.domElement);
			this.orbitControls.enableDamping = true;
			this.orbitControls.maxDistance = 1000;
			this.orbitControls.target.set(0, 0.5, 0);
			this.orbitControls.update();
		}
	}

	update() {
		this.orbitControls?.update();
	}

	cameraMove(delta: number, colliderPos: Vector3 | CANNON.Vec3) {
		if (Game.game.debugMode) {
			return;
		}

		const endPos = new Vector3(
			colliderPos.x + this.initialCameraPos.x,
			this.initialCameraPos.y,
			colliderPos.z + this.initialCameraPos.z
		);
		this.camera.position.lerp(endPos, delta * 5);

		const lookAtTarget = this.player.model!.position.clone();

		this.camera.lookAt(lookAtTarget);
	}
}
