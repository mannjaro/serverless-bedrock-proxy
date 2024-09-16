import type { Environment } from "aws-cdk-lib";

export interface AppParameter {
  env?: Environment;
  envName: string;
}

export const devParameter: AppParameter = {
  envName: "dev",
  // env: { account: '123456789012', region: 'ap-northeast-1' },
};

export const prodParameter: AppParameter = {
  envName: "prod",
  // env: { account: '123456789012', region: 'ap-northeast-1' },
};
