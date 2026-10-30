/**
 * Middle-click close — Web page half.
 *
 * The Harness Web UI has no middle-click gesture of its own: a session in the
 * sidebar's session tree and a tab in the sidebar's pane strip both close
 * through their own control, and the middle mouse button does nothing. This
 * half adds the gesture users expect from every other tabbed app — middle
 * click closes — to both:
 *
 * - **Sessions.** The Harness never deletes a session (it archives them), so
 *   "close" here is the archive action the row already offers. This half
 *   triggers the row's OWN archive control, so the running-work confirmation
 *   dialog and the undo notice stay exactly as the Harness renders them.
 * - **Sidebar tabs.** The pane strip's own close control is triggered, so the
 *   Harness keeps its rule that a lone guide tab cannot be closed, and the
 *   tab's own lifecycle (its resources, its split-pane state) runs unchanged.
 *
 * The gesture is a press-and-release on the same element, matching the
 * release-position semantics of VS Code and Chrome tabs: pressing on a row and
 * releasing elsewhere cancels the close.
 *
 * The two switches live on this plugin's own Settings tab, registered into the
 * `settings.section` slot: closing a session and closing a sidebar tab are
 * separate preferences, and neither belongs in the General page. The tab is
 * mounted only while it is selected, so nothing here runs until a user opens
 * it; the gesture is installed with the page and does not depend on the tab.
 *
 * The preference keys are the ones the plugin used inside the
 * `@altamkp/dsh-plugin` collection, so updating from that collection keeps the
 * switches where the user left them.
 */

