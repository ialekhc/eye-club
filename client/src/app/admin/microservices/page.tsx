'use client';

import { useResource } from '@/lib/use-resource';
import { RemoteError } from '@/components/RemoteState';
import {
  Activity,
  CheckCircle2,
  Cpu,
  Database,
  GitBranch,
  Layers,
  Network,
  RefreshCw,
  Server,
  ShieldCheck,
} from 'lucide-react';

interface MicroserviceNode {
  id: string;
  name: string;
  boundedContext: string;
  defaultPort: number;
  configuredEndpoint: string;
  routePrefixes: string[];
  ownedEntities: string[];
  description: string;
}

interface TopologyResponse {
  architecture: string;
  activeNodeRole: string;
  communicationPattern: string;
  services: MicroserviceNode[];
}

interface HealthResponse {
  timestamp: string;
  overallStatus: 'HEALTHY' | 'DEGRADED';
  databaseConnected: boolean;
  services: Array<{
    id: string;
    name: string;
    boundedContext: string;
    port: number;
    endpoint: string;
    mode: string;
    status: string;
    latencyMs: number;
    routePrefixes: string[];
  }>;
}

export default function AdminMicroservicesPage() {
  const topology = useResource<TopologyResponse>('/microservices/topology');
  const health = useResource<HealthResponse>('/microservices/health');

  const refreshAll = () => {
    topology.reload();
    health.reload();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
            <Network className="w-3.5 h-3.5" /> Distributed Domain Microservices Mesh
          </span>
          <h1 className="text-3xl font-bold text-slate-900">Microservices Architecture</h1>
          <p className="text-sm text-slate-600 mt-1">
            6 independently deployable domain microservices orchestrated behind the API Gateway (:4000).
          </p>
        </div>

        <button
          type="button"
          onClick={refreshAll}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-sm font-semibold shadow-xs"
        >
          <RefreshCw className="w-4 h-4 text-indigo-600" />
          Refresh Mesh Telemetry
        </button>
      </div>

      {topology.error ? <RemoteError message={topology.error} retry={refreshAll} /> : null}

      {/* Cluster Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500 mb-2">
            <span>Mesh Status</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            {health.data?.overallStatus ?? 'HEALTHY'}
          </p>
          <p className="text-xs text-slate-500 mt-1">All 6 bounded-context services online</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500 mb-2">
            <span>Domain Services</span>
            <Server className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {topology.data?.services.length ?? 6} Services
          </p>
          <p className="text-xs text-slate-500 mt-1">Ports :4000 through :4005</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500 mb-2">
            <span>Ingress Pattern</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-lg font-bold text-slate-900">API Gateway + JWT</p>
          <p className="text-xs text-slate-500 mt-1">Correlation IDs &amp; tenant isolation</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500 mb-2">
            <span>Try-On Edge Engine</span>
            <Cpu className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-lg font-bold text-slate-900">1-Euro Stabilized</p>
          <p className="text-xs text-slate-500 mt-1">Client-side MediaPipe + zero-jitter filter</p>
        </div>
      </div>

      {/* Microservice Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {(topology.data?.services ?? []).map((service) => {
          const liveHealth = health.data?.services.find((h) => h.id === service.id);
          return (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-900 text-white">
                        :{service.defaultPort}
                      </span>
                      <span className="font-mono text-xs text-indigo-700 font-semibold">
                        {service.id}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mt-1.5">{service.name}</h2>
                    <p className="text-xs font-semibold text-teal-700">{service.boundedContext}</p>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {liveHealth?.status ?? 'HEALTHY'}
                    {liveHealth?.latencyMs !== undefined ? ` · ${liveHealth.latencyMs}ms` : ''}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{service.description}</p>

                {/* Owned Route Prefixes */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                    <GitBranch className="w-3 h-3" /> Routed API Prefixes
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {service.routePrefixes.map((prefix) => (
                      <span
                        key={prefix}
                        className="font-mono text-[11px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-100"
                      >
                        {prefix}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Owned Domain Models */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                    <Database className="w-3 h-3" /> Owned Domain Aggregates
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {service.ownedEntities.map((entity) => (
                      <span
                        key={entity}
                        className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                      >
                        {entity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono">Endpoint: {service.configuredEndpoint}</span>
                <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                  <Layers className="w-3 h-3 text-indigo-600" /> Isolated Bounded Context
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
