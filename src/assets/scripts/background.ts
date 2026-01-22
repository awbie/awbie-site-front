import {
	Clock,
	Color,
	GLSL3,
	Mesh,
	OrthographicCamera,
	PlaneGeometry,
	Scene,
	ShaderMaterial,
	Vector2,
	WebGLRenderer,
} from "three";
import fragmentSrc from "@/assets/shaders/fragment.glsl?raw";
import vertexSrc from "@/assets/shaders/vertex.glsl?raw";

const bg = document.querySelector(".cover");
const shapeAttr = bg?.getAttribute("data-shape") ?? "square";
const pixelSizeAttr = bg?.getAttribute("data-pixel-size") ?? "4";
const inkAttr = bg?.getAttribute("data-ink") ?? "#FFFFFF";

const SHAPE_MAP: Record<string, number> = {
	square: 0,
	circle: 1,
	triangle: 2,
	diamond: 3,
};

const canvas = document.createElement("canvas");
const gl = canvas.getContext("webgl2");
if (!gl) {
	throw new Error("WebGL2 not supported");
}
const renderer = new WebGLRenderer({ canvas, context: gl, antialias: true });
bg?.appendChild(canvas);

const MAX_CLICKS = 10;
const uniforms = {
	uResolution: { value: new Vector2() },
	uTime: { value: 0 },
	uColor: { value: new Color(inkAttr) },
	uClickPos: {
		value: Array.from({ length: MAX_CLICKS }, () => new Vector2(-1, -1)),
	},
	uClickTimes: { value: new Float32Array(MAX_CLICKS) },
	uShapeType: { value: SHAPE_MAP[shapeAttr] ?? 0 },
	uPixelSize: { value: parseFloat(pixelSizeAttr) || 4 },
};

const scene = new Scene();
const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
const material = new ShaderMaterial({
	vertexShader: vertexSrc,
	fragmentShader: fragmentSrc,
	uniforms,
	glslVersion: GLSL3,
	transparent: true,
});
scene.add(new Mesh(new PlaneGeometry(2, 2), material));

const resize = () => {
	const w = canvas.clientWidth || window.innerWidth;
	const h = canvas.clientHeight || window.innerHeight;
	renderer.setSize(w, h, false);
	uniforms.uResolution.value.set(w, h);
};
window.addEventListener("resize", resize);
resize();

let clickIx = 0;
canvas.addEventListener("pointerdown", (e) => {
	const rect = canvas.getBoundingClientRect();
	const fx = (e.clientX - rect.left) * (canvas.width / rect.width);
	const fy =
		(rect.height - (e.clientY - rect.top)) * (canvas.height / rect.height);

	uniforms.uClickPos.value[clickIx].set(fx, fy);
	uniforms.uClickTimes.value[clickIx] = uniforms.uTime.value;
	clickIx = (clickIx + 1) % MAX_CLICKS;
});

const clock = new Clock();
(function animate() {
	uniforms.uTime.value = clock.getElapsedTime();
	renderer.render(scene, camera);
	requestAnimationFrame(animate);
})();
