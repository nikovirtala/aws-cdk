import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';

/**
 * Stack verification steps:
 *
 * -- aws stepfunctions describe-state-machine --state-machine-arn <stack-output> has a status of `ACTIVE`
 */
const app = new cdk.App();
const stack = new cdk.Stack(app, 'cdk-stepfunctions-map-distributed-stack');

const map = new sfn.Map(stack, 'Map', {
  stateName: 'My-Map-State',
  maxConcurrencyPath: sfn.JsonPath.stringAt('$.maxConcurrency'),
  itemsPath: sfn.JsonPath.stringAt('$.inputForMap'),
  parameters: {
    foo: 'foo',
    bar: sfn.JsonPath.stringAt('$.bar'),
  },
});
map.itemProcessor(new sfn.Pass(stack, 'Pass State'), {
  mode: sfn.ProcessorMode.DISTRIBUTED,
  executionType: sfn.ProcessorType.STANDARD,
});

const sm = new sfn.StateMachine(stack, 'StateMachine', {
  definition: map,
  timeout: cdk.Duration.seconds(30),
});

new cdk.CfnOutput(stack, 'StateMachineARN', {
  value: sm.stateMachineArn,
});

new IntegTest(app, 'cdk-stepfunctions-map-distributed-integ', {
  testCases: [stack],
});

app.synth();
