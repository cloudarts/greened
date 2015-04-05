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
			
			this.ctx.font = "48px serif";
			
			this.resizeCanvas();
			this.currentMouseScreenPos = new Point(0,0);
			this.lastMouseScreenPos = new Point(0,0);
			
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
				this.ctx.arc(p1OnScreen.x, p1OnScreen.y, 10, 0, Math.PI*2, true); 
				this.ctx.stroke();
				
				this.ctx.beginPath();
				this.ctx.arc(p2OnScreen.x, p2OnScreen.y, 10, 0, Math.PI*2, true); 
				this.ctx.stroke();
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
			this.redraw();
		}
		
		private onMouseMove = (evt:MouseEvent) => {
			this.currentMouseScreenPos = this.getScreenMousePos(evt);
			if( null != this.mouseDownLevelPos ) {
				if( this.currentMode == MODE.MOVE ) {
					console.log("mode: " + this.currentMode);
					var diff:Point = new Point(this.currentMouseScreenPos.x - this.lastMouseScreenPos.x, this.currentMouseScreenPos.y - this.lastMouseScreenPos.y);
					this.currentOffset.x += diff.x;
					this.currentOffset.y += diff.y;
				}
				
				this.redraw();
			}
			this.lastMouseScreenPos = this.currentMouseScreenPos;
		}
		
		private onMouseUp = (evt:MouseEvent) => {
			if( this.currentMode == MODE.WALLS && null != this.mouseDownLevelPos ) {
				var levelPosMouseUp:Point = this.screenPosToLevelPos(this.getScreenMousePos(evt));
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
			return new Point(this.currentOffset.x + screenPos.x, this.currentOffset.y + screenPos.y);
		}
		
		private levelPosToScreenPos(levelPos:Point) : Point {
			return new Point(levelPos.x - this.currentOffset.x, levelPos.y - this.currentOffset.y);
		}
	}
}
