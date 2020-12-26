// useful to have them as global variables
let canvas, ctx, w, h; 
let mousePos;
let requestId;

// an empty array!
let balls = []; 
let badBalls = [];

let player;

let options = {};

let isStarted = false;
let isPaused = false;
let reload = false;
let currentLevel = 1;
let health = 5;
let isLose = false;
let score = 0;

//Local Storage
let savedPlayers = [];

const saveOptionsBtn = document.querySelector('#saveOptionsBtn');
saveOptionsBtn.addEventListener('click', start);

const playBtn = document.querySelector('#playBtn');
playBtn.addEventListener('click', start);

function start(e) {
  e.preventDefault();

  health = 5;
  score = 0
  currentLevel = 1;
  options = getOptions();

  player = {
    x: 10,
    y: 10,
    width: options.playerSize,
    height: options.playerSize,
    color: 'red'
  }

  if (isPaused) {
    document.querySelector('.menuContainer').style.display = 'none';
    document.body.style.backgroundColor = 'white';

    requestId = requestAnimationFrame(mainLoop);
    isPaused = false;
  }
  
  if (!isStarted) {
    isStarted = true;

    init();
  } else if (!reload) {
    reload = true;
    document.querySelector('canvas').style.display = 'block';
    document.querySelector('.mainMenu').style.display = 'none';

    init();
  }
}


function pause(e) {
  if (e.keyCode === 27) {
    if (!isPaused) {
      isPaused = true;
      cancelAnimationFrame(requestId);

      console.log('GAME IS PAUSED...')

      document.querySelector('.menuContainer').style.display = 'block';
      document.querySelector('.background').classList.add('active');
      document.body.style.backgroundColor = 'lightgrey';
    } else {
      isPaused = false;
      requestId = requestAnimationFrame(mainLoop);

      document.querySelector('.background').classList.remove('active');
      document.querySelector('.menuContainer').style.display = 'none';
      document.body.style.backgroundColor = 'white';

      console.log('GAME IS PLAYING...');
    }
  }
}

document.querySelectorAll('.optionsInput').forEach((el) => {
  el.addEventListener('input', () => {
    let span = el.nextElementSibling;
    span.innerHTML = el.value;
  })
});

function getOptions() {
  const optionsForm = document.options;

  const options = {
    playerName: optionsForm.playerName.value,
    ballsCount: +optionsForm.ballsCount.value,
    maxSpeed: +optionsForm.maxSpeed.value,
    minBallSize: +optionsForm.minBallSize.value,
    maxBallSize: +optionsForm.maxBallSize.value,
    playerSize: +optionsForm.playerSize.value
  }

  return options;
}

function init() {
  
  document.addEventListener('keydown', pause);
  document.querySelector('.mainMenu').style.display = 'none';

  // called AFTER the page has been loaded
  canvas = document.querySelector("#myCanvas");
  canvas.style.display = 'block';

  // often useful
  w = canvas.width = document.documentElement.clientWidth; 
  h = canvas.height = document.documentElement.clientHeight;  
  
  // important, we will draw with this object
  ctx = canvas.getContext('2d');

  // create 10 balls
  balls = createBalls(options.ballsCount);
  badBalls = createBalls(5, 'red');
  
  // add a mousemove event listener to the canvas
  canvas.addEventListener('mousemove', mouseMoved);

  // ready to go !
  mainLoop();
};

function mouseMoved(evt) {
  mousePos = getMousePos(canvas, evt);
}

