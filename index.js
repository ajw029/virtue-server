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
new CronJob('* * * * * *', function() {

  var Habit = Parse.Object.extend("Habit");
  var query = new Parse.Query(Habit);
  query.find({
    success: function(habits) {
      notifyHabits(habits);
    },
    error: function() {
    }

  });

}, null, true, 'America/Los_Angeles');

function startCronJob() {
	var CronJob = require('cron').CronJob;
	new CronJob('* * * * * *', function() {

	  var Habit = Parse.Object.extend("Habit");
	  var query = new Parse.Query(Habit);
	  query.find({
	    success: function(habits) {
	      notifyHabits(habits);
	    },
	    error: function() {
	    }

	  });

	}, null, true, 'America/Los_Angeles');
}

function getToday() {
  var today = new Date();
  return Math.floor(today.getTime() / 86400000); // Days since E`ch
}

function checkHabit(habit) {

	var range = 300000;
	var weekFrequency = JSON.parse(habit.get("weekFrequency"));

	var alarmList = habit.get("alarms");
	if (alarmList != undefined) {

		var date = new Date();

		if (weekFrequency[date.getDay()]) {
			var alarms = JSON.parse(alarmList).alarmlist;
			var alarmLength = alarms.length;
			var j = 0;
			for (j; j<alarmLength; j++) {
				var timeStamp = convertedTimeToTimestamp(alarms[j].time);

				if (date.getTime() + range > timeStamp &&
					timeStamp > date.getTime() - range) {
					return true;
				}
			}
		}		
	}
	
	return false;
}

function convertedTimeToTimestamp(time) {
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; 
	var yyyy = today.getFullYear();
	var parsedTime;
	if (time.length == 6) {
		parsedTime= time.substring(0, 4) + " " + time.substring(4);
	}
	else {
		parsedTime = time.substring(0, 5) + " " + time.substring(5);		
	}	
	
	var parsedDate = mm + "/" + dd + "/" +yyyy + " " + parsedTime;
	var date1 = new Date(parsedDate).getTime();
	return date1;
}

function createMsg(habit) {
  var dataList = habit.get("dataList");
  var userId = Object.keys(habit.get("ACL").permissionsById)[0];

  var msg = "completed";
  var message = {
    app_id: appID,
    contents: {"en": msg},
    tags: [{"value": userId, "key": userId, "relation": "="}],
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
        msg = "You have completed habit, " + habit.get("title")+ " " + count + " out of " + dayFrequency + " times. Keep going!"
        message.contents.en = msg;
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

app.get('/startJobs', function(request, response) {
	startCronJob();
  response.render('pages/index');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

