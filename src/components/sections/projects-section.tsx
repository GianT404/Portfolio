'use client';

import { galleryEntries } from '@/data/portfolio';
import { motion } from 'framer-motion';
import { useState } from 'react';

// Utility function để kiểm tra định dạng video
const isVideoFile = (filename: string): boolean => {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
  return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
};

export function ProjectsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="gallery" className="relative z-10 py-28">
      <div className="page-shell flex flex-col gap-14">
        <motion.div
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 25 }}
          viewport={{ once: true, amount: 0.35 }}
        >
          <div className="max-w-xl">
            <div className="flex items-center gap-4 text-xs uppercase tracking-[0.35em] text-black/55">
              <span className="inline-block h-[1px] w-12 bg-black/15" />
              Project Gallery
            </div>
            <h2 className="mt-4 text-[clamp(2.2rem,4.5vw,3.5rem)] font-semibold leading-tight">
              
            </h2>
          </div>
        </motion.div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="flex flex-col gap-4">
            {galleryEntries.map((entry, index) => (
              <motion.button
                key={entry.title}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                className={`rounded-3xl border border-black/12 px-6 py-6 text-left transition-all duration-400 ${
                  activeIndex === index ? 'bg-black text-white' : 'bg-white/65 text-black'
                }`}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                data-hoverable
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em]">
                  <span>{entry.category}</span>
                  <span>{entry.year}</span>
                </div>
                <h3 className="mt-3 text-2xl font-semibold">{entry.title}</h3>
                <p className="mt-2 text-sm leading-relaxed">
                  {entry.description}
                </p>
              </motion.button>
            ))}
          </div>

          <motion.div
            className="rounded-[32px] border border-dashed border-black/18 px-10 py-12"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.35 }}
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.32em] text-black/45">
              <span>excerpt</span>
              <span>{activeIndex + 1} / {galleryEntries.length}</span>
            </div>
            <div className="mt-8 h-[254px] rounded-3xl border border-black/12 bg-[radial-gradient(circle_at_20%_20%,rgba(0,0,0,0.12),transparent_60%)] overflow-hidden relative group">
              {galleryEntries[activeIndex]?.image ? (
                // Kiểm tra định dạng file để quyết định hiển thị video hay image
                isVideoFile(galleryEntries[activeIndex].image) ? (
                  <video 
                    key={galleryEntries[activeIndex].title} // Key để force re-render khi switch project
                    src={galleryEntries[activeIndex].image} 
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                  />
                ) : (
                  <img 
                    src={galleryEntries[activeIndex].image} 
                    alt={galleryEntries[activeIndex].title}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                  />
                )
              ) : (
                <div className="w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(0,0,0,0.12),transparent_60%)]" />
              )}

            </div>
            <p className="mt-6 text-sm leading-relaxed text-black/70">
              {galleryEntries[activeIndex]?.description}
            </p>
            <div className="mt-8 flex gap-4">
              {/* Nút Github luôn hiển thị */}
              <motion.a 
                href={galleryEntries[activeIndex]?.GithubUrl}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-black/70 hover:text-black transition-colors"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-black/15">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.48 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.532 1.03 1.532 1.03.892 1.53 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.918.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" fill="currentColor"/>
                  </svg>
                </span>
                <span>Github</span>
              </motion.a>

              {/* Nút Live Demo chỉ hiển thị khi dự án có demo */}
              {galleryEntries[activeIndex]?.hasDemo && (
                <motion.a 
                  href={galleryEntries[activeIndex]?.demoUrl}
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-black/70 hover:text-black transition-colors"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-black/15">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15.5 12a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M12 4c4.97 0 9 3 9 8s-4.03 8-9 8-9-3-9-8 4.03-8 9-8z" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </span>
                  <span>Live Demo</span>
                </motion.a>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}