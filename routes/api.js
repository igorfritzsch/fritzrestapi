var express = require('express');
var request = require('request');
var schedule = require('node-schedule');

var router = express.Router();

var Fritz = require('fritzapi').Fritz;
var fritz = new Fritz(process.env.USERNAME, process.env.PASSWORD);

var devices = {};
var timer = null;
var alert = process.env.ALERT && JSON.parse(process.env.ALERT.toLowerCase()) || false;
var interval = process.env.INTERVAL || 10000;
var threshold = process.env.THRESHOLD || 15000;
var iftttKey = process.env.IFTTT_KEY;
var iftttEventOn = process.env.IFTTT_EVENT_ON;
var iftttEventOff = process.env.IFTTT_EVENT_OFF;

var startTime = process.env.STARTTIME && process.env.STARTTIME.split(':').map(function(time){return parseInt(time)}) || [18,0];
var endTime = process.env.STARTTIME && process.env.ENDTIME.split(':').map(function(time){return parseInt(time)}) || [6,0];

/* Utility function to sequentialize promises */
function sequence(promises) {
	var result = Promise.resolve();
	promises.forEach(function(promise,i) {
		result = result.then(promise);
	});
	return result;
}

/* Send IFTTT notifications */
function sendNotification(params) {
	if (!iftttKey)
		return;
	var options = {
		url: 'https://maker.ifttt.com/trigger/' + params.event + '/with/key/' + iftttKey,
		method: 'POST',
		json: true,
		body: params.values
	};
	request(options, function (error, response, body) {
		if (!error && response.statusCode === 200) {
			console.log(body);
		}
	});
}

/* Alert when threshold has been reached. */
if (alert) {

	/* Start alert */
	var startInterval = function () {
		timer = setInterval(function () {
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
											if (iftttEventOn)
												sendNotification({event: iftttEventOn, values: {value1: name, value2: pow}});
										});
									}
									else if (devices[sw]['alert'] && pow < threshold) {
										devices[sw]['alert'] = false;
										console.log("["  + Date.now() + " | " + sw + "] power is: " + pow);
										if (iftttEventOff)
											sendNotification({event: iftttEventOff, values: {value1: name, value2: pow}});
									}
								});
							}
						});
					}
				}));
			});
		}, interval);
	};

	/* Stop alert */
	var stopInterval = function () {
		clearInterval(timer);
	};

	/* Start alert at default: 6:00pm */
	schedule.scheduleJob({hour: startTime[0], minute: startTime[1]}, function(){
		console.log('Start Alert!');
		startInterval();
	});

	/* Stop alert at default: 6:00am */
	schedule.scheduleJob({hour: endTime[0], minute: endTime[1]}, function(){
		console.log('Stop Alert!');
		stopInterval();
	});

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
