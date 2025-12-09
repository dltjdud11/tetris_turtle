// --- 게임 설정 ---
const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 30; // CSS에서 사용하지 않지만, 계산에 필요할 수 있음
let score = 0;
let gameBoard = [];
let currentTetromino;
let currentRotation = 0;
let currentPosition = 4; // 시작 위치
let timerId;

const boardElement = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const startButton = document.getElementById('start-button');
const controls = {
    left: document.getElementById('left'),
    rotate: document.getElementById('rotate'),
    right: document.getElementById('right'),
    down: document.getElementById('down'),
};

// --- 테트로미노 모양 정의 ---
const TETROMINOS = [
    // L
    [[1, COLS + 1, COLS * 2 + 1, 2], [COLS, COLS * 2, COLS * 2 + 1, COLS * 2 + 2], [1, COLS + 1, COLS * 2 + 1, COLS * 2], [COLS, COLS + 1, COLS + 2, COLS * 2 + 2]],
    // J
    [[1, COLS + 1, COLS * 2 + 1, 0], [COLS, COLS * 2, COLS + 1, COLS + 2], [1, COLS + 1, COLS * 2 + 1, COLS * 2 + 2], [COLS + 2, COLS * 2, COLS * 2 + 1, COLS * 2 + 2]],
    // T
    [[1, COLS, COLS + 1, COLS + 2], [1, COLS + 1, COLS * 2 + 1, COLS + 2], [COLS, COLS + 1, COLS + 2, COLS * 2 + 1], [1, COLS, COLS + 1, COLS * 2 + 1]],
    // S
    [[COLS + 1, COLS + 2, COLS * 2, COLS * 2 + 1], [0, COLS, COLS + 1, COLS * 2 + 1]],
    // Z
    [[COLS, COLS + 1, COLS * 2 + 1, COLS * 2 + 2], [1, COLS, COLS + 1, COLS * 2]],
    // I
    [[1, COLS + 1, COLS * 2 + 1, COLS * 3 + 1], [COLS, COLS + 1, COLS + 2, COLS + 3]],
    // O
    [[0, 1, COLS, COLS + 1]]
];

const TETROMINO_NAMES = ['L', 'J', 'T', 'S', 'Z', 'I', 'O'];

// --- 보드 초기화 및 렌더링 ---
function createBoard() {
    for (let i = 0; i < COLS * ROWS; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        boardElement.appendChild(cell);
        gameBoard.push(cell); // DOM 요소 저장
    }
}

// --- 블록 생성 ---
function generateTetromino() {
    const randomIndex = Math.floor(Math.random() * TETROMINOS.length);
    currentTetromino = TETROMINOS[randomIndex];
    currentRotation = 0;
    currentPosition = 4;
    // 다음 블록 미리보기도 구현해야 합니다. (생략)
    draw();
}

// --- 블록 그리기 ---
function draw() {
    // 이전 위치 지우기 (if not permanent)
    undraw(); 

    currentTetromino[currentRotation].forEach(index => {
        if (gameBoard[currentPosition + index]) {
            gameBoard[currentPosition + index].classList.add(TETROMINO_NAMES[TETROMINOS.indexOf(currentTetromino)]);
        }
    });
}

// --- 블록 지우기 ---
function undraw() {
    currentTetromino[currentRotation].forEach(index => {
        if (gameBoard[currentPosition + index]) {
            gameBoard[currentPosition + index].className = 'cell'; // 클래스 초기화
        }
    });
}

// --- 이동 규칙 확인 ---
function isAtBottom(index) {
    return index + COLS >= COLS * ROWS;
}

function isAtLeft(index) {
    return index % COLS === 0;
}

function isAtRight(index) {
    return (index % COLS === COLS - 1);
}

function checkCollision(nextPosition) {
    return currentTetromino[currentRotation].some(index => {
        const targetIndex = nextPosition + index;
        // 보드 바깥이나 이미 채워진 셀에 충돌하는지 확인
        return targetIndex < 0 || targetIndex >= COLS * ROWS || 
               (gameBoard[targetIndex] && gameBoard[targetIndex].classList.length > 1);
    });
}

