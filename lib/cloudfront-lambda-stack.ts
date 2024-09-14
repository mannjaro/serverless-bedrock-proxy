import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import { ProxyLambda } from "./construct/lambda";

export class CloudfrontLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    new ProxyLambda(this, "BedrockProxy");
  }
}
