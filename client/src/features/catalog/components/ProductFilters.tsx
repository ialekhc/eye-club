'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterGroupProps {
  title: string;
  options: FilterOption[];
  paramKey: string;
}

export function ProductFilters({ brands, frameShapes }: { brands: any[], frameShapes: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (params.get(name) === value) {
        params.delete(name);
      } else {
        params.set(name, value);
      }
      return params.toString();
    },
    [searchParams]
  );

  const FilterGroup = ({ title, options, paramKey }: FilterGroupProps) => {
    const current = searchParams.get(paramKey);
    return (
      <div className="border-b py-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center justify-between">
          {title}
        </h3>
        <div className="flex flex-col gap-2">
          {options.map((opt) => {
            const isActive = current === opt.value;
            return (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isActive ? 'bg-primary border-primary text-white' : 'border-input group-hover:border-primary'}`}>
                  {isActive && <div className="w-2 h-2 rounded-sm bg-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={isActive} 
                  onChange={() => {
                    router.push('?' + createQueryString(paramKey, opt.value));
                  }} 
                />
                <span className={`text-sm ${isActive ? 'font-medium text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                  {opt.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between lg:hidden mb-4">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm font-medium border px-4 py-2 rounded-lg"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
      </div>

      <div className={`${isOpen ? 'block' : 'hidden'} lg:block sticky top-24`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Filters</h2>
          {Array.from(searchParams.keys()).length > 0 && (
            <button 
              onClick={() => router.push('?')}
              className="text-xs text-muted-foreground hover:text-primary underline"
            >
              Clear All
            </button>
          )}
        </div>
        
        <FilterGroup 
          title="Brand" 
          paramKey="brand" 
          options={brands.map(b => ({ label: b.name, value: b.slug }))} 
        />
        
        <FilterGroup 
          title="Frame Shape" 
          paramKey="frameShape" 
          options={frameShapes.map(s => ({ label: s, value: s }))} 
        />

        <FilterGroup 
          title="Gender" 
          paramKey="gender" 
          options={[
            { label: 'Men', value: 'Men' },
            { label: 'Women', value: 'Women' },
            { label: 'Unisex', value: 'Unisex' }
          ]} 
        />
      </div>
    </div>
  );
}
