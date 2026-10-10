"""Genuine Home entry for native scripts, separate from read-only scene readiness.

Call once after a real game navigation/reload, never between scene gestures.
A blocked entry fails the test; there is no state injection or retry. A first launch plays the intro, which a
player skips with its real Skip button; skip_intro does exactly that, and nothing when no intro is playing.
"""

READY = '''() => {
    const app = document.querySelector('#app'), ui = document.querySelector('#ui');
    const intro = window.dollhouse?.intro?.();
    return app?.dataset.screen === 'play' && ui && !ui.hidden && !ui.inert && !(intro && intro.active);
}'''


def skip_intro(page):
    """Tap the intro's own Skip control if the first-launch intro is playing, then wait for play."""
    page.wait_for_function('document.querySelector("#app")?.dataset.screen === "play"', timeout=60000)
    if page.locator('.intro-layer:not([hidden]) .intro-skip').count():
        page.locator('.intro-layer .intro-skip').click(timeout=60000)
    page.wait_for_function(READY, timeout=60000)


def enter_game(page):
    page.wait_for_function('window.dollhouse && !document.querySelector("#loading")',
                           timeout=60000)
    page.locator('#home [data-home-action="play"]').click(timeout=60000)
    skip_intro(page)
