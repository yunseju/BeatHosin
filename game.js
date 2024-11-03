const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 400;
canvas.height = 600;

let player, bullets, enemies, enemyBullets, score, gameOver, lives, isInvincible, stage, maxLife;
let invincibleTimer, gameLoopInterval, bulletCooldown, curBulletCooldown, bulletWidth;
let powerUps = [];
const restartBtn = document.getElementById("restartBtn");

// 사운드 설정
const shootSound = new Audio("shoot.mp3");
const explosionSound = new Audio("explosion.mp3");
const powerUpSound = new Audio("powerup.mp3");

shootSound.volume = 0.15;
explosionSound.volume = 0.15;
powerUpSound.volume = 0.15;

// 볼륨 조절 슬라이더 이벤트 리스너
document.getElementById("volumeSlider").addEventListener("input", (event) => {
  const volume = event.target.value;
  shootSound.volume = volume;
  explosionSound.volume = volume;
  powerUpSound.volume = volume;
});
// 배경 이미지 설정
const bgImage1 = new Image();
bgImage1.src = "background1.jpg";
const bgImage2 = new Image();
bgImage2.src = "background2.png";
const bgImage3 = new Image();
bgImage3.src = "background3.png";
let bgY = 0;
const playerImage = new Image();
playerImage.src = "player.png"; // 내 비행기 이미지 경로
const EnemyImage = new Image();
EnemyImage.src = "enemy.png"; // 적 비행기 이미지 경로
const BombImage = new Image();
BombImage.src = "bomb.png"; // 적 비행기 이미지 경로

let bombs = 0; // 폭탄 수

// 게임 초기화 함수 수정
function initGame() {
  player = { x: 180, y: 500, width: 40, height: 40, speed: 5 };
  bullets = [];
  enemies = [];
  enemyBullets = [];
  score = 0;
  lives = 3;
  stage = 1;
  bombs = 0; // 폭탄 수 초기화
  gameOver = false;
  isInvincible = false;
  bulletCooldown = 10;
  curBulletCooldown = 0;
  bulletWidth = 4;
  maxLife = 5;
  powerUps = [];
  document.getElementById("score").innerText = score;
  restartBtn.style.display = "none";
}


// 키보드 이벤트
const keys = {};
document.addEventListener("keydown", (e) => { 
  keys[e.key] = true; 
  if (e.key === "c" || e.key === "C") {
    useBomb(); // 폭탄 사용 함수 호출
  }
});
document.addEventListener("keyup", (e) => { keys[e.key] = false; });

// 폭탄 생성
function createBomb() {
  bombs = Math.min(bombs + 1, 3); // 최대 3개까지 충전
}

// 사운드 재생 함수
function playSound(sound) {
  sound.currentTime = 0;
  sound.play();
}

// 플레이어 이동 및 총알 발사
function updatePlayer() {
  // 왼쪽 이동
  if (keys["ArrowLeft"] && player.x > 0) {
    player.x -= player.speed;
  }
  // 오른쪽 이동
  if (keys["ArrowRight"] && player.x < canvas.width - player.width) {
    player.x += player.speed;
  }
  // 위쪽 이동
  if (keys["ArrowUp"] && player.y > 0) {
    player.y -= player.speed;
  }
  // 아래쪽 이동
  if (keys["ArrowDown"] && player.y < canvas.height - player.height) {
    player.y += player.speed;
  }

  // 총알 발사 (스페이스바)
  if (keys[" "] && curBulletCooldown <= 0) {
    // 사운드 재생 추가
    shootSound.currentTime = 0;  // 사운드를 처음부터 재생
    shootSound.play();
    
    bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, width: bulletWidth, height: 10, speed: 7 });
    curBulletCooldown = bulletCooldown;  // 쿨다운 시간 설정
  }
  if (curBulletCooldown > 0) curBulletCooldown--;  // 쿨다운 시간 감소
}

// 적 생성 (다양한 속도와 크기)
function createEnemy() {
  const x = Math.random() * (canvas.width - 40);
  const size = Math.random() * 30 + 20;
  const speed = Math.random() * 1.5 + 1;
  enemies.push({ x: x, y: -size, width: size, height: size, speed: speed });
}

// 파워업 생성
// 무적 파워업과 폭탄 아이템 생성 함수
function createPowerUp() {
  const x = Math.random() * (canvas.width - 20);
  const types = ["shield", "bomb", "speed", "width", "life"]; // 파워업 타입 배열
  const type = types[Math.floor(Math.random() * types.length)]; // 랜덤 타입 선택
  powerUps.push({ x: x, y: -20, width: 20, height: 20, type: type });
  // const type = Math.random() < 0.5 ? "shield" : "bomb"; // 50% 확률로 무적 또는 폭탄
  // powerUps.push({ x: x, y: -20, width: 20, height: 20, type: type });
}
// 적의 총알 발사
function enemyShoot(enemy) {
  const dx = player.x + player.width / 2 - (enemy.x + enemy.width / 2);
  const dy = player.y - enemy.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const speed = 3;
  enemyBullets.push({
    x: enemy.x + enemy.width / 2 - 2,
    y: enemy.y + enemy.height,
    width: 4,
    height: 10,
    vx: (dx / distance) * speed,
    vy: (dy / distance) * speed
  });
}

