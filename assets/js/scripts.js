
var groupFilter = ["HPMusicGroup"];
var transitionTime = typeof Cookies.get('hue_transitionTime') == 'undefined' ? 4 : Cookies.get('hue_transitionTime');

// APP

function run() {

	// SETUP

	var clockSetColor, clockGetColors;

	for (i in config.lights) {
		$("#wheeltemplate .name").html( config.lights[i].name );
		$("#wheeltemplate").clone().appendTo('#wheels').attr({
			id: '',
			class: 'lights '+i
		});
	}

	$("#wheels").append('<p class="toggle"><a href="#">Groups</a></p>');

	for (i in config.groups) {

		if ( groupFilter.indexOf(config.groups[i].name) != -1 ) {
			continue;
		}

		$("#wheeltemplate .name").html( config.groups[i].name );
		$("#wheeltemplate").clone().appendTo('#wheels').attr({
			id: '',
			class: 'groups '+i
		});
	}

	$('#wheels .wheel').wheelColorPicker({
		hideKeyboard: false,
		quality: 0.2,
		layout: "block",
		mobile: true,
		snap: false,
		sliders: "whsv" //brgp
	});

	for (i in config.scenes) {
		$("#preset").append("<option value='"+i+"''>"+config.scenes[i].name+"</option>")
		$("#preset").removeAttr('class');
	}

	parseColors(config);
	getColorsClock();

	// EVENT HANDLERS

	// Type

	$(document).on('slidermove', '#wheels .wheel', function(e) {
		setBackground( $(e.target).wheelColorPicker('getColor') );
	});

	$(document).on('mousedown', '#wheels .jQWCP-scursor', function(e) {
		$(e.target).parents(".jQWCP-wWidget").children(".wheel").first().trigger('sliderdown');
	});

	$(document).on('sliderdown', '#wheels .wheel', function(e) {

		var p = e.target.parentNode;
		var color = $(e.target).wheelColorPicker('getColor');

		if (Math.round(color.v*100)/100 == 0) {
			color.v = 1;
			$(e.target).wheelColorPicker('setColor', { h:color.h,s:color.s,v:color.v });
		}

		clearInterval(clockGetColors);
		clockSetColor = setInterval(function() {
			setColorLoopInner(e);
		}, 1000);
	});

	$(document).on('sliderup', '#wheels .wheel', function(e) {
		clearInterval(clockSetColor);
		$(e.target).trigger('slidermove');
		setColorLoopInner(e);
		setTimeout(getColors, 500);
		getColorsClock();
	});

	$(document).on('click', '#wheels .off', function(e){
		clearInterval(clockGetColors);

		var p = e.target.parentNode;
		$(e.target).siblings('div').first().children('.wheel').first().wheelColorPicker('setColor', $.fn.wheelColorPicker.strToColor("#000000"));
		setBackground( $.fn.wheelColorPicker.strToColor("#000000") );
		setOff( p.className.split(" ")[0], p.className.split(" ")[1] );

		getColorsClock();
	});

	$(document).on('click', '.toggle a', function(e) {
		e.preventDefault();
		$(e.target.parentNode).nextAll().slideToggle(250);
	});


	// General

	$('#preset').on('change', function(e) {

		var value = $(this).val();
		if (value == "")
			return;

		clearInterval(clockGetColors);

		$.ajax({
			url: 'http://'+ip+'/api/'+id+'/groups/0/action',
			type: 'PUT',
			data: '{"scene":"'+value+'"}',
			complete: function(data) {;
				setBackground( $.fn.wheelColorPicker.strToColor("#000000") );
				getColors();
				getColorsClock();
			}
		});
	});

	$('#addPreset').on('click', function(e){
		var name = prompt("Please give the name of this new preset");

		if (name != null ) {

			var lights = [];
			for (i in config.lights)
				lights.push(i);

			$.ajax({
				url: 'http://'+ip+'/api/'+id+'/scenes',
				type: 'POST',
				data: '{"lights":["'+lights.join('","')+'"],"recycle":false,"name":"'+name+'","appdata":{"data":"HueWheel","version":1}}',
				success: function(data) {
					location.reload();
				}
			});
		}

	});

	$('#removePreset').on('click', function(e){
		var name = prompt("Please give the name of this new preset");
		var value = $('#preset option:contains("'+name+'")').first().val();

		if (typeof value == 'undefined') {
			alert("No preset found");
			return;
		}

		$.ajax({
			url: 'http://'+ip+'/api/'+id+'/scenes/'+value,
			type: 'DELETE',
			success: function(data) {;
				$('#preset option:contains("'+name+'")').first().remove();

				if ( $("#preset").children().length < 1 )
					$("#preset").attr('class','empty');
			}
		});
	});

	$('#reset').on('click', function(e){
		clearInterval(clockGetColors);
		$("#preset").val("");

		for ( i in config.lights ) {
			setColor("lights",i, JSON.stringify(config.lights[i].state) );
			var colorHSV = parseToHSV(config.lights[i].state);

			if (!config.lights[i].state.on)
				colorHSV = "#000000";

			var color = $.fn.wheelColorPicker.strToColor( colorHSV );
			$('#wheels .lights.'+i+' .wheel').wheelColorPicker('setColor', color );
		}

		setBackground( $.fn.wheelColorPicker.strToColor("#000000") );
		getColorsClock();
	});

	$('#addGroup').on('click', function(e){
		var name = prompt("Please give the name of this new group");

		if (name != null ) {

			var lights = prompt('Give the number of each light you want to add (eg. 1,2,3)');
			lights = lights.split(",").join('","');

			if (lights != null) {

				$.ajax({
					url: 'http://'+ip+'/api/'+id+'/groups',
					type: 'POST',
					data: '{"lights":["'+lights+'"],"name":"'+name+'","type": "LightGroup"}',
					success: function(data) {
						location.reload();
					}
				});
			}
		}

	});

	$('#removeGroup').on('click', function(e){
		var name = prompt("Please give the name of this new preset");
		var spanParent = $('#wheels span.name:contains("'+name+'")').first().parents().first();

		if (typeof spanParent == 'undefined') {
			alert("No group found");
			return;
		}

		$.ajax({
			url: 'http://'+ip+'/api/'+id+'/groups/'+spanParent.attr('class').split(" ")[1],
			type: 'DELETE',
			success: function(data) {
				$(spanParent).remove();

				if ( $("#wheels .groups").length < 1 )
					$("#wheels > p").remove();

			}
		});
	});

	$('#change').on('click', function(e){
		var ms = parseInt( prompt("Please enter the amount of 100ms a transition should take",transitionTime) );
		if (Number.isInteger(ms)) {
			transitionTime = ms;
			Cookies.set('hue_transitionTime',transitionTime);
		}
	});



	// FUNCTIONS

	function setColorLoopInner(e) {
		var p = e.target.parentNode.parentNode;
		var color = $(e.target).wheelColorPicker('getColor');
		var json = '{"on":true,"bri":'+Math.round(color.v*255)+',"sat":'+Math.round(color.s*255)+',"hue":'+Math.round(color.h*65280)+', "transitiontime":'+transitionTime+'}';

		setColor( p.className.split(" ")[0], p.className.split(" ")[1], json );
		$("#preset").val("");
	}

	function setColor(type,idl,json) {
		var end = type=='lights' ? "state" : "action";

		var place = json.indexOf('"bri":') + 6;
		if (json[place] == 0) {
			json = '{"on":false}';
		}

		$.ajax({
			url: 'http://'+ip+'/api/'+id+'/'+type+'/'+idl+'/'+end,
			type: 'PUT',
			data: json
		});

	}

	function setOff(type,idl) {
		var end = type=='lights' ? "state" : "action";

		$.ajax({
			url: 'http://'+ip+'/api/'+id+'/'+type+'/'+idl+'/'+end,
			type: 'PUT',
			data: '{"on":false, "transitiontime":'+transitionTime+'}'
		});

	}

	function getColorsClock() {
		clockGetColors = setInterval(function(){
			getColors();
		}, 5000);
	}

	function getColors() {
		$.ajax({
			url: 'http://'+ip+'/api/'+id+'/',
			type: 'GET',
			success: function(data) {
				parseColors(data);
			}
		});
	}

	function parseColors(data) {

		// lights
		for (i in data.lights) {
			var light = data.lights[i];
			var colorHSV = parseToHSV(light.state);

			if (!light.state.on)
				colorHSV = "#000000";

			var color = $.fn.wheelColorPicker.strToColor(colorHSV);

			$('.lights.'+i+' .wheel').wheelColorPicker('setColor', color );
		}

		// groups
		for (i in data.groups) {
			var group = data.groups[i];
			var colorHSV = parseToHSV(group.action);

			if (!light.state.on)
				colorHSV = "#000000";

			var color = $.fn.wheelColorPicker.strToColor(colorHSV);

			$('.groups.'+i+' .wheel').wheelColorPicker('setColor', color );
		}

	}

}

// HELPERS

function setBackground(color) {
	$('body').css('background-color', '#' + $.fn.wheelColorPicker.colorToStr(color,'hex'));
	$('body').css('color', Math.round(color.v) ? '#000' : '#fff' );
}

function parseToHSV(data) {
	return "hsv(" + Math.round(360*data.hue/65280) +","+ data.sat/255 +","+ data.bri/255 +")";
}

