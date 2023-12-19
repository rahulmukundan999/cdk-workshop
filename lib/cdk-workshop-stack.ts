import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import { Construct } from "constructs";
import { DynamoDBStack } from "./DynamoDBStack";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as logs from "aws-cdk-lib/aws-logs";

interface EcsStackProps extends cdk.StackProps {
  dynamoDbStack: DynamoDBStack;
}

export class EcsStack extends cdk.Stack {
  private taskDefinition: ecs.FargateTaskDefinition;
  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);

    // IAM Role for ECS task
    const taskRole = new iam.Role(this, "MyEcsTaskRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    // Attach policies to the ECS task role if needed
    taskRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
    );

    // Create a Fargate task definition
    this.taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "MyTaskDefinition",
      {
        taskRole: taskRole,
      }
    );

    // Create a new log group for your service
    const logGroup = new logs.LogGroup(this, "MyLogGroup", {
      logGroupName: "MyServiceLogGroup",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Grant permissions for CloudWatch Logs
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["logs:*"],
        resources: ["*"], // This grants access to all log groups and streams
      })
    );

    // Create a metric filter to count the number of unsuccessful HTTP responses
    const metricFilter = new logs.MetricFilter(this, "MyMetricFilter", {
      logGroup: logGroup,
      metricNamespace: "MyNamespace",
      metricName: "UnsuccessfulHTTPResponses",
      filterPattern: logs.FilterPattern.literal('{ $.level = "error"}'),
      metricValue: "1",
    });

    // Create a cloudwatch alarm based on the metric filter
    const alarm = new cloudwatch.Alarm(this, "HighHTTPErrorRate", {
      alarmDescription: "Alarm for unsuccessful HTTP responses",
      metric: metricFilter.metric(),
      threshold: 1,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
    });

    // Add a container to the task definition using the Docker image
    const container = this.taskDefinition.addContainer("MyContainer", {
      image: ecs.ContainerImage.fromAsset("./"),
      memoryLimitMiB: 512,
      cpu: 256,
      portMappings: [{ containerPort: 80 }],
      logging: new ecs.AwsLogDriver({
        streamPrefix: "MyContainer", // Log group stream prefix
        logGroup: logGroup,
      }),
    });

    // Create an ECS Fargate service with an Application Load Balancer
    const fargateServiceWithALB =
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        "MyFargateServiceWithALB",
        {
          cluster: new ecs.Cluster(this, "MyCluster"),
          taskDefinition: this.taskDefinition,
          desiredCount: 2,
          cpu: 256,
          memoryLimitMiB: 512,
        }
      );

    // Configure auto-scaling based on CPU utilization
    const scaling = fargateServiceWithALB.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    // Associate the scaling policy with the listener rule
    scaling.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Create an SNS topic for incident notifications
    const incidentTopic = new sns.Topic(this, "IncidentTopic");

    // Create a Lambda function to handle incident creation
    const incidentLambda = new lambda.Function(this, "IncidentLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda"), // Assuming you have a directory named "lambda" with your Lambda function code
      environment: {
        INCIDENT_TOPIC_ARN: incidentTopic.topicArn,
      },
    });

    // Grant necessary permissions to the Lambda function
    incidentTopic.grantPublish(incidentLambda);

    // Create a CloudWatch alarm action to invoke the Lambda function
    const incidentAction = new cloudwatch.CfnAlarm.ActionProperty({
      alarmName: alarm.ref,
      roleArn: incidentLambda.role?.roleArn,
      stateReason: "Incident created due to CloudWatch Alarm",
      stateValue: "ALARM",
    });

    incidentTopic.grantPublish(incidentLambda);

    // Add the Lambda function as an alarm action
    alarm.addAlarmAction(new cloudwatch.LambdaAction(incidentLambda));

    this.configureDatabaseAccess(props);
  }

  private configureDatabaseAccess(props: EcsStackProps) {
    props.dynamoDbStack.dynamoDBTable.grantReadWriteData(
      this.taskDefinition.taskRole
    );
  }
}
