import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./tests/msw/server";

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock Azure DevOps Extension SDK
vi.mock("azure-devops-extension-sdk", () => ({
  init: vi.fn().mockResolvedValue(undefined),
  ready: vi.fn().mockResolvedValue(undefined),
  getService: vi.fn(),
  getExtensionContext: vi.fn(() => ({
    host: {
      uri: "https://dev.azure.com/test-org"
    }
  }))
}));

// Mock Azure DevOps Extension API
vi.mock("azure-devops-extension-api/WorkItemTracking", () => ({
  WorkItemTrackingServiceIds: {
    WorkItemFormNavigationService: "ms.vss-work-web.work-item-form-navigation-service"
  },
  IWorkItemFormNavigationService: vi.fn()
}));
