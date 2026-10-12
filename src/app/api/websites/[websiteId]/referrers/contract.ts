import { z } from 'zod';
import { referrersQuerySchema } from '@/lib/analytics-schema';
import { defineOperation } from '@/openapi/operation';
import { badRequestResponse, notFoundResponse, unauthorizedResponse } from '@/openapi/schemas';

export const operations = [
  defineOperation({
    method: 'get',
    path: '/api/websites/{websiteId}/referrers',
    audience: 'public',
    auth: 'bearer-or-share',
    operation: {
      operationId: 'getWebsiteTopReferrers',
      summary: 'Get website top referrers',
      tags: ['Websites'],
      requestParams: { path: z.object({ websiteId: z.uuid() }), query: referrersQuerySchema },
      responses: {
        '200': {
          description: 'Analytics results.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    referrer: {
                      type: 'string',
                    },
                    visits: {
                      type: 'number',
                    },
                  },
                  required: ['referrer', 'visits'],
                },
              },
            },
          },
        },
        '400': badRequestResponse,
        '401': unauthorizedResponse,
        '404': notFoundResponse,
      },
    },
  }),
] as const;
