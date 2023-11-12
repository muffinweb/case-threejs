import {
	CameraHelper,
	DirectionalLight,
	DirectionalLightHelper,
	Object3D,
	PCFSoftShadowMap,
	Vector3,
} from "three";
import { Player } from "./characters/Player/Player";
import { Game } from "./game";

export class LightController {
	lightOffset: Vector3 = new Vector3(0, 0, 0);
	dirLight: DirectionalLight;
	player: Player;
	helper?: THREE.DirectionalLightHelper;
	shadowHelper?: THREE.CameraHelper;

	constructor(player: Player) {
		this.dirLight = Game.game.directionalLight!;
		//console.log(this.dirLight);
		const directionalLightTarget = new Object3D();
		directionalLightTarget.position.set(0, 0, -1);

		if (this.dirLight) {
			this.dirLight.add(directionalLightTarget);
			this.dirLight.target = directionalLightTarget;
		}

		this.player = player;
		const playerWorldPos = player.model.getWorldPosition(new Vector3());
		const lightWorldPos = this.dirLight.getWorldPosition(new Vector3());
		this.lightOffset = lightWorldPos.sub(playerWorldPos);

		if (Game.game.debugMode) {
			this.helper = new DirectionalLightHelper(this.dirLight);
			Game.game.scene.add(this.helper);
			this.shadowHelper = new CameraHelper(this.dirLight.shadow.camera);
			Game.game.scene.add(this.shadowHelper);
		}

		this.turnOnShadows();
		this.setSceneParams();
	}

	update() {
		if (this.player.model) {
			const playerWorldPos = this.player.model.getWorldPosition(new Vector3());

			this.dirLight.position.copy(playerWorldPos.add(this.lightOffset));
			this.dirLight.shadow.camera.updateProjectionMatrix();
		}

		this.shadowHelper?.update();
		this.helper?.update();
	}

	turnOnShadows(): void {
		this.dirLight.castShadow = true;
		Game.game.renderer.shadowMap.enabled = true;
		Game.game.renderer.shadowMap.type = PCFSoftShadowMap;

		this.dirLight.shadow.mapSize.width = 1024;
		this.dirLight.shadow.mapSize.height = 1024;
		this.dirLight.shadow.camera.near = 0.5;
		this.dirLight.shadow.camera.far = 50;
		this.dirLight.shadow.camera.left = -10;
		this.dirLight.shadow.camera.right = 10;
		this.dirLight.shadow.camera.bottom = -10;
		this.dirLight.shadow.camera.top = 10;

		this.dirLight.shadow.camera.updateProjectionMatrix();
	}

	setSceneParams(): void {
		const scene = Game.game.scene;

		const receiveShadowObjects = ["Rooftop001", "Rooftop002"];
		const castShadowObjects = [
			"rooftop_tank",
			"Wall002",
			"Wall001",
			"roof_element_door001",
			"Big_vent002",
			"Solar_panel094",
			"Solar_panel003",
		];

		for (const objectName of receiveShadowObjects) {
			const object = scene.getObjectByName(objectName);
			if (object) {
				object.receiveShadow = true;
			}
		}
		for (const objectName of castShadowObjects) {
			const object = scene.getObjectByName(objectName);
			if (object) {
				object.castShadow = true;
			}
		}
	}
}
