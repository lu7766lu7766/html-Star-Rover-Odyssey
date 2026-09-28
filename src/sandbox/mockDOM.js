/**
 * Star Rover Odyssey - Mock DOM Implementation for Worker Sandbox
 * Provides restricted getElementById, innerText, style.color, and addEventListener
 */

export class MockElement {
  constructor(id, tag = 'div', initialText = '', initialColor = '#f87171', onMutation = null) {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this._innerText = initialText;
    this._onMutation = onMutation;
    this._listeners = {};

    const self = this;
    this.style = new Proxy({ color: initialColor }, {
      set(target, prop, value) {
        target[prop] = value;
        if (self._onMutation) {
          self._onMutation(self.serialize());
        }
        return true;
      }
    });
  }

  get innerText() {
    return this._innerText;
  }

  set innerText(val) {
    this._innerText = String(val);
    if (this._onMutation) {
      this._onMutation(this.serialize());
    }
  }

  addEventListener(event, callback) {
    if (typeof callback !== 'function') return;
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
    if (this._onMutation) {
      this._onMutation(this.serialize());
    }
  }

  dispatchEvent(event) {
    const type = typeof event === 'string' ? event : event?.type;
    const callbacks = this._listeners[type] || [];
    callbacks.forEach(cb => {
      try {
        cb({ type, target: this });
      } catch (err) {
        console.error('[MockDOM] Event handler error:', err);
      }
    });
  }

  serialize() {
    return {
      id: this.id,
      tagName: this.tagName,
      innerText: this._innerText,
      style: { ...this.style },
      hasListener: Object.keys(this._listeners).length > 0
    };
  }
}

export class MockDocument {
  constructor(onMutation = null) {
    this._onMutation = onMutation;
    this.elements = {};
    this.initDefaultElements();
  }

  initDefaultElements() {
    this.elements['status'] = new MockElement('status', 'div', '鎖定中', 'red', this._onMutation);
    this.elements['btn-unlock'] = new MockElement('btn-unlock', 'button', '解除安全鎖', '#00f2fe', this._onMutation);
  }

  getElementById(id) {
    if (!this.elements[id]) {
      // If student looks for an unseeded element, create dynamic stub
      this.elements[id] = new MockElement(id, 'div', '', '', this._onMutation);
    }
    return this.elements[id];
  }

  getSnapshot() {
    const res = {};
    for (const [id, el] of Object.entries(this.elements)) {
      res[id] = el.serialize();
    }
    return res;
  }
}
