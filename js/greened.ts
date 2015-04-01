module GreenEd {
	export class Editor {
		canvas:HTMLCanvasElement = null;
		ctx:CanvasRenderingContext2D = null;
		ctxWidth:number = 0;
		ctxHeight:number = 0;

		constructor(canvasElement:HTMLCanvasElement) {
			this.canvas = canvasElement;
		}

		init() : boolean {
			this.ctx = <CanvasRenderingContext2D>this.canvas.getContext("2d");
			if( !this.ctx ) {
				return false;
			}

			this.ctxWidth = this.canvas.width;
			this.ctxHeight = this.canvas.height;

			this.ctx.fillStyle = "rgb(200,0,0)";
			this.ctx.fillRect(0,0,this.ctxWidth, this.ctxHeight);

			return true;
		}
	}
}
