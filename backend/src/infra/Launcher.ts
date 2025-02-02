import { App, StackProps } from "aws-cdk-lib";
import { YourNameAppStack, } from "./stacks/mainAppStack";

export interface CustomStackProps extends StackProps {
  constructIdPrefix?: string
}

const app = new App();
new YourNameAppStack(app, 'YourNameAppStack',{
  constructIdPrefix: 'qwerty',
  env: {
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
} as CustomStackProps);