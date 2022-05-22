// import kaboom from '/node_modules/kaboom/dist/kaboom.mjs'; // Offline support
import kaboom from 'https://unpkg.com/kaboom/dist/kaboom.mjs';
import { maps, levelCfg } from './mapConfig.js';
import * as controlProperties from './controlProperties.js';

let canSquash = false;
let isJumping = true;
let isBig = false;
let isAlive = true;
let isInvincible = false;
let SPEED = controlProperties.WALK_SPEED;
let level = 0;
let score = 0;
let levelMusic;

controlProperties.canvas.width = window.screen.width;
// controlProperties.canvas.height = window.screen.height;

kaboom({
  canvas: controlProperties.canvas,
  scale: 2,
  debug: true,
  background: [0, 0, 0, 1],
  fullscreen: true,
});

loadRoot('./src/audios/');
loadSound('jump0', 'jump0.wav');
loadSound('jump1', 'jump1.wav');
loadSound('death', 'death.wav');
loadSound('pause', 'pause.wav');
loadSound('bump', 'bump.wav');
loadSound('pipe', 'pipe.wav');
loadSound('coin', 'coin.wav');
loadSound('test', 'test.mp3');
loadSound('power_down', 'power_down.wav');
loadSound('grow-up', 'grow-up.wav');
loadSound('breakblock', 'breakblock.wav');
loadSound('stomp', 'stomp.wav');
loadSound('stage_clear', 'stage_clear.wav');
loadSound('mushroom_appears', 'mushroom_appears.wav');

loadRoot('./src/img/');
loadAseprite('mario', 'Mario.png', 'Mario.json');
loadSprite('bg1', 'bg1.png');
loadSprite('cloud', 'cloud.png');
loadSprite('hill', 'hill.png');
loadSprite('shrubbery', 'shrubbery.png');
loadSprite('coin', 'coin.png');
loadSprite('evil-shroom', 'evil-shroom.png');
loadSprite('evil-shroom-cave', 'evil-shroom-cave.png');
loadSprite('brick', 'brick.png');
loadSprite('cobblestone', 'cobblestone.png');
loadSprite('brick-cave', 'brick-cave.png');
loadSprite('block-cave', 'block-cave.png');
loadSprite('mushroom', 'mushroom.png');
loadSprite('surprise', 'surprise-block.png');
loadSprite('surprise-cave', 'surprise-block-cave.png');
loadSprite('unboxed', 'unboxed.png');
loadSprite('pipe-top-left', 'pipe-top-left.png');
loadSprite('pipe-top-right', 'pipe-top-right.png');
loadSprite('pipe-bottom-left', 'pipe-bottom-left.png');
loadSprite('pipe-bottom-right', 'pipe-bottom-right.png');
loadSprite('castle', 'castle.png');

function stopMusic(music) {
  music.pause();
  music.currentTime = 0;
}

scene('game', (level, score) => {
  function updateScore(coins = 0, level) {
    controlProperties.coinValue.textContent = `: ${coins}`;
    controlProperties.levelValue.textContent = `Level: ${level + 1}`;
  }

  updateScore(score, level);

  controlProperties.resetContainer.classList.add('hidden');

  layers(['bg', 'obj', 'ui'], 'obj');

  if (level === 0 || level === 4)
    add([sprite('bg1'), layer('bg'), pos((0, 0)), scale(2)]);

  levelMusic.play();

  const gameLevel = addLevel(maps[level], levelCfg);
  const scoreLabel = add([{ value: score }]);
  const player = gameLevel.spawn('p', 1, 10);

  function playerState() {
    isBig ? player.bigger() : player.smaller();
  }

  playerState();

  function invincibility() {
    isInvincible = true;
    setInterval(
      () => (isInvincible = false),
      controlProperties.INVINCIBILITY_TIME_INTERVAL
    );
  }

  player.onHeadbutt(obj => {
    if (obj.is('coin-surprise')) {
      let coin = gameLevel.spawn('$', obj.gridPos.sub(0, 1));
      coin.bump();

      destroy(obj);
      gameLevel.spawn('}', obj.gridPos.sub(0, 0));
    }
    if (obj.is('mushroom-surprise' || 'mushroom-surprise-cave')) {
      play('mushroom_appears');
      gameLevel.spawn('#', obj.gridPos.sub(0, 1));
      destroy(obj);
      gameLevel.spawn('}', obj.gridPos.sub(0, 0));
    }
    if (isBig) {
      if (obj.is('brick')) {
        play('breakblock');
        destroy(obj);
      }
    } else play('bump');
  });

  player.onCollide('mushroom', m => {
    play('grow-up');
    destroy(m);
    if (!isBig) player.bigger();
    isBig = true;
  });

  player.onCollide('coin', c => {
    play('coin');
    destroy(c);
    scoreLabel.value++;
    scoreLabel.text = scoreLabel.value;
    updateScore(scoreLabel.text, level);
  });

  player.onCollide('dangerous', d => {
    if (d.isAlive == false) return;
    if (isJumping || !player.isGrounded()) {
      player.bump();
      play('stomp');
      destroy(d);
    } else if (isBig) {
      //Toggle secret btn!
      controlProperties.secretBtn.checked ? play('test') : play('power_down');
      player.smaller();
      isBig = false;
      invincibility();
    } else if (isInvincible) return;
    else {
      stopMusic(levelMusic);
      controlProperties.secretBtn.checked ? play('test') : play('death');
      // player.die();
      isAlive = false;
      go('lose', { score: scoreLabel.value });
    }
  });

  player.onUpdate(() => {
    const currCam = camPos();
    if (currCam.x < player.pos.x) camPos(player.pos.x, currCam.y);
    if (player.pos.y >= controlProperties.FALL_DEATH) {
      stopMusic(levelMusic);
      controlProperties.secretBtn.checked ? play('test') : play('death');

      isAlive = false;
      go('lose', { score: scoreLabel.value });
    }
  });

  function keyDown() {
    stopMusic(levelMusic);
    play('pipe');
    // if (level === maps.length - 1) {
    // } else
    nextLevel(level + 1, scoreLabel.value);
  }

  player.onCollide('pipe', () => {
    onKeyPress(controlProperties.GO_DOWN_KEY, () => {
      keyDown();
    });

    controlProperties.GO_DOWN_KEY_TS.addEventListener('mousedown', keyDown);
  });

  player.onCollide('castle', () => {
    stopMusic(levelMusic);
    play('stage_clear');
    go('win', { score: scoreLabel.value });
  });

  function keyLeft() {
    if (player.isFrozen) return;
    player.flipX(true);
    if (toScreen(player.pos).x > 20) player.move(-SPEED, 0);
  }

  function keyRight() {
    if (player.isFrozen) return;
    player.flipX(false);
    player.move(SPEED, 0);
  }

  function keyJump() {
    if (player.isGrounded()) {
      play(`jump${randi(0, 2)}`, { volume: 0.5 });
      isJumping = true;
      if (isBig) player.jump(controlProperties.BIG_JUMP_FORCE);
      else player.jump(controlProperties.JUMP_FORCE);
      canSquash = true;
    }
  }

  onKeyDown(controlProperties.GO_LEFT_KEY, () => {
    keyLeft();
  });

  onKeyDown(controlProperties.GO_RIGHT_KEY, () => {
    keyRight();
  });

  onKeyPress(controlProperties.JUMP_KEY, () => {
    keyJump();
  });

  controlProperties.GO_LEFT_KEY_TS.addEventListener('mousedown', keyLeft);
  controlProperties.GO_RIGHT_KEY_TS.addEventListener('mousedown', keyRight);
  controlProperties.JUMP_KEY_TS.addEventListener('mousedown', keyJump);

  onKeyDown(controlProperties.RUN_KEY, () => {
    SPEED = controlProperties.RUN_SPEED;
  });

  controlProperties.RUN_KEY_TS.addEventListener('mousedown', () => {
    SPEED = controlProperties.RUN_SPEED;
  });

  onKeyRelease(controlProperties.RUN_KEY, () => {
    SPEED = controlProperties.WALK_SPEED;
  });

  controlProperties.RUN_KEY_TS.addEventListener('mouseup', () => {
    SPEED = controlProperties.RUN_SPEED;
  });

  player.onUpdate(() => {
    if (player.isGrounded()) {
      isJumping = false;
    }
  });

  if (player.grounded()) {
    canSquash = false;
  }
});

