import { CfnOutput, Size } from 'aws-cdk-lib';
import { FunctionUrl, FunctionUrlAuthType, Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from "constructs"
import path from 'path';
import { RetentionDays } from 'aws-cdk-lib/aws-logs'

import stackOutputs from './../../../stackOutputs.json'
import {oktaDomain, oktaClientId} from './../../../oktaProps.json'

import {flattenObject} from '../../../../utils/src/flattenObject'


export class OktaLoginLambda extends Construct{

  public readonly oktaLoginLambda: NodejsFunction
  public readonly functionUrl: FunctionUrl

  constructor(scope: Construct, id: string){
    super(scope, id)

    const { 
      appDomain,
    } = flattenObject(stackOutputs)

    this.oktaLoginLambda = new NodejsFunction(this, `Self`, {
      runtime: Runtime.NODEJS_20_X,
      memorySize: 128,
      entry: path.join(__dirname, '..', 'services', 'oktaLoginLambda', 'index.ts'),
      logRetention: RetentionDays.ONE_DAY,
      environment: {
        APP_DOMAIN: appDomain,
        OKTA_DOMAIN: oktaDomain,
        OKTA_CLIENT_ID: oktaClientId,
      }
    })

    this.functionUrl = this.oktaLoginLambda.addFunctionUrl({ authType: FunctionUrlAuthType.NONE });

    new CfnOutput(this, "Url", {
      key: 'oktaLoginLambdaUrl',
      value: this.functionUrl.url,
    });
  }
}

