'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
type Option = { label: string; value: string };
function FilterGroup({ title, paramKey, options }: { title: string; paramKey: string; options: Option[] }) {
  const router = useRouter(); const search = useSearchParams();
  function toggle(value: string) { const query = new URLSearchParams(search.toString()); if(query.get(paramKey) === value) query.delete(paramKey); else query.set(paramKey,value); router.push(`?${query}`); }
  return <fieldset className="border-b py-4"><legend className="font-semibold">{title}</legend><div className="mt-3 space-y-2">{options.map(option => <label key={option.value} className="flex items-center gap-3"><input type="checkbox" checked={search.get(paramKey)===option.value} onChange={()=>toggle(option.value)} />{option.label}</label>)}</div></fieldset>;
}
export function ProductFilters({ brands, frameShapes }: { brands: Array<{name:string;slug:string}>; frameShapes:string[] }) {
  const [open,setOpen] = useState(false); const search = useSearchParams(); const router = useRouter();
  return <aside><button className="mb-4 rounded border p-2 lg:hidden" aria-expanded={open} onClick={()=>setOpen(value=>!value)}>Filters</button><div className={`${open?'block':'hidden'} lg:block`}><div className="flex justify-between"><h2 className="font-bold">Filters</h2>{search.size ? <button className="text-sm underline" onClick={()=>router.push('?')}>Clear all</button>:null}</div><FilterGroup title="Brand" paramKey="brand" options={brands.map(brand=>({label:brand.name,value:brand.slug}))}/><FilterGroup title="Frame shape" paramKey="frameShape" options={frameShapes.map(shape=>({label:shape,value:shape}))}/><FilterGroup title="Gender" paramKey="gender" options={['Men','Women','Unisex'].map(value=>({label:value,value}))}/></div></aside>;
}
