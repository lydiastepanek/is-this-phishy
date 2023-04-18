function sum(a, b) {
  return a + b;
}


module.exports = sum;

var AWS = require('aws-sdk');
var s3 = new AWS.S3();

var bucketName = "isthisphishy-received-emails";

exports.handler = function(event, context, callback) {
  console.log('Process email');

  // Retrieve the email from your bucket
  s3.getObject({
    Bucket: bucketName,
    Key: "ap20t96q6vu40uqbdobh3ng0tk6bfcl6amo24701"
  }, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      callback(err);
    } else {
      console.log("Raw email:\n" + data.Body);

      // Custom email processing goes here

      callback(null, null);
    }
  });
};

