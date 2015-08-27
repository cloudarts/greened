/// <reference path="typings/jquery/jquery.d.ts" />
/// <reference path="greened.ts" />
/// <reference path="typings/foundation/foundation.d.ts" />

var editor:GreenEd.Editor = null;

var SERVER_BASE_URL = "raspi.depressedrobots.com:1337";

var currentLevel = -1;

$(document).ready(function() {
	/* init editor */
	var canvasElement:HTMLCanvasElement = <HTMLCanvasElement>$("canvas")[0];
	editor = new GreenEd.Editor(canvasElement);
	var success:boolean = editor.init();
	
	/* init controls for editor */
	initButtons();
	
	loadLevel(0);
	
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
		case "btnLevelPlus": {
			loadLevel(++currentLevel);
			break;
		}
		case "btnLevelMinus": {
			loadLevel(--currentLevel);
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

var loadLevel = function(levelToLoad) {
	if( levelToLoad < 0 ) {
		levelToLoad = 0;
	}
	
	$('#modal-title').text("loading level " + levelToLoad + "...");
	$('#modal').foundation('reveal', 'open');
	
	/* split ajax.done.fail and declare it of type "any" to avoid typescript type errors */
	var req:any = $.ajax({
		cache: false,
		method: "GET",
		url: SERVER_BASE_URL + "/loadlevel/" + levelToLoad
	});
	req.done(function(data, textStatus, jqXHR) {
		editor.setLevel(data);
		$('#modal').foundation('reveal', 'close');
	}).fail(function(jqXHR, textStatus, errorThrown) {
		$('#modal-title').text("error while loading level " + levelToLoad + "!");
		editor.setLevel(null);
		setTimeout(function(){
			$('#modal').foundation('reveal', 'close');
		},3000);
	}).always(function() {
		currentLevel = levelToLoad;
		$("#labelLevelSelect").text("" + currentLevel);
	});
}


