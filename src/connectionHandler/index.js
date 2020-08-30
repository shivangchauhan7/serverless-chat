const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

exports.connectionHandler = async event => {
    const connectionId = event.requestContext.connectionId;
    const eventType = event.requestContext.eventType
    if (eventType === 'DISCONNECT') {
        try {
            await ddb.delete({ TableName: process.env.DYNAMO_TABLE_NAME, Key: { connectionId } }).promise();
            return { statusCode: 200, body: 'Disconnected' };
        }
        catch (e) {
            return { statusCode: 500, body: 'Could not clear the connection.' };
        }
    }
    else if (eventType === "CONNECT") {
        const putParams = {
            TableName: process.env.DYNAMO_TABLE_NAME,
            Item: {
                connectionId
            }
        };

        try {
            await ddb.put(putParams).promise();
        } catch (err) {
            return { statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err) };
        }

        return { statusCode: 200, body: 'Connected.' };
    }
};

