"use client";

import { useEffect, useRef, useState } from 'react';

interface BlackHoleBackgroundProps {
  enableAnimation?: boolean;
  quality?: 'low' | 'medium' | 'high';
}

export function BlackHoleBackground({ 
  enableAnimation = true, 
  quality = 'medium' 
}: BlackHoleBackgroundProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const animationRef = useRef<number>();

  useEffect(() => {
    // Detectar dispositivos de baixa performance
    const checkPerformance = () => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (!gl) {
        setIsLowPerformance(true);
        return false;
      }
      
      // Verificar se é um dispositivo móvel ou com GPU limitada
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const renderer = gl.getParameter(gl.RENDERER);
      const isLowEndGPU = renderer && renderer.toLowerCase().includes('intel');
      
      if (isMobile || isLowEndGPU) {
        setIsLowPerformance(true);
        return false;
      }
      return true;
    };

    if (!enableAnimation || !checkPerformance()) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { 
      antialias: false, // Desabilitar antialiasing para melhor performance
      powerPreference: 'high-performance'
    });
    if (!gl) return;

    // Vertex shader
    const vert = `
      attribute vec2 position;
      void main(){ gl_Position = vec4(position,0.0,1.0); }
    `;

    // Fragment shader otimizado com menos iterações
    const getFragmentShader = (qualityLevel: string) => {
      const iterations = qualityLevel === 'low' ? 3 : qualityLevel === 'medium' ? 4 : 6;
      
      return `
        precision ${qualityLevel === 'low' ? 'mediump' : 'highp'} float;
        uniform vec2 u_res;
        uniform float u_time;

        vec2 hash2(vec2 p){
          p = vec2(dot(p,vec2(127.1,311.7)),
                   dot(p,vec2(269.5,183.3)));
          return -1.0 + 2.0*fract(sin(p)*43758.5453123);
        }
        
        float noise(vec2 p){
          const float K1=0.36602540378;
          const float K2=0.2113248654;
          vec2 i = floor(p + (p.x+p.y)*K1);
          vec2 a = p - i + (i.x+i.y)*K2;
          vec2 o = step(a.yx,a.xy);
          vec2 b = a - o + K2;
          vec2 c = a - 1.0 + 2.0*K2;
          vec3 h = max(0.5 - vec3(dot(a,a), dot(b,b), dot(c,c)), 0.0);
          vec3 n = h*h*h*h*vec3(dot(a,hash2(i)),
                                dot(b,hash2(i+o)),
                                dot(c,hash2(i+1.0)));
          return dot(n, vec3(70.0));
        }

        float fbm(vec2 p){
          float v=0.0, a=0.55;
          for(int i=0;i<${iterations};i++){
            v += a*noise(p);
            p *= 2.15;
            a *= 0.58;
          }
          return v;
        }

        vec3 ramp(float t){
          vec3 c0 = vec3(0.0078,0.0235,0.1490);
          vec3 c1 = vec3(0.0196,0.0941,0.3529);
          vec3 c2 = vec3(0.0510,0.2431,0.5765);
          vec3 c3 = vec3(0.0314,0.4118,0.8275);
          vec3 c4 = vec3(0.0471,0.7608,0.9608);
          vec3 hot = mix(c4, vec3(1.0), 0.38);
          t = clamp(t,0.0,1.0);
          if(t<0.20){ float k=t/0.20; return mix(c0,c1,k); }
          else if(t<0.45){ float k=(t-0.20)/0.25; return mix(c1,c2,k); }
          else if(t<0.75){ float k=(t-0.45)/0.30; return mix(c2,c3,k); }
          else{ float k=(t-0.75)/0.25; return mix(c3,hot,k); }
        }

        void main(){
          vec2 uv = gl_FragCoord.xy / u_res.xy;
          vec2 p = (uv - 0.5);
          p.x *= u_res.x/u_res.y;

          // Variáveis otimizadas
          float speed = 0.2;   // Velocidade reduzida
          float radius = 0.2;
          float warpFactor = 0.1; // Reduzido para melhor performance

          float distance = length(p);
          float effect = exp(-distance * warpFactor);
          p += p * effect * (1.0 - smoothstep(radius, 1.0, distance)); 

          float t = u_time * speed;

          // Menos camadas de ruído para melhor performance
          vec2 q = p*2.0; // Reduzido de 2.6 para 2.0
          q.y += t*1.2;   // Reduzido de 1.5 para 1.2
          float n1 = fbm(q + vec2(0.0,  t*0.5));
          float n2 = fbm(q*1.5 + vec2(2.0,-t*0.6));

          // Simplificado para 2 camadas em vez de 3
          float flame = (n1*0.6 + n2*0.4);
          flame = smoothstep(0.35, 0.95, flame);

          // Pulso mais suave
          float pulse = 0.5 + 0.3*sin(u_time*1.5);
          float glow = smoothstep(0.6, 0.0, length(p)) * (0.2 + 0.3*pulse);

          vec3 col = ramp(flame + glow * 0.25);
          gl_FragColor = vec4(col, 1.0);
        }
      `;
    };

    function compile(type: number, src: string) {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        setIsLowPerformance(true);
      }
      return s;
    }

    const frag = getFragmentShader(quality);
    const vs = compile(gl.VERTEX_SHADER, vert);
    const fs = compile(gl.FRAGMENT_SHADER, frag);
    
    if (!vs || !fs) {
      setIsLowPerformance(true);
      return;
    }

    const prog = gl.createProgram();
    if (!prog) return;
    
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      setIsLowPerformance(true);
      return;
    }
    
    gl.useProgram(prog);

    // Full-screen triangle
    const buf = gl.createBuffer();
    if (!buf) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'position');
    if (loc !== null) {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }

    // Uniforms
    const u_res = gl.getUniformLocation(prog, 'u_res');
    const u_time = gl.getUniformLocation(prog, 'u_time');

    function resize() {
      if (!canvas || !gl) return;
      // Limitar resolução para melhor performance
      const maxDpr = quality === 'low' ? 1 : quality === 'medium' ? 1.5 : 2;
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      gl.viewport(0, 0, w, h);
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();

    let start = performance.now();
    let frameCount = 0;
    let lastFpsCheck = start;
    
    function frame(now: number) {
      if (!gl || !canvas) return;
      
      // Monitorar FPS e reduzir qualidade se necessário
      frameCount++;
      if (now - lastFpsCheck > 1000) {
        const fps = frameCount / ((now - lastFpsCheck) / 1000);
        if (fps < 30 && quality !== 'low') {
          setIsLowPerformance(true);
          return;
        }
        frameCount = 0;
        lastFpsCheck = now;
      }
      
      const t = (now - start) / 1000;
      gl.uniform2f(u_res, canvas.width, canvas.height);
      gl.uniform1f(u_time, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      
      animationRef.current = requestAnimationFrame(frame);
    }
    animationRef.current = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [enableAnimation, quality]);

  // Fallback para dispositivos de baixa performance ou quando animação está desabilitada
  if (!enableAnimation || isLowPerformance) {
    return (
      <div 
        className="fixed inset-0 w-full h-full"
        style={{
          background: `
            radial-gradient(circle at 30% 40%, rgba(5, 24, 90, 0.8) 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, rgba(13, 62, 147, 0.6) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(8, 105, 211, 0.4) 0%, transparent 70%),
            linear-gradient(135deg, #020626 0%, #05185a 25%, #0d3e93 50%, #0869d3 75%, #0cc2f5 100%)
          `,
          zIndex: -1
        }}
      >
        {/* Efeito de partículas estáticas para manter algum visual */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.3), transparent),
              radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.2), transparent),
              radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.4), transparent),
              radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.2), transparent),
              radial-gradient(2px 2px at 160px 30px, rgba(255,255,255,0.3), transparent)
            `,
            backgroundRepeat: 'repeat',
            backgroundSize: '200px 100px'
          }}
        />
      </div>
    );
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full block"
        style={{ zIndex: -1 }}
      />
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(70% 90% at 50% 65%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 55%, rgba(0,0,0,.45) 100%)',
          mixBlendMode: 'multiply',
          zIndex: -1
        }}
      />
    </>
  );
}