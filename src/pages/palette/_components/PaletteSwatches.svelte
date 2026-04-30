<script lang="ts">
  import { type ColorFormat, flavors } from "@catppuccin/palette";
  import CopyToClipboardButton from "./CopyToClipboardButton.svelte";
  import { toHsl, toOklch, toRgb } from "../utils";
  import { fade } from "svelte/transition";

  const mochaColors = flavors.mocha.colors as Record<string, ColorFormat>;

  const specification = Object.entries( mochaColors ).map( ( [ colorName, color ] ) => ( {
    id: `card-${colorName}`,
    name: color.name,
    swatches: Object.entries( flavors ).map( ( [ swatchFlavor, swatch ] ) => ( {
      flavor: swatchFlavor,
      color: ( swatch.colors as Record<string, ColorFormat> )[colorName],
      id: colorName,
      key: `${swatchFlavor}-${colorName}`
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
  let prefersReducedMotion = $state( false );

  let activeSwatch = $derived( hoveredSwatch || clickedSwatch );

  let activeColor = $derived.by( () => {
    if ( !activeSwatch ) return null;
    const [ flavor, colorId ] = activeSwatch.split( "-" );
    return ( flavors[flavor as keyof typeof flavors].colors as Record<string, ColorFormat> )[colorId];
  } );

  $effect.root( () => {
    const mediaQuery = window.matchMedia( "(prefers-reduced-motion: reduce)" );

    prefersReducedMotion = mediaQuery.matches;

    const handleChange = ( e: MediaQueryListEvent ) => {
      prefersReducedMotion = e.matches;
    };

    mediaQuery.addEventListener( "change", handleChange );
    return () => mediaQuery.removeEventListener( "change", handleChange );
  } );

  function scheduleHoverClear( delayMs = 50 ) {
    if ( hideTimer ) clearTimeout( hideTimer );
    hideTimer = setTimeout( () => {
      hoveredSwatch = null;
      hideTimer = null;
    }, delayMs );
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
    clickedSwatch = null;
  }

  async function updateOverlayPos( swatchKey: string ) {
    const button = document.getElementById( `swatch-${swatchKey}` );
    const overlay = document.getElementById( "singleton-overlay" );

    if ( !button || !overlay ) return;

    await new Promise( resolve => requestAnimationFrame( resolve ) );

    const rect = button.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    const overlayWidth = overlayRect.width;
    const overlayHeight = overlayRect.height;
    const padding = parseInt( getComputedStyle( document.documentElement ).getPropertyValue( "--space-sm" ) );

    let left = rect.left + rect.width / 2;
    left = Math.max( overlayWidth / 2 + padding, Math.min( window.innerWidth - overlayWidth / 2 - padding, left ) );

    let top = rect.bottom + parseInt( getComputedStyle( document.documentElement ).getPropertyValue( "--space-xs" ) );
    if ( top + overlayHeight > window.innerHeight - padding ) {
      top = rect.top - overlayHeight - parseInt( getComputedStyle( document.documentElement ).getPropertyValue( "--space-xs" ) );
    }
    top = Math.max( padding, top );

    overlayPos = { top, left };
  }

  $effect( () => {
    if ( activeSwatch ) {
      updateOverlayPos( activeSwatch );

      const handleScroll = () => updateOverlayPos( activeSwatch );
      const handleResize = () => updateOverlayPos( activeSwatch );

      window.addEventListener( "scroll", handleScroll, true );
      window.addEventListener( "resize", handleResize );

      return () => {
        window.removeEventListener( "scroll", handleScroll, true );
        window.removeEventListener( "resize", handleResize );
      };
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

  function handleOverlayMouseEnter() {
    if ( hideTimer ) clearTimeout( hideTimer );
    hoveredSwatch = activeSwatch;
  }

  function handleOverlayMouseLeave() {
    if ( !clickedSwatch ) {
      scheduleHoverClear();
    } else if ( hoveredSwatch ) {
      scheduleHoverClear();
    }
  }
</script>

<section>
  {#each specification as role}
    <div class="card" id={role.id}>
      <div class="card-header">
        <h2>{role.name}</h2>
      </div>
      <div class="card-swatches">
        {#each role.swatches as swatch (swatch.key)}
          {@const isActive = activeSwatch === swatch.key}
          {@const isClicked = clickedSwatch === swatch.key}
          <button
            class="color-circle"
            class:hovering={isActive}
            style="background-color: {swatch.color.hex};"
            aria-label="Copy color format options for {swatch.flavor}"
            aria-pressed={isClicked}
            aria-expanded={isActive}
            id="swatch-{swatch.key}"
            type="button"
            onclick={() => toggleSwatch(swatch.key)}
            onpointerover={() => {
              if (hideTimer) clearTimeout(hideTimer);
              hoveredSwatch = swatch.key;
            }}
            onpointerout={() => {
              if (swatch.key === hoveredSwatch) {
                scheduleHoverClear();
              }
            }}
            onfocus={() => {
              if (hideTimer) clearTimeout(hideTimer);
              hoveredSwatch = swatch.key;
            }}
            onblur={() => {
              if (swatch.key === hoveredSwatch) {
                scheduleHoverClear();
              }
            }}
            onkeydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleSwatch(swatch.key);
              }
            }}
          ></button>
        {/each}
      </div>
    </div>
  {/each}
</section>

{#if activeSwatch && activeColor}
  {@const flavorName = activeSwatch.split( "-" )[0]}
  <div
    class="overlay"
    id="singleton-overlay"
    style="top: {overlayPos.top}px; left: {overlayPos.left}px;"
    role="region"
    aria-label="Color format options"
    inert={!activeSwatch}
    transition:fade={{ duration: prefersReducedMotion ? 0 : 300 }}
    onpointerenter={handleOverlayMouseEnter}
    onpointerleave={handleOverlayMouseLeave}
  >
    <div class="overlay-header">
      <span class="flavor-label">{flavorName}</span>
    </div>
    <CopyToClipboardButton value={activeColor.hex}>
      hex {activeColor.hex}
    </CopyToClipboardButton>
    <CopyToClipboardButton value={toRgb(activeColor.rgb)}>
      rgb {toRgb( activeColor.rgb )}
    </CopyToClipboardButton>
    <CopyToClipboardButton value={toHsl(activeColor.hsl)}>
      hsl {toHsl( activeColor.hsl )}
    </CopyToClipboardButton>
    <CopyToClipboardButton value={toOklch(activeColor.oklch)}>
      oklch {toOklch( activeColor.oklch )}
    </CopyToClipboardButton>
  </div>
{/if}

<style lang="scss">
  @use "@styles/utils";

  :root {
    --color-circle-size: 4rem;
    --overlay-padding: var(--space-xs);
    --overlay-max-width: calc(100vw - var(--space-lg));
  }

  section {
    @include utils.grid(250px, var(--space-sm));
  }

  .card {
    border-radius: var(--border-radius-normal);
    background-color: var(--mantle);
    @include utils.containerPadding(sm);

    .card-header {
      h2 {
        margin-block: 0 var(--space-xs);
      }
    }

    .card-swatches {
      @include utils.flex(row, var(--space-xs));
    }

    .color-circle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: var(--color-circle-size);
      width: var(--color-circle-size);
      border: 2px solid hsla(from var(--overlay0) h s l / 20%);
      border-radius: 50%;
      cursor: pointer;
      position: relative;
      flex-shrink: 0;

      /* Selective button resets */
      background-color: transparent;
      padding: 0;
      margin: 0;
      font: inherit;
      color: inherit;

      contain: layout style paint;

      transition: transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94),
      box-shadow 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94);

      /* Base box-shadow state */
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      &:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }

      &:hover,
      &[aria-pressed="true"] {
        transform: scale(1.2) translateY(-8px);
        box-shadow: 0 12px 20px rgba(0, 0, 0, 0.25);
      }
    }
  }

  .overlay-header {
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: capitalize;
    color: var(--subtext0);
    letter-spacing: 0.05em;
    padding-bottom: var(--space-xxs);
    border-bottom: 1px solid var(--overlay0);
    margin-bottom: var(--space-xxs);
  }

  .overlay {
    position: fixed;
    z-index: 1000;

    background-color: var(--surface0);
    border-radius: var(--border-radius-large);
    border: 2px solid var(--overlay0);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--overlay-padding);
    max-width: var(--overlay-max-width);
    width: fit-content;

    transform: translate(-50%, 0);
  }
</style>
