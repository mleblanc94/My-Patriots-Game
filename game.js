kaboom({
    global: true,
    fullscreen: true,
    scale: 1.8,
    debug: true,
    clearColor: [0, 0, 0, 1],
})

const moveSpeed = 120;
const jumpForce = 435;
const bigJumpForce = 550;
let currentJumpForce = jumpForce;
let isJumping = true;
const fallDeath = 600;

loadSprite('chris-facing-right', 'Hansen-facing-right.png')
loadSprite('chris-facing-left', 'Hansen-facing-left.png')
loadSprite('lorne','Lorne.png')
loadSprite('lorne-afterDefeat', 'lorneArmstrong-afterDefeat.png')
loadSprite('brick', 'brick.png')
loadSprite('block', 'block.png')
loadSprite('coin', 'coin.png')
loadSprite('MikesHard', 'MikesHard.png')
loadSprite('surprise', 'mystery.png')
loadSprite('pipe', 'pipe.png')
loadSprite('unboxed', 'unboxed.png')
loadSprite('jeffSokol', 'jeffSokol.png')
loadSprite('stopper', 'blackScreen.jpg')

scene("game", ({level, score}) => {
    layers(['bg', 'obj', 'ui'], 'obj')

    const maps = [
       [
        '                                                                                      ',
        '                                                                                      ',
        '                  %%                                                                  ',
        '                                                                                      ',
        ' #    $$       =====   t  - t  t    a    -    t                        t   -    t{    ',
        '=======     =========   ====    ==============      ========            ==============',
        '                                                                                      ',
        '                                                                   =                  ',
       ],
       [
        '                                                    *                                  ',
        '                                                   t    a   t                          ',
        '                                                    ========                           ',
        '                                                   =       =                           ',
        '                                                  =        =      -                    ',
        '                %%%%*                        ==  =         =                           ',
        ' #    $$   t -       t        t    -   t                   =   -     t     -       t{  ',
        '=======     =========   ====   ========     ================          =================',
       ],
       [
        '                                                                                      ',
        '                                                                                      ',
        '                                                                                      ',
        '                                                                                      ',
        '                                                                                      ',
        '                                                                                      ',
        ' #                               -                                                 {  ',
        '=======     =========   ====   ======      ================   ====   =================',
       ],
    ]

    const levelCfg = {
        width: 20,
        height: 50,
        '=': [sprite('block'), solid()],
        't': [sprite('stopper'), scale(0.5), 'end'],
        '$': [sprite('coin'), scale(1.5), 'coin'],
        '%': [sprite('surprise'), solid(), 'coin-surprise'],
        '*': [sprite('surprise'), solid(), 'MikesHard-surprise'],
        '}': [sprite('unboxed'), solid()],
        '{': [sprite('pipe'), solid(), scale(1.2), 'pipe'],
        '@': [sprite('MikesHard'), scale(0.08), 'MikesHard'],
        '-': [sprite('lorne'), solid(), scale(0.16), { dir: -1 }, 'dangerous'],
        'y': [sprite('lorne-afterDefeat'), scale(2)],
        'a': [sprite('jeffSokol'), solid(), scale(0.09), { dir: -1 }, 'dangerous']
    }

    const gameLevel = addLevel(maps[level], levelCfg)

    const scoreLabel = add([
        text(score),
        pos(30, 6),
        layer('ui'),
        {
            value: score,
        }
    ])

    add([text('level ' + parseInt(level + 1)), pos(70,6)])

    add([text('Welcome to the Predator Dungeon'), pos(500,60)])

    function big() {
        let timer = 0;
        let isBig = false;
        return {
            update() {
                if (isBig) {
                    timer -=dt()
                    if (timer <= 0) {
                        this.smallify();
                    }
                }
            },
            isBig() {
                return isBig
            },
            smallify() {
                this.scale = vec2(0.1),
                currentJumpForce = jumpForce
                timer = 0,
                isBig = false
            },
            biggify(time) {
                this.scale = vec2(0.2),
                currentJumpForce = bigJumpForce
                timer = time,
                isBig = true
            }
        }
    }

    const player = add([
        sprite('chris-facing-right'),solid(), scale(0.1), 
        pos(30, 0),
        body(),
        big(),
        origin('bot')
    ])

    player.on("headbump", (obj) => {
        if (obj.is('coin-surprise')) {
            gameLevel.spawn('$', obj.gridPos.sub(0.2, 0.5))
            destroy(obj)
            gameLevel.spawn('}', obj.gridPos.sub(0,0))
        }
        if (obj.is('MikesHard-surprise')) {
            gameLevel.spawn('@', obj.gridPos.sub(-0.1, 1.1))
            destroy(obj)
            gameLevel.spawn('}', obj.gridPos.sub(0,0))
        }
    })

    player.collides('MikesHard', (m) => {
        destroy(m)
        player.biggify(6)
    })

    player.collides('coin', (c) => {
        destroy(c)
        scoreLabel.value++
        scoreLabel.text = scoreLabel.value
    })

    const enemySpeed = 40;

    action('dangerous', (d) => {
        d.move(d.dir * enemySpeed, 0)
    })

    collides('dangerous', 'end', (d) => {
        d.dir = -d.dir
    })

    player.collides('dangerous', (d) => {
        if (isJumping) {
            destroy(d)
        } else {
            go('lose', { score: scoreLabel.value })
        }
    })

    player.action(() => {
        camPos(player.pos)
        if (player.pos.y >= fallDeath) {
            go('lose', { score:scoreLabel.value })
        }
    })

    player.collides('pipe', () => {
        keyPress('down', () => {
            go('game', {
                level: (level + 1) % maps.length,
                score:scoreLabel.value
            })
        })
    })

    keyDown('left', () => {
        player.changeSprite('chris-facing-left')
        player.move(-moveSpeed, 0)
    })

    keyDown('right', () => {
        player.changeSprite('chris-facing-right')
        player.move(moveSpeed, 0)
    })

    player.action(() => {
        if(player.grounded()) {
            isJumping = false
        }
    })

    keyPress('space', () => {
        if (player.grounded()) {
            isJumping = true;
            player.jump(currentJumpForce)
        }
    })
})

scene('lose', ({ score }) => {
    add([text(score, 32), origin('center'), pos(width()/2, height()/ 2)])
    console.log(score);
})

start("game", { level: 0, score: 0 })

