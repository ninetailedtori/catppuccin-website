<script lang="ts">
  import { type ColorFormat, flavors } from "@catppuccin/palette";
  import CopyToClipboardButton from "./CopyToClipboardButton.svelte";
  import { toHsl, toOklch, toRgb } from "../utils";
  import { tick } from "svelte";

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

  let overlayPos: OverlayPosition = $state( { top: 0, left: 0 } );
  let clickedSwatch = $state<string | null>( null );
  let hoveredSwatch = $state<string | null>( null );
  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  let activeSwatch = $derived( hoveredSwatch || clickedSwatch );

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

  function toggleSwatch( swatchKey: string ) {
    if ( clickedSwatch === swatchKey ) {
      clickedSwatch = null;
    } else {
      clickedSwatch = swatchKey;
    }
  }

  function closeClickedSwatch() {
    hoveredSwatch = null;
    setTimeout( () => {
      clickedSwatch = null;
    }, 300 );
  }

  async function updateOverlayPos( swatchKey: string ) {
    const button = document.getElementById( `swatch-${swatchKey}` );
    const overlay = document.getElementById( `singleton-overlay` );
    if ( !button || !overlay ) return;

    await tick();
    await new Promise( resolve => requestAnimationFrame( resolve ) );

    const rect = button.getBoundingClientRect();
    const overlayWidth = overlay.offsetWidth || 240;
    const padding = 8;
    let left = rect.left + rect.width / 2;
    const minLeft = overlayWidth / 2 + padding;
    const maxLeft = window.innerWidth - overlayWidth / 2 - padding;
    left = Math.max( minLeft, Math.min( maxLeft, left ) );

    overlayPos = {
      top: rect.bottom + 8,
      left: left
    };
  }

  $effect( () => {
    if ( activeSwatch ) {
      updateOverlayPos( activeSwatch );
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

  function getActiveColor() {
    if ( !activeSwatch ) return null;
    const [ flavor, colorId ] = activeSwatch.split( "-" );
    const flavorData = flavors[flavor as keyof typeof flavors];
    return ( flavorData.colors as Record<string, ColorFormat> )[colorId];
  }
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
          {@const isActive = activeSwatch === swatchKey}
          {@const isClicked = clickedSwatch === swatchKey}
          <button
            class="color-circle"
            class:hovering={isActive}
            style="background-color: {swatch.color.hex};"
            aria-label="Copy color format options for {swatch.flavor}"
            aria-pressed={isClicked}
            aria-expanded={isActive}
            id="swatch-{swatchKey}"
            type="button"
            onclick={() => toggleSwatch(swatchKey)}
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
                toggleSwatch(swatchKey);
              }
            }}
          ></button>
        {/each}
      </div>
    </div>
  {/each}
</section>

<div
  class="overlay"
  class:visible={!!activeSwatch}
  id="singleton-overlay"
  style="top: {overlayPos.top}px; left: {overlayPos.left}px;"
  role="region"
  aria-label="Color format options"
  aria-hidden={!activeSwatch}
  onmouseenter={() => {
    if (hideTimer) clearTimeout(hideTimer);
    hoveredSwatch = activeSwatch;
  }}
  onmouseleave={() => {
    if (!clickedSwatch) {
      clearWithDelay();
    } else if (hoveredSwatch) {
      clearWithDelay();
    }
  }}
>
  {#if activeSwatch}
    {@const color = getActiveColor()}
    {#if color}
      <CopyToClipboardButton value={color.hex}>
        hex {color.hex}
      </CopyToClipboardButton>
      <CopyToClipboardButton value={toRgb(color.rgb)}>
        rgb {toRgb( color.rgb )}
      </CopyToClipboardButton>
      <CopyToClipboardButton value={toHsl(color.hsl)}>
        hsl {toHsl( color.hsl )}
      </CopyToClipboardButton>
      <CopyToClipboardButton value={toOklch(color.oklch)}>
        oklch {toOklch( color.oklch )}
      </CopyToClipboardButton>
    {/if}
  {/if}
</div>

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
    position: fixed;
    pointer-events: none;
    z-index: 1000;

    opacity: 0;
    visibility: hidden;
    transform: translate3d(-50%, 0, 0) scale(0.9);
    transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);

    will-change: transform, opacity;
    backface-visibility: hidden;
    -webkit-font-smoothing: antialiased;

    &.visible {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;

      background-color: var(--surface0);
      border-radius: 6px;
      border: 2px solid var(--overlay0);
      display: flex;
      flex-direction: column;
      gap: calc(0.25 * var(--base-unit));
      padding: var(--space-xs);

      transform: translate3d(-50%, 0, 0) scale(1);
      max-width: calc(100vw - 16px);
      width: fit-content;
    }
  }
</style>
