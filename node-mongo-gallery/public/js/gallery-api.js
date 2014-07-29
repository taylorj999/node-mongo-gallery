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
				$(".taglist").append("<div class=\"tag\">"+newtag+"</div>");
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
				tagdiv = "#"+tag;
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
