module GreenEd {
	export class Point {
		/**
		 * points (or wall nodes) can be flagged as transient in order for them 
		 * to be ignored in snapping function,
		 * i. e. when the wall node is currently being moved
		 */
		public transient:boolean;
		
		constructor(public x:number, public y:number) {
			this.transient = false;
		}
		
		equals(otherX:number, otherY:number) : boolean {
			return this.compareFloats(this.x,otherX) && this.compareFloats(this.y, otherY);
		}
		
		private compareFloats(a:number, b:number) : boolean {
			var diff:number = Math.abs(a - b);
	
			if (a == b) { // only a shortcut for infinites
				return true;
			} 
			else {
				return diff < Number.MIN_VALUE;
			} 
		}

	}
	
	export class Wall {
		constructor(public p1:Point, public p2:Point) {}
		
		hasNode(p:Point) : boolean {
			return this.p1.equals(p.x, p.y) || this.p2.equals(p.x, p.y);
		}
		
		compareTo(otherP1:Point, otherP2:Point) : boolean {
			return this.hasNode(otherP1) && this.hasNode(otherP2);
		}
	}
	
	export enum MODE {
		NONE,
		MOVE,
		WALLS_ADD,
		WALLS_EDIT,
		WALLS_REMOVE
	};
	
	export class Editor {
		
		private currentMode:MODE = MODE.NONE;
		
		private colorBG:string = "rgb(0,0,0)";
		private ZOOMSTEP:number = 0.25;
		private SNAP_DISTANCE:number = 15;
		private NODE_RADIUS:number = this.SNAP_DISTANCE;
		private GRID_WIDTH:number = 100;
		
		private canvas:HTMLCanvasElement = null;
		private ctx:CanvasRenderingContext2D = null;
		private ctxWidth:number = 0;
		private ctxHeight:number = 0;
		private canvasBoundingClientRect:any = null;
		
		private mouseDownLevelPos:Point = null;
		private currentMouseScreenPos:Point = null;
		private lastMouseScreenPos:Point = null;
		
		private walls:Array<Wall> = [];
		
		/**
		 * current zoom level for the editor
		 */
		private currentZoom:number = 1.0;
		
		/**
		 * current offset in the level for the editor, top-left corner of the canvas
		 */
		private currentOffset:Point = new Point(0,0);

		constructor(canvasElement:HTMLCanvasElement) {
			this.canvas = canvasElement;
		}

		public init() : boolean {
			this.ctx = <CanvasRenderingContext2D>this.canvas.getContext("2d");
			if( !this.ctx ) {
				return false;
			}
			
			this.currentMouseScreenPos = new Point(0,0);
			this.lastMouseScreenPos = new Point(0,0);
			
			this.ctx.font = "48px serif";
			
			this.resizeCanvas();
			
			this.canvas.onmousedown = this.onMouseDown;
			this.canvas.onmousemove = this.onMouseMove;
			this.canvas.onmouseup = this.onMouseUp;
			this.canvas.onmouseleave = this.onMouseLeave;
			
			return true;
		}
		
		private resizeCanvas() : void {

			this.canvas.style.width ='100%';
			this.canvas.style.height='100%';
			
  			this.canvas.width  = this.canvas.offsetWidth;
  			this.canvas.height = this.canvas.offsetHeight;
			
			this.ctxWidth = this.canvas.width;
			this.ctxHeight = this.canvas.height;
			
			this.canvasBoundingClientRect = this.canvas.getBoundingClientRect();
			
			this.redraw();
		}
		
		private redraw() : void {
			this.clear();
			this.drawGrid();
			this.drawWallNodes();
			this.drawWallLines();
			this.drawDebugText();
		}
		
		private clear() : void {
			this.ctx.fillStyle = this.colorBG;
			this.ctx.fillRect(0,0,this.ctxWidth, this.ctxHeight);
		}
		
