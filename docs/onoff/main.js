title = "on/off";

description = 
`copy top row.\n
[key] turn green
`;

characters = [
``
];

const G = {
    WIDTH: 100,
    HEIGHT: 100
}

options = {
    viewSize: {x: G.WIDTH, y: G.HEIGHT}
};

/**
 * @typedef {{
 * pos: Vector,
 * size: number,
 * state: number,
 * visible: boolean
 * }} TTile
 */

/**
 * @type { TTile [] }
 */
let tTiles;

/**
 * @typedef {{
 * pos: Vector,
 * size: number
 * state: number,
 * visible: boolean
 * }} BTile
 */

/**
 * @type { BTile [] }
 */
let bTiles;

/**
 * @typedef {{
 * tile: number
 * }} Cursor
 */

/**
 * @type { Cursor }
 */
let cursor;

let level;
let speed;
let lives;
let tilesShown;

let bTurn;
let bTicks;
let bInput;
let tTurn;
let tTicks;
let tChosen;
let currTile;


function update() {
    if (!ticks) {
        // start at level 1
        level = 1;
        lives = 3;
        tilesShown = 0;
        speed = 50;
        tTicks = 0;
        tTurn = true;
        bTicks = 0;
        bTurn = false;
        bInput = false;
        tChosen = false;
        currTile = -1;

        // top tiles
        tTiles = times (10, (i) => {
            return {
                pos: vec((i - 1) * 8 + 22, G.HEIGHT / 2 - 10),
                size: 6,
                state: -1,
                visible: false
            };
        });

        // bottom tiles
        bTiles = times (10, (i) => {
            return {
                pos: vec((i - 1) * 8 + 22, G.HEIGHT / 2 + 10),
                size: 6,
                state: -1,
                visible: false
            };
        });

        cursor = {
            tile: -1
        };   
    };

    
    // choose all top tiles
    if (!tChosen) {
        chooseTiles();
        tChosen = true;
    } 
    
    if (tTurn) {
        tTicks++;
        // one at a time, reveal all tiles shown so far, plus 2 more
        if (tilesShown < 10 && tTicks > speed) {
            // reveal all tiles chosen so far, plus two
            if (currTile < tilesShown + 1) {
                currTile++;                                 
                tTiles[currTile].visible = true;
                if (tTiles[currTile].state == 1) {
                    play("coin");
                }
            } else {                                        // hide all tiles
                tilesShown += 2;  
                tTiles.forEach((t) => {
                    if (t.visible) t.visible = false;
                });
                switchTurn();
            }
            tTicks = 0;    
        }
    } else if (bTurn) {
        bTicks++;
        if (bTicks > speed) {                                               
            if (currTile < tilesShown - 1) {                                // move cursor through tiles, one at a time
                if (currTile > -1 && !bTiles[currTile].visible) {
                    bTiles[currTile].state = 0;
                    checkInput();
                    bTiles[currTile].visible = true;
                }
                currTile++;
                bInput = true;
                cursor.tile = currTile;
            } else if (currTile == tilesShown - 1) {                        // hide cursor and check last tile
                if (currTile > -1 && !bTiles[currTile].visible) {
                    bTiles[currTile].state = 0;
                    checkInput();
                    bTiles[currTile].visible = true;
                }
                cursor.tile = -1;
                currTile++;
            } else {                                                        // hide all tiles
                bTiles.forEach((t) => {
                    if (t.visible) t.visible = false;
                });
                if (tilesShown == 10) {
                    nextLevel();
                }
                switchTurn();
            }
            bTicks = 0;
        }
        if (bInput && input.isJustPressed) {
            console.log("pressed");
            bTiles[currTile].state = 1;
            checkInput();
            bTiles[currTile].visible = true;
            bInput = false;
        }
    } 

    // draw lives && level
    color("black");
    text(`LIVES: ${lives}`, G.WIDTH/2, G.HEIGHT - 15);  
    text(`LEVEL: ${level}`, G.WIDTH/2, 15);    

    // draw top tiles
    tTiles.forEach((t) => {
        if (t.visible) {
            switch (t.state) {
                case 0: color("black");
                break;
                case 1: color("light_green");
                break;
            }
        } else {
            color("light_black");
        }
        box(t.pos, t.size, t.size);
    });
    
    // draw bottom tiles
    bTiles.forEach((t) => {
        if (t.visible) {
            switch (t.state) {
                case 0: color("black");
                break;
                case 1: color("light_green");
                break;
                case 2: color("light_red");
            }
        } else {
            color("light_black");
        }
        box(t.pos, t.size, t.size);
    });

    // draw cursor
    if (cursor.tile > -1) {
        color("light_yellow");
        box(bTiles[cursor.tile].pos.x, G.HEIGHT / 2 + 16, 6, 2);
    }

    // end game when lives run out
    if (lives == 0) {
        if (!tTiles[currTile].visible) {
            tTiles[currTile].visible = true;
        }
        end();
    }

    // determine state of each top tile
    function chooseTiles() {
        // 50/50 chance of tile being on or off
        tTiles.forEach((t, i) => {
            // if last 2 tiles were the same state, make new tile different
            if (i > 1 && tTiles[i - 1].state == tTiles[i - 2].state) {
                t.state = tTiles[i - 1].state == 0 ? 1 : 0;
            // one of first two tiles must be on
            } else if (i == 1 && tTiles[0].state == 0) {
                t.state = 1;
            // otherwise, 50/50 chance of tile being on/off
            } else {
                t.state = rnds(1) < 0 ? 0 : 1;
            }
        });
    }
    
    // switch between top and bottom tiles' turns
    function switchTurn() {
        tTurn = !tTurn;
        bTurn = !bTurn;
        currTile = -1;   
    }

    // check whether bottom tile matches top
    function checkInput() {
        if (tTiles[currTile].state != bTiles[currTile].state) {    // if incorrect, lose a life
            bTiles[currTile].state = 2;
            play("hit");
            lives--;
        } else {                                                   // if correct, gain points
            score += 10;
            if (bTiles[currTile].state == 1) {
                play("coin");
            }
        }
    }

    // increment level
    function nextLevel() {
        level++;
        speed -= 5;
        tilesShown = 0;
        tChosen = false;
    }
}
