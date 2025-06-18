exports.handler = async (event) => {
    console.log('Received SQS Event:', JSON.stringify(event, null, 2));
    const record = event.Records[0];
    const body = JSON.parse(record.body);
    console.log('Parsed message:', body);
    
    const product = body.num1 * body.num2;
    console.log("The product of " + body.num1 + " and " + body.num2 + " is " + product);

    const response = {
        statusCode: 200,
        body: "The product of " + body.num1 + " and " + body.num2 + " is " + product,
    };
    return response;
};