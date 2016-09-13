'use strict';

// We use mockery so that we can bypass Dynamo by default
var mockery = require('mockery');
var AWS = require('aws-sdk');

setupDynamo();

var Alexa = require('alexa-sdk');
var constants = require('./constants');
var stateHandlers = require('./stateHandlers');
var audioEventHandlers = require('./audioEventHandlers');
var AudioManager = require('./audioManager');

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

    var intentName = null;
    if (event.request.type === 'IntentRequest') {
        intentName = event.request.intent.name;
    }
    console.log("IntentName: " + intentName);

    //let xapp = "Streaming/JPKStreamingTest";
    //let environment = "XappMediaTest";
    let xapp = 'Brand Haiku/HomePageStreaming';
    let environment = 'AlexaDemo';

    if (context.hasOwnProperty("queryString")) {
        xapp = context.queryString["XAPP"];
        environment = context.queryString["environment"];
    }

    console.log("Environment: " + environment + " XAPP: " + xapp);
    if (event.context !== undefined && event.context.System.device.supportedInterfaces.AudioPlayer === undefined) {
        alexa.emit(':tell', 'Sorry, this skill is not supported on this device');
    } else {
        // The resources are loaded once and then cached, but this is done asynchronously
        AudioManager.load("XAPP", xapp, {environment: environment}, intentName, function (error) {
            if (error !== undefined && error !== null) {
                context.fail(error);
            } else {
                alexa.execute();
            }
        });
    }
};

function setupDynamo (alexa) {
    // Flip this flag if you want to use dynamo
    // If this is not set, we just use a simple, local Mock DB
    var useDynamo = false;
    if (useDynamo) {
        // Configure this JSON file with your correct credentials
        //  Make a copy of config.example.json and substitute in the correct credentials for accessing Dynamo
        AWS.config.loadFromPath('config.json');
    } else {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });
        mockery.registerMock('./DynamoAttributesHelper', require("./mockDynamo"));
    }

}