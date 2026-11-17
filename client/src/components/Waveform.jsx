import { useEffect, useRef } from 'react';

// Live microphone waveform. Falls back to a soft animation if the analyser is unavailable.
export default function Waveform({ active }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = ref.current;
    const g = canvas.getContext('2d');
    const bars = 36;
    let raf, stream, ctx, analyser, data;

    const draw = (t) => {
      g.clearRect(0, 0, canvas.width, canvas.height);
      if (analyser) analyser.getByteFrequencyData(data);
      const w = canvas.width / bars;
      for (let i = 0; i < bars; i++) {
        const level = analyser
          ? data[Math.floor((i / bars) * data.length * 0.7)] / 255
          : 0.25 + 0.2 * Math.sin(t / 220 + i * 0.5);
        const h = Math.max(4, level * canvas.height);
        const grad = g.createLinearGradient(0, 0, canvas.width, 0);
        grad.addColorStop(0, '#8b9bff');
        grad.addColorStop(1, '#ff8fb8');
        g.fillStyle = grad;
        g.beginPath();
        g.roundRect(i * w + 2, (canvas.height - h) / 2, w - 4, h, 3);
        g.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        ctx = new AudioContext();
        analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        ctx.createMediaStreamSource(stream).connect(analyser);
        data = new Uint8Array(analyser.frequencyBinCount);
      } catch { /* use fallback animation */ }
      raf = requestAnimationFrame(draw);
    })();

    return () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((tr) => tr.stop());
      ctx?.close();
    };
  }, [active]);

  return <canvas ref={ref} className="wave" width="360" height="56" aria-hidden="true" />;
}
