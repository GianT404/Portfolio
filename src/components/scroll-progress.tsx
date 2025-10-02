'use client';

import { motion, useScroll } from 'framer-motion';

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-50 h-[3px] bg-transparent"
      style={{ originX: 0 }}
    >
      <motion.span
        className="block h-full w-full bg-gradient-to-r from-[hsl(186,100%,63%)] via-[hsl(286,84%,66%)] to-[hsl(38,96%,64%)]"
        style={{ scaleX: scrollYProgress }}
      />
    </motion.div>
  );
}
