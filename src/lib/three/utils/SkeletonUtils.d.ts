// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { SkeletonUtilsOptions, SkeletonUtilsSkeletonObject } from "./SkeletonUtils.types.js";

/**
 * 원본 뼈(bone)의 현재 자세를 대상 골격(skeleton)에 적용합니다.<br>
 * 대상의 뼈 변환을 변경하며 전달한 options에 기본값을 채웁니다.<br>
 * Skeleton을 대상으로 전달하면 useTargetMatrix를 켜고 preserveBoneMatrix를 끕니다.
 *
 * @param {SkeletonUtilsSkeletonObject | import('three').Skeleton} target 자세를 적용할 대상
 * @param {SkeletonUtilsSkeletonObject | import('three').Skeleton | Array<import('three').Bone>} source 자세를 읽을 원본
 * @param {SkeletonUtilsOptions} [options] 자세와 뼈 이름 대응 설정
 */
declare function retarget(target: SkeletonUtilsSkeletonObject | three.Skeleton, source: SkeletonUtilsSkeletonObject | three.Skeleton | Array<three.Bone>, options?: SkeletonUtilsOptions): void;

/**
 * 원본 애니메이션 클립(animation clip)을 대상 골격(skeleton)의 뼈(bone) 트랙으로 변환합니다.<br>
 * 원본과 대상의 자세를 갱신하며 전달한 options에 기본값을 채웁니다.<br>
 * 대상에는 skeleton이 필요하며 원본 Skeleton은 내부에서 SkeletonHelper로 감쌉니다.
 *
 * @param {SkeletonUtilsSkeletonObject} target 변환된 트랙을 적용할 대상
 * @param {SkeletonUtilsSkeletonObject | import('three').Skeleton} source 애니메이션을 재생할 원본
 * @param {import('three').AnimationClip} clip 변환할 애니메이션 클립
 * @param {SkeletonUtilsOptions} [options] 표본 추출과 자세 대응 설정
 * @returns {import('three').AnimationClip} 대상 뼈의 위치와 회전 트랙을 담은 새 클립
 */
declare function retargetClip(target: SkeletonUtilsSkeletonObject, source: SkeletonUtilsSkeletonObject | three.Skeleton, clip: three.AnimationClip, options?: SkeletonUtilsOptions): three.AnimationClip;

/**
 * 객체 트리를 복제하고 스키닝 메시(skinned mesh)의 골격(skeleton)을 복제된 뼈(bone)에 연결합니다.<br>
 * 스키닝 메시가 참조하는 모든 뼈는 source의 하위 트리에 포함되어야 합니다.<br>
 * geometry와 material은 원본과 공유하므로 복제본에서 변경하거나 해제할 때 공유 관계를 고려하십시오.
 *
 * @param {import('three').Object3D} source 복제할 객체 트리
 * @returns {import('three').Object3D} 복제된 객체 트리
 */
declare function clone(source: three.Object3D): three.Object3D;

declare const SkeletonUtils_clone: typeof clone;

declare const SkeletonUtils_retarget: typeof retarget;

declare const SkeletonUtils_retargetClip: typeof retargetClip;

declare namespace SkeletonUtils {
  export {
    SkeletonUtils_clone as clone,
    SkeletonUtils_retarget as retarget,
    SkeletonUtils_retargetClip as retargetClip,
  };
}

export type { SkeletonUtils, SkeletonUtils_clone, SkeletonUtils_retarget, SkeletonUtils_retargetClip, clone, retarget, retargetClip };
