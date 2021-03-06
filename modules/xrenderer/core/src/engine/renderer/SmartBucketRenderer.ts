///<reference path="worker/TraceJobManager.ts"/>
import {Camera} from "../scene/Camera";
import {Scene} from "../scene/Scene";
import {Color} from "../math/Color";
import {RGBA} from "../math/Color";
import {Ray} from "../math/Ray";
import {TraceJobManager} from "./worker/TraceJobManager";
import {SharedScene} from "../scene/SharedScene";
import {TraceJob} from "./worker/TraceJob";
/**
 * Created by Nidin Vinayakan on 10-01-2016.
 */
export class SmartBucketRenderer {

    static DEBUG:boolean = false;

    traceManager:TraceJobManager;

    get initialized():boolean {
        return this.traceManager.initialized;
    }

    bucketSize:number = 64/2;

    constructor() {
        this.traceManager = new TraceJobManager();
    }

    static interval:number = 0;

    get iterations():number {
        return this.traceManager.iterations;
    }

    updateCameraSamples(newValue:number) {
        this.traceManager.queue.forEach(function (job) {
            job.extra.cameraSamples = newValue;
        })
    }

    updateHitSamples(newValue:number) {
        this.traceManager.queue.forEach(function (job) {
            job.extra.hitSamples = newValue;
        })
    }

    updateCamera(newValue:any) {
        this.traceManager.stop();
        this.traceManager.clear();
        this.traceManager.referenceQueue.forEach(function (job) {
            job.extra.camera = newValue;
        });
        this.traceManager.restart();
    }

    render(scene:SharedScene, camera:Camera, width:number, height:number, cameraSamples:number, hitSamples:number,
           bounces:number, iterations:number = 1, blockIterations:number = 1, onUpdate:Function, updateIndicator:Function, onInit?:Function):Uint8ClampedArray {
        if (!this.traceManager) {
            this.traceManager = new TraceJobManager();
        }
        this.traceManager.maxLoop = iterations - 1;
        this.traceManager.configure({
                camera: camera,
                width: width,
                height: height,
                cameraSamples: cameraSamples,
                hitSamples: hitSamples,
                bounces: bounces
            },
            scene
        );

        var col = width / this.bucketSize;
        var row = height / this.bucketSize;

        for (var j = 0; j < row; j++) {
            for (var i = 0; i < col; i++) {
                this.traceManager.add(
                    new TraceJob({
                        id: j + "_" + i,
                        blockIterations: blockIterations,
                        width: this.bucketSize,
                        height: this.bucketSize,
                        xoffset: i * this.bucketSize,
                        yoffset: j * this.bucketSize
                    })
                );
            }
        }

        this.traceManager.updatePixels = onUpdate;
        this.traceManager.updateIndicator = updateIndicator;
        this.traceManager.init(onInit);
        return this.traceManager.pixels;
    }
}
