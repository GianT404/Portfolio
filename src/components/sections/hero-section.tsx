'use client';

import { journeyCopy } from '@/data/portfolio';
import { MusicPlayer } from '@/components/music-player';
import { motion } from 'framer-motion';

export function HeroSection() {
  return (
    <section id="journey" className="relative z-10 flex min-h-[100vh] items-center pt-36">
      <div className="page-shell grid gap-16 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.7fr)]">
        <div className="flex flex-col gap-10">
          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.4em]">
            <span>Whimsical Minimalism</span>
            <span aria-hidden>•</span>
            <span>Monochrome</span>
          </div>
<motion.h1
  className="glitch text-[clamp(2.8rem,4.8vw,5.5rem)] font-bold leading-[0.92] text-white"
  style={{
    WebkitTextStroke: '1px black', // viền 
    color: 'white',                // màu chữ chính
  }}
  data-text={journeyCopy.title}
  initial={{ y: 40, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ type: 'spring', stiffness: 120, damping: 22 }}
>
  {journeyCopy.title}
</motion.h1>

          <motion.p
            className="max-w-xl text-lg leading-relaxed text-black/70"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6, ease: 'easeOut' }}
          >
            {journeyCopy.manifesto}
          </motion.p>

          <motion.div
            className="inline-flex flex-wrap items-center gap-4 text-sm uppercase tracking-[0.35em]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
          <a 
            href="https://www.topcv.vn/xem-cv/Wg9XWgoMUVQFAV0EAAEAUAYBDQIHBQIDVF5QDw4f14" 
            target="_blank" 
            rel="noopener noreferrer"
            className="floating-orb px-6 py-3" 
            data-hoverable
          >
            {journeyCopy.buttonPrimary}
          </a>
          </motion.div>
        </div>

        <div className="relative flex flex-col items-end gap-10">
          <motion.div
            className="absolute -right-12 -top-20 h-32 w-32 rounded-full border border-black/10"
            animate={{ scale: [1, 1.08, 1], boxShadow: ['0 0 0 rgba(0,0,0,0.05)', '0 0 60px rgba(0,0,0,0.15)', '0 0 0 rgba(0,0,0,0.05)'] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -right-32 top-24 h-20 w-20 rounded-full border border-black/10"
            animate={{ y: [0, -18, 12, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <MusicPlayer />
  <div className="overflow-hidden">
      <motion.p 
        className="text-base italic leading-relaxed text-black/75 text-right direction-rtl"
        initial={{ opacity: 0 }} // Bắt đầu từ bên phải màn hình
        whileInView={{ opacity: 1 }} // Chạy từ phải sang trái
        transition={{ 
          delay: 0.6, 
          duration: 1.5, 
          ease: "easeOut",
          // Tạo hiệu ứng đánh máy từ phải sang trái cho mỗi chữ
          staggerChildren: 0.1,
          staggerDirection: -1 // Ngược chiều (-1)  
        }}
      >
        {/* Phần văn bản trích dẫn */}
        <span className="inline-block">
          Winter is coming
        </span>
      </motion.p>
    </div>
  {/* Tên tác giả xuất hiện sau */}
  <motion.div 
    className="self-end text-sm uppercase tracking-[0.2em] text-black/60 pr-4"
    initial={{ opacity: 0, x: 20 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ delay: 1.4, duration: 0.5 }}
  >
    — Ned Stark
  </motion.div>
        </div>
      </div>
    </section>
  );
}
