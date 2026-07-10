import { useEffect, useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

/**
 * MarsScene — фоновая 3D-сцена: поверхность Марса с кратерами,
 * купольная теплица с изо-боксами внутри и звёздное небо.
 * Рендерится только на клиенте (иначе SSR падает на three.js).
 */
export function MarsScene() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ background: "radial-gradient(ellipse at top, #3a1408 0%, #1a0806 60%, #0f0503 100%)" }}
    >
      <Canvas
        camera={{ position: [0, 6, 14], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={["#1a0806"]} />
          <fog attach="fog" args={["#3a1408", 20, 60]} />
          <ambientLight intensity={0.35} color="#ff9070" />
          <directionalLight
            position={[10, 15, 5]}
            intensity={1.4}
            color="#ffb080"
            castShadow={false}
          />
          <directionalLight position={[-8, 4, -6]} intensity={0.35} color="#ff5030" />
          <Stars radius={80} depth={40} count={1500} factor={2} saturation={0} fade speed={0.3} />

          <MarsSurface />
          <Greenhouse />
          <CameraOrbit />
        </Suspense>
      </Canvas>
      {/* Faint dust overlay above 3D */}
      <div className="absolute inset-0 stars opacity-40" />
    </div>
  );
}

function CameraOrbit() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime() * 0.05;
    const r = 15;
    camera.position.x = Math.sin(t) * r;
    camera.position.z = Math.cos(t) * r;
    camera.position.y = 6 + Math.sin(t * 0.5) * 0.5;
    camera.lookAt(0, 1, 0);
  });
  return null;
}

/** Марсианская поверхность 60x60 с процедурными кратерами */
function MarsSurface() {
  const geomRef = useRef<THREE.PlaneGeometry>(null);

  useEffect(() => {
    const geom = geomRef.current;
    if (!geom) return;
    const pos = geom.attributes.position as THREE.BufferAttribute;
    // Псевдослучайные кратеры
    const craters = [
      { x: -8, z: -6, r: 2.2, depth: 0.7 },
      { x: 6, z: -10, r: 3.0, depth: 0.9 },
      { x: -12, z: 8, r: 2.5, depth: 0.6 },
      { x: 10, z: 6, r: 1.8, depth: 0.5 },
      { x: -4, z: 12, r: 2.0, depth: 0.55 },
      { x: 14, z: -2, r: 2.6, depth: 0.7 },
      { x: -14, z: -12, r: 1.5, depth: 0.4 },
      { x: 4, z: 14, r: 2.2, depth: 0.6 },
      { x: 0, z: -14, r: 1.9, depth: 0.5 },
      { x: -6, z: 4, r: 1.2, depth: 0.35 },
    ];
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i); // plane's local y is z after rotation
      let h = Math.sin(x * 0.3) * 0.08 + Math.cos(y * 0.35) * 0.08; // мелкие волны
      for (const c of craters) {
        const dx = x - c.x;
        const dz = y - c.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < c.r) {
          // впадина + ободок
          const t = d / c.r;
          h -= c.depth * (1 - t * t);
        } else if (d < c.r * 1.15) {
          h += c.depth * 0.25 * (1 - (d - c.r) / (c.r * 0.15));
        }
      }
      pos.setZ(i, h);

      // Цвет: медно-красный, темнее в углублениях
      const shade = Math.max(0, Math.min(1, 0.5 + h * 0.6));
      const r = 0.55 + shade * 0.35;
      const g = 0.20 + shade * 0.20;
      const b = 0.10 + shade * 0.08;
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geom.computeVertexNormals();
    pos.needsUpdate = true;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry ref={geomRef} args={[60, 60, 80, 80]} />
      <meshStandardMaterial vertexColors roughness={0.95} metalness={0.05} />
    </mesh>
  );
}

/** Теплица: купол + 3x2 изо-боксы с растениями */
function Greenhouse() {
  const domeRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (domeRef.current) {
      const mat = domeRef.current.material as THREE.MeshPhysicalMaterial;
      mat.emissiveIntensity = 0.15 + Math.sin(clock.getElapsedTime() * 0.8) * 0.05;
    }
  });

  const boxes: Array<{ x: number; z: number; color: string }> = [];
  const cols = 3;
  const rows = 2;
  const palette = ["#7ee06a", "#8be0a8", "#a3d968", "#66c68a", "#95d97e", "#7fd0a0"];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      boxes.push({
        x: (c - (cols - 1) / 2) * 1.6,
        z: (r - (rows - 1) / 2) * 1.6,
        color: palette[(r * cols + c) % palette.length],
      });
    }
  }

  return (
    <group position={[0, 0, 0]}>
      {/* Фундамент теплицы */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[4, 4.2, 0.4, 32]} />
        <meshStandardMaterial color="#5a2a1e" roughness={0.9} />
      </mesh>
      {/* Стеклянный купол */}
      <mesh ref={domeRef} position={[0, 0.15, 0]}>
        <sphereGeometry args={[3.8, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#a8ddf0"
          transparent
          opacity={0.28}
          transmission={0.6}
          thickness={0.3}
          roughness={0.05}
          metalness={0.0}
          emissive="#7ec8ff"
          emissiveIntensity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Изо-боксы внутри */}
      {boxes.map((b, i) => (
        <group key={i} position={[b.x, 0.4, b.z]}>
          <mesh>
            <boxGeometry args={[1.1, 0.5, 1.1]} />
            <meshStandardMaterial color="#8a6a55" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[0.9, 0.1, 0.9]} />
            <meshStandardMaterial color="#3d2818" roughness={1} />
          </mesh>
          {/* Растение */}
          <Plant color={b.color} seed={i} />
        </group>
      ))}
      {/* Антенна */}
      <mesh position={[0, 4.2, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1, 8]} />
        <meshStandardMaterial color="#c96038" emissive="#ff6030" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 4.75, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#ff5030" emissive="#ff5030" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}

function Plant({ color, seed }: { color: string; seed: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y = Math.sin(t * 0.3 + seed) * 0.15;
    ref.current.scale.y = 1 + Math.sin(t * 0.8 + seed) * 0.04;
  });
  return (
    <group ref={ref} position={[0, 0.55, 0]}>
      <mesh>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} roughness={0.6} />
      </mesh>
      <mesh position={[0.18, 0.05, 0]} rotation={[0, 0, -0.4]}>
        <sphereGeometry args={[0.15, 10, 10]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[-0.16, 0.08, 0.1]} rotation={[0.2, 0, 0.5]}>
        <sphereGeometry args={[0.13, 10, 10]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    </group>
  );
}
