var GreenEd;
(function (GreenEd) {
    var Editor = (function () {
        function Editor(canvasElement) {
            this.canvas = null;
            this.ctx = null;
            this.ctxWidth = 0;
            this.ctxHeight = 0;
            this.canvas = canvasElement;
        }
        Editor.prototype.init = function () {
            this.ctx = this.canvas.getContext("2d");
            if (!this.ctx) {
                return false;
            }
            this.ctxWidth = this.canvas.width;
            this.ctxHeight = this.canvas.height;
            this.ctx.fillStyle = "rgb(200,0,0)";
            this.ctx.fillRect(0, 0, this.ctxWidth, this.ctxHeight);
            return true;
        };
        return Editor;
    })();
    GreenEd.Editor = Editor;
})(GreenEd || (GreenEd = {}));
/// <reference path="jquery.d.ts" />
/// <reference path="greened.ts" />
$(document).ready(function () {
    var canvasElement = $("canvas")[0];
    var greened = new GreenEd.Editor(canvasElement);
    var success = greened.init();
    console.log("success: " + success);
});
