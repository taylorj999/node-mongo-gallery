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