		private drawGrid() : void {
			var gridWidthOnScreen:number = this.GRID_WIDTH * this.currentZoom;
			
			var gridStartXLevelSpace:number = this.GRID_WIDTH - (this.currentOffset.x % this.GRID_WIDTH);
			var gridStartYLevelSpace:number = this.GRID_WIDTH - (this.currentOffset.y % this.GRID_WIDTH);
			var gridStartXScreenSpace:number = (gridStartXLevelSpace * this.currentZoom) - gridWidthOnScreen;
			var gridStartYScreenSpace:number = (gridStartYLevelSpace * this.currentZoom) - gridWidthOnScreen;
			var numOfGridLinesX:number = Math.floor(this.ctxWidth / gridWidthOnScreen) + 2;
			var numOfGridLinesY:number = Math.floor(this.ctxHeight / gridWidthOnScreen) + 2;
			
			this.ctx.save();
			this.ctx.beginPath();
			this.ctx.lineWidth = 1;
			this.ctx.strokeStyle = 'rgb(255,255,255)';
			this.ctx.setLineDash([1,2]);
			for( var xi:number = 0; xi < numOfGridLinesX; xi++ ) {
				var screenGridX:number = gridStartXScreenSpace + xi * gridWidthOnScreen;
				this.ctx.moveTo(screenGridX, 0);
				this.ctx.lineTo(screenGridX, this.ctxHeight);
			}
			for( var yi:number = 0; yi < numOfGridLinesY; yi++ ) {
				var screenGridY:number = gridStartYScreenSpace + yi * gridWidthOnScreen;
				this.ctx.moveTo(0, screenGridY);
				this.ctx.lineTo(this.ctxWidth, screenGridY);
			}
			this.ctx.stroke();
			this.ctx.restore();
		}
		
		private drawWallNodes() {
			this.ctx.lineWidth = 1;
			this.ctx.strokeStyle = 'rgb(0,255,0)';
			for( var i:number = 0; i < this.walls.length; ++i ) {
				var wall = this.walls[i];
				
				var p1OnScreen:Point = this.levelPosToScreenPos(wall.p1);
				var p2OnScreen:Point = this.levelPosToScreenPos(wall.p2);
				
				this.ctx.beginPath();
				this.ctx.arc(p1OnScreen.x, p1OnScreen.y, this.NODE_RADIUS, 0, Math.PI*2, true); 
				this.ctx.stroke();
				
				this.ctx.beginPath();
				this.ctx.arc(p2OnScreen.x, p2OnScreen.y, this.NODE_RADIUS, 0, Math.PI*2, true); 
				this.ctx.stroke();
			}
			
			/* highlight node under mouse */
			var levelPos:Point = this.screenPosToLevelPos(this.currentMouseScreenPos);
			var snappedPos:Point = this.snapToNextNode(levelPos);
			if( null != snappedPos ) {
				var snappedScreenPos:Point = this.levelPosToScreenPos(snappedPos);
				this.ctx.fillStyle = 'rgb(0,255,0)';
				this.ctx.beginPath();
				this.ctx.arc(snappedScreenPos.x, snappedScreenPos.y, this.NODE_RADIUS, 0, Math.PI*2, true); 
				this.ctx.fill();
			}
		}
		
		private drawWallLines() {
			
			this.ctx.beginPath();
			
			for( var i:number = 0; i < this.walls.length; ++i ) {
				var wall = this.walls[i];
				
				var p1OnScreen:Point = this.levelPosToScreenPos(wall.p1);
				var p2OnScreen:Point = this.levelPosToScreenPos(wall.p2);
				
				this.ctx.moveTo(p1OnScreen.x, p1OnScreen.y);
				this.ctx.lineTo(p2OnScreen.x, p2OnScreen.y);
			}
			
			/* draw currently created line */
			if( this.currentMode == MODE.WALLS_ADD && null != this.mouseDownLevelPos ) {
				
				var p1OnScreen:Point = this.levelPosToScreenPos(this.mouseDownLevelPos);
				
				this.ctx.moveTo(p1OnScreen.x, p1OnScreen.y);
				this.ctx.lineTo(this.currentMouseScreenPos.x, this.currentMouseScreenPos.y);
			}
			
			this.ctx.lineWidth = 1;
			this.ctx.strokeStyle = 'rgb(0,255,0)';
			this.ctx.stroke();
		}
		
