import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import styles from './thoughts.module.css';
import { THOUGHT_CONFIG } from './constants';

/**
 * Thoughts component - Displays floating thought cards with infinite scroll
 * @param {Object} props
 * @param {Array<{text: string, timestamp: string}>} props.thoughts - Array of thought objects
 */
export default function Thoughts({ thoughts = [] }) {
  const [isPaused, setIsPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(THOUGHT_CONFIG.INITIAL_BATCH_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef(null);
  const timeoutRef = useRef(null);

  // Infinite scroll with Intersection Observer
  useEffect(() => {
    // Early return if no thoughts or all thoughts are visible
    if (!thoughts.length || visibleCount >= thoughts.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < thoughts.length && !isLoading) {
          setIsLoading(true);
          
          // Clear any existing timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          timeoutRef.current = setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + THOUGHT_CONFIG.BATCH_SIZE, thoughts.length));
            setIsLoading(false);
          }, THOUGHT_CONFIG.LOADING_DELAY_MS);
        }
      },
      { threshold: THOUGHT_CONFIG.INTERSECTION_THRESHOLD }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visibleCount, thoughts.length, isLoading]);

  /**
   * Generate deterministic positions for thought cards
   * Uses a grid-like pattern with pseudo-random variation for organic placement
   */
  const getPosition = useCallback((index, visibleTotal) => {
    if (visibleTotal === 0) {
      return { left: '50%', top: '50%' };
    }

    const cols = Math.ceil(Math.sqrt(visibleTotal));
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    // Use index-based pseudo-random variation for organic placement
    const variationX = ((index * 7) % THOUGHT_CONFIG.VARIATION_RANGE) - THOUGHT_CONFIG.VARIATION_OFFSET;
    const variationY = ((index * 11) % THOUGHT_CONFIG.VARIATION_RANGE) - THOUGHT_CONFIG.VARIATION_OFFSET;
    
    // Calculate position percentages
    const leftPercent = THOUGHT_CONFIG.BASE_LEFT_OFFSET + (col * (THOUGHT_CONFIG.HORIZONTAL_SPREAD / cols)) + variationX;
    const topPercent = THOUGHT_CONFIG.BASE_TOP_OFFSET + (row * (THOUGHT_CONFIG.VERTICAL_SPREAD / Math.ceil(visibleTotal / cols))) + variationY;
    
    return {
      left: `${Math.max(THOUGHT_CONFIG.MIN_LEFT_PERCENT, Math.min(THOUGHT_CONFIG.MAX_LEFT_PERCENT, leftPercent))}%`,
      top: `${Math.max(THOUGHT_CONFIG.MIN_TOP_PERCENT, Math.min(THOUGHT_CONFIG.MAX_TOP_PERCENT, topPercent))}%`
    };
  }, []);

  const visibleThoughts = useMemo(() => {
    if (!thoughts.length) return [];
    return thoughts.slice(0, visibleCount);
  }, [thoughts, visibleCount]);

  /**
   * Get animation class based on index (cycles through 3 animation types)
   */
  const getAnimationClass = useCallback((index) => {
    const animationType = (index % THOUGHT_CONFIG.ANIMATION_TYPES) + 1;
    const animationMap = {
      1: styles.thoughtFloat1,
      2: styles.thoughtFloat2,
      3: styles.thoughtFloat3,
    };
    return animationMap[animationType] || styles.thoughtFloat1;
  }, [styles]);

  /**
   * Calculate container height based on number of visible thoughts
   */
  const calculateContainerHeight = useCallback((count) => {
    if (count === 0) return THOUGHT_CONFIG.MIN_CONTAINER_HEIGHT;
    return Math.max(
      THOUGHT_CONFIG.MIN_CONTAINER_HEIGHT,
      THOUGHT_CONFIG.BASE_HEIGHT + Math.ceil(count / THOUGHT_CONFIG.CARDS_PER_ROW) * THOUGHT_CONFIG.HEIGHT_PER_ROW
    );
  }, []);

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">Thoughts</h1>
      <p className="text-lg text-gray-600 mb-8">
        Random thoughts that don't warrant a full post. Don't really engage on X, so this is my place to share them.
      </p>
      
      <div 
        className={`relative ${styles.thoughtsContainer} ${isPaused ? styles.paused : ''}`}
        style={{ 
          minHeight: `${calculateContainerHeight(visibleThoughts.length)}px`,
          paddingBottom: `${THOUGHT_CONFIG.CONTAINER_PADDING_BOTTOM}px`
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        role="region"
        aria-label="Thoughts collection"
      >
        {visibleThoughts.map((thought, index) => {
          // Generate unique key - use timestamp + index for better uniqueness
          const uniqueKey = `${thought.timestamp}-${index}-${thought.text.slice(0, 20)}`;
          const position = getPosition(index, visibleThoughts.length);
          const animationDelay = `${(index * THOUGHT_CONFIG.ANIMATION_DELAY_MULTIPLIER) % THOUGHT_CONFIG.ANIMATION_TYPES}s`;
          const animationClass = getAnimationClass(index);
          
          return (
            <article 
              key={uniqueKey}
              className={`${styles.thoughtCard} ${animationClass}`}
              style={{
                left: position.left,
                top: position.top,
                animationDelay: animationDelay
              }}
              aria-label={`Thought from ${thought.timestamp}`}
            >
              <p className="text-gray-800 mb-2 leading-relaxed">
                {thought.text}
              </p>
              <time className="text-gray-500" style={{ fontSize: '12px' }} dateTime={thought.timestamp}>
                {thought.timestamp}
              </time>
            </article>
          );
        })}
        
        {/* Intersection observer target for infinite scroll */}
        {visibleCount < thoughts.length && (
          <div 
            ref={observerTarget}
            className="h-20 flex items-center justify-center w-full"
            style={{ 
              position: 'absolute', 
              bottom: `${THOUGHT_CONFIG.OBSERVER_BOTTOM_OFFSET}px`, 
              left: 0,
              height: `${THOUGHT_CONFIG.OBSERVER_HEIGHT}px`
            }}
            aria-live="polite"
            aria-atomic="true"
          >
            {isLoading && (
              <p className="text-sm text-gray-500" role="status">Loading more thoughts...</p>
            )}
          </div>
        )}
        
        {visibleCount >= thoughts.length && thoughts.length > 0 && (
          <div 
            className="h-20 flex items-center justify-center w-full"
            style={{ 
              position: 'absolute', 
              bottom: `${THOUGHT_CONFIG.OBSERVER_BOTTOM_OFFSET}px`, 
              left: 0,
              height: `${THOUGHT_CONFIG.OBSERVER_HEIGHT}px`
            }}
            role="status"
            aria-live="polite"
          >
            <p className="text-sm text-gray-500">All thoughts loaded</p>
          </div>
        )}
      </div>
    </div>
  );
}

