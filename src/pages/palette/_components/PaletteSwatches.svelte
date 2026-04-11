<script lang="ts">
  import { flavors } from "@catppuccin/palette";
  import CopyToClipboardButton from "./CopyToClipboardButton.svelte";

  import { toHsl, toOklch, toRgb } from "../utils";

  const specification = Object.entries(flavors.mocha.colors).map(([colorName, color]) => ({
    id: `card-${colorName}`,
    name: color.name,
    swatches: Object.entries(flavors).map(([swatchFlavor, swatch]) => ({
      flavor: swatchFlavor,
      color: swatch.colors[colorName],
      id: colorName,
    })),
  }));
</script>

<section>
  {#each specification as role}
    <div class="card" id={role.id}>
      <div class="card-header">
        <h2>{role.name}</h2>
      </div>

      <div class="card-swatches">
        {#each role.swatches as swatch}
          <div class="color-circle" tabindex="0" style="background-color: {swatch.color.hex}; anchor-name: --{swatch.flavor}-{swatch.id};" aria-describedby="swatch-overlay-{swatch.flavor}-{swatch.id}" id="swatch-{swatch.flavor}-{swatch.id}" title={swatch.flavor}>
            <div class="overlay" style="position-anchor: --{swatch.flavor}-{swatch.id};" id="swatch-overlay-{swatch.flavor}-{swatch.id}">
              <CopyToClipboardButton value={swatch.color.hex}>
                hex {swatch.color.hex}
              </CopyToClipboardButton>
              <CopyToClipboardButton value={toRgb(swatch.color.rgb)}>
                rgb {toRgb(swatch.color.rgb)}
              </CopyToClipboardButton>
              <CopyToClipboardButton value={toHsl(swatch.color.hsl)}>
                hsl {toHsl(swatch.color.hsl)}
              </CopyToClipboardButton>
              <CopyToClipboardButton value={toOklch(swatch.color.oklch)}>
                oklch {toOklch(swatch.color.oklch)}
              </CopyToClipboardButton>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/each}
</section>

<style lang="scss">
  @use "../../../styles/utils";

  section {
    @include utils.grid(250px, var(--space-sm));
  }

  .card {
    border-radius: var(--border-radius-normal);
    background-color: var(--mantle);
    padding: var(--space-sm);

    .card-swatches {
      display: flex;
    }

    .color-circle {
      height: 4rem;
      width: 4rem;
      border: 2px solid hsl(0 0% 50% / 0.2);
      border-radius: 50%;
      box-shadow: 0 0 0 2px var(--mantle);
      position: relative;
      &:not(:last-child) {
        margin-inline-end: calc(-1 * var(--space-xs));
      }
      // Hover trap
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: all;
      }
      .overlay {
        background-color: var(--surface0);
        border: 1px solid var(--overlay0);
        display: none;
        top: 4rem;
        left: 0;
        position: absolute;
        @supports (position-anchor: --xyz) {
          position: fixed;
          position-area: right bottom;
          position-try-fallbacks: flip-inline, flip-block;
          top: auto;
          // I don't know how to properly do this
          left: -4rem;
        }
      }
      &:hover, &:focus-within {
        .overlay {
          display: flex;
          flex-direction: column;
          align-items: start;
          z-index: 5;
        }
      }
    }
  }
</style>
