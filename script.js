class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        this.finalScoreElement = document.getElementById('finalScore');
        this.gameOverElement = document.getElementById('gameOver');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.speedSlider = document.getElementById('speedSlider');
        this.speedValue = document.getElementById('speedValue');
        
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        this.snake = [
            {x: 10, y: 10}
        ];
        this.food = {};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameLoop = null;
        
        // 基础游戏速度（毫秒）
        this.baseSpeed = 100;
        
        // 速度控制：1-20级别，对应不同的速度倍数
        this.speedMultipliers = {
            1: 0.1,   // 极慢
            2: 0.15,  // 很慢
            3: 0.2,   // 超慢
            4: 0.25,  // 慢
            5: 0.3,   // 较慢
            6: 0.4,   // 稍慢
            7: 0.5,   // 慢速
            8: 0.6,   // 偏慢
            9: 0.7,   // 稍慢
            10: 1.0,  // 正常
            11: 1.2,  // 稍快
            12: 1.4,  // 偏快
            13: 1.6,  // 快速
            14: 1.8,  // 较快
            15: 2.0,  // 快
            16: 2.3,  // 很快
            17: 2.6,  // 超快
            18: 3.0,  // 极快
            19: 3.5,  // 疯狂
            20: 4.0   // 极限
        };
        
        this.init();
    }
    
    init() {
        this.highScoreElement.textContent = this.highScore;
        this.generateFood();
        this.bindEvents();
        this.draw();
    }
    
    bindEvents() {
        // 按钮事件
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // 速度控制事件
        this.speedSlider.addEventListener('input', () => {
            this.speedValue.textContent = this.speedSlider.value;
            if (this.gameRunning) {
                this.updateGameSpeed();
            }
        });
    }
    
    handleKeyPress(e) {
        // 检查是否是游戏相关的按键
        const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'];
        
        if (gameKeys.includes(e.code)) {
            e.preventDefault(); // 阻止默认行为，防止页面滚动
        }
        
        if (!this.gameRunning || this.gamePaused) {
            if (e.code === 'Space') {
                if (this.gameRunning) {
                    this.togglePause();
                } else {
                    this.startGame();
                }
            }
            return;
        }
        
        // 防止蛇反向移动
        switch(e.code) {
            case 'ArrowUp':
            case 'KeyW':
                if (this.dy !== 1) {
                    this.dx = 0;
                    this.dy = -1;
                }
                break;
            case 'ArrowDown':
            case 'KeyS':
                if (this.dy !== -1) {
                    this.dx = 0;
                    this.dy = 1;
                }
                break;
            case 'ArrowLeft':
            case 'KeyA':
                if (this.dx !== 1) {
                    this.dx = -1;
                    this.dy = 0;
                }
                break;
            case 'ArrowRight':
            case 'KeyD':
                if (this.dx !== -1) {
                    this.dx = 1;
                    this.dy = 0;
                }
                break;
            case 'Space':
                this.togglePause();
                break;
        }
    }
    
    startGame() {
        if (this.gameRunning) return;
        
        this.gameRunning = true;
        this.gamePaused = false;
        this.dx = 1;
        this.dy = 0;
        this.score = 0;
        this.snake = [{x: 10, y: 10}];
        this.generateFood();
        
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.gameOverElement.style.display = 'none';
        
        this.updateScore();
        this.gameLoop = setInterval(() => this.update(), this.getGameSpeed());
        
        // 更新UI状态
        document.body.classList.add('game-running');
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        
        if (this.gamePaused) {
            clearInterval(this.gameLoop);
            this.pauseBtn.textContent = '继续';
            document.body.classList.add('game-paused');
        } else {
            this.gameLoop = setInterval(() => this.update(), this.getGameSpeed());
            this.pauseBtn.textContent = '暂停';
            document.body.classList.remove('game-paused');
        }
    }
    
    restartGame() {
        this.endGame();
        this.startGame();
    }
    
    endGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        clearInterval(this.gameLoop);
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.textContent = '暂停';
        
        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreElement.textContent = this.highScore;
            localStorage.setItem('snakeHighScore', this.highScore);
        }
        
        // 显示游戏结束界面
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.style.display = 'block';
        
        // 更新UI状态
        document.body.classList.remove('game-running', 'game-paused');
    }
    
    update() {
        if (this.gamePaused) return;
        
        this.moveSnake();
        
        if (this.checkCollision()) {
            this.endGame();
            return;
        }
        
        if (this.checkFoodCollision()) {
            this.eatFood();
        }
        
        this.draw();
    }
    
    moveSnake() {
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};
        this.snake.unshift(head);
        
        // 如果没有吃到食物，移除尾部
        if (head.x !== this.food.x || head.y !== this.food.y) {
            this.snake.pop();
        }
    }
    
    checkCollision() {
        const head = this.snake[0];
        
        // 检查墙壁碰撞
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            return true;
        }
        
        // 检查自身碰撞
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    checkFoodCollision() {
        const head = this.snake[0];
        return head.x === this.food.x && head.y === this.food.y;
    }
    
    eatFood() {
        this.score += 10;
        this.updateScore();
        this.generateFood();
        this.updateGameSpeed(); // 随着分数增加，游戏速度可能加快
    }
    
    generateFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y));
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    getGameSpeed() {
        // 随着分数增加，游戏速度逐渐加快
        const speedIncrease = Math.floor(this.score / 50) * 5;
        const adjustedSpeed = Math.max(this.baseSpeed - speedIncrease, 50);
        
        // 应用用户设置的速度倍数
        const speedLevel = parseInt(this.speedSlider.value);
        const speedMultiplier = this.speedMultipliers[speedLevel];
        
        return Math.max(adjustedSpeed * speedMultiplier, 20); // 最小速度限制为20ms
    }
    
    updateGameSpeed() {
        if (this.gameRunning && !this.gamePaused) {
            clearInterval(this.gameLoop);
            this.gameLoop = setInterval(() => this.update(), this.getGameSpeed());
        }
    }
    
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#2d3748';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制蛇
        this.drawSnake();
        
        // 绘制食物
        this.drawFood();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#4a5568';
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // 蛇头
                this.ctx.fillStyle = '#48bb78';
                this.ctx.fillRect(
                    segment.x * this.gridSize + 1,
                    segment.y * this.gridSize + 1,
                    this.gridSize - 2,
                    this.gridSize - 2
                );
                
                // 蛇头边框
                this.ctx.strokeStyle = '#38a169';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(
                    segment.x * this.gridSize + 1,
                    segment.y * this.gridSize + 1,
                    this.gridSize - 2,
                    this.gridSize - 2
                );
            } else {
                // 蛇身
                this.ctx.fillStyle = '#68d391';
                this.ctx.fillRect(
                    segment.x * this.gridSize + 2,
                    segment.y * this.gridSize + 2,
                    this.gridSize - 4,
                    this.gridSize - 4
                );
            }
        });
    }
    
    drawFood() {
        this.ctx.fillStyle = '#f56565';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            2 * Math.PI
        );
        this.ctx.fill();
        
        // 食物发光效果
        this.ctx.shadowColor = '#f56565';
        this.ctx.shadowBlur = 10;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});
