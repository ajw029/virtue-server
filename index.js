var express = require('express');
var app = express();

var Parse = require('parse/node').Parse;
Parse.initialize("DPWvUSiBDgjZJuKE2Bk9N5861S4x6ZaomkvOVZQv", 
	"hwuqtiKpBeWMgAlOfn0DfzVqjmRnHZBs94AJhpaK",
	"aLEfe9WAV1hpupnqywh2AHKzcJjoE4uD7OKzMhld");

var keyID="YTU1MmU2NmEtNmY0NS00OTY0LWEzNzEtNGViZGQ1OWVlODA2";
var appID = "ef564910-2cc3-409c-8cd5-57942abd2141";

Parse.Cloud.useMasterKey();

var CronJob = require('cron').CronJob;
new CronJob('00 */30 * * * *', function() {


}, null, true, 'America/Los_Angeles');

var Habit = Parse.Object.extend("Habit");
var query = new Parse.Query(Habit);
query.find({
  success: function(habits) {
    notifyHabits(habits);
  },
  error: function() {

  }
});

function getToday() {
  var today = new Date();
  return Math.floor(today.getTime() / 86400000); // Days since E`ch
}

function checkHabit(habit) {

}

function createMsg(habit) {
  var dataList = habit.get("dataList");
  var msg = "completed";
  var message = {
    app_id: appID,
    contents: {"en": msg},
    included_segments: ["All"],
    send_after: "2015-11-13 10:00:00 GMT-0700"
  };

  if (dataList == undefined) return message;
  var dayFrequency = habit.get("dayFrequency");
  var i = 0;
  for (i; i < dataList.length; i++) {
    var date = dataList[i].date;
    var today = getToday();
    if (date == today) {
      var count = dataList[i].count;
      if (count < dayFrequency) {
        msg = "You have completed habit, " + habit.get("title") + count + " out of " + dayFrequency + "times. Keep going!"
      }
      break;
    }

  }
  return message;
}

var notifyHabits = function (habits) {
  // return habits that should be sent now and call sendNotification
  var i = 0;
  while (i < habits.length) {
    var currHabit = habits[i];
    if (checkHabit(currHabit)) {
      var msg = createMsg(currHabit);
      if (msg.contents.en != "completed") {
        sendNotification(msg);
      }
    }
    i++;
  }
};

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