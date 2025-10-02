'use client';

import { journeyCopy } from '@/data/portfolio';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { saveScore, getLeaderboard, getUserScores, getUserStats, type LeaderboardEntry } from '@/lib/leaderboard-service';

// Interface cho Snake Game
interface SnakeSegment {
  x: number;
  y: number;
}

interface Food {
  x: number;
  y: number;
}

interface Position {
  x: number;
  y: number;
}

// Không cần interface LeaderboardEntry nữa vì đã import từ leaderboard-service

// GlobalWebSnake component - con rắn có thể di chuyển khắp trang web
function GlobalWebSnake({ onScoreSubmit }: { onScoreSubmit?: (name: string, score: number) => void }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [hitElement, setHitElement] = useState<string>('');
  const [isMoving, setIsMoving] = useState(false); // Trạng thái di chuyển
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(true);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  
  // Sử dụng ref để track score trong game loop (tránh stale closure)
  const scoreRef = useRef(0);
  
  // Sync scoreRef với score state
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  
  const gameStateRef = useRef({
    snake: [{ x: 100, y: 100 }] as SnakeSegment[],
    direction: { x: 0, y: 0 } as Position, // Bắt đầu không có hướng
    food: { x: 200, y: 200 } as Food,
    lastMoveTime: 0,
    moveSpeed: 150, // milliseconds per move
  });

  const SNAKE_SIZE = 20;

  // Tạo snake segment DOM element
  const createSnakeSegment = useCallback((x: number, y: number, isHead: boolean = false) => {
    if (typeof document === 'undefined') return;
    
    const segment = document.createElement('div');
    segment.className = `snake-segment ${isHead ? 'snake-head' : ''}`;
    segment.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: ${SNAKE_SIZE}px;
      height: ${SNAKE_SIZE}px;
      background: ${isHead ? '#10b981' : '#059669'};
      border: 2px solid #065f46;
      border-radius: 4px;
      z-index: 10000;
      transition: all 0.05s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(segment);
    
    console.log(`🟢 Created snake ${isHead ? 'HEAD' : 'segment'} at (${x}, ${y})`);
  }, [SNAKE_SIZE]);

  // Tạo food DOM element
  const createFood = useCallback((x: number, y: number) => {
    if (typeof document === 'undefined') return;
    
    // Xóa food cũ
    document.querySelectorAll('.snake-food').forEach(el => el.remove());
    
    const food = document.createElement('div');
    food.className = 'snake-food';
    food.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: ${SNAKE_SIZE}px;
      height: ${SNAKE_SIZE}px;
      background: #ef4444;
      border: 2px solid #dc2626;
      border-radius: 50%;
      z-index: 10000;
      animation: pulse 1s infinite;
      box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
    `;
    document.body.appendChild(food);
  }, [SNAKE_SIZE]);

  // Kiểm tra va chạm với DOM elements
  const checkWallCollision = useCallback((x: number, y: number) => {
    if (typeof document === 'undefined') return false;

    // Kiểm tra biên của viewport
    if (x < 0 || x > window.innerWidth - SNAKE_SIZE || y < 0 || y > window.innerHeight - SNAKE_SIZE) {
      return true;
    }

    // Kiểm tra va chạm với các DOM elements
    const elements = document.elementsFromPoint(x + SNAKE_SIZE/2, y + SNAKE_SIZE/2);
    
    for (const element of elements) {
      // Bỏ qua các element của game và body/html
      if (element.classList.contains('snake-segment') || 
          element.classList.contains('snake-food') ||
          element === document.body || 
          element === document.documentElement) {
        continue;
      }

      // Kiểm tra nếu element có kích thước đáng kể (không phải text node hoặc invisible)
      const rect = element.getBoundingClientRect();
      if (rect.width > 10 && rect.height > 10) {
        // Highlight element khi va chạm
        (element as HTMLElement).style.outline = '2px solid #ef4444';
        setTimeout(() => {
          (element as HTMLElement).style.outline = '';
        }, 200);
        return true;
      }
    }

    return false;
  }, [SNAKE_SIZE]);

  // Kiểm tra ăn food
  const checkFoodCollision = useCallback((x: number, y: number) => {
    const state = gameStateRef.current;
    const distance = Math.sqrt(
      Math.pow(x - state.food.x, 2) + Math.pow(y - state.food.y, 2)
    );
    
    if (distance < SNAKE_SIZE) {
      console.log('🍎 Food eaten! Current score before increment:', score);
      setScore(prev => {
        const newScore = prev + 10;
        scoreRef.current = newScore; // Cập nhật ref ngay lập tức
        console.log('🎯 Score updated from', prev, 'to', newScore);
        return newScore;
      });
      return true;
    }
    return false;
  }, [SNAKE_SIZE]);

  // Tạo food mới ở vị trí safe
  const generateFood = useCallback(() => {
    if (typeof window === 'undefined') return;

    let attempts = 0;
    let foodX, foodY;
    
    do {
      foodX = Math.random() * (window.innerWidth - SNAKE_SIZE);
      foodY = Math.random() * (window.innerHeight - SNAKE_SIZE);
      attempts++;
    } while (checkWallCollision(foodX, foodY) && attempts < 50);

    gameStateRef.current.food = { x: foodX, y: foodY };
    createFood(foodX, foodY);
  }, [checkWallCollision, createFood, SNAKE_SIZE]);

  // Function để ẩn con rắn và thức ăn với hiệu ứng đẹp
  const hideGameElements = useCallback(() => {
    const elements = document.querySelectorAll('.snake-segment, .snake-food');
    
    elements.forEach((el, index) => {
      setTimeout(() => {
        (el as HTMLElement).style.cssText += `
          opacity: 0 !important;
          transform: scale(0.3) rotate(180deg) !important;
          transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
        `;
      }, index * 50); // Stagger animation
    });
    
    // Xóa hoàn toàn sau animation
    setTimeout(() => {
      elements.forEach(el => el.remove());
    }, elements.length * 50 + 600);
  }, []);

  // Cập nhật DOM elements của rắn
  const updateSnakeDOM = useCallback(() => {
    if (typeof document === 'undefined') return;
    
    // Xóa các segment cũ
    document.querySelectorAll('.snake-segment').forEach(el => el.remove());
    
    // Tạo các segment mới
    const state = gameStateRef.current;
    state.snake.forEach((segment, index) => {
      createSnakeSegment(segment.x, segment.y, index === 0);
    });
  }, [createSnakeSegment]);

  // Tìm vị trí spawn an toàn cho con rắn
  const findSafeSpawnPosition = useCallback(() => {
    if (typeof window === 'undefined') return { x: 100, y: 100 };

    let attempts = 0;
    let safeX, safeY;
    
    do {
      // Random position trong viewport với margin
      safeX = Math.random() * (window.innerWidth - SNAKE_SIZE * 4) + SNAKE_SIZE * 2;
      safeY = Math.random() * (window.innerHeight - SNAKE_SIZE * 4) + SNAKE_SIZE * 2;
      attempts++;

      // Kiểm tra vùng an toàn 3x3 segments xung quanh vị trí spawn
      let isSafe = true;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const checkX = safeX + (dx * SNAKE_SIZE);
          const checkY = safeY + (dy * SNAKE_SIZE);
          
          // Kiểm tra collision với obstacles tại điểm này
          const obstacles: Array<{element: Element, bounds: DOMRect, text: string, type: string}> = [];
          
          // Simple obstacle check - scan elements at point
          const elements = document.elementsFromPoint(checkX + SNAKE_SIZE/2, checkY + SNAKE_SIZE/2);
          for (const element of elements) {
            if (element.classList.contains('snake-segment') || 
                element.classList.contains('snake-food') ||
                element.classList.contains('snake-game-container') ||
                element === document.body || 
                element === document.documentElement) {
              continue;
            }

            const rect = element.getBoundingClientRect();
            if (rect.width > 10 && rect.height > 10 && 
                (element.textContent && element.textContent.trim().length > 2)) {
              isSafe = false;
              break;
            }
          }
          
          if (!isSafe) break;
        }
        if (!isSafe) break;
      }

      if (isSafe) {
        console.log('🎯 Found safe spawn at:', { x: safeX, y: safeY }, 'after', attempts, 'attempts');
        return { x: safeX, y: safeY };
      }

    } while (attempts < 50); // Tối đa 50 lần thử

    // Fallback positions nếu không tìm được
    const fallbackPositions = [
      { x: 100, y: 100 },
      { x: 200, y: 150 },
      { x: 150, y: 200 },
      { x: 300, y: 100 },
      { x: 100, y: 300 }
    ];
    
    console.log('⚠️ Using fallback spawn position');
    return fallbackPositions[Math.floor(Math.random() * fallbackPositions.length)];
  }, [SNAKE_SIZE]);

  // Bắt đầu game
  const startGame = useCallback(() => {
    if (!playerName.trim()) {
      alert('Please enter your name before playing!');
      return;
    }

    console.log('🎮 Starting game...');
    setShowNameInput(false);
    setScoreSubmitted(false);
    setScore(0); // ✅ Reset score khi bắt đầu game mới
    scoreRef.current = 0; // ✅ Reset ref cũng
    
    // Xóa tất cả game elements cũ ngay lập tức (bỏ qua animation)
    if (typeof document !== 'undefined') {
      document.querySelectorAll('.snake-segment, .snake-food').forEach(el => {
        el.remove();
      });
      console.log('🧹 Force cleaned up all game elements');
    }
    
    // Tìm vị trí spawn an toàn
    const safeSpawn = findSafeSpawnPosition();
    
    if (gameOver) {
      // Reset game - KHÔNG reset score ngay lập tức vì cần lưu vào Firebase trước
      console.log('🔄 Resetting game state...');
      // setScore(0); // ❌ Removed: Điều này làm score = 0 trước khi submit
      setGameOver(false);
      setHitElement('');
    }
    
    // Reset trạng thái di chuyển
    setIsMoving(false);
    
    // Con rắn sẽ đứng yên cho đến khi người dùng nhấn phím
    gameStateRef.current = {
      snake: [safeSpawn],
      direction: { x: 0, y: 0 }, // Không có hướng di chuyển
      food: { x: 200, y: 200 },
      lastMoveTime: 0,
      moveSpeed: 150,
    };
    
    console.log('🐍 Snake spawned at:', safeSpawn, 'waiting for input...');
    
    console.log('Setting gameStarted to true');
    setGameStarted(true);
    
    // Hiển thị snake ngay lập tức với multiple timeouts để đảm bảo
    setTimeout(() => {
      console.log('🎯 First snake DOM update...');
      updateSnakeDOM();
    }, 10);
    
    setTimeout(() => {
      console.log('🎯 Second snake DOM update (backup)...');
      updateSnakeDOM();
      generateFood();
    }, 50);
  }, [gameOver, generateFood, findSafeSpawnPosition, playerName, updateSnakeDOM]);

  // Khởi tạo và hiển thị snake DOM khi game bắt đầu hoặc reset
  useEffect(() => {
    if (gameStarted && !gameOver) {
      console.log('🐍 Displaying initial snake...');
      // Delay một chút để đảm bảo gameState đã được cập nhật
      setTimeout(() => {
        updateSnakeDOM();
        
        // Debug log để kiểm tra vị trí
        const head = gameStateRef.current.snake[0];
        console.log('Snake head should be visible at:', head.x, head.y);
      }, 10);
    }
  }, [gameStarted, gameOver, updateSnakeDOM]);

  // Đảm bảo snake được hiển thị khi reset từ game over
  useEffect(() => {
    if (gameStarted && !gameOver && !isMoving) {
      console.log('🔄 Game reset detected, ensuring snake visibility...');
      setTimeout(() => {
        updateSnakeDOM();
      }, 30);
    }
  }, [gameStarted, gameOver, isMoving, updateSnakeDOM]);

  // Tự động bắt đầu game loop khi game started và isMoving
  useEffect(() => {
    if (gameStarted && !gameOver && isMoving) {
      console.log('Starting game loop effect...');
      
      // Khởi tạo lastMoveTime
      gameStateRef.current.lastMoveTime = performance.now();
      
      // Bắt đầu loop với interval thay vì requestAnimationFrame
      const gameInterval = setInterval(() => {
        const state = gameStateRef.current;
        
        // Chỉ di chuyển nếu có hướng (không phải 0,0)
        if (state.direction.x === 0 && state.direction.y === 0) {
          return; // Không di chuyển nếu chưa có hướng
        }
        
        console.log('Interval tick - moving snake');
        
        const head = state.snake[0];
        const newHeadX = head.x + (state.direction.x * SNAKE_SIZE);
        const newHeadY = head.y + (state.direction.y * SNAKE_SIZE);

        console.log('Movement:', { 
          from: { x: head.x, y: head.y }, 
          to: { x: newHeadX, y: newHeadY }, 
          direction: state.direction 
        });

        // Kiểm tra va chạm với biên viewport
        if (newHeadX < 0 || newHeadX > window.innerWidth - SNAKE_SIZE || 
            newHeadY < 0 || newHeadY > window.innerHeight - SNAKE_SIZE) {
          console.log('Hit viewport boundary!');
          
          // Ẩn con rắn và thức ăn
          hideGameElements();
          
          setGameOver(true);
          return;
        }

        // Kiểm tra va chạm với DOM elements - kiểm tra nhiều điểm của snake head
        let collision = false;
        let hitElementInfo = '';
        
        // Kiểm tra 5 điểm chính của snake head 
        const checkPoints = [
          { x: newHeadX + SNAKE_SIZE/2, y: newHeadY + SNAKE_SIZE/2 }, // center (chính)
          { x: newHeadX + 5, y: newHeadY + 5 }, // top-left inner
          { x: newHeadX + SNAKE_SIZE - 5, y: newHeadY + 5 }, // top-right inner
          { x: newHeadX + 5, y: newHeadY + SNAKE_SIZE - 5 }, // bottom-left inner
          { x: newHeadX + SNAKE_SIZE - 5, y: newHeadY + SNAKE_SIZE - 5 }, // bottom-right inner
        ];

        // Tìm obstacles trong khu vực thực tế (viewport + margin)
        const findObstaclesAt = (x: number, y: number) => {
          const obstacles: Array<{element: Element, bounds: DOMRect, text: string, type: string}> = [];
          
          // Chỉ scan elements trong viewport + margin (performance optimization)
          const viewportMargin = 200; // 200px margin
          const currentViewport = {
            top: window.scrollY - viewportMargin,
            bottom: window.scrollY + window.innerHeight + viewportMargin,
            left: -viewportMargin,
            right: window.innerWidth + viewportMargin
          };
          
          // Scan text elements trong specific content areas (targeted scanning)
          const textElements = document.querySelectorAll(`
            section[id] h1, section[id] h2, section[id] h3, section[id] p, section[id] span:not(.snake-segment):not(.snake-food),
            .hero-content h1, .hero-content h2, .hero-content p, .hero-content span,
            .about-content h1, .about-content h2, .about-content p, .about-content span,
            .project-card h1, .project-card h2, .project-card h3, .project-card p, .project-card span,
            .experience-item h1, .experience-item h2, .experience-item h3, .experience-item p, .experience-item span,
            main article h1, main article h2, main article h3, main article p, main article span,
            [class*="content"] h1, [class*="content"] h2, [class*="content"] h3, [class*="content"] p, [class*="content"] span:not(.snake-segment):not(.snake-food)
          `);
          
          // Scan interactive elements trong content areas (targeted scanning)
          const interactiveElements = document.querySelectorAll(`
            section[id] button:not(.snake-game-container button), 
            section[id] .floating-orb:not(.snake-game-container .floating-orb), 
            section[id] .rounded-3xl:not(.snake-game-container .rounded-3xl),
            .hero-content button, .hero-content .floating-orb, .hero-content .rounded-3xl,
            .about-content button:not(.snake-game-container button), .about-content .floating-orb:not(.snake-game-container .floating-orb), .about-content .rounded-3xl:not(.snake-game-container .rounded-3xl),
            .project-card, .experience-item, .contact-form,
            main article button, main article .floating-orb, main article .rounded-3xl,
            header:not(.snake-game-container), footer:not(.snake-game-container)
          `);
          
          // Navigation chỉ trong header/top area
          const navigationElements = document.querySelectorAll('header nav, header nav *, nav[class*="nav"], .nav, [role="navigation"], header a[href*="#"]');
          
          // Debug info (track performance optimization)
          const debugInfo = {
            totalText: textElements.length,
            totalInteractive: interactiveElements.length,
            totalNavigation: navigationElements.length,
            scannedText: 0,
            scannedInteractive: 0,
            scannedNavigation: 0
          };
          
          // Process text elements (với viewport filtering)
          for (const element of textElements) {
            // Bỏ qua game elements
            if (element.classList.contains('snake-segment') || 
                element.classList.contains('snake-food') ||
                element.classList.contains('snake-game-container') ||
                element.closest('.snake-game-container')) {
              continue;
            }

            const text = element.textContent?.trim();
            if (!text || text.length < 3 || text.includes('snake')) continue;

            // Tạo text range để lấy chính xác bounds của text
            const range = document.createRange();
            range.selectNodeContents(element);
            const textRect = range.getBoundingClientRect();
            
            // Chỉ kiểm tra elements trong viewport
            const absoluteTop = textRect.top + window.scrollY;
            const absoluteBottom = textRect.bottom + window.scrollY;
            if (absoluteBottom < currentViewport.top || absoluteTop > currentViewport.bottom) {
              continue; // Skip elements ngoài viewport
            }
            
            debugInfo.scannedText++; // Track scanned elements
            
            // Kiểm tra nếu điểm (x,y) nằm trong text bounds
            if (x >= textRect.left && x <= textRect.right && 
                y >= textRect.top && y <= textRect.bottom) {
              obstacles.push({
                element,
                bounds: textRect,
                text: text.substring(0, 50),
                type: 'text'
              });
            }
          }

          // Process interactive elements (buttons, containers) trong viewport
          for (const element of interactiveElements) {
            // Bỏ qua game elements
            if (element.classList.contains('snake-segment') || 
                element.classList.contains('snake-food') ||
                element.classList.contains('snake-game-container') ||
                element.closest('.snake-game-container')) {
              continue;
            }

            const rect = element.getBoundingClientRect();
            
            // Viewport filtering
            const absoluteTop = rect.top + window.scrollY;
            const absoluteBottom = rect.bottom + window.scrollY;
            if (absoluteBottom < currentViewport.top || absoluteTop > currentViewport.bottom) {
              continue; // Skip elements ngoài viewport
            }
            
            debugInfo.scannedInteractive++; // Track scanned elements
            
            // Chỉ collision với elements có kích thước đáng kể
            if (rect.width < 20 || rect.height < 20) continue;

            // Kiểm tra nếu điểm (x,y) nằm trong element bounds
            if (x >= rect.left && x <= rect.right && 
                y >= rect.top && y <= rect.bottom) {
              const elementDesc = element.tagName + 
                (element.className ? '.' + element.className.split(' ')[0] : '') +
                (element.textContent ? ': ' + element.textContent.trim().substring(0, 30) : '');
              
              obstacles.push({
                element,
                bounds: rect,
                text: elementDesc,
                type: 'container'
              });
            }
          }

          // Process navigation elements với logic đặc biệt - chỉ top navigation
          for (const element of navigationElements) {
            // Bỏ qua game elements
            if (element.classList.contains('snake-segment') || 
                element.classList.contains('snake-food') ||
                element.classList.contains('snake-game-container') ||
                element.closest('.snake-game-container')) {
              continue;
            }

            const rect = element.getBoundingClientRect();
            
            // Chỉ xử lý navigation ở phần trên của trang (top 20% viewport)
            if (rect.top > window.innerHeight * 0.2) continue;
            
            debugInfo.scannedNavigation++; // Track scanned elements
            
            // Navigation elements có threshold thấp hơn
            if (rect.width < 15 || rect.height < 15) continue;

            // Kiểm tra collision với navigation
            if (x >= rect.left && x <= rect.right && 
                y >= rect.top && y <= rect.bottom) {
              
              // Đặc biệt xử lý cho navigation items trong header
              const isTopNavLink = element.tagName === 'A' && (
                element.closest('header') || 
                element.closest('nav') || 
                rect.top < 100 // Elements trong 100px đầu
              );
              const isTopNavButton = element.tagName === 'BUTTON' && (
                element.closest('header') || 
                element.closest('nav') ||
                rect.top < 100
              );
              const isTopNavContainer = (
                element.tagName === 'NAV' || 
                element.tagName === 'HEADER' ||
                element.className.includes('nav')
              ) && rect.top < 100;
              
              if (isTopNavLink || isTopNavButton || isTopNavContainer) {
                const navText = element.textContent?.trim();
                const isNavItem = navText && (
                  navText.includes('Journey') ||
                  navText.includes('Persona') ||
                  navText.includes('Gallery') ||
                  navText.includes('Process') ||
                  navText.includes('Contact') ||
                  navText.length < 20 // Short navigation text
                );
                
                if (isNavItem || isTopNavContainer) {
                  const navDesc = 'Navigation: ' + (navText?.substring(0, 15) || element.tagName);
                  
                  obstacles.push({
                    element,
                    bounds: rect,
                    text: navDesc,
                    type: 'navigation'
                  });
                }
              }
            }
          }
          
          // Log performance optimization info
          if (obstacles.length > 0) {
            console.log(`🎯 Collision scan: ${debugInfo.scannedText}/${debugInfo.totalText} text, ${debugInfo.scannedInteractive}/${debugInfo.totalInteractive} interactive, ${debugInfo.scannedNavigation}/${debugInfo.totalNavigation} nav elements`);
          }
          
          return obstacles;
        };

        // Kiểm tra collision với obstacles (text + containers) tại các điểm của snake
        for (const point of checkPoints) {
          const obstacleHits = findObstaclesAt(point.x, point.y);
          
          for (const hit of obstacleHits) {
            const snakeRect = {
              left: newHeadX,
              right: newHeadX + SNAKE_SIZE,
              top: newHeadY,
              bottom: newHeadY + SNAKE_SIZE
            };

            // Kiểm tra overlap với obstacle bounds
            const overlapLeft = Math.max(snakeRect.left, hit.bounds.left);
            const overlapRight = Math.min(snakeRect.right, hit.bounds.right);
            const overlapTop = Math.max(snakeRect.top, hit.bounds.top);
            const overlapBottom = Math.min(snakeRect.bottom, hit.bounds.bottom);

            const overlapWidth = Math.max(0, overlapRight - overlapLeft);
            const overlapHeight = Math.max(0, overlapBottom - overlapTop);
            const overlapArea = overlapWidth * overlapHeight;
            const snakeArea = SNAKE_SIZE * SNAKE_SIZE;
            const overlapPercentage = overlapArea / snakeArea;

            // Threshold khác nhau cho từng loại obstacle
            let threshold = 0.15; // Default cho text
            if (hit.type === 'container') threshold = 0.25;
            if (hit.type === 'navigation') threshold = 0.20; // Navigation ở giữa
            
            if (overlapPercentage > threshold) {
              
              hitElementInfo = hit.text;
              console.log(`${hit.type.toUpperCase()} COLLISION!`, {
                element: hitElementInfo,
                type: hit.type,
                overlapPercentage: (overlapPercentage * 100).toFixed(1) + '%',
                snakePos: { x: newHeadX, y: newHeadY },
                bounds: { 
                  x: hit.bounds.left, 
                  y: hit.bounds.top, 
                  w: hit.bounds.width, 
                  h: hit.bounds.height 
                }
              });
              
              // Lưu thông tin obstacle va chạm
              setHitElement(hitElementInfo);
              
              // Visual effect khác nhau cho từng loại obstacle
              if (hit.type === 'text') {
                // Text highlighting
                (hit.element as HTMLElement).style.cssText += `
                  background-color: rgba(239, 68, 68, 0.2) !important;
                  color: #ef4444 !important;
                  text-shadow: 0 0 10px rgba(239, 68, 68, 0.5) !important;
                  transform: scale(1.05) !important;
                  transition: all 0.3s ease !important;
                `;
              } else if (hit.type === 'navigation') {
                // Navigation highlighting - đặc biệt
                (hit.element as HTMLElement).style.cssText += `
                  outline: 2px solid #ef4444 !important;
                  outline-offset: 1px !important;
                  background-color: rgba(239, 68, 68, 0.15) !important;
                  color: #ef4444 !important;
                  transform: scale(1.03) !important;
                  box-shadow: 0 0 12px rgba(239, 68, 68, 0.4) !important;
                  transition: all 0.3s ease !important;
                `;
              } else {
                // Container highlighting
                (hit.element as HTMLElement).style.cssText += `
                  outline: 3px solid #ef4444 !important;
                  outline-offset: 2px !important;
                  background-color: rgba(239, 68, 68, 0.1) !important;
                  transform: scale(1.02) !important;
                  box-shadow: 0 0 15px rgba(239, 68, 68, 0.3) !important;
                  transition: all 0.3s ease !important;
                `;
              }
              
              setTimeout(() => {
                (hit.element as HTMLElement).style.backgroundColor = '';
                (hit.element as HTMLElement).style.color = '';
                (hit.element as HTMLElement).style.textShadow = '';
                (hit.element as HTMLElement).style.transform = '';
                (hit.element as HTMLElement).style.outline = '';
                (hit.element as HTMLElement).style.outlineOffset = '';
                (hit.element as HTMLElement).style.boxShadow = '';
              }, 1000);
              
              collision = true;
              break;
            }
          }
          
          if (collision) break;
        }

        if (collision) {
          // Ẩn con rắn và thức ăn khi game over
          document.querySelectorAll('.snake-segment, .snake-food').forEach(el => {
            (el as HTMLElement).style.opacity = '0';
            (el as HTMLElement).style.transform = 'scale(0.5)';
            (el as HTMLElement).style.transition = 'all 0.5s ease';
          });
          
          // Xóa hoàn toàn sau animation
          setTimeout(() => {
            document.querySelectorAll('.snake-segment, .snake-food').forEach(el => el.remove());
          }, 500);
          
          setGameOver(true);
          
          // Submit score khi game over
          if (onScoreSubmit && playerName && !scoreSubmitted) {
            const finalScore = scoreRef.current; // Sử dụng ref để lấy score hiện tại
            console.log(`📊 Submitting score: ${finalScore} for player: ${playerName} (score state: ${score})`);
            onScoreSubmit(playerName, finalScore);
            setScoreSubmitted(true);
          } else {
            console.log(`❌ Score NOT submitted - onScoreSubmit: ${!!onScoreSubmit}, playerName: ${playerName}, scoreSubmitted: ${scoreSubmitted}, current score: ${score}, scoreRef: ${scoreRef.current}`);
          }
          return;
        }

        // Kiểm tra va chạm với chính mình
        for (const segment of state.snake) {
          if (newHeadX === segment.x && newHeadY === segment.y) {
            console.log('Hit self!');
            
            // Ẩn con rắn và thức ăn với animation đẹp
            hideGameElements();
            
            setGameOver(true);
            
            // Submit score khi game over
            if (onScoreSubmit && playerName && !scoreSubmitted) {
              const finalScore = scoreRef.current; // Sử dụng ref để lấy score hiện tại
              console.log(`📊 Submitting score (self collision): ${finalScore} for player: ${playerName} (score state: ${score})`);
              onScoreSubmit(playerName, finalScore);
              setScoreSubmitted(true);
            } else {
              console.log(`❌ Score NOT submitted (self collision) - onScoreSubmit: ${!!onScoreSubmit}, playerName: ${playerName}, scoreSubmitted: ${scoreSubmitted}, current score: ${score}, scoreRef: ${scoreRef.current}`);
            }
            return;
          }
        }

        const newHead = { x: newHeadX, y: newHeadY };
        
        // Kiểm tra ăn food
        const distance = Math.sqrt(
          Math.pow(newHeadX - state.food.x, 2) + Math.pow(newHeadY - state.food.y, 2)
        );
        
        if (distance < SNAKE_SIZE) {
          console.log('🍎 Food eaten in game loop! Current score before increment:', score);
          state.snake.unshift(newHead);
          setScore(prev => {
            const newScore = prev + 10;
            scoreRef.current = newScore; // Cập nhật ref ngay lập tức
            console.log('🎯 Score updated from', prev, 'to', newScore);
            return newScore;
          });
          // Generate new food
          const foodX = Math.random() * (window.innerWidth - SNAKE_SIZE);
          const foodY = Math.random() * (window.innerHeight - SNAKE_SIZE);
          state.food = { x: foodX, y: foodY };
          createFood(foodX, foodY);
        } else {
          // Di chuyển bình thường
          state.snake.unshift(newHead);
          state.snake.pop();
        }

        // Cập nhật DOM
        updateSnakeDOM();
        
      }, 150); // Fixed interval

      return () => {
        console.log('Cleaning up game interval');
        clearInterval(gameInterval);
      };
    }
  }, [gameStarted, gameOver, isMoving, updateSnakeDOM, createFood, SNAKE_SIZE]);

  // Xử lý keyboard input
  useEffect(() => {
    if (!gameStarted || typeof window === 'undefined') return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const state = gameStateRef.current;
      let newDirection: Position | null = null;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (state.direction.y === 0) newDirection = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (state.direction.y === 0) newDirection = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (state.direction.x === 0) newDirection = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (state.direction.x === 0) newDirection = { x: 1, y: 0 };
          break;
      }
      
      // Nếu có hướng mới và con rắn chưa di chuyển
      if (newDirection) {
        state.direction = newDirection;
        
        // Bắt đầu di chuyển khi nhấn phím đầu tiên
        if (!isMoving) {
          console.log('🎮 Bắt đầu di chuyển theo hướng:', newDirection);
          setIsMoving(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted]);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') {
        document.querySelectorAll('.snake-segment, .snake-food').forEach(el => el.remove());
      }
    };
  }, []);

  // CSS animations
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="snake-game-container">
      {/* Game Controls */}
      <div className="flex flex-col gap-4">
        {/* Name Input */}
        {showNameInput && !gameStarted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name..."
              maxLength={20}
              className="w-full px-4 py-2 rounded-xl border border-black/12 bg-white/80 backdrop-blur text-sm focus:outline-none focus:border-black/25 transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && playerName.trim()) {
                  startGame();
                }
              }}
            />
            <p className="text-xs text-black/50 text-center">Enter your name and press &apos;Start Game&apos; to begin</p>
          </motion.div>
        )}

        <button
          onClick={startGame}
          disabled={!playerName.trim() && !gameStarted}
          className="floating-orb px-6 py-3 text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {gameStarted && !gameOver ? 'Running...' : gameOver ? 'Play Again!' : 'Start Game'}
        </button>
        
        {gameStarted && (
          <div className="text-center">
            <div className="text-lg font-semibold">Score: {score}</div>
            <div className="text-xs text-black/60 mt-1">Player: {playerName}</div>
            
            {/* Debug Button - Remove after testing */}
            <button 
              onClick={() => {
                console.log('🧪 Manual score increment test - current score:', score, 'scoreRef:', scoreRef.current);
                setScore(prev => {
                  const newScore = prev + 10;
                  scoreRef.current = newScore; // Cập nhật ref
                  console.log('🧪 Manual score updated from', prev, 'to', newScore);
                  return newScore;
                });
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded text-xs mt-2 mr-2"
            >
              Test +10 Score
            </button>
            
            <div className="text-xs text-black/60 mt-1">
              {!isMoving ? 
                'Use WASD or Arrow keys to start moving' : 
                'Use WASD or Arrow keys to control'
              }
            </div>
            {!isMoving && (
              <div className="text-xs text-emerald-600 mt-1 font-medium">
                Snake is waiting for your direction...
              </div>
            )}
          </div>
        )}

        {gameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-4 rounded-xl bg-red-50 border border-red-200"
          >
            <div className="text-red-600 font-semibold">Game Over!</div>
            <div className="text-sm text-red-500 mt-1">{playerName}: {score} points</div>
            {hitElement && (
              <div className="text-xs text-red-400 mt-2 p-2 bg-red-100 rounded">
                💥 Collided: &apos;{hitElement}&apos;
              </div>
            )}
            <button
              onClick={() => {
                setShowNameInput(true);
                setGameStarted(false);
              }}
              className="mt-3 px-4 py-2 text-xs rounded-lg bg-white border border-black/12 hover:border-black/20 transition-all"
            >
              Change Name
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export function AboutSection() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userScores, setUserScores] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<{
    totalGames: number;
    highestScore: number;
    averageScore: number;
    lastPlayed: string;
  }>({
    totalGames: 0,
    highestScore: 0,
    averageScore: 0,
    lastPlayed: '',
  });
  const [showUserStats, setShowUserStats] = useState(false);

  // Load leaderboard từ Firebase khi component mount
  useEffect(() => {
    const loadLeaderboard = async () => {
      setIsLoading(true);
      try {
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch (error) {
        console.error('Lỗi khi tải leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  // Hàm load thông tin user
  const loadUserInfo = useCallback(async (name: string) => {
    if (!name.trim()) return;
    
    try {
      const [stats, scores] = await Promise.all([
        getUserStats(name),
        getUserScores(name)
      ]);
      setUserStats(stats);
      setUserScores(scores);
    } catch (error) {
      console.error('Lỗi khi load user info:', error);
    }
  }, []);

  // Hàm xử lý khi có điểm mới - Lưu vào Firebase
  const handleScoreSubmit = useCallback(async (name: string, score: number) => {
    try {
      // Lưu vào Firebase
      const success = await saveScore(name, score);
      
      if (success) {
        // Reload leaderboard từ Firebase để lấy dữ liệu mới nhất
        const updatedLeaderboard = await getLeaderboard();
        setLeaderboard(updatedLeaderboard);
        
        // Load user stats và scores
        const stats = await getUserStats(name);
        const scores = await getUserScores(name);
        setUserStats(stats);
        setUserScores(scores);
        
        console.log(`🎉 Điểm ${score} của ${name} đã được lưu thành công!`);
      } else {
        console.log(`⚠️ Điểm ${score} của ${name} không được lưu`);
      }
    } catch (error) {
      console.error('Lỗi khi lưu điểm:', error);
    }
  }, []);

  return (
    <section id="persona" className="relative z-10 py-32">
      <div className="page-shell grid gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 26 }}
          viewport={{ once: true, amount: 0.35 }}
          className="flex flex-col gap-8"
        >
          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.35em] text-black/50">
            <span className="inline-block h-[1px] w-12 bg-black/20" />
            Persona Layers
          </div>
          <h2 className="text-[clamp(2.4rem,4.8vw,3.8rem)] font-semibold leading-[1.02]">
            {journeyCopy.subtitle}
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-black/70">
            “I collect subtle moments from the city and weave them into a stream of minimalist UX. My workspace is a vinyl turntable and digital clouds, where intuition shapes the structure.”
          </p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: true, amount: 0.4 }}
          >
            <GlobalWebSnake onScoreSubmit={handleScoreSubmit} />
          </motion.div>
        </motion.div>

        <motion.div
          className="grid gap-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 110, damping: 24 }}
          viewport={{ once: true, amount: 0.35 }}
        >
          {/* Leaderboard Header */}
          <div className="rounded-3xl border border-black/12 bg-white/60 px-8 py-7 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm uppercase tracking-[0.4em] text-black/50 mb-2">Snake Game</h3>
                <p className="text-2xl font-semibold text-black/80">
                  {showUserStats ? 'User Statistics' : 'Leaderboard'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowUserStats(false)}
                  className={`px-4 py-2 rounded-xl text-sm transition-all ${
                    !showUserStats 
                      ? 'bg-black/10 text-black/80 font-medium' 
                      : 'text-black/50 hover:text-black/70'
                  }`}
                >
                  Top 5
                </button>

              </div>
            </div>
          </div>

          {/* Content Area - Toggle between Leaderboard and User Stats */}
          {showUserStats ? (
            // User Stats View
            <>
              {userStats.totalGames === 0 ? (
                <div className="rounded-3xl border border-dashed border-black/15 px-8 py-12 text-center">
                  <div className="text-4xl mb-3">📊</div>
                  <p className="text-sm text-black/60">No data available.</p>
                  <p className="text-xs text-black/40 mt-1">Play the game to see your stats!</p>
                </div>
              ) : (
                <>
                  {/* User Stats Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-black/12 bg-white/60 px-6 py-4 backdrop-blur text-center">
                      <div className="text-2xl font-bold text-black/80">{userStats.totalGames}</div>
                      <div className="text-xs text-black/50 mt-1">Total Games</div>
                    </div>
                    <div className="rounded-2xl border border-black/12 bg-white/60 px-6 py-4 backdrop-blur text-center">
                      <div className="text-2xl font-bold text-black/80">{userStats.highestScore}</div>
                      <div className="text-xs text-black/50 mt-1">Highest Score</div>
                    </div>
                    <div className="rounded-2xl border border-black/12 bg-white/60 px-6 py-4 backdrop-blur text-center">
                      <div className="text-2xl font-bold text-black/80">{userStats.averageScore}</div>
                      <div className="text-xs text-black/50 mt-1">Average Score</div>
                    </div>
                    <div className="rounded-2xl border border-black/12 bg-white/60 px-6 py-4 backdrop-blur text-center">
                      <div className="text-sm font-bold text-black/80">
                        {new Date(userStats.lastPlayed).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-xs text-black/50 mt-1">Last Played</div>
                    </div>
                  </div>

                  {/* Recent Games */}
                  <div className="rounded-3xl border border-black/12 bg-white/60 px-8 py-7 backdrop-blur">
                    <h4 className="text-lg font-semibold text-black/80 mb-4">Recent Games</h4>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {userScores.slice(0, 10).map((score, index) => (
                        <div key={`${score.date}-${index}`} className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-black/50">#{index + 1}</span>
                            <span className="text-sm text-black/70">
                              {new Date(score.date).toLocaleString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="text-lg font-semibold text-black/80">{score.score} pts</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            // Leaderboard View (existing code)
            <>
              {isLoading ? (
                <div className="rounded-3xl border border-black/12 px-8 py-12 text-center bg-white/60 backdrop-blur">
                  <div className="animate-spin text-4xl mb-3">⏳</div>
                  <p className="text-sm text-black/60">Loading leaderboard from Firebase...</p>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-black/15 px-8 py-12 text-center">
                  <div className="text-4xl mb-3">🎮</div>
                  <p className="text-sm text-black/60">No players found.</p>
                  <p className="text-xs text-black/40 mt-1">Be the first to conquer the leaderboard!</p>
                </div>
              ) : (
            <>
              {leaderboard.map((entry, index) => (
                <motion.div
                  key={`${entry.name}-${entry.date}`}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="rounded-3xl border border-black/12 bg-white/60 px-8 py-5 backdrop-blur hover:border-black/20 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Rank Badge */}
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300' :
                        index === 1 ? 'bg-gray-100 text-gray-700 border-2 border-gray-300' :
                        index === 2 ? 'bg-orange-100 text-orange-700 border-2 border-orange-300' :
                        'bg-black/5 text-black/50'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      
                      {/* Player Info */}
                      <div>
                        <p className="font-semibold text-black/80">{entry.name}</p>
                        <p className="text-xs text-black/40">
                          {new Date(entry.date).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Score */}
                    <div className="text-right">
                      <p className="text-2xl font-bold text-black/80">{entry.score}</p>
                      <p className="text-xs text-black/40">points</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              </>
            )}
            </>
          )}

          {/* Note */}
          <div className="rounded-3xl border border-dashed border-black/15 px-8 py-7 text-sm leading-relaxed text-black/60">
            *Note: {showUserStats ? 'Personal stats and recent game history.' : 'Top 5 highest scores are displayed. Play the snake game to join the leaderboard!'}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
