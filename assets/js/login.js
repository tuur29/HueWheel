
var id, ip, config;

getIp();

function getIp() {

	if ( typeof Cookies.get('ip') == 'undefined' ) {
		var tmpIp = "";

		$.ajax({
			url: 'https://www.meethue.com/api/nupnp',
			type: 'GET',
			success: function(data) {
				tmpIp = data[0].internalipaddress;
			},
			complete: function() {
				tmpIp = prompt("Please enter your hue bridge ip", tmpIp);
				if (tmpIp != null) {
					ip = tmpIp;
					getId();
				} else {
					getIp();
				}
			}
		});

	} else {
		ip = Cookies.get('ip');
		getId();
	}

}


function getId() {

	if ( typeof Cookies.get('id') == 'undefined' ) {

		var tmpId;
		var auto = confirm("You you want to make a new user for this application on your hue bridge?");

		if (auto) {
			alert("Please press the Hue link button");
			getIdAjax();
		} else {
			tmpId = prompt("Please enter your user id", tmpId);
			if (tmpId != null) {
				id = tmpId;
				checkCredentials();
			} else {
				getId();
			}
		}


	} else {
		id = Cookies.get('id');
		checkCredentials();
	}

}

function getIdAjax() {

	$.ajax({
		url: 'http://'+ip+'/api/',
		type: 'POST',
		data: '{"devicetype": "HueWheel#'+Math.floor(Date.now()/1000)+'"}',
		success: function(data) {
			console.log(data);
			if (typeof data[0].success != 'undefined') {
				id = data[0].success.username;
				checkCredentials();

			} else {
				var pressed = confirm("Have you pressed the Hue link button?");
				if (pressed)
					getIdAjax();
			}

		}, error: function() {
			getIp();
		}
	});

}


function checkCredentials() {

	$.ajax({
		url: 'http://'+ip+'/api/'+id+'/',
		type: 'GET',
		success: function(data) {
			if (typeof data.config != 'undefined') {
				if (typeof data.config.bridgeid != 'undefined') {
					config = data;
					$("body").removeClass('hidden');

					Cookies.set('ip', ip);
					Cookies.set('id', id);

					run();
				} else {
					checkCredentialsRetry();
				}
			} else {
				checkCredentialsRetry();
			}
		}, error: function(data) {
			checkCredentialsRetry();
		}
	});

}

function checkCredentialsRetry() {
	var retry = confirm("Wrong credentials. Do you want to reset them and try again?");
	if (retry) {
		ip = "";
		Cookies.remove('ip');
		id = "";
		Cookies.remove('id');
		getIp();
	}
}
