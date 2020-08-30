const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });


exports.sendMessage = async event => {
    const body = JSON.parse(event.body);
    if (!body.roomid) return { statusCode: 400, body: 'Room id is requried.' };

    let connectionData;
    try {
        const params = {
            TableName: process.env.DYNAMO_TABLE_NAME,
            FilterExpression: '#roomid = :roomid',
            ExpressionAttributeNames: {
                '#roomid': 'roomid',
            },
            ExpressionAttributeValues: {
                ':roomid': body.roomid
            },
        }

        connectionData = await ddb.scan(params).promise();
    } catch (e) {
        return { statusCode: 500, body: 'Could not send the message.' };
    }

    const apiGatewayMng = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
    });

    const postCalls = connectionData.Items.map(async ({ connectionId }) => {
        try {
            await apiGatewayMng.postToConnection({ ConnectionId: connectionId, Data: body.message }).promise();
        } catch (e) {
            if (e.statusCode === 410) {
                await ddb.delete({ TableName: DYNAMO_TABLE_NAME, Key: { connectionId } }).promise();
            } else {
                throw e;
            }
        }
    });

    try {
        await Promise.all(postCalls);
    } catch (e) {
        return { statusCode: 500, body: 'Could not send the message.' };
    }

    return { statusCode: 200, body: 'Message sent.' };
};