		private drawDebugText() {
			this.ctx.fillStyle = 'rgb(255,255,255)';
  			this.ctx.fillText("x:" + this.currentOffset.x + " y:" + this.currentOffset.y + " zoom:" + this.currentZoom, 5, 15);
		}
		
		private onMouseDown = (evt:MouseEvent) => {
			this.mouseDownLevelPos = this.screenPosToLevelPos(this.getScreenMousePos(evt));
			var snappedPos:Point = this.snapToNextNode(this.mouseDownLevelPos);
			if( null != snappedPos ) {
				this.mouseDownLevelPos = snappedPos;
			}
			this.redraw();
		}
		
		private onMouseMove = (evt:MouseEvent) => {
			this.currentMouseScreenPos = this.getScreenMousePos(evt);
			if( null != this.mouseDownLevelPos ) {
				if( this.currentMode == MODE.MOVE ) {
					var diff:Point = new Point(this.currentMouseScreenPos.x - this.lastMouseScreenPos.x, this.currentMouseScreenPos.y - this.lastMouseScreenPos.y);
					this.currentOffset.x -= diff.x / this.currentZoom;
					this.currentOffset.y -= diff.y / this.currentZoom;
				}
				else if( this.currentMode == MODE.WALLS_ADD ) {
					var levelPos:Point = this.screenPosToLevelPos(this.currentMouseScreenPos);
					var snappedPos:Point = this.snapToNextNode(levelPos);
					if( null != snappedPos ) {
						levelPos = snappedPos;
					}
					this.currentMouseScreenPos = this.levelPosToScreenPos(levelPos);
				}
				else if( this.currentMode == MODE.WALLS_EDIT ) {
					/* currently holding down on a wall node? */
					if( null != this.mouseDownLevelPos ) {
						var levelPos:Point = this.screenPosToLevelPos(this.currentMouseScreenPos);
						
						/* check for adjacent nodes */
						this.mouseDownLevelPos.transient = true;
						var snappedPos:Point = this.snapToNextNode(levelPos);
						this.mouseDownLevelPos.transient = false;
						if( null != snappedPos ) {
							levelPos = snappedPos;
						}
						
						this.mouseDownLevelPos.x = levelPos.x;
						this.mouseDownLevelPos.y = levelPos.y;
					}
				}
			}
			this.lastMouseScreenPos = this.currentMouseScreenPos;
				
			this.redraw();
		}
		
		private onMouseUp = (evt:MouseEvent) => {
			if( this.currentMode == MODE.WALLS_ADD && null != this.mouseDownLevelPos ) {
				var screenPos:Point = this.getScreenMousePos(evt);
				var levelPosMouseUp:Point = this.screenPosToLevelPos(screenPos);
				var snappedPos:Point = this.snapToNextNode(levelPosMouseUp);
				if( null != snappedPos ) {
					levelPosMouseUp = snappedPos;
				}
				var newWall:Wall = new Wall(this.mouseDownLevelPos, levelPosMouseUp);
				this.walls.push(newWall);
			}
			else if( this.currentMode == MODE.WALLS_REMOVE && null != this.mouseDownLevelPos ) {
				/* check if mouseUp over a wall node */
				var screenPos:Point = this.getScreenMousePos(evt);
				var levelPosMouseUp:Point = this.screenPosToLevelPos(screenPos);
				var mouseUpNode:Point = this.snapToNextNode(levelPosMouseUp);
				if( null != mouseUpNode ) {
					/* check if mouseDown pos was on same node as mouseUp pos */
					var mouseDownNode:Point = this.snapToNextNode(this.mouseDownLevelPos);
					if( null != mouseDownNode && true == mouseDownNode.equals(mouseUpNode.x, mouseUpNode.y) ) {
						var wall:Wall = this.getWallWithNode(mouseDownNode);
						this.deleteWall(wall);
					}
					else if( null == mouseDownNode ) {
						console.log("mouseDownNode is null");
					}
					else {
						console.log("not equal: down " + mouseDownNode + "; up " + mouseUpNode);
					}
				}
				else {
					console.log("mouseUpNode is null");
				}
			}
			
			
			this.mouseDownLevelPos = null;
			
			this.redraw();
		}
		
