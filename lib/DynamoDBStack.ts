import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class DynamoDBStack extends cdk.Stack {
  public readonly dynamoDBTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB Table
    this.dynamoDBTable = new dynamodb.Table(
      this,
      "Production-MyDynamoDBTable",
      {
        partitionKey: {
          name: "primaryKey",
          type: dynamodb.AttributeType.STRING,
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY, // NOTE: This is for demonstration purposes; consider using a different removal policy in a production environment.
      }
    );
  }
}
