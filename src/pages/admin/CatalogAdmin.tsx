import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { GEM_VARIANTS, MATERIAL_CHOICES } from '../../data/products.ts'
import { supabase } from '../../lib/supabase.ts'
import { publicMediaUrl } from '../../lib/media.ts'
import { formatPhp } from '../../lib/format.ts'
import { LoadingScreen } from '../../components/ui/LoadingScreen.tsx'
import { friendlyError } from '../../lib/friendlyError.ts'
import { Card, MediaField, Notice, PageTitle, PrimaryButton, QuietButton, TextArea, TextField, fieldClass } from './ui.tsx'

type ProductRow = { id: string; name: string; price_cents: number; compare_at_price_cents: number | null; inventory_qty: number | null; status: string; sku: string | null }
type Collection = { id: string; name: string; description: string | null; image_path: string | null; featured: boolean; status: string; sort_order: number }
type OptionValue = { id: string; option_id: string; value: string }
type Option = { id: string; key: string; name: string; values: OptionValue[] }
type Variant = { id?: string; label: string; price: string; sku: string; inventory: string; options: Record<string, string> }

function pesos(cents: number | null) {
  if (cents == null) return ''
  return String(cents / 100)
}

function toCents(value: string) {
  if (!value.trim()) return null
  const number = Number(value)
  if (Number.isNaN(number)) return null
  return Math.round(number * 100)
}

const savedWait = 'Please wait a few seconds for it to appear on All products.'

function productSlug(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'product'
  return `${base}-${crypto.randomUUID().slice(0, 8)}`
}

