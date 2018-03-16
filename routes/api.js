var express = require('express');
var router = express.Router();

var Fritz = require('fritzapi').Fritz;

var fritz = new Fritz(process.env.USERNAME, process.env.PASSWORD);

// utility function to sequentialize promises
function sequence(promises) {
	var result = Promise.resolve();
	promises.forEach(function(promise,i) {
		result = result.then(promise);
	});
	return result;
}

function switches() {
	return fritz.getSwitchList().then(function(switches) {
		console.log("Switches: " + switches + "\n");

		return sequence(switches.map(function(sw) {
			return function() {
				return sequence([
					function() {
						return fritz.getSwitchName(sw).then(function(name) {
							console.log("[" + sw + "] " + name);
						});
					},
					function() {
						return fritz.getSwitchPresence(sw).then(function(presence) {
							console.log("[" + sw + "] presence: " + presence);
						});
					},
					function() {
						return fritz.getSwitchState(sw).then(function(state) {
							console.log("[" + sw + "] state: " + state);
						});
					},
					function() {
						return fritz.getTemperature(sw).then(function(temp) {
							temp = isNaN(temp) ? '-' : temp + "°C";
							console.log("[" + sw + "] temp: " + temp + "\n");
						});
					}
				]);
			};
		}));
	});
}

switches();

/* GET devices. */
router.get('/devices', function(req, res, next) {
	return fritz.getDeviceList().then(function(devices) {
		res.json(devices);
	});
});

/* GET device. */
router.get('/device/:name', function(req, res, next) {
	return fritz.getDeviceList().then(function(devices) {
	  for(var i=0;i<devices.length;i++) {
		  if (devices[i].name === req.params.name) {
			  res.json(devices[i]);
			  break;
      }
    }
	});
});

module.exports = router;
