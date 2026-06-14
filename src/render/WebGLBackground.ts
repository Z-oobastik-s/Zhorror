import type { AtmosphereSystem } from '@/systems/AtmosphereSystem';
import type { CursorSystem } from '@/systems/CursorSystem';

const VERT = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAG = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform float u_atmosphere;
  uniform vec2 u_cursor;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p = uv * 3.0;

    float n = noise(p + u_time * 0.05);
    float n2 = noise(p * 2.0 - u_time * 0.03);
    float depth = n * 0.6 + n2 * 0.4;

    vec2 cursorDist = uv - u_cursor;
    float cursorGlow = exp(-dot(cursorDist, cursorDist) * 8.0) * 0.03 * u_atmosphere;

    vec3 col = vec3(0.02, 0.015, 0.025);
    col += vec3(0.08, 0.02, 0.04) * depth * (0.3 + u_atmosphere * 0.4);
    col += vec3(0.02, 0.04, 0.02) * n2 * 0.15;
    col += vec3(0.15, 0.05, 0.05) * cursorGlow;

    float vig = 1.0 - dot(uv - 0.5, uv - 0.5) * 1.8;
    col *= vig;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export class WebGLBackground {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private time = 0;
  private failed = false;

  constructor(parent: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'zh-webgl-bg';
    parent.insertBefore(this.canvas, parent.firstChild);
    this.init();
    window.addEventListener('resize', () => this.resize());
  }

  private init(): void {
    this.gl = this.canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!this.gl) {
      this.failed = true;
      this.canvas.style.display = 'none';
      return;
    }

    const vs = this.compileShader(this.gl.VERTEX_SHADER, VERT);
    const fs = this.compileShader(this.gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { this.failed = true; return; }

    this.program = this.gl.createProgram()!;
    this.gl.attachShader(this.program, vs);
    this.gl.attachShader(this.program, fs);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      this.failed = true;
      return;
    }

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]), this.gl.STATIC_DRAW);

    const posLoc = this.gl.getAttribLocation(this.program, 'a_position');
    this.gl.enableVertexAttribArray(posLoc);
    this.gl.vertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, 0, 0);

    this.uniforms = {
      u_time: this.gl.getUniformLocation(this.program, 'u_time'),
      u_resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
      u_atmosphere: this.gl.getUniformLocation(this.program, 'u_atmosphere'),
      u_cursor: this.gl.getUniformLocation(this.program, 'u_cursor'),
    };

    this.resize();
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) return null;
    return shader;
  }

  private resize(): void {
    if (!this.gl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  update(dt: number): void {
    this.time += dt;
  }

  render(atmosphere: AtmosphereSystem, cursor: CursorSystem): void {
    if (this.failed || !this.gl || !this.program) return;
    const { nx, ny } = cursor.getNormalized();

    this.gl.useProgram(this.program);
    this.gl.uniform1f(this.uniforms.u_time, this.time);
    this.gl.uniform2f(this.uniforms.u_resolution, this.canvas.width, this.canvas.height);
    this.gl.uniform1f(this.uniforms.u_atmosphere, atmosphere.getLevel());
    this.gl.uniform2f(this.uniforms.u_cursor, nx, 1 - ny);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }
}
