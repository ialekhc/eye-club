# Virtual Try-On Widget

The widget is a dependency-free browser bundle. A merchant can include it with:

```html
<script src="https://cdn.example.com/tryon.js" data-origin="https://tryon.example.com" data-public-key="PUBLIC_WIDGET_KEY"></script>
<button data-virtual-tryon data-product="PUBLIC_PRODUCT_ID" data-organization="PUBLIC_ORGANIZATION_SLUG">
  Virtual Try-On
</button>
```

The bundle opens the hosted `/try-on` experience in an accessible modal and passes public product context and widget key in the URL. The API exposes `GET /api/v1/widget/config/:publicKey` for public configuration lookup. It never receives private API credentials. Production deployment should serve the bundle from a versioned CDN and enforce an organization origin allowlist on the public configuration endpoint.
