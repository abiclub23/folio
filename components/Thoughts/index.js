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
  const [delightMode, setDelightMode] = useState(true);

  const toggleDelightMode = () => {
    setDelightMode(!delightMode);
  };

  /**
   * Generate deterministic positions for thought cards
   * Uses a grid-like pattern with pseudo-random variation for organic placement
   */
  const getPosition = useCallback((index) => {
    const total = thoughts.length;
    if (total === 0) {
      return { left: '50%', top: '50%' };
    }

    const cols = Math.ceil(Math.sqrt(total));
    const row = Math.floor(index / cols);
    const col = index % cols;

    // Use index-based pseudo-random variation for organic placement
    const variationX = ((index * 7) % THOUGHT_CONFIG.VARIATION_RANGE) - THOUGHT_CONFIG.VARIATION_OFFSET;
    const variationY = ((index * 11) % THOUGHT_CONFIG.VARIATION_RANGE) - THOUGHT_CONFIG.VARIATION_OFFSET;

    // Calculate position percentages
    const leftPercent = THOUGHT_CONFIG.BASE_LEFT_OFFSET + (col * (THOUGHT_CONFIG.HORIZONTAL_SPREAD / cols)) + variationX;
    const topPercent = THOUGHT_CONFIG.BASE_TOP_OFFSET + (row * (THOUGHT_CONFIG.VERTICAL_SPREAD / Math.ceil(total / cols))) + variationY;

    return {
      left: `${Math.max(THOUGHT_CONFIG.MIN_LEFT_PERCENT, Math.min(THOUGHT_CONFIG.MAX_LEFT_PERCENT, leftPercent))}%`,
      top: `${Math.max(THOUGHT_CONFIG.MIN_TOP_PERCENT, Math.min(THOUGHT_CONFIG.MAX_TOP_PERCENT, topPercent))}%`
    };
  }, [thoughts.length]);

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
   * Calculate container height based on number of thoughts
   */
  const calculateContainerHeight = useCallback(() => {
    const count = thoughts.length;
    if (count === 0) return THOUGHT_CONFIG.MIN_CONTAINER_HEIGHT;
    return Math.max(
      THOUGHT_CONFIG.MIN_CONTAINER_HEIGHT,
      THOUGHT_CONFIG.BASE_HEIGHT + Math.ceil(count / THOUGHT_CONFIG.CARDS_PER_ROW) * THOUGHT_CONFIG.HEIGHT_PER_ROW
    );
  }, [thoughts.length]);

  return (
    <div>
      <div className={styles.headerSection}>
        <div>
          <h1 className="text-4xl font-bold mb-6">Thoughts</h1>
          <p className="text-lg text-gray-600 mb-8">
            Random thoughts that don't warrant a full post. Don't really engage on X, so this is my place to share them.
          </p>
        </div>

        <label className={styles.toggleSwitch}>
          <input
            type="checkbox"
            checked={delightMode}
            onChange={toggleDelightMode}
            aria-label={delightMode ? 'Floating mode active' : 'List mode active'}
          />
          <span className={styles.slider}>
            <span className={styles.label}>{delightMode ? 'Floating' : 'List'}</span>
          </span>
        </label>
      </div>

      {delightMode ? (
        <div
          className={`relative ${styles.thoughtsContainer} ${isPaused ? styles.paused : ''}`}
          style={{
            minHeight: `${calculateContainerHeight()}px`,
            paddingBottom: `${THOUGHT_CONFIG.CONTAINER_PADDING_BOTTOM}px`
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          role="region"
          aria-label="Thoughts collection"
        >
          {thoughts.map((thought, index) => {
            const uniqueKey = `${thought.timestamp}-${index}-${thought.text.slice(0, 20)}`;
            const position = getPosition(index);
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
        </div>
      ) : (
        <div className={styles.listContainer}>
          {thoughts.map((thought, index) => {
            const uniqueKey = `${thought.timestamp}-${index}-${thought.text.slice(0, 20)}`;

            return (
              <article
                key={uniqueKey}
                className={styles.listItem}
              >
                <p className={styles.listText}>
                  {thought.text}
                </p>
                <time className={styles.listTimestamp} dateTime={thought.timestamp}>
                  {thought.timestamp}
                </time>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