// 무적 상태 시작
function startInvincibility(duration) {
  isInvincible = true;

  // 설정된 duration 동안 무적 상태 유지
  clearTimeout(invincibleTimer); // 기존 타이머 초기화
  invincibleTimer = setTimeout(() => {
    isInvincible = false;
  }, duration);
}

// 폭탄 사용 함수
function useBomb() {
  if (bombs > 0) {
    bombs--; // 폭탄 수 감소

    // 일반 적과 총알 삭제
    enemies = enemies.filter(enemy => enemy.type === "boss"); // 보스 제외
    enemyBullets = []; // 모든 적 총알 삭제

    // 보스 몬스터에 큰 데미지 주기
    enemies.forEach(enemy => {
      if (enemy.type === "boss") {
        enemy.health -= 50; // 보스에 50 데미지
      }
      
    });
  }
}
// 발사 속도 증가 함수
function increaseFireRate() {
  bulletCooldown = Math.max(bulletCooldown - 2, 1); // 최소 쿨다운 1로 제한
}
// 총알 너비 증가 함수
function increaseBulletWidth() {
  bulletWidth = Math.min(bulletWidth + 2, 10); // 최대 너비 10으로 제한
}
function increaseLife() {
  if(lives < maxLife)
    lives ++;
}

// 파워업 충돌 체크
function checkPowerUpCollision() {
  powerUps.forEach((powerUp, index) => {
    powerUp.y += 2;
    if (
      player.x < powerUp.x + powerUp.width &&
      player.x + player.width > powerUp.x &&
      player.y < powerUp.y + powerUp.height &&
      player.y + player.height > powerUp.y
    ) {
      // 아이템 종류에 따라 다른 효과 적용
      if (powerUp.type === "shield") {
        playSound(powerUpSound);
        startInvincibility(3000); // 3초 무적
      } else if (powerUp.type === "bomb") {
        playSound(powerUpSound);
        createBomb(); // 폭탄 충전
      } else if (powerUp.type === "speed") {
        playSound(powerUpSound);
        increaseFireRate(); // 총알 발사 속도 증가
      } else if (powerUp.type === "width") {
        playSound(powerUpSound);
        increaseBulletWidth(); // 총알 너비 증가
      } else if (powerUp.type === "life") {
        playSound(powerUpSound);
        increaseLife(); // 총알 너비 증가
      }
      powerUps.splice(index, 1);
    }
    if (powerUp.y > canvas.height) powerUps.splice(index, 1);
  });
}

// 스테이지 관리
function checkStage() {
  if (score >= stage * 100) {
    stage++;
    enemies.forEach((enemy) => (enemy.speed += 0.5));
  }
  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.fillText("Stage: " + stage, 180, 30);
}

// 게임 업데이트
function updateGame() {
  updatePlayer();
  bullets.forEach((bullet, index) => {
    bullet.y -= bullet.speed;
    if (bullet.y < 0) bullets.splice(index, 1);
  });

  enemies.forEach((enemy, index) => {
    enemy.y += enemy.speed;
    if (Math.random() < 0.01) enemyShoot(enemy);
    if (enemy.y > canvas.height) enemies.splice(index, 1);

    bullets.forEach((bullet, bulletIndex) => {
      if (bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y) {
        playSound(explosionSound);
        bullets.splice(bulletIndex, 1);
        enemies.splice(index, 1);
        score += 10;
        document.getElementById("score").innerText = score;
      }
    });

    if (!isInvincible &&
        player.x < enemy.x + enemy.width &&
        player.x + player.width > enemy.x &&
        player.y < enemy.y + enemy.height &&
        player.y + player.height > enemy.y) {
      loseLife();
    }
  });

  enemyBullets.forEach((bullet, index) => {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
  
    // 총알이 화면 밖으로 나가면 삭제
    if (bullet.y > canvas.height || bullet.x < 0 || bullet.x > canvas.width) {
      enemyBullets.splice(index, 1);
    }
  
    // 무적 상태일 때도 충돌 시 총알만 삭제되도록 변경
    if (
      bullet.x < player.x + player.width &&
      bullet.x + bullet.width > player.x &&
      bullet.y < player.y + player.height &&
      bullet.y + bullet.height > player.y
    ) {
      if (isInvincible) {
        // 무적 상태면 총알만 삭제
        enemyBullets.splice(index, 1);
      } else {
        // 무적 상태가 아니면 총알과 충돌 시 목숨 감소
        enemyBullets.splice(index, 1);
        loseLife();
      }
    }
  });
  

  checkPowerUpCollision();
  checkStage();

  if (Math.random() < 0.01) createEnemy();
  if (Math.random() < 0.01) createPowerUp();
}

