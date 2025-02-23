import { App, StackProps } from "aws-cdk-lib";
import { App3MainStack, } from "./stacks/mainAppStack";

export interface CustomStackProps extends StackProps {
  constructIdPrefix?: string
}

const app = new App();
new App3MainStack(app, 'App3Stack',{
  constructIdPrefix: 'Qwerty',
  env: {
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
} as CustomStackProps);