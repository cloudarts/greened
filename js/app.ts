/// <reference path="jquery.d.ts" />
/// <reference path="greened.ts" />

var editor:GreenEd.Editor = null;

$(document).ready(function() {
	/* init editor */
	var canvasElement:HTMLCanvasElement = <HTMLCanvasElement>$("canvas")[0];
	editor = new GreenEd.Editor(canvasElement);
	var success:boolean = editor.init();
	
	/* init controls for editor */
	initButtons();
	
	$('#btnMove').click();
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
	switch(element.id) {
		case "btnZoomIn": {
			editor.zoomIn();
			break;
		}
		case "btnZoomOut": {
			editor.zoomOut();
			break;
		}
	}
}

var onToolsPanelButton = function(evt) {
	var element = evt.target;
	
	switch(element.id) {
		case "btnMove": {
			editor.setMode(GreenEd.MODE.MOVE);
			break;
		}
		case "btnWallsAdd": {
			editor.setMode(GreenEd.MODE.WALLS_ADD);
			break;
		}
		case "btnWallsEdit": {
			editor.setMode(GreenEd.MODE.WALLS_EDIT);
			break;
		}
		case "btnWallsRemove": {
			editor.setMode(GreenEd.MODE.WALLS_REMOVE);
			break;
		}
	}
	
	/** toggle effect */
	$('#toolsPanel').children().each( function() {
		$(this).removeClass('success');
	});
	$(element).addClass('success');
}


