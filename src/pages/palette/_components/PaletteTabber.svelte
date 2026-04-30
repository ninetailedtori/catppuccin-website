<script lang="ts">
  import PaletteSwatches from "./PaletteSwatches.svelte";
  import PaletteIngredients from "./PaletteIngredients.svelte";
  import { tick } from "svelte";
  import { Spring } from "svelte/motion";

  interface Tab {
    id: string;
    label: string;
    ariaLabel?: string;
  }

  export interface Props {
    tabs: Tab[];
    defaultTab?: string;
  }

  let { tabs, defaultTab = tabs[0]?.id }: Props = $props();

  const panels: Record<string, any> = {
    swatches: PaletteSwatches,
    ingredients: PaletteIngredients
  };

  let activeTab = $state(
    typeof window !== "undefined" && window.location.hash
      ? window.location.hash.slice( 1 )
      : defaultTab
  );
  let focusedTab = $state( 0 );
  let previousTab = $state<string | null>( null );
  let section: HTMLElement | null = $state( null );
  let sectionHeight = $state<string>( "auto" );
  let tabsContainer: HTMLElement | null = $state( null );
  let resizeObserver: ResizeObserver | null = null;
  let isDragging = $state( false );
  let dragStartPosition = $state( 0 );
  let dragCurrentPosition = $state( 0 );
  const SWIPE_THRESHOLD = 50;
  let isPillDragging = $state( false );
  let pillDragStartX = $state( 0 );
  let pillDragOffset = $state( 0 );

  function getPanelTranslateX( tab: string ): number {
    const active = getTab( activeTab );
    const panel = getTab( tab );
    const offset = panel - active;
    return offset * 100;
  }

  function getClientX( e: TouchEvent | MouseEvent ): number {
    if ( e instanceof TouchEvent ) {
      return e.touches[0]?.clientX || 0;
    }
    return ( e as MouseEvent ).clientX;
  }

  function getTab( tab: string ): number {
    return tabs.findIndex( ( t ) => t.id === tab );
  }

  function setupResizeObserver() {
    if ( !section ) return;
    if ( resizeObserver ) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    const activePanel = section.querySelector(
      `[data-panel-id="${activeTab}"]`
    ) as HTMLElement | null;

    if ( !activePanel ) return;

    resizeObserver = new ResizeObserver( () => {
      const innerSection = activePanel.querySelector( "section" );
      if ( !innerSection ) return;
      const height = innerSection.scrollHeight + 40;
      sectionHeight = `${height}px`;
    } );

    const innerSection = activePanel.querySelector( "section" ) as HTMLElement;
    if ( innerSection ) {
      resizeObserver.observe( innerSection );
    }
  }

  $effect( () => {
    activeTab;
    setupResizeObserver();
    updatePill();
  } );

  function preDrag( e: TouchEvent | MouseEvent ) {
    if ( isPillDragging ) return;
    isDragging = true;
    dragStartPosition = getClientX( e );
    dragCurrentPosition = 0;
  }

  function drag( e: TouchEvent | MouseEvent ) {
    if ( !isDragging || isPillDragging ) return;

    const currentPosition = getClientX( e );
    const dragDistance = currentPosition - dragStartPosition;
    const current = getTab( activeTab );

    if ( ( current === 0 && dragDistance > 0 ) ||
      ( current === tabs.length - 1 && dragDistance < 0 ) ) {
      dragCurrentPosition = dragDistance * 0.3;
      return;
    }

    dragCurrentPosition = dragDistance;
  }

  function postDrag( e: TouchEvent | MouseEvent ) {
    if ( !isDragging ) return;

    isDragging = false;
    const dragDistance = getClientX( e ) - dragStartPosition;
    const i = getTab( activeTab );

    if ( ( i === 0 && dragDistance > 0 ) ||
      ( i === tabs.length - 1 && dragDistance < 0 ) ) {
      dragCurrentPosition = 0;
      return;
    }

    let i1 = i;

    if ( Math.abs( dragDistance ) > SWIPE_THRESHOLD ) {
      if ( dragDistance > 0 ) {
        i1 = i > 0 ? i - 1 : i;
      } else {
        i1 = i < tabs.length - 1 ? i + 1 : i;
      }

      previousTab = activeTab;
      activeTab = tabs[i1].id;
      focusedTab = i1;
      window.location.hash = activeTab;

      setTimeout( () => {
        previousTab = null;
        dragCurrentPosition = 0;
        ( document.getElementById( `tab-${tabs[i1].id}` ) as HTMLButtonElement )?.focus();
      }, 300 );
    } else {
      dragCurrentPosition = 0;
    }
  }

  function pillPreMove( e: TouchEvent | MouseEvent ) {
    console.log( "HI!" );
    e.stopPropagation();
    isPillDragging = true;
    pillDragStartX = getClientX( e );
    pillDragOffset = 0;

    document.addEventListener( "mousemove", pillMove );
    document.addEventListener( "mouseup", pillPostMove );
    document.addEventListener( "touchmove", pillMove, { passive: false } );
    document.addEventListener( "touchend", pillPostMove );
  }

  function pillMove( e: TouchEvent | MouseEvent ) {
    const currentX = getClientX( e );
    const dragDistance = currentX - pillDragStartX;

    if ( !isPillDragging ) {
      return;
    }

    const current = getTab( activeTab );
    if ( ( current === 0 && dragDistance < 0 ) ||
      ( current === tabs.length - 1 && dragDistance > 0 ) ) {
      return;
    }

    pillDragOffset = dragDistance;

  }

  function pillPostMove( e: TouchEvent | MouseEvent ) {
    if ( !isPillDragging ) {
      return;
    }

    isPillDragging = false;
    const currentX = getClientX( e );
    const dragDistance = currentX - pillDragStartX;

    if ( Math.abs( dragDistance ) < 5 ) {
      const tabsRect = tabsContainer!.getBoundingClientRect();
      const tapX = currentX - tabsRect.left;
      const tabButtons = Array.from( tabsContainer!.querySelectorAll( ".tab" ) ) as HTMLElement[];
      for ( const tabBtn of tabButtons ) {
        const btnRect = tabBtn.getBoundingClientRect();
        const btnLeft = btnRect.left - tabsRect.left;
        const btnRight = btnLeft + btnRect.width;
        if ( tapX >= btnLeft && tapX < btnRight ) {
          const tab = tabBtn.id.replace( "tab-", "" );
          handleTabClick( tab );
          pillDragOffset = 0;
          updatePill();
          return;
        }
      }
      pillDragOffset = 0;
      updatePill();

      document.removeEventListener( "mousemove", pillMove );
      document.removeEventListener( "mouseup", pillPostMove );
      document.removeEventListener( "touchmove", pillMove );
      document.removeEventListener( "touchend", pillPostMove );

      return;
    }

    const i = getTab( activeTab );
    if ( ( i === 0 && dragDistance < 0 ) ||
      ( i === tabs.length - 1 && dragDistance > 0 ) ) {
      pillDragOffset = 0;
      updatePill();
      return;
    }

    let i1 = i;

    if ( Math.abs( dragDistance ) > 30 ) {
      if ( dragDistance < 0 ) {
        i1 = i > 0 ? i - 1 : i;
      } else {
        i1 = i < tabs.length - 1 ? i + 1 : i;
      }

      previousTab = activeTab;
      activeTab = tabs[i1].id;
      focusedTab = i1;
      window.location.hash = activeTab;

      setTimeout( () => {
        previousTab = null;
        ( document.getElementById( `tab-${tabs[i1].id}` ) as HTMLButtonElement )?.focus();
      }, 300 );
    }

    pillDragOffset = 0;
    updatePill();
  }

  function handleTabClick( tab: string ): void {
    activeTab = tab;
    focusedTab = getTab( tab );
    window.location.hash = tab;
  }

  function handleKeyDown( event: KeyboardEvent, tab: string ): void {
    const i = getTab( tab );
    let i1 = i;

    switch (event.key) {
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        i1 = i === 0 ? tabs.length - 1 : i - 1;
        break;
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        i1 = i === tabs.length - 1 ? 0 : i + 1;
        break;
      case "Home":
        event.preventDefault();
        i1 = 0;
        break;
      case "End":
        event.preventDefault();
        i1 = tabs.length - 1;
        break;
      default:
        return;
    }

    activeTab = tabs[i1].id;
    focusedTab = i1;
    window.location.hash = activeTab;

    setTimeout( () => {
      ( document.getElementById( `tab-${tabs[i1].id}` ) as HTMLButtonElement )?.focus();
    }, 0 );
  }

  let pillX = new Spring( 0, { stiffness: 0.4, damping: 0.7 } );
  let pillW = new Spring( 111, { stiffness: 0.4, damping: 0.7 } );

  async function updatePill() {
    await tick();

    if ( !tabsContainer ) return;

    const activeTab = tabsContainer.querySelector(
      ".tab.is-active"
    ) as HTMLElement | null;

    if ( !activeTab ) return;

    const padding = parseFloat(
      window.getComputedStyle( tabsContainer ).paddingLeft
    );
    const offsetX = activeTab.offsetLeft - padding;
    const width = activeTab.offsetWidth;

    await pillX.set( offsetX );
    await pillW.set( width );
  }

  let hydrated = $state( false );

  $effect.pre( () => {
    activeTab;
    hydrated = true;
  } );
