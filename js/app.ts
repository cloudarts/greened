/// <reference path="jquery.d.ts" />
/// <reference path="greened.ts" />


$(document).ready(function() {
	var canvasElement:HTMLCanvasElement = <HTMLCanvasElement>$("canvas")[0];
	var greened:GreenEd.Editor = new GreenEd.Editor(canvasElement);
	var success:boolean = greened.init();
	
	initButtons();
});

var initButtons = function() {
	
	var filePanelButtons = $('#filePanel').children();
	for( var i = 0; i < filePanelButtons.length; ++i ) {
		var button = filePanelButtons[i];
		$(button).click( function(evt) { 
			onFilePanelButton(evt); 
		});
	}
	
	var toolsPanelButtons = $('#toolsPanel').children();
	for( i = 0; i < toolsPanelButtons.length; ++i ) {
		var button = toolsPanelButtons[i];
		$(button).click( function(evt) { 
			onToolsPanelButton(evt); 
		});
	}
}
		
var onFilePanelButton = function(evt) {
	var element = evt.target;
	console.log("clicked on: " + element.id);
}

var onToolsPanelButton = function(evt) {
	var element = evt.target;
	console.log("clicked on: " + element.id);
	
	/** toggle effect */
	$('#toolsPanel').children().each( function() {
		$(this).removeClass('success');
	});
	$(element).addClass('success');
}


