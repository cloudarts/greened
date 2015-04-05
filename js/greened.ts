module GreenEd {
	export class Point {
		constructor(public x:number, public y:number) {}
	}
	
	export class Wall {
		constructor(public p1:Point, public p2:Point) {}
	}
	
	export enum MODE {
		NONE,
		MOVE,
		WALLS
	};
	
	export class Editor {
		
		private currentMode:MODE = MODE.NONE;
		
		private colorBG:string = "rgb(0,0,0)";
		private ZOOMSTEP:number = 0.25;
		private SNAP_DISTANCE:number = 15;
		private NODE_RADIUS:number = this.SNAP_DISTANCE;
		
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
			this.drawWallNodes();
			this.drawWallLines();
			this.drawDebugText();
		}
		
		private clear() : void {
			this.ctx.fillStyle = this.colorBG;
			this.ctx.fillRect(0,0,this.ctxWidth, this.ctxHeight);
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
			if( this.currentMode == MODE.WALLS && null != this.mouseDownLevelPos ) {
				
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
				else if( this.currentMode == MODE.WALLS ) {
					var levelPos:Point = this.screenPosToLevelPos(this.currentMouseScreenPos);
					var snappedPos:Point = this.snapToNextNode(levelPos);
					if( null != snappedPos ) {
						levelPos = snappedPos;
					}
					this.currentMouseScreenPos = this.levelPosToScreenPos(levelPos);
				}
			}
			this.lastMouseScreenPos = this.currentMouseScreenPos;
				
			this.redraw();
		}
		
		private onMouseUp = (evt:MouseEvent) => {
			if( this.currentMode == MODE.WALLS && null != this.mouseDownLevelPos ) {
				var screenPos:Point = this.getScreenMousePos(evt);
				var levelPosMouseUp:Point = this.screenPosToLevelPos(screenPos);
				var snappedPos:Point = this.snapToNextNode(levelPosMouseUp);
				if( null != snappedPos ) {
					levelPosMouseUp = snappedPos;
				}
				var newWall:Wall = new Wall(this.mouseDownLevelPos, levelPosMouseUp);
				this.walls.push(newWall);
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
			var levelPos:Point = new Point(this.currentOffset.x + screenPos.x, this.currentOffset.y + screenPos.y);
			levelPos.x = levelPos.x / this.currentZoom;
			levelPos.y = levelPos.y / this.currentZoom;
			return levelPos;
		}
		
		private levelPosToScreenPos(levelPos:Point) : Point {
			var screenPos:Point = new Point(levelPos.x - this.currentOffset.x, levelPos.y - this.currentOffset.y);
			screenPos.x = screenPos.x * this.currentZoom;
			screenPos.y = screenPos.y * this.currentZoom;
			return screenPos;
		}
		
		/**
		 * takes a levelPos, looks for snapable nodes and returns the snapped to levelPos
		 * if no node with SNAP_DISTANCE, returns null
		 */
		private snapToNextNode(levelPos:Point) : Point {
			for( var i:number = 0; i < this.walls.length; ++i ) {
				var wall:Wall = this.walls[i];
				var distance:number = this.getDistance(wall.p1, levelPos);
				if( distance <= this.SNAP_DISTANCE ) {
					return wall.p1;
				}
				distance = this.getDistance(wall.p2, levelPos);
				if( distance <= this.SNAP_DISTANCE ) {
					return wall.p2;
				}
			}
			return null;
		}
		
		private getDistance(p1:Point, p2:Point) : number {
			var vec:Point = new Point(p1.x - p2.x, p1.y - p2.y);
			return Math.sqrt(vec.x * vec.x + vec.y * vec.y);
		}
	}
}
