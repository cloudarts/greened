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
		
		private mouseDownPos:Point = null;
		private currentMousePos:Point = null;
		
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
			this.currentMousePos = new Point(0,0);
			
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
				
				this.ctx.beginPath();
				this.ctx.arc(wall.p1.x, wall.p1.y, 10, 0, Math.PI*2, true); 
				this.ctx.stroke();
				
				this.ctx.beginPath();
				this.ctx.arc(wall.p2.x, wall.p2.y, 10, 0, Math.PI*2, true); 
				this.ctx.stroke();
			}
		}
		
		private drawWallLines() {
			
			this.ctx.beginPath();
			
			for( var i:number = 0; i < this.walls.length; ++i ) {
				var wall = this.walls[i];
				this.ctx.moveTo(wall.p1.x, wall.p1.y);
				this.ctx.lineTo(wall.p2.x, wall.p2.y);
			}
			
			/* draw currently created line */
			if( null != this.mouseDownPos ) {
				this.ctx.moveTo(this.mouseDownPos.x, this.mouseDownPos.y);
				this.ctx.lineTo(this.currentMousePos.x, this.currentMousePos.y);
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
			var pos:Point = this.getMousePos(evt);
			this.mouseDownPos = pos;
			this.redraw();
		}
		
		private onMouseMove = (evt:MouseEvent) => {
			var pos:Point = this.getMousePos(evt);
			this.currentMousePos = pos;
			if( null != this.mouseDownPos ) {
				this.redraw();
			}
		}
		
		private onMouseUp = (evt:MouseEvent) => {
			if( null != this.mouseDownPos ) {
				var newWall:Wall = new Wall(this.mouseDownPos, this.currentMousePos);
				this.walls.push(newWall);
				this.mouseDownPos = null;
				this.redraw();
			}
		}
		
		private onMouseLeave = (evt:MouseEvent) => {
			this.mouseDownPos = null;
			this.redraw();
		}
		
		private getMousePos = (evt:MouseEvent) : Point => {
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
	}
}