function getMousePos(canvas, evt) {
  // necessary work in the canvas coordinate system
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

function movePlayerWithMouse() {
  if(mousePos !== undefined) {
    player.x = mousePos.x;
    player.y = mousePos.y;
  }
}

function mainLoop() {

  if(reload) {
    reload = false;
    console.log('reload')
    return;
  };

  // ask for a new animation frame
  requestId = requestAnimationFrame(mainLoop);

  // 1 - clear the canvas
  ctx.clearRect(0, 0, w, h);
  
  // draw the ball and the player
  drawFilledRectangle(player);
  drawAllBalls(balls);
  drawAllBalls(badBalls);

  ctx.font='20px Arial';
  ctx.fillText('Your health: ' + health, 20, 100);
  ctx.fillText('Score: ' + score, 20, 120);

  drawNumberOfBallsAlive(balls);

  // animate the ball that is bouncing all over the walls
  moveAllBalls(balls);
  moveAllBalls(badBalls);
  
  movePlayerWithMouse();
}

function lose() {
  isLose = true;
  document.removeEventListener('keydown', pause);

  document.querySelector('canvas').style.display = 'none';
  document.querySelector('.mainMenu').style.display = 'flex';

  options.score = score;
  options.level = currentLevel;

  health = 5;
  score = 0;

  saveToLocalStorage(options);
  alert('You lose!\nYour last score was saved!');
}


// Collisions between rectangle and circle
function circRectsOverlap(x0, y0, w0, h0, cx, cy, r) {
  let testX = cx;
  let testY = cy;
  if (testX < x0) testX = x0;
  if (testX > (x0 + w0)) testX = (x0 + w0);
  if (testY < y0) testY = y0;
  if (testY > (y0+h0)) testY = (y0 + h0);
  return (((cx - testX) * (cx - testX) + (cy - testY) * (cy - testY)) <  r * r);
}

function createBalls(n, ballsColor) {
  // empty array
  const ballArray = [];
  // create n balls
  for(let i=0; i < n; i++) {
    const b = {
      x: w/2,
      y: h/2,
      radius: options.minBallSize + options.maxBallSize * Math.random(), // between 5 and 35
      speedX: -5 + options.maxSpeed * Math.random(), // between -5 and + 5
      speedY: -5 + 10 * Math.random(), // between -5 and + 5
      color: ballsColor || getARandomColor(),
    }
    // add ball b to the array
     ballArray.push(b);
  }
  // returns the array full of randomly created balls
  return ballArray;
}

function getARandomColor() {
  const colors = ['blue', 'cyan', 'purple', 'pink', 'green', 'yellow'];
  // a value between 0 and color.length-1
  // Math.round = rounded value
  // Math.random() a value between 0 and 1
  let colorIndex = Math.round((colors.length-1) * Math.random()); 
  let c = colors[colorIndex];
  
  // return the random color
  return c;
}

function drawNumberOfBallsAlive(balls) {
  ctx.save();
  ctx.font='30px Arial';
  
  if(balls.length === 0) {
    document.removeEventListener('keydown', pause);
    ctx.fillText('YOU WIN!', 20, 30);
    reload = true;
    currentLevel++;
    setTimeout(() => {
      options.ballsCount++;
      init();
    }, 1000)
    
  } else {
    ctx.fillText('Balls to win: ' + balls.length, 20, 30);
    ctx.fillText('Level: ' + currentLevel, innerWidth-150, 30);
  }
  ctx.restore();
}

function drawAllBalls(ballArray) {
  ballArray.forEach(function(b) {
    drawFilledCircle(b);
  });
}

function moveAllBalls(ballArray) {
  // iterate on all balls in array
  ballArray.forEach(function(b, index) {
    // b is the current ball in the array
    b.x += b.speedX;
    b.y += b.speedY;
    testCollisionBallWithWalls(b); 
    testCollisionWithPlayer(b, index);
  });
}

function testCollisionWithPlayer(b, index) {
  if(circRectsOverlap(player.x, player.y,
                     player.width, player.height,
                     b.x, b.y, b.radius)) {
    // we remove the element located at index
    // from the balls array
    // splice: first parameter = starting index
    //         second parameter = number of elements to remove
    if(b.color === 'red') {
      health--;
      badBalls.splice(index, 1);
      if (health === 0) {
        lose();
      }
    } else {
      balls.splice(index, 1);
      score++;
    }
  }
}

function testCollisionBallWithWalls(b) {
  // COLLISION WITH VERTICAL WALLS ?
  if((b.x + b.radius) > w) {
    // the ball hit the right wall
    // change horizontal direction
    b.speedX = -b.speedX;
    
    // put the ball at the collision point
    b.x = w - b.radius;
  } else if((b.x -b.radius) < 0) {
    // the ball hit the left wall
    // change horizontal direction
    b.speedX = -b.speedX;
    
    // put the ball at the collision point
    b.x = b.radius;
  }
 
  // COLLISIONS WTH HORIZONTAL WALLS ?
  // Not in the else as the ball can touch both
  // vertical and horizontal walls in corners
  if((b.y + b.radius) > h) {
    // the ball hit the right wall
    // change horizontal direction
    b.speedY = -b.speedY;
    
    // put the ball at the collision point
    b.y = h - b.radius;
  } else if((b.y -b.radius) < 0) {
    // the ball hit the left wall
    // change horizontal direction
    b.speedY = -b.speedY;
    
    // put the ball at the collision point
    b.Y = b.radius;
  }  
}

function drawFilledRectangle(r) {
  // GOOD practice: save the context, use 2D trasnformations
  ctx.save();
  
  // translate the coordinate system, draw relative to it
  ctx.translate(r.x, r.y);
  
  ctx.fillStyle = r.color;
  // (0, 0) is the top left corner of the monster.
  ctx.fillRect(0, 0, r.width, r.height);
  
  // GOOD practice: restore the context
  ctx.restore();
}

function drawFilledCircle(c) {
  // GOOD practice: save the context, use 2D trasnformations
  ctx.save();
  
  // translate the coordinate system, draw relative to it
  ctx.translate(c.x, c.y);
  
  ctx.fillStyle = c.color;
  // (0, 0) is the top left corner
  ctx.beginPath();
  ctx.arc(0, 0, c.radius, 0, 2*Math.PI);
  ctx.fill();
 
  // GOOD practice: restore the context
  ctx.restore();
}

//Events for rating buttons
document.querySelector('#raitingsBtn').addEventListener('click', (e) => {
  e.preventDefault();

  document.querySelector('.mainMenu').style.display = 'none';
  document.querySelector('.ratingsContainer').style.display = 'flex';
})

document.querySelector('#backBtn').addEventListener('click', (e) => {
  e.preventDefault();

  document.querySelector('.ratingsContainer').style.display = 'none';
  document.querySelector('.mainMenu').style.display = 'flex';
})

//Local Storage
function saveToLocalStorage(player) {
  let players;
  if (localStorage.getItem('players') === null) {
    players = [];
  } else {
    players = JSON.parse(localStorage.getItem('players'));
  }
  players.push(player);
  localStorage.setItem('players', JSON.stringify(players));
}

function showRatingsLS() {
  if (localStorage.getItem('players') === null) {
    savedPlayers = [];
  } else { 
    const playerObjects = JSON.parse(localStorage.getItem('players'));
    playerObjects.forEach((playerObj) => {
      const player = document.createElement('div');
      player.classList.add('player');
      const playerName = document.createElement('h2');
      playerName.innerText = playerObj.playerName === '' ? 'Default' : playerObj.playerName;
      const playerScore = document.createElement('p');
      playerScore.innerText = 'Score: ' + playerObj.score;
      const playerLevel = document.createElement('p');
      playerLevel.innerText = 'Level: ' + playerObj.level;
      console.log(playerLevel.innerText)

      player.appendChild(playerName);
      player.appendChild(playerScore);
      player.appendChild(playerLevel);

      document.querySelector('.ratings').appendChild(player);
    })
    
  }
}

document.querySelectorAll(".optionsInput").forEach((el => {
  let span = el.nextElementSibling;
  span.innerHTML = el.value;
}));

window.onload = showRatingsLS;



