#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CloudfrontLambdaStack } from "../lib/cloudfront-lambda-stack";
import { devParameter, prodParameter } from "../parameter";

const app = new cdk.App();
const env = app.node.tryGetContext("env");
const parameter = env === "dev" ? devParameter : prodParameter;
new CloudfrontLambdaStack(app, `CloudfrontLambdaStack-${parameter.envName}`);
