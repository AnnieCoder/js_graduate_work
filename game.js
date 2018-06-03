'use strict';
class Vector {
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}
	plus(currentVector) {
		if (currentVector instanceof Vector) {
			return new Vector(this.x + currentVector.x, this.y + currentVector.y);
		} else throw new Error('Можно прибавлять к вектору только вектор типа Vector.');
	}
	times(multiplier) {
		return new Vector(multiplier * this.x, multiplier * this.y);
	}
}

const start = new Vector(30, 50);
const moveTo = new Vector(5, 10);
const finish = start.plus(moveTo.times(2));

console.log(`Исходное расположение: ${start.x}:${start.y}`);
console.log(`Текущее расположение: ${finish.x}:${finish.y}`);

class Actor {
	constructor(currentPosition = null, size = null, speed = null) {
	if (!currentPosition) {
      currentPosition = new Vector(0, 0);
    }
    if (!size) {
      size = new Vector(1, 1);
    }
    if (!speed) {
      speed = new Vector(0, 0);
    }

    if (!(currentPosition instanceof Vector)) {
      throw new Error('Расположение не является объектом типа Vector');
    }
    if (!(size instanceof Vector)) {
      throw new Error('Размер не является объектом типа Vector');
    }
    if (!(speed instanceof Vector)) {
      throw new Error('Скорость не является объектом типа Vector');
    }

    this.pos = currentPosition;
    this.size = size;
    this.speed = speed;  
  }
	act() {
		//empty method
	}
	get left() {
		return this.pos.x;
	}
	get top() {
		return this.pos.y;
	}
	get right() {
		return this.pos.x + this.size.x;
	}
	get bottom() {
		return this.pos.y + this.size.y;
	}
	get type() {
		return 'actor';
	}
	isIntersect(currentActor) {
		if (currentActor instanceof Actor) {
			if (currentActor === this) {
				return false;
			}
			return (
				currentActor.left < this.right &&
				currentActor.right > this.left &&
				currentActor.top < this.bottom &&
				currentActor.bottom > this.top
			);
		} throw new Error('Переданный параметр не является объектом типа Actor.');
	}
}

const items = new Map();
const curPlayer = new Actor();
items.set('Игрок', curPlayer);
items.set('Первая монета', new Actor(new Vector(10, 10)));
items.set('Вторая монета', new Actor(new Vector(15, 5)));

function position(item) {
	return ['left', 'top', 'right', 'bottom']
		.map(side => `${side}: ${item[side]}`)
		.join(', ');
}

function movePlayer(x, y) {
	curPlayer.pos = curPlayer.pos.plus(new Vector(x, y));
}

function status(item, title) {
	console.log(`${title}: ${position(item)}`);
	if (curPlayer.isIntersect(item)) {
		console.log(`Игрок подобрал ${title}`);
	}
}

items.forEach(status);
movePlayer(10, 10);
items.forEach(status);
movePlayer(5, -5);
items.forEach(status);

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    this.player = this.actors.find(actor => actor.type === 'player');
    this.status = null;
    this.finishDelay = 1;
  }

  get height() {
    return this.grid.length;
  }
  get width() {
    return this.grid.reduce(function(memo, element) {
      if (element.length > memo) {
        return element.length;
      } else return memo;
    }, 0);
  }

  isFinished() {
    return this.status != null && this.finishDelay < 0;
  }

  actorAt(actor) {
    if (!(actor instanceof Actor) || !actor) {
      throw new Error('Переданный параметр не является объектом типа Actor');
    }
    return this.actors.find(element => element.isIntersect(actor));
  }

  obstacleAt(position, size) {
    if (!(position instanceof Vector) 
      || !(size instanceof Vector) 
      || !position || !size) {
      throw new Error('Один из параметров не является объектом типа Vector.');
    }
 
    let left = Math.floor(position.x);
    let right = Math.ceil(position.x + size.x);
    let top = Math.floor(position.y);
    let bottom = Math.ceil(position.y + size.y);

    if (left < 0 
      || right > this.width 
      || top < 0) {
      return 'wall';
    } 
    if (bottom > this.height) {
      return 'lava';
    }
    
    for (let i = top; i < bottom; i++) {
      for (let j = left; j < right; j++) {
        let gridLevel = this.grid[i][j];
        if (gridLevel) {
          return gridLevel;
        }
      }
    }
  }

  removeActor(actor) {
    if (this.actors.includes(actor)) {
      this.actors.splice(this.actors.indexOf(actor), 1);
    }
  }

  noMoreActors(type) {
    return this.actors.findIndex(element => element.type === type) === -1;
  }

  playerTouched(type, actor) {
    if (this.status !== null) {
      return;
    }
    if (type === 'lava' || type === 'fireball') {
      this.status = 'lost';
      return;
    }
    if (type === 'coin' && actor.type === 'coin') {
      this.removeActor(actor);
      if (this.noMoreActors('coin')) {
        this.status = 'won';
      }
      return;
    }
  }
}

const grid = [
  [undefined, undefined],
  ['wall', 'wall']
];

