'use client';

import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

const navigationLinks = [
  { label: 'Journey', href: '#journey' },
  { label: 'Persona', href: '#persona' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Process', href: '#process' },
  { label: 'Contact', href: '#contact' },
];

const navVariants = {
  initial: { y: -20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export function Navigation() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Theo dõi sự thay đổi của scrollY để điều chỉnh giao diện thanh điều hướng
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 24);
  });
  
  // Xử lý cuộn mượt mà đến phần được chọn với hiệu ứng lên xuống
  const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    
    // Lấy vị trí của phần tử mục tiêu
    const targetElement = document.querySelector(targetId);
    if (!targetElement) return;
    
    // Lấy vị trí hiện tại và vị trí đích
    const startPosition = window.scrollY;
    const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - 5; // Trừ 100px để tránh bị che bởi thanh điều hướng
    const distance = targetPosition - startPosition;
    
    // Thời gian animation (ms)
    const duration = 1000;
    // Biên độ dao động (pixel)
    const bounceAmplitude = distance > 0 ? 50 : -50; // Điều chỉnh hướng dao động dựa vào hướng cuộn
    
    let startTime: number;
    
    // Hàm animation sử dụng requestAnimationFrame
    function animateScroll(currentTime: number) {
      if (!startTime) startTime = currentTime;
      
      // Thời gian đã trôi qua (0 -> 1)
      const elapsedTime = Math.min((currentTime - startTime) / duration, 1);
      
      // Hàm easeOutBack có thêm hiệu ứng lên xuống
      const easeOutBack = (t: number) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      };
      
      // Tính toán vị trí mới với hiệu ứng dao động
      const easedProgress = easeOutBack(elapsedTime);
      const newPosition = startPosition + distance * easedProgress;
      
      // Cuộn đến vị trí mới
      window.scrollTo(0, newPosition);
      
      // Tiếp tục animation nếu chưa hoàn thành
      if (elapsedTime < 1) {
        requestAnimationFrame(animateScroll);
      }
    }
    
    // Bắt đầu animation
    requestAnimationFrame(animateScroll);
    
    // Cập nhật URL mà không làm trang tải lại
    history.pushState(null, '', targetId);
  }, []);

  // Cập nhật thời gian hiện tại mỗi giây với độ mượt cao hơn
  useEffect(() => {
    // Hàm định dạng số để luôn hiển thị 2 chữ số (thêm số 0 đằng trước nếu cần)
    const formatTimeUnit = (unit: number): string => {
      return unit < 10 ? `0${unit}` : `${unit}`;
    };

    // Hàm cập nhật thời gian với độ chính xác cao
    const updateTime = () => {
      const now = new Date();
      const hours = formatTimeUnit(now.getHours());
      const minutes = formatTimeUnit(now.getMinutes());
      const seconds = formatTimeUnit(now.getSeconds());
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
      const msToNextSecond = 1000 - now.getMilliseconds();
      return msToNextSecond;
    };

    // Cập nhật thời gian ngay lập tức khi component được render
    let timeoutId: NodeJS.Timeout;
    
    // Hàm đệ quy để đảm bảo cập nhật chính xác vào đầu mỗi giây
    const scheduleUpdate = () => {
      const msToNextSecond = updateTime();
      timeoutId = setTimeout(() => {
        scheduleUpdate();
      }, msToNextSecond);
    };
    
    // Bắt đầu chuỗi cập nhật
    scheduleUpdate();

    // Dọn dẹp timeout khi component unmount
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <motion.nav
      className={`fixed inset-x-0 top-6 z-40 flex justify-center transition-all duration-500 ${
        isScrolled ? 'md:top-4' : ''
      }`}
      variants={navVariants}
      initial="initial"
      animate="visible"
    >
      <div
        className={`relative flex w-[min(960px,90%)] items-center justify-between gap-4 rounded-full border border-black/12 bg-white/75 px-7 py-3 backdrop-blur transition-all duration-500 ${
          isScrolled ? 'shadow-[0_18px_45px_-38px_rgba(0,0,0,0.45)]' : ''
        }`}
      >
        <div className="flex flex-col text-xs uppercase tracking-[0.52em] text-black/60">
          <span><b>Gian404</b></span>
          <span className="text-[10px] text-black/35">Minimal Portfolio</span>
        </div>
        <div className="relative flex items-center gap-2 text-sm font-medium text-black/70">
          {navigationLinks.map((link) => (
            <motion.div
              key={link.href}
              onHoverStart={() => setActiveHover(link.href)}
              onHoverEnd={() => setActiveHover(null)}
              className="relative"
            >
              <Link 
                href={link.href} 
                onClick={(e) => handleSmoothScroll(e, link.href)}
                data-hoverable 
                className="rounded-full px-3 py-2 transition-colors hover:text-black"
              >
                {link.label}
              </Link>
              {activeHover === link.href && (
                <motion.span
                  layoutId="nav-hover"
                  className="absolute inset-0 -z-10 rounded-full bg-black/8"
                  transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                />
              )}
            </motion.div>
          ))}
        </div>
        <motion.div
          className="relative hidden rounded-full border border-black/12 px-4 py-2 text-xs uppercase tracking-[0.5em] text-black/55 transition-colors hover:text-black sm:flex"
          whileHover={{ y: -2, boxShadow: '0px 18px 40px rgba(0, 0, 0, 0.16)' }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          data-hoverable
        >
          {currentTime}
        </motion.div>
        
      </div>
    </motion.nav>
  );
}