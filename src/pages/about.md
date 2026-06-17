---
title: About
---

<script setup>
const { t } = useI18n()
useHead({ title: () => t('button.about') })
</script>

<div class="text-center">
  <!-- You can use Vue components inside markdown -->
  <div i-carbon-dicom-overlay class="text-4xl -mb-6 m-auto" />
  <h3>{{ t('button.about') }}</h3>
</div>

Vibe Coding is a prompt and page generation workbench for building coding workflows quickly.
It keeps the existing file-based routing, component auto importing, markdown support, I18n, PWA, and UnoCSS setup.

```js
// syntax highlighting example
function vitesse() {
  const foo = 'bar'
  console.log(foo)
}
```

Check out the [GitHub repo](https://github.com/antfu/vitesse) for more details.
