import { useState, useEffect } from 'react';

export function useAnimation(speed = 0.008) {
    const [running, setRunning] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!running) return;

        let frame: number;
        const animate = () => {
            setProgress((prev) => {
                const next = prev + speed;
                if (next >= 1) { // Brief pause at end
                    return 0;
                }
                return next > 1 ? 1 : next;
            });
            frame = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(frame);
    }, [running, speed]);

    const reset = () => {
        setProgress(0);
        setRunning(false);
    };

    const toggle = () => setRunning(prev => !prev);

    return { running, progress, reset, toggle };
}