let canvas = document.getElementById("main");
let context = canvas.getContext("2d");


const MAPSIZEX = 1300;
const MAPSIZEY = 900;
const EDGERESTITUTION = 0.9;
const COLLISIONRESTITUTION = 0.9;
const SHOCKMASSTRANSFERRATE = 0.7;
const NUMBEROFOBJECTS = 20;
const DEBRISRATE = 40;
const MINMASSTOLIVE = 100;
const G = 6.6743 * Math.pow(10, -11);

// the rate of the display (10 makes it 1:10)
const DISPLAYRATE = 1;


let oldTimeStamp = 0;
let secondsPassed = 0;

canvas.width = MAPSIZEX;
canvas.height = MAPSIZEY;





class GameObject {
    constructor(context, x, y, vx, vy, radius, density, currentIndex) {
        this.context = context;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.density = density;
        this.currentIndex = currentIndex; // index of this object in the array

        this.isColliding = false;
    }

    
    update(secondsPassed) {
        for (let i = 0; i < gameObjects.length; i++) {
            if (i == this.currentIndex) { continue; } // it's not influanced by itself

            let distanceX = gameObjects[i].x - this.x;
            let distanceY = gameObjects[i].y - this.y;
            let unitVectorX = distanceX < 0 ? -1 : 1;
            let unitVectorY = distanceY < 0 ? -1 : 1;


            let force = G * Math.pow(gameObjects[i].mass, 2) / Math.pow(this.radius, 2);


            this.vx += Math.sqrt((2 * force * Math.abs(distanceX)) / gameObjects[i].mass) * unitVectorX;
            this.vy += Math.sqrt((2 * force * Math.abs(distanceY)) / gameObjects[i].mass) * unitVectorY;
        }

        this.x += this.vx * secondsPassed;
        this.y += this.vy * secondsPassed;
    }
}


class Circle extends GameObject {
    constructor(context, x, y, vx, vy, radius, density, currentIndex) {
        super(context, x, y, vx, vy, radius, density, currentIndex);
    }

    draw() {
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius / DISPLAYRATE, 0, Math.PI * 2);
        this.context.fillStyle = this.isColliding?'#f44336':'#29B6F6';
        this.context.fill();
        this.context.closePath();
    }
    updateMassFromRadius() {
        this.mass = this.density * ((4/3) * Math.PI * Math.pow(this.radius, 3));
    }
    updateRadiusFromMass() {
        this.radius = Math.pow((3 * this.mass) / (4 * Math.PI * this.density), 1/3);
    }
}
class Square extends GameObject {
    constructor(context, x, y, vx, vy, mass, width, height) {
        super(context, x, y, vx, vy, mass);
        this.width = width;
        this.height = height;
    }

    draw() {
        this.context.fillStyle = this.isColliding? '#ff8080' : '#0099b0' ;
        this.context.fillRect(this.x, this.y, this.width, this.height);
    }
}



let gameObjects = [];


function createWorld() {

    gameObjects.push(new Circle(context,
        500,
        350,
        0,
        0,
        63.71,
        5510,
        0,
    ));
    gameObjects[0].updateMassFromRadius();
    gameObjects.push(new Circle(context,
        500,
        650,
        0,
        0,
        17.37,
        33.40,
        1,
    ));
    gameObjects[1].updateMassFromRadius();

    // for (let i = 0; i < NUMBEROFOBJECTS; i++) {
    //     gameObjects.push(new Circle(context,
    //         Math.floor(Math.random() * MAPSIZEX),
    //         Math.floor(Math.random() * MAPSIZEY),
    //         Math.floor(Math.random() * 500) - 250,
    //         Math.floor(Math.random() * 500) - 250,
    //         17.37,
    //         33.40,
    //         i + 1,
    //     ));
    //     gameObjects[i + 1].updateMassFromRadius();
    // }

    return;
}
function clearCanvas() {
    context.beginPath();
    context.fillStyle = "white";
    context.fillRect(0, 0, MAPSIZEX, MAPSIZEY);
    context.closePath();
}
function updateGameObjects() {
    for (let i = 0; i < gameObjects.length; i++) {
        if (gameObjects[i].mass < MINMASSTOLIVE) {
            gameObjects = gameObjects.filter((_, index) => { return index != i }); // remove the object from the array
            i--;
        }
        gameObjects[i].currentIndex = i;
    }
}
function createDebris(large, small) {
    if (small.mass < Math.pow(10, 5)) { // without this if, every object will create debris on shock
        let removedMass = small.mass * SHOCKMASSTRANSFERRATE;
        large.mass += removedMass;
        small.mass -= removedMass;

        small.updateRadiusFromMass();
        large.updateRadiusFromMass();
    }
    let removedMass = small.mass * SHOCKMASSTRANSFERRATE;
    let absorbedMass = removedMass * 0.25;
    let newMassToNewObjects = removedMass * 0.75;

    let massUsed = 0;
    while (massUsed < newMassToNewObjects) {
        let newMassObject = newMassToNewObjects / Math.round((Math.random() * DEBRISRATE) + 1);
        if (massUsed + newMassObject > newMassToNewObjects) {
            // more mass are created than the mass removed from the object
            newMassObject = newMassToNewObjects - massUsed;
        }
        massUsed += newMassObject;

        let index = gameObjects.push(new Circle(context,
            small.x,
            small.y,
            Math.floor(Math.random() * 500) - 250,
            Math.floor(Math.random() * 500) - 250,
            0,
            33.40,
            gameObjects.length,
        ));
        gameObjects[index - 1].mass = newMassObject;
        gameObjects[index - 1].updateRadiusFromMass();
    }


    small.mass -= removedMass;
    large.mass += absorbedMass;
    
    small.updateRadiusFromMass();
    large.updateRadiusFromMass();
}