scene('lose', ({ score }) => {
  isBig = false;
  controlProperties.resetBtn.textContent = 'TRY AGAIN!';
  controlProperties.resetContainer.classList.remove('hidden');
  controlProperties.resetText.textContent = `
    Game over!
    Your score was: ${score} coin${score === 1 ? '' : 's'}.
    `;
  isAlive = true;
});

scene('win', ({ score }) => {
  const gameCompleted = ((score / controlProperties.TOTAL_COINS) * 100).toFixed(
    0
  );
  isBig = false;
  controlProperties.resetBtn.textContent = 'RESTART GAME';
  controlProperties.resetContainer.classList.remove('hidden');
  controlProperties.resetText.textContent = `
    Congratulations
    You won this game!
    Your score: ${score} coin${score === 1 ? '' : 's'}.
    ${
      score === controlProperties.TOTAL_COINS
        ? `🏆AMAZING!!!🏆
    You got all coins! ${gameCompleted}%! 😁👍`
        : `You collected ${gameCompleted}% of coins.`
    }`;
});

function toggleInfo() {
  play('pause');
  controlProperties.helpContainer.classList.toggle('hidden');
  controlProperties.overlay.classList.toggle('hidden');
}

controlProperties.resetBtn.addEventListener('click', function () {
  init();
});

function init() {
  // controlProperties.canvas.style.zIndex = 5;
  controlProperties.helpIcon.addEventListener('click', toggleInfo);
  controlProperties.closeModal.addEventListener('click', toggleInfo);
  controlProperties.overlay.addEventListener('click', toggleInfo);
  controlProperties.resetText.textContent = 'Click on screen to start play!';
  controlProperties.resetBtn.classList.add('hidden');
  document.querySelector('body').addEventListener(
    'click',
    () => {
      nextLevel();
      // if (window.innerWidth < 1200)
      //   controlProperties.canvas.requestFullscreen();
    },
    { once: true }
  );
  // onClick(() => {
  // go('game', level, score);
  // controlProperties.resetBtn.classList.remove('hidden');
  // controlProperties.canvas.style.zIndex = 0;
  // })
}

function nextLevel(levelGame = 0, scoreGame = 0) {
  controlProperties.loadingScreen.classList.remove('hidden');
  controlProperties.loadingContent.textContent = `
  Level: ${levelGame + 1}
  `;
  setTimeout(() => {
    controlProperties.loadingScreen.classList.add('hidden');
    if (controlProperties.resetBtn.classList.contains('hidden'))
      controlProperties.resetBtn.classList.remove('hidden');

    if (levelMusic) stopMusic(levelMusic);

    levelMusic = new Audio(
      levelGame === 0 || levelGame === 4
        ? './src/audios/levelGround.mp3'
        : './src/audios/levelCave.mp3'
    );
    levelMusic.loop = true;
    go('game', levelGame, scoreGame);
  }, 1500);
}

document.querySelector('.aYear').innerHTML = new Date().getFullYear();

init();
