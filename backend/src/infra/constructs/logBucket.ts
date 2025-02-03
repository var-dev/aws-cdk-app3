import { CfnOutput, Duration, RemovalPolicy } from "aws-cdk-lib"
import { Effect, PolicyStatement, ServicePrincipal } from "aws-cdk-lib/aws-iam"
import { Bucket, BucketAccessControl, BucketEncryption } from "aws-cdk-lib/aws-s3"
import { Construct } from "constructs"

export class LogBucket extends Construct{

  public readonly logBucket: Bucket

  constructor(scope: Construct, id: string){
    super(scope, id)

    this.logBucket = new Bucket(this, `Self`, {
      accessControl: BucketAccessControl.LOG_DELIVERY_WRITE,
      versioned:false,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects:true,
      encryption: BucketEncryption.S3_MANAGED,
    })

    this.logBucket.addLifecycleRule({
      enabled: true,
      expiration: Duration.days(3),
      id: `${id}ExpirationRule`,
    });

    this.logBucket.addToResourcePolicy( new PolicyStatement({
      principals: [new ServicePrincipal('logging.s3.amazonaws.com')],
      actions: ['s3:Get*', 's3:Put*'],
      effect: Effect.ALLOW,
      resources: [this.logBucket.bucketArn],
    }))

    new CfnOutput(this, `Name`, {
      key: 'logBucketName',
      value: this.logBucket.bucketName,
    })
  }
}