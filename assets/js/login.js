
var id, ip, config;

getIp();

function getIp() {

	if ( typeof Cookies.get('hue_ip') == 'undefined' ) {

		if (location.search.match(/\?(ip*=.*&)?(id)*=.*(&ip*=.*)?/) && location.search.match(/ip=.*/)) {
			ip = getValue(location.search,"ip");
			getId();
			return;
		}

		var tmpIp = "";

		$.ajax({
			url: 'https://www.meethue.com/api/nupnp',
			type: 'GET',
			success: function(data) {
				tmpIp = data[0].internalipaddress;
			},
			complete: function() {
				tmpIp = prompt("Please enter your hue bridge ip", tmpIp);
				if (tmpIp != "") {
						if (tmpIp != null) {
						ip = tmpIp;
						getId();
					}
				} else {
					getIp();
				}
			}
		});

	} else {
		ip = Cookies.get('hue_ip');
		getId();
	}

}


function getId() {

	if ( typeof Cookies.get('hue_id') == 'undefined' ) {

		if (location.search.match(/\?(ip*=.*&)?(id)*=.*(&ip*=.*)?/)) {

			id = getValue(location.search,"id");
			checkCredentials();

		} else {

			var tmpId;
			var auto = confirm("You you want to make a new user for this application on your hue bridge?");

			if (auto) {
				alert("Please press the Hue link button");
				getIdAjax();
			} else {
				tmpId = prompt("Please enter your user id", tmpId);
				if (tmpId != "") {
					if (tmpId != null) {
						id = tmpId;
						checkCredentials();
					}
				} else {
					getId();
				}
			}

		}

	} else {
		id = Cookies.get('hue_id');
		checkCredentials();
	}

}

function getIdAjax() {

	$.ajax({
		url: 'http://'+ip+'/api/',
		type: 'POST',
		data: '{"devicetype": "HueWheel#'+Math.floor(Date.now()/1000)+'"}',
		success: function(data) {
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

function getValue(arr, name) {
	var str = arr.split(/\?|=|&/);
	return str[str.indexOf(name)+1];
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

					Cookies.set('hue_ip', ip, {expires: 99999});
					Cookies.set('hue_id', id, {expires: 99999});


					var url = new URL(window.location.href);
					url.searchParams.set('id', id);
					url.searchParams.set('ip', ip);
					$("#permalink").attr("href", url)

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
		Cookies.remove('hue_ip');
		id = "";
		Cookies.remove('hue_id');
		getIp();
	}
}
