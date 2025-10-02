'use client';

import { soundscapePlaylist } from '@/data/portfolio';
import gsap from 'gsap';
import { useCallback, useEffect, useRef, useState } from 'react';

// Hàm chuyển đổi chuỗi thời gian sang giây
function parseLength(length: string) {
  const [min, sec] = length.split(':').map(Number);
  return min * 60 + sec;
}

// Hàm định dạng thời gian từ giây sang chuỗi MM:SS
function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const secs = (total % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${secs}`;
}

/** Player vinyl mô phỏng âm nhạc với đĩa quay thực sự phát nhạc. */
export function MusicPlayer() {
  // State cho trình phát nhạc
  const [trackIndex, setTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(() => parseLength(soundscapePlaylist[0].length));
  const [currentTime, setCurrentTime] = useState(0);
  
  // Refs cho các thành phần UI và hoạt ảnh
  const vinylRef = useRef<HTMLDivElement | null>(null);
  const stylusRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(isPlaying);
  
  // Thông tin bài hát hiện tại
  const currentTrack = soundscapePlaylist[trackIndex];
  const displayDuration = formatTime(duration) ?? currentTrack.length;
  const displayCurrentTime = formatTime(currentTime) ?? '00:00';
  
  // Cập nhật ref khi isPlaying thay đổi
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  
  // Xử lý phát/dừng nhạc
  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (!isPlaying) {
      // Phát nhạc
      try {
        audio.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(error => {
            console.error('Lỗi khi phát nhạc:', error);
            setIsPlaying(false);
          });
      } catch (error) {
        console.error('Lỗi khi phát nhạc:', error);
        setIsPlaying(false);
      }
    } else {
      // Dừng nhạc
      audio.pause();
      setIsPlaying(false);
    }
  }, [isPlaying]);
  
  // Xử lý tua bài hát bằng progress bar
  const handleProgressBarClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      const progressBar = progressBarRef.current;
      if (!audio || !progressBar) return;
      
      const rect = progressBar.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percentage = (clickX / rect.width) * 100;
      const newTime = (percentage / 100) * duration;
      
      audio.currentTime = newTime;
      setProgress(percentage);
      setCurrentTime(newTime);
    },
    [duration]
  );

  // Xử lý khi bài hát kết thúc
  const handleTrackEnded = useCallback(() => {
    // Dừng hoạt ảnh và cập nhật trạng thái
    setIsPlaying(false);
    
    // Chuyển sang bài tiếp theo nếu có
    if (trackIndex < soundscapePlaylist.length - 1) {
      setTrackIndex(prev => prev + 1);
    } else {
      // Nếu là bài cuối cùng thì reset về bài đầu tiên
      setTrackIndex(0);
    }
  }, [trackIndex]);
  
  // Hiệu ứng hoạt ảnh cho đĩa vinyl
  useEffect(() => {
    if (!vinylRef.current) return;
    
    // Tạo hoạt ảnh quay cho đĩa vinyl
    tweenRef.current = gsap.to(vinylRef.current, {
      rotation: 360,
      ease: 'none',
      duration: 12, // Tốc độ quay
      repeat: -1, // Lặp vô hạn
      transformOrigin: '50% 50%',
    });
    
    // Mặc định tạm dừng hoạt ảnh
    tweenRef.current.pause();
    
    return () => {
      tweenRef.current?.kill();
      tweenRef.current = null;
    };
  }, []);
  
  // Hiệu ứng hoạt ảnh cho tay kim
  useEffect(() => {
    if (!stylusRef.current) return;
    
    // Điều chỉnh góc của tay kim dựa trên trạng thái phát
    gsap.to(stylusRef.current, {
      rotation: isPlaying ? 36 : 12, // Góc khi phát và khi dừng
      duration: 0.8, // Thời gian chuyển đổi
      ease: 'power3.out',
      transformOrigin: '13px 13px', // Điểm xoay
    });
  }, [isPlaying]);
  
  // Điều khiển hoạt ảnh đĩa vinyl theo trạng thái phát
  useEffect(() => {
    if (isPlaying) {
      tweenRef.current?.play();
    } else {
      tweenRef.current?.pause();
    }
  }, [isPlaying]);
  
  // Xử lý khi trackIndex thay đổi
  useEffect(() => {
    setProgress(0);
    setCurrentTime(0);
    setDuration(parseLength(currentTrack.length));
    
    const audio = audioRef.current;
    if (!audio) return;
    
    // Cập nhật source cho audio element
    audio.pause();
    audio.currentTime = 0;
    audio.src = `/musics/${encodeURIComponent(currentTrack.src)}`;
    audio.load();
    
    // Tự động phát nếu đang ở trạng thái phát
    if (isPlayingRef.current) {
      try {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error('Lỗi khi phát nhạc sau khi thay đổi bài:', error);
            setIsPlaying(false);
          });
        }
      } catch (error) {
        console.error('Lỗi khi phát nhạc:', error);
        setIsPlaying(false);
      }
    }
  }, [trackIndex, currentTrack]);
  
  // Theo dõi và cập nhật thời gian phát
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleLoadedMetadata = () => {
      if (!Number.isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      const base = !Number.isNaN(audio.duration) && audio.duration > 0 
        ? audio.duration 
        : parseLength(currentTrack.length);
      
      if (base > 0) {
        const percentage = (audio.currentTime / base) * 100;
        setProgress(Math.min(percentage, 100));
      }
    };
    
    // Thêm các event listener
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleTrackEnded); // Thêm event listener cho sự kiện kết thúc
    
    // Cleanup khi unmount
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleTrackEnded); // Xóa event listener khi unmount
    };
  }, [currentTrack, handleTrackEnded]); // Thêm handleTrackEnded vào dependency array
  
  // Thêm các nút next và prev
  const handlePrevTrack = useCallback(() => {
    // Trở về bài trước đó hoặc bài cuối cùng nếu đang ở bài đầu tiên
    setTrackIndex(prev => (prev > 0 ? prev - 1 : soundscapePlaylist.length - 1));
  }, []);

  const handleNextTrack = useCallback(() => {
    // Chuyển đến bài tiếp theo hoặc bài đầu tiên nếu đang ở bài cuối cùng
    setTrackIndex(prev => (prev < soundscapePlaylist.length - 1 ? prev + 1 : 0));
  }, []);
  
  return (
    <div className="vinyl-shadow relative flex w-full max-w-sm flex-col gap-5 rounded-3xl border border-black/10 bg-white p-6">
      {/* Audio element ẩn để phát nhạc */}
      <audio ref={audioRef} preload="metadata">
        <source src={`/musics/${encodeURIComponent(currentTrack.src)}`} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      
      {/* Tiêu đề và nút phát/dừng */}
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em]">
        <span>Chill Player</span>
        <button
          type="button"
          className="rounded-full border border-black/10 px-3 py-1"
          onClick={togglePlayPause}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
      
      {/* Đĩa vinyl và tay kim */}
      <div className="relative flex items-center justify-center">
        {/* Đĩa vinyl */}
        <div
          ref={vinylRef}
          className="relative flex h-48 w-48 items-center justify-center rounded-full border border-black/10 bg-[radial-gradient(circle_at_center,#000_0%,#111_40%,#222_55%,#000_70%)]"
        >
          {/* Lỗ giữa đĩa */}
          <div className="h-6 w-6 rounded-full bg-white" />
          
          {/* Vòng tròn đĩa */}
          <div className="absolute inset-4 rounded-full border border-white/20" />
          
          {/* Các điểm nhấn trên đĩa vinyl */}
          <div className="absolute h-full w-full">
            {/* Đường rãnh lớn - giúp nhìn rõ sự xoay của đĩa */}
            <div className="absolute left-1/2 top-2 h-2 w-2 -translate-x-1/2 rounded-full bg-white/30" />
            
            {/* Các đường rãnh phụ */}
            <div className="absolute left-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white/20" />
            <div className="absolute right-3 bottom-10 h-1 w-1 rounded-full bg-white/15" />
            <div className="absolute left-10 bottom-6 h-1.5 w-1.5 rounded-full bg-white/25" />
            
            {/* Các vệt sáng mô phỏng ánh sáng phản chiếu */}
            <div className="absolute left-1/4 top-1/4 h-14 w-0.5 rotate-45 bg-gradient-to-b from-white/5 via-white/20 to-white/5" />
            <div className="absolute right-1/3 bottom-1/3 h-10 w-0.5 -rotate-30 bg-gradient-to-t from-white/5 via-white/15 to-white/5" />
            
            {/* Đường vân đĩa vinyl */}
            <div className="absolute inset-8 rounded-full border border-white/10" />
            <div className="absolute inset-12 rounded-full border border-white/8" />
            <div className="absolute inset-16 rounded-full border border-white/6" />
            
            {/* Nội dung mờ mô phỏng nhãn của đĩa */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-black/40 p-2">
                <div className="h-full w-full rounded-full border border-white/10 p-4">
                  <div className="h-full w-full rounded-full border border-white/5"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Tay kim */}
        <div
          ref={stylusRef}
          className="absolute right-6 top-4 h-24 w-6 origin-[16px_16px] rounded-full bg-black/80"
        >
          <div className="absolute right-0 top-12 h-10 w-2 rounded-full bg-black" />
        </div>
      </div>
      
      {/* Thông tin bài hát và thanh tiến độ */}
      <div className="flex flex-col gap-2">
        {/* Tên bài hát và thời gian */}
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>{currentTrack.title}</span>
          <span>{displayCurrentTime} / {displayDuration}</span>
        </div>
        {/* Tên nghệ sĩ */}
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-black/50">
          <span>{currentTrack.composer}</span>
        </div>
        {/* Thanh tiến độ */}
        <div 
          ref={progressBarRef}
          className="relative h-1 overflow-hidden rounded-full bg-black/10 cursor-pointer" 
          onClick={handleProgressBarClick}
        >
          <div 
            className="absolute inset-y-0 left-0 bg-black" 
            style={{ width: `${Math.min(progress, 100)}%` }} 
          />
        </div>
      </div>
    </div>
  );
}