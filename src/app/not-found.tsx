'use client';

import { motion, Variants, Easing } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function NotFound() {
  // State để theo dõi vị trí chuột cho hiệu ứng hover
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Hiệu ứng theo dõi vị trí chuột
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // Tạo hiệu ứng chuyển động cho ánh sáng theo vị trí chuột
  const lightStyle = {
    background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 60%)`,
  };
  
  // Animation cho các thành phần
  const containerVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.8 } }
  };
  
  const numberVariants: Variants = {
    initial: { y: -40, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.8, delay: 0.3, ease: "easeOut" as Easing } }
  };
  
  const textVariants: Variants = {
    initial: { y: 40, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.8, delay: 0.5, ease: "easeOut" as Easing } }
  };
  
  const buttonVariants: Variants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.6, delay: 0.7 } },
    hover: { 
      y: -5,
      boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.15)',
      transition: { duration: 0.3 }
    }
  };
  
  const glitchEffect: Variants = {
    initial: { transform: 'skew(0deg)' },
    animate: {
      x: [0, -5, 5, -3, 3, 0],
      transform: ['skew(0deg)', 'skew(-2deg)', 'skew(2deg)', 'skew(-1deg)', 'skew(1deg)', 'skew(0deg)'],
      transition: {
        repeat: Infinity,
        repeatType: 'mirror' as const,
        duration: 5,
        repeatDelay: 3
      }
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center bg-white overflow-hidden">
      {/* Lớp ánh sáng theo dõi chuột */}
      <div className="absolute inset-0 z-0" style={lightStyle} />
      
      {/* Họa tiết nền */}
      <div className="absolute inset-0 z-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.15)_70%)]" />
        <div className="grid h-full w-full grid-cols-[repeat(20,1fr)] grid-rows-[repeat(20,1fr)]">
          {[...Array(400)].map((_, i) => (
            <div key={i} className="border-t border-l border-black/5" />
          ))}
        </div>
      </div>
      
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center gap-4 px-4 text-center"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {/* Số 404 với hiệu ứng glitch */}
        <motion.h1
          className="relative text-[10rem] font-bold leading-none tracking-tighter text-black md:text-[16rem]"
          variants={numberVariants}
        >
          <motion.span
            className="absolute inset-0 text-cyan-500/30"
            variants={glitchEffect}
            animate="animate"
            aria-hidden="true"
          >
            404
          </motion.span>
          <motion.span
            className="absolute inset-0 black"
            variants={glitchEffect}
            animate="animate"
            style={{ animationDelay: '0.1s' }}
            aria-hidden="true"
          >
            404
          </motion.span>
          404
        </motion.h1>
        
        {/* Thông báo lỗi */}
        <motion.div
          className="mb-8 flex flex-col gap-2"
          variants={textVariants}
        >
          <p className="text-lg font-medium uppercase tracking-[0.35em] text-black/50 md:text-xl">
            Page Not Found
          </p>
          <p className="text-sm text-black/40 max-w-md">
            The page you are looking for might have been moved or doesn't exist in this space.
          </p>
        </motion.div>
        
        {/* Nút quay về trang chủ */}
        <motion.div
          variants={buttonVariants}
          whileHover="hover"
        >
          <Link href="/" className="group flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm uppercase tracking-[0.25em] text-black/60 transition-colors hover:text-black">
            <span>Go back to the main space →</span>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}