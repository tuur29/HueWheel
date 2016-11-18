
# ![Logo](https://raw.githubusercontent.com/tuur29/HueWheel/master/assets/icon.png "Logo") HueWheel

This is a simple (and shoddily coded) web application to control Phillips hue lights via the Hue Bridge.

![Screenshot](https://i.imgur.com/RwfwQ7Bl.png "Screenshot")

All information is either stored in a cookie (bridge ip & user id) or your hue bridge (presets & groups). Therefore it's also possible to open the html file without using a webserver. Please note that saving cookies is not supported without a webserver. If you do this you will have to enter the ip and username everytime you open the file.

There is also an extra.html file where you can debug and run certain functions (feel free to add more).


## Dependencies
Uses fujaru's [Wheel Color Picker Plugin for jQuery](https://github.com/fujaru/jquery-wheelcolorpicker)
