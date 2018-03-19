## Usage

```
docker run \
--name fritzrestapi \
-e USERNAME=<username> \
-e PASSWORD=<password> \
-p 3000:3000 \
-d ionxat/fritzrestapi
```
## API
The following api endpoints are available:  
`/api/<realm>/devices` - list all devices  
`/api/<realm>/device/:name` - list device by name

## Additional Parameters
`-e PORT` - port on which webserver is running (default: 3000)  
`-e REALM` - obscure the api endpoint's address  
`-e USERNAME` - fritz!box username  
`-e PASSWORD` - fritz!box password  
`-e ALERT` - enable alert notification via IFTTT  
`-e INTERVAL` - interval in ms which polls the device status
(default:10000)  
`-e THRESHOLD` - power in mW which triggers an alert notification when
it is above threshold value (default: 15000)  
`-e IFTTT_KEY` - IFTTT Key which is given by the Webhooks service  
`-e IFTTT_EVENT` - IFTTT Webhooks event name  
`-e STARTTIME` - when to start the alert notification (default: 6:00pm)  
`-e ENDTIME` - when to stop the alert notification (default: 6:00am)

## Usage with IFTTT notifications
To use this command you must **create an IFTTT applet** by using the
Webhooks service in your **if** clause. Apply the Webhooks Key to the
`IFTTT_KEY` parameter. The **that** clause is up to you. We have tested it
successfully with the notification service.
```
docker run \
--name fritzrestapi \
-e PORT=<port> \
-e REALM=<realm> \
-e USERNAME=<username> \
-e PASSWORD=<password> \
-e ALERT=<alert> \
-e INTERVAL=<interval> \
-e THRESHOLD=<threshold> \
-e IFTTT_KEY=<ifttt_key> \
-e IFTTT_EVENT=<ifttt_event> \
-e STARTTIME=<starttime> \
-e ENDTIME=<endtime> \
-p <port>:<port> \
-d ionxat/fritzrestapi
```