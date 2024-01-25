import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  ContainerImage,
  FargateService,
  Cluster,
  LogDriver,
} from "aws-cdk-lib/aws-ecs";
import { FargateTaskDefinition } from "aws-cdk-lib/aws-ecs";
import {
  ApplicationLoadBalancer,
  ApplicationListener,
  ApplicationProtocol,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";

export class MyEcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ECS Cluster
    const cluster = new Cluster(this, "MyEcsCluster");

    // ECS Task Definition
    const taskDefinition = new FargateTaskDefinition(this, "MyTaskDefinition");

    // ECS Container
    const container = taskDefinition.addContainer("MyNodejsApp", {
      image: ContainerImage.fromAsset("./server"), // Adjust the path to your Dockerfile
      portMappings: [{ containerPort: 3000 }],
      logging: LogDriver.awsLogs({ streamPrefix: "MyNodejsApp" }), // Enable CloudWatch Logs
    });

    // ECS Service
    const service = new FargateService(this, "MyEcsService", {
      cluster,
      taskDefinition,
    });

    // Application Load Balancer
    const alb = new ApplicationLoadBalancer(this, "MyAlb", {
      vpc: cluster.vpc,
      internetFacing: true,
    });

    // Application Listener
    const listener = new ApplicationListener(this, "MyListener", {
      loadBalancer: alb,
      open: true,
      port: 80,
    });

    // Add Target Group to Listener
    listener.addTargets("MyTargetGroup", {
      targets: [service],
      port: 3000, // Assuming your Node.js app is running on port 3000
      protocol: ApplicationProtocol.HTTP,
    });

    // Output the Load Balancer URL
    new cdk.CfnOutput(this, "LoadBalancerUrl", {
      value: `http://${alb.loadBalancerDnsName}`,
      description: "Load Balancer URL",
    });
  }
}
