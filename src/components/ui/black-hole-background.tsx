"use client";

import { useEffect, useRef } from 'react';

export function BlackHoleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    // Vertex shader
    const vert = `
      attribute vec2 position;
      void main(){ gl_Position = vec4(position,0.0,1.0); }
    `;

    // Fragment shader com o efeito de buraco negro
    const frag = `
      precision highp float;
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
        for(int i=0;i<6;i++){
          v += a*noise(p);
          p *= 2.15;
          a *= 0.58;
        }
        return v;
      }

      vec3 ramp(float t){
        vec3 c0 = vec3(0.0078,0.0235,0.1490); // #020626
        vec3 c1 = vec3(0.0196,0.0941,0.3529); // #05185a
        vec3 c2 = vec3(0.0510,0.2431,0.5765); // #0d3e93
        vec3 c3 = vec3(0.0314,0.4118,0.8275); // #0869d3
        vec3 c4 = vec3(0.0471,0.7608,0.9608); // #0cc2f5
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

        // Variáveis do buraco negro (intensidade de distorção)
        float speed = 0.3;   // Distorção da velocidade
        float radius = 0.2;  // Tamanho do buraco negro
        float warpFactor = 0.15; // Intensidade da distorção no centro

        // Criar uma "força gravitacional" no centro
        float distance = length(p);
        float effect = exp(-distance * warpFactor);

        // Aplique distorção para simular o "buraco negro" puxando as estrelas
        p += p * effect * (1.0 - smoothstep(radius, 1.0, distance)); 

        float t = u_time * speed;

        // Ruído para gerar as chamas ao redor e movimentos
        vec2 q = p*2.6;
        q.y += t*1.5;
        float n1 = fbm(q + vec2(0.0,  t*0.6));
        float n2 = fbm(q*1.7 + vec2(2.5,-t*0.8));
        float n3 = fbm(q*3.4 + vec2(-t*0.6, 4.9));

        // Criando a chama
        float flame = (n1*0.55 + n2*0.35 + n3*0.10);
        flame = smoothstep(0.35, 0.95, flame);

        // Ajustando o brilho com um efeito de halo
        float pulse = 0.5 + 0.5*sin(u_time*1.9);
        float glow = smoothstep(0.6, 0.0, length(p)) * (0.25 + 0.35*pulse);

        // Gerando a cor com base na intensidade da chama
        vec3 col = ramp(flame + glow * 0.3);

        // Apresentando o resultado final
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    function compile(type: number, src: string) {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
      }
      return s;
    }

    const vs = compile(gl.VERTEX_SHADER, vert);
    const fs = compile(gl.FRAGMENT_SHADER, frag);
    
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
    function frame(now: number) {
      if (!gl || !canvas) return;
      const t = (now - start) / 1000;
      gl.uniform2f(u_res, canvas.width, canvas.height);
      gl.uniform1f(u_time, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

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