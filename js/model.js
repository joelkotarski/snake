function Controller() {
    this.canvas = document.getElementById("canvas");
    this.context2d = this.canvas.getContext("2d");
    this.refreshHandle = null;
    this.mode = 'gameOver';
    this.blockSize = 10;
    this.foodPellets = 5;
    this.snake = null;
    this.feeder = null;
    this.density = 30;

    this.bindToEnvironment();
}

_.extend(Controller.prototype, {
    'bindToEnvironment': function () {
        var pause = this.pauseGame.bind(this);
        var restart = this.startGame.bind(this);
        var demo = this.startDemo.bind(this);
        var resize = this.resizeGame.bind(this);
        var canvas = this.canvas;
        Mousetrap.bind('space', function () { pause(); })
        this.canvas.addEventListener("mousedown", function () { restart(); })
        window.addEventListener('resize', function () { resize(); }, false);
        window.addEventListener('orientationchange', function () { resize(); }, false);
        document.addEventListener('fullscreenchange', function () {
            //Support full screen
            if (document.fullscreenElement) {
                canvas.requestFullscreen();
            }
            else {
                canvas.exitFullscreen();
            }
        });
        this.resizeGame();
        this.startDemo();
    },
    'gradientText': function () {
        //create gradient
        var gradient = this.context2d.createLinearGradient(0, 0, this.canvas.width / 3, this.canvas.height / 3);
        gradient.addColorStop("0", "magenta");
        gradient.addColorStop("0.5", "blue");
        gradient.addColorStop("1.0", "red");
        this.context2d.fillStyle = gradient;
    },
    'autoRefresh': function () {
        if (this.mode == 'running') {
            //Draw the board
            var painter = new GamePainter(this.context2d, this.blockSize);
            painter.paintBackground("black");
            this.snake.crawl();
            //Draw the snake
            _.each(this.snake.coordinates, function (segment) {
                painter.paintBlockAt(segment.x, segment.y);
            });
            //Draw the food
            _.each(this.feeder.food, function (pellet) {
                painter.paintBlockAt(pellet.x, pellet.y);
            })
            this.feeder.checkFood(this.snake);
            
            //Display the current player score
            var context = this.context2d;
            context.font = "20px Verdana";
            this.gradientText();
            context.fillText("Score: " + this.snake.player.score, this.canvas.width / 3, 20);

            this.snake.checkAgainstBounds(0, 0, this.canvas.width, this.canvas.height);

            if (this.snake.deceased)
                context.fillText("Game over - click to start over", this.canvas.width / 6, 40);
        }
        this.refreshHandle = window.requestAnimationFrame(this.autoRefresh.bind(this));
    },
    'startGame': function () {
        this.clearCanvas();
        this.mode = "running";
        this.snake = new Snake(this.blockSize, new Player());
        var snake = this.snake;
        this.feeder = new SnakeFeeder(this.canvas, this.blockSize, this.foodPellets);
        var adjustDensity = this.adjustDensity.bind(this);
        var that = this;
        Mousetrap.bind('up', function () { snake.up(); });
        Mousetrap.bind('down', function () { snake.down(); });
        Mousetrap.bind('left', function () { snake.left(); });
        Mousetrap.bind('right', function () { snake.right(); });
        Mousetrap.bind('+', function () { adjustDensity(1); });
        Mousetrap.bind('-', function () { adjustDensity(-1); });
        Mousetrap.bind('?', function () { that.startDemo(); })
        Mousetrap.bind('e', function () {
            snake.speed = snake.speed > 0.25 ? snake.speed - 0.25 : 0.25;
            snake.acceleration = snake.acceleration > 0.1 ? snake.acceleration - 0.05 : 0.1;
        });
        Mousetrap.bind('h', function () {
            snake.speed++;
            snake.acceleration = snake.acceleration < 2 ? snake.acceleration + 0.05 : 2;
        });
        this.density = window.devicePixelRatio > 1 && screen.width < 768 ? 20 : 30;
        this.autoRefresh();
    },
    'clearCanvas': function () {
        var ctx = this.context2d;
        var canvas = this.canvas;
        // Store the current transformation matrix
        ctx.save();

        // Use the identity matrix while clearing the canvas
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Restore the transform
        ctx.restore();
    },
    'adjustDensity': function (amount) {
        amount = amount || 1;
        if ((this.density == 0 && amount < 0) || (this.density == 40 && amount > 0)) return;
        this.density += amount;
        console.log("Density adjusted to " + this.density + "..Device is " + window.devicePixelRatio);
        this.resizeGame();
    },
    'startDemo': function () {
        this.mode = "paused";
        this.clearCanvas();
        var context = this.context2d;
        var messages = [
            "~~SNAKE GAME~~c",
            "Arrow keys to move",
            "Space to pause",
            "+/- to change zoom",
            "e to make easier",
            "h to make harder",
            "click to restart",
            "? to show this help"
        ];
        context.font = "20px Verdana";
        this.gradientText();
        _.zip(messages, _.range(messages.length))
            .map(function (a) { return _(a); })
            .forEach(function (m) {
                context.font = (30 - m.last()) + "px Verdana";
                context.fillText(m.first(), (this.canvas.width / 5) - (m.first().length / (m.last() + 1)), 25 + ((35 - m.last()) * m.last()));
            }, this)
//        context.fillText(message, this.canvas.width / 2, 20);
    },
    'pauseGame': function () {
        //HACK: Not right
//        if (this.mode == "paused") this.startGame();
        this.mode = this.mode == "paused"
            ? "running"
            : "paused";
    },
    'resizeGame': function () {
        this.pauseGame();
        var widthToHeight = 4 / 3;
        var newWidth = window.innerWidth - 30;
        var newHeight = window.innerHeight - 30;
        var newWidthToHeight = newWidth / newHeight;

        if (newWidthToHeight > widthToHeight) {
            newWidth = newHeight * widthToHeight;
        } else {
            newHeight = newWidth / widthToHeight;
        }

        var gameCanvas = this.canvas;
        gameCanvas.width = newWidth;
        gameCanvas.height = newHeight;
        this.blockSize = newWidth / this.density;
        this.pauseGame();
    }
})