function detectCollisions() {
    let object1, object2;

    for (let i = 0; i < gameObjects.length; i++) {
        gameObjects[i].isColliding = false;
    }

    let temp_length = gameObjects.length;
    for (let i = 0; i < temp_length; i++)
    {
        object1 = gameObjects[i];
        for (let j = i + 1; j < temp_length; j++)
        {
            object2 = gameObjects[j];
            if (circleIntersect(object1.x, object1.y, object1.radius, object2.x, object2.y, object2.radius)) {
                object1.isColliding = true;
                object2.isColliding = true;
                collisionShock(object1, object2);
            }
        }
    }
}
function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    if (x2 > w1 + x1 || x1 > w2 + x2 || y2 > h1 + y1 || y1 > h2 + y2) {
        return false;
    }
    return true;
}
function circleIntersect(x1, y1, r1, x2, y2, r2) {
    let squareDistance = (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);

    return squareDistance <= ((r1 / DISPLAYRATE + r2 / DISPLAYRATE) * (r1 / DISPLAYRATE + r2 / DISPLAYRATE))
}
function collisionShock(object1, object2) {
    if (object1.mass > object2.mass) {
        createDebris(object1, object2);
    } else if (object2.mass > object1.mass) {
        createDebris(object2, object1);
    }

    let vCollision = {x: object2.x - object1.x, y: object2.y - object1.y};
    let distance = Math.sqrt((object2.x-object1.x)*(object2.x-object1.x) + (object2.y-object1.y)*(object2.y-object1.y));
    let vCollisionNorm = {x: vCollision.x / distance, y: vCollision.y / distance};

    let vRelativeVelocity = {x: object1.vx - object2.vx, y: object1.vy - object2.vy};
    let speed = vRelativeVelocity.x * vCollisionNorm.x + vRelativeVelocity.y * vCollisionNorm.y;
    if (speed < 0) {
        return;
    }
    let impulse = 2 * speed / (object1.mass + object2.mass);
    object1.vx -= (impulse * object2.mass * vCollisionNorm.x) * COLLISIONRESTITUTION;
    object1.vy -= (impulse * object2.mass * vCollisionNorm.y) * COLLISIONRESTITUTION;
    object2.vx += (impulse * object1.mass * vCollisionNorm.x) * COLLISIONRESTITUTION;
    object2.vy += (impulse * object1.mass * vCollisionNorm.y) * COLLISIONRESTITUTION;
}

function detectEdgeCollisions() {
    let object;
    for (let i = 0; i < gameObjects.length; i++)
    {
        object = gameObjects[i];

        if (object.x < object.radius){
            object.vx = Math.abs(object.vx) * EDGERESTITUTION;
            object.x = object.radius;
            object.isColliding = true;
        } else if (object.x > MAPSIZEX - object.radius){
            object.vx = -Math.abs(object.vx) * EDGERESTITUTION;
            object.x = MAPSIZEX - object.radius;
            object.isColliding = true;
        }

        if (object.y < object.radius){
            object.vy = Math.abs(object.vy) * EDGERESTITUTION;
            object.y = object.radius;
            object.isColliding = true;
        } else if (object.y > MAPSIZEY - object.radius){
            object.vy = -Math.abs(object.vy) * EDGERESTITUTION;
            object.y = MAPSIZEY - object.radius;
            object.isColliding = true;
        }
    }
}

function gameLoop(timeStamp) {
    secondsPassed = (timeStamp - oldTimeStamp) / 1000;
    oldTimeStamp = timeStamp;
    

    for (let i = 0; i < gameObjects.length; i++) {
        gameObjects[i].update(secondsPassed);
    }

    detectCollisions();
    // detectEdgeCollisions();

    clearCanvas();
    updateGameObjects(); // update the array gameObject -> object with mass less than a certain number will disapear

    for (let i = 0; i < gameObjects.length; i++) {
        gameObjects[i].draw();
    }

    window.requestAnimationFrame(gameLoop);
}

createWorld();
gameLoop(1);