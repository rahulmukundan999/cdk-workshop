import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Artifact, Pipeline } from "aws-cdk-lib/aws-codepipeline";
import {
  CodeBuildAction,
  GitHubSourceAction,
  GitHubTrigger,
} from "aws-cdk-lib/aws-codepipeline-actions";
import {
  BuildSpec,
  LinuxBuildImage,
  Project,
  ProjectProps,
} from "aws-cdk-lib/aws-codebuild";

export class MyPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sourceArtifact = new Artifact("SourceOutput");

    // GitHub source action
    const githubSourceAction = new GitHubSourceAction({
      actionName: "Github",
      owner: "rahulmukundan999",
      repo: "cdk-workshop",
      branch: "main",
      oauthToken: cdk.SecretValue.secretsManager("github/cdk-pipeline"),
      output: sourceArtifact,
      trigger: GitHubTrigger.WEBHOOK,
    });

    // CodeBuild project for cdk synth
    const cdkSynthProject = new Project(this, "CdkSynthProject", {
      projectName: "cdk-synth-project",
      environment: {
        buildImage: LinuxBuildImage.STANDARD_5_0,
      },
      buildSpec: BuildSpec.fromObject({
        version: "0.2",
        phases: {
          pre_build: {
            commands: ["npm install -g aws-cdk", "npm install"],
          },
          build: {
            commands: ["cdk synth"],
          },
        },
      }),
    });

    // CodeBuild action for cdk synth
    const cdkSynthAction = new CodeBuildAction({
      actionName: "CdkSynth",
      project: cdkSynthProject,
      input: sourceArtifact,
      outputs: [new Artifact("CdkSynthOutput")],
    });

    // CodeBuild project for cdk deploy
    const cdkDeployProject = new Project(this, "CdkDeployProject", {
      projectName: "cdk-deploy-project",
      environment: {
        buildImage: LinuxBuildImage.STANDARD_5_0,
      },
      buildSpec: BuildSpec.fromObject({
        version: "0.2",
        phases: {
          pre_build: {
            commands: ["npm install -g aws-cdk", "npm install"],
          },
          build: {
            commands: ["cdk deploy --require-approval never"],
          },
        },
      }),
    });

    // CodeBuild action for cdk deploy
    const cdkDeployAction = new CodeBuildAction({
      actionName: "CdkDeploy",
      project: cdkDeployProject,
      input: sourceArtifact,
    });

    // Create CodePipeline with additional stages
    new Pipeline(this, "GitHubPipeline", {
      pipelineName: "GitHubPipeline",
      stages: [
        {
          stageName: "Source",
          actions: [githubSourceAction],
        },
        {
          stageName: "CdkSynth",
          actions: [cdkSynthAction],
        },
        {
          stageName: "CdkDeploy",
          actions: [cdkDeployAction],
        },
      ],
    });
  }
}
