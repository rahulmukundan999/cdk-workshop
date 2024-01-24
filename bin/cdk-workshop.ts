#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { S3BucketStack } from "../lib/cdk-workshop-stack";
import { MyPipelineStack } from "../lib/my-cdk-project-stack";
import { MyEcsStack } from "../lib/ecsStack";

const app = new cdk.App();

new MyPipelineStack(app, "MyCdkProjectStackPipeline");
new S3BucketStack(app, "S3Stack");
new MyEcsStack(app, "MyEcsStack");
