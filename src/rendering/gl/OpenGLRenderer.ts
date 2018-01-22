import {mat4, vec4} from 'gl-matrix';
import Drawable from './Drawable';
import Camera from '../../Camera';
import {gl} from '../../globals';
import ShaderProgram from './ShaderProgram';

// In this file, `gl` is accessible because it is imported above
class OpenGLRenderer {
  geometryColor: vec4;
  startTime: number;
  shaderSpeed: number;
  startTimeXZ: number;
  lastStopTimeXZ: number;
  isStoppedXZ: boolean;
  startTimeY: number;
  lastStopTimeY: number;
  isStoppedY: boolean;

  constructor(public canvas: HTMLCanvasElement) {
    this.geometryColor = vec4.fromValues(0, 0, 0, 1);
    this.startTime = Date.now();
    this.shaderSpeed = 1;
    this.isStoppedXZ = false;
    this.startTimeXZ = this.startTime;
    this.lastStopTimeXZ = 0;
    this.isStoppedY = false;
    this.startTimeY = this.startTime;
    this.lastStopTimeY = 0;
  }

  setClearColor(r: number, g: number, b: number, a: number) {
    gl.clearColor(r, g, b, a);
  }

  setSize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  setGeometryColor(color: vec4) {
    this.geometryColor = color;
  }

  setShaderSpeed(speed: number) {
      this.shaderSpeed = speed;
  }

  toggleAnimXZ() {
    let now = Date.now();

    if (!this.isStoppedXZ) {
      this.lastStopTimeXZ += now - this.startTimeXZ;
    }
    this.startTimeXZ = now;

    this.isStoppedXZ = !this.isStoppedXZ;
  }

  toggleAnimY() {
    let now = Date.now();

    if (!this.isStoppedY) {
      this.lastStopTimeY += now - this.startTimeY;
    }
    this.startTimeY = now;

    this.isStoppedY = !this.isStoppedY;
  }

  render(camera: Camera, prog: ShaderProgram, drawables: Array<Drawable>) {
    let model = mat4.create();
    let viewProj = mat4.create();

    mat4.identity(model);
    mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
    prog.setModelMatrix(model);
    prog.setViewProjMatrix(viewProj);
    prog.setGeometryColor(this.geometryColor);
    let now = Date.now();
    prog.setTime(now - this.startTime);
    if (this.isStoppedXZ) {
      prog.setTimeXZ(this.lastStopTimeXZ);
    }
    else {
      prog.setTimeXZ(now - this.startTimeXZ + this.lastStopTimeXZ);
    }
    if (this.isStoppedY) {
      prog.setTimeY(this.lastStopTimeY);
    }
    else {
      prog.setTimeY(now - this.startTimeY + this.lastStopTimeY);
    }
    prog.setSpeed(this.shaderSpeed);

    for (let drawable of drawables) {
      prog.setModelMatrix(mat4.fromTranslation(mat4.create(), drawable.center));
      prog.draw(drawable);
    }
  }
};

export default OpenGLRenderer;

