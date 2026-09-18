import { tool } from "ai";
import { z } from "zod";
import {
  getRepositoryMetadata,
  getRepositoryTree,
  getFileContent
} from "../github";

export function getGithubTools(token?: string) {
  return {
    getRepositoryMetadata: tool({
      description:
        "Fetch repository metadata including stars, topics, and default branch.",
      inputSchema: z.object({
        owner: z.string().describe("The owner of the repository"),
        repo: z.string().describe("The name of the repository")
      }),
      execute: async ({ owner, repo }) => {
        try {
          const metadata = await getRepositoryMetadata(owner, repo, token);
          return metadata;
        } catch (error: any) {
          return { error: error.message };
        }
      }
    }),

    getRepositoryTree: tool({
      description: "Fetch the recursive file tree of the repository.",
      inputSchema: z.object({
        owner: z.string().describe("The owner of the repository"),
        repo: z.string().describe("The name of the repository"),
        defaultBranch: z
          .string()
          .optional()
          .describe("The default branch, defaults to main")
      }),
      execute: async ({ owner, repo, defaultBranch }) => {
        try {
          const tree = await getRepositoryTree(
            owner,
            repo,
            defaultBranch || "main",
            token
          );
          return tree;
        } catch (error: any) {
          return { error: error.message };
        }
      }
    }),

    getFileContent: tool({
      description:
        "Get the raw text contents of a specific file in the repository.",
      inputSchema: z.object({
        owner: z.string().describe("The owner of the repository"),
        repo: z.string().describe("The name of the repository"),
        filePath: z
          .string()
          .describe("The file path in the repository to retrieve"),
        branch: z
          .string()
          .optional()
          .describe("The branch name, defaults to main")
      }),
      execute: async ({ owner, repo, filePath, branch }) => {
        try {
          const file = await getFileContent(
            owner,
            repo,
            filePath,
            branch || "main",
            token
          );
          return file;
        } catch (error: any) {
          return { error: error.message };
        }
      }
    })
  };
}
