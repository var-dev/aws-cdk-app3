import { CfnOutput } from 'aws-cdk-lib';
import { FunctionUrl, FunctionUrlAuthType, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from "constructs"
import path from 'path';
import { readFileSync } from 'node:fs'
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { flattenObject } from '../../../../utils/src/flattenObject';


export class OktaCallbackLambda extends Construct{

  public readonly oktaCallbackLambda: NodejsFunction
  public readonly functionUrl: FunctionUrl

  constructor(scope: Construct, id: string){
    super(scope, id)

    const stackOutputs = JSON.parse(readFileSync(path.join(__dirname, '..', '..', '..', './stackOutputs.json'), 'utf-8'))
    const { 
      appDomain,
    } = flattenObject(stackOutputs)
    
    const { 
      oktaDomain, 
      oktaClientId
    } = JSON.parse(readFileSync(path.join(__dirname, '..', '..', '..', './oktaProps.json'), 'utf-8'))


    this.oktaCallbackLambda = new NodejsFunction(this, `Self`, {
      runtime: Runtime.NODEJS_20_X,
      memorySize: 128,
      entry: path.join(__dirname, '..', 'services', 'oktaCallbackLambda', 'index.ts'),
      logRetention: RetentionDays.ONE_DAY,
      environment: {
        APP_DOMAIN: appDomain,
        OKTA_DOMAIN: oktaDomain,
        OKTA_CLIENT_ID: oktaClientId,
      }
    })

    this.functionUrl = this.oktaCallbackLambda.addFunctionUrl({ authType: FunctionUrlAuthType.NONE });

    new CfnOutput(this, "Url", {
      key: 'oktaCallbackLambdaUrl',
      value: this.functionUrl.url,
    });
  }
}

