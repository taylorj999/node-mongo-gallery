function addTag(id) {
	var newtag = $("input[name=newtag]").val();
	$.ajax({
		url: "/addtag-api",
		data: {
			 'id': id
		    ,'newtag': newtag
		},
		async: false,
		dataType: "jsonp",
		success: function(data) {
			if (data.status === "success") {
				$(".taglist").append("<div class=\"tag\">"+data.tag+"</div>");
				$("input[name=newtag]").val('');
			} else {
				$("#alert").append("Error from API: " + data.error);
			}
		},
		error: function(xhr,textStatus,errorThrown) {
			$("#alert").append("Error on Ajax call:" + textStatus);
		}
	});
	return false;
}

function deleteTag(id, tag) {
	$.ajax({
		url: "/removetag-api",
		data: {
			 'id': id
		    ,'tag': tag
		},
		async: false,
		dataType: "jsonp",
		success: function(data) {
			if (data.status === "success") {
				tagdiv = "#"+data.tag;
				$(tagdiv).remove();
			} else {
				$("#alert").append("Error from API: " + data.error);
			}
		},
		error: function(xhr,textStatus,errorThrown) {
			$("#alert").append("Error on Ajax call:" + textStatus);
		}
	});
	return false;
}

function deleteImage(id, tag) {
	$.ajax({
		url: "/markdeleted-api",
		data: {
			 'id': id
		},
		async: false,
		dataType: "jsonp",
		success: function(data) {
			if (data.status === "success") {
				$("#alert").append("This image has been marked for deletion.");
			} else {
				$("#alert").append("Error from API: " + data.error);
			}
		},
		error: function(xhr,textStatus,errorThrown) {
			$("#alert").append("Error on Ajax call:" + textStatus);
		}
	});
	return false;
}

function unDeleteImage(id, tag) {
	$.ajax({
		url: "/markundeleted-api",
		data: {
			 'id': id
		},
		async: false,
		dataType: "jsonp",
		success: function(data) {
			if (data.status === "success") {
				$("#alert").append("This image is no longer marked for deletion.");
			} else {
				$("#alert").append("Error from API: " + data.error);
			}
		},
		error: function(xhr,textStatus,errorThrown) {
			$("#alert").append("Error on Ajax call:" + textStatus);
		}
	});
	return false;
}

function setSequence(id) {
	var sequence = $("input[name=sequence]").val();
	var series_name = $("input[name=series_name]").val();
	if (isNaN(sequence)||(sequence===undefined)) {
		$("#alert").append("Sequence must be a number.");
		return false;
	}
	if (series_name===undefined) {
		$("#alert").append("Series name cannot be empty.");
		return false;
	}
	$.ajax({
		url: "/setsequence-api",
		data: {
			 'id': id
			,'sequence':sequence
			,'series_name':series_name
		},
		async: false,
		dataType: "jsonp",
		success: function(data) {
			if (data.status === "success") {
				$("#alert").append("Sequence updated.");
			} else {
				$("#alert").append("Error from API: " + data.error);
			}
		},
		error: function(xhr,textStatus,errorThrown) {
			$("#alert").append("Error on Ajax call:" + textStatus);
		}
	});
	return false;
}
