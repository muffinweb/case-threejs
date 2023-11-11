import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";


export function rotateTo(angle: number, targetAngle: number, rotationSpeed: number): number {
	targetAngle += targetAngle < 0 ? 2 * Math.PI : 0;
	angle += angle < 0 ? 2 * Math.PI : 0;

	const m = Math.abs(targetAngle - angle);
	let delta = targetAngle - angle;
	if (m > Math.PI) {
		delta = (2 * Math.PI - Math.abs(delta)) * (delta < 0 ? 1 : -1);
	}

	delta = Math.abs(delta) > rotationSpeed ? rotationSpeed * (delta < 0 ? -1 : 1) : delta;
	let t = delta + angle;
	t += t >= 2 * Math.PI ? -2 * Math.PI : 0;

	return t;
}

export function libAnim(name: string, gltf: GLTF): THREE.AnimationClip {
	const animations = gltf.animations;
	const animation = animations.find((a) => a.name == name);
	if (!animation) {
		throw new Error("Missing animation: " + name);
	}
	return animation;
}

export function convertToLambert(model: THREE.Object3D) {
	let lambertMaterials: Map<string, THREE.MeshLambertMaterial> = new Map<
		string,
		THREE.MeshLambertMaterial
	>();

	model.traverse(function (child) {
		if ((child as THREE.Mesh).isMesh) {
			const m = child as THREE.Mesh;

			if (m.material instanceof THREE.MeshStandardMaterial) {
				const prevMaterial = m.material as THREE.MeshStandardMaterial;
				if (lambertMaterials.has(prevMaterial.name)) {
					m.material = lambertMaterials.get(prevMaterial.name)!;
				} else {
					const mat = new THREE.MeshLambertMaterial();
					THREE.MeshLambertMaterial.prototype.copy.call(mat, prevMaterial);
					if (mat.map) {
						mat.map.encoding = THREE.sRGBEncoding;
						mat.needsUpdate = true;
					}
					m.material = mat;
					lambertMaterials.set(
						prevMaterial.name,
						m.material as THREE.MeshLambertMaterial
					);
				}
			}
		}
	});
}