export function ProductsAdmin() {
  const location = useLocation()
  const justSaved = Boolean((location.state as { justSaved?: boolean } | null)?.justSaved)
  const [rows, setRows] = useState<ProductRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(justSaved ? savedWait : null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const load = async () => {
    if (!supabase) return
    const newest = await supabase.from('products').select('id, name, price_cents, compare_at_price_cents, inventory_qty, status, sku, created_at').order('created_at', { ascending: false })
    const result = newest.error
      ? await supabase.from('products').select('id, name, price_cents, compare_at_price_cents, inventory_qty, status, sku').order('name')
      : newest
    if (result.error) setError(result.error.message)
    else setRows((result.data ?? []) as ProductRow[])
  }

  useEffect(() => {
    void load()
    const timer = window.setTimeout(() => { void load() }, 2500)
    return () => window.clearTimeout(timer)
  }, [])

  const removeProduct = async (row: ProductRow) => {
    setError(null)
    setOk(null)
    const { error: deleteError } = await supabase!.from('products').delete().eq('id', row.id)
    if (deleteError) setError(deleteError.message)
    else {
      setConfirmId(null)
      setOk(`${row.name} was deleted.`)
      await load()
    }
  }

  return (
    <div>
      <PageTitle title="Products" subtitle="Newest products are at the top. After you save one, please wait a few seconds for it to appear here." action={<Link to="/admin/products/new" className="rounded-lg bg-[#FF7900] px-3 py-2 text-sm font-semibold text-black">Add product</Link>} />
      <Notice error={error} ok={ok} />
      <Card>
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-[#8a8a8a]">
            <tr><th className="py-2">Product</th><th>Price</th><th>Stock</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#2a2a2a]">
                <td className="py-3">
                  <Link className="text-[#ffb067]" to={`/admin/products/${row.id}`}>{row.name}</Link>
                  {confirmId === row.id && (
                    <div className="mt-2 max-w-sm rounded-lg border border-[#443028] bg-[#1c1210] px-3 py-2">
                      <p className="text-sm text-[#f0d2c4]">Delete {row.name}? It leaves the shop. Past orders keep the item name.</p>
                      <div className="mt-2 flex gap-2">
                        <button type="button" className="rounded-lg bg-[#FF7900] px-3 py-1.5 text-xs font-semibold text-black" onClick={() => void removeProduct(row)}>Delete product</button>
                        <button type="button" className="rounded-lg border border-[#333] px-3 py-1.5 text-xs" onClick={() => setConfirmId(null)}>Keep it</button>
                      </div>
                    </div>
                  )}
                </td>
                <td>{formatPhp(row.price_cents)}</td>
                <td>{row.inventory_qty ?? 'Not tracked'}</td>
                <td>{row.status === 'active' ? 'On the shop' : row.status === 'draft' ? 'Hidden' : 'Archived'}</td>
                <td className="text-right">
                  <button type="button" className="text-xs text-[#ffb089]" onClick={() => setConfirmId(confirmId === row.id ? null : row.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

export function ProductEditor() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const isNew = !productId || productId === 'new'
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [compare, setCompare] = useState('')
  const [sku, setSku] = useState('')
  const [inventory, setInventory] = useState('')
  const [status, setStatus] = useState('active')
  const [material, setMaterial] = useState('Stainless 316L')
  const [images, setImages] = useState<string[]>([])
  const [collectionIds, setCollectionIds] = useState<string[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [options, setOptions] = useState<Option[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [custom, setCustom] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  useEffect(() => {
    if (!supabase) return
    void (async () => {
      const [collectionResult, optionResult, valueResult] = await Promise.all([
        supabase.from('collections').select('id, name, description, image_path, featured, status, sort_order').neq('status', 'archived').order('name'),
        supabase.from('variation_options').select('id, key, name').order('sort_order'),
        supabase.from('variation_option_values').select('id, option_id, value').order('sort_order'),
      ])
      if (collectionResult.error || optionResult.error || valueResult.error) {
        setError(collectionResult.error?.message || optionResult.error?.message || valueResult.error?.message || '')
        return
      }
      setCollections((collectionResult.data ?? []) as Collection[])
      const values = (valueResult.data ?? []) as OptionValue[]
      let nextOptions = ((optionResult.data ?? []) as { id: string; key: string; name: string }[]).map((option) => ({
        ...option,
        values: values.filter((value) => value.option_id === option.id),
      }))
      const color = nextOptions.find((option) => option.key === 'color')
      if (color) {
        const known = new Set(GEM_VARIANTS.map((item) => item.label.toLowerCase()))
        const extras = color.values.filter((value) => !known.has(value.value.toLowerCase()))
        nextOptions = nextOptions.map((option) => option.id === color.id ? {
          ...option,
          values: [
            ...GEM_VARIANTS.map((item) => color.values.find((value) => value.value.toLowerCase() === item.label.toLowerCase()) ?? { id: `color-${item.key}`, option_id: color.id, value: item.label }),
            ...extras,
          ],
        } : option)
        const saved = await supabase.from('variation_option_values').upsert(
          [...GEM_VARIANTS.map((item, index) => ({ option_id: color.id, value: item.label, sort_order: index + 1 })), ...extras.map((value, index) => ({ option_id: color.id, value: value.value, sort_order: GEM_VARIANTS.length + index + 1 }))],
          { onConflict: 'option_id,value' },
        )
        if (!saved.error) {
          const refreshed = await supabase.from('variation_option_values').select('id, option_id, value').eq('option_id', color.id).order('sort_order')
          if (!refreshed.error && refreshed.data) {
            nextOptions = nextOptions.map((option) => option.id === color.id ? { ...option, values: refreshed.data as OptionValue[] } : option)
          }
        }
      }
      const materialOption = nextOptions.find((option) => option.key === 'material')
      if (materialOption) {
        const known = new Set(MATERIAL_CHOICES.map((label) => label.toLowerCase()))
        const extras = materialOption.values.filter((value) => !known.has(value.value.toLowerCase()))
        nextOptions = nextOptions.map((option) => option.id === materialOption.id ? {
          ...option,
          values: [
            ...MATERIAL_CHOICES.map((label) => materialOption.values.find((value) => value.value.toLowerCase() === label.toLowerCase()) ?? { id: `material-${label}`, option_id: materialOption.id, value: label }),
            ...extras,
          ],
        } : option)
        const saved = await supabase.from('variation_option_values').upsert(
          [...MATERIAL_CHOICES.map((label, index) => ({ option_id: materialOption.id, value: label, sort_order: index + 1 })), ...extras.map((value, index) => ({ option_id: materialOption.id, value: value.value, sort_order: MATERIAL_CHOICES.length + index + 1 }))],
          { onConflict: 'option_id,value' },
        )
        if (!saved.error) {
          const refreshed = await supabase.from('variation_option_values').select('id, option_id, value').eq('option_id', materialOption.id).order('sort_order')
          if (!refreshed.error && refreshed.data) {
            nextOptions = nextOptions.map((option) => option.id === materialOption.id ? { ...option, values: refreshed.data as OptionValue[] } : option)
          }
        }
      }
      setOptions(nextOptions)
      if (isNew) return
      const [product, pics, links, vars] = await Promise.all([
        supabase.from('products').select('name, description, price_cents, compare_at_price_cents, sku, inventory_qty, status, material, image_path').eq('id', productId).maybeSingle(),
        supabase.from('product_images').select('storage_path, sort_order').eq('product_id', productId).order('sort_order'),
        supabase.from('product_collections').select('collection_id').eq('product_id', productId),
        supabase.from('product_variants').select('id, label, sku, price_cents, inventory_qty, options').eq('product_id', productId).order('sort_order'),
      ])
      if (product.error) {
        setError(product.error.message)
        return
      }
      if (!product.data) return
      setName(product.data.name)
      setDescription(product.data.description ?? '')
      setPrice(pesos(product.data.price_cents))
      setCompare(pesos(product.data.compare_at_price_cents))
      setSku(product.data.sku ?? '')
      setInventory(product.data.inventory_qty == null ? '' : String(product.data.inventory_qty))
      setStatus(product.data.status)
      setMaterial(product.data.material)
      const stored = (pics.data ?? []).map((pic) => pic.storage_path as string)
      setImages(stored.length ? stored : product.data.image_path ? [product.data.image_path] : [])
      setCollectionIds((links.data ?? []).map((link) => link.collection_id as string))
      setVariants((vars.data ?? []).map((variant) => ({
        id: variant.id as string,
        label: (variant.label as string) ?? '',
        price: pesos(variant.price_cents as number | null),
        sku: (variant.sku as string) ?? '',
        inventory: variant.inventory_qty == null ? '' : String(variant.inventory_qty),
        options: (variant.options as Record<string, string>) ?? {},
      })))
    })()
  }, [isNew, productId])

  const addCustom = async (option: Option) => {
    const value = custom[option.key]?.trim()
    if (!supabase || !value) return
    const { error: insertError } = await supabase.from('variation_option_values').insert({ option_id: option.id, value, sort_order: option.values.length + 1 })
    if (insertError) setError(insertError.message)
    else {
      setCustom({ ...custom, [option.key]: '' })
      const { data } = await supabase.from('variation_option_values').select('id, option_id, value').eq('option_id', option.id).order('sort_order')
      setOptions(options.map((item) => item.id === option.id ? { ...item, values: (data ?? []) as OptionValue[] } : item))
    }
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!supabase || !name.trim()) return
    const priceCents = toCents(price)
    if (priceCents == null) {
      setError('Enter a price in pesos.')
      return
    }
    setSaving(true)
    setError(null)
    setOk(null)
    const collection = collections.find((item) => item.id === collectionIds[0])
    const payload: Record<string, unknown> = {
      name: name.trim(),
      description: description || null,
      price_cents: priceCents,
      compare_at_price_cents: toCents(compare),
      inventory_qty: inventory.trim() ? Number(inventory) : null,
      status,
      published: status === 'active',
      material,
      category: collection?.name ?? 'General',
      image_path: images[0] || 'products/product-01.jpg',
    }
    if (sku.trim()) payload.sku = sku.trim()
    else if (isNew) payload.sku = `RBP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    if (isNew) payload.slug = productSlug(name.trim())
    const result = isNew
      ? await supabase.from('products').insert(payload).select('id').single()
      : await supabase.from('products').update(payload).eq('id', productId).select('id').single()
    if (result.error || !result.data) {
      setSaving(false)
      setError(friendlyError(result.error, 'The product could not be saved. Check the name and price, then try again.'))
      return
    }
    const id = result.data.id as string
    const links = await supabase.from('product_collections').delete().eq('product_id', id)
    const pictures = await supabase.from('product_images').delete().eq('product_id', id)
    const versions = await supabase.from('product_variants').delete().eq('product_id', id)
    const linkInsert = collectionIds.length
      ? await supabase.from('product_collections').insert(collectionIds.map((collectionId, index) => ({ product_id: id, collection_id: collectionId, sort_order: index })))
      : null
    const pictureInsert = images.length
      ? await supabase.from('product_images').insert(images.map((path, index) => ({ product_id: id, storage_path: path, sort_order: index })))
      : null
    const versionInsert = variants.length
      ? await supabase.from('product_variants').insert(variants.map((variant, index) => ({
        product_id: id,
        label: variant.label || Object.values(variant.options).filter(Boolean).join(' / ') || `Variant ${index + 1}`,
        variant_key: `${Object.values(variant.options).filter(Boolean).join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'variant'}-${index + 1}`,
        sku: variant.sku || null,
        price_cents: toCents(variant.price),
        inventory_qty: variant.inventory.trim() ? Number(variant.inventory) : null,
        options: variant.options,
        sort_order: index,
        status: 'active',
      })))
      : null
    const extraError = links.error || pictures.error || versions.error || linkInsert?.error || pictureInsert?.error || versionInsert?.error
    setSaving(false)
    if (extraError) {
      setError(friendlyError(extraError, 'The product was saved, but a photo or option could not be stored.'))
    }
    const shopNote = status === 'active'
      ? collectionIds.length
        ? savedWait
        : 'Saved. It is on the shop list. Choose a collection if it should also appear inside that collection.'
      : 'Saved. It stays in All products, but it is hidden from the shop until you choose On the shop.'
    setOk(shopNote)
    if (isNew) {
      window.setTimeout(() => {
        if (alive.current) navigate('/admin/products', { state: { justSaved: true } })
      }, 2500)
    }
  }

  const remove = async () => {
    if (!supabase || isNew || !window.confirm('Archive this product? Past orders keep their item names.')) return
    const { error: updateError } = await supabase.from('products').update({ status: 'archived', published: false, archived_at: new Date().toISOString() }).eq('id', productId)
    if (updateError) setError(updateError.message)
    else navigate('/admin/products')
  }

  const materialChoices = options.find((option) => option.key === 'material')?.values ?? []
  const statuses = [
    { id: 'active', label: 'On the shop', hint: 'Customers can buy it' },
    { id: 'draft', label: 'Hidden', hint: 'Only you can see it' },
    { id: 'archived', label: 'Archived', hint: 'Kept for old orders' },
  ]

  return (
    <form className="mx-auto max-w-6xl pb-24" onSubmit={save}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/admin/products" className="text-sm text-[#ffb067]">All products</Link>
          <h1 className="mt-1 text-2xl font-semibold text-white">{isNew ? 'New product' : name || 'Edit product'}</h1>
          <p className="mt-1 max-w-md text-sm text-[#9a9a9a]">After saving, please wait a few seconds for it to appear on All products.</p>
        </div>
        <PrimaryButton type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save product'}</PrimaryButton>
      </div>
      <nav className="mb-5 flex flex-wrap gap-2">
        {[
          ['details', '1. Name'],
          ['price', '2. Price'],
          ['photos', '3. Photos'],
          ['versions', '4. Options'],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-[#333] bg-[#161616] px-3 py-1.5 text-sm text-[#e8e8e8] hover:border-[#FF7900]">
            {label}
          </a>
        ))}
      </nav>
      {saving ? <LoadingScreen label="Saving" full /> : null}
      <Notice error={error} ok={ok} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <Card id="details" className="scroll-mt-4 space-y-4">
            <SectionHeading step="1" title="What is this product?" hint="The name is what customers see. You do not need to type a web address." />
            <TextField label="Name" hint="Example: Circular Barbell – Horseshoe" value={name} onChange={(event) => setName(event.target.value)} required />
            <TextArea label="Description" hint="A short note about the piece. Plain sentences are enough." value={description} onChange={(event) => setDescription(event.target.value)} />
          </Card>
          <Card id="photos" className="scroll-mt-4 space-y-4">
            <SectionHeading step="3" title="Photos" hint="The first photo is the one on the shop. Best size is 1200×1500, a tall 4:5 picture." />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((path, index) => (
                <figure key={path} className="overflow-hidden rounded-xl border border-[#333] bg-[#0c0c0c]">
                  <img src={publicMediaUrl(path)} alt="" className="aspect-[4/5] w-full object-contain" />
                  <figcaption className="flex items-center justify-between px-2 py-2 text-xs">
                    <span className="text-[#ffb067]">{index === 0 ? 'Main photo' : `Photo ${index + 1}`}</span>
                    <button type="button" className="text-[#ffb089]" onClick={() => setImages(images.filter((item) => item !== path))}>Remove</button>
                  </figcaption>
                </figure>
              ))}
              <div className="flex aspect-[4/5] flex-col justify-center rounded-xl border border-dashed border-[#444] bg-[#101010] p-3">
                <MediaField label="Add a photo" hint="JPG, PNG, or WebP." folder="products" accept="image/jpeg,image/png,image/webp" value="" onChange={(path) => setImages([...images, path])} />
              </div>
            </div>
          </Card>
          <Card id="versions" className="scroll-mt-4 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <SectionHeading step="4" title="Different versions" hint="Use this only when one product has more than one length, color, size, or gauge. Skip it if every piece is the same." />
              <QuietButton type="button" onClick={() => setVariants([...variants, { label: '', price, sku: '', inventory: '', options: {} }])}>Add a version</QuietButton>
            </div>
            {variants.length === 0 && <p className="rounded-lg bg-[#101010] px-3 py-3 text-sm text-[#b5b5b5]">No extra versions yet. The price on the right is what customers pay.</p>}
            {variants.map((variant, index) => (
              <div key={variant.id ?? index} className="space-y-3 rounded-xl border border-[#333] bg-[#101010] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Version {index + 1}</p>
                  <button type="button" className="text-xs text-[#ffb089]" onClick={() => setVariants(variants.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {options.map((option) => (
                    <label key={option.id} className="text-sm font-medium text-[#f0f0f0]">
                      {option.name}
                      <select
                        className={fieldClass}
                        value={variant.options[option.key] ?? ''}
                        onChange={(event) => setVariants(variants.map((item, itemIndex) => itemIndex === index ? { ...item, options: { ...item.options, [option.key]: event.target.value } } : item))}
                      >
                        <option value="">Same as the main product</option>
                        {option.values.map((value) => <option key={value.id} value={value.value}>{value.value}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <TextField label="Price for this version" hint="Leave the main price if it costs the same." value={variant.price} onChange={(event) => setVariants(variants.map((item, itemIndex) => itemIndex === index ? { ...item, price: event.target.value } : item))} />
                  <TextField label="Its own code" value={variant.sku} onChange={(event) => setVariants(variants.map((item, itemIndex) => itemIndex === index ? { ...item, sku: event.target.value } : item))} />
                  <TextField label="How many" value={variant.inventory} onChange={(event) => setVariants(variants.map((item, itemIndex) => itemIndex === index ? { ...item, inventory: event.target.value } : item))} />
                </div>
              </div>
            ))}
            <details className="rounded-xl border border-[#2a2a2a] bg-[#101010] p-4">
              <summary className="cursor-pointer text-sm font-medium text-white">Add a new choice, such as a color or a size</summary>
              <p className="mt-2 text-xs text-[#8d8d8d]">Saved choices show up in the menus above for every product.</p>
              <div className="mt-3 space-y-3">
                {options.map((option) => (
                  <div key={option.id} className="flex flex-wrap items-center gap-2">
                    <p className="w-24 text-sm text-[#d0d0d0]">{option.name}</p>
                    <input className="min-w-40 flex-1 rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm" placeholder={option.values[0]?.value ?? 'Type a new choice'} value={custom[option.key] ?? ''} onChange={(event) => setCustom({ ...custom, [option.key]: event.target.value })} />
                    <QuietButton type="button" onClick={() => void addCustom(option)}>Add</QuietButton>
                  </div>
                ))}
              </div>
            </details>
          </Card>
        </div>
        <aside className="space-y-5 lg:sticky lg:top-4">
          <Card id="price" className="scroll-mt-4 space-y-4">
            <SectionHeading step="2" title="Price and stock" hint="Type the amount in pesos. 165 means ₱165." />
            <TextField label="Selling price" value={price} onChange={(event) => setPrice(event.target.value)} />
            <TextField label="Old price" hint="Optional. Shows shoppers the price before a discount." value={compare} onChange={(event) => setCompare(event.target.value)} />
            <TextField label="Stock code" hint="Leave this empty and one is created for you." value={sku} onChange={(event) => setSku(event.target.value)} />
            <TextField label="Pieces in stock" hint="Leave this empty if you are not counting stock." value={inventory} onChange={(event) => setInventory(event.target.value)} />
          </Card>
          <Card className="space-y-3">
            <h2 className="text-sm font-semibold">Can customers see it?</h2>
            <div className="space-y-2">
              {statuses.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStatus(item.id)}
                  className={`block w-full rounded-xl border px-3 py-2 text-left ${status === item.id ? 'border-[#FF7900] bg-[#2a1608]' : 'border-[#333] bg-[#101010]'}`}
                >
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="block text-xs text-[#9a9a9a]">{item.hint}</span>
                </button>
              ))}
            </div>
          </Card>
          <Card className="space-y-3">
            <h2 className="text-sm font-semibold">Material</h2>
            <div className="flex flex-wrap gap-2">
              {(materialChoices.some((value) => value.value === material) ? materialChoices : [...materialChoices, { id: 'current', option_id: '', value: material }]).map((value) => (
                <button
                  key={value.id + value.value}
                  type="button"
                  onClick={() => setMaterial(value.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${material === value.value ? 'border-[#FF7900] bg-[#2a1608] text-white' : 'border-[#333] text-[#d0d0d0]'}`}
                >
                  {value.value}
                </button>
              ))}
            </div>
          </Card>
          <Card className="space-y-3">
            <h2 className="text-sm font-semibold">Which collection?</h2>
            <p className="text-xs text-[#8d8d8d]">Tap every group this jewelry belongs to.</p>
            <div className="flex flex-wrap gap-2">
              {collections.map((collection) => {
                const selected = collectionIds.includes(collection.id)
                return (
                  <button
                    key={collection.id}
                    type="button"
                    onClick={() => setCollectionIds(selected ? collectionIds.filter((id) => id !== collection.id) : [...collectionIds, collection.id])}
                    className={`rounded-full border px-3 py-1.5 text-sm ${selected ? 'border-[#FF7900] bg-[#2a1608] text-white' : 'border-[#333] text-[#d0d0d0]'}`}
                  >
                    {selected ? '✓ ' : ''}{collection.name}
                  </button>
                )
              })}
            </div>
          </Card>
          {!isNew && <QuietButton type="button" className="w-full" onClick={() => void remove()}>Archive this product</QuietButton>}
        </aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#2a2a2a] bg-[#111]/95 px-4 py-3 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="text-sm text-[#9a9a9a]">{ok || 'After saving, please wait a few seconds for it to appear on All products.'}</p>
          <PrimaryButton type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save product'}</PrimaryButton>
        </div>
      </div>
    </form>
  )
}

function SectionHeading({ step, title, hint }: { step: string; title: string; hint: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF7900] text-xs font-bold text-black">{step}</span>
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="mt-0.5 text-sm text-[#9a9a9a]">{hint}</p>
      </div>
    </div>
  )
}

export function CollectionsAdmin() {
  const [rows, setRows] = useState<Collection[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [featured, setFeatured] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const load = async () => {
    const { data, error: queryError } = await supabase!.from('collections').select('id, name, description, image_path, featured, status, sort_order').order('sort_order')
    if (queryError) setError(queryError.message)
    else setRows((data ?? []) as Collection[])
  }

  useEffect(() => { void load() }, [])

  const live = rows.filter((row) => row.status !== 'archived')
  const archived = rows.filter((row) => row.status === 'archived')

  const setFeaturedFlag = async (id: string, next: boolean) => {
    const { error: updateError } = await supabase!.from('collections').update({ featured: next }).eq('id', id)
    if (updateError) setError(updateError.message)
    else {
      if (editingId === id) setFeatured(next)
      await load()
    }
  }

  const clearForm = () => {
    setEditingId(null)
    setName('')
    setDescription('')
    setImage('')
    setFeatured(true)
  }

  const startEdit = (row: Collection) => {
    setConfirmId(null)
    setError(null)
    setOk(null)
    setEditingId(row.id)
    setName(row.name)
    setDescription(row.description ?? '')
    setImage(row.image_path ?? '')
    setFeatured(row.featured)
    document.getElementById('collection-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const removeCollection = async (row: Collection) => {
    setError(null)
    setOk(null)
    const { error: deleteError } = await supabase!.from('collections').delete().eq('id', row.id)
    if (deleteError) setError(deleteError.message)
    else {
      if (editingId === row.id) clearForm()
      setConfirmId(null)
      setOk(`${row.name} was deleted. The jewelry is still in the shop.`)
      await load()
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-white">Collections</h1>
        <p className="mt-1 text-sm text-[#9a9a9a]">A collection is a group of jewelry, such as Navel or Ear. Active groups show on the shop and the homepage.</p>
      </div>
      <Notice error={error} ok={ok} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          {live.map((row) => (
            <article key={row.id} className={`flex gap-4 rounded-xl border bg-[#161616] p-3 ${editingId === row.id ? 'border-[#FF7900]' : 'border-[#2a2a2a]'}`}>
              <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-[#0c0c0c]">
                {row.image_path ? (
                  <img src={publicMediaUrl(row.image_path)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-[#666]">No photo</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-white">{row.name}</p>
                <p className="mt-1 line-clamp-2 text-sm text-[#9a9a9a]">{row.description || 'No description yet.'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void setFeaturedFlag(row.id, !row.featured)}
                    className={`rounded-full border px-3 py-1 text-xs ${row.featured ? 'border-[#FF7900] bg-[#2a1608] text-white' : 'border-[#333] text-[#cfcfcf]'}`}
                  >
                    {row.featured ? 'Pinned first' : 'Pin to the front'}
                  </button>
                  <button type="button" className="rounded-full border border-[#333] px-3 py-1 text-xs text-[#cfcfcf]" onClick={() => startEdit(row)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-[#333] px-3 py-1 text-xs text-[#ffb089]"
                    onClick={async () => {
                      await supabase?.from('collections').update({ status: 'archived', featured: false }).eq('id', row.id)
                      await load()
                    }}
                  >
                    Hide
                  </button>
                  <button type="button" className="rounded-full border border-[#333] px-3 py-1 text-xs text-[#ffb089]" onClick={() => setConfirmId(confirmId === row.id ? null : row.id)}>
                    Delete
                  </button>
                </div>
                {confirmId === row.id && (
                  <div className="mt-3 rounded-lg border border-[#443028] bg-[#1c1210] px-3 py-2">
                    <p className="text-sm text-[#f0d2c4]">Delete {row.name}? The jewelry stays in the shop. Only this group is removed.</p>
                    <div className="mt-2 flex gap-2">
                      <button type="button" className="rounded-lg bg-[#FF7900] px-3 py-1.5 text-xs font-semibold text-black" onClick={() => void removeCollection(row)}>Delete group</button>
                      <button type="button" className="rounded-lg border border-[#333] px-3 py-1.5 text-xs" onClick={() => setConfirmId(null)}>Keep it</button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
          {archived.length > 0 && (
            <details className="rounded-xl border border-[#2a2a2a] bg-[#161616] p-4">
              <summary className="cursor-pointer text-sm text-[#cfcfcf]">Hidden collections ({archived.length})</summary>
              <ul className="mt-3 space-y-2 text-sm text-[#9a9a9a]">
                {archived.map((row) => (
                  <li key={row.id}>
                    <div className="flex items-center justify-between">
                      <span>{row.name}</span>
                      <span className="flex gap-3">
                        <button type="button" className="text-[#ffb067]" onClick={() => startEdit(row)}>Edit</button>
                        <button
                          type="button"
                          className="text-[#ffb067]"
                          onClick={async () => {
                            await supabase?.from('collections').update({ status: 'active' }).eq('id', row.id)
                            await load()
                          }}
                        >
                          Put back
                        </button>
                        <button type="button" className="text-[#ffb089]" onClick={() => setConfirmId(confirmId === row.id ? null : row.id)}>Delete</button>
                      </span>
                    </div>
                    {confirmId === row.id && (
                      <div className="mt-2 rounded-lg border border-[#443028] bg-[#1c1210] px-3 py-2">
                        <p className="text-sm text-[#f0d2c4]">Delete {row.name}? The jewelry stays in the shop.</p>
                        <div className="mt-2 flex gap-2">
                          <button type="button" className="rounded-lg bg-[#FF7900] px-3 py-1.5 text-xs font-semibold text-black" onClick={() => void removeCollection(row)}>Delete group</button>
                          <button type="button" className="rounded-lg border border-[#333] px-3 py-1.5 text-xs" onClick={() => setConfirmId(null)}>Keep it</button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
        <Card id="collection-form" className="space-y-4 lg:sticky lg:top-4">
          <div>
            <h2 className="text-base font-semibold text-white">{editingId ? 'Edit this collection' : 'Add a collection'}</h2>
            <p className="mt-1 text-sm text-[#9a9a9a]">{editingId ? 'Change the name, the short description, or the photo, then save.' : 'Name the group, then add a tall photo if you have one.'}</p>
          </div>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault()
              setError(null)
              setOk(null)
              const payload = {
                name: name.trim(),
                description: description.trim() || null,
                image_path: image || null,
                featured,
              }
              const result = editingId
                ? await supabase!.from('collections').update(payload).eq('id', editingId)
                : await supabase!.from('collections').insert({ ...payload, sort_order: rows.length + 1 })
              if (result.error) setError(result.error.message)
              else {
                setOk(editingId ? 'Collection updated.' : 'Collection added.')
                clearForm()
                await load()
              }
            }}
          >
            <TextField label="Name" hint="Example: Navel Jewelry" value={name} onChange={(event) => setName(event.target.value)} required />
            <TextArea label="Short description" hint="Optional. One or two sentences." value={description} onChange={(event) => setDescription(event.target.value)} />
            <MediaField label="Photo" hint="Best size 900×1200, a tall 3:4 picture." folder="collections" accept="image/jpeg,image/png,image/webp" value={image} onChange={setImage} />
            <button
              type="button"
              onClick={() => setFeatured((value) => !value)}
              className={`w-full rounded-xl border px-3 py-2 text-left ${featured ? 'border-[#FF7900] bg-[#2a1608]' : 'border-[#333] bg-[#101010]'}`}
            >
              <span className="block text-sm font-medium">{featured ? 'Pinned to the front of the homepage' : 'Shows with the other collections'}</span>
              <span className="block text-xs text-[#9a9a9a]">Every active collection is on the shop. Pin one to put it first.</span>
            </button>
            <div className="flex gap-2">
              <PrimaryButton type="submit" disabled={!name.trim()}>{editingId ? 'Save changes' : 'Add collection'}</PrimaryButton>
              {editingId && <QuietButton type="button" onClick={clearForm}>Cancel</QuietButton>}
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
