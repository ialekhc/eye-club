'use client';
import { useResource } from '@/lib/use-resource';
import { RemoteError } from '@/components/RemoteState';
type Analytics = { windowDays:number;events:number;sessions:number;byType:Array<{eventType:string;_count:number}> };
export default function AnalyticsPage() {
 const {data,error,loading,reload}=useResource<Analytics>('/admin/analytics');
 return <section><h1 className="mb-6 text-3xl font-bold">Try-on analytics</h1>{error?<RemoteError message={error} retry={reload}/>:null}{loading?<p>Loading analytics…</p>:null}{data?<><p>Last {data.windowDays} days: {data.sessions} sessions · {data.events} events</p><div className="mt-6 space-y-4">{data.byType.map(row=><div key={row.eventType} className="rounded-xl border bg-white p-4"><p>{row.eventType.replaceAll('_',' ')}: {row._count}</p><meter aria-label={row.eventType} value={row._count} max={Math.max(data.events,1)} className="mt-2 w-full"/></div>)}</div><p className="mt-6 text-sm text-slate-600">Events cover merchant collection sessions. Photos and face landmarks are never included.</p></>:null}</section>;
}
