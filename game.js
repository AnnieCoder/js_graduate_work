'use strict';
class Vector {
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}
	plus(currentVector) {
		if (!(currentVector instanceof Vector)) {
			throw new Error('Можно прибавлять к вектору только вектор типа Vector.');
		}
		return new Vector(this.x + currentVector.x, this.y + currentVector.y);
	}
	times(multiplier) {
		return new Vector(multiplier * this.x, multiplier * this.y);
	}
}

class Actor {
	constructor(
		currentPosition = new Vector(0, 0),
		size = new Vector(1, 1),
		speed = new Vector(0, 0)
	) {
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
		if (!(currentActor instanceof Actor)) {
			throw new Error('Переданный параметр не является объектом типа Actor.');
		}
		if (currentActor === this) {
			return false;
		}
		return (
			currentActor.left < this.right &&
			currentActor.right > this.left &&
			currentActor.top < this.bottom &&
			currentActor.bottom > this.top
		);
	}
}

class Level {
	constructor(grid = [], actors = []) {
		this.grid = grid;
		this.actors = actors;
		this.player = this.actors.find(actor => actor.type === 'player');
		this.status = null;
		this.finishDelay = 1;
		this.width = Math.max(0, ...this.grid.map(element => element.length));
	}

	get height() {
		return this.grid.length;
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
		if (!(position instanceof Vector) || !(size instanceof Vector)) {
			throw new Error('Один из параметров не является объектом типа Vector.');
		}

		const left = Math.floor(position.x);
		const right = Math.ceil(position.x + size.x);
		const top = Math.floor(position.y);
		const bottom = Math.ceil(position.y + size.y);

		if (left < 0 || right > this.width || top < 0) {
			return 'wall';
		}
		if (bottom > this.height) {
			return 'lava';
		}

		for (let i = top; i < bottom; i++) {
			for (let j = left; j < right; j++) {
				const gridLevel = this.grid[i][j];
				if (gridLevel) {
					return gridLevel;
				}
			}
		}
	}

	removeActor(actor) {
		const findIndex = this.actors.indexOf(actor);
		if (findIndex !== -1) {
			this.actors.splice(findIndex, 1);
		}
	}

	noMoreActors(type) {
		return !this.actors.some(element => element.type === type);
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
		}
	}
}

const FIXED = {
	x: 'wall',
	'!': 'lava',
};

class LevelParser {
	constructor(dictionary = {}) {
		this.dictionary = Object.assign({}, dictionary);
	}

	actorFromSymbol(sign) {
		return this.dictionary[sign];
	}

	obstacleFromSymbol(sign) {
		return FIXED[sign];
	}

	createGrid(plan) {
		// тут нужно использовать obstacleFromSymbol
		return plan.map(row => row.split('').map(sign => FIXED[sign]));
	}

	createActors(plan) {
		// можно обойтись без промежуточной переменной, если использовать метод reduce
		const actors = [];
		plan.forEach((rowY, y) => {
			rowY.split('').forEach((rowX, x) => {
				// не ошибка, но constructor лучше не использовать в качестве названия переменной
				// (зарезервированное слово)
				const constructor = this.actorFromSymbol(rowX);
				if (typeof constructor !== 'function') {
					return;
				}

				const actor = new constructor(new Vector(x, y));
				if (actor instanceof Actor) {
					actors.push(actor);
				}
			});
		});
		return actors;
	}

	parse(plan) {
		return new Level(this.createGrid(plan), this.createActors(plan));
	}
}

class Fireball extends Actor {
	constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
		super(pos, new Vector(1, 1), speed);
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
		const nextPosition = this.getNextPosition(time);
		if (level.obstacleAt(nextPosition, this.size)) {
			this.handleObstacle();
		} else {
			this.pos = nextPosition;
		}
	}
}

class HorizontalFireball extends Fireball {
	constructor(currentPosition) {
		super(currentPosition, new Vector(2, 0));
	}
}

class VerticalFireball extends Fireball {
	constructor(currentPosition) {
		super(currentPosition, new Vector(0, 2));
	}
}

class FireRain extends Fireball {
	constructor(currentPosition) {
		// const
		let speed = new Vector(0, 3);
		super(currentPosition, speed);
		this.startPosition = currentPosition;
	}

	handleObstacle() {
		this.pos = this.startPosition;
	}
}

class Coin extends Actor {
	constructor(currentPosition = new Vector(0, 0)) {
		// лучше не менть значения аргументов
		currentPosition = currentPosition.plus(new Vector(0.2, 0.1));
		super(currentPosition, new Vector(0.6, 0.6));
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
	constructor(currentPosition = new Vector(0, 0)) {
    // лучше не менть значения аргументов
		currentPosition = currentPosition.plus(new Vector(0, -0.5));
		super(currentPosition, new Vector(0.8, 1.5), new Vector(0, 0));
	}

	get type() {
		return 'player';
	}
}

const actorDict = {
  '@': Player,
  'v': FireRain,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball

};
const parser = new LevelParser(actorDict);

loadLevels()
  .then((res) => {
    runGame(JSON.parse(res), parser, DOMDisplay)
      .then(() => alert('Вы выиграли!'))
  });