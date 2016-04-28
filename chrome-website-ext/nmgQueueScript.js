function triggerNMGDownload(url) {
	var urlToQueue = {'url': url};
    $.ajax({
        type: 'POST',
        data: urlToQueue,
        url: 'http://localhost:3000/queueDownload',
        dataType: 'JSON'
    }).done(function( response ) {

        // Check for successful (blank) response
        if (response.msg === '') {
        	// change the download graphic? 
        	
        }
        else {

            // If something goes wrong, alert the error message that our service returned
            alert('Error: ' + response.msg);

        }
    });
}