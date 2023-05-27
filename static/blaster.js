const MAX_PLAYER_SPEED = 150;
const PLAYER_ACCEL = 25;
const BULLET_SPEED = 300;
const FIREBALL_SPEED = 600;
const MAX_BOSS_SPEED_Y = 80;
const TESTING = false;

kaboom({
    background: [ 0, 0, 0, ]
});

loadSprite("space", "/static/sprites/space.jpg");
loadSprite("ship", "/static/sprites/ship.png");
loadSprite("bullet", "/static/sprites/bullet.png");
loadSprite("enemy", "/static/sprites/enemy1.png");
loadSprite("command-ship", "/static/sprites/enemy-command-ship.png");
loadSprite("fireball", "/static/sprites/clipart261222.png");

loadSound("laser", "/static/sounds/laser.wav");
loadSound("explosion", "/static/sounds/explosion.wav");
loadSound("explosion2", "/static/sounds/implosion.wav");

scene("main", ()=> {

    let score = 0;
    let level = 1;
    let levelCounter = 0;
    let numEnemiesKilled = 0;
    let gameOver = false;
    let numEnemiesOnScreen = 0;
    let bossWall = null;
    let bossMode = false;
    let answer = null;
    let neg_answer = false;
    let bossText = null;
    let numBossesKilled = 0;

    const BULLET_COLORS = {
        0: [255, 255, 255], // white
        1: [180, 180, 180], // light gray
        "-1": [80, 80, 80], // dark gray
        2: [255, 0, 0], // red
        "-2": [153, 0, 0], // dark red
        3: [255, 165, 0],  // orange
        "-3": [165, 83, 0],  // brown
        4: [255, 255, 0], // yellow
        "-4": [180, 127, 0], // gold
        5: [0, 255, 0],  // lime green
        "-5": [0, 127, 0],  // dark green
        6: [0, 255, 255], // cyan
        "-6": [0, 128, 128],  // teal
        7: [30, 30, 255],  // blue
        "-7": [20, 20, 180], // dark blue
        8: [220, 0, 255], // light purple
        "-8": [128, 0, 128], // dark purple
        9: [255, 105, 180], // pink
        "-9": [180, 0, 100] // dark pink
    };
  
    onDraw(() => {
      drawText({
        text: "Score: " + score,
        size: 24,
        font: "sink",
        pos: vec2(8, 40)
      })
  
      drawText({
        text: "Lives: ",
        size: 24,
        font: "sink",
        pos: vec2(8),
      });

      drawText({
        text: "Level: " + level,
        size: 24,
        font: "sink",
        pos: vec2(250, 5),
      });

      drawText({
        text: "Shields: " + Math.round(player.shields),
        size: 24,
        font: "sink",
        pos: vec2(250, 40)
      })

      for (let x = 128; x < 128 + (32 * player.lives); x += 32) {
        drawSprite({
          sprite: "ship",
          pos: vec2(x, 12),
          angle: -90,
          origin: "center",
          scale: 0.5
        });
      }

      if (bossMode) {
        drawText({
            text: "Type the correct answer to select ammo.",
            size: 20,
            color: YELLOW,
            font: "sink",
            pos: vec2(200, height() - 150)
          })
        
        // Positive number ammo selection
        for (let i = 0; i < 10; i++) {
            drawText({
                text: i,
                size: 16,
                font: "sink",
                pos: vec2(200 + i * 20, height() - 100)
            })
            drawRect({
                width: 8,
                height: 8,
                pos: vec2(202 + i * 20, height() - 75),
                color: Color.fromArray(BULLET_COLORS[i]),
            })
        }

        // Negative number ammo selection
        if (LEVEL_INFO[level]['minSolution'] < 0) {
            for (let i = 1; i < 10; i++) {
                drawText({
                    text: -i,
                    size: 16,
                    font: "sink",
                    pos: vec2(380 + i * 30, height() - 100)
                })
                drawRect({
                    width: 8,
                    height: 8,
                    pos: vec2(390 + i * 30, height() - 75),
                    color: Color.fromArray(BULLET_COLORS[-i]),
                })
            }
        }

        // Box to show currently selected ammo
        if (answer !== null) {
            drawRect({
                width: answer < 0 ? 30 : 20,
                height: 40,
                pos: vec2(answer < 0 ? 380 + -answer * 30 : 198 + answer * 20, height() - 105),
                outline: { color: RED, width: 2 },
                fill: false
            })
        }
      }
    });

    // PLAYER SHIP
    const player = add([
        sprite("ship"),
        pos(160,120),
        rotate(0),
        origin("center"),
        solid(),
        area(),
        "player",
        "mobile",
        "ship",
        {
          speed_x: 0,
          speed_y: 0,
          lives: 3,
          can_shoot: true,
          invulnerable: false,
          invulnerability_time: 3,
          laser_cooldown: 0.4,
          shields: 100,
          shield_up: false,
          points_to_extra_life: 1000
        }
      ]);
    
    // MOVEMENT CONTROLS
    onKeyDown("left", () => {
        player.speed_x = Math.max(-MAX_PLAYER_SPEED, player.speed_x - PLAYER_ACCEL);
    });
    
    onKeyDown("right", () => {
        player.speed_x = Math.min(MAX_PLAYER_SPEED, player.speed_x + PLAYER_ACCEL);
    });

    onKeyDown("up", () => {
        player.speed_y = Math.max(-MAX_PLAYER_SPEED, player.speed_y - PLAYER_ACCEL);
    });

    onKeyDown("down", () => {
        player.speed_y = Math.min(MAX_PLAYER_SPEED, player.speed_y + PLAYER_ACCEL);
    });

    // SHIELDS
    onKeyDown("s", () => {
        player.shield_up = true;
    });

    onKeyRelease("s", () => {
        player.shield_up = false;
    })

    onUpdate("player", (e) => {
        // Keep player from going off screen
        if (e.pos.x > width() - 30) {
            e.pos.x = width() - 30;
        }
        if (e.pos.x < 30) {
          e.pos.x = 30;
        }
        if (e.pos.y > height() - 30) {
            e.pos.y = height() - 30;
        }
        if (e.pos.y < 30) {
            e.pos.y = 30;
        }

        // Shield activation and regeneration
        if (player.shield_up) {
            if (player.shields <= 0) {
                player.shield_up = false;
            }
            else {
                player.shields -= 0.5;
            }
        }
        else if (player.shields < 100) {
            player.shields += 0.05;
        }

        // Extra life
        if (score >= player.points_to_extra_life) {
            player.lives++;
            player.points_to_extra_life += 1000;
        }
    });

    onDraw("player", (p) => {
        // Draw shield
        if (p.shield_up || p.invulnerable) {
            drawCircle({
                pos: vec2(0, 0),
                radius: 32,
                outline: {width: 2, color: (p.shield_up ? RED : YELLOW)},
                fill: false
            })
        }
    })

    // PLAYER SHOOT CONTROLS + MECHANICS
    onKeyDown("space", () => {
      if (player.can_shoot) {
        if (bossMode && answer !== null) {
            // Shoot boss!
            console.log("Answer is", answer);
            add([
                rect(8, 8),
                // Starting from center of the ship, add half the width in the direction given by angle
                pos(player.pos.add(vec2(player.width/2, 0))),
                origin("center"),
                color(Color.fromArray(BULLET_COLORS[answer])),
                area(),
                "bullet",
                "numberbullet",
                "mobile",
                {
                    speed_x: BULLET_SPEED,
                    speed_y: 0,
                    answer: answer
                }
            ]);
        }
        else if (!bossMode) {
            // shoot regular enemy
            add([
                sprite("bullet"),
                pos(player.pos.add(vec2(player.width/2, 0))),
                origin("center"),
                area(),
                "bullet",
                "playerbullet",
                "mobile",
                {
                    speed_x: BULLET_SPEED,
                    speed_y: 0
                }
            ]);
        }
        else {
            return; // if boss mode and answer not selected, do nothing
        }
        play("laser");
        player.can_shoot = false;
        wait(player.laser_cooldown, () => {
            player.can_shoot = true;
        });
      }
    });

    onUpdate("bullet", (e) => {
        if (e.pos.x > width() || e.pos.x < 0) {
            destroy(e);  // Destroy bullet that goes off screen
        }
    });

    onUpdate("fireball", (e) => {
        if (e.pos.y < 0 || e.pos.y > height() || e.pos.x < 0) {
            destroy(e); // Destroy fireball that goes off screen
        }
    }); 

    onKeyDown("0", () => {
        answer = 0; 
    })
    onKeyDown("1", () => {
        answer = neg_answer ? -1 : 1;
    })
    onKeyDown("2", () => {
        answer = neg_answer ? -2 : 2;
    })
    onKeyDown("3", () => {
        answer = neg_answer ? -3 : 3;
    })
    onKeyDown("4", () => {
        answer = neg_answer ? -4 : 4;
    })
    onKeyDown("5", () => {
        answer = neg_answer ? -5 : 5;
    })
    onKeyDown("6", () => {
        answer = neg_answer ? -6 : 6;
    })
    onKeyDown("7", () => {
        answer = neg_answer ? -7 : 7;
    })
    onKeyDown("8", () => {
        answer = neg_answer ? -8 : 8;
    })
    onKeyDown("9", () => {
        answer = neg_answer ? -9 : 9;
    })
    onKeyDown("-", () => {
        // Set neg_answer = true only if level includes negative solutions
        if (LEVEL_INFO[level]['minSolution'] < 0) {
            neg_answer = true;
            wait(1, () => {
                neg_answer = false;
            });
        }
    })

    // Add wall for player to hide behind while solving equation.
    function addWall() {
        bossWall = add([
            rect(20, 100),
            pos(100, height() - 50),
            origin("center"),
            area(),
            solid(),
            color(200, 200, 200),
            "wall"
        ]);
    }

    // BOSS SHIPS

    function generateEquation(solution) {
        const maxCoeff = LEVEL_INFO[level]['maxCoeff'];
        const minCoeff = LEVEL_INFO[level]['minCoeff'];
        let coeff = randi(minCoeff, maxCoeff + 1); // coefficient of X
        while (coeff == 0) {
            coeff = randi(minCoeff, maxCoeff + 1);
        }
        let addend = randi(-9, 9); // Second term on the side with the X
        if (addend == 0) {
            addend = 9;
        }
        const otherSide = coeff * solution + addend;
        let eqn = coeff < 0 ? "-" : "";
        if (Math.abs(coeff) !== 1) {
            eqn += Math.abs(coeff);
        }
        eqn = eqn + "x" + (addend < 0 ? "-" : "+") + Math.abs(addend) + "=" + otherSide;
        return eqn;
    }


    function spawnBossShip(yPos) {
        // Choose solution and generate equation
        const maxSolution = LEVEL_INFO[level]['maxSolution'];
        const minSolution = LEVEL_INFO[level]['minSolution'];
        console.log("Max solution", maxSolution, "min solution", minSolution)
        const solution = randi(minSolution, maxSolution + 1);
        console.log("Solution", solution);
        const eqn = generateEquation(solution);
        console.log(eqn);
        const speedY = rand(-MAX_BOSS_SPEED_Y, MAX_BOSS_SPEED_Y);  // random vertical speed (bosses don't move horizontally)
        add([
            sprite("command-ship"),
            pos(width() - 200, yPos),
            origin("center"),
            area(),
            solid(),
            "enemy",
            "boss",
            "killsplayer",
            "mobile",
            {
              shot_timer: 0,
              solution: solution,
              speed_x: 0,
              speed_y: speedY,
              move_timer: 0
            }
        ]);
        // Text for the equation, moves with the boss ship
        bossText = add([
            text(eqn, {size: 24}),
            pos(width() - 200, yPos),
            origin("center"),
            "mobile",
            {
              speed_x: 0,
              speed_y: speedY,
            }
        ]);
    }

    // ENEMIES

    function spawnEnemy(yPos) {
        const minSpeed = LEVEL_INFO[level]['minEnemySpeed'];
        const maxSpeed = LEVEL_INFO[level]['maxEnemySpeed'];
        add([
            sprite("enemy"),
            pos(width() - 100, yPos),
            origin("center"),
            area(),
            solid(),
            "enemy",
            "normalenemy",
            "killsplayer",
            "mobile",
            {
              speed_x: rand(-minSpeed, -maxSpeed),
              speed_y: rand(-30, 30),
              shot_timer: 0
            }
        ]);
        numEnemiesOnScreen++;
    }
    for (let i = 0; i < LEVEL_INFO[level]['numEnemies']; i++) {
        spawnEnemy(i*125 + 100);
    }

    // Change boss y direction every 5 seconds.
    onUpdate("boss", (b) => {
        b.move_timer += dt()
        if (b.move_timer >= 5) {
            b.speed_y = rand(-MAX_BOSS_SPEED_Y, MAX_BOSS_SPEED_Y);
            bossText.speed_y = b.speed_y;
            b.move_timer = 0;
        }
    })

    onUpdate("enemy", (e) => {
        if (e.pos.y > height() - 30 || e.pos.y < 30) {
            // Stop enemy from going off screen vertically
            e.speed_y = -e.speed_y;
            if (bossMode) {
                bossText.speed_y = e.speed_y; // boss text must move with boss
            }
        }
        if (e.pos.x < 0) {
            console.log("Destroying enemy who went off screen")
            destroy(e)
        }
        // Enemies shoot every 2 seconds (1 second for later levels)
        e.shot_timer += dt()
        if (e.shot_timer >= LEVEL_INFO[level]['enemyReload']) {
            e.shot_timer = 0;
            add([
                rect(8, 8),
                pos(e.pos.x, e.pos.y),
                origin("center"),
                area(),
                "bullet",
                "enemybullet",
                "killsplayer",
                "mobile",
                {
                  speed_x: -LEVEL_INFO[level]['enemyBulletSpeed'],
                  speed_y: 0
                }
            ]);
        }
    })

    // If two enemies collide, have them both reverse direction
    onCollide("enemy", "enemy", (e1, e2) => {
        console.log("Enemy collision!", e1.pos, e2.pos)
        if (e1.pos.y > e2.pos.y) {
            e1.speed_y = Math.abs(e1.speed_y)
            e2.speed_y = -Math.abs(e2.speed_y)
        }
        else {
            e1.speed_y = -Math.abs(e1.speed_y)
            e2.speed_y = Math.abs(e2.speed_y)
        }
    });

    player.onCollide("killsplayer", (k) => {
        // Player death. Fireballs ignore shields.
        if (!player.invulnerable && (k.ignores_shield || !player.shield_up)) {
            play("explosion2");
            player.lives--;
            player.shields = 100;
            destroy(k)
            if (player.lives < 0) {
                destroy(player) // game over
            }
            else {
                // respawn player, make player invulnerable for 3 sec
                player.invulnerable = true;
                player.pos.x = 160;
                player.pos.y = 120;
                player.speed_x = 0;
                player.speed_y = 0;
                wait(player.invulnerability_time, () => {
                    player.invulnerable = false;
                });
            }
        }
    });

    onCollide("playerbullet", "normalenemy", (b, e) => {
        // Destroy regular enemy ships
        destroy(b);
        destroy(e);
        numEnemiesKilled++;
        score += 10;
        play("explosion");
    });

    onCollide("numberbullet", "boss", (bullet, boss) => {
        console.log("Player bullet collision with boss!")
        console.log(bullet.answer);
        console.log(boss.solution);
        destroy(bullet);
        if (bullet.answer === boss.solution) {
            // Boss killed!
            answer = null;
            destroy(boss);
            destroy(bossText);
            play("explosion");
            score += 100;
            numBossesKilled++;

            if (numBossesKilled >= LEVEL_INFO[level]['bossesToKill']) {
                // All bosses killed, exit boss mode, spawn new regular enemies, level up
                for (let i = 0; i < LEVEL_INFO[level]['numEnemies']; i++) {
                    spawnEnemy(i*125 + 100);
                }
                numBossesKilled = 0;
                destroy(bossWall);
                bossWall = null;
                bossMode = false;
                if (TESTING || levelCounter > 0) {
                    levelCounter = 0;
                    if (level < 10) {
                        level++;
                    }
                }
                else {
                    levelCounter++;
                }
            }
            else {
                spawnBossShip(rand(100, height() - 200))
            }
        }
        else {
            // Wrong answer. Shoot 3 fireballs
            for (let dy of [-200, 0, 200]) {
                add([
                    sprite("fireball"),
                    pos(boss.pos.add(vec2(-boss.width/2, 0))),
                    origin("center"),
                    area(),
                    "fireball",
                    "mobile",
                    "killsplayer",
                    {
                        speed_x: -FIREBALL_SPEED,
                        speed_y: dy,
                        ignores_shield: true
                    }
                ]);
            }
        }
    });

    onCollide("enemybullet", "wall", (e, w) => {
        destroy(e); // wall blocks enemy bullets 
    })

    on("destroy", "normalenemy", (e) => {
        numEnemiesOnScreen--;
        console.log("Enemies Killed", numEnemiesKilled);
        if (numEnemiesKilled < LEVEL_INFO[level]['enemiesToKill']) {
            spawnEnemy(rand(100, height() - 100));
        }
        else if (numEnemiesOnScreen === 0) {
            // Boss mode!
            console.log("Boss Mode");
            numEnemiesKilled = 0;
            addWall();
            spawnBossShip(rand(100, height() - 200));
            bossMode = true;
        }
    });

    // Anything that moves gets the "mobile" label and this function is called to update it
    onUpdate("mobile", (e) => {
        e.move(vec2(e.speed_x, e.speed_y));
    });

    // GAME OVER MECHANICS
    player.on("destroy", () => {
        add([
        text(`GAME OVER\n\nScore: ${score}\n\n[R]estart?\n\n[Q]uit?`, { size: 20}),
        pos(width()/2, height()/2),
        ]);
        gameOver = true;
    });

    onKeyPress("r", () => {
        if (gameOver) {
            go("main");
        }
    });

    onKeyPress("q", () => {
        if (gameOver) {
            window.location.href="/";
        }
    });

}); 
// END OF MAIN SCENE

scene("instructions", () => {
    let pointer = false;
    add([
        text("Press Space to shoot.\n\nPress S to activate shield.", {size: 32}),
        pos(width()/2, height()/2 - 50),
        origin("center"),
    ]);
    let play = add([
        rect(150, 100),
        pos(width()/2, height()/2 + 100),
        text(" PLAY ", {size: 32, transform: () => ({color: BLACK})}),
        origin("center"),
        area(),
        "button"
    ]);
    onHover("button", (c) => {
        pointer = true;
    })
    play.onClick(() => go("main"));
    onDraw(() => {
        if (pointer) {
            cursor("pointer");
        }
        else {
            cursor("default");
        }
    });
})

go("instructions");