import { NodeCategory, NodeDefinition } from './types';

// We start with a pre-built tree structure so the user sees options immediately
// STAGGERED / ORGANIC LAYOUT
export const INITIAL_NODES: NodeDefinition[] = [
  // ROOT (Fixed Left)
  {
    id: 'root-connector',
    label: 'Source Link',
    category: NodeCategory.INPUT,
    description: 'Source',
    x: 40,
    y: 350,
  },
  
  // BRANCH 1: TRANSFORMS (Top Area)
  {
    id: 'init-angle',
    label: 'Angle Change',
    category: NodeCategory.TRANSFORM,
    description: 'Perspective',
    x: 320,
    y: 120,
    parentId: 'root-connector'
  },
  {
    id: 'init-zoom',
    label: 'Zoom-In',
    category: NodeCategory.TRANSFORM,
    description: 'Close-up',
    x: 580,
    y: 60,
    parentId: 'init-angle'
  },
  {
    id: 'init-rotate',
    label: 'Rotate View',
    category: NodeCategory.TRANSFORM,
    description: 'Side view',
    x: 620,
    y: 180,
    parentId: 'init-angle'
  },

  // BRANCH 2: STYLES (Bottom Area)
  {
    id: 'init-creative',
    label: 'Creative Style',
    category: NodeCategory.STYLE,
    description: 'Artistic',
    x: 340,
    y: 520,
    parentId: 'root-connector'
  },
  {
    id: 'init-cartoon',
    label: 'Cartoon',
    category: NodeCategory.STYLE,
    description: 'Illustration',
    x: 610,
    y: 480,
    parentId: 'init-creative'
  },
  {
    id: 'init-3d',
    label: '3D Render',
    category: NodeCategory.RENDER,
    description: 'Isometric',
    x: 650,
    y: 600,
    parentId: 'init-creative'
  },

  // BRANCH 3: TECH (Middle Area)
  {
    id: 'init-tech',
    label: 'Blueprint',
    category: NodeCategory.RENDER,
    description: 'Technical',
    x: 360,
    y: 320,
    parentId: 'root-connector'
  },
  {
    id: 'init-part',
    label: 'Part Extract',
    category: NodeCategory.TRANSFORM,
    description: 'Engine Block',
    x: 640,
    y: 300,
    parentId: 'init-tech'
  },

  // CUSTOM NODE (Floating below)
  {
    id: 'init-custom',
    label: 'Custom',
    category: NodeCategory.CUSTOM,
    description: 'Custom Prompt',
    customPrompt: '',
    x: 380,
    y: 680,
    parentId: 'root-connector'
  }
];

export const NODE_TEMPLATES = [
  { id: 'custom', label: 'Custom', category: NodeCategory.CUSTOM, desc: 'Write Prompt' },
  { id: 'angle', label: 'Angle Change', category: NodeCategory.TRANSFORM, desc: 'Perspective' },
  { id: 'zoom', label: 'Zoom-In', category: NodeCategory.TRANSFORM, desc: 'Details' },
  { id: 'part', label: 'Part Extract', category: NodeCategory.TRANSFORM, desc: 'Isolate' },
  { id: 'rotate', label: 'Rotate View', category: NodeCategory.TRANSFORM, desc: 'Side/Rear' },
  { id: 'creative', label: 'Creative Style', category: NodeCategory.STYLE, desc: 'Artistic' },
  { id: 'technical', label: 'Blueprint', category: NodeCategory.RENDER, desc: 'Schematic' },
  { id: '3d', label: '3D Render', category: NodeCategory.RENDER, desc: 'Isometric' },
  { id: 'cartoon', label: 'Cartoon', category: NodeCategory.STYLE, desc: 'Illustration' },
];