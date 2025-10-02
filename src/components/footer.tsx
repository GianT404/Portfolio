'use client';

import { motion } from 'framer-motion';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <motion.footer
      className="mx-auto mb-10 mt-16 w-[min(1080px,92vw)] rounded-3xl border border-glass bg-surface px-6 py-6 text-xs uppercase tracking-[0.35em] text-subtle"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ type: 'spring', stiffness: 160, damping: 24 }}
    >

      <div className='text-center'>
        Made by{' '}
        <motion.a
          href="/admin"
          className="text-subtle hover:text-black transition-colors cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ミＧＩＡＮ4０４シ
        </motion.a>
      </div>
    </motion.footer>
  );
}
