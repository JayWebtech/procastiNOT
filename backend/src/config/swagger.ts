import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ProcastiNot API',
      version: '1.0.0',
      description: 'API documentation for ProcastiNot - A blockchain-based accountability platform',
      contact: {
        name: 'ProcastiNot Team',
        email: 'support@procastinot.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001/api',
        description: 'Development server',
      },
      {
        url: 'https://api.procastinot.com/api',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        Challenge: {
          type: 'object',
          required: [
            'creator_email',
            'creator_wallet',
            'task_description',
            'accountability_partner_email',
            'accountability_partner_wallet',
            'stake_amount',
            'duration_minutes',
          ],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the challenge',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            creator_email: {
              type: 'string',
              format: 'email',
              description: 'Email address of the challenge creator',
              example: 'creator@example.com',
            },
            creator_wallet: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{64}$',
              description: 'Starknet wallet address of the challenge creator',
              example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            },
            task_description: {
              type: 'string',
              minLength: 10,
              maxLength: 1000,
              description: 'Detailed description of the challenge task',
              example: 'Complete a 30-day fitness challenge with daily workouts',
            },
            accountability_partner_email: {
              type: 'string',
              format: 'email',
              description: 'Email address of the accountability partner',
              example: 'partner@example.com',
            },
            accountability_partner_wallet: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{64}$',
              description: 'Starknet wallet address of the accountability partner',
              example: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            },
            stake_amount: {
              type: 'number',
              format: 'decimal',
              minimum: 0.1,
              description: 'Amount of STRK tokens staked for the challenge',
              example: 10.5,
            },
            duration_minutes: {
              type: 'integer',
              minimum: 5,
              maximum: 129600,
              description: 'Duration of the challenge in minutes',
              example: 1440,
            },
            status: {
              type: 'string',
              enum: [
                'active',
                'proof_submitted',
                'proof_approved',
                'proof_rejected',
                'completed',
                'failed',
                'disputed',
              ],
              description: 'Current status of the challenge',
              example: 'active',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the challenge was created',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the challenge was last updated',
            },
            deadline_at: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the challenge deadline expires',
            },
            contract_address: {
              type: 'string',
              description: 'Smart contract address for the challenge',
              example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            },
            transaction_hash: {
              type: 'string',
              description: 'Blockchain transaction hash for challenge creation',
              example: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            },
            proof_submitted_at: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when proof was submitted',
            },
            proof_approved_at: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when proof was approved',
            },
            proof_rejected_at: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when proof was rejected',
            },
            proof_evidence_url: {
              type: 'string',
              format: 'uri',
              description: 'URL to evidence supporting the proof',
              example: 'https://example.com/proof.jpg',
            },
            proof_description: {
              type: 'string',
              description: 'Description of the submitted proof',
              example: 'Completed 30 minutes of cardio workout',
            },
            acp_review_comment: {
              type: 'string',
              description: 'Comment from accountability partner on proof review',
              example: 'Great job! Evidence clearly shows completion.',
            },
            completed_at: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when challenge was completed',
            },
            failed_at: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when challenge was marked as failed',
            },
            rewards_claimed_at: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when rewards were claimed',
            },
          },
        },
        CreateChallengeRequest: {
          type: 'object',
          required: [
            'creator_email',
            'creator_wallet',
            'task_description',
            'accountability_partner_email',
            'accountability_partner_wallet',
            'stake_amount',
            'duration_minutes',
          ],
          properties: {
            creator_email: {
              type: 'string',
              format: 'email',
              description: 'Email address of the challenge creator',
              example: 'creator@example.com',
            },
            creator_wallet: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{64}$',
              description: 'Starknet wallet address of the challenge creator',
              example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            },
            task_description: {
              type: 'string',
              minLength: 10,
              maxLength: 1000,
              description: 'Detailed description of the challenge task',
              example: 'Complete a 30-day fitness challenge with daily workouts',
            },
            accountability_partner_email: {
              type: 'string',
              format: 'email',
              description: 'Email address of the accountability partner',
              example: 'partner@example.com',
            },
            accountability_partner_wallet: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{64}$',
              description: 'Starknet wallet address of the accountability partner',
              example: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            },
            stake_amount: {
              type: 'number',
              format: 'decimal',
              minimum: 0.1,
              description: 'Amount of STRK tokens staked for the challenge',
              example: 10.5,
            },
            duration_minutes: {
              type: 'integer',
              minimum: 5,
              maximum: 129600,
              description: 'Duration of the challenge in minutes',
              example: 1440,
            },
            contract_address: {
              type: 'string',
              description: 'Smart contract address for the challenge (optional)',
              example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            },
            transaction_hash: {
              type: 'string',
              description: 'Blockchain transaction hash for challenge creation (optional)',
              example: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            },
          },
        },
        SubmitProofRequest: {
          type: 'object',
          required: ['proof_description', 'evidence_url'],
          properties: {
            proof_description: {
              type: 'string',
              minLength: 10,
              maxLength: 1000,
              description: 'Description of the proof submitted',
              example: 'Completed 30 minutes of cardio workout as evidenced by the attached photo',
            },
            evidence_url: {
              type: 'string',
              format: 'uri',
              description: 'URL to evidence supporting the proof',
              example: 'https://example.com/proof.jpg',
            },
          },
        },
        ReviewProofRequest: {
          type: 'object',
          required: ['decision', 'comment'],
          properties: {
            decision: {
              type: 'string',
              enum: ['approve', 'reject'],
              description: 'Decision on the proof submission',
              example: 'approve',
            },
            comment: {
              type: 'string',
              minLength: 10,
              maxLength: 500,
              description: 'Comment explaining the decision',
              example: 'Great job! Evidence clearly shows completion of the challenge.',
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Response message',
              example: 'Challenge created successfully',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
            error: {
              type: 'string',
              description: 'Error message (only present when success is false)',
              example: 'Validation error',
            },
            errors: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of validation errors (only present when success is false)',
              example: ['Email is required', 'Invalid wallet address format'],
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Validation error',
            },
            errors: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['Email is required', 'Invalid wallet address format'],
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad Request - Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError',
              },
            },
          },
        },
        NotFound: {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Challenges',
        description: 'Challenge management endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API files
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  // Swagger UI setup
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'ProcastiNot API Documentation',
  }));

  // JSON endpoint for the OpenAPI spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 Swagger documentation available at: http://localhost:3001/api-docs');
};

export default specs;
