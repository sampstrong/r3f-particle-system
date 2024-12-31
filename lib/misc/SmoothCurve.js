import * as THREE from 'three';

export default class SmoothCurve {
    constructor(scene, points = null, isLoop = false, controlOffset = 0.2) {

        this.scene = scene;
        this.points = points;
        this.isLoop = isLoop;
        this.controlOffset = controlOffset; // This controls the distance of added points
        this.curvePath = new THREE.CurvePath();
        this.debugPoints = [];
        this.createCurve();
    }

    createCurve() {

        const isLastInArray = (item) => item === this.points[this.points.length - 1];

        for (let i = 0; i < this.points.length; i++) {

            const current = this.points[i];

            const prev = this.points[i - 1] || (this.isLoop ? this.points[this.points.length - 1] : null);
            const next = this.points[i + 1] || (this.isLoop ? this.points[0] : null);
            const halfDistPrev = prev ? current.distanceTo(prev) / 2 : 0;
            const halfDistNext = next ? current.distanceTo(next) / 2 : 0;
            const controlOffsetPrev = this.controlOffset > halfDistPrev ? halfDistPrev : this.controlOffset;
            const controlOffsetNext = this.controlOffset > halfDistNext ? halfDistNext : this.controlOffset;

            const nextControl = next ? this.getControlPoint(next, current, controlOffsetNext) : null;
            const beforeControl = prev ? this.getControlPoint(current, prev, controlOffsetPrev) : null;
            const afterControl = next ? this.getControlPoint(current, next, controlOffsetNext) : null;
            

            if (!next) continue;
            if (prev) {
                this.addCurve(beforeControl, current, afterControl);
            }
            if (this.controlOffset <= halfDistNext) {
                const fillPoint = isLastInArray(next) && !this.isLoop ? next : nextControl;
                this.addFill(afterControl, fillPoint);
            }

            this.addDebugPoint(current, 'orange');
            beforeControl && this.addDebugPoint(beforeControl, 'red');
            afterControl && this.addDebugPoint(afterControl, 'red');
        }
    }

    getControlPoint(p1, p2, offset) {
        const direction = new THREE.Vector3().subVectors(p2, p1).normalize();
        return p1.clone().add(direction.multiplyScalar(offset));
    }

    addFill(p1, p2) {
        const fill = new THREE.LineCurve3(p1, p2);
        this.curvePath.add(fill);
    }

    addCurve(p1, p2, p3) {
        const curveSegment = new THREE.QuadraticBezierCurve3(p1, p2, p3);
        this.curvePath.add(curveSegment);
    }

    getCurvePath() {
        return this.curvePath;
    }

    addDebugPoint(pos, color) {
        const pointMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.01, 0.01, 0.01),
            new THREE.MeshBasicMaterial({ color: color })
        );
        pointMesh.position.set(pos.x, pos.y, pos.z);
        this.debugPoints.push(pointMesh);
    }

    addDebugPointsToScene(scene) {
        this.debugPoints.forEach(p => {
            scene.add(p);
        });
    }
}