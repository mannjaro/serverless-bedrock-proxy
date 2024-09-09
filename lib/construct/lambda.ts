import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export class ProxyLambda extends Construct {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);
    const fn = new NodejsFunction(this, "lambda", {
      entry: "lambda/bedrock-proxy/index.ts",
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
    });
    fn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      invokeMode: lambda.InvokeMode.RESPONSE_STREAM,
    });
    new apigw.LambdaRestApi(this, "api", {
      handler: fn,
    });
  }
}
