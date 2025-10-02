'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const interests = [
  { 
    title: 'UX/UI Design',
    description: 'Crafting intuitive experiences',
    gradient: 'from-blue-50 to-indigo-50'
  },
  { 
    title: 'Front-end Development',
    description: 'Building interactive interfaces',
    gradient: 'from-violet-50 to-purple-50'
  },
  { 
    title: 'Taco',
    description: 'The essential ingredient',
    gradient: 'from-rose-50 to-pink-50'
  },
  { 
    title: 'Wordpress Development',
    description: 'Custom themes & plugins',
    gradient: 'from-amber-50 to-orange-50'
  },
];

export function ExperienceSection() {
  return (
    <section id="process" className="relative z-10 py-28">
      <div className="page-shell flex flex-col gap-20">
        <motion.div
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 24 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-black/40 font-medium">
              <span className="inline-block h-[1px] w-12 bg-black/15" />
              Process Rituals
            </div>
            <h2 className="mt-6 text-[clamp(2.5rem,5vw,4rem)] font-medium leading-[1.1] tracking-tight">
              I'm always interested about
            </h2>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Image Card */}
          <motion.div
            className="relative rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-auto lg:row-span-2"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 110, damping: 24 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image 
                src="/images/girl_look.png" 
                alt="Cô gái đang nhìn" 
                fill
                className="object-contain p-8"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </motion.div>

          {/* Interest Cards - Bento Style */}
          {interests.map((interest, idx) => (
            <motion.div
              key={interest.title}
              className="group relative rounded-2xl border border-black/5 bg-white p-8 hover:border-black/10 transition-all duration-300 cursor-pointer overflow-hidden"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: 0.2 + (idx * 0.08), 
                type: 'spring', 
                stiffness: 100, 
                damping: 20 
              }}
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ y: -4 }}
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${interest.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-black/30 font-medium">
                    0{idx + 1}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
                </div>
                
                <h3 className="text-xl font-medium tracking-tight text-black/90 group-hover:text-black transition-colors duration-300">
                  {interest.title}
                </h3>
                
                <p className="text-sm text-black/40 group-hover:text-black/60 transition-colors duration-300 leading-relaxed">
                  {interest.description}
                </p>
              </div>

              {/* Decorative Element */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-black/5 group-hover:bg-black/10 transition-all duration-500 group-hover:scale-150" />
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.p 
          className="text-[10px] uppercase tracking-[0.3em] text-black/25 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          viewport={{ once: true }}
        >
          *Tầng cảm xúc được hiệu chỉnh trước khi dựng prototype.
        </motion.p>
      </div>
    </section>
  );
}