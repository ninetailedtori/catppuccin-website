<script lang="ts">
  import { type ColorFormat, flavors } from "@catppuccin/palette";
  import CopyToClipboardButton from "./CopyToClipboardButton.svelte";
  import { toHsl, toOklch, toRgb } from "../utils";

  const mochaColors = flavors.mocha.colors as Record<string, ColorFormat>;

  const specification = Object.entries( mochaColors ).map( ( [ colorName, color ] ) => ( {
    id: `card-${colorName}`,
    name: color.name,
    swatches: Object.entries( flavors ).map( ( [ swatchFlavor, swatch ] ) => ( {
      flavor: swatchFlavor,
      color: ( swatch.colors as Record<string, ColorFormat> )[colorName],
      id: colorName
    } ) )
  } ) );

  interface OverlayPosition {
    top: number;
    left: number;
  }

  let overlayPositions: Record<string, OverlayPosition> = $state( {} );
  let hoveredSwatch = $state<string | null>( null );
  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  function clearWithDelay() {
    if ( hideTimer ) clearTimeout( hideTimer );
    hideTimer = setTimeout( () => {
      hoveredSwatch = null;
      hideTimer = null;
    }, 50 );
  }

  function getSwatchKey( flavorName: string, colorId: string ): string {
    return `${flavorName}-${colorId}`;
  }

  let clickedSwatch = $state<string | null>( null );

  function toggleSwatchClick( swatchKey: string ) {
    if ( clickedSwatch === swatchKey ) {
      clickedSwatch = null;
    } else {
      clickedSwatch = swatchKey;
    }
  }

  function closeClickedSwatch() {
    clickedSwatch = null;
  }

  function updateOverlayPos( buttonId: string ) {
    const button = document.getElementById( `swatch-${buttonId}` );
    const overlay = document.getElementById( `swatch-overlay-${buttonId}` );
    if ( !button || !overlay ) return;

    requestAnimationFrame( () => {
      const rect = button.getBoundingClientRect();
      const overlayWidth = overlay.offsetWidth || 200;
      const padding = 8;
      let left = rect.left + rect.width / 2;
      const minLeft = overlayWidth / 2 + padding;
      const maxLeft = window.innerWidth - overlayWidth / 2 - padding;
      left = Math.max( minLeft, Math.min( maxLeft, left ) );

      overlayPositions[buttonId] = {
        top: rect.bottom + 8,
        left: left
      };
    } );
  }

  function getOverlayPos( swatchKey: string ): OverlayPosition {
    return overlayPositions[swatchKey] || { top: 0, left: 0 };
  }

  $effect( () => {
    const activeSwatchKey = clickedSwatch || hoveredSwatch;
    if ( activeSwatchKey ) {
      updateOverlayPos( activeSwatchKey );
    }
  } );

  $effect( () => {
    function handleOutsideClick( e: MouseEvent ) {
      const target = e.target as HTMLElement;
      if ( !target.closest( ".color-circle" ) && !target.closest( ".overlay" ) ) {
        closeClickedSwatch();
      }
    }

    if ( clickedSwatch ) {
      document.addEventListener( "click", handleOutsideClick );
    }

    return () => {
      document.removeEventListener( "click", handleOutsideClick );
    };
  } );
</script>

<section>
  {#each specification as role}
    <div class="card" id={role.id}>
      <div class="card-header">
        <h2>{role.name}</h2>
      </div>
      <div class="card-swatches">
        {#each role.swatches as swatch}
          {@const swatchKey = getSwatchKey( swatch.flavor, swatch.id )}
          {@const isHovered = hoveredSwatch === swatchKey || clickedSwatch === swatchKey}
          <button
            class="color-circle"
            class:hovering={isHovered}
            style="background-color: {swatch.color.hex};"
            aria-describedby="swatch-overlay-{swatchKey}"
            aria-label="Copy color format options for {swatch.flavor}"
            aria-pressed={isHovered}
            aria-expanded={isHovered}
            id="swatch-{swatchKey}"
            type="button"
            onclick={() => toggleSwatchClick(swatchKey)}
            onmouseenter={() => {
              if (hideTimer) clearTimeout(hideTimer);
              hoveredSwatch = swatchKey;
            }}
            onmouseleave={() => {
              if (swatchKey === hoveredSwatch) {
                clearWithDelay();
              }
            }}
            onkeydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleSwatchClick(swatchKey);
              }
            }}
          ></button>

          <div
            class="overlay"
            class:visible={isHovered}
            id="swatch-overlay-{swatchKey}"
            style="top: {getOverlayPos(swatchKey).top}px; left: {getOverlayPos(swatchKey).left}px;"
            role="region"
            aria-label="Color format options"
            onmouseenter={() => {
              if (hideTimer) clearTimeout(hideTimer);
              hoveredSwatch = swatchKey;
            }}
            onmouseleave={() => {
              if (swatchKey === hoveredSwatch) {
                clearWithDelay();
              }
            }}
          >
            <CopyToClipboardButton value={swatch.color.hex}>
              hex {swatch.color.hex}
            </CopyToClipboardButton>
            <CopyToClipboardButton value={toRgb(swatch.color.rgb)}>
              rgb {toRgb( swatch.color.rgb )}
            </CopyToClipboardButton>
            <CopyToClipboardButton value={toHsl(swatch.color.hsl)}>
              hsl {toHsl( swatch.color.hsl )}
            </CopyToClipboardButton>
            <CopyToClipboardButton value={toOklch(swatch.color.oklch)}>
              oklch {toOklch( swatch.color.oklch )}
            </CopyToClipboardButton>
          </div>
        {/each}
      </div>
    </div>
  {/each}
</section>

<style lang="scss">
  @use "@styles/utils";

  section {
    @include utils.grid(250px, var(--space-sm));
    height: auto;
    min-height: auto;
    width: 100%;
  }

  .card {
    border-radius: var(--border-radius-normal);
    background-color: var(--mantle);
    padding: var(--space-sm);

    .card-swatches {
      display: flex;
      gap: var(--space-xs);
      flex-wrap: wrap;
    }

    .color-circle {
      all: unset;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 4rem;
      width: 4rem;
      border: 2px solid hsla(from var(--overlay0) h s l / 20%);
      border-radius: 50%;
      cursor: pointer;
      position: relative;
      flex-shrink: 0;

      backface-visibility: hidden;
      -webkit-font-smoothing: antialiased;
      will-change: transform, box-shadow;
      contain: layout style paint;

      transition: transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94),
      box-shadow 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94);

      &:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }

      &:hover,
      &[aria-pressed="true"] {
        transform: scale(1.2) translateY(-8px);
        box-shadow: 0 12px 20px rgba(0, 0, 0, 0.25);
      }

      &:not(:hover):not([aria-pressed="true"]) {
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
    }
  }

  .overlay {
    background-color: var(--surface0);
    backdrop-filter: blur(5px);
    border: 2px solid var(--overlay0);
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    gap: calc(0.25 * var(--base-unit));
    padding: var(--space-xs);

    position: fixed;
    transform: translateX(-50%);
    max-width: calc(100vw - 16px);
    width: fit-content;
    pointer-events: none;
    z-index: 1000;

    opacity: 0;
    transition: opacity 0.2s ease-out;

    will-change: opacity;
    backface-visibility: hidden;
    -webkit-font-smoothing: antialiased;

    &.visible {
      opacity: 1;
      pointer-events: auto;
    }
  }
</style>
