<template>
  <div class="code-editor-container">
    <div class="editor-header">
      <div class="editor-title">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
        <span class="title-text">solution.js</span>
      </div>
      <div class="editor-actions">
        <button class="btn btn-sm" @click="$emit('reset')" title="復原至本關預設程式碼">
          重設代碼
        </button>
      </div>
    </div>
    <div class="editor-viewport" ref="editorParent"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { bracketMatching, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { createLevelCompletions } from './editorConfig.js';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  levelId: {
    type: Number,
    default: 1
  }
});

const emit = defineEmits(['update:modelValue', 'change', 'reset']);

const editorParent = ref(null);
let view = null;
const completionCompartment = new Compartment();

// Cyberpunk Dark Editor Theme customizations
const customEditorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    backgroundColor: '#0c101a',
    color: '#e2e8f0',
    fontFamily: 'var(--font-mono)'
  },
  '.cm-content': {
    caretColor: '#00f2fe',
    padding: '12px 0'
  },
  '.cm-gutters': {
    backgroundColor: '#090d16',
    color: '#475569',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)'
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#00f2fe'
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'rgba(0, 242, 254, 0.25)'
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    color: '#00f2fe'
  }
}, { dark: true });

onMounted(() => {
  if (!editorParent.value) return;

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
      bracketMatching(),
      closeBrackets(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      javascript(),
      oneDark,
      customEditorTheme,
      completionCompartment.of(createLevelCompletions(props.levelId)),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newDoc = update.state.doc.toString();
          emit('update:modelValue', newDoc);
          emit('change', newDoc);
        }
      })
    ]
  });

  view = new EditorView({
    state,
    parent: editorParent.value
  });
});

// Update editor text when modelValue changes externally
watch(() => props.modelValue, (newVal) => {
  if (view && newVal !== view.state.doc.toString()) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: newVal }
    });
  }
});

// Update autocompletions when level changes
watch(() => props.levelId, (newLevelId) => {
  if (view) {
    view.dispatch({
      effects: completionCompartment.reconfigure(createLevelCompletions(newLevelId))
    });
  }
});

onBeforeUnmount(() => {
  if (view) {
    view.destroy();
    view = null;
  }
});
</script>

<style scoped>
.code-editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: #090d16;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.85rem;
  background: #0b111e;
  border-bottom: 1px solid var(--border-subtle);
  user-select: none;
}

.editor-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot.red { background: #ef4444; }
.dot.yellow { background: #f59e0b; }
.dot.green { background: #10b981; }

.title-text {
  margin-left: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.editor-viewport {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

:deep(.cm-editor) {
  height: 100%;
}
</style>
