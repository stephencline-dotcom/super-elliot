// Tiny DOM helpers shared by the screens.
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function announce(message) {
  const live = document.getElementById('live');
  if (!live) return;
  live.textContent = '';
  setTimeout(() => { live.textContent = message; }, 30);
}

export function focusSoon(el) {
  setTimeout(() => el?.focus(), 0);
}

// Resolves true when confirmed, false when cancelled.
export function confirmDialog({ title, message, confirmLabel, cancelLabel = 'Cancel' }) {
  return new Promise((resolve) => {
    const dlg = h('dialog', { class: 'dialog', 'aria-labelledby': 'dlg-title' },
      h('h2', { id: 'dlg-title' }, title),
      h('div', { class: 'dialog-body' }, message),
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', onClick: () => dlg.close('cancel') }, cancelLabel),
        h('button', { class: 'btn primary', type: 'button', onClick: () => dlg.close('ok') }, confirmLabel)));
    dlg.addEventListener('close', () => { resolve(dlg.returnValue === 'ok'); dlg.remove(); });
    document.body.append(dlg);
    dlg.showModal();
  });
}

export function infoDialog({ title, message }) {
  return confirmDialog({ title, message, confirmLabel: 'OK', cancelLabel: 'Close' });
}

// Native replaceChildren converts null to visible text. Omit optional content first.
export function replaceContent(root, ...children) {
  root.replaceChildren(...children.flat(Infinity).filter(c => c != null && c !== false));
}