// --- 블록 이동 로직 ---
function move(direction) {
    undraw();
    let newPosition = currentPosition + direction;

    if (direction === -1 && currentTetromino[currentRotation].some(isAtLeft)) {
        newPosition = currentPosition;
    } else if (direction === 1 && currentTetromino[currentRotation].some(isAtRight)) {
        newPosition = currentPosition;
    }

    if (!checkCollision(newPosition)) {
        currentPosition = newPosition;
    }
    draw();
}

// --- 블록 하강 로직 ---
function fall() {
    undraw();
    let newPosition = currentPosition + COLS;

    if (checkCollision(newPosition)) {
        // 충돌하면 현재 위치에 블록을 고정하고 새 블록 생성
        freeze();
        checkLines();
        generateTetromino();
        if (checkCollision(currentPosition + COLS)) {
            // 새 블록이 생성되자마자 충돌하면 게임 오버
            gameOver();
        }
    } else {
        currentPosition = newPosition;
    }
    draw();
}

// --- 블록 고정 ---
function freeze() {
    // 현재 위치의 블록 셀들에 영구적인 클래스 추가
    currentTetromino[currentRotation].forEach(index => {
        gameBoard[currentPosition + index].classList.add(TETROMINO_NAMES[TETROMINOS.indexOf(currentTetromino)]);
    });
}

// --- 블록 회전 로직 ---
function rotate() {
    undraw();
    const nextRotation = (currentRotation + 1) % currentTetromino.length;

    // 회전 후 충돌 체크
    if (!checkCollision(currentPosition, nextRotation)) {
        currentRotation = nextRotation;
    }
    draw();
}

// --- 줄 제거 및 점수 계산 ---
function checkLines() {
    for (let i = 0; i < ROWS; i++) {
        const start = i * COLS;
        const row = Array.from(gameBoard).slice(start, start + COLS);
        
        // 해당 줄의 모든 셀에 블록 클래스가 있으면 (즉, .cell 이외의 클래스가 1개 이상)
        const isFull = row.every(cell => cell.classList.length > 1);
        
        if (isFull) {
            score += 10;
            scoreElement.textContent = score;

            // 줄 제거
            row.forEach(cell => cell.className = 'cell');
            
            // 제거된 줄 위의 모든 블록을 한 칸씩 내립니다.
            const blocksToMove = Array.from(gameBoard).splice(0, start);
            boardElement.innerHTML = '';
            gameBoard = blocksToMove.concat(row).concat(Array.from(gameBoard).splice(start + COLS));
            
            // DOM과 gameBoard를 다시 연결하고 렌더링
            gameBoard.forEach(cell => boardElement.appendChild(cell));
        }
    }
}


// --- 게임 오버 ---
function gameOver() {
    clearInterval(timerId);
    alert(`Game Over! Score: ${score}`);
}

// --- 이벤트 리스너 ---

// PC 키보드 이벤트
document.addEventListener('keydown', (e) => {
    if (!timerId) return; // 게임 시작 전에는 작동 안 함

    if (e.key === 'ArrowLeft') move(-1);
    else if (e.key === 'ArrowRight') move(1);
    else if (e.key === 'ArrowDown') fall();
    else if (e.key === 'ArrowUp') rotate();
});

// 모바일/터치 버튼 이벤트
controls.left.addEventListener('click', () => move(-1));
controls.right.addEventListener('click', () => move(1));
controls.down.addEventListener('click', () => fall());
controls.rotate.addEventListener('click', () => rotate());

// 게임 시작 버튼
startButton.addEventListener('click', () => {
    if (timerId) {
        clearInterval(timerId); // 이미 실행 중이면 멈춤 (일시 정지 기능)
        timerId = null;
        startButton.textContent = 'RESUME';
    } else {
        // 게임 초기화
        score = 0;
        scoreElement.textContent = score;
        gameBoard.forEach(cell => cell.className = 'cell');
        
        // 새 게임 시작
        generateTetromino();
        timerId = setInterval(fall, 1000); // 1초마다 하강
        startButton.textContent = 'PAUSE';
    }
});

// --- 초기 실행 ---
createBoard();
