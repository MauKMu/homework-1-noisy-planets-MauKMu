import {vec3, vec4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import Cube from './geometry/Cube';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

enum ShaderEnum {
    LAMBERT = 1,
    CUSTOM,
    DISKS,
    PLANET,
    BLDGS,
    MAGIC,
}

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 6,
  'Load Scene': loadScene, // A function pointer, essentially
  geometryColor: [200, 10, 10],
  shader: ShaderEnum.PLANET,
  shaderSpeed: 1,
  'Toggle tilting': toggleAnimXZ,
  'Toggle squishing': toggleAnimY,
  lightX: 1,
  lightY: 1,
  lightZ: 1,
  lavaBias: 0.5,
  plumeBias: 0.0,
};

let icosphere: Icosphere;
let square: Square;
let cube: Cube;

let renderer: OpenGLRenderer;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  cube = new Cube(vec3.fromValues(1.5, 0, 0));
  cube.create();
}

function toggleAnimXZ() {
  renderer.toggleAnimXZ();
}

function toggleAnimY() {
  renderer.toggleAnimY();
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.add(controls, 'Load Scene');
  let colorController = gui.addColor(controls, 'geometryColor');
  gui.add(controls, 'shader', {"Lame Lambert": ShaderEnum.LAMBERT, "Cool Custom": ShaderEnum.CUSTOM, "Decent Disks": ShaderEnum.DISKS, "Plumous Planet": ShaderEnum.PLANET});
  let speedController = gui.add(controls, 'shaderSpeed', 0, 10);
  //gui.add(controls, 'Toggle tilting');
  //gui.add(controls, 'Toggle squishing');
  gui.add(controls, 'lavaBias', 0, 1);
  gui.add(controls, 'plumeBias', 0, 1);
  let lightFolder = gui.addFolder('Light Position');
  lightFolder.add(controls, 'lightX');
  lightFolder.add(controls, 'lightY');
  lightFolder.add(controls, 'lightZ');

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  // Set up event listener for color change
  colorController.onChange(function (color: Int32Array) {
    renderer.setGeometryColor(vec4.fromValues(color[0] / 255, color[1] / 255, color[2] / 255, 1));
  });

  // Initialize color
  renderer.setGeometryColor(vec4.fromValues(controls.geometryColor[0] / 255,
                                            controls.geometryColor[1] / 255,
                                            controls.geometryColor[2] / 255,
                                            1
  ));

  // Set up event listener for shader speed
  speedController.onChange(function (speed: number) {
    renderer.setShaderSpeed(speed);
  });

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const custom = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/custom-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/custom-frag.glsl')),
  ]);

  const disks = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/disks-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/disks-frag.glsl')),
  ]);

  const planet = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/planet-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/planet-frag.glsl')),
  ]);

  let shaders: { [id: number]: ShaderProgram; } = {};
  shaders[ShaderEnum.LAMBERT] = lambert;
  shaders[ShaderEnum.CUSTOM] = custom;
  shaders[ShaderEnum.DISKS] = disks;
  shaders[ShaderEnum.PLANET] = planet;

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    renderer.setLightPos(vec3.fromValues(controls.lightX, controls.lightY, controls.lightZ));
    renderer.setLavaBias(controls.lavaBias);
    renderer.setPlumeBias(controls.plumeBias);
    renderer.render(camera, shaders[controls.shader], [
      icosphere,
      // square,
      // cube,
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