		private onMouseLeave = (evt:MouseEvent) => {
			this.mouseDownLevelPos = null;
			this.redraw();
		}
		
		private getScreenMousePos = (evt:MouseEvent) : Point => {
			var x:number = evt.clientX - this.canvasBoundingClientRect.left;
			var y:number = evt.clientY - this.canvasBoundingClientRect.top;
			return new Point(x,y);
		}
		
		public zoomIn() {
			this.currentZoom += this.ZOOMSTEP;
			this.redraw();
		}
		
		public zoomOut() {
			if( this.currentZoom > this.ZOOMSTEP ) {
				this.currentZoom -= this.ZOOMSTEP;
				this.redraw();
			}
		}
		
		public setMode(newMode:MODE) {
			this.currentMode = newMode;
		}
		
		private screenPosToLevelPos(screenPos:Point) : Point {
			var levelPos:Point = new Point(screenPos.x, screenPos.y);
			levelPos.x = levelPos.x / this.currentZoom;
			levelPos.y = levelPos.y / this.currentZoom;
			levelPos.x = levelPos.x + this.currentOffset.x;
			levelPos.y = levelPos.y + this.currentOffset.y;
			return levelPos;
		}
		
		private levelPosToScreenPos(levelPos:Point) : Point {
			var screenPos:Point = new Point(levelPos.x, levelPos.y);
			screenPos.x = screenPos.x - this.currentOffset.x;
			screenPos.y = screenPos.y - this.currentOffset.y;
			screenPos.x = screenPos.x * this.currentZoom;
			screenPos.y = screenPos.y * this.currentZoom;
			return screenPos;
		}
		
		/**
		 * takes a levelPos, looks for snapable nodes and returns the snapped to levelPos
		 * if no node with SNAP_DISTANCE, returns null
		 */
		private snapToNextNode(levelPos:Point) : Point {
			var computedSnapDistance = this.SNAP_DISTANCE / this.currentZoom;
			for( var i:number = 0; i < this.walls.length; ++i ) {
				var wall:Wall = this.walls[i];
				var distance:number = this.getDistance(wall.p1, levelPos);
				if( !wall.p1.transient && distance <= computedSnapDistance ) {
					return wall.p1;
				}
				distance = this.getDistance(wall.p2, levelPos);
				if( !wall.p2.transient && distance <= computedSnapDistance ) {
					return wall.p2;
				}
			}
			return null;
		}
		
		private getDistance(p1:Point, p2:Point) : number {
			var vec:Point = new Point(p1.x - p2.x, p1.y - p2.y);
			return Math.sqrt(vec.x * vec.x + vec.y * vec.y);
		}
		
		private getWallWithNode(p:Point) : Wall {
			for( var i:number = 0; i < this.walls.length; ++i ) {
				var wall:Wall = this.walls[i];
				if( true == wall.hasNode(p) ) {
					return wall;
				}
			}
			
			return null;
		}
		
		private deleteWall(wallToBeDeleted:Wall) {
			var index = this.walls.indexOf(wallToBeDeleted, 0);
			if (index != undefined) {
			   this.walls.splice(index, 1);
			}
		}
		
		public setLevel(levelData:any) {
			if( null == levelData ) {
				this.walls = [];
				return;
			}
			this.walls = levelData.walls;
		}
		
		public getLevel() {
			return {
				walls: this.walls
			};
		}
	}
}
