import * as cdk from 'aws-cdk-lib';
import { Bucket, CfnBucket, EventType } from 'aws-cdk-lib/aws-s3';
import { SqsDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class MyCdkAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // L1 and L2 construct of an s3 bucket
    const level1S3Bucket = new CfnBucket(this, 'Level1S3Bucket', {
      versioningConfiguration: {
        status: 'Enabled'
      },
    });

    const level2S3Bucket = new Bucket(this, 'Level2S3Bucket', {
      bucketName: `my-level2-s3-bucket-${Date.now()}`, 
      versioned: true,
    });
    
    const myqueue = new Queue(this, 'MyQueue', {
      queueName: 'MyQueue',
      visibilityTimeout: cdk.Duration.seconds(300)
    });
    
    // Add s3 put event notification to the SQS queue
    level2S3Bucket.addEventNotification(
      EventType.OBJECT_CREATED,
      new SqsDestination(myqueue),
    );
  
    new CodePipeline(this, 'MyPipeline', {
      pipelineName: 'MyPipeline',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub('shwky/My-CDK-App', 'main'), 
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth'
        ],
      }),
    });


  }
}
