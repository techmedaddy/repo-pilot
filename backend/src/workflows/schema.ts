import { z } from "zod";

// Simplified schema that smaller LLMs can reliably produce
export const StructuredReportSchema = z.object({
  summary: z
    .string()
    .describe(
      "A 2-3 sentence summary of the repository architecture and purpose."
    ),
  techStack: z
    .array(z.string())
    .describe(
      'List of technologies and frameworks identified, e.g. "Go 1.22", "Kafka", "PostgreSQL".'
    ),
  architecturePattern: z
    .string()
    .describe(
      'The architecture pattern, e.g. "Microservices", "Monolith", "Event-Driven".'
    ),
  architectureOverview: z
    .string()
    .describe("A brief overview of how the system components interact."),
  components: z
    .array(z.string())
    .describe("Key components or services identified in the codebase."),
  securityFindings: z
    .array(z.string())
    .describe(
      "Security issues or concerns found in the code. Empty array if none found."
    ),
  scalabilityNotes: z
    .string()
    .describe("Notes on scalability patterns or bottlenecks observed."),
  recommendations: z
    .array(z.string())
    .describe("Actionable engineering recommendations."),
  uncertainties: z
    .array(z.string())
    .describe("Things that could not be determined from the provided code.")
});
