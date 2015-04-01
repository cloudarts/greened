/// <reference path="jquery.d.ts" />
/// <reference path="greened.ts" />


$(document).ready(function() {
	var canvasElement:HTMLCanvasElement = <HTMLCanvasElement>$("canvas")[0];
	var greened:GreenEd.Editor = new GreenEd.Editor(canvasElement);
	var success:boolean = greened.init();
	console.log("success: " + success);
});


