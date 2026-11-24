'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChangeEvent, FormEvent, useState } from 'react';
import { CheckCircle2, ImagePlus, Plus, Search, SlidersHorizontal, Trash2, Upload } from 'lucide-react';
import { useResource } from '@/lib/use-resource';
import { commerceRequest, jsonBody, money, Store } from '@/lib/commerce-api';
import { RemoteError } from '@/components/RemoteState';

type ProductImageRecord = {
  id?: string;
  url: string;
  altText?: string;
  isPrimary?: boolean;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  status: string;
  basePrice: string | number;
  frameShape?: string;
  frameAsset?: unknown;
  variants: Array<{
    id: string;
    sku: string;
    color: string;
    size: string;
    images?: ProductImageRecord[];
    inventory: Array<{ storeId: string; availableQuantity: number }>;
  }>;
};

type Option = { id: string; name: string };

function readFileAsBase64(file: File): Promise<{ base64: string; mimeType: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.split(',')[1] || '';
      resolve({ base64, mimeType: file.type || 'image/png', previewUrl: result });
    };
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.readAsDataURL(file);
  });
}

export default function AdminCatalogPage() {
  const products = useResource<Product[]>('/admin/products');
  const stores = useResource<Store[]>('/stores');
  const categories = useResource<Option[]>('/catalog/categories');
  const brands = useResource<Option[]>('/catalog/brands');

  const [search, setSearch] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadingVariantId, setUploadingVariantId] = useState<string | null>(null);
  const [draftImage, setDraftImage] = useState<{
    base64: string;
    mimeType: string;
    previewUrl: string;
    fileName: string;
  } | null>(null);

  async function onDraftImageSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please choose a JPG, PNG, or WebP frame image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Frame image must be 10 MB or smaller.');
      return;
    }
    try {
      setError('');
      const parsed = await readFileAsBase64(file);
      setDraftImage({ ...parsed, fileName: file.name });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const created = await commerceRequest<{ id: string; name: string }>('/admin/products', {
        method: 'POST',
        body: jsonBody({
          ...fields,
          basePrice: Number(fields.basePrice),
          stock: Number(fields.stock),
        }),
      });
      if (draftImage && created.id) {
        await commerceRequest(`/admin/products/${encodeURIComponent(created.id)}/images`, {
          method: 'POST',
          body: jsonBody({
            base64: draftImage.base64,
            mimeType: draftImage.mimeType,
            isPrimary: true,
            altText: String(fields.name || 'Frame photo'),
          }),
        });
      }
      setShow(false);
      setDraftImage(null);
      setNotice(`Created "${created.name}"${draftImage ? ' with frame photo' : ''}.`);
      products.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadVariantImage(
    productId: string,
    variantId: string,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, or WebP images are supported.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be 10 MB or smaller.');
      return;
    }

    setUploadingVariantId(variantId);
    setError('');
    setNotice('');
    try {
      const parsed = await readFileAsBase64(file);
      await commerceRequest(`/admin/products/${encodeURIComponent(productId)}/images`, {
        method: 'POST',
        body: jsonBody({
          variantId,
          base64: parsed.base64,
          mimeType: parsed.mimeType,
          altText: file.name.replace(/\.[^.]+$/, ''),
        }),
      });
      setNotice(`Uploaded frame photo "${file.name}".`);
      products.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploadingVariantId(null);
    }
  }

  async function deleteImage(productId: string, imageId: string) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await commerceRequest(
        `/admin/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
        { method: 'DELETE' },
      );
      setNotice('Frame image removed.');
      products.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function status(id: string, nextStatus: string) {
    setBusy(true);
    setError('');
    try {
      await commerceRequest(`/admin/products/${id}/status`, {
        method: 'PUT',
        body: jsonBody({ status: nextStatus }),
      });
      products.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function stock(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError('');
    try {
      await commerceRequest(`/admin/inventory/${id}`, {
        method: 'PUT',
        body: jsonBody({ storeId: values.storeId, quantity: Number(values.quantity) }),
      });
      setNotice('Inventory updated.');
      products.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Catalogue, Frame Images &amp; Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Add frames, upload product photos (JPG/PNG/WebP), attach transparent try-on overlays, and set store stock.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:opacity-95"
        >
          <Plus className="w-4 h-4" />
          {show ? 'Cancel' : 'Add Frame Product'}
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          aria-label="Search products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search frame name or SKU..."
          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm"
        />
      </div>

      {error || products.error ? (
        <RemoteError message={error || products.error} retry={products.reload} />
      ) : null}

      {notice && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {notice}
          </span>
          <button type="button" onClick={() => setNotice('')} className="text-xs font-bold text-emerald-700">
            Dismiss
          </button>
        </div>
      )}

      {show ? (
        <form onSubmit={create} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <h2 className="text-lg font-bold text-slate-900">New Frame Product</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['name', 'Product name'],
              ['slug', 'URL slug (lowercase-with-hyphens)'],
              ['sku', 'SKU'],
              ['color', 'Color'],
              ['size', 'Size (e.g. Medium 52-18-145)'],
              ['basePrice', 'Price (NPR)'],
              ['stock', 'Opening stock'],
              ['frameShape', 'Frame shape (e.g. Rectangle, Round)'],
              ['description', 'Description'],
            ].map(([name, label]) => (
              <label key={name} className="block text-xs font-semibold text-slate-700">
                {label}
                <input
                  name={name}
                  required={!['description', 'frameShape'].includes(name!)}
                  type={['stock', 'basePrice'].includes(name!) ? 'number' : 'text'}
                  min="0"
                  step={name === 'basePrice' ? '0.01' : '1'}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal"
                />
              </label>
            ))}

            <label className="block text-xs font-semibold text-slate-700">
              Store
              <select
                required
                name="storeId"
                className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal"
              >
                {stores.data?.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold text-slate-700">
              Category
              <select
                name="categoryId"
                className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal"
              >
                <option value="">Uncategorized</option>
                {categories.data?.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold text-slate-700">
              Brand
              <select
                name="brandId"
                className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal"
              >
                <option value="">Unbranded</option>
                {brands.data?.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Frame Image Upload on Creation */}
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {draftImage ? (
                <Image
                  src={draftImage.previewUrl}
                  alt="Frame preview"
                  width={120}
                  height={54}
                  unoptimized
                  className="h-14 w-28 rounded-lg border bg-white object-contain p-1"
                />
              ) : (
                <div className="h-14 w-28 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400">
                  <ImagePlus className="w-6 h-6" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {draftImage ? draftImage.fileName : 'Primary Frame Photo (Optional)'}
                </p>
                <p className="text-xs text-slate-500">
                  JPG, PNG, or WebP up to 10 MB. Displayed across Catalog, POS, and Storefront.
                </p>
              </div>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100">
              <Upload className="w-4 h-4 text-indigo-600" />
              {draftImage ? 'Change Photo' : 'Choose Frame Image'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => void onDraftImageSelect(e)}
              />
            </label>
          </div>

          <button
            disabled={busy}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:opacity-95 disabled:opacity-50"
          >
            {busy ? 'Saving...' : 'Save Frame Product'}
          </button>
        </form>
      ) : null}

      {products.loading ? <p className="text-sm text-slate-500">Loading products…</p> : null}

      <div className="space-y-4">
        {products.data
          ?.filter((product) =>
            `${product.name} ${product.variants.map((v) => v.sku).join(' ')}`
              .toLowerCase()
              .includes(search.toLowerCase()),
          )
          .map((product) => (
            <article key={product.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-xl font-bold text-slate-900">{product.name}</h2>
                    {product.frameAsset ? (
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        Try-On Calibrated
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{money(product.basePrice)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                    href={`/try-on?manageProduct=${product.id}`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Upload &amp; calibrate try-on frame
                  </Link>

                  <label className="text-xs font-semibold text-slate-600">
                    Status
                    <select
                      disabled={busy}
                      value={product.status}
                      onChange={(e) => void status(product.id, e.target.value)}
                      className="ml-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                    >
                      {['DRAFT', 'PUBLISHED', 'ARCHIVED'].map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {product.variants.map((variant) => {
                const variantImages = variant.images ?? [];
                const isUploading = uploadingVariantId === variant.id;
                return (
                  <div key={variant.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-sm font-bold text-slate-900">
                        {variant.sku} · {variant.color} · {variant.size}
                      </h3>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800">
                        <ImagePlus className="w-3.5 h-3.5" />
                        {isUploading ? 'Uploading…' : 'Add Frame Photo'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={isUploading || busy}
                          className="sr-only"
                          onChange={(e) => void uploadVariantImage(product.id, variant.id, e)}
                        />
                      </label>
                    </div>

                    {/* Variant Image Gallery */}
                    <div className="flex flex-wrap gap-3">
                      {variantImages.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">
                          No product photos uploaded yet. Click &ldquo;Add Frame Photo&rdquo; to upload JPG, PNG, or WebP.
                        </p>
                      ) : (
                        variantImages.map((img, idx) => (
                          <div
                            key={img.id ?? `${img.url}-${idx}`}
                            className="group relative h-24 w-32 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5"
                          >
                            <Image
                              src={img.url}
                              alt={img.altText || product.name}
                              width={128}
                              height={96}
                              unoptimized
                              className="h-full w-full object-contain"
                            />
                            {img.isPrimary && (
                              <span className="absolute top-1 left-1 rounded bg-slate-900/85 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                Primary
                              </span>
                            )}
                            {img.id && (
                              <button
                                type="button"
                                onClick={() => void deleteImage(product.id, img.id!)}
                                title="Remove frame image"
                                className="absolute top-1 right-1 rounded-md bg-rose-600 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Store Stock */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                      <div className="text-xs text-slate-700 space-y-0.5">
                        {variant.inventory.map((row) => (
                          <p key={row.storeId}>
                            <span className="font-semibold">
                              {stores.data?.find((store) => store.id === row.storeId)?.name ?? row.storeId}:
                            </span>{' '}
                            {row.availableQuantity} available
                          </p>
                        ))}
                      </div>
                      <form onSubmit={(e) => void stock(e, variant.id)} className="flex flex-wrap gap-2">
                        <select
                          aria-label="Inventory store"
                          name="storeId"
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                        >
                          {stores.data?.map((store) => (
                            <option key={store.id} value={store.id}>
                              {store.name}
                            </option>
                          ))}
                        </select>
                        <input
                          aria-label="Set available quantity"
                          type="number"
                          name="quantity"
                          required
                          min="0"
                          step="1"
                          placeholder="Qty"
                          className="w-24 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                        />
                        <button
                          disabled={busy}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-100"
                        >
                          Set stock
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </article>
          ))}
      </div>
    </div>
  );
}
