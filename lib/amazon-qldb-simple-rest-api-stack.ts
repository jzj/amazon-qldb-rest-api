// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from '@aws-cdk/core';
import * as qldbRestApiService from './amazon-qldb-simple-rest-api-service';

export class AmazonQldbSimpleRestApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new qldbRestApiService.AmazonQldbSimpleRestApiService(this, 'AmazonQldbKVS');
  }
}