window.__ModuleLoader__.load({
  id: '@altamkp/dsh-middle-click',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** The locale namespace this plugin owns. */
    const NS = '@altamkp/dsh-middle-click';
    /** This browser's switches — never the app's own preferences. */
    const SESSIONS_KEY = 'dsh.plugin.middleClickClose.sessions';
    const TABS_KEY = 'dsh.plugin.middleClickClose.tabs';
    /** Where this plugin's Settings tab sits in the Settings navigation. */
    const SECTION_ID = 'middle-click-close';
    const SECTION_ORDER = 100;
    /**
     * The dictionary the session row's own controls are labelled with. The
     * Workspace package owns it; this half only reads the archive label so it
     * can find the row's archive control by its accessible name.
     */
    const WORKSPACE_NS = 'workspace';

    /** Every string this plugin renders or registers. */
    const DICT = {
      en: {
        'nav': 'Middle-click close',
        'title': 'Middle-click close',
        'intro': 'Close a session or a sidebar tab with the middle mouse button, the way every other tabbed app does.',
        'sessions.title': 'Middle-click closes sessions',
        'sessions.desc': 'A session row in the sidebar closes when you middle-click it. The Harness archives the session, and the notice can undo it.',
        'tabs.title': 'Middle-click closes sidebar tabs',
        'tabs.desc': "A tab in the sidebar's pane strip closes when you middle-click it.",
        'note.title': 'How the gesture works',
        'note.press': 'Press and release on the same row or tab. Pressing one and releasing on another cancels the close, so a middle drag is never a close.',
        'note.archive': 'Sessions are never deleted: middle-click archives them through the row\u2019s own archive action, so running work still asks first and the notice can undo it.',
        'note.tab': 'A tab the Harness cannot close (a lone guide tab) draws no close control, so middle-clicking it does nothing.',
        'note.storage': 'Both switches are remembered in this browser.',
      },
      zh: {
        'nav': '中键关闭',
        'title': '中键关闭',
        'intro': '用鼠标中键关闭会话或侧边栏标签页，就像其他带标签页的应用一样。',
        'sessions.title': '中键关闭会话',
        'sessions.desc': '在侧边栏中键点击会话即可关闭。Harness 会将会话归档，通知里可以撤销。',
        'tabs.title': '中键关闭侧边栏标签页',
        'tabs.desc': '在侧边栏的标签页条中键点击标签页即可关闭。',
        'note.title': '手势说明',
        'note.press': '在同一行或同一标签页上按下并松开。按下后移到别处松开则取消关闭，因此中键拖动永远不会误关。',
        'note.archive': '会话不会被删除：中键会通过会话行自身的归档操作归档它，有任务在运行时仍会先询问，通知里也可以撤销。',
        'note.tab': 'Harness 不允许关闭的标签页（例如唯一的指南页）没有关闭按钮，中键点击它不会有任何反应。',
        'note.storage': '两个开关都记在当前浏览器里。',
      },
    };

    /**
     * The tab's own stylesheet, installed once per page.
     *
     * The settings shell draws the panel, the navigation and the scrolling
     * column; a section owns only its content, so every rule here is scoped to
     * this plugin's prefix and only uses theme tokens, which makes the tab
     * follow the light and dark themes without a second rule set.
     */
    const CSS = [
      '.akp-mcc{display:flex;flex-direction:column;gap:12px;max-width:760px;color:var(--dsw-alias-label-primary)}',
      '.akp-mcc-heading{margin:0;font-size:18px;font-weight:600;line-height:26px}',
      '.akp-mcc-intro{margin:0;font-size:13px;line-height:20px;color:var(--dsw-alias-label-tertiary)}',
      '.akp-mcc-card{display:flex;flex-direction:column;overflow:hidden;border:.5px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-1)}',
      '.akp-mcc-row{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:16px;border-bottom:.5px solid var(--dsw-alias-border-l2)}',
      '.akp-mcc-row:last-child{border-bottom:none}',
      '.akp-mcc-rowText{display:flex;flex-direction:column;gap:4px;min-width:0}',
      '.akp-mcc-rowTitle{font-size:14px;font-weight:500;line-height:20px}',
      '.akp-mcc-rowDesc{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}',
      '.akp-mcc-switch{position:relative;flex:none;box-sizing:border-box;width:36px;height:20px;margin:0;padding:2px;border:0;border-radius:999px;background:var(--dsw-alias-border-l3);cursor:pointer;transition:background .12s ease}',
      '.akp-mcc-switch[aria-checked="true"]{background:var(--dsw-alias-brand-primary)}',
      '.akp-mcc-switch:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}',
      '.akp-mcc-thumb{display:block;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-switch-thumb);transition:transform .12s ease,background .12s ease}',
      '.akp-mcc-switch[aria-checked="true"] .akp-mcc-thumb{background:var(--dsw-alias-label-primary-foreground);transform:translateX(16px)}',
      '.akp-mcc-note{display:flex;flex-direction:column;gap:8px;padding:14px 16px;border:.5px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-1)}',
      '.akp-mcc-noteTitle{margin:0;font-size:13px;font-weight:600;line-height:20px}',
      '.akp-mcc-noteList{display:flex;flex-direction:column;gap:6px;margin:0;padding:0 0 0 18px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}',
      '.akp-mcc-footnote{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}',
    ].join('\n');

    /** One preference: on unless it was explicitly turned off. */
    function readFlag(key) {
      try {
        return localStorage.getItem(key) !== '0';
      } catch {
        return true;
      }
    }

    /** Store one preference. */
    function writeFlag(key, value) {
      try {
        localStorage.setItem(key, value ? '1' : '0');
      } catch {
        /* storage unavailable; the gesture still honours this page's value */
      }
    }

    /** A CSS attribute selector for an accessible name. */
    function byLabel(label) {
      return `button[aria-label="${String(label).replace(/["\\]/g, '\\$&')}"]`;
    }

    /**
     * Close one session row through the row's own archive control.
     *
     * The Harness refuses to archive a session that still has running work, and
     * asks first. Triggering the row's own button keeps that dialog, the undo
     * notice and the stop-and-archive flow exactly as the Harness renders them,
     * instead of re-implementing them here.
     */
    function closeSession(row, ctx) {
      const translate = ctx.locale.bind(WORKSPACE_NS);
      const archive = row.querySelector(byLabel(translate('menu.archiveSession')));
      if (archive) {
        archive.click();
        return;
      }
      // An archived row offers "unarchive" instead of "archive": there is
      // nothing to close, so the gesture does nothing.
      if (row.querySelector(byLabel(translate('menu.unarchiveSession')))) {
        return;
      }
      // The Harness changed the row's controls: fall back to the workspace
      // service, which is the same call the row's own button makes.
      const workspaces = ctx.get('uiWorkspace');
      const sessionId = (row.dataset.rowKey || '').slice('session:'.length);
      if (!workspaces || !sessionId) {
        return;
      }
      workspaces.archiveSession(sessionId).catch((error) => {
        console.error('[dsh-middle-click] the session could not be archived:', error);
      });
    }

    /**
     * The close action for one pressed element, or null when nothing under it
     * closes.
     *
     * The targets are the Harness's own stable DOM markers: a pane strip's tab
     * chip (`data-dockkit-tab`), a floating pane's header grip
     * (`data-dockkit-float-grip`), and a session row in the sidebar's tree
     * (`data-row-key="session:…"`).
     */
    function resolveClose(target, ctx) {
      if (!(target instanceof Element)) {
        return null;
      }

      // A tab chip in the sidebar's pane strip.
      //
      // The chip is found by ITS OWN marker only. The Harness also marks the
      // tab's title (`data-sidebar-right-tab`), and that title sits INSIDE the
      // chip — so a selector that accepts both markers stops at the title,
      // which owns no close control, and the gesture silently does nothing.
      // The chip is an ancestor of the title, so walking up for the chip alone
      // finds it from the title, from the tab's icon and from the close button
      // alike.
      const chip = target.closest('[data-dockkit-tab]');
      if (chip) {
        if (!readFlag(TABS_KEY)) {
          return null;
        }
        const close = chip.querySelector('[data-dockkit-tab-close]');
        // A tab the Harness does not allow closing (a lone guide tab) draws no
        // close control, and then the gesture does nothing either.
        if (!close) {
          return null;
        }
        return { element: chip, action: () => close.click() };
      }

      // A floating pane's own header: its title is not a tab chip, and the
      // pane's body must not close the pane.
      const grip = target.closest('[data-dockkit-float-grip]');
      if (grip) {
        if (!readFlag(TABS_KEY)) {
          return null;
        }
        const close = grip.querySelector('[data-dockkit-float-close]')
          ?? grip.closest('[data-dockkit-float]')?.querySelector('[data-dockkit-float-close]')
          ?? null;
        if (!close) {
          return null;
        }
        return { element: grip, action: () => close.click() };
      }

      // A session row in the sidebar's session tree.
      const row = target.closest('[data-row-key^="session:"]');
      if (row) {
        if (!readFlag(SESSIONS_KEY)) {
          return null;
        }
        return { element: row, action: () => closeSession(row, ctx) };
      }

      return null;
    }

    /**
     * The element the cursor is over when the button is released.
     *
     * The release position decides whether the close happens, and the event
     * target cannot answer that: the Harness's own tab chip captures the
     * pointer while it is pressed, so the release event is delivered to the
     * chip even when the cursor has travelled elsewhere. A middle drag from a
     * tab onto another tab is a move, not a close, and the element under the
     * cursor is what tells the two apart.
     */
    function releaseElement(event) {
      if (typeof document.elementFromPoint === 'function') {
        const under = document.elementFromPoint(event.clientX, event.clientY);
        if (under) {
          return under;
        }
      }
      return event.target;
    }

    /**
     * Listen for the middle-button gesture.
     *
     * The press records the element and the action it resolves to; the close
     * settles on the first middle release over that same element. Releasing
     * anywhere else cancels it, and the browser's own middle-click behaviour
     * (autoscroll, opening a link in a new tab) is left alone everywhere this
     * plugin does not act.
     */
    function installGesture(ctx) {
      let pressed = null;

      const onMouseDown = (event) => {
        if (event.button !== 1) {
          return;
        }
        pressed = null;
        const resolved = resolveClose(event.target, ctx);
        if (!resolved) {
          return;
        }
        // Disarm the browser's middle-click autoscroll on the element this
        // plugin owns. Its indicator is inert here and only adds noise.
        event.preventDefault();
        pressed = resolved;
      };

      const onMouseUp = (event) => {
        if (event.button !== 1) {
          return;
        }
        const current = pressed;
        pressed = null;
        if (!current) {
          return;
        }
        if (!current.element.isConnected) {
          return;
        }
        const released = releaseElement(event);
        if (!(released instanceof Node) || !current.element.contains(released)) {
          return;
        }
        event.preventDefault();
        current.action();
      };

      // A window that loses the focus mid-press never delivers the release.
      const onBlur = () => {
        pressed = null;
      };

      window.addEventListener('mousedown', onMouseDown, true);
      window.addEventListener('mouseup', onMouseUp, true);
      window.addEventListener('blur', onBlur, true);
      return () => {
        window.removeEventListener('mousedown', onMouseDown, true);
        window.removeEventListener('mouseup', onMouseUp, true);
        window.removeEventListener('blur', onBlur, true);
      };
    }

    /** Install the tab's stylesheet once; later section mounts reuse it. */
    function installStyles() {
      const id = 'akp-mcc-styles';
      if (document.getElementById(id)) {
        return () => {};
      }
      const style = document.createElement('style');
      style.id = id;
      style.textContent = CSS;
      document.head.appendChild(style);
      return () => {
        style.remove();
      };
    }

    /** One on/off control; `aria-checked` carries the state, not a class. */
    function Switch(props) {
      return h('button', {
        type: 'button',
        role: 'switch',
        className: 'akp-mcc-switch',
        'aria-checked': props.checked ? 'true' : 'false',
        'aria-label': props.label,
        onClick: () => {
          props.onChange(!props.checked);
        },
      }, h('span', { className: 'akp-mcc-thumb', 'aria-hidden': 'true' }));
    }

    /** One preference row: a title, a description and one switch. */
    function SwitchRow(props) {
      return h('div', { className: 'akp-mcc-row' },
        h('div', { className: 'akp-mcc-rowText' },
          h('div', { className: 'akp-mcc-rowTitle' }, props.title),
          h('div', { className: 'akp-mcc-rowDesc' }, props.desc),
        ),
        h(Switch, { checked: props.checked, label: props.title, onChange: props.onChange }),
      );
    }

    /**
     * The plugin's Settings tab.
     *
     * The renderer binds `t` from the registration's locale namespace, so the
     * page follows the app's language without any subscription of its own.
     * Each switch writes its preference straight through, because the gesture
     * reads the same `localStorage` keys on every event.
     */
    function MiddleClickSection(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => key;
      const [sessionsOn, setSessionsOn] = React.useState(() => readFlag(SESSIONS_KEY));
      const [tabsOn, setTabsOn] = React.useState(() => readFlag(TABS_KEY));

      const changeSessions = (value) => {
        writeFlag(SESSIONS_KEY, value);
        setSessionsOn(value);
      };
      const changeTabs = (value) => {
        writeFlag(TABS_KEY, value);
        setTabsOn(value);
      };

      return h('div', { className: 'akp-mcc' },
        h('h2', { className: 'akp-mcc-heading' }, t('title')),
        h('p', { className: 'akp-mcc-intro' }, t('intro')),
        h('div', { className: 'akp-mcc-card', role: 'group', 'aria-label': t('title') },
          h(SwitchRow, {
            title: t('sessions.title'),
            desc: t('sessions.desc'),
            checked: sessionsOn,
            onChange: changeSessions,
          }),
          h(SwitchRow, {
            title: t('tabs.title'),
            desc: t('tabs.desc'),
            checked: tabsOn,
            onChange: changeTabs,
          }),
        ),
        h('section', { className: 'akp-mcc-note', 'aria-label': t('note.title') },
          h('h3', { className: 'akp-mcc-noteTitle' }, t('note.title')),
          h('ul', { className: 'akp-mcc-noteList' },
            h('li', { key: 'press' }, t('note.press')),
            h('li', { key: 'archive' }, t('note.archive')),
            h('li', { key: 'tab' }, t('note.tab')),
          ),
        ),
        h('p', { className: 'akp-mcc-footnote' }, t('note.storage')),
      );
    }

    return {
      // The two services this plugin uses: 'slots' backs the Settings tab and
      // 'locale' backs its dictionaries. Declaring them keeps this fiber
      // pending until the page provides them, instead of failing on the first
      // registration.
      inject: ['slots', 'locale'],
      apply(ctx) {
        // A throw inside one of these effects fails the fiber, and the web boot
        // audit then refuses to start the whole UI — so each step degrades on
        // its own instead of taking the whole page down with it.
        ctx.effect(() => {
          try {
            return installStyles();
          } catch (error) {
            console.error('[dsh-middle-click] the stylesheet was not installed:', error);
            return () => {};
          }
        }, 'middle-click-close: styles');

        ctx.effect(() => {
          try {
            return ctx.locale.register(NS, { en: DICT.en, zh: DICT.zh });
          } catch (error) {
            console.error('[dsh-middle-click] the dictionary was not registered:', error);
            return () => {};
          }
        }, 'middle-click-close: dictionaries');

        const t = ctx.locale.bind(NS);
        ctx.effect(() => {
          try {
            return ctx.slots.inject('settings.section', () => ctx.slots.register({
              name: 'settings.section',
              id: SECTION_ID,
              order: SECTION_ORDER,
              // The shell resolves this thunk on every render and re-reads the
              // rows on every locale change, so the nav label follows the
              // language without this plugin subscribing to anything.
              label: () => t('nav'),
              locale: NS,
            }, MiddleClickSection));
          } catch (error) {
            console.error('[dsh-middle-click] the settings tab could not be registered:', error);
            return () => {};
          }
        }, 'middle-click-close: settings tab');

        ctx.effect(() => {
          try {
            return installGesture(ctx);
          } catch (error) {
            console.error('[dsh-middle-click] the gesture was not installed:', error);
            return () => {};
          }
        }, 'middle-click-close: gesture');
      },
    };
  },
});
