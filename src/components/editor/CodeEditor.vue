<template>
  <div class="code-editor-container">
    <!-- Flight Computer Tab Header -->
    <div class="editor-header">
      <div class="header-left">
        <div class="file-tab">
          <FileCode :size="14" class="icon-file" />
          <span class="file-name">solution.js</span>
          <span class="status-indicator" title="程式碼已即時自動快取">
            <span class="beacon-dot success"></span>
          </span>
        </div>
      </div>

      <div class="header-right">
        <div class="shortcut-tip">
          <Terminal :size="12" />
          <span>⌘↵ 執行指令</span>
        </div>
        <button class="btn btn-sm btn-reset" @click="$emit('reset')" title="復原至本關預設程式碼">
          <RotateCcw :size="12" />
          <span>重設代碼</span>
        </button>
      </div>
    </div>

    <!-- CodeMirror Viewport Container -->
    <div class="editor-viewport" ref="editorParent"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { FileCode, RotateCcw, Terminal } from 'lucide-vue-next';
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

// Tactical Deep Space Flight Computer CodeMirror Theme
const customEditorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '13.5px',
    backgroundColor: '#070a13',
    color: '#e2e8f0',
    fontFamily: 'var(--font-mono)'
  },
  '.cm-content': {
    caretColor: '#00e5ff',
    padding: '10px 0',
    lineHeight: '1.6'
  },
  '.cm-gutters': {
    backgroundColor: '#05080f',
    color: '#475569',
    borderRight: '1px solid rgba(255, 255, 255, 0.06)',
    paddingLeft: '4px'
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#00e5ff',
    borderLeftWidth: '2px',
    boxShadow: '0 0 8px rgba(0, 229, 255, 0.8)'
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'rgba(0, 229, 255, 0.22)'
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.025)'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    color: '#00e5ff',
    fontWeight: '700'
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
  background: #070a13;
  overflow: hidden;
  position: relative;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.75rem;
  background: #090e1a;
  border-bottom: 1px solid var(--border-subtle);
  height: 38px;
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  height: 100%;
}

.file-tab {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0 0.75rem;
  height: 100%;
  background: #070a13;
  border-right: 1px solid var(--border-subtle);
  border-bottom: 2px solid var(--cyan-primary);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 600;
  color: #f1f5f9;
}

.icon-file {
  color: var(--cyan-primary);
}

.status-indicator {
  display: flex;
  align-items: center;
  margin-left: 0.2rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.shortcut-tip {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text-muted);
}

.btn-reset {
  padding: 0.22rem 0.55rem;
  font-size: 0.74rem;
  background: rgba(255, 255, 255, 0.04);
  border-color: var(--border-subtle);
  color: var(--text-secondary);
}

.btn-reset:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
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
