import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export interface ProxyLambdaProps extends cdk.StackProps {
  OPENAI_API_KEY: string;
}

export class ProxyLambda extends Construct {
  constructor(scope: Construct, id: string, props: ProxyLambdaProps) {
    super(scope, id);
    const role = new iam.Role(this, "Role", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole",
      ),
    );
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonBedrockFullAccess"),
    );

    const paramStoreLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "paramStoreLayer",
      "arn:aws:lambda:ap-northeast-1:133490724326:layer:AWS-Parameters-and-Secrets-Lambda-Extension-Arm64:11",
    );

    const fn = new NodejsFunction(this, "Lambda", {
      entry: "lambda/bedrock-proxy/index.ts",
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      role: role,
      timeout: cdk.Duration.seconds(30),
      architecture: lambda.Architecture.ARM_64,
      layers: [paramStoreLayer],
      environment: {
        OPENAI_API_KEY: props.OPENAI_API_KEY,
      },
    });
    fn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      invokeMode: lambda.InvokeMode.RESPONSE_STREAM,
    });
  }
}