function GamePainter(context2d, blockSize) {
    this.context2d = context2d;
    this.blockSize = blockSize;
}

_.extend(GamePainter.prototype, {
    'paintBlockAt': function (x, y, color) {
        var context = this.context2d;
        context.fillStyle = color || this.getRandomColor();
        context.fillRect(x, y, this.blockSize, this.blockSize);
        context.strokeStyle = "white";
        context.strokeRect(x, y, this.blockSize, this.blockSize);
    },
    'paintBackground': function (color) {
        var context = this.context2d;
        var canvas = context.canvas;
        context.fillStyle = color || this.getRandomColor(); // "white";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = "black";
        context.strokeRect(0, 0, canvas.width, canvas.height);
    },
    'getRandomColor': function () {
        var randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
        return randomColor;
    },
    'drawGrid': function (color) {
        var context = this.context2d;
        var canvas = context.canvas;
        var bw = canvas.width;
        var bh = canvas.height;
        var p = this.blockSize;
        var cw = bw + (p * 2) + 1;
        var ch = bh + (p * 2) + 1;
        for (var x = 0; x <= bw; x += 40) {
            context.moveTo(0.5 + x + p, p);
            context.lineTo(0.5 + x + p, bh + p);
        }


        for (var x = 0; x <= bh; x += 40) {
            context.moveTo(p, 0.5 + x + p);
            context.lineTo(bw + p, 0.5 + x + p);
        }

        context.strokeStyle = color || this.getRandomColor();
        context.stroke();
    }
})

function Snake(blockSize, player) {
    this.blockSize = blockSize;
    this.length = 5;
    this.speed = blockSize / 10; //0.25;
    this.acceleration = 0.25;
    this.coordinates = [];
    this.currentDirection = "right";
    this.crawled = 0;
    this.player = player || new Player();
    this.deceased = false;

    this.birth();
}

