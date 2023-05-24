const MAX_PLAYER_SPEED = 150;
const PLAYER_ACCEL = 25;
const BULLET_SPEED = 300;
const FIREBALL_SPEED = 600;
const NUM_ENEMIES = 4;

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
    let enemiesKilled = 0;
    let gameOver = false;
    let enemiesOnScreen = 0;
    let minibossWall = null;
    let bossMode = false;
    //let answer = null;
    let bossText = null;
    let numBossesKilled = 0;
    const COLORS = [color(255, 255, 255), color(127, 127, 127), color(255, 0, 0), color(255, 165, 0), color(255, 255, 0),
        color(0, 255, 0), color(0, 255, 255), color(0, 0, 255), color(180, 0, 180), color(255, 0, 255)];
  
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
            text: "Press the correct number key to shoot!",
            size: 24,
            color: YELLOW,
            font: "sink",
            pos: vec2(200, height() - 100)
          })
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
        if (player.shield_up) {
            if (player.shields <= 0) {
                player.shield_up = false;
            }
            else {
                player.shields -= 0.75;
            }
        }
        else if (player.shields < 100) {
            player.shields += 0.05;
        }
        if (score >= player.points_to_extra_life) {
            player.lives++;
            player.points_to_extra_life += 1000;
        }
    });

    onDraw("player", (p) => {
        if (p.shield_up || p.invulnerable) {
            drawCircle({
                pos: vec2(0, 0),
                radius: 32,
                outline: {width: 2, color: (p.shield_up ? RED : YELLOW)},
                fill: false
            })
        }
    })

    // SHOOT CONTROLS + MECHANICS
    onKeyDown("space", () => {
      if (!bossMode && player.can_shoot) {
        add([
            sprite("bullet"),
            // Starting from center of the ship, add half the width in the direction given by angle
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
        play("laser");
        player.can_shoot = false;
        wait(player.laser_cooldown, () => {
            player.can_shoot = true;
        });
      }
    });

    onUpdate("bullet", (e) => {
        if (e.pos.x > width() || e.pos.x < 0) {
            destroy(e);
        }
    });

    onUpdate("fireball", (e) => {
        if (e.pos.y < 0 || e.pos.y > height() || e.pos.x < 0) {
            destroy(e);
        }
    }); 

    function shootBoss(answer) {
        if (bossMode && player.can_shoot) {
            console.log("Shooting with answer", answer);
            add([
                rect(8, 8),
                // Starting from center of the ship, add half the width in the direction given by angle
                pos(player.pos.add(vec2(player.width/2, 0))),
                origin("center"),
                COLORS[answer],
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
            play("laser");
            player.can_shoot = false;
            wait(player.laser_cooldown, () => {
                player.can_shoot = true;
            });
        }
    }

    onKeyDown("0", () => {
        shootBoss(0);
    })
    onKeyDown("1", () => {
        shootBoss(1);
    })
    onKeyDown("2", () => {
        shootBoss(2);
    })
    onKeyDown("3", () => {
        shootBoss(3);
    })
    onKeyDown("4", () => {
        shootBoss(4);
    })
    onKeyDown("5", () => {
        shootBoss(5);
    })
    onKeyDown("6", () => {
        shootBoss(6);
    })
    onKeyDown("7", () => {
        shootBoss(7);
    })
    onKeyDown("8", () => {
        shootBoss(8);
    })
    onKeyDown("9", () => {
        shootBoss(9);
    })

    function addWall() {
        minibossWall = add([
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
        let coeff = randi(-2, 4);
        if (coeff == 0) {
            coeff = -3;
        }
        let addend = randi(-9, 9);
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
        const solution = randi(0, 10);
        const eqn = generateEquation(solution);
        const speedY = rand(-80, 80);
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
              speed_x: rand(-75, -150),
              speed_y: rand(-30, 30),
              shot_timer: 0
            }
        ]);
        enemiesOnScreen++;
    }
    for (let i = 0; i < NUM_ENEMIES; i++) {
        spawnEnemy(i*125 + 100);
    }

    onUpdate("boss", (b) => {
        b.move_timer += dt()
        if (b.move_timer >= 5) {
            b.speed_y = rand(-80, 80);
            bossText.speed_y = b.speed_y;
            b.move_timer = 0;
        }
    })

    onUpdate("enemy", (e) => {
        if (e.pos.y > height() - 30 || e.pos.y < 30) {
            e.speed_y = -e.speed_y;
            if (bossMode) {
                bossText.speed_y = e.speed_y;
            }
        }
        if (e.pos.x < 0) {
            console.log("Destroying enemy who went off screen")
            destroy(e)
        }
        e.shot_timer += dt()
        if (e.shot_timer >= 2) {
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
                  speed_x: -BULLET_SPEED,
                  speed_y: 0
                }
            ]);
        }
    })

    onCollide("enemy", "enemy", (e1, e2) => {
        console.log("Enemy collision!", e1.pos, e2.pos)
        if (e1.pos.y > e2.pos.y) {
            // e1.pos.y += Math.abs(e1.speed_y);
            // e2.pos.y -= Math.abs(e2.speed_y);
            e1.speed_y = Math.abs(e1.speed_y)
            e2.speed_y = -Math.abs(e2.speed_y)
        }
        else {
            // e1.pos.y -= Math.abs(e1.speed_y);
            // e2.pos.y += Math.abs(e2.speed_y);
            e1.speed_y = -Math.abs(e1.speed_y)
            e2.speed_y = Math.abs(e2.speed_y)
        }
    });

    player.onCollide("killsplayer", (k) => {
        if (!player.invulnerable && (k.ignores_shield || !player.shield_up)) {
            play("explosion2");
            player.lives--;
            destroy(k)
            if (player.lives < 0) {
                destroy(player)
            }
            else {
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
        destroy(b);
        destroy(e);
        enemiesKilled++;
        score += 10;
        play("explosion");
    });

    onCollide("numberbullet", "boss", (bullet, boss) => {
        console.log("Player bullet collision with boss!")
        console.log(bullet.answer);
        console.log(boss.solution);
        destroy(bullet);
        if (bullet.answer === boss.solution) {
            destroy(boss);
            destroy(bossText);
            play("explosion");
            score += 100;
            numBossesKilled++;
            if (numBossesKilled >= 3) {
                for (let i = 0; i < NUM_ENEMIES; i++) {
                    spawnEnemy(i*125 + 100);
                }
                numBossesKilled = 0;
                destroy(minibossWall);
                minibossWall = null;
                bossMode = false;
            }
            else {
                spawnBossShip(rand(100, height() - 200))
            }
        }
        else {
            for (let dy of [-200, 0, 200]) {
                add([
                    sprite("fireball"),
                    // Starting from center of the ship, add half the width in the direction given by angle
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
        destroy(e)
    })

    on("destroy", "normalenemy", (e) => {
        enemiesOnScreen--;
        console.log("Enemies Killed", enemiesKilled);
        if (enemiesKilled < 10) {
            spawnEnemy(rand(100, height() - 100));
        }
        else if (enemiesOnScreen === 0) {
            enemiesKilled = 0;
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