function MyCoin(title) {
  this.type = 'coin';
  this.title = title;
}
MyCoin.prototype = Object.create(Actor);
MyCoin.constructor = MyCoin;

const goldCoin = new MyCoin('Золото');
const bronzeCoin = new MyCoin('Бронза');
const player = new Actor();
const fireball = new Actor();

const level = new Level(grid, [ goldCoin, bronzeCoin, player, fireball ]);

level.playerTouched('coin', goldCoin);
level.playerTouched('coin', bronzeCoin);

if (level.noMoreActors('coin')) {
  console.log('Все монеты собраны');
  console.log(`Статус игры: ${level.status}`);
}

const obstacle = level.obstacleAt(new Vector(1, 1), player.size);
if (obstacle) {
  console.log(`На пути препятствие: ${obstacle}`);
}

const otherActor = level.actorAt(player);
if (otherActor === fireball) {
  console.log('Пользователь столкнулся с шаровой молнией');
}

const FIXED = {
  'x': 'wall',
  '!': 'lava'
};

class LevelParser {
  constructor(dictionary) {
    this.dictionary = dictionary;
  }

  actorFromSymbol(sign) {
    if (sign && this.dictionary)
    return this.dictionary[sign];
  }

  obstacleFromSymbol(sign) {
    if (!sign) return undefined;
    return FIXED[sign];    
  }

  createGrid(plan) {
    return plan.map(function(row) {
      return [...row].map(element => FIXED[element]);
    });
  }
  
  createActors(plan) {
    let thisPlan = this;
    return plan.reduce(function(prev, rowY, y) {
      [...rowY].forEach(function(rowX, x) {
        if (rowX) {
          let constructor = thisPlan.actorFromSymbol(rowX);
          if (constructor && typeof constructor === 'function') {
            let actor = new constructor (new Vector(x, y));
            if (actor instanceof Actor) {
              prev.push(actor);
            }
          }
        }
      });
      return prev;
    }, []);
  }

  parse(plan) {
    return new Level(this.createGrid(plan), this.createActors(plan));
  }
}

const plan = [
  ' @ ',
  'x!x'
];

const actorsDict = Object.create(null);
actorsDict['@'] = Actor;

const parser = new LevelParser(actorsDict);
const level1 = parser.parse(plan);

level1.grid.forEach((line, y) => {
  line.forEach((cell, x) => console.log(`(${x}:${y}) ${cell}`));
});

level1.actors.forEach(actor => console.log(`(${actor.pos.x}:${actor.pos.y}) ${actor.type}`));

class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    let size = new Vector(1, 1);
    super(pos, size, speed);
	this.pos = pos;
  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  act(time, level) {
    let nextPosition = this.getNextPosition(time);
    if (level.obstacleAt(nextPosition, this.size)) {
      this.handleObstacle();
    } else {
      this.pos = nextPosition;
    }
  }
}

const time = 5;
const speed = new Vector(1, 0);
const curPosition = new Vector(5, 5);

const ball = new Fireball(curPosition, speed);

const nextPosition = ball.getNextPosition(time);
console.log(`Новая позиция: ${nextPosition.x}: ${nextPosition.y}`);

ball.handleObstacle();
console.log(`Текущая скорость: ${ball.speed.x}: ${ball.speed.y}`);


class HorizontalFireball extends Fireball {
  constructor(currentPosition) {
    let speed = new Vector(2, 0);
    super(currentPosition, speed);
  }
}

class VerticalFireball extends Fireball {
  constructor(currentPosition) {
    let speed = new Vector(0, 2);
    super(currentPosition, speed);
  }
}

class FireRain extends Fireball {
  constructor(currentPosition) {
    let speed = new Vector(0, 3);
    super(currentPosition, speed);
    this.startPosition = currentPosition;
  }

  handleObstacle() {
    this.pos = this.startPosition;
  }
}

class Coin extends Actor {
  constructor(currentPosition) {
    if (!currentPosition) {
      currentPosition = new Vector(0, 0);
    }
    currentPosition = currentPosition.plus(new Vector(0.2, 0.1));
    let size = new Vector(0.6, 0.6);
    super(currentPosition, size);

    this.startPosition = currentPosition;
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * 2 * Math.PI;
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.startPosition.plus(this.getSpringVector());
  }

  act(time = 1) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(currentPosition) {
    if (!currentPosition) {
      currentPosition = new Vector(0, 0);
    }
    currentPosition = currentPosition.plus(new Vector(0, -0.5));
    let size = new Vector(0.8, 1.5);
    let speed = new Vector(0, 0);
    super(currentPosition, size, speed);
  }

  get type() {
    return 'player';
  }
}

const actorDict  = {
  '@': 'player',
  'o': 'coin',
  '=': 'fireball',
  '|': 'fireball',
  'v': 'firerain'
};

const curParser = new LevelParser(actorDict);

loadLevels()
  .then((result) => {
    runGame(JSON.parse(result), curParser, DOMDisplay)
      .then(() => alert('Вы выиграли!'))
  });