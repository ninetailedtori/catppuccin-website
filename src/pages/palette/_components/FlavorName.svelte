<script lang="ts">
  import { type FlavorName as FlavorNameType, flavors } from "@catppuccin/palette";

  interface Props {
    flavor: FlavorNameType;
    bold?: boolean;
  }

  let { flavor, bold = true }: Props = $props();
  const flavorName = flavors[flavor].name;
  const emoji = {
    latte: "🌻",
    frappe: "🪴",
    macchiato: "🌺",
    mocha: "🌿"
  } as const;
</script>

<span data-flavor={flavor}>
  {emoji[flavor]}
  {#if bold}
  <strong>{flavorName}</strong>
  {:else}
  {flavorName}
  {/if}
</span>

<style lang="scss">
  span {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  strong {
    font-weight: 600;
  }
</style>
