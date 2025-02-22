import { CfnOutput, Duration } from 'aws-cdk-lib';
import { Code, FunctionUrl, FunctionUrlAuthType, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from "constructs"
import path from 'path';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { execSync } from 'node:child_process';

import { flattenObject } from '../../../../utils/src/flattenObject'
import stackOutputs from './../../../stackOutputs.json'
import {oktaDomain, oktaClientId} from './../../../oktaProps.json'


export class OktaCallbackLambda extends Construct{

  public readonly oktaCallbackLambda: NodejsFunction
  public readonly functionUrl: FunctionUrl

  constructor(scope: Construct, id: string){
    super(scope, id)

    const { 
      appDomain,
    } = flattenObject(stackOutputs)

    this.oktaCallbackLambda = new NodejsFunction(this, `Self`, {
      runtime: Runtime.NODEJS_20_X,
      memorySize: 128,
      timeout: Duration.seconds(5),
      entry: path.join(__dirname, '..', 'services', 'oktaCallbackLambda', 'index.ts'),
      logRetention: RetentionDays.ONE_DAY,
      bundling: {
        commandHooks:{
          beforeBundling(inputDir, outputDir) {
            return []
          },
          beforeInstall(inputDir, outputDir) {
            return []
          },
          // Define the 'afterBundling' property to perform custom actions
          afterBundling: (inputDir, outputDir) => {
            // There's a bug in commandHooks implementation.
            // beforeBundling and afterBundling run twice. First time with /asset-* params.
            if (!inputDir.includes('backend') || !outputDir.includes('backend')) { return [] }
            console.log(
              'Input dir: ' + inputDir, '\n',   // /your/full/path/aws-cdk-app3/backend
              'Output dir: ' + outputDir, '\n'  // /your/full/path/aws-cdk-app3/backend/cdk.out/bundling-temp-3acc1b3c5d598c1c2b5e5d59a529c9d3b5eeee03c3e1a7f6b33a8ba9373a360b
            )
            // copyFileSync(path.join(__dirname, '..', 'services', 'oktaCallbackLambda', 'index.html'), path.join(outputDir, '..', 'index.html'));
        
            // You can also run custom shell commands
            execSync('echo "Custom command executed after bundling"', { stdio: 'inherit' })
            
            // shell commands are chained with `&&`
            return [
              `echo Copying assets`,
              `echo cp ${path.join(inputDir, 'src', 'infra', 'services', 'oktaCallbackLambda', 'iifeFetchJwks.js')} ${outputDir}`,
              `cp ${path.join(inputDir, 'src', 'infra', 'services', 'oktaCallbackLambda', 'iifeFetchJwks.js')} ${outputDir}`,
              
            ];
          }
      }},
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

