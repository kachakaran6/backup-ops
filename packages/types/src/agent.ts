import { z } from 'zod';

export enum AgentStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
  ERROR = 'error',
}

export interface AgentCapability {
  name: string;
  version: string;
  supportedOperations: string[];
  systemInfo: {
    os: string;
    arch: string;
    hostname: string;
    cpus: number;
    totalMemoryBytes: number;
  };
}

export interface AgentRegistration {
  agentId: string;
  hostname: string;
  version: string;
  capabilities: AgentCapability;
  status: AgentStatus;
  lastHeartbeatAt: string;
}

export const AgentRegistrationSchema = z.object({
  agentId: z.string(),
  hostname: z.string(),
  version: z.string(),
  capabilities: z.object({
    name: z.string(),
    version: z.string(),
    supportedOperations: z.array(z.string()),
    systemInfo: z.object({
      os: z.string(),
      arch: z.string(),
      hostname: z.string(),
      cpus: z.number(),
      totalMemoryBytes: z.number(),
    }),
  }),
  status: z.nativeEnum(AgentStatus),
  lastHeartbeatAt: z.string(),
});
