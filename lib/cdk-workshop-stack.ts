import * as cdk from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class S3BucketStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an S3 bucket
    new Bucket(this, "MyS3Bucket", {
      versioned: true, // Enable versioning for the bucket
      removalPolicy: cdk.RemovalPolicy.DESTROY, // This is for demonstration purposes. Use appropriate removal policy for your use case.
    });
  }
}
