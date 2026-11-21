# Checkout extensibility

Checkout is not a theme. `checkout.liquid` is gone; everything merchant-facing on the checkout now goes through Checkout Extensibility: checkout UI extensions for interface, Shopify Functions for logic.

**Contents:** [What replaced checkout.liquid](#what-replaced-checkoutliquid) · [Checkout UI extensions](#checkout-ui-extensions) · [Adding a paid option](#adding-a-paid-option) · [Shopify Functions](#shopify-functions) · [Delivery customization](#delivery-customization) · [Payment customization](#payment-customization) · [Discounts](#discounts) · [Testing and rollout](#testing-and-rollout) · [Sources](#sources)

## What replaced checkout.liquid

| Old (removed) | Now |
|---------------|-----|
| `checkout.liquid` markup and styles | Checkout UI extensions + checkout branding API |
| `checkout.liquid` scripts | Web Pixels and checkout UI extensions |
| `checkout.liquid` logic for shipping/payment | Shopify Functions |
| Thank-you page scripts | `purchase.thank-you.*` extension targets |
| Order status page customization | Customer accounts extensions and order status extensibility |

Rules:

- Never propose `checkout.liquid`. It does not render, and saying otherwise destroys trust in every other answer you give.
- You cannot add arbitrary HTML, CSS or JavaScript to checkout. You compose from the checkout component library inside a sandboxed extension.
- Availability of specific targets and capabilities depends on the store's plan. Confirm the plan before designing a flow that depends on a Plus-only target.

## Checkout UI extensions

An extension is a small React (or vanilla JS) app that renders into a named target.

```toml
# shopify.extension.toml
api_version = "2026-10"

[[extensions]]
name = "Gift wrap"
handle = "gift-wrap"
type = "ui_extension"

  [[extensions.targeting]]
  target = "purchase.checkout.block.render"
  module = "./src/BlockExtension.jsx"
```

```jsx
import {
  reactExtension,
  useApi,
  Checkbox,
  BlockStack,
  Text,
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension('purchase.checkout.block.render', () => <App />);

function App() {
  const { applyAttributeChange, attributes } = useApi();
  const checked = attributes.current.some((a) => a.key === 'gift_wrap' && a.value === 'yes');

  return (
    <BlockStack>
      <Checkbox
        id="gift-wrap"
        checked={checked}
        onChange={(value) =>
          applyAttributeChange({ type: 'updateAttribute', key: 'gift_wrap', value: value ? 'yes' : 'no' })
        }
      >
        Add gift wrapping (+€5)
      </Checkbox>
      <Text size="small">Added as a cart attribute; the fee comes from the gift-wrap variant.</Text>
    </BlockStack>
  );
}
```

Common targets (see the targets reference for the full list):

| Target | Where it renders |
|--------|------------------|
| `purchase.checkout.block.render` | Anywhere the merchant places a block in the checkout editor |
| `purchase.checkout.cart-line-item.render-after` | Under each cart line |
| `purchase.checkout.contact.render-before` / `render-after` | Around the contact section |
| `purchase.checkout.delivery-option-item.render-after` | Under each shipping option |
| `purchase.checkout.payment-method-item.render-after` | Under each payment method |
| `purchase.checkout.shipping-option-list.render-before` | Above the shipping options |
| `purchase.thank-you.block.render` | Thank-you page |

Rules:

- Static targets render at fixed positions; block targets must be placed by the merchant in the checkout editor. If you use a block target, document that the merchant must add it.
- Mutations are async and can fail. Read the returned `userErrors` and revert the UI when the change is rejected.
- Use `applyCartLinesChange` for quantity and variant changes, `applyAttributeChange` for cart attributes, `applyDiscountCodeChange` for codes, `applyShippingAddressChange` for address fields.
- Never read or write customer data you do not need. Checkout data is the most sensitive data in the store.
- Extensions cannot make arbitrary network calls to unapproved domains; use the configured network access and an app backend for anything else.
- Keep the UI accessible: labels on every input, no colour-only state, no layout that breaks on mobile checkout.

## Adding a paid option

There is no "add a fee line with my own price" API. Choose one of these:

1. **A real product variant** (recommended for simple fees): create a hidden gift-wrap variant priced at €5, then `applyCartLinesChange({ type: 'addCartLine', merchandiseId, quantity: 1 })`. It behaves like any line: tax, refunds, inventory policy and reporting work.
2. **A Cart Transform Function**: for bundles and dynamic pricing, transform the cart to add or reprice lines. This is the only way to compute a price at checkout time rather than store it on a variant. Verify the exact operation shape against the current Functions API before implementing.
3. **A discount function** when the option lowers the price instead of adding a fee.

Never simulate a fee with a cart attribute only. An attribute is a note, not money: it does not appear in totals, taxes or reports.

## Shopify Functions

A Function is server-side logic compiled to WASM and run by Shopify at a defined point. It reads an input query, returns operations, and cannot call the network.

| Function | Runs on | Typical use |
|----------|---------|-------------|
| Cart transform | cart | Bundles, add-on lines, line price adjustments |
| Delivery customization | cart delivery options | Hide, rename or reorder shipping methods |
| Payment customization | payment methods | Hide, rename, reorder, sort payment methods |
| Cart line discount | cart lines | Buy X get Y, tiered line discounts |
| Cart order discount | order | Free shipping thresholds, order-level offers |
| Product discount | product page | Automatic product discounts |

```toml
# shopify.extension.toml
api_version = "2026-10"

[[extensions]]
name = "Hide express shipping for fragile items"
handle = "fragile-shipping"
type = "function"

  [[extensions.targeting]]
  target = "cart.delivery-options.transform.run"
  input_query = "src/run.graphql"
  export = "run"
```

Rules:

- Input queries request only what the function needs; the payload is capped.
- Functions must be deterministic and fast. No timers, no network, no randomness.
- Return operations only for entities present in the input. A handle that does not exist is a silent no-op or an error.
- Test with real carts, including mixed carts, discounts and multiple delivery groups.
- Functions cannot read customer PII beyond what the input query exposes. Do not request more.

## Delivery customization

Input: delivery groups with their options (handle, title, code, cost, description). Output: operations.

```graphql
# src/run.graphql — the input query
query RunInput {
  cart {
    lines {
      quantity
      merchandise {
        ... on ProductVariant {
          id
          product { tags }
        }
      }
    }
    deliveryGroups {
      deliveryOptions {
        handle
        title
        code
        cost { amount }
      }
    }
  }
}
```

The function returns operations for those handles: `hide`, `rename` or `move`. A fragile-item rule is: if any line's product has tag `fragile`, hide the express option handle.

Rules:

- Never hide every option. A cart with no delivery method cannot check out; validate that at least one option survives.
- Rename for clarity ("Express (not available for fragile items)") only when hiding would confuse the buyer.
- Reordering changes the default selection; test that the cheapest or promised option is still selected as intended.
- Localization: renamed titles are plain strings, not translated automatically. Provide translations yourself when the store sells in several languages.

## Payment customization

Same shape as delivery: read the payment methods available for the cart, return `hide`, `rename`, `move` or `sort` operations. Use it for minimum-order rules (hide cash on delivery above a threshold) or for method ordering. Never hide every method.

## Discounts

- Cart line discount functions return discount operations per line with a fixed amount or percentage.
- Order discount functions return order-level discounts, including free shipping.
- Discount functions do not stack arbitrarily: the merchant's discount combinations decide what can combine. Test with combinations enabled and disabled.
- The discount must be explainable to the buyer: the checkout shows the discount title from your function, so write a human title, not an internal code.

## Testing and rollout

```bash
shopify app dev            # runs the extension against a dev store checkout
shopify app deploy         # creates an app version with the extensions
```

- Test on a development store with the same plan as the merchant. A Plus-only target will not render on Basic.
- Test the checkout in every market the store sells in: currency, language, address rules and tax behaviour change the flow.
- Test with a discount, a sold-out line, a quantity change from the extension, and a rejected mutation.
- Roll out to a subset of buyers first when the merchant supports it, and watch checkout completion rate before and after.
- Keep the previous app version deployed until the new one has completed real orders.

## Sources

- https://shopify.dev/docs/apps/build/checkout — checkout extensibility overview (verified on 2026-11-20)
- https://shopify.dev/docs/api/checkout-ui-extensions/latest — components and APIs (verified on 2026-11-20)
- https://shopify.dev/docs/api/checkout-ui-extensions/latest/targets — extension targets (verified on 2026-11-20)
- https://shopify.dev/docs/apps/build/functions — Functions overview (verified on 2026-11-20)
- https://shopify.dev/docs/apps/build/functions/input-output — input queries and operations (verified on 2026-11-20)
- https://shopify.dev/docs/api/functions/latest/cart-transform — cart transform API (verified on 2026-11-20)
- https://shopify.dev/docs/api/functions/latest/delivery-customization — delivery customization API (verified on 2026-11-20)
