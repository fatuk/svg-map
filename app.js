// Avoid `console` errors in browsers that lack a console.
(function () {
	var method;
	var noop = function () {};
	var methods = [
		'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
		'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
		'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
		'timeStamp', 'trace', 'warn'
	];
	var length = methods.length;
	var console = (window.console = window.console || {});

	while (length--) {
		method = methods[length];

		// Only stub undefined methods.
		if (!console[method]) {
			console[method] = noop;
		}
	}
}());

var mapRegions = {
	'karagandinskaya': 'Карагандинская',
	'vostochno-kazahstanskaya': 'ВКО',
	'almatinskaya': 'Алматинская',
	'pavlodarskaya': 'Павлодарская',
	'akmolinskaya': 'Акмолинская',
	'severo-kazahstanskaya': 'СКО',
	'kostanayskaya': 'Костанайская',
	'yujno-kazahstanskaya': 'ЮКО',
	'jambilskaya': 'Ямбильская',
	'kizilordinskaya': 'Кызылординская',
	'mangistauskaya': 'Мангыстауская',
	'atirauskaya': 'Атырауская',
	'zapadno-kazahstanskaya': 'ЗКО',
	'aktubinskaya': 'Актюбинская'
};

$(function () {
	// Tooltip init
	var tooltipHoverTemplate = '<div class="map-tooltip hover js-tooltip">' +
		'<div class="map-tooltip__point"></div>' +
		'<div class="map-tooltip__label js-tooltipText"></div>' +
		'</div>';
	// Function to preselect cities
	var setCity = function (cityData, svgElement) {
		var tooltipTemplate = '<div id="' + cityData.id + '" class="map-tooltip map-tooltip_absolute">' +
			'<div class="map-tooltip__point"></div>' +
			'<div class="map-tooltip__label">' + cityData.label + '</div>' +
			'</div>';
		var top = svgElement.getBoundingClientRect().top,
			left = svgElement.getBoundingClientRect().left,
			width = svgElement.getBoundingClientRect().width,
			height = svgElement.getBoundingClientRect().height;

		$('body').append($(tooltipTemplate).css({
			top: top + (height / 1.9),
			left: left + (width / 2.1),
			display: 'block'
		}).on('mouseover', function (e) {
			var name = $(this).attr('id');
			$(this).addClass('hover');
			d3.select("#map").select('use[data-name="' + name + '"]').attr("fill", "#2e3092");
		}));
	};
	$('body').append(tooltipHoverTemplate);
	var $tooltip = $('.map-tooltip');

	// Fix hover blinking
	$tooltip.on('mouseover', function (e) {
		var $target = $(e.currentTarget),
			name = $target.data('name');
		$target.css({
			display: 'block'
		});
		d3.select("#map").select('use[data-name="' + name + '"]').attr("fill", "#2e3092");

	});


	d3.selection.prototype.moveToFront = function () {
		return this.each(function () {
			this.parentNode.appendChild(this);
		});
	};

	$("#map").load("svg-map/img/map_test.svg", function () {
		// Preset cities
		var citiesArray = [{
			id: 'almatinskaya',
			label: 'Алматы'
		}, {
			id: 'akmolinskaya',
			label: 'Астана'
		}];
		for (var i = 0; i < citiesArray.length; i++) {
			var svgElement = d3.select("#map").select('use[data-name="' + citiesArray[i].id + '"]')[0][0];
			setCity(citiesArray[i], svgElement);
		}

		var svg = d3.select("#map").select("svg")
			.on("click", stopped, true);

		var active = d3.select(null);

		var zoom = d3.behavior.zoom()
			.translate([0, 0])
			.scale(1)
			.scaleExtent([1, 8])
			.on("zoom", zoomed);

		svg.call(zoom.event);
		d3.select("#map").selectAll("use")
			.on("mouseover", function () {
				$('.js-tooltip').hide();
				d3.select("#map").selectAll('use').attr("fill", "url(#pattern1)");
				// Get map region params
				var top = d3.select(this)[0][0].getBoundingClientRect().top,
					left = d3.select(this)[0][0].getBoundingClientRect().left,
					width = d3.select(this)[0][0].getBoundingClientRect().width,
					height = d3.select(this)[0][0].getBoundingClientRect().height,
					name = d3.select(this).attr('data-name'),
					$tooltipText = $tooltip.find('.js-tooltipText');
				if (name === citiesArray[0].id || name === citiesArray[1].id) {
					d3.select(this).attr("fill", "#2e3092");
					$('#' + name).addClass('hover');
					return false;
				}
				// Set tooltip data
				$tooltip.data('name', name);
				$tooltipText.html(mapRegions[name]);
				$tooltip.css({
					display: 'block',
					top: top + (height / 2.4),
					left: left + (width / 2.1)
				});

				d3.select(this).attr("fill", "#2e3092");
			})
			.on("mouseout", function () {
				var name = d3.select(this).attr('data-name');
				$tooltip.css({
					display: 'none'
				});
				d3.select(this).attr("fill", "url(#pattern1)");
				$('#' + name).removeClass('hover');
			})
			.on("click", clicked);


		var scale = 0.9,
			translate = [-10, -10];
		var isInProgress = 0;

		function zoomed() {
			active.style("stroke-width", 1.5 / d3.event.scale + "px");
			active.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
		}

		function stopped() {
			if (d3.event.defaultPrevented) d3.event.stopPropagation();
		}

		function reset(newActive) {


			svg.transition()
				.duration(750)
				.call(zoom.translate([0, 0]).scale(1).event).each("end", function () {
					active.classed("active", false);

					if (!newActive) {
						active = d3.select(null);
						updateText();
						isInProgress = 0;
					} else {
						active = newActive;
						updateText();
						svg.transition()
							.duration(750)
							.call(zoom.translate(translate).scale(scale).event).each("end", function () {
								isInProgress = 0;
							});
					}

				});
			//
		}


		function updateText() {
			var legend = $(".jumbotron.legend");
			var region = active.node() ? active.attr("xlink:href") : "";

			var regionAlias = active.attr('data-name');

			legend.find('h3.info').remove();
			$('#map-info').show();

			$('#map-info').find("h3").text(arrRegions[regionAlias].name);
			$('#map-info').find(".innovativeActivity span").text(arrRegions[regionAlias].innovativeActivity);
			$('#map-info').find(".ongoingProjects span").text(arrRegions[regionAlias].ongoingProjects);
			$('#map-info').find(".expenditureOnInnovation span").text(arrRegions[regionAlias].expenditureOnInnovation);
		}

		function clicked(d) {

			if (isInProgress) {
				return;
			}

			isInProgress = 1;
			if (active.node() === this) return reset();

			active.classed("active", false);
			if (active.node() != undefined) {
				var n = d3.select(this).classed("active", true).moveToFront();
				reset(n);
			} else {
				active = d3.select(this).classed("active", true).moveToFront();
				updateText();
				return svg.transition()
					.duration(750)
					.call(zoom.translate(translate).scale(scale).event).each("end", function () {
						isInProgress = 0;
					});
			}


		}

	});

});

function setupLabel() {
	if ($('.label_check input').length) {
		$('.label_check').each(function () {
			$(this).removeClass('c_on');
		});
		$('.label_check input:checked').each(function () {
			$(this).parent('label').addClass('c_on');
		});
	};
	if ($('.label_radio input').length) {
		$('.label_radio').each(function () {
			$(this).removeClass('r_on');
		});
		$('.label_radio input:checked').each(function () {
			$(this).parent('label').addClass('r_on');
		});
	};
};
$(document).ready(function () {
	$('.label_radio').click(function () {
		setupLabel();
	});
	setupLabel();
});

// Place any jQuery/helper plugins in here.
