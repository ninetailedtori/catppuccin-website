<script lang="ts">
  import { flavorEntries } from "@catppuccin/palette";
  import CopyToClipboardIcon from "./CopyToClipboardButton.svelte";
  import FlavorName from "./FlavorName.svelte";
  import { toHsl, toOklch, toRgb } from "../utils";

  let hoveredColor = $state<string | null>( null );
</script>

<section class="flavor-grid">
  {#each flavorEntries as [ flavorName, flavor ]}
    <div class="flavor">
      <details open>
        <summary>
          <h2 id={`flavor-${flavorName}`} class="flavor-name">
            <FlavorName flavor={flavorName} bold={false} />
          </h2>
        </summary>
        <div class="table-wrapper">
          <table class="color-list" cellspacing="0">
            <thead>
            <tr class="color-list-header">
              <th>Color</th>
              <th>Hex</th>
              <th>RGB</th>
              <th>HSL</th>
              <th>OKLCH</th>
            </tr>
            </thead>
            <tbody>
            {#each Object.values( flavor.colors ) as { hex, rgb, hsl, oklch, name }}
              {@const colorKey = `${flavorName}-${name}`}
              {@const isHovered = hoveredColor === colorKey}
              <tr
                class="color-list-entry"
                class:hovering={isHovered}
                style:--current-color={hex}
                onpointerenter={() => (hoveredColor = colorKey)}
                onpointerleave={() => (hoveredColor = null)}
              >
                <td class="color">
                  <h5 class="color-name" style:--__current-color={hex}>
                    {name}
                  </h5>
                </td>
                <td class="color-hex">
                  <CopyToClipboardIcon value={hex}>
                    {hex}
                  </CopyToClipboardIcon>
                </td>
                <td class="color-rgb">
                  <CopyToClipboardIcon value={toRgb(rgb)}>
                    {toRgb( rgb )}
                  </CopyToClipboardIcon>
                </td>
                <td class="color-hsl">
                  <CopyToClipboardIcon value={toHsl(hsl)}>
                    {toHsl( hsl )}
                  </CopyToClipboardIcon>
                </td>
                <td class="color-oklch">
                  <CopyToClipboardIcon value={toOklch(oklch)}>
                    {toOklch( oklch )}
                  </CopyToClipboardIcon>
                </td>
              </tr>
            {/each}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  {/each}
</section>

<style lang="scss">
  @use "@styles/utils";

  :root {
    --accent-color: var(--mauve);
    --transition-duration: 0.2s;
    --transition-easing: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  @media (prefers-reduced-motion: reduce) {
    :root {
      --transition-duration: 0s;
    }
  }

  summary {
    cursor: pointer;
    user-select: none;
  }

  .flavor {
    @include utils.containerPadding();
    margin-block-start: var(--space-md);
    border-radius: var(--border-radius-normal);
    background: var(--mantle);
  }

  .table-wrapper {
    overflow-x: auto;
  }

  .flavor-name,
  .color-name {
    text-transform: capitalize;
  }

  .flavor-name {
    font-size: inherit;
  }

  .color-list {
    margin-block-start: var(--space-md);
    margin-inline: auto;
    border-collapse: collapse;
  }

  .color-list-entry {
    --__current-color: var(--current-color, var(--text));
    transition: background-color var(--transition-duration) var(--transition-easing);

    &:focus-within {
      background-color: color-mix(in srgb, var(--surface0) 50%, transparent);
    }

    &.hovering {
      background-color: color-mix(in srgb, var(--surface0) 80%, transparent);

      .color-name::before {
        transform: scale(1.5) translateY(calc(-50% + 3px));
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
    }

    td {
      padding: var(--space-xs) var(--space-sm);
    }
  }

  .color-name {
    position: relative;
    margin: 0;
    padding: 0;
    padding-inline-start: 3rem;

    &::before {
      content: "";
      position: absolute;
      inset-inline-start: 0;
      inset-block-start: 50%;
      transform: translate3d(0, -50%, 0);

      width: 2rem;
      aspect-ratio: 1;
      border-radius: 50%;
      border: 1px solid hsla(from var(--overlay0) h s l / 20%);
      background-color: var(--__current-color);

      will-change: transform, box-shadow;
      transition: transform var(--transition-duration) cubic-bezier(0.34, 1.56, 0.64, 1),
      box-shadow var(--transition-duration) ease-out;
    }
  }
</style>
