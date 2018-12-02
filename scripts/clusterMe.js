var AWS = require('aws-sdk');

AWS.config.update({region: 'us-east-1'});
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:8a714758-286c-4691-adbc-4f374255eb70',
});
var lambda = new AWS.Lambda({region: REGION, apiVersion: '2015-03-31'});
// create JSON object for parameters for invoking Lambda function
var pullParams = {
  FunctionName : 'clusterMe',
  InvocationType : 'RequestResponse',
  LogType : 'None'
};
// create variable to hold data returned by the Lambda function
var pullResults;