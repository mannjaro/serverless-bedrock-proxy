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
      depsLockFilePath: "lambda/bedrock-proxy/package-lock.json",
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        nodeModules: [
          "hono",
          "openai",
          "@aws-sdk/client-bedrock-runtime",
          "@hono/zod-validator",
          "zod",
        ],
      },
    });
    fn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });
    new apigw.LambdaRestApi(this, "api", {
      handler: fn,
    });
  }
}
