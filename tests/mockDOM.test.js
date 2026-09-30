import { describe, it, expect, vi } from 'vitest';
import { MockDocument, MockElement } from '../src/sandbox/mockDOM.js';

describe('Mock DOM in Worker Sandbox', () => {
  it('creates elements with initial state', () => {
    const doc = new MockDocument();
    const status = doc.getElementById('status');
    const btn = doc.getElementById('btn-unlock');

    expect(status.innerText).toBe('鎖定中');
    expect(status.style.color).toBe('red');
    expect(btn.innerText).toBe('解除安全鎖');
  });

  it('updates innerText and style.color reactively', () => {
    const onMutation = vi.fn();
    const doc = new MockDocument(onMutation);
    const status = doc.getElementById('status');

    status.innerText = '已解鎖';
    status.style.color = 'green';

    expect(status.innerText).toBe('已解鎖');
    expect(status.style.color).toBe('green');
    expect(onMutation).toHaveBeenCalled();
  });

  it('registers and dispatches event listeners correctly', () => {
    const doc = new MockDocument();
    const btn = doc.getElementById('btn-unlock');
    const status = doc.getElementById('status');

    let clicked = false;
    btn.addEventListener('click', () => {
      clicked = true;
      status.innerText = '已解除鎖定';
      status.style.color = 'green';
    });

    btn.dispatchEvent('click');

    expect(clicked).toBe(true);
    expect(status.innerText).toBe('已解除鎖定');
    expect(status.style.color).toBe('green');
  });

  it('supports classList and querySelector with listener introspection', () => {
    const doc = new MockDocument();
    const door = doc.getElementById('airlock-door');
    door.classList.add('open');
    expect(door.classList.contains('open')).toBe(true);
    door.classList.remove('open');
    expect(door.classList.contains('open')).toBe(false);

    const viaQuery = doc.querySelector('#btn-unlock');
    expect(viaQuery.innerText).toBe('解除安全鎖');
    expect(doc.querySelector('.nope')).toBe(null);

    viaQuery.addEventListener('click', () => {});
    viaQuery.addEventListener('mouseover', () => {});
    const snap = doc.getSnapshot();
    expect(snap['btn-unlock'].listenerTypes).toContain('click');
    expect(snap['btn-unlock'].listenerTypes).toContain('mouseover');
    expect(snap['airlock-door'].classes).toEqual([]);
  });
});
