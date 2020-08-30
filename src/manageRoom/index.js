const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

exports.manageRoom = async event => {
    const body = JSON.parse(event.body)
    if (!body.roomid) return { statusCode: 200, body: 'Room id is required.' };

    const params = {
        TableName: process.env.DYNAMO_TABLE_NAME,
        Key: {
            connectionId: event.requestContext.connectionId,
        },
        ExpressionAttributeValues: {
            ":roomid": body.roomid,
        },
        UpdateExpression: "SET roomid = :roomid",
        ReturnValues: "ALL_NEW"
    };

    const data = await ddb.update(params).promise();
    if (data.Attributes) {
        return { statusCode: 200, body: 'Room joined.' };
    } else {
        return { statusCode: 400, body: 'Some error has occured.' };
    }
};