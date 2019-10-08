// Copyright (c) 2018 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
Webcam Image Classification using MobileNet and p5.js
This example uses a callback pattern to create the classifier
=== */

let classifier;
let video;
let currentPrediction = "";
let isModelReady = false;
let isMqttConnected = false;
let client;

function isMobileDevice() {
  return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf("IEMobile") !== -1);
};

function setup() {
  createCanvas(640, 480);
  // Create a video element
  if (isMobileDevice()) {
    video = createCapture({
      audio: false,
      video: {
        facingMode: {
          exact: "environment"
        }
      }
    });
  } else {
    video = createCapture(VIDEO);
  }

  video.size(640, 480);
  video.hide();
  // Initialize the Image Classifier method with MobileNet and the video as the second argument
  classifier = ml5.imageClassifier("MobileNet", video, modelReady);
}

function draw() {
  image(video, 0, 0);
  if (isModelReady) {
    textSize(64);
    text(Math.floor(frameRate()), 20, height / 2);
  }
  //background(255,0,0);

  //if (currentPrediction === "iPod") {
  //background(0, 255, 0);
  textSize(14);
  text(currentPrediction, 10, height - 100);
  //}
}

function initMqtt() {
  client = new Paho.MQTT.Client("mqtt.cmmc.io", Number(9001), Math.random() + "clientId");

// set callback handlers
  client.onConnectionLost = onConnectionLost;
  client.onMessageArrived = onMessageArrived;

// connect the client
  client.connect({ onSuccess: onConnect });

// called when the client connects
  function onConnect() {
    // Once a connection has been made, make a subscription and send a message.
    isMqttConnected = true;
    console.log("onConnect");
    //client.subscribe("ml5/predict");

    //let message = new Paho.MQTT.Message("Hello");
    //message.destinationName = "World";
    //client.send(message);

    message = new Paho.MQTT.Message("predicted");
    message.destinationName = "ml5/predict";
    client.send(message);
  }

// called when the client loses its connection
  function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
      console.log("onConnectionLost:" + responseObject.errorMessage);
    }
  }

// called when a message arrives
  function onMessageArrived(message) {
    console.log("onMessageArrived:" + message.payloadString);
  }

}

function modelReady() {
  // Change the status of the model once its ready
  // Create a client instance
  isModelReady = true;
  initMqtt();

  select("#status").html("Model Loaded");
  // Call the classifyVideo function to start classifying the video
  classifyVideo();
}

// Get a prediction for the current video frame
function classifyVideo() {
  classifier.predict(gotResult);
}

// When we get a result
function gotResult(err, results) {

  // The results are in an array ordered by probability.
  currentPrediction = results[0].label;
  //currentPrediction = currentPrediction.split(',')[0]; //Optionally only use the first part of the prediction, before any commas

  if (isMqttConnected) {
    message = new Paho.MQTT.Message(currentPrediction);
    message.destinationName = "ml5/predict";
    client.send(message);
  }

  //Print out the top three results
  for (let i = 0; i < 3; i++) {
    if (i == 0) console.log("*******");
    //console.log(i + ": " + results[i].label + " " + nf(results[i].confidence, 0, 2));
    //let message = new Paho.MQTT.Message("predicted");
    //message.destinationName = "ml5";
    //client.send(message);
    //console.log("sent");
  }
  //

  select("#result").html(currentPrediction);
  select("#probability").html(nf(results[0].confidence, 0, 2));

  classifyVideo();
}
