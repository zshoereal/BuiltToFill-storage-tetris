class Tetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.blockSize = 30;
        this.cols = this.canvas.width / this.blockSize;
        this.rows = this.canvas.height / this.blockSize;
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.filesCreated = 0;
        this.currentPiece = null;
        this.gameOver = false;
        this.isPaused = false;
        this.lastUpdate = Date.now();
        this.dropInterval = 1000; // Time in ms between automatic drops
        this.saveDirectory = null;
        this.totalBlocksSaved = 0; // Track total blocks saved
        this.totalStorageSize = 0; // Track total storage size in bytes
        this.glitchIntensity = 0; // 0 to 1
        this.glitchLastUpdate = 0;
        this.glitchUpdateInterval = 5000; // Check storage size every 5 seconds
        this.afterimages = []; // Store afterimages
        this.MAX_AFTERIMAGES = 3; // Maximum number of afterimages to show

        // Tetris pieces and their colors
        this.pieces = [
            [[1,1,1,1]], // I
            [[1,1,1],[0,1,0]], // T
            [[1,1,1],[1,0,0]], // L
            [[1,1,1],[0,0,1]], // J
            [[1,1],[1,1]], // O
            [[1,1,0],[0,1,1]], // S
            [[0,1,1],[1,1,0]] // Z
        ];
        this.colors = ['#00f0f0', '#a000f0', '#f0a000', '#0000f0', '#f0f000', '#00f000', '#f00000'];
        
        this.initSaveDirectory();
        this.bindControls();
        this.spawnPiece();
        this.gameLoop();
    }

    async initSaveDirectory() {
        try {
            // 检查是否已有权限
            if (this.saveDirectory) {
                try {
                    await this.saveDirectory.getFileHandle('test.txt', { create: true });
                    return; // 已有权限，直接返回
                } catch (err) {
                    console.log('Existing directory access lost, requesting new access...');
                }
            }
            
            this.saveDirectory = await window.showDirectoryPicker();
            console.log('Directory access granted');
            this.monitorStorageSize(); // 重新开始监控
        } catch (err) {
            console.error('Failed to get directory access:', err);
            alert('Please select a directory to save game files. The game will not save files until you do.');
        }
    }

    async monitorStorageSize() {
        if (!this.saveDirectory) {
            console.warn('No save directory available, attempting to reinitialize...');
            try {
                await this.initSaveDirectory();
            } catch (err) {
                console.error('Failed to reinitialize save directory:', err);
                return;
            }
        }
        
        try {
            let totalSize = 0;
            let fileCount = 0;
            for await (const entry of this.saveDirectory.values()) {
                if (entry.kind === 'file' && entry.name.startsWith('block_')) {
                    const file = await entry.getFile();
                    totalSize += file.size;
                    fileCount++;
                }
            }
            
            console.log(`Storage check: ${fileCount} files, total size: ${totalSize} bytes`);
            
            this.totalStorageSize = totalSize;
            this.glitchIntensity = Math.min(totalSize / (1024 * 1024), 1);

            if (totalSize > 1.5 * 1024 * 1024) {
                this.gameOver = true;
                this.ctx.fillStyle = 'rgba(255,0,0,0.5)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('STORAGE FULL', this.canvas.width / 2, this.canvas.height / 2 - 40);
                this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 + 40);
            }
            
            setTimeout(() => this.monitorStorageSize(), this.glitchUpdateInterval);
        } catch (err) {
            console.error('Error monitoring storage size:', err);
            // 添加重试机制
            setTimeout(() => this.monitorStorageSize(), this.glitchUpdateInterval);
        }
    }

    bindControls() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver || this.isPaused) return;
            
            // Prevent default behavior for game controls
            if ([32, 37, 38, 39, 40].includes(e.keyCode)) {
                e.preventDefault();
            }
            
            switch(e.keyCode) {
                case 37: // Left
                    this.movePiece(-1, 0);
                    break;
                case 39: // Right
                    this.movePiece(1, 0);
                    break;
                case 40: // Down
                    this.movePiece(0, 1);
                    break;
                case 38: // Up (rotate)
                    this.rotatePiece();
                    break;
                case 32: // Space (drop)
                    this.dropPiece();
                    break;
            }
        });
    }

    spawnPiece() {
        const pieceIndex = Math.floor(Math.random() * this.pieces.length);
        this.currentPiece = {
            shape: this.pieces[pieceIndex],
            color: this.colors[pieceIndex],
            x: Math.floor(this.cols / 2) - Math.floor(this.pieces[pieceIndex][0].length / 2),
            y: 0
        };
        
        if (this.checkCollision()) {
            this.gameOver = true;
        }
    }

    checkCollision(offsetX = 0, offsetY = 0, newShape = null) {
        const shape = newShape || this.currentPiece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newX = this.currentPiece.x + x + offsetX;
                    const newY = this.currentPiece.y + y + offsetY;
                    
                    if (newX < 0 || newX >= this.cols || 
                        newY >= this.rows || 
                        (newY >= 0 && this.board[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    movePiece(dx, dy) {
        if (!this.checkCollision(dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            return true;
        }
        return false;
    }

    rotatePiece() {
        const newShape = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );
        
        if (!this.checkCollision(0, 0, newShape)) {
            this.currentPiece.shape = newShape;
        }
    }

    dropPiece() {
        while (this.movePiece(0, 1));
        this.lockPiece();
    }

    async lockPiece() {
        // Pause the game while saving
        this.isPaused = true;

        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }

        // Create a file when piece is locked
        await this.createFile();
        
        this.clearLines();
        this.spawnPiece();

        // Resume the game after saving
        this.isPaused = false;
        this.lastUpdate = Date.now();
    }

    async createFile() {
        if (!this.saveDirectory) {
            try {
                await this.initSaveDirectory();
            } catch (err) {
                console.error('Still no directory access:', err);
                return;
            }
        }

        try {
            // Create a new canvas for single block screenshots
            const screenshotCanvas = document.createElement('canvas');
            const ctx = screenshotCanvas.getContext('2d');
            
            // Set canvas size to single block
            screenshotCanvas.width = this.blockSize;
            screenshotCanvas.height = this.blockSize;

            // Find all colored blocks and save them individually
            for (let y = 0; y < this.rows; y++) {
                for (let x = 0; x < this.cols; x++) {
                    if (this.board[y][x]) {
                        // Clear canvas for new block
                        ctx.fillStyle = '#fff';
                        ctx.fillRect(0, 0, this.blockSize, this.blockSize);
                        
                        // Draw single block
                        ctx.fillStyle = this.board[y][x];
                        ctx.fillRect(0, 0, this.blockSize - 1, this.blockSize - 1);

                        // Convert canvas to blob
                        const blob = await new Promise(resolve => screenshotCanvas.toBlob(resolve, 'image/png'));
                        
                        // Calculate block number (from bottom-left to top-right)
                        this.totalBlocksSaved++;
                        const blockNumber = this.totalBlocksSaved;
                        
                        // Create file in the selected directory
                        const filename = `block_${blockNumber.toString().padStart(3, '0')}.png`;
                        const fileHandle = await this.saveDirectory.getFileHandle(filename, { create: true });
                        const writable = await fileHandle.createWritable();
                        await writable.write(blob);
                        await writable.close();
                    }
                }
            }
            
            this.filesCreated = this.totalBlocksSaved;
            document.getElementById('filesCreated').textContent = this.filesCreated;
        } catch (err) {
            console.error('Error creating files:', err);
        }
    }

    clearLines() {
        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.cols).fill(0));
                this.score += 100;
                document.getElementById('score').textContent = this.score;
            }
        }
    }

    applyGlitchEffect(ctx) {
        if (this.glitchIntensity <= 0) return;

        const imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const now = Date.now();

        // Random glitch effects based on intensity
        if (Math.random() < this.glitchIntensity * 0.5) {
            // Horizontal line displacement
            const y = Math.floor(Math.random() * this.canvas.height);
            const displacement = Math.floor(Math.random() * 20 * this.glitchIntensity);
            const lineData = new Uint8ClampedArray(data.buffer, y * this.canvas.width * 4, this.canvas.width * 4);
            for (let i = 0; i < displacement * 4; i += 4) {
                data.set(lineData.slice(i, i + 4), y * this.canvas.width * 4);
            }
        }

        // Color channel shift
        if (Math.random() < this.glitchIntensity * 0.3) {
            for (let i = 0; i < data.length; i += 4) {
                if (Math.random() < this.glitchIntensity * 0.1) {
                    // Shift red channel
                    data[i] = data[i + 4] || data[i];
                }
            }
        }

        // Noise
        if (this.glitchIntensity > 0.5) {
            for (let i = 0; i < data.length; i += 4) {
                if (Math.random() < this.glitchIntensity * 0.05) {
                    data[i] = Math.random() * 255;     // R
                    data[i + 1] = Math.random() * 255; // G
                    data[i + 2] = Math.random() * 255; // B
                }
            }
        }

        // Random blocks
        if (Math.random() < this.glitchIntensity * 0.2) {
            const blockSize = Math.floor(Math.random() * 20 * this.glitchIntensity);
            const x = Math.floor(Math.random() * (this.canvas.width - blockSize));
            const y = Math.floor(Math.random() * (this.canvas.height - blockSize));
            
            for (let dy = 0; dy < blockSize; dy++) {
                for (let dx = 0; dx < blockSize; dx++) {
                    const sourceY = (y + dy + Math.floor(Math.random() * 10)) % this.canvas.height;
                    const sourceX = (x + dx + Math.floor(Math.random() * 10)) % this.canvas.width;
                    const targetPos = ((y + dy) * this.canvas.width + (x + dx)) * 4;
                    const sourcePos = (sourceY * this.canvas.width + sourceX) * 4;
                    
                    data[targetPos] = data[sourcePos];
                    data[targetPos + 1] = data[sourcePos + 1];
                    data[targetPos + 2] = data[sourcePos + 2];
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw afterimages
        this.afterimages = this.afterimages.filter(afterimage => {
            this.ctx.fillStyle = `${afterimage.color}${Math.floor(afterimage.alpha * 255).toString(16).padStart(2, '0')}`;
            this.ctx.fillRect(
                afterimage.x,
                afterimage.y,
                this.blockSize - 1,
                this.blockSize - 1
            );
            
            afterimage.alpha *= 0.95;
            afterimage.life--;
            
            // Keep afterimage if it's still visible and alive
            return afterimage.alpha > 0.1 && afterimage.life > 0;
        });
        
        // Draw board
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x]);
                }
            }
        }
        
        // Draw current piece
        if (this.currentPiece && !this.isPaused) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.drawBlock(
                            this.currentPiece.x + x,
                            this.currentPiece.y + y,
                            this.currentPiece.color
                        );
                    }
                }
            }
        }

        // Apply general glitch effect
        this.applyGlitchEffect(this.ctx);

        // Draw game over or paused state
        if (this.gameOver || this.isPaused) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            if (this.gameOver && this.totalStorageSize > 1.5 * 1024 * 1024) {
                this.ctx.fillStyle = '#ff0000';
                this.ctx.fillText('STORAGE FULL', this.canvas.width / 2, this.canvas.height / 2 - 40);
                this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 + 40);
            } else {
                this.ctx.fillText(
                    this.gameOver ? 'GAME OVER' : 'PAUSED',
                    this.canvas.width / 2,
                    this.canvas.height / 2
                );
            }
        }

        // Draw storage size indicator with warning colors
        if (this.totalStorageSize > 0) {
            const sizeMB = (this.totalStorageSize / (1024 * 1024)).toFixed(2);
            if (sizeMB > 1.5) {
                this.ctx.fillStyle = '#ff0000';
            } else if (sizeMB > 1.0) {
                this.ctx.fillStyle = '#ff6600';
            } else if (sizeMB > 0.5) {
                this.ctx.fillStyle = '#ffcc00';
            } else {
                this.ctx.fillStyle = '#000000';
            }
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(
                `Storage: ${sizeMB}MB`,
                10,
                20
            );
            this.ctx.fillText(
                `Last check: ${new Date().toLocaleTimeString()}`,
                10,
                35
            );
        }
    }

    drawBlock(x, y, color) {
        const sizeMB = this.totalStorageSize / (1024 * 1024);
        
        // Add glitch effects to blocks when over 1MB
        if (sizeMB > 1) {
            // Random position offset
            const offsetX = (Math.random() - 0.5) * 4 * (sizeMB - 1);
            const offsetY = (Math.random() - 0.5) * 4 * (sizeMB - 1);
            
            // Random color glitch
            if (Math.random() < 0.3 * (sizeMB - 1)) {
                const colors = ['#ff0000', '#00ff00', '#0000ff'];
                color = colors[Math.floor(Math.random() * colors.length)];
            }
            
            // Create afterimage
            if (Math.random() < 0.1 * (sizeMB - 1)) {
                this.afterimages.push({
                    x: x * this.blockSize + offsetX,
                    y: y * this.blockSize + offsetY,
                    color: color,
                    alpha: 0.7,
                    life: 60 // frames
                });
                
                // Limit number of afterimages
                if (this.afterimages.length > this.MAX_AFTERIMAGES) {
                    this.afterimages.shift();
                }
            }

            x = x + offsetX / this.blockSize;
            y = y + offsetY / this.blockSize;
        }

        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * this.blockSize,
            y * this.blockSize,
            this.blockSize - 1,
            this.blockSize - 1
        );

        // Add scanline effect over 1MB
        if (sizeMB > 1 && Math.random() < 0.3) {
            this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
            this.ctx.fillRect(
                x * this.blockSize,
                y * this.blockSize + Math.random() * this.blockSize,
                this.blockSize - 1,
                2
            );
        }
    }

    gameLoop() {
        const now = Date.now();
        const delta = now - this.lastUpdate;

        if (!this.gameOver && !this.isPaused) {
            if (delta > this.dropInterval) {
                if (!this.movePiece(0, 1)) {
                    this.lockPiece();
                }
                this.lastUpdate = now;
            }
        }
        
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game
new Tetris(); 