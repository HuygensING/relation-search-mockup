var removeRelation = function(ev) {
	var relation = $(ev.target).attr("data-value").split("/")[0];
	var parent = $(ev.target).parent().parent();
	$(ev.target).parent().remove();

	if(parent.find("*").length === 0) {
		parent.parent().find("select option").show();

		parent.parent().next().next().remove();
		if(parent.parent().next().find("label.active").length) {
			$(".related-domain").removeClass("visible")
		}
		parent.parent().next().remove();
		parent.parent().prev().prev().find(".selected-relations button, select").removeAttr("disabled");
	} else {
		parent.parent().find("select option").filter(function(i, el) {
		var elName = el.value.split("/")[0];
		var elDomain = el.value.split("/")[1];
		return elName === relation
		}).show();
	}

	$(".related-domain-label label.active").trigger("click");
}

function whatComes(ary) {
	return ary.map(function(i, el) {
		if($(el).hasClass("relation-select")) {
			return "<span class='relation-description'>" + 
				$(el).find(".selected-relations > div > span").map(function(i, el) { return $(el).html(); }).toArray().join(" and ")
				+ "</span>";
		} else {
			return $(el).find("label").html();
		}
	}).toArray().join(" ");
}

function showDomainSearchFor(label) {
	$("main > div").removeClass("visible");

	var whatComesBefore = whatComes($($(label).parent().prevAll().toArray().reverse()));
	var whatComesAfter = whatComes($(label).parent().nextAll());

	$(".related-domain")
		.addClass("visible")
		.find(".related-domain-name").html($(label).html());
	if(whatComesBefore || whatComesAfter) {
		$(".what-comes-before").html(whatComesBefore);
		$(".what-comes-after").html(whatComesAfter);
		$(".related-domain > h3").show()
	} else {
		$(".related-domain > h3").hide()
	}
	$("input[type='checkbox']").prop("checked", false);
	$("input[type='text']").val("");
	$(label).next(".filter-list").find("div").each(function(i, el) {
		var field = $(el).attr("data-field");
		var value = $(el).attr("data-value");
		if(field === "type") {
			$("input[type='checkbox'][value='" + value + "']").prop("checked", true);
		} else {
			$("input[type='text']").val(value);
		}
	});
}

function makeDomainLabel(domain) {
	return $("<label>").html(domain).on("click", function() { 
		showDomainSearchFor(this); 
		$(".related-domain-label label").removeClass("active");
		$(this).addClass("active");
	});
}

var showDomainForRelation = function(ev) {
	var domain = ev.target.value.split("/")[1];
	var relation = ev.target.value.split("/")[0];

	$(ev.target).parent().next().next().remove();
	$(ev.target).parent().next().remove();

	$(ev.target).parent().prev().prev().find(".selected-relations button, select").attr("disabled", "disabled");

	$("#query-builder").append(
		$("<div>").addClass("related-domain-label")
			.append(makeDomainLabel(domain + "s"))
			.append($("<div>").addClass("filter-list"))
	);

	$(ev.target).parent().find(".selected-relations").append(
		$("<div>").html($("<span>").html(relation)).append(
			$("<button>").html("X").on("click", removeRelation).attr("data-value", ev.target.value)
		)
	);

	$(ev.target).find("option").filter(function(i, el) {
		var elName = el.value.split("/")[0];
		var elDomain = el.value.split("/")[1];
		return (elDomain !== domain || elName === relation) && !$(el).attr("disabled")
	}).hide();
	$(ev.target).val("- select a relation -");

	$("#query-builder").append(relationSelect(relationsForDomain(domain)));
	$(".related-domain-label label.active").trigger("click");
}

var optionList = function(options) {
	return options.map(function(opt) {
		return $("<option>").html(opt.text).val(opt.val || opt.text);
	});
}

function relationSelect(relations) {
	return $("<div>").addClass("relation-select")
		.append(($("<select>").on("change", showDomainForRelation)
			.append($("<option disabled selected>").html("- select a relation -"))
			.append(optionList(relations.map(function(rel) {
				return {text: rel.name, val: rel.name + "/" + rel.targetDomain};
			})))))
		.append($("<div>").addClass("selected-relations"));
}

function relationsForDomain(domain) {
	var singDomain = domain.replace(/s$/, "");
	return relationTypes
		.filter(function (relType) { 
			return relType.sourceTypeName === singDomain || relType.targetTypeName === singDomain;
		})
		.map(function (relType) { 
			return {
				name: relType.sourceTypeName === singDomain ? relType.regularName : relType.inverseName,
				targetDomain: relType.sourceTypeName === singDomain ? relType.targetTypeName : relType.sourceTypeName,
			}
		});
}

var selectDomain = function(ev) {
	var domain = ev.target.value;
	$("main > div").removeClass("visible");

	$(".relation-select").remove();
	$(".related-domain-label").remove();

	var domainLabel = makeDomainLabel(domain);
	$("#query-builder")
		.append(
			$("<div>").addClass("related-domain-label")
				.append(domainLabel)
				.append($("<div>").addClass("filter-list"))
		).append(relationSelect(relationsForDomain(domain)));

	domainLabel.trigger("click")
}



var domainSelect = function() {
	return $("<div>").addClass("domain-select").on("change", selectDomain)
		.append(($("<select>")
			.append($("<option disabled selected>").html("- select a domain -"))
			.append(optionList([{text: "documents"}, {text: "persons"}, {text:"collectives"}])))
		);
}


$("#query-builder").append(domainSelect());

$("input[type='checkbox']").on("click", function() {
	var el = this;
	if($(this).is(":checked")) {
		$(".related-domain-label label.active").next().append(
			$("<div>").html("Type: " + $(el).val()).attr("data-value", $(this).val()).attr("data-field", "type")
		);
	} else {
		$(".related-domain-label label.active").next().find("[data-value='" + $(this).val() + "'][data-field='type']").remove();
	}
});

$("input[type='text']").on("keyup", function() {
	if($(this).val()) {
		var nameField = $(".related-domain-label label.active").next().find("[data-field='name']");
		if(!nameField.length) { $(".related-domain-label label.active").next().append($("<div>").attr("data-field","name")); }
		$(".related-domain-label label.active").next().find("[data-field='name']").html("Name: " + $(this).val()).attr("data-value", $(this).val());
	} else {
		$(".related-domain-label label.active").next().find("[data-field='name']").remove();
	}
})