</script>

<div class="PaletteTabber">
  <header class="tab-header">
    <div bind:this={tabsContainer} class="tabs" role="tablist">
      {#each tabs as tab, index (tab.id)}
        <button
          class="tab"
          class:is-active={hydrated && activeTab === tab.id}
          class:is-focused={focusedTab === index}
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={activeTab === tab.id}
          aria-label={tab.ariaLabel || tab.label}
          aria-controls={`panel-${tab.id}`}
          type="button"
          onkeydown={(e) => handleKeyDown(e, tab.id)}
          onclick={() => handleTabClick(tab.id)}>
          <span class="tab-text">{tab.label}</span>
        </button>
      {/each}

      <div
        class="pill"
        style="transform: translateX({pillX.current + (isPillDragging ? pillDragOffset : 0)}px); width: {pillW.current}px;"
        onmousedown={(e) => {
      e.stopPropagation();
      pillPreMove(e);
    }}
        ontouchstart={(e) => {
      e.stopPropagation();
      pillPreMove(e);
    }}>
      </div>
    </div>
  </header>
  <div
    bind:this={section}
    class="tab-section"
    style="height: {sectionHeight};"
    onmousedown={(e) => {
      if (e.button === 0) preDrag(e);
    }}
    onmouseup={postDrag}
    onmouseleave={postDrag}
    onmousemove={drag}
    ontouchstart={preDrag}
    ontouchend={postDrag}
    ontouchcancel={postDrag}
    ontouchmove={drag}>
    {#each tabs as tab}
      <div
        class="tab-panel"
        role="tabpanel"
        id={`panel-${tab.id}`}
        data-panel-id={tab.id}
        aria-labelledby={`tab-${tab.id}`}
        style="transform: translateX(calc({getPanelTranslateX(tab.id)}% + {activeTab === tab.id ? dragCurrentPosition : 0}px)); opacity: {activeTab === tab.id || previousTab === tab.id ? 1 : 0}; pointer-events: {activeTab === tab.id ? 'auto' : 'none'};"
      >
        <section>
          <svelte:component this={panels[tab.id]} />
        </section>
      </div>
    {/each}
  </div>
</div>

<style lang="scss">
  @use "@styles/utils";

  .tab-header {
    margin-bottom: var(--space-lg);
  }

  .tabs {
    @include utils.flex(row, var(--space-xs));
    background-color: var(--mantle);
    padding: var(--space-xxs);
    border-radius: var(--border-radius-normal);
    width: fit-content;
    position: relative;
    height: fit-content;
  }

  .pill {
    position: absolute;
    inset: var(--space-xxs);
    height: calc(100% - calc(var(--space-xxs) * 2));
    background-color: var(--mauve);
    border-radius: var(--border-radius-normal);
    transition: transform 200ms ease, width 200ms ease;
    pointer-events: auto;
    z-index: 2;
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }

  .tab {
    position: relative;
    padding: 0.625rem var(--space-sm);
    color: var(--text);
    background-color: transparent;
    border: none;
    cursor: pointer;
    border-radius: var(--border-radius-small);
    transition: color 200ms ease;
    font: inherit;
    pointer-events: auto;

    &:hover .tab-text {
      color: var(--mauve);
    }

    &.is-active .tab-text {
      color: var(--base) !important;
    }

    &:focus-visible {
      outline: none;
    }
  }

  .tab-text {
    position: relative;
    z-index: 3;
    pointer-events: none;
    display: block;
    user-select: none;
  }

  .tab-section {
    position: relative;
    width: 100%;
    overflow: hidden;
    height: auto;

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }

  .tab-panel {
    position: absolute;
    inset: 0;
    width: 100%;
    transition: transform 300ms ease, opacity 300ms ease;

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }
</style>
