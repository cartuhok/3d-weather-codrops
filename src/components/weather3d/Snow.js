import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Snow = ({ count = 500 }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 20,
        y: Math.random() * 20 + 10,
        z: (Math.random() - 0.5) * 20,
        speed: Math.random() * 0.02 + 0.01,
        drift: Math.random() * 0.02 - 0.01,
      });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    particles.forEach((particle, i) => {
      particle.y -= particle.speed;
      particle.x += Math.sin(state.clock.elapsedTime + i) * particle.drift;
      
      if (particle.y < -1) {
        particle.y = 20;
        particle.x = (Math.random() - 0.5) * 20;
      }

      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.rotation.x = state.clock.elapsedTime * 2;
      dummy.rotation.y = state.clock.elapsedTime * 3;
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <octahedronGeometry args={[0.05, 0]} />
      <meshBasicMaterial color="#FFFFFF" />
    </instancedMesh>
  );
};

export default Snow;