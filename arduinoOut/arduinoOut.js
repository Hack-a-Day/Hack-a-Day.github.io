/*
	Arduino Out:
		BreakOut type game using Arduino as bricks
		and Hackaday logo as the ball
	Developed by Mike Szczys, March 2014


	GNU All-Permissive License
	(http://www.gnu.org/prep/maintain/html_node/License-Notices-for-Other-Files.html)

	Copying and distribution of this file, with or without modification,
	are permitted in any medium without royalty provided the copyright
	notice and this notice are preserved.  This file is offered as-is,
	without any warranty.	
*/

window.onload = function() {

    //########### Constants ############
    var GAME_X = 640; 
    var GAME_Y = 480;
    var BALL_X = 20;
    var BALL_Y = 20;
    var OB_Y_OFFSET = 75;
    var PADDLE_X = 90;
    var PADDLE_Y = 12;
	//######### End Constants ##########

	//######## Global Variables ########
    var bod = {};
    var bgc;

    //Capture game events:
    var intervalID;
    var gameRunning = false;
    
    //Playing surface
    var canvasColor;
    var cursorColor = "#0000FF";
    var ctx;
    
    //Setup the ball
    var wrencher = new Image();            
    wrencher.src = "jolly-wrencher.png";

    //Ball locations
    var skullX;
    var skullY;

    //Paddle locations
    var pLocX;
    var pLocY;

    //How fast the ball is moving
    var speedX;
    var speedY;

    //Obstacles 
        // image source:
        // http://commons.wikimedia.org/wiki/File:Arduino_Diecimila.jpg
    var ard = new Image();
    ard.src = "arduinoDiecimila.png"
	var obSpace;
    var obWidth;
    var obHeight;
    var obstacles;

	//Levels
    var curLevel = 0;
    var levels = new Array();
	
	function setupLevels() {
		levels[0] = new level(3,6,100,70,5,"black");
		levels[1] = new level(3,8,75,52,4,"grey");
		levels[2] = new level(5,12,50,35,3,"silver");
		levels[3] = new level(7,12,50,35,3,"teal");
	}



    function arduinoOutFillLevel(lv)
    {
        obstacles = new Array();
        for (var row=0; row<levels[lv].rows; row++)
        {
            for (var col=0; col<levels[lv].columns; col++)
            {
                obstacles[(row*levels[lv].columns) + col] = 
                    new brick(
                        //left-offset    + Object width + Middle offsets    
                        obSpace + (obWidth * col) + (col * obSpace),
                        //top-offset+ Object height + Middle offsets
                        OB_Y_OFFSET + (obHeight * row) + (row * obSpace)
                        );
                        
            }
        }
    }

    //########### Onload Setup ############

    //Mouse wheel trap based on this example
    //http://blogs.sitepointstatic.com/examples/tech/mouse-wheel/index.html
	bod.e = document;
    if (bod.e.addEventListener) {
        bod.e.addEventListener("mousewheel", MouseWheelHandler, false);
        bod.e.addEventListener("DOMMouseScroll", MouseWheelHandler, false);
    }
    else bod.e.attachEvent("onmousewheel", MouseWheelHandler);

    //Mouse Events
    function MouseWheelHandler(e) {
        if (gameRunning) {
            // cross-browser wheel delta
            var e = window.event || e;
            var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
            movePaddle(delta);
            e.preventDefault();    //Prevent windows from scrolling
        }       
        return false;
    }

    //Keyboard events
    window.onkeydown = function(e) {
        if (gameRunning) {
            //Hack: Left is 37, right is 39
            //subtract 38 to get -1 or 1
            //multiply by a negative to
            //correct direction and applify the effect
            if (e.keyCode == 37 || e.keyCode == 39) { movePaddle((e.keyCode-38)*-2); }
        }
        else
        {
            if (e.keyCode == 32) { runGame(); }
        }
        e.preventDefault();
    }

    //Initialize the game
	setupLevels();
    init();

	//Show title slide and instructions
	var title = new Image();
	title.src = "arduino-out-title.png";
	title.onload=function() { ctx.drawImage(title,0,0,640,306); }
    ctx.fillStyle = "blue";
    ctx.font = "32px Arial";
    ctx.fillText("Space to start",200,340);
    ctx.fillText("Scroll wheel (or arrows) to move",46,400);

    function runGame() {
        gameRunning = true;
		curLevel = 0
		setupLevels();
        init();
        intervalID = setInterval(game,10); //Start the game
    }

    function init()
    {
        var c = document.getElementById("arduinoOut");
        c.width = GAME_X;
        c.height = GAME_Y;
        c.style.background = levels[curLevel].bgcolor;
        c.style.align="center";
        ctx = c.getContext("2d");

        //Setup Ball
        skullX = 5;
        skullY = 400;
        speedX = 2;
        speedY = -2;

        //Setup paddle
        pLocX = 220;
        pLocY = GAME_Y-PADDLE_Y-5;
        ctx.fillStyle=cursorColor;
        ctx.fillRect(pLocX,pLocY,PADDLE_X,PADDLE_Y);

        //Setup the obstacles
        obWidth = levels[curLevel].width;
        obHeight = levels[curLevel].height;
        obSpace = levels[curLevel].space;
        arduinoOutFillLevel(curLevel);
    
        ctx.fillStyle=cursorColor;
        for (var i=0; i<obstacles.length; i++)
        {
            ctx.drawImage(ard,obstacles[i].x,obstacles[i].y,obWidth,obHeight);
        }
    }

    function game()
    {
        //Clear ball for moving
        ctx.clearRect(skullX,skullY,BALL_X,BALL_Y);

        //Switch directions?
        collision();

        skullX += speedX;
        skullY += speedY;

        ctx.drawImage(wrencher,skullX,skullY,BALL_X,BALL_Y);

        
    }

    function collision()
    {
        var collisionFlagX = false;
        var collisionFlagY = false;

        //Check boundaries
        if ((skullX+BALL_X >= GAME_X) || (skullX<=0)) { collisionFlagX = true; }
        if (skullY<=0) {  collisionFlagY = true; }
        if (skullY > GAME_Y)
        {
                ctx.font = "72px Arial";
                ctx.fillStyle = "red";
                ctx.fillText("You Lose",162,260);
                ctx.font = "32px Arial";
                ctx.fillText("Hordes of Arduino",180,345);
                ctx.fillText("were too much for you",145,390);
				gameRunning = false;
                clearInterval(intervalID);
				return
        }

        //Check paddle reflections
        if (skullY+BALL_Y >= pLocY) {
            if ((pLocX <= skullX && skullX<=pLocX+PADDLE_X)
                ||
                (pLocX <= skullX+BALL_X && skullX+BALL_X<=pLocX+PADDLE_X))
                {
                    //Redraw cursor because overlap ball erases portions of it
                    ctx.fillStyle=cursorColor;
                    ctx.fillRect(pLocX,pLocY,PADDLE_X,PADDLE_Y);
                    collisionFlagY = true;
                    
                    //Adjust speed
                    var ballMed = skullX + (BALL_X/2);
                    var padLeft = pLocX + (PADDLE_X/3);
                    var padRight = pLocX + ((PADDLE_X/3)*2);
                    if (ballMed < padLeft) { changeSpeed(-1); }
                    else if (ballMed > padRight) { changeSpeed(1); }
                }
                
        }

        //Check obstacles
        for (var i=0; i<obstacles.length; i++)
        {
            if (obstacles[i].visible) {
                //Feels REALLY convoluted but works:
                if (((obstacles[i].y <= skullY && skullY <= obstacles[i].y+obHeight)
                    ||
                    (obstacles[i].y <= skullY+BALL_Y && skullY+BALL_Y <= obstacles[i].y+obHeight))
                    &&
                    ((obstacles[i].x <= skullX && skullX <= obstacles[i].x+obWidth)
                    ||
                    (obstacles[i].x <= skullX+BALL_X && skullX+BALL_X <= obstacles[i].x+obWidth)))
                {
                    if (speedX < 0)    //Hit left side of obstacle?
                    {
                        if (skullX-speedX > obstacles[i].x+obWidth)
                        {
                        obstacles[i].visible = false;
                        ctx.clearRect(obstacles[i].x,obstacles[i].y,obWidth,obHeight);
                        collisionFlagX = true;
                        }
                    }
                    if (speedX > 0) //Hit right side of obstacle?
                    {
                        if (skullX+BALL_X-speedX < obstacles[i].x)
                        {
                        obstacles[i].visible = false;
                        ctx.clearRect(obstacles[i].x,obstacles[i].y,obWidth,obHeight);
                        collisionFlagX = true;
                        }
                    }
                    if (speedY < 0) //Hit bottom of obstacle?
                    { 
                        if (skullY-speedY > obstacles[i].y+obHeight)
                        {
                        obstacles[i].visible = false;
                        ctx.clearRect(obstacles[i].x,obstacles[i].y,obWidth,obHeight);
                        collisionFlagY = true;
                        }
                    }
                    if (speedY > 0) //Hit top of obstacle?
                    {
                        if (skullY+BALL_Y-speedY < obstacles[i].y)
                        {
                        obstacles[i].visible = false;
                        ctx.clearRect(obstacles[i].x,obstacles[i].y,obWidth,obHeight);
                        collisionFlagY = true;
                        }
                    }
                    //Check if that was the last visible obstacle
                    if (isLevelComplete())
                    {
                        //Increment Level, Reset game, and return
                        ++curLevel;
                        if (curLevel >= levels.length)
                        {
                            victory();
							return;
                        }
                        else
                        {
                            //Erase paddle hack
                            ctx.clearRect(pLocX,pLocY,PADDLE_X,PADDLE_Y);
                            init();
                        }
                        return;
                    }
                }
            }
        }

        //Bounce if there was a collision
        if (collisionFlagX) { speedX = -speedX; }
        if (collisionFlagY) { speedY = -speedY; }
    }

    function changeSpeed(amount) {
        speedX += amount;
        if (speedX < -5) { speedX = -5; }
        if (speedX > 5) {speedX = 5; }
    }

    function victory()
    {
        ctx.font = "72px Arial";
        ctx.fillStyle = "black";
        ctx.fillText("Victory!!",162,260);
        ctx.font = "32px Arial";
        ctx.fillText("Your nightmare is over.",130,345);
        ctx.fillText("Arduinos are gone... for now",95,390);
        clearInterval(intervalID);
    }

    function movePaddle(delta) {
        //Clear paddle for moving
        ctx.clearRect(pLocX,pLocY,PADDLE_X,PADDLE_Y);

        //Move paddle
            //Subtracting delta so user experience is intuitive (paddle moves direction you'd expect)
            //Multiplying delta so that paddle moves relatively quickly
        pLocX -= delta*20; 
        if (pLocX < 0) { pLocX = 0; }
        if (pLocX+PADDLE_X > GAME_X) { pLocX = GAME_X - PADDLE_X; }

        //Redraw paddle
        ctx.fillStyle=cursorColor;
        ctx.fillRect(pLocX,pLocY,PADDLE_X,PADDLE_Y);
    }
    function brick(x,y)
    {
        this.x = x;
        this.y = y;
        this.visible = true;
    }

    function level(rows,columns,width,height,space, bgcolor) {
        this.rows = rows;
        this.columns = columns;
        this.width = width;
        this.height = height;
        this.space = space;
        this.bgcolor = bgcolor;
    }

    function isLevelComplete() {
        for (var i=0; i<obstacles.length; i++)
        {
            if (obstacles[i].visible) { return false; }
        }
        return true;
    }
}
