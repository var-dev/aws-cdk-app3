import { CfnOutput, Duration, } from 'aws-cdk-lib';
import { Construct } from "constructs"
import path from 'path';
import fs from 'node:fs'
import { Effect, ManagedPolicy, OpenIdConnectProvider, PolicyStatement, Role, WebIdentityPrincipal } from 'aws-cdk-lib/aws-iam';


export class OktaOidcFederation extends Construct{

  // public readonly oktaLoginLambda: NodejsFunction

  constructor(scope: Construct, id: string){
    super(scope, id)

    const { 
      oktaDomain, 
      oktaClientId
    } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', './oktaProps.json'), 'utf-8'))

    const oktaProvider = new OpenIdConnectProvider(this, 'OidcProvider', {
      url: `https://${oktaDomain}`,
      clientIds: [oktaClientId],
    })

    const federatedRole = new Role(this, 'FederatedRole', {
      assumedBy: new WebIdentityPrincipal(oktaProvider.openIdConnectProviderArn, {
        StringEquals: { [`${oktaDomain}:aud`]: oktaClientId },
      }),
      maxSessionDuration: Duration.hours(1),
    })

    federatedRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess'))

    federatedRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:ListBucket',
      ],
      resources: ['*'],
    }))

    new CfnOutput(this, "RoleArn", { 
      key: 'oktaFederatedRoleArn',
      value: federatedRole.roleArn,
    });

    new CfnOutput(this, "AppRegion", {
      key: 'appRegion',
      value: process.env.AWS_REGION || 'us-east-1',
    })
  }
}

