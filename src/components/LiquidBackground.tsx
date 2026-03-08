import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const LiquidShader = {
  uniforms: {
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color('#1a0000') }, // Deep Green
    uColorB: { value: new THREE.Color('#2a0000') }, // Deep Blue/Teal
    uColorC: { value: new THREE.Color('#550000') }, // Bright Green
    uColorD: { value: new THREE.Color('#ff3232') }, // Bright Blue
  },
  vertexShader: `
    varying vec2 vUv;
    varying float vElevation;
    uniform float uTime;

    void main() {
      vUv = uv;
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      
      float elevation = sin(modelPosition.x * 2.0 + uTime) * 0.2;
      elevation += sin(modelPosition.z * 1.5 + uTime * 0.8) * 0.2;
      
      modelPosition.y += elevation;
      vElevation = elevation;

      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectionPosition = projectionMatrix * viewPosition;
      gl_Position = projectionPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    uniform vec3 uColorD;
    varying vec2 vUv;
    varying float vElevation;

    void main() {
      float mixStrength = (vElevation + 0.4) * 1.5;
      vec3 color = mix(uColorA, uColorB, vUv.x);
      color = mix(color, uColorC, vUv.y);
      color = mix(color, uColorD, mixStrength);
      
      gl_FragColor = vec4(color, 0.8);
    }
  `
};

const LiquidPlane = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI * 0.5, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[20, 20, 64, 64]} />
      <shaderMaterial
        fragmentShader={LiquidShader.fragmentShader}
        vertexShader={LiquidShader.vertexShader}
        uniforms={LiquidShader.uniforms}
        transparent
      />
    </mesh>
  );
};

const ElectricWire = ({ position, color = "#ff3232" }: { position: [number, number, number], color?: string }) => {
  const curve = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 20; i++) {
      points.push(new THREE.Vector3(
        i * 0.5 - 5,
        Math.sin(i * 0.5) * 0.3,
        Math.cos(i * 0.3) * 0.1
      ));
    }
    return new THREE.CatmullRomCurve3(points);
  }, []);

  const lineRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 1 + Math.sin(state.clock.getElapsedTime() * 4) * 0.5;
      lineRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5 + position[1]) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Wire Holders - Black */}
      <mesh position={[-5.1, 0, 0]}>
        <boxGeometry args={[0.2, 0.6, 0.2]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[5.1, 0, 0]}>
        <boxGeometry args={[0.2, 0.6, 0.2]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* The Wire - Transparent & Glowing */}
      <mesh ref={lineRef}>
        <tubeGeometry args={[curve, 64, 0.03, 8, false]} />
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={0.4} 
          emissive={color} 
          emissiveIntensity={1.5}
        />
      </mesh>
      
      {/* Electric Sparkles */}
      <Sparkles count={15} scale={8} size={1.5} color={color} />
    </group>
  );
};

const Sparkles = ({ count, scale, size, color }: any) => {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * scale;
      p[i * 3 + 1] = (Math.random() - 0.5) * scale * 0.2;
      p[i * 3 + 2] = (Math.random() - 0.5) * scale * 0.1;
    }
    return p;
  }, [count, scale]);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.x = Math.sin(state.clock.getElapsedTime()) * 0.1;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={size} color={color} transparent opacity={0.8} sizeAttenuation />
    </points>
  );
};

const LiquidBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#1a0a0a] to-[#2a0a0a]">
      <Canvas camera={{ position: [0, 5, 10], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <LiquidPlane />
        <ElectricWire position={[0, 2, -2]} color="#ff6666" />
        <ElectricWire position={[0, 0, -4]} color="#ff9999" />
        <ElectricWire position={[0, -2, -6]} color="#ff3232" />
      </Canvas>
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
    </div>
  );
};

export default LiquidBackground;
