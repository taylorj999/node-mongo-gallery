$(document).ready(function() {
	var a = chrome.extension.getURL("nmgDownloadTag.css");
	$('<link rel="stylesheet" type="text/css" href="' + a + '" >').appendTo("head");
	var s = chrome.extension.getURL("nmgQueueScript.js");
	$('<script src="' + s + '"/>').appendTo("head");
	
	$(".dev-view-deviation").each(function(index, element) {
		var theUrl = "";
		var fullImg = $(element).find(".dev-content-full");
		if (fullImg.length==0) {
			var firstImg = $(element).find("img");
			theUrl = $(firstImg).prop('src');
		} else {
			theUrl = $(fullImg).prop('src');
		}
		$(element).append('<A HREF="javascript:triggerNMGDownload(\''+ theUrl + '\');"><IMG ID="nmg-overlay" SRC="https://openclipart.org/image/2400px/svg_to_png/154963/1313159889.png" HEIGHT="16" WIDTH="16"/></A>');
	});
	
});