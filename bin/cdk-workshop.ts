#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { EcsStack } from "../lib/cdk-workshop-stack";
import { DynamoDBStack } from "../lib/DynamoDBStack";
const app = new cdk.App();

const dynamoDbStack = new DynamoDBStack(app, "DBStack");
new EcsStack(app, "EcsStackV6", {
  dynamoDbStack,
});
