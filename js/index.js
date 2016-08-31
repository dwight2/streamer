'use strict';

var AWS = require('aws-sdk');
var Alexa = require('alexa-sdk');
var constants = require('./constants');
var stateHandlers = require('./stateHandlers');
var audioEventHandlers = require('./audioEventHandlers');
var AudioManager = require('./audioManager');

AudioManager.load("static", "test/rssFeed.xml", function () {
    console.log("AudioDataLoaded");
});

exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context);
    alexa.appId = constants.appId;
    alexa.dynamoDBTableName = constants.dynamoDBTableName;
    alexa.registerHandlers(
        stateHandlers.startModeIntentHandlers,
        stateHandlers.playModeIntentHandlers,
        stateHandlers.remoteControllerHandlers,
        stateHandlers.resumeDecisionModeIntentHandlers,
        audioEventHandlers
    );

    // Configure this JSON file with your correct credential
    //  Look at config.example.json to see how this should look
    AWS.config.loadFromPath("js/config.json");

    var requestType = event.request.type;
    // Let's look at the request being sent
    console.log('Request: ' + requestType);
    console.log(JSON.stringify(event.request, null, 2));

    // As well as peek at the response
    var wrappedFunction = context.succeed.bind(context);
    context.succeed = function (payload) {
        wrappedFunction(payload);
        if (payload !== undefined) {
            console.log("Response: " + JSON.stringify(payload, null, 2));
        }
    };

    if (event.context !== undefined && event.context.System.device.supportedInterfaces.AudioPlayer === undefined) {
        alexa.emit(':tell', 'Sorry, this skill is not supported on this device');
    }
    else {
        alexa.execute();
    }
};
