"""Read-only synchronization for physical input against the rendered house.

A completed reduced-motion camera flight does not mean the DOM has been measured:
the selection ribbon or a dismissed story response can still change the next
frame's camera insets. Never choose a gesture destination from that old pose.
"""


def scene_ready(page):
    page.wait_for_function('window.dollhouse && !document.querySelector("#loading")',
                           timeout=60000)
    page.wait_for_function('''() => new Promise(resolve => {
        let previous = null, stableFrames = 0;
        function observe() {
            const game = window.dollhouse, visual = game.visual();
            // Include both the measured HUD and its projected scene. Rounding
            // discards floating-point camera normalization, not visible motion.
            const signature = visual.cameraMoving ? null : JSON.stringify({
                viewport: [innerWidth, innerHeight],
                room: visual.focusedRoom, selected: visual.selectedObject,
                presentation: visual.presentation,
                work: [visual.teaActive, visual.stitchActive, visual.chimeActive],
                points: game.objects().map(p => [p.key, +p.x.toFixed(2), +p.y.toFixed(2)])
            });
            stableFrames = signature !== null && signature === previous ? stableFrames + 1 : 0;
            previous = signature;
            // Three agreeing rendered-frame observations include a deferred
            // MutationObserver/ResizeObserver measurement and its render.
            if (stableFrames >= 2) resolve(true);
            else requestAnimationFrame(observe);
        }
        requestAnimationFrame(observe);
    })''', timeout=60000)
