/** @type {import('jest').Config} */
const shared = {
  preset: 'ts-jest',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/$1',
  },
};

const chatLibFiles = [
  'chat-ai-guards.ts',
  'chat-ai-service.ts',
  'chat-badges.ts',
  'chat-bot-templates.ts',
  'chat-client.ts',
  'chat-conversation-router.ts',
  'chat-logic.ts',
  'chat-message-service.ts',
  'chat-moderation-logic.ts',
  'chat-notification-logic.ts',
  'chat-response-redact.ts',
  'chat-widget-config.ts',
  'chat-widget-styles.ts',
];

const chatLibThresholds = Object.fromEntries(
  chatLibFiles.map((file) => [
    `./src/lib/${file}`,
    { branches: 88, functions: 100, lines: 100, statements: 97 },
  ]),
);

/** @type {import('jest').Config} */
module.exports = {
  ...shared,
  coverageThreshold: {
    ...chatLibThresholds,
    './src/hooks/use-chat.ts': {
      branches: 84,
      functions: 100,
      lines: 100,
      statements: 98,
    },
    './src/components/ui/chat-widget.tsx': {
      branches: 90,
      functions: 100,
      lines: 100,
      statements: 98,
    },
  },
  projects: [
    {
      ...shared,
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/**/*.test.ts'],
      coveragePathIgnorePatterns: [
        '/node_modules/',
        '<rootDir>/src/components/',
        '<rootDir>/src/hooks/use-chat.ts',
      ],
    },
    {
      ...shared,
      displayName: 'dom',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/**/*.component.test.tsx'],
      setupFilesAfterEnv: ['<rootDir>/src/lib/__tests__/jest-dom-setup.ts'],
      coveragePathIgnorePatterns: ['/node_modules/', '<rootDir>/src/app/'],
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            tsconfig: {
              jsx: 'react-jsx',
            },
          },
        ],
      },
    },
  ],
};
