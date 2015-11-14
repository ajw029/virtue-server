var express = require('express');
var app = express();

var keyID="YTU1MmU2NmEtNmY0NS00OTY0LWEzNzEtNGViZGQ1OWVlODA2";
var appID = "ef564910-2cc3-409c-8cd5-57942abd2141";
var msg = "Jung has a small dick. 3 inches. So Small";

var CronJob = require('cron').CronJob;
new CronJob('00 */30 * * * *', function() {
  sendNotification(message);
}, null, true, 'America/Los_Angeles');


var sendNotification = function(data) {
  var headers = {
    "Content-Type": "application/json",
    "Authorization": "Basic " + keyID
  };
  
  var options = {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: headers
  };
  
  var https = require('https');
  var req = https.request(options, function(res) {  
    res.on('data', function(data) {
      console.log("Response:");
      console.log(JSON.parse(data));
    });
  });
  
  req.on('error', function(e) {
    console.log("ERROR:");
    console.log(e);
  });
  
  req.write(JSON.stringify(data));
  req.end();
};

var message = { 
  app_id: appID,
  contents: {"en": msg},
  included_segments: ["All"],
  send_after: "2015-11-13 10:00:00 GMT-0700"
};

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});