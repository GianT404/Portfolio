'use client';

import { motion } from 'framer-motion';

const blobKeyframes = [
  {
    scale: 1.2,
    x: 60,
    y: -50,
    rotate: 12,
  },
  {
    scale: 0.9,
    x: -80,
    y: 40,
    rotate: -18,
  },
  {
    scale: 1.05,
    x: 20,
    y: 60,
    rotate: 10,
  },
];

export function AmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute left-[5%] top-[10%] h-[520px] w-[520px] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, hsla(186,100%,63%,0.36), transparent 60%)',
        }}
        animate={blobKeyframes[0]}
        transition={{ duration: 16, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-[5%] top-[8%] h-[560px] w-[560px] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 80% 20%, hsla(286,84%,66%,0.32), transparent 60%)',
        }}
        animate={blobKeyframes[1]}
        transition={{ duration: 18, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-10%] left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, hsla(38,96%,64%,0.32), transparent 65%)',
        }}
        animate={blobKeyframes[2]}
        transition={{ duration: 20, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,25,44,0.4)_0%,transparent_70%)]" />
    </div>
  );
}
