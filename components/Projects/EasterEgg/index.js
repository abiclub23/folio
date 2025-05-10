import { useEffect, useState } from 'react';

export default function EasterEgg() {
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [touchSequence, setTouchSequence] = useState([]);

  const createCharacter = () => {
    const positions = [
      [222, 123],
      [387, 220],
      [303, 136],
      [250, 186]
    ];

    const randomIndex = Math.ceil(Math.random() * 4) - 1;
    const [width, height] = positions[randomIndex];
    
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    return {
      left: `${Math.random() * (windowWidth - width)}px`,
      top: `${Math.random() * (windowHeight - height)}px`,
      image: `/images/easter-egg/contra-${randomIndex + 1}.png`
    };
  };

  const triggerEasterEgg = () => {
    setShowEasterEgg(true);
    setCharacters([]);

    // Sequentially add lives
    let count = 0;
    const interval = setInterval(() => {
      if (count < 30) {
        setCharacters(prev => [...prev, createCharacter()]);
        count++;
      } else {
        clearInterval(interval);
        // Remove everything after 3 seconds
        setTimeout(() => {
          alert("Old school cheat detected. 30 lives, just like the good old days!");
          setShowEasterEgg(false);
          setTimeout(() => {
            setCharacters([]);
          }, 1000); // Wait for fade out to complete
        }, 3000);
      }
    }, 150); // Add a new life every 150ms
  };

  // Handle touch events for mobile
  const handleTouch = (direction) => {
    setTouchSequence(prev => {
      const newSequence = [...prev, direction];
      // Keep only last 10 touches
      if (newSequence.length > 10) {
        newSequence.shift();
      }
      
      // Check for Konami sequence: up,up,down,down,left,right,left,right
      const sequence = newSequence.join(',');
      if (sequence === 'up,up,down,down,left,right,left,right') {
        triggerEasterEgg();
        return []; // Reset sequence after triggering
      }
      
      return newSequence;
    });
  };

  useEffect(() => {
    const keys = [];
    const konami = '38,38,40,40,37,39,37,39,66,65'; // Up,Up,Down,Down,Left,Right,Left,Right,B,A

    const handleKeyDown = (e) => {
      keys.push(e.keyCode);
      if (keys.toString().indexOf(konami) >= 0) {
        triggerEasterEgg();
        // Clear the keys array after successful sequence
        keys.length = 0;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">Easter Egg</h1>
      <div className="text-lg text-gray-600 mb-8 space-y-4">
        <p>
          A fun hidden feature on my website inspired by the classic Konami Code from the legendary Contra video game series. It's a nostalgic nod to the gaming culture that shaped so many of us growing up.
        </p>

        <p>
          Contra was one of my most-played games as a kid. It brings back memories of summer days spent with my brother and cousins, playing for hours on end. Those were the good times.
        </p>
      </div>

      <div className="space-y-8">
        

        <section className="mt-12 pt-6 border-t border-gray-950">
          <h2 className="text-2xl font-semibold mb-4">How to Activate</h2>
          <p className="text-lg leading-relaxed text-gray-700 mb-4">
            On desktop: Enter the Konami Code on your keyboard: ↑↑↓↓←→←→BA
            <br />
            On mobile: Swipe in this pattern: ↑↑↓↓←→←→
            <br />
            (That's Up, Up, Down, Down, Left, Right, Left, Right)
          </p>
          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={triggerEasterEgg}
              className="px-4 py-2 bg-custom-green text-white rounded hover:bg-opacity-90 transition-colors"
            >
              Test Easter Egg
            </button>
            
            {/* Mobile touch controls */}
            <div className="grid grid-cols-3 gap-2 mt-4 md:hidden">
              <div className="col-start-2">
                <button 
                  onClick={() => handleTouch('up')}
                  className="w-16 h-16 bg-gray-200 rounded-t-lg flex items-center justify-center"
                >
                  ↑
                </button>
              </div>
              <div className="col-start-1 row-start-2">
                <button 
                  onClick={() => handleTouch('left')}
                  className="w-16 h-16 bg-gray-200 rounded-l-lg flex items-center justify-center"
                >
                  ←
                </button>
              </div>
              <div className="col-start-2 row-start-2">
                <button 
                  onClick={() => handleTouch('down')}
                  className="w-16 h-16 bg-gray-200 rounded-b-lg flex items-center justify-center"
                >
                  ↓
                </button>
              </div>
              <div className="col-start-3 row-start-2">
                <button 
                  onClick={() => handleTouch('right')}
                  className="w-16 h-16 bg-gray-200 rounded-r-lg flex items-center justify-center"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </section>

        {showEasterEgg && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {characters.map((char, index) => (
              <img
                key={index}
                src={char.image}
                alt="Contra character"
                className="absolute w-auto h-auto"
                style={{
                  left: char.left,
                  top: char.top
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 