// 목숨 감소 처리
function loseLife() {
  lives -= 1;
  startInvincibility(2000);
  if (lives <= 0) endGame();
}

// 배경 스크롤
function drawBackground() {
  bgY += 2;
  if (bgY >= canvas.height) bgY = 0;
  ctx.globalAlpha = 0.2;
  if(lives>=3){
    ctx.drawImage(bgImage1, 0, bgY - canvas.height, canvas.width, canvas.height);
    ctx.drawImage(bgImage1, 0, bgY, canvas.width, canvas.height);
  }
  else if(lives==2){
    ctx.drawImage(bgImage2, 0, bgY - canvas.height, canvas.width, canvas.height);
    ctx.drawImage(bgImage2, 0, bgY, canvas.width, canvas.height);
  }
  else if(lives<=1){
    ctx.drawImage(bgImage3, 0, bgY - canvas.height, canvas.width, canvas.height);
    ctx.drawImage(bgImage3, 0, bgY, canvas.width, canvas.height);
  }
    ctx.globalAlpha = 1;

}

// 게임 화면 그리기
function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  // // 플레이어 비행기 그리기 (무적 상태 시 깜빡임 효과 추가)
  // if (isInvincible) {
  //   // 타이머 기반 깜빡임 효과 (100ms 간격으로 깜빡임)
  //   if (Math.floor(Date.now() / 100) % 2 === 0) {
  //     ctx.fillStyle = "white";  // 비행기를 흰색으로 그리기
  //   } else {
  //     ctx.fillStyle = "rgba(255, 255, 255, 0)";  // 투명하게 설정
  //   }
  // } else {
  //   ctx.fillStyle = "white";  // 무적 상태가 아닐 때는 항상 흰색
  // }
  // ctx.fillRect(player.x, player.y, player.width, player.height);
  // 플레이어 비행기 그리기 (무적 상태일 때만 투명도 적용)
  if (isInvincible) {
    ctx.globalAlpha = 0.5; // 무적 상태일 때 투명도 설정
  }
  ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
  ctx.globalAlpha = 1; // 투명도를 기본값으로 복구
  // 총알, 적, 아이템 등 다른 요소 그리기 (변경 없음)
  bullets.forEach(bullet => {
    ctx.fillStyle = "yellow";
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  enemies.forEach(enemy => {
    // ctx.fillStyle = "red";
    // ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    ctx.drawImage(EnemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
  });

  powerUps.forEach(powerUp => {
    if (powerUp.type === "shield") {
      ctx.fillStyle = "blue"; // 무적 아이템은 파란색
      ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    } else if (powerUp.type === "bomb") {
      // ctx.fillStyle = "yellow "; // 폭탄 아이템은 빨간색
      ctx.drawImage(BombImage, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    }else if (powerUp.type === "speed") {
      ctx.fillStyle = "green"; // 발사 속도 증가 파워업
      ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    } else if (powerUp.type === "width") {
      ctx.fillStyle = "purple"; // 총알 너비 증가 파워업
      ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    }
    else if (powerUp.type === "life") {
      ctx.fillStyle = "red    "; // 총알 너비 증가 파워업
      ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    }
  });

  enemyBullets.forEach(bullet => {
    ctx.fillStyle = "orange";
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  // 폭탄 아이콘과 남은 폭탄 수 표시 (오른쪽 하단)
  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  // ctx.fillText("Bombs: ", canvas.width - 90, canvas.height - 30);

  // 간단한 폭탄 아이콘 (원형) 그리기
  for (let i = 0; i < bombs; i++) {
    // 폭탄 아이콘을 오른쪽 하단에 나란히 그리기
    ctx.drawImage(BombImage, canvas.width - 30 - (i * 20), canvas.height - 35, 16, 16);
  }
  

  // UI 요소 그리기
  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.fillText("Lives: " + lives, 300, 30);
  ctx.fillText("Score: " + score, 10, 30);

  if (gameOver) {
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over", canvas.width / 2 - 70, canvas.height / 2);
  }
}


// 게임 종료
function endGame() {
  gameOver = true;
  restartBtn.style.display = "block";
  clearInterval(gameLoopInterval);
}

// 게임 루프
function gameLoop() {
  if (!gameOver) {
    updateGame();
    drawGame();
  }
}

// 게임 시작
function startGame() {
  gameLoopInterval = setInterval(gameLoop, 1000 / 60);
}

// 재시작
function restartGame() {
  initGame();
  startGame();
}

// 초기화 및 게임 시작
initGame();
startGame();
