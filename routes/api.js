var express = require('express');
var router = express.Router();

var Fritz = require('fritzapi').Fritz;
var fritz = new Fritz(process.env.USERNAME, process.env.PASSWORD);

var devices = {};
var alert = process.env.ALERT && JSON.parse(process.env.ALERT.toLowerCase()) || false;
var interval = process.env.INTERVAL || 10000;
var threshold = process.env.THRESHOLD || 15000;

/* Utility function to sequentialize promises */
function sequence(promises) {
	var result = Promise.resolve();
	promises.forEach(function(promise,i) {
		result = result.then(promise);
	});
	return result;
}

/* Alert when threshold has been reached. */
if (alert) {
	setInterval(function () {
		return fritz.getSwitchList().then(function(switches) {
			return sequence(switches.map(function(sw) {
				devices[sw] = devices[sw] || {};
				return 	function() {
					fritz.getSwitchPresence(sw).then(function(presence) {
						if (presence) {
							fritz.getSwitchPower(sw).then(function(pow) {
								pow = isNaN(pow) ? '-' : pow + "W";
								if (!devices[sw]['alert'] && pow >= threshold) {
									fritz.getSwitchName(sw).then(function(name) {
										devices[sw]['alert'] = true;
										console.log("[" + Date.now() + " | " + sw + "] " + name + "\'s power is above threshold: " + pow);
									});
								}
								else if (pow < threshold) {
									devices[sw]['alert'] = false;
									console.log("["  + Date.now() + " | " + sw + "] power is: " + pow);
								}
							});
						}
					});
				}
			}));
		});
	}, interval);
}

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
