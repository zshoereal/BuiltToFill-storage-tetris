# Storage Tetris

Storage Tetris is an innovative twist on the classic Tetris game that explores the relationship between gameplay and digital storage space. As you play, the game creates physical files to store each block, leading to unique visual effects and gameplay challenges as storage space fills up.

## Features

- **Classic Tetris Gameplay**
  - Standard Tetris controls and mechanics
  - 7 different block shapes (I, T, L, J, O, S, Z)
  - Score system based on line clears

- **Storage System**
  - Creates physical files for each block placed
  - Monitors total storage space usage
  - Game over when storage exceeds 1.5MB

- **Dynamic Visual Effects**
  - Glitch effects intensify as storage space increases
  - Block position offsets
  - Color distortions
  - Afterimage effects
  - Scanline effects
  - Random noise patterns

- **User Interface**
  - Real-time score display
  - File creation counter
  - Storage space usage indicator
  - Game state notifications (pause/game over)

## How to Play

1. Open `index.html` in a modern web browser
2. Use the following controls:
   - ← → : Move block left/right
   - ↑ : Rotate block
   - ↓ : Move block down
   - Space : Drop block instantly

## Technical Details

The game is built using:
- HTML5 Canvas for rendering
- JavaScript for game logic
- File System Access API for storage operations

## Game Mechanics

- Each placed block creates a physical file
- Storage space monitoring every 5 seconds
- Visual glitches appear when storage exceeds 1MB
- Game ends when storage exceeds 1.5MB

## Development

To run the game locally:
1. Clone this repository
2. Open `index.html` in a web browser
3. Allow file system access when prompted

## Browser Compatibility

This game requires a modern browser that supports:
- File System Access API
- HTML5 Canvas
- ES6+ JavaScript features

## License

This project is open source and available under the MIT License.

## Technical Implementation

### Core Architecture

The game is built around a single `Tetris` class that manages all game state and logic. The implementation uses modern JavaScript features and browser APIs to create a unique gaming experience that bridges gameplay with physical storage.

### Key Components

1. **Game State Management**
   - Uses a 2D array (`board`) to track block positions
   - Maintains current piece state (position, rotation, shape)
   - Tracks game metrics (score, files created, storage usage)

2. **File System Integration**
   - Utilizes the File System Access API for storage operations
   - Creates individual PNG files for each placed block
   - Implements asynchronous file operations with error handling
   - Monitors total storage usage with periodic checks

3. **Rendering System**
   - HTML5 Canvas for real-time rendering
   - Custom block drawing with dynamic effects
   - Efficient canvas clearing and redrawing
   - Afterimage system for visual effects

4. **Glitch Effect System**
   - Dynamic intensity based on storage usage
   - Multiple effect layers:
     - Position offsets
     - Color distortions
     - Afterimages
     - Scanline effects
     - Random noise patterns
   - Progressive intensity scaling

### Technical Features

1. **Storage Monitoring**
   ```javascript
   // Storage check interval
   this.glitchUpdateInterval = 5000; // 5 seconds
   
   // Storage thresholds
   const MB_THRESHOLD = 1024 * 1024; // 1MB
   const MAX_STORAGE = 1.5 * MB_THRESHOLD; // 1.5MB
   ```

2. **Glitch Effect Implementation**
   ```javascript
   // Dynamic glitch intensity
   this.glitchIntensity = Math.min(totalSize / MB_THRESHOLD, 1);
   
   // Effect application
   if (sizeMB > 1) {
       // Apply various glitch effects
       // Position offsets, color changes, etc.
   }
   ```

3. **File System Operations**
   ```javascript
   // File creation
   async createFile() {
       // Create canvas for block
       // Convert to PNG
       // Save to filesystem
   }
   ```

### Performance Considerations

1. **Canvas Optimization**
   - Efficient redrawing strategies
   - Minimal canvas clearing
   - Optimized block rendering

2. **Storage Management**
   - Asynchronous file operations
   - Periodic storage checks
   - Error handling for file system operations

3. **Effect System**
   - Performance-based effect scaling
   - Limited afterimage count
   - Optimized glitch calculations

### Browser Compatibility

The implementation requires modern browser features:
- File System Access API
- HTML5 Canvas
- ES6+ features (classes, async/await)
- Modern JavaScript modules

### Security Considerations

- File system access requires user permission
- Sandboxed file operations
- Error handling for file system operations
- Secure file naming conventions 