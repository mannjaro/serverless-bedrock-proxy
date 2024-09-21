import * as cdk from "aws-cdk-lib";
import * as dotenv from "dotenv";

dotenv.config();

import type { Construct } from "constructs";
import { ProxyLambda } from "./construct/lambda";

export class CloudfrontLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    new ProxyLambda(this, "BedrockProxy", {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
    });
  }
}