_.extend(Snake.prototype, {
    'birth': function () {
        var blockSize = this.blockSize;
        this.coordinates =
            _.range(this.length - 1, 0, -1)
             .map(function (x) {
                 console.log(x);
                 console.log(x * blockSize);
                 return { "x": x*blockSize, "y": 0 };
             });
        console.log("Snake spawned!");
    },
    'death': function() {
        this.coordinates = [];
        this.deceased = true;
//        alert('death!');
    },
    'consume': function(coordinate) {
        this.coordinates.push(coordinate);
        this.speed += this.acceleration;
        this.player.reward(1);
    },
    'crawl': function () {
        if (this.coordinates.length == 0) return;
        this.crawled += this.speed;
        if (this.crawled < this.blockSize) return;

        this.crawled = 0;
        var tail = _.first(this.coordinates);
        var x = tail.x;
        var y = tail.y;
        switch (this.currentDirection) {
            case "left":
                x -= this.blockSize;
                break;
            case "right":
                x += this.blockSize;
                break;
            case "up":
                y -= this.blockSize;
                break;
            case "down":
                y += this.blockSize;
                break;
            default:

        }
        var newTail = { x: x, y: y };
        this.coordinates = _.union([newTail], _.initial(this.coordinates));
        var selfEating = _.rest(this.coordinates).some(function (c) { return c.x == newTail.x && c.y == newTail.y });
        if (selfEating) this.death();
    },
    'checkAgainstBounds': function (x, y, width, height) {
        if (this.coordinates.length > 0) {
            var blockSize = this.blockSize;
            var death = this.death.bind(this);
            _(this.coordinates).forEach(function (c) {
                if (c.x + blockSize > width || c.y + blockSize > height
                    || c.x < x || c.y < y) {
                    death();
                }
            });
        }
    },
    'left': function () {
        if (this.currentDirection != "right")
            this.currentDirection = "left";
        this.reflect();
    },
    'right': function () {
        if (this.currentDirection != "left")
            this.currentDirection =  "right";
        this.reflect();
    },
    'up': function () {
        if (this.currentDirection != "down")
            this.currentDirection = "up";
        this.reflect();
    },
    'down': function () {
        if (this.currentDirection != "up")
            this.currentDirection = "down";
        this.reflect();
    },
    'reflect': function () {
//        console.log(this.currentDirection);
    }
});

function SnakeFeeder(canvas, blockSize, foodLimit) {
    this.canvas = canvas;
    this.foodLimit = foodLimit || 3;
    this.food = [];
    this.checkFood();
    this.blockSize = blockSize;
}

_.extend(SnakeFeeder.prototype, {
    'checkFood': function (snake) {
        if (snake != undefined) {
            var food = this.food;
            var bs = this.blockSize;
            _.forEach(snake.coordinates, function (ss) {
                _.forEach(food, function (f) {
                    if (ss.x < f.x + bs && ss.x + bs > f.x &&
                        ss.y < f.y + bs && ss.y + bs > f.y)
                        f.consumeInto(snake);
                })
            })
        }
        var maxX = canvas.width;
        var maxY = canvas.height;
        var nonConsumedFood = _.where(this.food, function (f) { return f.eaten == false; });
        this.food = _.range(this.foodLimit - nonConsumedFood.length)
                     .map(function () {
                         return new Food(maxX, maxY);
                     })
                     .concat(nonConsumedFood);
    },
    
})

function Food(maxX, maxY) {
    //Randomize my position on spawning (new)ing up
    this.x = Math.floor(Math.random() * maxX);
    this.y = Math.floor(Math.random() * maxY);
    this.eaten = false;
}

_.extend(Food.prototype, {
    'consumeInto': function (snake) {
        this.eaten = true;
        snake.consume({ x: this.x, y: this.y });
    },
});

function Player(name) {
    this.name = name;
    this.score = 0;
}

_.extend(Player.prototype, {
    'reward': function (scoreIncrease) {
        scoreIncrease || 1;
        this.score += scoreIncrease;
        console.log("Player score increased by " + scoreIncrease);
    }
});

function Game(score) {
    this.score = score;
}

_.extend(Game.prototype, {
    'addHighScore': function (name) {
        //store current score in local storage
    },
    'getHighScores': function () {

    }
});
