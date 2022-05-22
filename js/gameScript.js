import * as controlProperties from './controlProperties.js';

export const enemy = function () {
  return {
    id: 'enemy',
    require: ['pos', 'area', 'sprite', 'patrol'],
    isAlive: true,
    update() {},
    squash() {
      this.isAlive = false;
      this.unuse('patrol');
      this.stop();
      this.frame = 2;
      this.area.width = 16;
      this.area.height = 8;
      this.use(lifespan(0.5, { fade: 0.1 }));
    },
  };
};

export const bump = function (offset = 8, speed = 2, stopAtOrigin = true) {
  return {
    id: 'bump',
    require: ['pos'],
    bumpOffset: offset,
    speed: speed,
    bumped: false,
    origPos: 0,
    direction: -1,
    update() {
      if (this.bumped) {
        this.pos.y = this.pos.y + this.direction * this.speed;
        if (this.pos.y < this.origPos - this.bumpOffset) {
          this.direction = 1;
        }
        if (stopAtOrigin && this.pos.y >= this.origPos) {
          this.bumped = false;
          this.pos.y = this.origPos;
          this.direction = -1;
        }
      }
    },
    bump() {
      this.bumped = true;
      this.origPos = this.pos.y;
    },
  };
};

export const mario = function () {
  return {
    id: 'mario',
    require: ['body', 'area', 'sprite', 'bump'],
    smallAnimation: 'Running',
    bigAnimation: 'RunningBig',
    smallStopFrame: 0,
    bigStopFrame: 8,
    smallJumpFrame: 5,
    bigJumpFrame: 13,
    isBig: false,
    isFrozen: false,
    isAlive: true,
    update() {
      if (this.isFrozen) {
        this.standing();
        return;
      }

      if (!this.grounded()) {
        this.jumping();
      } else {
        if (
          keyIsDown(controlProperties.GO_LEFT_KEY) ||
          keyIsDown(controlProperties.GO_RIGHT_KEY)
        ) {
          this.running();
        } else {
          this.standing();
        }
      }
    },
    bigger() {
      this.isBig = true;
      this.area.width = 24;
      this.area.height = 32;
    },
    smaller() {
      this.isBig = false;
      this.area.width = 16;
      this.area.height = 16;
    },
    standing() {
      this.stop();
      this.frame = this.isBig ? this.bigStopFrame : this.smallStopFrame;
    },
    jumping() {
      this.stop();
      this.frame = this.isBig ? this.bigJumpFrame : this.smallJumpFrame;
    },
    running() {
      const animation = this.isBig ? this.bigAnimation : this.smallAnimation;
      if (this.curAnim() !== animation) {
        this.play(animation);
      }
    },
    freeze() {
      this.isFrozen = true;
    },
    die() {
      this.unuse('body');
      this.bump();
      this.isAlive = false;
      this.freeze();
      this.use(lifespan(1, { fade: 1 }));
    },
  };
};

export function patrol(distance = 100, speed = 50, dir = 1, obj) {
  return {
    id: 'patrol',
    require: ['pos', 'area'],
    startingPos: vec2(0, 0),
    add() {
      this.startingPos = this.pos;
      this.on('collide', (obj, side) => {
        if (side === 'left' || side === 'right') {
          dir = -dir;
        }
      });
    },
    update() {
      if (Math.abs(this.pos.x - this.startingPos.x) >= distance) {
        dir = -dir;
      }
      this.move(speed * dir, 0);
    },
  };
}
